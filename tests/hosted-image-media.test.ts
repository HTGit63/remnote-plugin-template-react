import { describe, expect, test } from 'vitest';
import {
  createHostedImageFileLoader,
  type HostedImageFileLoader,
} from '../server/src/media/hosted-image-loader';
import * as hostedMediaModule from '../server/src/media/hosted-image-loader';
import { persistHostedImageAsset } from '../server/src/media/hosted-image-service';
import { serveHostedImageAsset } from '../server/src/server/create-http-server';
import * as httpServerModule from '../server/src/server/create-http-server';
import {
  downloadSafeRemoteBytes,
  isPublicRemoteAddress,
} from '../server/src/security/safe-remote-download';
import { MemoryStorageProvider } from '../server/src/storage/memory-store';
import { PostgresStorageProvider } from '../server/src/storage/postgres-store';
import type { AuthenticatedPrincipal } from '../server/src/auth/types';
import type { ServerResponse } from 'node:http';

const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d,
]);

const hostedPrincipal: AuthenticatedPrincipal = {
  subject: 'chatgpt:test-user',
  userId: 'test-user',
  authMode: 'hosted_oauth',
  scopeGrants: ['bridge:read', 'bridge:write', 'bridge:trusted_write'],
  accessScope: 'current-rem-tree',
  trustedWriteMode: 'trusted-inside-scope',
};

class PersistentTestStorage extends MemoryStorageProvider {
  hostedMediaStorageDurability() {
    return 'persistent' as const;
  }
}

function imageReference() {
  return {
    download_url: 'https://files.openai.example.test/generated-image?signature=temporary-secret',
    file_id: 'file_image_1',
    mime_type: 'image/png',
    file_name: 'diagram.png',
  };
}

