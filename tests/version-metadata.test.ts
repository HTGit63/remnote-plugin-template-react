import { describe, expect, test } from 'vitest';
import packageJson from '../package.json';
import { PACKAGE_VERSION, SERVER_VERSION } from '../server/src/tool-registry';

describe('server version metadata', () => {
  test('server version follows package version', () => {
    expect(PACKAGE_VERSION).toBe(packageJson.version);
    expect(SERVER_VERSION).toBe(packageJson.version);
  });
});
