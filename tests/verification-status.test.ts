import { describe, expect, test } from 'vitest';
import {
  assertAuditStatusHonesty,
  liveRequiredStatus,
  registryPresenceStatus,
  runtimePassStatus,
  sourceReadinessStatus,
} from '../server/src/verification-status';

describe('verification status classification', () => {
  test('static/source readiness never becomes runtime PASS', () => {
    expect(sourceReadinessStatus(true)).toBe('READY_FOR_RUNTIME_TEST');
    expect(registryPresenceStatus(true)).toBe('REGISTRY_PRESENT');
    expect(() =>
      assertAuditStatusHonesty({
        status: 'PASS',
        verificationLayer: 'static_source',
        durationMs: 12,
      })
    ).toThrow('Static/source verification row cannot use runtime PASS.');
  });

  test('runtime PASS requires real duration', () => {
    expect(runtimePassStatus(true, 0)).toBe('NOT_RUN');
    expect(runtimePassStatus(true, 1)).toBe('PASS');
    expect(() =>
      assertAuditStatusHonesty({
        status: 'PASS',
        verificationLayer: 'unit',
        durationMs: 0,
      })
    ).toThrow('Runtime PASS row must have durationMs > 0.');
  });

  test('live plugin not run is explicit', () => {
    expect(liveRequiredStatus(undefined)).toBe('LIVE_TEST_NOT_RUN');
    expect(liveRequiredStatus(false)).toBe('BLOCKED_PLUGIN_NOT_CONNECTED');
  });
});