describe('ChatGPT hosted image ingestion', () => {
  test('serves a hosted media byte range for native player playback', async () => {
    const serve = (httpServerModule as Record<string, unknown>).serveHostedMediaAsset;
    expect(serve).toBeTypeOf('function');
    if (typeof serve !== 'function') return;

    const storage = new PersistentTestStorage();
    await storage.createHostedMediaAsset({
      assetId: '00000000-0000-4000-8000-000000000001',
      ownerId: 'test-user',
      idempotencyKey: 'range-audio-1',
      sourceFileId: 'file_audio_range',
      sha256: '0'.repeat(64),
      contentType: 'audio/mpeg',
      fileName: 'lesson.mp3',
      bytes: Buffer.from('0123456789'),
      createdAt: new Date(0).toISOString(),
    });
    const served: { status?: number; headers?: Record<string, string>; body?: Buffer } = {};
    const response = {
      writeHead(status: number, headers: Record<string, string>) {
        served.status = status;
        served.headers = headers;
        return this;
      },
      end(body?: Buffer | string) {
        served.body = body === undefined ? Buffer.alloc(0) : Buffer.from(body);
        return this;
      },
    } as unknown as ServerResponse;

    await serve(
      storage,
      '00000000-0000-4000-8000-000000000001',
      'GET',
      response,
      'bytes=2-5'
    );

    expect(served.status).toBe(206);
    expect(served.headers?.['accept-ranges']).toBe('bytes');
    expect(served.headers?.['content-range']).toBe('bytes 2-5/10');
    expect(served.headers?.['content-length']).toBe('4');
    expect(served.body).toEqual(Buffer.from('2345'));
  });

  test('rejects invalid or multiple hosted media byte ranges', async () => {
    const serve = (httpServerModule as Record<string, unknown>).serveHostedMediaAsset;
    expect(serve).toBeTypeOf('function');
    if (typeof serve !== 'function') return;

    const storage = new PersistentTestStorage();
    await storage.createHostedMediaAsset({
      assetId: '00000000-0000-4000-8000-000000000002',
      ownerId: 'test-user',
      idempotencyKey: 'invalid-range-audio-1',
      sourceFileId: 'file_audio_invalid_range',
      sha256: '0'.repeat(64),
      contentType: 'audio/mpeg',
      fileName: 'lesson.mp3',
      bytes: Buffer.from('0123456789'),
      createdAt: new Date(0).toISOString(),
    });
    const served: { status?: number; headers?: Record<string, string>; body?: Buffer } = {};
    const response = {
      writeHead(status: number, headers: Record<string, string>) {
        served.status = status;
        served.headers = headers;
        return this;
      },
      end(body?: Buffer | string) {
        served.body = body === undefined ? Buffer.alloc(0) : Buffer.from(body);
        return this;
      },
    } as unknown as ServerResponse;

    await serve(
      storage,
      '00000000-0000-4000-8000-000000000002',
      'GET',
      response,
      'bytes=0-1,4-5'
    );

    expect(served.status).toBe(416);
    expect(served.headers?.['content-range']).toBe('bytes */10');
    expect(served.headers?.['content-length']).toBe('0');
    expect(served.body).toEqual(Buffer.alloc(0));
  });

  test('detects uploaded MP3 bytes through the hosted-media loader interface', async () => {
    const factory = (hostedMediaModule as Record<string, unknown>).createHostedMediaFileLoader;
    expect(factory).toBeTypeOf('function');
    if (typeof factory !== 'function') return;

    const loader = factory({
      downloadRemoteBytes: async () => Buffer.concat([
        Buffer.from('ID3\u0004\u0000\u0000\u0000\u0000\u0000\u0000'),
        Buffer.from([0xff, 0xfb, 0x90, 0x64]),
      ]),
    });
    const loaded = await loader('audio', {
      download_url: 'https://files.openai.example.test/audio',
      file_id: 'file_audio_1',
      mime_type: 'application/octet-stream',
      file_name: 'lesson.mp3',
    }, {
      principal: hostedPrincipal,
      policy: { maxBytes: 1024, remoteTimeoutMs: 1000 },
    });

    expect(loaded).toMatchObject({
      mediaKind: 'audio',
      contentType: 'audio/mpeg',
      fileName: 'lesson.mp3',
      fileId: 'file_audio_1',
    });
  });

  test('rejects an ID3-only payload that contains no MPEG Layer III frame', async () => {
    const loader = hostedMediaModule.createHostedMediaFileLoader({
      downloadRemoteBytes: async () => Buffer.from('ID3\u0004\u0000\u0000\u0000\u0000\u0000\u0000'),
    });

    await expect(loader('audio', {
      download_url: 'https://files.openai.example.test/not-really-audio',
      file_id: 'file_fake_audio_1',
      file_name: 'fake.mp3',
    }, {
      principal: hostedPrincipal,
      policy: { maxBytes: 1024, remoteTimeoutMs: 1000 },
    })).rejects.toMatchObject({ code: 'HOSTED_MEDIA_UNSUPPORTED_FORMAT' });
  });

  test('detects uploaded MP4 container bytes through the hosted-media loader interface', async () => {
    const factory = (hostedMediaModule as Record<string, unknown>).createHostedMediaFileLoader;
    expect(factory).toBeTypeOf('function');
    if (typeof factory !== 'function') return;

    const loader = factory({
      downloadRemoteBytes: async () => Buffer.from([
        0x00, 0x00, 0x00, 0x18,
        0x66, 0x74, 0x79, 0x70,
        0x69, 0x73, 0x6f, 0x6d,
        0x00, 0x00, 0x02, 0x00,
        0x69, 0x73, 0x6f, 0x6d,
        0x6d, 0x70, 0x34, 0x32,
      ]),
    });
    const loaded = await loader('video', {
      download_url: 'https://files.openai.example.test/video',
      file_id: 'file_video_1',
      mime_type: 'application/octet-stream',
      file_name: 'lesson.mp4',
    }, {
      principal: hostedPrincipal,
      policy: { maxBytes: 1024, remoteTimeoutMs: 1000 },
    });

    expect(loaded).toMatchObject({
      mediaKind: 'video',
      contentType: 'video/mp4',
      fileName: 'lesson.mp4',
      fileId: 'file_video_1',
    });
  });

  test('rejects a non-video ISO-BMFF brand presented as MP4', async () => {
    const loader = hostedMediaModule.createHostedMediaFileLoader({
      downloadRemoteBytes: async () => Buffer.from([
        0x00, 0x00, 0x00, 0x18,
        0x66, 0x74, 0x79, 0x70,
        0x68, 0x65, 0x69, 0x63,
        0x00, 0x00, 0x00, 0x00,
        0x68, 0x65, 0x69, 0x63,
        0x6d, 0x69, 0x66, 0x31,
      ]),
    });

    await expect(loader('video', {
      download_url: 'https://files.openai.example.test/not-an-mp4-video',
      file_id: 'file_heic_1',
      file_name: 'photo.mp4',
    }, {
      principal: hostedPrincipal,
      policy: { maxBytes: 1024, remoteTimeoutMs: 1000 },
    })).rejects.toMatchObject({ code: 'HOSTED_MEDIA_UNSUPPORTED_FORMAT' });
  });

  test('reports invalid uploaded audio/video references through the generic media error family', async () => {
    const loader = hostedMediaModule.createHostedMediaFileLoader({
      downloadRemoteBytes: async () => Buffer.alloc(0),
    });

    await expect(loader('audio', {
      download_url: '',
      file_id: '',
    }, {
      principal: hostedPrincipal,
      policy: { maxBytes: 1024, remoteTimeoutMs: 1000 },
    })).rejects.toMatchObject({ code: 'HOSTED_MEDIA_INVALID_REFERENCE' });
  });

  test('blocks private, mapped, and NAT64 remote targets before image ingestion', async () => {
    expect(isPublicRemoteAddress('127.0.0.1', 4)).toBe(false);
    expect(isPublicRemoteAddress('10.1.2.3', 4)).toBe(false);
    expect(isPublicRemoteAddress('::ffff:127.0.0.1', 6)).toBe(false);
    expect(isPublicRemoteAddress('64:ff9b::7f00:1', 6)).toBe(false);
    expect(isPublicRemoteAddress('2606:4700:4700::1111', 6)).toBe(true);
    await expect(downloadSafeRemoteBytes('http://public.example.test/image.png', {
      maxBytes: 1024,
      timeoutMs: 1000,
      accept: 'image/png',
    })).rejects.toMatchObject({ code: 'REMOTE_HOST_BLOCKED' });
  });

  test('downloads an official file reference and trusts image bytes, not the claimed MIME alone', async () => {
    const downloads: string[] = [];
    const loader = createHostedImageFileLoader({
      downloadRemoteBytes: async (url) => {
        downloads.push(url);
        return PNG_BYTES;
      },
    });

    const loaded = await loader(imageReference(), {
      principal: hostedPrincipal,
      policy: { maxBytes: 1024, remoteTimeoutMs: 1000 },
    });

    expect(downloads).toEqual([imageReference().download_url]);
    expect(loaded).toEqual({
      bytes: PNG_BYTES,
      contentType: 'image/png',
      fileName: 'diagram.png',
      fileId: 'file_image_1',
    });
    expect(JSON.stringify(loaded)).not.toContain('temporary-secret');

    const fakeImageLoader = createHostedImageFileLoader({
      downloadRemoteBytes: async () => Buffer.from('<html>not an image</html>'),
    });
    await expect(fakeImageLoader(imageReference(), {
      principal: hostedPrincipal,
      policy: { maxBytes: 1024, remoteTimeoutMs: 1000 },
    })).rejects.toMatchObject({ code: 'HOSTED_IMAGE_UNSUPPORTED_FORMAT' });
  });

  test('creates one durable opaque asset and rejects changed bytes under the same idempotency key', async () => {
    const storage = new PersistentTestStorage();
    const first = await persistHostedImageAsset({
      storage,
      ownerId: 'test-user',
      idempotencyKey: 'hosted-image-1',
      publicBaseUrl: 'https://bridge.example.test',
      file: {
        bytes: PNG_BYTES,
        contentType: 'image/png',
        fileName: 'diagram.png',
        fileId: 'file_image_1',
      },
    });
    const replay = await persistHostedImageAsset({
      storage,
      ownerId: 'test-user',
      idempotencyKey: 'hosted-image-1',
      publicBaseUrl: 'https://bridge.example.test',
      file: {
        bytes: PNG_BYTES,
        contentType: 'image/png',
        fileName: 'diagram.png',
        fileId: 'file_image_1',
      },
    });

    expect(first.status).toBe('hosted');
    expect(replay.status).toBe('already_hosted');
    expect(replay.url).toBe(first.url);
    expect(first.url).toMatch(/^https:\/\/bridge\.example\.test\/media\/images\/[0-9a-f-]+$/);
    expect(await storage.getHostedMediaAsset(first.asset.assetId)).toMatchObject({
      ownerId: 'test-user',
      contentType: 'image/png',
      fileName: 'diagram.png',
      bytes: PNG_BYTES,
    });

    await expect(persistHostedImageAsset({
      storage,
      ownerId: 'test-user',
      idempotencyKey: 'hosted-image-1',
      publicBaseUrl: 'https://bridge.example.test',
      file: {
        bytes: Buffer.concat([PNG_BYTES, Buffer.from([0x01])]),
        contentType: 'image/png',
        fileName: 'changed.png',
        fileId: 'file_image_2',
      },
    })).rejects.toMatchObject({ code: 'HOSTED_MEDIA_IDEMPOTENCY_CONFLICT' });

    await expect(persistHostedImageAsset({
      storage,
      ownerId: 'test-user',
      idempotencyKey: 'hosted-image-1',
      publicBaseUrl: 'https://bridge.example.test',
      file: {
        bytes: PNG_BYTES,
        contentType: 'image/png',
        fileName: 'same-bytes-different-file.png',
        fileId: 'file_image_2',
      },
    })).rejects.toMatchObject({ code: 'HOSTED_MEDIA_IDEMPOTENCY_CONFLICT' });
  });

  test('deletes hosted bytes only for the authenticated owner and clears idempotency reuse', async () => {
    const storage = new PersistentTestStorage();
    const hosted = await persistHostedImageAsset({
      storage,
      ownerId: 'test-user',
      idempotencyKey: 'delete-image-1',
      publicBaseUrl: 'https://bridge.example.test',
      file: {
        bytes: PNG_BYTES,
        contentType: 'image/png',
        fileName: 'delete-me.png',
        fileId: 'file_delete_1',
      },
    });

    expect(await storage.deleteHostedMediaAsset(hosted.asset.assetId, 'another-user')).toBe(false);
    expect(await storage.getHostedMediaAsset(hosted.asset.assetId)).not.toBeNull();
    expect(await storage.deleteHostedMediaAsset(hosted.asset.assetId, 'test-user')).toBe(true);
    expect(await storage.getHostedMediaAsset(hosted.asset.assetId)).toBeNull();
    expect(await storage.getHostedMediaAssetByIdempotency('test-user', 'delete-image-1')).toBeNull();
  });

  test('parameterizes PostgreSQL hosted-image deletion by asset and owner', async () => {
    const calls: Array<{ sql: string; values: unknown[] }> = [];
    const storage = new PostgresStorageProvider('postgresql://example.invalid/bridge');
    (storage as unknown as { pool: { query: (sql: string, values: unknown[]) => Promise<unknown> } }).pool = {
      query: async (sql, values) => {
        calls.push({ sql, values });
        return { rows: [{ asset_id: values[0] }] };
      },
    };

    await expect(storage.deleteHostedMediaAsset(
      '00000000-0000-4000-8000-000000000001',
      'test-user'
    )).resolves.toBe(true);
    expect(calls).toEqual([{
      sql: expect.stringContaining('WHERE asset_id = $1 AND owner_id = $2'),
      values: ['00000000-0000-4000-8000-000000000001', 'test-user'],
    }]);
  });

  test('serves exact image bytes publicly with cross-origin immutable headers', async () => {
    const storage = new PersistentTestStorage();
    const hosted = await persistHostedImageAsset({
      storage,
      ownerId: 'test-user',
      idempotencyKey: 'route-image-1',
      publicBaseUrl: 'https://bridge.example.test',
      file: {
        bytes: PNG_BYTES,
        contentType: 'image/png',
        fileName: 'diagram.png',
        fileId: 'file_image_route',
      },
    });
    const served: { status?: number; headers?: Record<string, string>; body?: Buffer } = {};
    const response = {
      writeHead(status: number, headers: Record<string, string>) {
        served.status = status;
        served.headers = headers;
        return this;
      },
      end(body?: Buffer | string) {
        served.body = body === undefined ? Buffer.alloc(0) : Buffer.from(body);
        return this;
      },
    } as unknown as ServerResponse;

    await serveHostedImageAsset(storage, hosted.asset.assetId, 'GET', response);
    expect(served.status).toBe(200);
    expect(served.headers?.['content-type']).toBe('image/png');
    expect(served.headers?.['cache-control']).toContain('immutable');
    expect(served.headers?.['cross-origin-resource-policy']).toBe('cross-origin');
    expect(served.body).toEqual(PNG_BYTES);

    served.status = undefined;
    served.headers = undefined;
    served.body = undefined;
    await serveHostedImageAsset(
      storage,
      '00000000-0000-4000-8000-000000000000',
      'GET',
      response
    );
    expect(served.status).toBe(404);
  });

  test('does not allow non-hosted or unauthenticated callers to ingest a ChatGPT file', async () => {
    const loader: HostedImageFileLoader = createHostedImageFileLoader({
      downloadRemoteBytes: async () => PNG_BYTES,
    });
    await expect(loader(imageReference(), {
      principal: {
        subject: 'local',
        authMode: 'local_no_token',
        scopeGrants: ['bridge:read'],
      },
      policy: { maxBytes: 1024, remoteTimeoutMs: 1000 },
    })).rejects.toMatchObject({ code: 'HOSTED_IMAGE_AUTH_REQUIRED' });
  });
});
