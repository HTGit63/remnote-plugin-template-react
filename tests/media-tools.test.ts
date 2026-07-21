import { beforeEach, describe, expect, test } from 'vitest';
import { registerMediaTools } from '../server/src/tools/register-media-tools';
import {
  CHATGPT_MEDIA_FILE_REFERENCE_SCHEMA,
  INSERT_AUDIO_FROM_FILE_INPUT_SCHEMA,
  INSERT_AUDIO_FROM_URL_INPUT_SCHEMA,
  INSERT_IMAGE_FROM_FILE_INPUT_SCHEMA,
  INSERT_IMAGE_FROM_URL_INPUT_SCHEMA,
  INSERT_VIDEO_FROM_FILE_INPUT_SCHEMA,
  INSERT_VIDEO_FROM_URL_INPUT_SCHEMA,
} from '../server/src/tools/schemas';
import type { McpToolResult, ToolRegistrationContext } from '../server/src/tools/tool-context';
import type { BridgeResponse, BridgeToolArgs, BridgeToolName } from '../shared/bridge/protocol';
import { normalizeArgs } from '../src/bridge/handlers/args';
import { getStaticScopeTargetIds } from '../src/bridge/handlers/scope';
import { getPermissionDecision } from '../src/remnote/permissions';
import { detectRemnoteSdkCapabilities } from '../src/remnote/sdkCapabilities';
import { TOOL_PERMISSIONS, validateMcpToolPermission } from '../server/src/tool-permissions';
import { getAllPublicMcpToolNames, getPublicMcpToolNames } from '../server/src/tool-registry';
import { getToolMetadata } from '../server/src/tool-policy';
import { FakePlugin } from './helpers/fakeRemnote';
import { insertImageFromUrl, MEDIA_RESULT_CACHE } from '../src/remnote/write';
import { handleBridgeRequest } from '../src/bridge/handlers';
import { MemoryStorageProvider } from '../server/src/storage/memory-store';

type Handler = (args: any) => Promise<McpToolResult>;

class PersistentTestStorage extends MemoryStorageProvider {
  hostedMediaStorageDurability() {
    return 'persistent' as const;
  }
}

function success(id: string, result: Record<string, unknown>): BridgeResponse {
  return { id, ok: true, result } as BridgeResponse;
}

function mediaRegistrationHarness(options: {
  pluginResponse?: BridgeResponse;
  hostedImageError?: Error;
} = {}) {
  const handlers: Record<string, Handler> = {};
  const configs: Record<string, Record<string, any>> = {};
  const calls: Array<{ tool: BridgeToolName; args: unknown }> = [];
  let hostedImageLoads = 0;
  const hostedMediaLoads: string[] = [];
  const hostedMediaMaxBytes: number[] = [];
  const storage = new PersistentTestStorage();
  const callPlugin = async <TTool extends BridgeToolName>(
    tool: TTool,
    args: BridgeToolArgs[TTool]
  ): Promise<BridgeResponse> => {
    calls.push({ tool, args });
    if (options.pluginResponse) {
      return options.pluginResponse;
    }
    return success('media', {
      createdRemId: 'media-child',
      parentId: (args as any).parentId,
      mediaKind: tool.includes('image') ? 'image' : tool.includes('audio') ? 'audio' : 'video',
      url: (args as any).url,
      position: (args as any).position,
      insertIndex: 0,
      status: 'inserted',
      idempotencyKey: (args as any).idempotencyKey ?? 'generated',
    });
  };

  registerMediaTools({
    registerTool: ((name: string, config: Record<string, any>, handler: Handler) => {
      configs[name] = config;
      handlers[name] = handler;
      return undefined;
    }) as ToolRegistrationContext['registerTool'],
    callPlugin: callPlugin as ToolRegistrationContext['callPlugin'],
    currentRegistry: (() => ({})) as ToolRegistrationContext['currentRegistry'],
    exposeDeleteTool: false,
    hub: {} as ToolRegistrationContext['hub'],
    principal: {
      subject: 'chatgpt:test-user',
      userId: 'test-user',
      authMode: 'hosted_oauth',
      scopeGrants: ['bridge:read', 'bridge:write', 'bridge:trusted_write'],
      accessScope: 'current-rem-tree',
      trustedWriteMode: 'trusted-inside-scope',
    },
    storage,
    hostedMediaPolicy: {
      publicBaseUrl: 'https://bridge.example.test',
      maxImageBytes: 1024 * 1024,
      maxAudioBytes: 25 * 1024 * 1024,
      maxVideoBytes: 50 * 1024 * 1024,
      remoteTimeoutMs: 1000,
    },
    hostedImageLoader: async () => {
      if (options.hostedImageError) {
        throw options.hostedImageError;
      }
      hostedImageLoads += 1;
      return {
        bytes: Buffer.from([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
          0x00, 0x00, 0x00, 0x0d,
        ]),
        contentType: 'image/png',
        fileName: 'diagram.png',
        fileId: 'file_image_1',
      };
    },
    hostedMediaLoader: async (
      mediaKind: 'image' | 'audio' | 'video',
      reference: { file_id: string; file_name?: string },
      loaderOptions: { policy: { maxBytes: number } }
    ) => {
      hostedMediaLoads.push(mediaKind);
      hostedMediaMaxBytes.push(loaderOptions.policy.maxBytes);
      if (mediaKind === 'audio') {
        return {
          mediaKind,
          bytes: Buffer.from('ID3\u0004\u0000\u0000\u0000\u0000\u0000\u0000'),
          contentType: 'audio/mpeg' as const,
          fileName: reference.file_name ?? 'lesson.mp3',
          fileId: reference.file_id,
        };
      }
      if (mediaKind === 'video') {
        return {
          mediaKind,
          bytes: Buffer.from([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]),
          contentType: 'video/mp4' as const,
          fileName: reference.file_name ?? 'lesson.mp4',
          fileId: reference.file_id,
        };
      }
      throw new Error('Image path remains covered by hostedImageLoader compatibility test.');
    },
  } as ToolRegistrationContext);

  return {
    handlers,
    configs,
    calls,
    storage,
    hostedImageLoads: () => hostedImageLoads,
    hostedMediaLoads: () => hostedMediaLoads,
    hostedMediaMaxBytes: () => hostedMediaMaxBytes,
  };
}

