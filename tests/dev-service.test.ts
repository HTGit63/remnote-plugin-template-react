import { createRequire } from 'node:module';
import { describe, expect, test } from 'vitest';

const require = createRequire(import.meta.url);

type ProbeResult = {
  status: 'ready' | 'stopped' | 'port_conflict' | 'asset_missing';
  message: string;
};

type DevService = {
  getInstallUrl(port?: number): string;
  isOwnedDevServerCommand(commandLine: string, rootDir: string): boolean;
  probeDevServer(options: {
    port?: number;
    expectedPluginId: string;
    fetchJson: (url: string) => Promise<{ statusCode: number; json: Record<string, unknown> }>;
    fetchStatus: (url: string) => Promise<number>;
  }): Promise<ProbeResult>;
};

function loadService(): DevService {
  return require('../scripts/dev-service.cjs') as DevService;
}

describe('RemNote background dev service', () => {
  test('reports connection refusal with the durable recovery command', async () => {
    const service = loadService();
    const result = await service.probeDevServer({
      expectedPluginId: 'remnote-chatgpt-bridge',
      fetchJson: async () => {
        throw new Error('connect ECONNREFUSED 127.0.0.1:8080');
      },
      fetchStatus: async () => 404,
    });

    expect(result).toEqual({
      status: 'stopped',
      message: 'RemNote dev server is stopped. Run: npm run dev:start',
    });
  });

  test('distinguishes a foreign service from the expected plugin', async () => {
    const service = loadService();
    const result = await service.probeDevServer({
      expectedPluginId: 'remnote-chatgpt-bridge',
      fetchJson: async () => ({ statusCode: 200, json: { id: 'different-app' } }),
      fetchStatus: async () => 200,
    });

    expect(result.status).toBe('port_conflict');
    expect(result.message).toContain('Port 8080');
  });

  test('requires both widget assets before declaring the install URL ready', async () => {
    const service = loadService();
    const result = await service.probeDevServer({
      expectedPluginId: 'remnote-chatgpt-bridge',
      fetchJson: async () => ({
        statusCode: 200,
        json: { id: 'remnote-chatgpt-bridge' },
      }),
      fetchStatus: async (url) => url.endsWith('.js') ? 200 : 404,
    });

    expect(result.status).toBe('asset_missing');
    expect(result.message).toContain('bridge-status-sandbox.css');
  });

  test('returns the exact RemNote install URL only for a ready server', async () => {
    const service = loadService();
    const result = await service.probeDevServer({
      expectedPluginId: 'remnote-chatgpt-bridge',
      fetchJson: async () => ({
        statusCode: 200,
        json: { id: 'remnote-chatgpt-bridge' },
      }),
      fetchStatus: async () => 200,
    });

    expect(result).toEqual({
      status: 'ready',
      message: 'RemNote dev server ready: http://localhost:8080',
    });
    expect(service.getInstallUrl()).toBe('http://localhost:8080');
  });

  test('recognizes only this repository dev server before stopping a PID', () => {
    const service = loadService();
    const root = '/workspace/remnote-plugin';

    expect(
      service.isOwnedDevServerCommand(
        `/usr/bin/node\0${root}/scripts/dev-server.cjs\0`,
        root
      )
    ).toBe(true);
    expect(
      service.isOwnedDevServerCommand('/usr/bin/node\0/usr/local/bin/other-server.js\0', root)
    ).toBe(false);
  });
});
