export type VerificationLayer =
  | 'static_source'
  | 'unit'
  | 'mock_plugin'
  | 'local_mcp_server'
  | 'live_remnote_plugin';

export type VerificationStatus =
  | 'SOURCE_PRESENT'
  | 'REGISTRY_PRESENT'
  | 'READY_FOR_RUNTIME_TEST'
  | 'READY_FOR_LIVE_TEST'
  | 'PASS'
  | 'FAIL'
  | 'PARTIAL'
  | 'GATED'
  | 'UNSUPPORTED'
  | 'SKIPPED'
  | 'BLOCKED_BY_PERMISSION'
  | 'BLOCKED_BY_PROFILE'
  | 'PLATFORM_BLOCKED'
  | 'BLOCKED_PLUGIN_NOT_CONNECTED'
  | 'SKIPPED_PLUGIN_NOT_CONNECTED'
  | 'LIVE_TEST_NOT_RUN'
  | 'SKIPPED_NOT_CONFIGURED'
  | 'NOT_RUN';

export function registryPresenceStatus(present: boolean): VerificationStatus {
  return present ? 'REGISTRY_PRESENT' : 'FAIL';
}

export function sourceReadinessStatus(ready: boolean): VerificationStatus {
  return ready ? 'READY_FOR_RUNTIME_TEST' : 'FAIL';
}

export function liveRequiredStatus(pluginConnected: boolean | undefined): VerificationStatus {
  if (pluginConnected === false) {
    return 'BLOCKED_PLUGIN_NOT_CONNECTED';
  }
  return 'LIVE_TEST_NOT_RUN';
}

export function runtimePassStatus(executed: boolean, durationMs: number): VerificationStatus {
  return executed && durationMs > 0 ? 'PASS' : 'NOT_RUN';
}

export function staticStatusFix(ready: boolean, failureFix: string): string {
  return ready
    ? 'Static/source readiness only. Run unit, mock-plugin, local MCP, or live RemNote proof before treating this as runtime PASS.'
    : failureFix;
}

export function staticStatusError(ready: boolean, failureCode: string): string {
  return ready ? 'STATIC_READINESS_ONLY' : failureCode;
}

export function staticStatusRoot(ready: boolean, failureRoot: string): string {
  return ready ? 'static_readiness_only' : failureRoot;
}

export function assertAuditStatusHonesty(input: {
  status: VerificationStatus;
  verificationLayer: VerificationLayer;
  durationMs: number;
}): void {
  if (input.status === 'PASS' && input.verificationLayer === 'static_source') {
    throw new Error('Static/source verification row cannot use runtime PASS.');
  }
  if (input.status === 'PASS' && input.durationMs <= 0) {
    throw new Error('Runtime PASS row must have durationMs > 0.');
  }
}
