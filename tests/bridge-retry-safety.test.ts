import { describe, expect, test } from 'vitest';
import { mutationCouldHaveStarted } from '../server/src/bridge/bridge-hub-retry';
import { extractCreatedRemIds, getUpdatedDeletedEvidence } from '../server/src/bridge/bridge-hub-evidence';

describe('bridge unknown-write classification', () => {
  test('honors explicit timeout mutation evidence', () => {
    expect(mutationCouldHaveStarted({
      id: 'timeout-details',
      ok: false,
      error: {
        code: 'TIMEOUT',
        message: 'Timed out.',
        details: { mutationCouldHaveStarted: true },
      },
    })).toBe(true);
  });

  test('treats executing lifecycle as possible mutation', () => {
    expect(mutationCouldHaveStarted({
      id: 'timeout-executing',
      ok: false,
      error: { code: 'TIMEOUT', message: 'Timed out.' },
      lifecycle: [{ phase: 'executing', at: new Date().toISOString() }],
    })).toBe(true);
  });

  test('does not treat transport forwarding alone as mutation evidence', () => {
    expect(mutationCouldHaveStarted({
      id: 'forwarded-only',
      ok: false,
      error: { code: 'PLUGIN_NOT_CONNECTED', message: 'Socket closed while sending.' },
      lifecycle: [{ phase: 'forwarded_to_plugin', at: new Date().toISOString() }],
    })).toBe(false);
  });

  test('extracts nested partial mutation identity from wrapped failure evidence', () => {
    const response = {
      id: 'wrapped-partial',
      ok: false as const,
      error: {
        code: 'TIMEOUT' as const,
        message: 'Timed out after a wrapped partial result.',
        details: {
          originalError: {
            details: {
              createdRemIds: ['created-deep'],
              updatedRemIds: ['updated-deep'],
              partialExecution: { createdRemIds: ['created-partial'] },
            },
          },
          originalDetails: {
            createdRemId: 'created-original',
            updatedRemIds: ['updated-original'],
          },
        },
      },
    };

    expect(extractCreatedRemIds(response)).toEqual(expect.arrayContaining([
      'created-deep',
      'created-partial',
      'created-original',
    ]));
    expect(getUpdatedDeletedEvidence(response).updatedRemIds).toEqual(expect.arrayContaining([
      'updated-deep',
      'updated-original',
    ]));
  });
});
