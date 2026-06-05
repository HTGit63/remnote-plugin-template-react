export const BRIDGE_COMMAND_INTENT_STORAGE_KEY = 'remnotemcp-command-intent-v1';

export type BridgeCommandIntentKind =
  | 'run_health_check'
  | 'save_focused_template'
  | 'use_focused_as_approved_root'
  | 'copy_mcp_url'
  | 'copy_diagnostics'
  | 'open_settings';

export interface BridgeCommandIntent {
  id: string;
  kind: BridgeCommandIntentKind;
  requestedAt: string;
}

export function createBridgeCommandIntent(kind: BridgeCommandIntentKind): BridgeCommandIntent {
  return {
    id: `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    requestedAt: new Date().toISOString(),
  };
}
