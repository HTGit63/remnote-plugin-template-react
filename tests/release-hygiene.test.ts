import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import manifest from '../public/manifest.json';

const repositoryRoot = resolve(__dirname, '..');

describe('public release hygiene', () => {
  test('publishes the RemNote plugin as version 0.1.1', () => {
    expect(manifest.version).toEqual({ major: 0, minor: 1, patch: 1 });
  });

  test('keeps the root README for general RemNote users', () => {
    const readme = readFileSync(resolve(repositoryRoot, 'README.md'), 'utf8');

    expect(readme).toContain('# RemNote MCP');
    expect(readme).toContain('## Install the plugin');
    expect(readme).toContain('## Security and permissions');
    expect(readme).not.toMatch(/judge|hackathon|build week|devpost/i);
  });

  test('does not publish generated Graphify output on the release branch', () => {
    expect(existsSync(resolve(repositoryRoot, 'graphify-out'))).toBe(false);
  });
});
