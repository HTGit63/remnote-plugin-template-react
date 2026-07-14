import { describe, expect, test } from 'vitest';
import {
  createBulkImportSourceFileLoader,
  createPinnedSourceLookup,
  isPublicSourceAddress,
  loadBulkImportSourceFile,
  parseBulkImportSourceReference,
  resolveBulkImportLocalPath,
} from '../server/src/bulk-import/source-file-loader';
import type { AuthenticatedPrincipal } from '../server/src/auth/types';

const hostedPrincipal: AuthenticatedPrincipal = {
  subject: 'test:hosted',
  authMode: 'hosted_oauth',
  scopeGrants: ['bridge:read'],
  accessScope: 'focused-rem-only',
};

describe('bulk import source file loader', () => {
  test('loads an official ChatGPT file reference through the hosted OAuth lane', async () => {
    const downloads: string[] = [];
    const loader = createBulkImportSourceFileLoader({
      downloadRemoteBytes: async (url) => {
        downloads.push(url);
        return Buffer.from('# ChatGPT file\n\nSource body.', 'utf8');
      },
    });

    const loaded = await loader({
      sourceFile: {
        download_url: 'https://files.example.invalid/chapter.md?signature=temporary',
        file_id: 'file_stage8',
        mime_type: 'text/markdown',
        file_name: 'chapter.md',
      },
    }, {
      principal: hostedPrincipal,
      policy: {
        allowedRoots: [],
        maxBytes: 1024,
        remoteTimeoutMs: 1000,
      },
    });

    expect(downloads).toEqual(['https://files.example.invalid/chapter.md?signature=temporary']);
    expect(loaded.sourceText).toContain('Source body.');
    expect(loaded.sourceReference).toEqual({
      kind: 'chatgpt_file',
      fileId: 'file_stage8',
      fileName: 'chapter.md',
      mimeType: 'text/markdown',
    });
    expect(JSON.stringify(loaded.sourceReference)).not.toContain('signature=temporary');
  });

  test('returns the pinned address in both Node lookup callback shapes', async () => {
    const lookup = createPinnedSourceLookup({ address: '203.0.114.8', family: 4 });
    const single = await new Promise<{ address: string; family: number }>((resolve, reject) => {
      lookup('files.example.test', { all: false }, ((error: Error | null, address: string, family: number) => {
        if (error) reject(error);
        else resolve({ address, family });
      }) as never);
    });
    const all = await new Promise<Array<{ address: string; family: number }>>((resolve, reject) => {
      lookup('files.example.test', { all: true }, ((error: Error | null, addresses: Array<{ address: string; family: number }>) => {
        if (error) reject(error);
        else resolve(addresses);
      }) as never);
    });

    expect(single).toEqual({ address: '203.0.114.8', family: 4 });
    expect(all).toEqual([{ address: '203.0.114.8', family: 4 }]);
  });

  test('blocks private, loopback, link-local, documentation, and mapped addresses', () => {
    for (const address of ['10.0.0.1', '127.0.0.1', '169.254.169.254', '192.168.1.1', '192.0.2.1']) {
      expect(isPublicSourceAddress(address, 4)).toBe(false);
    }
    for (const address of ['::1', 'fc00::1', 'fe80::1', '2001:db8::1', '::ffff:127.0.0.1']) {
      expect(isPublicSourceAddress(address, 6)).toBe(false);
    }
    expect(isPublicSourceAddress('8.8.8.8', 4)).toBe(true);
    expect(isPublicSourceAddress('2606:4700:4700::1111', 6)).toBe(true);
  });

  test('rejects arbitrary remote URLs passed through local URI aliases', () => {
    expect(() => resolveBulkImportLocalPath('https://example.com/chapter.md'))
      .toThrow('SOURCE_FILE_UNSUPPORTED_URI');
  });

  test('rejects conflicting top-level aliases', () => {
    expect(() => parseBulkImportSourceReference({
      sourceFilePath: '/mnt/data/a.md',
      filePath: '/mnt/data/b.md',
    })).toThrow('SOURCE_FILE_REFERENCE_CONFLICT');
  });

  test('blocks ChatGPT file URLs resolving to loopback before download', async () => {
    await expect(loadBulkImportSourceFile({
      sourceFile: {
        download_url: 'https://127.0.0.1/chapter.md',
        file_id: 'file_private',
      },
    }, {
      principal: hostedPrincipal,
      policy: {
        allowedRoots: ['/mnt/data'],
        maxBytes: 1024,
        remoteTimeoutMs: 1000,
      },
    })).rejects.toThrow('SOURCE_FILE_REMOTE_HOST_BLOCKED');
  });
});
