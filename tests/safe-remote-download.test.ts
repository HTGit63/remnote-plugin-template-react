import { beforeEach, describe, expect, test, vi } from 'vitest';

const remoteMocks = vi.hoisted(() => ({
  addresses: [
    { address: '100.64.0.10', family: 4 },
    { address: '203.0.114.7', family: 4 },
  ],
  pinnedAddress: '',
}));

vi.mock('node:dns/promises', () => ({
  lookup: vi.fn(async () => remoteMocks.addresses),
}));

vi.mock('node:https', async () => {
  const { EventEmitter } = await vi.importActual<typeof import('node:events')>('node:events');
  const { Readable } = await vi.importActual<typeof import('node:stream')>('node:stream');

  return {
    request: vi.fn((url: URL, options: Record<string, any>, onResponse: (response: any) => void) => {
      const request = new EventEmitter() as any;
      request.setTimeout = vi.fn();
      request.destroy = vi.fn((error?: Error) => {
        if (error) request.emit('error', error);
      });
      request.end = vi.fn(() => {
        options.lookup(url.hostname, {}, (error: Error | null, address: string) => {
          if (error) {
            request.emit('error', error);
            return;
          }
          remoteMocks.pinnedAddress = address;
          const response = Readable.from([Buffer.from('image-bytes')]) as any;
          response.statusCode = 200;
          response.headers = { 'content-length': '11' };
          onResponse(response);
        });
      });
      return request;
    }),
  };
});

import {
  downloadSafeRemoteBytes,
  isPublicRemoteAddress,
} from '../server/src/security/safe-remote-download';

describe('safe remote DNS selection', () => {
  beforeEach(() => {
    remoteMocks.addresses = [
      { address: '100.64.0.10', family: 4 },
      { address: '203.0.114.7', family: 4 },
    ];
    remoteMocks.pinnedAddress = '';
  });

  test('accepts a public IPv4 address without weakening mapped-address blocking', () => {
    expect(isPublicRemoteAddress('8.8.8.8', 4)).toBe(true);
    expect(isPublicRemoteAddress('::ffff:127.0.0.1', 6)).toBe(false);
    expect(isPublicRemoteAddress('0:0:0:0:0:ffff:808:808', 6)).toBe(false);
  });

  test('pins a public address when DNS also returns a non-public address', async () => {
    const bytes = await downloadSafeRemoteBytes('https://files.example.test/image.png', {
      maxBytes: 1024,
      timeoutMs: 1000,
      accept: 'image/png',
    });

    expect(bytes).toEqual(Buffer.from('image-bytes'));
    expect(remoteMocks.pinnedAddress).toBe('203.0.114.7');
  });

  test('still blocks a host when DNS returns no public address', async () => {
    remoteMocks.addresses = [
      { address: '100.64.0.10', family: 4 },
      { address: '127.0.0.1', family: 4 },
    ];

    await expect(downloadSafeRemoteBytes('https://files.example.test/image.png', {
      maxBytes: 1024,
      timeoutMs: 1000,
      accept: 'image/png',
    })).rejects.toMatchObject({ code: 'REMOTE_HOST_BLOCKED' });
    expect(remoteMocks.pinnedAddress).toBe('');
  });
});