describe('media MCP schemas and registration', () => {
  beforeEach(() => {
    MEDIA_RESULT_CACHE.clear();
  });

  test('keeps ChatGPT file references closed for connector schema ingestion', () => {
    expect(CHATGPT_MEDIA_FILE_REFERENCE_SCHEMA.safeParse({
      download_url: 'https://files.openai.example.test/audio',
      file_id: 'file_audio_1',
      mime_type: 'audio/mpeg',
      file_name: 'lesson.mp3',
      unexpected: 'must be rejected',
    }).success).toBe(false);
  });

  test('registers URL media plus ChatGPT image-file hosting with truthful annotations and routing', async () => {
    const harness = mediaRegistrationHarness();
    expect(Object.keys(harness.handlers).sort()).toEqual([
      'insert_audio_from_file',
      'insert_audio_from_url',
      'insert_image_from_file',
      'insert_image_from_url',
      'insert_video_from_file',
      'insert_video_from_url',
    ]);

    for (const name of Object.keys(harness.configs)) {
      expect(harness.configs[name].annotations).toEqual({
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      });
    }

    await harness.handlers.insert_image_from_url({
      parentId: 'parent',
      url: 'https://cdn.example.test/image.png',
      position: 'start',
      width: 640,
      height: 480,
      label: 'Diagram',
      idempotencyKey: 'image-1',
      verifyAfterWrite: true,
    });
    await harness.handlers.insert_audio_from_url({
      parentId: 'parent',
      url: 'https://cdn.example.test/audio.mp3',
      position: 'end',
      idempotencyKey: 'audio-1',
      verifyAfterWrite: true,
    });
    await harness.handlers.insert_video_from_url({
      parentId: 'parent',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      position: 'end',
      idempotencyKey: 'video-1',
      verifyAfterWrite: true,
    });
    const hosted = await harness.handlers.insert_image_from_file({
      parentId: 'parent',
      imageFile: {
        download_url: 'https://files.openai.example.test/generated-image',
        file_id: 'file_image_1',
        mime_type: 'image/png',
        file_name: 'diagram.png',
      },
      position: 'end',
      label: 'Generated diagram',
      idempotencyKey: 'hosted-image-1',
      verifyAfterWrite: true,
    });
    await harness.handlers.insert_image_from_file({
      parentId: 'parent',
      imageFile: {
        download_url: 'https://files.openai.example.test/generated-image?refreshed=1',
        file_id: 'file_image_1',
        mime_type: 'image/png',
        file_name: 'diagram.png',
      },
      position: 'end',
      label: 'Generated diagram',
      idempotencyKey: 'hosted-image-1',
      verifyAfterWrite: true,
    });

    expect(harness.calls.map((call) => call.tool)).toEqual([
      'insert_image_from_url',
      'insert_audio_from_url',
      'insert_video_from_url',
      'insert_image_from_url',
      'insert_image_from_url',
    ]);
    expect(harness.calls[0].args).toMatchObject({ width: 640, height: 480, label: 'Diagram' });
    expect(harness.calls[3].args).toMatchObject({
      parentId: 'parent',
      label: 'Generated diagram',
      idempotencyKey: 'hosted-image-1',
      verifyAfterWrite: true,
    });
    expect((harness.calls[3].args as { url: string }).url).toMatch(
      /^https:\/\/bridge\.example\.test\/media\/images\/[0-9a-f-]+$/
    );
    expect((harness.calls[4].args as { url: string }).url).toBe(
      (harness.calls[3].args as { url: string }).url
    );
    expect(harness.hostedImageLoads()).toBe(1);
    expect(harness.configs.insert_image_from_file._meta['openai/fileParams']).toEqual(['imageFile']);
    expect(hosted.structuredContent).toMatchObject({
      ok: true,
      toolName: 'insert_image_from_file',
      result: {
        mediaKind: 'image',
        hostedAsset: {
          contentType: 'image/png',
          fileName: 'diagram.png',
          storageDurability: 'persistent',
          cleanupStatus: 'retained_remote_dependency',
          remnoteStillReferencesHostedUrl: true,
        },
      },
    });
  });

  test('hosts uploaded MP3 and MP4 files and routes them through native media writes', async () => {
    const harness = mediaRegistrationHarness();

    const audio = await harness.handlers.insert_audio_from_file({
      parentId: 'parent',
      audioFile: {
        download_url: 'https://files.openai.example.test/lesson-audio',
        file_id: 'file_audio_1',
        mime_type: 'audio/mpeg',
        file_name: 'lesson.mp3',
      },
      position: 'end',
      idempotencyKey: 'hosted-audio-1',
      verifyAfterWrite: true,
    });
    const video = await harness.handlers.insert_video_from_file({
      parentId: 'parent',
      videoFile: {
        download_url: 'https://files.openai.example.test/lesson-video',
        file_id: 'file_video_1',
        mime_type: 'video/mp4',
        file_name: 'lesson.mp4',
      },
      position: 'end',
      idempotencyKey: 'hosted-video-1',
      verifyAfterWrite: true,
    });

    expect(INSERT_AUDIO_FROM_FILE_INPUT_SCHEMA.safeParse({
      parentId: 'parent',
      audioFile: { download_url: 'https://files.example.test/audio', file_id: 'file_audio_1' },
      position: 'end',
      idempotencyKey: 'hosted-audio-1',
    }).success).toBe(true);
    expect(INSERT_VIDEO_FROM_FILE_INPUT_SCHEMA.safeParse({
      parentId: 'parent',
      videoFile: { download_url: 'https://files.example.test/video', file_id: 'file_video_1' },
      position: 'end',
      idempotencyKey: 'hosted-video-1',
    }).success).toBe(true);

    expect(harness.hostedMediaLoads()).toEqual(['audio', 'video']);
    expect(harness.hostedMediaMaxBytes()).toEqual([25 * 1024 * 1024, 50 * 1024 * 1024]);
    expect(harness.configs.insert_audio_from_file._meta['openai/fileParams']).toEqual(['audioFile']);
    expect(harness.configs.insert_video_from_file._meta['openai/fileParams']).toEqual(['videoFile']);
    expect(harness.calls.map((call) => call.tool)).toEqual([
      'insert_audio_from_url',
      'insert_video_from_url',
    ]);
    expect((harness.calls[0].args as { url: string }).url).toMatch(
      /^https:\/\/bridge\.example\.test\/media\/assets\/[0-9a-f-]+$/
    );
    expect((harness.calls[1].args as { url: string }).url).toMatch(
      /^https:\/\/bridge\.example\.test\/media\/assets\/[0-9a-f-]+$/
    );
    expect(audio.structuredContent).toMatchObject({
      ok: true,
      toolName: 'insert_audio_from_file',
      result: {
        mediaKind: 'audio',
        hostedAsset: {
          contentType: 'audio/mpeg',
          cleanupStatus: 'retained_remote_dependency',
        },
      },
    });
    expect(video.structuredContent).toMatchObject({
      ok: true,
      toolName: 'insert_video_from_file',
      result: {
        mediaKind: 'video',
        hostedAsset: {
          contentType: 'video/mp4',
          cleanupStatus: 'retained_remote_dependency',
        },
      },
    });
  });

  test('deletes a newly hosted orphan after a definitive plugin no-write failure', async () => {
    const harness = mediaRegistrationHarness({
      pluginResponse: {
        id: 'media-failed',
        ok: false,
        error: {
          code: 'PARENT_NOT_FOUND',
          message: 'Parent was not found.',
        },
      },
    });

    const result = await harness.handlers.insert_image_from_file({
      parentId: 'missing-parent',
      imageFile: {
        download_url: 'https://files.openai.example.test/generated-image',
        file_id: 'file_orphan_1',
        mime_type: 'image/png',
        file_name: 'orphan.png',
      },
      position: 'end',
      idempotencyKey: 'orphan-image-1',
      verifyAfterWrite: true,
    });

    expect(result.structuredContent).toMatchObject({
      ok: false,
      error: {
        code: 'PARENT_NOT_FOUND',
        details: {
          hostedAssetCleanup: {
            cleanupStatus: 'deleted_unreferenced_after_failure',
          },
        },
      },
    });
    expect(await harness.storage.getHostedMediaAssetByIdempotency('test-user', 'orphan-image-1')).toBeNull();
  });

  test('retains hosted bytes when plugin write status is uncertain', async () => {
    const harness = mediaRegistrationHarness({
      pluginResponse: {
        id: 'media-uncertain',
        ok: false,
        error: {
          code: 'RETRYABLE_UNKNOWN_WRITE_STATUS',
          message: 'The write may have completed before the connection closed.',
        },
      },
    });

    const result = await harness.handlers.insert_image_from_file({
      parentId: 'parent',
      imageFile: {
        download_url: 'https://files.openai.example.test/generated-image',
        file_id: 'file_uncertain_1',
        mime_type: 'image/png',
        file_name: 'uncertain.png',
      },
      position: 'end',
      idempotencyKey: 'uncertain-image-1',
      verifyAfterWrite: true,
    });

    expect(result.structuredContent).toMatchObject({
      ok: false,
      error: {
        details: {
          hostedAssetCleanup: {
            cleanupStatus: 'retained_uncertain_reference',
          },
        },
      },
    });
    expect(await harness.storage.getHostedMediaAssetByIdempotency('test-user', 'uncertain-image-1')).not.toBeNull();
  });

  test('redacts unexpected hosted-image infrastructure errors', async () => {
    const harness = mediaRegistrationHarness({
      hostedImageError: new Error('postgresql://bridge-user:super-secret@private-db/bridge'),
    });

    const result = await harness.handlers.insert_image_from_file({
      parentId: 'parent',
      imageFile: {
        download_url: 'https://files.openai.example.test/generated-image',
        file_id: 'file_error_1',
        mime_type: 'image/png',
        file_name: 'error.png',
      },
      position: 'end',
      idempotencyKey: 'error-image-1',
      verifyAfterWrite: true,
    });

    expect(JSON.stringify(result)).not.toContain('super-secret');
    expect(result.structuredContent).toMatchObject({
      ok: false,
      error: {
        details: {
          errorCode: 'HOSTED_IMAGE_INTERNAL_ERROR',
          layer: 'server_hosted_media',
        },
      },
    });
  });

  test('accepts the official ChatGPT image file object and requires an idempotency key', () => {
    const valid = {
      parentId: 'parent',
      imageFile: {
        download_url: 'https://files.openai.example.test/generated-image',
        file_id: 'file_image_1',
        mime_type: 'image/png',
        file_name: 'diagram.png',
      },
      idempotencyKey: 'hosted-image-1',
    };
    expect(INSERT_IMAGE_FROM_FILE_INPUT_SCHEMA.safeParse(valid).success).toBe(true);
    expect(INSERT_IMAGE_FROM_FILE_INPUT_SCHEMA.safeParse({
      ...valid,
      imageFile: { download_url: valid.imageFile.download_url },
    }).success).toBe(false);
    expect(INSERT_IMAGE_FROM_FILE_INPUT_SCHEMA.safeParse({
      ...valid,
      idempotencyKey: undefined,
    }).success).toBe(false);
  });

  test('accepts bounded HTTP(S) media URLs and image dimensions', () => {
    expect(INSERT_IMAGE_FROM_URL_INPUT_SCHEMA.safeParse({
      parentId: 'parent',
      url: 'https://cdn.example.test/image.png',
      width: 1,
      height: 4096,
    }).success).toBe(true);
    expect(INSERT_AUDIO_FROM_URL_INPUT_SCHEMA.safeParse({
      parentId: 'parent',
      url: 'http://media.example.test/audio.mp3',
    }).success).toBe(true);
    expect(INSERT_VIDEO_FROM_URL_INPUT_SCHEMA.safeParse({
      parentId: 'parent',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    }).success).toBe(true);
  });

  test.each([
    '',
    'not a URL',
    'javascript:alert(1)',
    'file:///etc/passwd',
    'data:image/png;base64,AAAA',
    `https://example.test/${'x'.repeat(2050)}`,
  ])('rejects unsafe or malformed media URL %s', (url) => {
    for (const schema of [
      INSERT_IMAGE_FROM_URL_INPUT_SCHEMA,
      INSERT_AUDIO_FROM_URL_INPUT_SCHEMA,
      INSERT_VIDEO_FROM_URL_INPUT_SCHEMA,
    ]) {
      expect(schema.safeParse({ parentId: 'parent', url }).success).toBe(false);
    }
  });

  test.each([0, -1, 1.5, 4097])('rejects invalid image dimension %s', (dimension) => {
    expect(INSERT_IMAGE_FROM_URL_INPUT_SCHEMA.safeParse({
      parentId: 'parent',
      url: 'https://cdn.example.test/image.png',
      width: dimension,
    }).success).toBe(false);
    expect(INSERT_IMAGE_FROM_URL_INPUT_SCHEMA.safeParse({
      parentId: 'parent',
      url: 'https://cdn.example.test/image.png',
      height: dimension,
    }).success).toBe(false);
  });
});

