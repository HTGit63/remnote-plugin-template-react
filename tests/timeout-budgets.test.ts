import { describe, expect, test } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DEFAULT_TIMEOUT_BUDGETS, loadConfig } from '../server/src/config';
import { estimateWriteTimeoutMs } from '../server/src/tools/tool-context';

describe('bridge timeout budgets', () => {
  test('loads safe defaults and falls back on invalid env overrides', () => {
    const config = loadConfig({
      REMNOTE_BRIDGE_TOKEN: 'token',
      REMNOTE_BRIDGE_DEFAULT_REQUEST_TIMEOUT_MS: '-1',
      REMNOTE_BRIDGE_HIGH_LEVEL_WRITE_TIMEOUT_MS: 'not-a-number',
      REMNOTE_BRIDGE_BULK_STEP_TIMEOUT_MS: '999999999',
      REMNOTE_BRIDGE_RECONNECT_RETRY_WINDOW_MS: '30000',
      REMNOTE_BRIDGE_RECONNECT_RETRY_INTERVAL_MS: '250',
    });

    expect(config.requestTimeoutMs).toBe(DEFAULT_TIMEOUT_BUDGETS.defaultRequestTimeoutMs);
    expect(config.timeoutBudgets.highLevelWriteTimeoutMs).toBe(DEFAULT_TIMEOUT_BUDGETS.highLevelWriteTimeoutMs);
    expect(config.timeoutBudgets.bulkStepTimeoutMs).toBe(300000);
    expect(config.timeoutBudgets.reconnectRetryWindowMs).toBe(30000);
    expect(config.timeoutBudgets.reconnectRetryIntervalMs).toBe(250);
  });

  test('estimates larger budgets for bulk import chunks', () => {
    const readTimeout = estimateWriteTimeoutMs({
      tool: 'get_rem',
      args: { remId: 'r1' },
    });
    const smallWriteTimeout = estimateWriteTimeoutMs({
      tool: 'create_rem',
      args: { parentId: 'p1', markdown: 'short' },
    });
    const bulkTimeout = estimateWriteTimeoutMs({
      tool: 'create_or_replace_note_from_markdown',
      args: {
        markdownText: 'x'.repeat(12000),
        safetyOptions: { verifyAfterWrite: true },
        isBulkImportStep: true,
      },
      isBulkImportStep: true,
      charCount: 12000,
      nodeCount: 80,
      hasVerification: true,
    });

    expect(readTimeout).toBeGreaterThanOrEqual(DEFAULT_TIMEOUT_BUDGETS.readTimeoutMs);
    expect(smallWriteTimeout).toBeGreaterThanOrEqual(DEFAULT_TIMEOUT_BUDGETS.mutationTimeoutMs);
    expect(bulkTimeout).toBeGreaterThanOrEqual(DEFAULT_TIMEOUT_BUDGETS.bulkStepTimeoutMs);
  });

  test('loads explicit source roots and caps source files at the bridge message limit', () => {
    const allowedRoot = mkdtempSync(join(tmpdir(), 'remnote-source-root-'));
    const config = loadConfig({
      REMNOTE_BRIDGE_TOKEN: 'token',
      REMNOTE_MCP_SOURCE_FILE_ALLOW_ROOTS: allowedRoot,
      REMNOTE_MCP_SOURCE_FILE_MAX_BYTES: '4096',
      REMNOTE_BRIDGE_MAX_WS_MESSAGE_BYTES: '1024',
    });

    expect(config.sourceFileAllowRoots).toContain(allowedRoot);
    expect(config.maxSourceFileBytes).toBe(1024);
  });

  test('hard-caps request, WebSocket, and source-file sizes even when env values are unsafe', () => {
    const config = loadConfig({
      REMNOTE_BRIDGE_TOKEN: 'token',
      REMNOTE_BRIDGE_MAX_BODY_BYTES: String(512 * 1024 * 1024),
      REMNOTE_BRIDGE_MAX_WS_MESSAGE_BYTES: String(512 * 1024 * 1024),
      REMNOTE_MCP_SOURCE_FILE_MAX_BYTES: String(512 * 1024 * 1024),
    });

    expect(config.maxBodyBytes).toBe(2 * 1024 * 1024);
    expect(config.maxBridgeMessageBytes).toBe(8 * 1024 * 1024);
    expect(config.maxSourceFileBytes).toBe(2 * 1024 * 1024);
  });

  test('rejects relative source-root env overrides', () => {
    expect(() => loadConfig({
      REMNOTE_BRIDGE_TOKEN: 'token',
      REMNOTE_MCP_SOURCE_FILE_ALLOW_ROOTS: '../unsafe-relative-root',
    })).toThrow('REMNOTE_MCP_SOURCE_FILE_ALLOW_ROOTS must contain absolute paths');
  });
});
