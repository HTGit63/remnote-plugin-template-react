import { describe, expect, test, vi } from 'vitest';
import {
  collectBridgePanelHealth,
  copyTextToClipboard,
  disconnectBridgeRuntimeSafely,
} from '../src/widgets/bridge-panel/runtime-actions';

describe('bridge panel runtime actions', () => {
  test('disconnects locally even when remote revocation is offline', async () => {
    const disableLocal = vi.fn(async () => undefined);
    const clearLocal = vi.fn(async () => undefined);
    const result = await disconnectBridgeRuntimeSafely({
      disableLocal,
      revokeRemote: vi.fn(async () => { throw new Error('network offline'); }),
      clearLocal,
    });

    expect(disableLocal).toHaveBeenCalledTimes(1);
    expect(clearLocal).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      remoteRevocationConfirmed: false,
      warning: 'network offline',
    });
  });

  test('clipboard copy falls back when the async Clipboard API is blocked', async () => {
    const legacyCopy = vi.fn(() => true);
    const method = await copyTextToClipboard('safe diagnostics', {
      clipboardWrite: vi.fn(async () => { throw new Error('NotAllowedError'); }),
      legacyCopy,
    });

    expect(method).toBe('legacy');
    expect(legacyCopy).toHaveBeenCalledWith('safe diagnostics');
  });

  test('clipboard copy reports failure when both mechanisms are unavailable', async () => {
    await expect(copyTextToClipboard('diagnostics', {
      clipboardWrite: vi.fn(async () => { throw new Error('blocked'); }),
      legacyCopy: vi.fn(() => false),
    })).rejects.toThrow(/clipboard/i);
  });

  test('hosted diagnostics still complete when the public health request is blocked', async () => {
    const result = await collectBridgePanelHealth({
      loadPublicHealth: async () => { throw new Error('public endpoint blocked'); },
      loadDiagnostics: async () => ({ ok: true, status: 'PASS', pluginConnected: true }),
    });

    expect(result.ok).toBe(true);
    expect(result.health).toMatchObject({ ok: false });
    expect(result.diagnostics).toMatchObject({ status: 'PASS' });
    expect(result.warnings).toEqual(expect.arrayContaining([expect.stringMatching(/public endpoint blocked/i)]));
  });

  test('health collection fails only when every source fails', async () => {
    const result = await collectBridgePanelHealth({
      loadPublicHealth: async () => { throw new Error('health offline'); },
      loadDiagnostics: async () => { throw new Error('diagnostics offline'); },
    });

    expect(result.ok).toBe(false);
    expect(result.warnings).toHaveLength(2);
  });

  test('keeps a failed public-health signal visible when authenticated diagnostics pass', async () => {
    const result = await collectBridgePanelHealth({
      loadPublicHealth: async () => ({ ok: false, error: 'plugin heartbeat stale' }),
      loadDiagnostics: async () => ({ ok: true, status: 'PASS' }),
    });

    expect(result.ok).toBe(true);
    expect(result.warnings).toEqual(expect.arrayContaining([expect.stringMatching(/heartbeat stale/i)]));
  });
});