describe('image media write', () => {
  test('selects only the image builder and creates one dedicated child without changing existing text', async () => {
    const plugin = new FakePlugin();
    const parent = plugin.addRem('parent', 'Existing parent text');
    const sibling = plugin.addRem('sibling', 'Existing sibling text');
    await sibling.setParent(parent, 0);
    const parentTextBefore = JSON.stringify(parent.text);
    const siblingTextBefore = JSON.stringify(sibling.text);

    const result = await insertImageFromUrl(plugin.asPlugin(), {
      parentId: parent._id,
      url: 'HTTPS://EXAMPLE.TEST:443/image.png',
      position: 'start',
      label: ' Diagram ',
      width: 640,
      height: 480,
      idempotencyKey: 'image-create-1',
      verifyAfterWrite: true,
    });

    expect(plugin.mediaBuilderCalls).toEqual([
      { kind: 'image', url: 'https://example.test/image.png', width: 640, height: 480 },
    ]);
    expect(parent.children).toEqual([result.createdRemId, sibling._id]);
    expect(JSON.stringify(parent.text)).toBe(parentTextBefore);
    expect(JSON.stringify(sibling.text)).toBe(siblingTextBefore);
    expect(result).toMatchObject({
      parentId: 'parent',
      mediaKind: 'image',
      url: 'https://example.test/image.png',
      position: 'start',
      insertIndex: 0,
      status: 'inserted',
      idempotencyKey: 'image-create-1',
      label: 'Diagram',
      width: 640,
      height: 480,
      verification: {
        attempted: true,
        createdRemFound: true,
        mediaKindMatched: true,
        urlMatched: true,
      },
    });
  });

  test('replays the same image key without creating a duplicate and rejects key reuse with different input', async () => {
    const plugin = new FakePlugin();
    const parent = plugin.addRem('parent', 'Parent');
    const args = {
      parentId: parent._id,
      url: 'https://example.test/image.png',
      idempotencyKey: 'same-image-key',
      verifyAfterWrite: true,
    };

    const first = await insertImageFromUrl(plugin.asPlugin(), args);
    const second = await insertImageFromUrl(plugin.asPlugin(), args);

    expect(second.createdRemId).toBe(first.createdRemId);
    expect(second.status).toBe('already_applied');
    expect(parent.children).toEqual([first.createdRemId]);
    expect(plugin.createRemCount).toBe(1);

    await expect(insertImageFromUrl(plugin.asPlugin(), {
      ...args,
      url: 'https://example.test/different.png',
    })).rejects.toMatchObject({
      code: 'INVALID_ARGS',
    });
    expect(parent.children).toEqual([first.createdRemId]);
    expect(plugin.createRemCount).toBe(1);
  });

  test('returns SDK_UNSUPPORTED with zero mutation when image builder is absent', async () => {
    const plugin = new FakePlugin();
    const parent = plugin.addRem('parent', 'Parent');
    (plugin.richText as any).image = undefined;

    await expect(insertImageFromUrl(plugin.asPlugin(), {
      parentId: parent._id,
      url: 'https://example.test/image.png',
      idempotencyKey: 'missing-image-capability',
    })).rejects.toMatchObject({
      code: 'SDK_UNSUPPORTED',
      details: {
        capability: 'plugin.richText.image',
        mediaKind: 'image',
      },
    });
    expect(plugin.createRemCount).toBe(0);
    expect(parent.children).toEqual([]);
  });
});

