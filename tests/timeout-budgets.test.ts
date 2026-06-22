import { describe, expect, test } from 'vitest';
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
});
