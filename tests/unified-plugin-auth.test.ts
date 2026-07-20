import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { getRuntimeInfo, loadConfig } from '../server/src/config';

const legacyEnvName = ['REMNOTE', 'CODEX', 'TOKEN'].join('_');
const legacyAuthMode = ['codex', 'bearer'].join('_');
const legacyPairingError = ['CODEX', 'PAIRING', 'REQUIRED'].join('_');
const legacyRoute = ['/codex', '/pair'].join('');
const legacyConfigField = ['codex', 'Token'].join('');
const legacyDocsLabel = ['Codex', ' bearer'].join('');

function repositoryTextFiles(): string[] {
  return execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard'],
    { cwd: process.cwd(), encoding: 'utf8' }
  )
    .split('\n')
    .filter(Boolean)
    .filter((file) => existsSync(resolve(process.cwd(), file)))
    .filter((file) => ['.ts', '.tsx', '.js', '.cjs', '.json', '.md', '.yaml', '.yml'].includes(extname(file)));
}

describe('unified ChatGPT and Codex plugin authentication', () => {
  test('hosted runtime ignores the retired client secret and advertises only hosted OAuth pairing', () => {
    const config = loadConfig({
      NODE_ENV: 'test',
      REMNOTE_BRIDGE_DEPLOYMENT_MODE: 'hosted',
      REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING: '1',
      REMNOTE_BRIDGE_PUBLIC_BASE_URL: 'https://remnote.example',
      SESSION_SECRET: 'test-session-secret',
      [legacyEnvName]: 'retired-client-secret',
    });
    const runtime = getRuntimeInfo(config, { mcpPort: 443, bridgePort: 443 });

    expect(config).not.toHaveProperty(legacyConfigField);
    expect(runtime.authModesSupported).toEqual(['hosted_pairing']);
    expect(runtime).not.toHaveProperty('codexBearerAuthAvailable');
    expect(runtime).not.toHaveProperty('codexBearerAuthConfigured');
  });

  test('repository has no custom Codex authentication lane or pairing route', () => {
    const forbidden = [
      legacyEnvName,
      legacyAuthMode,
      legacyPairingError,
      legacyRoute,
      legacyConfigField,
      legacyDocsLabel,
    ];
    const offenders = repositoryTextFiles().flatMap((file) => {
      const source = readFileSync(resolve(process.cwd(), file), 'utf8');
      return forbidden
        .filter((value) => source.includes(value))
        .map((value) => `${file}: ${value}`);
    });

    expect(offenders).toEqual([]);
    for (const file of [
      'server/src/auth/codex-token.ts',
      'server/src/auth/codex-pairing-routes.ts',
      'server/src/codex-bearer-smoke.ts',
      'server/src/codex-pairing-smoke.ts',
      'server/src/codex-routing-smoke.ts',
    ]) {
      expect(existsSync(resolve(process.cwd(), file)), file).toBe(false);
    }
  });

  test('built RemNote plugin archive is explicitly published from the repository', () => {
    const ignore = readFileSync(resolve(process.cwd(), '.gitignore'), 'utf8');

    expect(ignore).toContain('!PluginZip.zip');
    expect(existsSync(resolve(process.cwd(), 'PluginZip.zip'))).toBe(true);
  });
});