describe('audio media bridge write', () => {
  test('routes to only the audio builder, preserves existing content, and replays idempotently', async () => {
    const plugin = new FakePlugin();
    const parent = plugin.addRem('parent', 'Existing parent');
    const sibling = plugin.addRem('sibling', 'Existing sibling');
    await sibling.setParent(parent, 0);
    const parentTextBefore = JSON.stringify(parent.text);
    const siblingTextBefore = JSON.stringify(sibling.text);
    const request = {
      id: 'audio-request',
      tool: 'insert_audio_from_url' as const,
      args: {
        parentId: parent._id,
        url: 'https://example.test/audio.mp3',
        position: 'end' as const,
        label: 'Lecture audio',
        idempotencyKey: 'audio-write-1',
        verifyAfterWrite: true,
      },
    };
    const context = {
      permissionMode: 'full_control_delete_approval' as const,
      permissionScope: 'workspace_allowed' as const,
      approvedRootRemId: null,
      requestApproval: async () => 'APPROVED' as const,
    };

    const first = await handleBridgeRequest(plugin.asPlugin(), request, context);
    const second = await handleBridgeRequest(plugin.asPlugin(), { ...request, id: 'audio-replay' }, context);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) throw new Error('Expected successful audio bridge responses.');
    expect(first.result).toMatchObject({
      parentId: 'parent',
      mediaKind: 'audio',
      url: 'https://example.test/audio.mp3',
      position: 'end',
      insertIndex: 1,
      status: 'inserted',
      verification: { mediaKindMatched: true, urlMatched: true },
    });
    expect(second.result).toMatchObject({
      createdRemId: (first.result as any).createdRemId,
      status: 'already_applied',
    });
    expect(plugin.mediaBuilderCalls).toEqual([{ kind: 'audio', url: 'https://example.test/audio.mp3' }]);
    expect(parent.children).toEqual([sibling._id, (first.result as any).createdRemId]);
    expect(JSON.stringify(parent.text)).toBe(parentTextBefore);
    expect(JSON.stringify(sibling.text)).toBe(siblingTextBefore);
    expect(plugin.createRemCount).toBe(1);
  });

  test('returns structured SDK_UNSUPPORTED and performs zero mutation without audio capability', async () => {
    const plugin = new FakePlugin();
    const parent = plugin.addRem('parent', 'Parent');
    (plugin.richText as any).audio = undefined;

    const response = await handleBridgeRequest(plugin.asPlugin(), {
      id: 'audio-missing',
      tool: 'insert_audio_from_url',
      args: {
        parentId: parent._id,
        url: 'https://example.test/audio.mp3',
        idempotencyKey: 'audio-missing-1',
      },
    }, {
      permissionMode: 'full_control_delete_approval',
      permissionScope: 'workspace_allowed',
      approvedRootRemId: null,
      requestApproval: async () => 'APPROVED',
    });

    expect(response).toMatchObject({
      ok: false,
      error: {
        code: 'SDK_UNSUPPORTED',
        details: {
          capability: 'plugin.richText.audio',
          mediaKind: 'audio',
          layer: 'sdk',
        },
      },
    });
    expect(plugin.createRemCount).toBe(0);
    expect(parent.children).toEqual([]);
  });
});

describe('video media bridge write', () => {
  test('routes direct video and YouTube URLs to only the video builder with safe idempotent placement', async () => {
    const plugin = new FakePlugin();
    const parent = plugin.addRem('parent', 'Existing parent');
    const sibling = plugin.addRem('sibling', 'Existing sibling');
    await sibling.setParent(parent, 0);
    const context = {
      permissionMode: 'full_control_delete_approval' as const,
      permissionScope: 'workspace_allowed' as const,
      approvedRootRemId: null,
      requestApproval: async () => 'APPROVED' as const,
    };
    const direct = await handleBridgeRequest(plugin.asPlugin(), {
      id: 'video-direct',
      tool: 'insert_video_from_url',
      args: {
        parentId: parent._id,
        url: 'https://example.test/video.mp4',
        position: 'end',
        idempotencyKey: 'video-direct-1',
        verifyAfterWrite: true,
      },
    }, context);
    const youtubeRequest = {
      id: 'video-youtube',
      tool: 'insert_video_from_url' as const,
      args: {
        parentId: parent._id,
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        position: 'start' as const,
        label: 'YouTube lesson',
        idempotencyKey: 'video-youtube-1',
        verifyAfterWrite: true,
      },
    };
    const youtube = await handleBridgeRequest(plugin.asPlugin(), youtubeRequest, context);
    const replay = await handleBridgeRequest(plugin.asPlugin(), { ...youtubeRequest, id: 'video-replay' }, context);

    expect(direct.ok).toBe(true);
    expect(youtube.ok).toBe(true);
    expect(replay.ok).toBe(true);
    if (!direct.ok || !youtube.ok || !replay.ok) throw new Error('Expected successful video bridge responses.');
    expect(direct.result).toMatchObject({
      mediaKind: 'video',
      url: 'https://example.test/video.mp4',
      status: 'inserted',
      verification: { mediaKindMatched: true, urlMatched: true },
    });
    expect(youtube.result).toMatchObject({
      mediaKind: 'video',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      status: 'inserted',
      position: 'start',
      insertIndex: 0,
    });
    expect(replay.result).toMatchObject({
      createdRemId: (youtube.result as any).createdRemId,
      status: 'already_applied',
    });
    expect(plugin.mediaBuilderCalls).toEqual([
      { kind: 'video', url: 'https://example.test/video.mp4' },
      { kind: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    ]);
    expect(parent.children).toEqual([
      (youtube.result as any).createdRemId,
      sibling._id,
      (direct.result as any).createdRemId,
    ]);
    expect(plugin.createRemCount).toBe(2);
  });

  test('returns structured SDK_UNSUPPORTED and performs zero mutation without video capability', async () => {
    const plugin = new FakePlugin();
    const parent = plugin.addRem('parent', 'Parent');
    (plugin.richText as any).video = undefined;

    const response = await handleBridgeRequest(plugin.asPlugin(), {
      id: 'video-missing',
      tool: 'insert_video_from_url',
      args: {
        parentId: parent._id,
        url: 'https://example.test/video.mp4',
        idempotencyKey: 'video-missing-1',
      },
    }, {
      permissionMode: 'full_control_delete_approval',
      permissionScope: 'workspace_allowed',
      approvedRootRemId: null,
      requestApproval: async () => 'APPROVED',
    });

    expect(response).toMatchObject({
      ok: false,
      error: {
        code: 'SDK_UNSUPPORTED',
        details: {
          capability: 'plugin.richText.video',
          mediaKind: 'video',
          layer: 'sdk',
        },
      },
    });
    expect(plugin.createRemCount).toBe(0);
    expect(parent.children).toEqual([]);
  });
});

describe('media failure and rollback semantics', () => {
  test('removes the newly created Rem when setText fails and preserves the parent', async () => {
    const plugin = new FakePlugin();
    const parent = plugin.addRem('parent', 'Unchanged parent');
    const parentTextBefore = JSON.stringify(parent.text);
    plugin.failSetTextIncludes = 'force media setText failure';

    await expect(insertImageFromUrl(plugin.asPlugin(), {
      parentId: parent._id,
      url: 'https://example.test/image.png',
      label: 'force media setText failure',
      idempotencyKey: 'image-settext-failure',
    })).rejects.toMatchObject({
      code: 'SDK_ERROR',
      details: {
        partialExecution: {
          failedStage: 'rem.setText',
          rollbackStatus: 'completed',
          rollbackRemovedRemIds: ['generated-1'],
        },
      },
    });
    expect(plugin.rems.has('generated-1')).toBe(false);
    expect(parent.children).toEqual([]);
    expect(JSON.stringify(parent.text)).toBe(parentTextBefore);
  });

  test('removes the newly created Rem when setParent fails', async () => {
    const plugin = new FakePlugin();
    const parent = plugin.addRem('parent', 'Unchanged parent');
    (plugin as any).failSetParent = true;

    await expect(insertImageFromUrl(plugin.asPlugin(), {
      parentId: parent._id,
      url: 'https://example.test/image.png',
      idempotencyKey: 'image-setparent-failure',
    })).rejects.toMatchObject({
      code: 'SDK_ERROR',
      details: {
        partialExecution: {
          failedStage: 'rem.setParent',
          rollbackStatus: 'completed',
        },
      },
    });
    expect(plugin.rems.has('generated-1')).toBe(false);
    expect(parent.children).toEqual([]);
  });

  test('rolls back a media Rem whose readback representation is corrupted', async () => {
    const plugin = new FakePlugin();
    const parent = plugin.addRem('parent', 'Unchanged parent');
    (plugin as any).dropMediaOnSetText = true;

    await expect(insertImageFromUrl(plugin.asPlugin(), {
      parentId: parent._id,
      url: 'https://example.test/image.png',
      idempotencyKey: 'image-readback-failure',
      verifyAfterWrite: true,
    })).rejects.toMatchObject({
      code: 'SDK_ERROR',
      details: {
        partialExecution: {
          failedStage: 'media.readback',
          rollbackStatus: 'completed',
        },
      },
    });
    expect(plugin.rems.has('generated-1')).toBe(false);
    expect(parent.children).toEqual([]);
  });

  test('reports PARTIAL_FAILURE with orphan ID when compensating removal also fails', async () => {
    const plugin = new FakePlugin();
    const parent = plugin.addRem('parent', 'Unchanged parent');
    plugin.failSetTextIncludes = 'force rollback failure';
    plugin.failRemoveIds.add('generated-1');

    await expect(insertImageFromUrl(plugin.asPlugin(), {
      parentId: parent._id,
      url: 'https://example.test/image.png',
      label: 'force rollback failure',
      idempotencyKey: 'image-rollback-failure',
    })).rejects.toMatchObject({
      code: 'PARTIAL_FAILURE',
      details: {
        partialExecution: {
          createdRemIds: ['generated-1'],
          failedStage: 'rem.setText',
          rollbackStatus: 'failed',
          rollbackFailedRemIds: ['generated-1'],
        },
      },
    });
    expect(plugin.rems.has('generated-1')).toBe(true);
    expect(parent.children).toEqual([]);
  });
});

describe('media bridge policy and capability contract', () => {
  test('normalizes media arguments again at the plugin trust boundary', () => {
    expect(normalizeArgs('insert_image_from_url', {
      parentId: ' parent ',
      url: 'HTTPS://EXAMPLE.TEST:443/image.png',
      position: 'start',
      label: ' Diagram ',
      width: 640,
      height: 480,
      idempotencyKey: ' image-key ',
      verifyAfterWrite: true,
    })).toEqual({
      parentId: 'parent',
      url: 'https://example.test/image.png',
      position: 'start',
      label: 'Diagram',
      width: 640,
      height: 480,
      idempotencyKey: 'image-key',
      verifyAfterWrite: true,
    });

    expect(() => normalizeArgs('insert_audio_from_url', {
      parentId: 'parent',
      url: 'javascript:alert(1)',
    })).toThrow(/http or https/i);
    expect(() => normalizeArgs('insert_image_from_url', {
      parentId: 'parent',
      url: 'https://example.test/image.png',
      width: 0,
    })).toThrow(/width/i);
  });

  test.each([
    'insert_image_from_url',
    'insert_audio_from_url',
    'insert_video_from_url',
  ] as const)('%s is a scoped trusted create-only write', (tool) => {
    expect(TOOL_PERMISSIONS[tool]).toMatchObject({
      category: 'write',
      requiredAccessScope: 'current-rem-tree',
      requiresTrustedWrite: true,
    });
    expect(getPermissionDecision('read_create', tool)).toMatchObject({
      allowed: true,
      approvalRequired: true,
      destructive: false,
    });
    expect(getStaticScopeTargetIds({
      id: 'media',
      tool,
      args: { parentId: 'parent', url: 'https://example.test/media' },
    } as any)).toEqual(['parent']);
  });

  test('reports all three runtime media builder capabilities', () => {
    const plugin = {
      app: { transaction: async () => undefined, waitForInitialSync: async () => undefined },
      rem: {},
      reader: {},
      queue: {},
      richText: {
        image: () => ({ value: async () => [] }),
        audio: () => ({ value: async () => [] }),
        video: () => ({ value: async () => [] }),
      },
    } as any;

    const report = detectRemnoteSdkCapabilities(plugin);
    for (const capability of [
      'plugin.richText.image',
      'plugin.richText.audio',
      'plugin.richText.video',
    ] as const) {
      expect(report.supportedSdkCapabilities).toContain(capability);
      expect(report.sdkCapabilityDetails[capability]).toMatchObject({
        supported: true,
        namespace: 'richText',
      });
    }
  });

  test.each([
    'insert_image_from_url',
    'insert_image_from_file',
    'insert_audio_from_file',
    'insert_video_from_file',
    'insert_video_from_url',
  ] as const)('%s is available to the default ChatGPT profile', (tool) => {
    expect(getAllPublicMcpToolNames()).toContain(tool);
    expect(getPublicMcpToolNames(false, 'note_writer')).toContain(tool);
    expect(getPublicMcpToolNames(false, 'mass_note_writer')).toContain(tool);
    expect(getToolMetadata(tool)).toMatchObject({
      tier: 'mass_note_writer',
      category: 'simple_write',
      operationTier: 'Read + Create',
      riskLevel: 'medium',
      scopeRequirement: 'approved-root',
      requiresWrite: true,
      requiresDelete: false,
      supportsIdempotency: true,
      isPublic: true,
    });
  });

  test('YouTube discovery tells ChatGPT to create a native video Rem, never a text-link substitute', () => {
    const harness = mediaRegistrationHarness();
    expect(harness.configs.insert_video_from_url.description).toContain('native RemNote video');
    expect(harness.configs.insert_video_from_url.description).toContain('Do not insert the URL as plain text');
  });

  test('server auth policy permits trusted current-tree media writes and blocks insufficient scope', () => {
    const body = {
      method: 'tools/call',
      params: {
        name: 'insert_image_from_url',
        arguments: { parentId: 'parent', url: 'https://example.test/image.png' },
      },
    };
    const trusted = validateMcpToolPermission(body, {
      subject: 'media-user',
      authMode: 'hosted_oauth',
      scopeGrants: ['bridge:read', 'bridge:write', 'bridge:trusted_write'],
      accessScope: 'current-rem-tree',
      trustedWriteMode: 'trusted-inside-scope',
    } as any);
    expect(trusted).toEqual({ ok: true });

    const blocked = validateMcpToolPermission(body, {
      subject: 'media-user',
      authMode: 'hosted_oauth',
      scopeGrants: ['bridge:read', 'bridge:write'],
      accessScope: 'focused-rem-only',
      trustedWriteMode: 'approval-required',
    } as any);
    expect(blocked).toMatchObject({
      ok: false,
      code: 'OUT_OF_SCOPE',
      layer: 'server_policy',
    });
  });

  test('plugin permission and focused scope reject media writes before mutation', async () => {
    const plugin = new FakePlugin();
    const parent = plugin.addRem('parent', 'Parent');
    const request = {
      id: 'blocked-image',
      tool: 'insert_image_from_url' as const,
      args: {
        parentId: parent._id,
        url: 'https://example.test/image.png',
        idempotencyKey: 'blocked-image-1',
      },
    };

    const readOnly = await handleBridgeRequest(plugin.asPlugin(), request, {
      permissionMode: 'read_only',
      permissionScope: 'workspace_allowed',
      approvedRootRemId: null,
      requestApproval: async () => 'APPROVED',
    });
    expect(readOnly).toMatchObject({ ok: false, error: { code: 'PERMISSION_DENIED' } });

    const outOfScope = await handleBridgeRequest(plugin.asPlugin(), { ...request, id: 'scope-blocked-image' }, {
      permissionMode: 'full_control_delete_approval',
      permissionScope: 'focused_rem_only',
      approvedRootRemId: null,
      requestApproval: async () => 'APPROVED',
    });
    expect(outOfScope).toMatchObject({ ok: false, error: { code: 'OUT_OF_SCOPE' } });
    expect(plugin.createRemCount).toBe(0);
    expect(parent.children).toEqual([]);
  });
});
