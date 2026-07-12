import { renderWidget, usePlugin, useTrackerPlugin as useTracker } from '@remnote/plugin-sdk';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import '../style.css';
import '../index.css';
import {
  type ApprovalResolution,
  type BridgeToolProfile,
  type BridgeToolName,
  type BridgeResponse,
  type NoteDesignTemplateSummary,
  type PendingApprovalRequest,
  type PermissionMode,
  type PermissionScope,
  BRIDGE_TOOL_ANNOTATIONS,
  BRIDGE_TOOL_NAMES,
  WRITE_APPROVAL_TIMEOUT_MS,
} from '../bridge/protocol';
import {
  DEFAULT_BRIDGE_SERVER_URL,
  INITIAL_BRIDGE_STATUS,
  getBridgeNextAction,
  getBridgeStatusLabel,
} from '../bridge/status';
import { BrowserBridgeClient } from '../bridge/client';
import {
  clearHostedPairingSession,
  approveChatGptPairing,
  denyChatGptPairing,
  disconnectChatGptPairing,
  fetchHostedPluginDiagnostics,
  fetchPluginToolTier,
  lookupChatGptPairing,
  loadHostedPairingSession,
  normalizeBridgeToolTier,
  runHostedPluginHealthCheck,
  saveHostedPairingSession,
  updatePluginToolTier,
  TOOL_TIER_STORAGE_KEY,
  type HostedPairingSession,
  type PluginToolTierState,
  type ChatGptPairingPreview,
} from '../bridge/pairing';
import {
  BridgeTaskBanner,
  BridgeWidgetHeader,
  ToolProfileSummary,
} from './components/BridgeWidgetPieces';
import {
  permissionModeOptions,
  permissionScopeOptions,
  toolTierOptions,
} from './bridge-panel/options';
import {
  BRIDGE_COMMAND_INTENT_STORAGE_KEY,
  type BridgeCommandIntent,
} from './bridge-panel/command-intents';
import {
  deriveBridgeActivity,
  deriveBridgeUiConnectionState,
} from './bridge-panel/ui-state';
import {
  getPermissionDecision,
  getPermissionModeLabel,
  getPermissionScopeLabel,
  normalizePermissionMode,
  normalizePermissionScope,
} from '../remnote/permissions';
import { getCurrentSelection, getFocusedRemStatus } from '../remnote/read';
import {
  listNoteDesignTemplates,
  saveNoteDesignTemplate,
} from '../remnote/templates/designTemplates';

const statusToneClass: Record<string, string> = {
  connected: 'bridge-pill bridge-pill-success',
  connecting: 'bridge-pill bridge-pill-warning',
  disconnected: 'bridge-pill bridge-pill-muted',
  error: 'bridge-pill bridge-pill-danger',
  not_paired: 'bridge-pill bridge-pill-muted',
  pairing: 'bridge-pill bridge-pill-warning',
  paired_offline: 'bridge-pill bridge-pill-warning',
  reconnecting: 'bridge-pill bridge-pill-warning',
  server_unreachable: 'bridge-pill bridge-pill-danger',
  token_expired: 'bridge-pill bridge-pill-danger',
  session_revoked: 'bridge-pill bridge-pill-danger',
  device_conflict: 'bridge-pill bridge-pill-danger',
  stale_connection: 'bridge-pill bridge-pill-warning',
};

const LOCAL_PAIRING_DISABLED_MESSAGE =
  'Server is in local-token mode. ChatGPT pairing is disabled. Use hosted mode for ChatGPT connector access.';
const STANDARD_PERMISSION_MODE_OPTIONS = permissionModeOptions.filter(
  (option) =>
    option.value !== 'full_control_delete_approval' && option.value !== 'danger_zone'
);
const STANDARD_TOOL_TIER_OPTIONS = toolTierOptions.filter((option) => option.value !== 'danger');

function formatToolName(tool: BridgeToolName): string {
  return tool.replace(/_/g, ' ');
}

function getToolImpactLabel(tool: BridgeToolName): string {
  const annotations = BRIDGE_TOOL_ANNOTATIONS[tool];

  if (annotations.readOnlyHint) {
    return 'Read only';
  }

  if (annotations.destructiveHint) {
    return 'Destructive write';
  }

  return 'Safe write';
}

function bridgeToolNameForMcpName(tool: string): BridgeToolName | null {
  if (tool === 'ping_remnote_plugin') {
    return 'ping';
  }
  if (tool === 'get_plugin_status') {
    return 'get_status';
  }
  return (BRIDGE_TOOL_NAMES as readonly string[]).includes(tool) ? (tool as BridgeToolName) : null;
}

function summarizeToolAvailability(publicTools: string[] | undefined, mode: PermissionMode) {
  const tools = publicTools ?? [];
  let free = 0;
  let gated = 0;
  let blocked = 0;

  for (const tool of tools) {
    const bridgeTool = bridgeToolNameForMcpName(tool);
    if (!bridgeTool) {
      free += 1;
      continue;
    }

    const annotations = BRIDGE_TOOL_ANNOTATIONS[bridgeTool];
    if (annotations.readOnlyHint) {
      free += 1;
    } else if (annotations.destructiveHint) {
      gated += 1;
    } else if (mode === 'read_only') {
      blocked += 1;
    } else if (mode === 'read_create' || mode === 'read_create_modify') {
      gated += 1;
    } else {
      free += 1;
    }
  }

  return { free, gated, blocked };
}

function companionHttpUrl(serverUrl: string, pathname: '/health' | '/diagnostics' | '/mcp'): string {
  const url = new URL(serverUrl);
  url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
  if (url.port === '47391') {
    url.port = '47392';
  }
  url.pathname = pathname;
  url.search = '';
  url.hash = '';
  return url.toString();
}

function isHostedBridgeUrl(serverUrl: string): boolean {
  return (
    serverUrl.startsWith('wss://') &&
    !serverUrl.includes('localhost') &&
    !serverUrl.includes('127.0.0.1')
  );
}

function getFriendlyPairingError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return 'Could not reach Render pairing endpoint. Check CORS, server URL, or deployment status.';
  }
  if (/unexpected token|not valid json/i.test(message)) {
    return 'Pairing request failed. Open browser DevTools or Render logs to see the exact error.';
  }
  return message || 'Pairing request failed. Open browser DevTools or Render logs to see the exact error.';
}

function runtimeDeploymentMode(report: Record<string, unknown> | null): 'local' | 'hosted' | null {
  const deployment = report?.deployment;
  if (typeof deployment === 'object' && deployment !== null) {
    const mode = (deployment as { deploymentMode?: unknown }).deploymentMode;
    if (mode === 'local' || mode === 'hosted') {
      return mode;
    }
  }

  const server = report?.server;
  if (typeof server === 'object' && server !== null) {
    const mode = (server as { deploymentMode?: unknown }).deploymentMode;
    if (mode === 'local' || mode === 'hosted') {
      return mode;
    }
  }

  return null;
}

function runtimeHostedPairingEnabled(report: Record<string, unknown> | null): boolean | null {
  const deployment = report?.deployment;
  if (typeof deployment === 'object' && deployment !== null) {
    const enabled = (deployment as { hostedPairingEnabled?: unknown }).hostedPairingEnabled;
    if (typeof enabled === 'boolean') {
      return enabled;
    }
  }

  const server = report?.server;
  if (typeof server === 'object' && server !== null) {
    const enabled = (server as { hostedPairingEnabled?: unknown }).hostedPairingEnabled;
    if (typeof enabled === 'boolean') {
      return enabled;
    }
  }

  return null;
}

function toolCountForTier(summary: Record<string, unknown> | undefined, tier: BridgeToolProfile): number {
  const tiers = summary?.tiers;
  if (typeof tiers !== 'object' || tiers === null || Array.isArray(tiers)) {
    return 0;
  }
  const tools = (tiers as Record<string, unknown>)[tier];
  return Array.isArray(tools) ? tools.length : 0;
}

function runtimeVerificationMatrixFrom(report: Record<string, unknown> | null, bridgeStatus: { runtimeVerificationMatrix?: Array<Record<string, unknown>> }) {
  const direct = report?.runtimeVerificationMatrix;
  if (Array.isArray(direct)) {
    return direct;
  }
  const registry = report?.registry;
  if (typeof registry === 'object' && registry !== null) {
    const matrix = (registry as { runtimeVerificationMatrix?: unknown }).runtimeVerificationMatrix;
    if (Array.isArray(matrix)) {
      return matrix as Array<Record<string, unknown>>;
    }
  }
  return bridgeStatus.runtimeVerificationMatrix ?? [];
}

function lastRequestsFrom(report: Record<string, unknown> | null): Array<Record<string, unknown>> {
  const bridge = report?.bridge;
  if (
    typeof bridge === 'object' &&
    bridge !== null &&
    Array.isArray((bridge as { recentRequests?: unknown }).recentRequests)
  ) {
    return (bridge as { recentRequests: Array<Record<string, unknown>> }).recentRequests;
  }
  return [];
}

const CLIENT_REDACT_KEYS = [
  /token/i,
  /secret/i,
  /authorization/i,
  /cookie/i,
  /markdown/i,
  /plainText/i,
  /frontText/i,
  /backText/i,
  /rawText/i,
  /richText/i,
  /^args$/i,
  /^content$/i,
];

function redactClientDiagnosticValue(value: unknown, depth = 0): unknown {
  if (depth > 8) {
    return '[REDACTED_DEPTH_LIMIT]';
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactClientDiagnosticValue(item, depth + 1));
  }
  if (typeof value !== 'object' || value === null) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
      key,
      CLIENT_REDACT_KEYS.some((pattern) => pattern.test(key))
        ? '[REDACTED]'
        : redactClientDiagnosticValue(nested, depth + 1),
    ])
  );
}

function publicUserSummaryFrom(report: Record<string, unknown> | null): Record<string, unknown> | null {
  const direct = report?.publicUserSummary;
  if (typeof direct === 'object' && direct !== null && !Array.isArray(direct)) {
    return direct as Record<string, unknown>;
  }
  const summary = report?.summary;
  if (typeof summary === 'object' && summary !== null && !Array.isArray(summary)) {
    const nested = (summary as Record<string, unknown>).publicUserSummary;
    if (typeof nested === 'object' && nested !== null && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
  }
  return null;
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="bridge-detail-row">
      <div className="bridge-detail-label">{label}</div>
      <div className={['bridge-detail-value', mono ? 'bridge-detail-value--mono' : ''].filter(Boolean).join(' ')}>
        {value}
      </div>
    </div>
  );
}

function StatusMetric({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  return (
    <div className={['bridge-metric', `bridge-metric--${tone}`].join(' ')}>
      <div className="bridge-metric-label">{label}</div>
      <div className="bridge-metric-value">{value}</div>
    </div>
  );
}

export function BridgeStatusWidget() {
  const plugin = usePlugin();
  const [pendingRequest, setPendingRequest] = useState<PendingApprovalRequest | null>(null);
  const [lastApprovalEvent, setLastApprovalEvent] = useState('No approval activity yet.');
  const [bridgeStatus, setBridgeStatus] = useState(INITIAL_BRIDGE_STATUS);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [bridgeEnabled, setBridgeEnabled] = useState(true);
  const [runtimePermissionMode, setRuntimePermissionMode] = useState<PermissionMode | null>(null);
  const [runtimePermissionScope, setRuntimePermissionScope] = useState<PermissionScope | null>(null);
  const [runtimeApprovedRootRemId, setRuntimeApprovedRootRemId] = useState<string | null>(null);
  const [lastHealthCheck, setLastHealthCheck] = useState<Record<string, unknown> | null>(null);
  const [lastServerDiagnostics, setLastServerDiagnostics] = useState<Record<string, unknown> | null>(null);
  const [debugCopyStatus, setDebugCopyStatus] = useState('No debug copy yet.');
  const [hostedSession, setHostedSession] = useState<HostedPairingSession | null>(null);
  const [selectedToolTier, setSelectedToolTier] = useState<BridgeToolProfile>('note_writer');
  const [toolTierState, setToolTierState] = useState<PluginToolTierState | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<NoteDesignTemplateSummary[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateStatus, setTemplateStatus] = useState('No template selected.');
  const [pairingEvent, setPairingEvent] = useState('Open ChatGPT connector auth, then enter the Render pairing code here.');
  const [chatGptPairingCode, setChatGptPairingCode] = useState('');
  const [localConnectionLabel, setLocalConnectionLabel] = useState('');
  const [chatGptPairingPreview, setChatGptPairingPreview] = useState<ChatGptPairingPreview | null>(null);
  const handledIntentIdsRef = useRef<Set<string>>(new Set());
  const approvalResolverRef = useRef<((resolution: ApprovalResolution) => void) | undefined>();
  const approvalTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>();
  const pendingRequestRef = useRef<PendingApprovalRequest | null>(null);
  const permissionModeRef = useRef<PermissionMode>('read_create_modify');
  const permissionScopeRef = useRef<PermissionScope>('focused_rem_and_descendants');
  const approvedRootRemIdRef = useRef<string | null>(null);
  const clientRef = useRef<BrowserBridgeClient | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [activeOperation, setActiveOperation] = useState<string | null>(null);
  const [lastOperationError, setLastOperationError] = useState<string | null>(null);
  const [lastPluginResult, setLastPluginResult] = useState<{
    tool: BridgeToolName;
    ok: boolean;
    message: string;
  } | null>(null);
  const [dangerConfirmText, setDangerConfirmText] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([
      loadHostedPairingSession(plugin),
      plugin.storage.getLocal<BridgeToolProfile>(TOOL_TIER_STORAGE_KEY),
      plugin.settings.getSetting<string>('bridge-tool-access-tier'),
      plugin.storage.getLocal<PermissionMode>('bridge-permission-mode'),
      plugin.storage.getLocal<PermissionScope>('bridge-permission-scope'),
      plugin.storage.getLocal<string>('bridge-approved-root-rem-id'),
      plugin.storage.getLocal<string>('bridge-selected-template-id'),
    ])
      .then(([session, storedTier, settingTier, storedMode, storedScope, storedRoot, storedTemplateId]) => {
        if (alive) {
          setHostedSession(session);
          setSelectedToolTier(normalizeBridgeToolTier(storedTier ?? settingTier ?? session?.toolTier));
          if (storedMode) {
            setRuntimePermissionMode(normalizePermissionMode(storedMode));
          }
          if (storedScope) {
            setRuntimePermissionScope(normalizePermissionScope(storedScope));
          }
          if (storedRoot) {
            setRuntimeApprovedRootRemId(storedRoot);
          }
          if (storedTemplateId) {
            setSelectedTemplateId(storedTemplateId);
            setTemplateStatus('Saved template selected.');
          }
        }
      })
      .catch((error: unknown) => {
        console.error('BridgeStatusWidget: failed to load hosted pairing session', error);
      });
    return () => {
      alive = false;
    };
  }, [plugin]);

  const serverUrl =
    useTracker(async (reactivePlugin) => {
      const configuredUrl = await reactivePlugin.settings.getSetting<string>('bridge-server-url');
      return configuredUrl?.trim() || DEFAULT_BRIDGE_SERVER_URL;
    }) ?? DEFAULT_BRIDGE_SERVER_URL;

  const bridgeToken =
    useTracker(async (reactivePlugin) => {
      const configuredToken = await reactivePlugin.settings.getSetting<string>('bridge-token');
      return configuredToken?.trim() || '';
    }) ?? '';

  const commandIntent = useTracker(async (reactivePlugin) => {
    return await reactivePlugin.storage.getSession<BridgeCommandIntent>(BRIDGE_COMMAND_INTENT_STORAGE_KEY);
  });

  const configuredPermissionMode = normalizePermissionMode(
    useTracker(async (reactivePlugin) => {
      return await reactivePlugin.settings.getSetting<string>('bridge-permission-mode');
    })
  );

  const configuredPermissionScope = normalizePermissionScope(
    useTracker(async (reactivePlugin) => {
      return await reactivePlugin.settings.getSetting<string>('bridge-permission-scope');
    })
  );

  const configuredApprovedRootRemId =
    useTracker(async (reactivePlugin) => {
      const configuredRoot = await reactivePlugin.settings.getSetting<string>('bridge-approved-root-rem-id');
      return configuredRoot?.trim() || null;
    }) ?? null;

  const permissionMode = runtimePermissionMode ?? configuredPermissionMode;
  const permissionScope = runtimePermissionScope ?? configuredPermissionScope;
  const approvedRootRemId = runtimeApprovedRootRemId ?? configuredApprovedRootRemId;

  const focusedRemStatus = useTracker(async (reactivePlugin) => {
    try {
      return await getFocusedRemStatus(reactivePlugin);
    } catch (error: unknown) {
      console.error('BridgeStatusWidget: failed to read focused Rem status', error);
      return {
        found: false,
        label: 'Focused Rem unavailable',
      };
    }
  });

  const currentSelection = useTracker(async (reactivePlugin) => {
    try {
      return await getCurrentSelection(reactivePlugin, {});
    } catch (error: unknown) {
      console.error('BridgeStatusWidget: failed to read current RemNote selection', error);
      return {
        focusedRemId: null,
        selectedRemIds: [],
        selectionSupported: false,
      };
    }
  });

  const pendingDecision = pendingRequest
    ? getPermissionDecision(permissionMode, pendingRequest.tool)
    : undefined;
  const toolAvailability = summarizeToolAvailability(bridgeStatus.publicTools, permissionMode);
  const hiddenToolCount = bridgeStatus.hiddenTools?.length ?? 0;
  const profileHiddenToolCount = bridgeStatus.profileHiddenTools?.length ?? 0;
  const lastRequests = lastRequestsFrom(lastServerDiagnostics);
  const latestFetchedRequest = lastRequests[0];
  const lastSuccessfulRequest = lastRequests.find((request) => request.ok === true);
  const lastFailedRequest = lastRequests.find((request) => request.ok === false);
  const reportedDeploymentMode =
    runtimeDeploymentMode(lastHealthCheck) ?? runtimeDeploymentMode(lastServerDiagnostics);
  const reportedHostedPairingEnabled =
    runtimeHostedPairingEnabled(lastHealthCheck) ?? runtimeHostedPairingEnabled(lastServerDiagnostics);
  const chatGptPairingDisabled =
    !isHostedBridgeUrl(serverUrl) ||
    reportedDeploymentMode === 'local' ||
    reportedHostedPairingEnabled === false;
  const effectiveHostedSession = chatGptPairingDisabled ? null : hostedSession;
  const requiresConnectorRefresh =
    Boolean(effectiveHostedSession?.requiresConnectorRefresh) ||
    Boolean(bridgeStatus.requiresConnectorRefresh) ||
    Boolean(toolTierState?.requiresConnectorRefresh);
  const sessionStale =
    requiresConnectorRefresh ||
    Boolean(toolTierState?.sessionStale) ||
    lastHealthCheck?.sessionStale === true;
  const uiConnectionState = deriveBridgeUiConnectionState({
    transportState: bridgeStatus.state,
    hosted: isHostedBridgeUrl(serverUrl),
    hasHostedSession: Boolean(effectiveHostedSession?.sessionSecret),
    requiresConnectorRefresh,
    toolTierSessionStale: Boolean(toolTierState?.sessionStale),
    health: lastHealthCheck,
  });
  const uiBridgeStatus = {
    ...bridgeStatus,
    state: uiConnectionState,
  };
  const activeServerToolTier =
    toolTierState?.activeToolTier ??
    bridgeStatus.activeToolTier ??
    bridgeStatus.toolTier ??
    bridgeStatus.toolProfile;
  const visibleTierSummary =
    toolTierState?.toolTierSummary ??
    bridgeStatus.toolTierSummary;
  const verificationMatrix = runtimeVerificationMatrixFrom(lastServerDiagnostics, bridgeStatus);
  const runtimeVerifiedCount = verificationMatrix.filter((tool) => tool.runtimeVerified === true).length;
  const serverLocalVerifiedCount = verificationMatrix.filter((tool) => tool.serverLocalVerified === true).length;
  const runtimeUnverifiedCount =
    (toolTierState?.registry?.runtimeUnverifiedToolCount as number | undefined) ??
    bridgeStatus.runtimeUnverifiedTools?.length ??
    verificationMatrix.filter((tool) => tool.runtimeVerified !== true && tool.serverLocalVerified !== true).length;
  const publicUserSummary = publicUserSummaryFrom(lastServerDiagnostics);
  const latestResultOk =
    lastPluginResult?.ok ??
    (typeof latestFetchedRequest?.ok === 'boolean' ? latestFetchedRequest.ok : null);
  const latestResultCopy = lastPluginResult?.message ??
    (publicUserSummary
      ? String(publicUserSummary.message ?? 'Summary ready.')
      : latestFetchedRequest
        ? `${String(latestFetchedRequest.tool ?? 'request')} ${latestResultOk ? 'completed' : 'failed'}.`
        : 'No tool result recorded yet.');

  const loadTemplates = useCallback(async () => {
    try {
      const result = await listNoteDesignTemplates(plugin, { includeRules: false });
      const templates = result.templates.filter(
        (template): template is NoteDesignTemplateSummary =>
          typeof (template as NoteDesignTemplateSummary).templateId === 'string' &&
          typeof (template as NoteDesignTemplateSummary).name === 'string'
      );
      setSavedTemplates(templates);
      if (templates.length === 0) {
        setTemplateStatus('No saved templates yet.');
      } else if (!selectedTemplateId) {
        setTemplateStatus(`${templates.length} saved template${templates.length === 1 ? '' : 's'} available.`);
      }
    } catch (error: unknown) {
      setTemplateStatus(error instanceof Error ? error.message : String(error));
    }
  }, [plugin, selectedTemplateId]);

  useEffect(() => {
    permissionModeRef.current = permissionMode;
  }, [permissionMode]);

  useEffect(() => {
    permissionScopeRef.current = permissionScope;
  }, [permissionScope]);

  useEffect(() => {
    approvedRootRemIdRef.current = approvedRootRemId;
  }, [approvedRootRemId]);

  useEffect(() => {
    pendingRequestRef.current = pendingRequest;
  }, [pendingRequest]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    if (!effectiveHostedSession?.sessionSecret || chatGptPairingDisabled) {
      setToolTierState(null);
      return;
    }
    let alive = true;
    fetchPluginToolTier(serverUrl, effectiveHostedSession)
      .then(async (state) => {
        if (!alive) {
          return;
        }
        setToolTierState(state);
        setSelectedToolTier(state.toolTier);
        const nextSession: HostedPairingSession = {
          ...effectiveHostedSession,
          toolTier: state.toolTier,
          accessScope: state.accessScope,
          trustedWriteMode: state.trustedWriteMode,
          requiresConnectorRefresh: state.requiresConnectorRefresh,
        };
        setHostedSession(nextSession);
        await saveHostedPairingSession(plugin, nextSession);
      })
      .catch((error: unknown) => {
        console.warn('BridgeStatusWidget: hosted tool tier sync failed', error);
      });
    return () => {
      alive = false;
    };
  }, [plugin, serverUrl, effectiveHostedSession?.sessionSecret, chatGptPairingDisabled]);

  useEffect(() => {
    setDeleteConfirmText('');
  }, [pendingRequest?.id]);

  const clearApprovalTimeout = () => {
    if (approvalTimeoutRef.current) {
      clearTimeout(approvalTimeoutRef.current);
      approvalTimeoutRef.current = undefined;
    }
  };

  const resolveApproval = useCallback(
    async (resolution: ApprovalResolution) => {
      if (!pendingRequest || !approvalResolverRef.current) {
        return;
      }

      clearApprovalTimeout();
      approvalResolverRef.current(resolution);
      approvalResolverRef.current = undefined;
      const approved = resolution === 'APPROVED';
      setLastApprovalEvent(
        `${approved ? 'Approved' : 'Rejected'} ${pendingRequest.tool} request ${pendingRequest.id}.`
      );
      setPendingRequest(null);
      await plugin.app.toast(approved ? 'Bridge request approved.' : 'Bridge request rejected.');
    },
    [pendingRequest, plugin]
  );

  const requestApproval = useCallback((request: PendingApprovalRequest): Promise<ApprovalResolution> => {
    if (approvalResolverRef.current) {
      setLastApprovalEvent(`Rejected ${request.tool} request ${request.id}: approval already pending.`);
      return Promise.resolve('APPROVAL_PENDING');
    }

    setPendingRequest(request);
    setLastApprovalEvent(`Awaiting approval for ${request.tool} request ${request.id}.`);

    return new Promise<ApprovalResolution>((resolve) => {
      const deadlineMs = new Date(request.timeoutDeadline).getTime();
      const timeoutMs = Number.isFinite(deadlineMs)
        ? Math.max(0, deadlineMs - Date.now())
        : WRITE_APPROVAL_TIMEOUT_MS;
      approvalResolverRef.current = resolve;
      approvalTimeoutRef.current = setTimeout(() => {
        approvalResolverRef.current = undefined;
        approvalTimeoutRef.current = undefined;
        setPendingRequest(null);
        setLastApprovalEvent(`Approval timed out for ${request.tool} request ${request.id}.`);
        resolve('APPROVAL_TIMEOUT');
      }, timeoutMs);
    });
  }, []);

  const cancelApproval = useCallback((requestId: string, message: string) => {
    const currentRequest = pendingRequestRef.current;
    if (!currentRequest || currentRequest.id !== requestId || !approvalResolverRef.current) {
      return;
    }

    clearApprovalTimeout();
    approvalResolverRef.current('REQUEST_CANCELLED');
    approvalResolverRef.current = undefined;
    setPendingRequest(null);
    setLastApprovalEvent(`Cancelled ${currentRequest.tool} request ${requestId}: ${message}`);
  }, []);

  const handleRequestStarted = useCallback((request: { tool: BridgeToolName }) => {
    setLastOperationError(null);
    setActiveOperation(`Running ${formatToolName(request.tool)}`);
  }, []);

  const handleRequestCompleted = useCallback(
    (request: { tool: BridgeToolName }, response: BridgeResponse) => {
      const message = response.ok
        ? `${formatToolName(request.tool)} completed.`
        : response.error.message;
      setActiveOperation(null);
      setLastPluginResult({ tool: request.tool, ok: response.ok, message });
      setLastOperationError(response.ok ? null : message);
    },
    []
  );

  useEffect(() => {
    if (!bridgeEnabled) {
      setBridgeStatus({
        ...INITIAL_BRIDGE_STATUS,
        serverUrl,
        lastEvent: 'Bridge disconnected from this panel.',
      });
      return undefined;
    }

    if (chatGptPairingDisabled && isHostedBridgeUrl(serverUrl)) {
      clientRef.current?.disconnect();
      clientRef.current = null;
      setBridgeStatus({
        ...INITIAL_BRIDGE_STATUS,
        serverUrl,
        state: 'disconnected',
        lastEvent: LOCAL_PAIRING_DISABLED_MESSAGE,
      });
      return undefined;
    }

    if (isHostedBridgeUrl(serverUrl) && !effectiveHostedSession?.sessionSecret) {
      clientRef.current?.disconnect();
      clientRef.current = null;
      setBridgeStatus({
        ...INITIAL_BRIDGE_STATUS,
        serverUrl,
        state: 'not_paired',
        lastEvent: 'Waiting for ChatGPT pairing approval before opening the hosted WebSocket.',
      });
      return undefined;
    }

    const client = new BrowserBridgeClient({
      plugin,
      serverUrl,
      token: bridgeToken,
      hostedSession: effectiveHostedSession,
      getPermissionMode: () => permissionModeRef.current,
      getPermissionScope: () => permissionScopeRef.current,
      getApprovedRootRemId: () => approvedRootRemIdRef.current,
      requestApproval,
      cancelApproval,
      onStatus: setBridgeStatus,
      onRequestStarted: handleRequestStarted,
      onRequestCompleted: handleRequestCompleted,
    });

    clientRef.current = client;
    client.connect();
    return () => {
      client.disconnect();
      clientRef.current = null;
      clearApprovalTimeout();
      if (approvalResolverRef.current) {
        approvalResolverRef.current('APPROVAL_REJECTED');
        approvalResolverRef.current = undefined;
      }
      setPendingRequest(null);
    };
  }, [
    plugin,
    serverUrl,
    bridgeToken,
    effectiveHostedSession?.sessionSecret,
    requestApproval,
    cancelApproval,
    handleRequestStarted,
    handleRequestCompleted,
    bridgeEnabled,
    chatGptPairingDisabled,
  ]);

  const handleApprove = async () => {
    if (!pendingRequest) {
      return;
    }

    if (pendingRequest.confirmTextRequired && deleteConfirmText !== pendingRequest.confirmTextRequired) {
      await plugin.app.toast('Type DELETE before approving this destructive request.');
      return;
    }

    await resolveApproval('APPROVED');
  };

  const handleReject = async () => {
    if (!pendingRequest) {
      return;
    }

    await resolveApproval('APPROVAL_REJECTED');
  };

  const pushHostedToolConfig = async (
    nextTier: BridgeToolProfile,
    nextScope: PermissionScope,
    nextMode: PermissionMode
  ) => {
    if (!effectiveHostedSession?.sessionSecret || chatGptPairingDisabled) {
      return;
    }
    setLastOperationError(null);
    setActiveOperation('Syncing hosted access');
    try {
      const state = await updatePluginToolTier(serverUrl, effectiveHostedSession, {
        toolTier: nextTier,
        permissionScope: nextScope,
        permissionMode: nextMode,
      });
      setToolTierState(state);
      const nextSession: HostedPairingSession = {
        ...effectiveHostedSession,
        toolTier: state.toolTier,
        accessScope: state.accessScope,
        trustedWriteMode: state.trustedWriteMode,
        requiresConnectorRefresh: state.requiresConnectorRefresh,
      };
      setHostedSession(nextSession);
      await saveHostedPairingSession(plugin, nextSession);
      setPairingEvent('Access updated live. No reconnect needed.');
    } catch (error: unknown) {
      setLastOperationError(error instanceof Error ? error.message : String(error));
      throw error;
    } finally {
      setActiveOperation(null);
    }
  };

  const handleScopeChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextScope = event.target.value as PermissionScope;
    setRuntimePermissionScope(nextScope);
    await plugin.storage.setLocal('bridge-permission-scope', nextScope);
    try {
      await pushHostedToolConfig(selectedToolTier, nextScope, permissionMode);
      await plugin.app.toast(`Bridge access changed to ${getPermissionScopeLabel(nextScope)}.`);
    } catch (error: unknown) {
      setPairingEvent(error instanceof Error ? error.message : String(error));
      await plugin.app.toast('Access changed locally. Server sync failed.');
    }
  };

  const applyPermissionMode = async (nextMode: PermissionMode) => {
    setRuntimePermissionMode(nextMode);
    await plugin.storage.setLocal('bridge-permission-mode', nextMode);
    try {
      await pushHostedToolConfig(selectedToolTier, permissionScope, nextMode);
      await plugin.app.toast(`Write mode changed to ${getPermissionModeLabel(nextMode)}.`);
    } catch (error: unknown) {
      setPairingEvent(error instanceof Error ? error.message : String(error));
      await plugin.app.toast('Write mode changed locally. Server sync failed.');
    }
  };

  const handleModeChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    await applyPermissionMode(event.target.value as PermissionMode);
  };

  const applyToolTier = async (nextTierValue: BridgeToolProfile) => {
    const nextTier = normalizeBridgeToolTier(nextTierValue);
    setSelectedToolTier(nextTier);
    await plugin.storage.setLocal(TOOL_TIER_STORAGE_KEY, nextTier);
    await plugin.storage.setLocal('bridge-tool-access-tier', nextTier);
    try {
      await pushHostedToolConfig(nextTier, permissionScope, permissionMode);
      await plugin.app.toast(
        effectiveHostedSession?.sessionSecret
          ? 'Tool tier updated live.'
          : 'Tool tier stored. It will apply when ChatGPT is paired.'
      );
    } catch (error: unknown) {
      setPairingEvent(error instanceof Error ? error.message : String(error));
      await plugin.app.toast('Tool tier saved locally. Server sync failed.');
    }
  };

  const handleToolTierChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    await applyToolTier(normalizeBridgeToolTier(event.target.value));
  };

  const handleUseFocusedAsApprovedRoot = async () => {
    if (!focusedRemStatus?.remId) {
      await plugin.app.toast('Focus a Rem before setting an approved root.');
      return;
    }

    setRuntimeApprovedRootRemId(focusedRemStatus.remId);
    await plugin.storage.setLocal('bridge-approved-root-rem-id', focusedRemStatus.remId);
    await plugin.app.toast('Approved root set to focused Rem.');
  };

  const handleTemplateChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextTemplateId = event.target.value;
    setSelectedTemplateId(nextTemplateId);
    await plugin.storage.setLocal('bridge-selected-template-id', nextTemplateId);
    const template = savedTemplates.find((item) => item.templateId === nextTemplateId);
    setTemplateStatus(template ? `${template.name} selected.` : 'No template selected.');
  };

  const handleSaveFocusedTemplate = async () => {
    if (!focusedRemStatus?.remId) {
      setTemplateStatus('Focus a note before saving a template.');
      await plugin.app.toast('Focus a note before saving a template.');
      return;
    }

    setLastOperationError(null);
    setActiveOperation('Saving focused note template');
    try {
      const label = focusedRemStatus.label.replace(/^Focused Rem:\s*/i, '').trim() || 'Focused Note';
      const result = await saveNoteDesignTemplate(plugin, {
        rootRemId: focusedRemStatus.remId,
        sourceRemId: focusedRemStatus.remId,
        name: `${label} Design`,
        description: 'Saved from focused Rem in RemnoteMCP.',
        overwrite: true,
      });
      setSelectedTemplateId(result.template.templateId);
      await plugin.storage.setLocal('bridge-selected-template-id', result.template.templateId);
      setTemplateStatus(`Saved ${result.template.name}.`);
      await loadTemplates();
      await plugin.app.toast('Focused note design template saved.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setTemplateStatus(message);
      setLastOperationError(message);
      await plugin.app.toast('Could not save focused note template.');
    } finally {
      setActiveOperation(null);
    }
  };

  const handleCopyMcpUrl = async () => {
    try {
      await navigator.clipboard.writeText(companionHttpUrl(serverUrl, '/mcp'));
      setDebugCopyStatus('MCP URL copied.');
      await plugin.app.toast('MCP URL copied.');
    } catch {
      setDebugCopyStatus('MCP URL copy failed.');
      await plugin.app.toast('Could not copy MCP URL from this RemNote surface.');
    }
  };

  const handleUseRecommendedNoteMode = async () => {
    const nextScope: PermissionScope = 'focused_rem_and_descendants';
    const nextMode: PermissionMode = 'read_create_modify';
    const nextTier: BridgeToolProfile = 'note_writer';
    setRuntimePermissionScope(nextScope);
    setRuntimePermissionMode(nextMode);
    setSelectedToolTier(nextTier);
    setDangerConfirmText('');
    await plugin.storage.setLocal('bridge-permission-scope', nextScope);
    await plugin.storage.setLocal('bridge-permission-mode', nextMode);
    await plugin.storage.setLocal(TOOL_TIER_STORAGE_KEY, nextTier);
    await plugin.storage.setLocal('bridge-tool-access-tier', nextTier);
    try {
      await pushHostedToolConfig(nextTier, nextScope, nextMode);
      await plugin.app.toast('Recommended note mode enabled.');
    } catch (error: unknown) {
      setPairingEvent(error instanceof Error ? error.message : String(error));
      await plugin.app.toast('Recommended mode set locally. Server sync failed.');
    }
  };

  const handleClearPairing = async () => {
    if (hostedSession) {
      await disconnectChatGptPairing(serverUrl, hostedSession);
    }
    await clearHostedPairingSession(plugin);
    setHostedSession(null);
    setPairingEvent('Hosted pairing cleared on this device.');
    await plugin.app.toast('Pairing cleared.');
  };

  const handleApproveChatGptPairing = async () => {
    if (chatGptPairingDisabled) {
      setPairingEvent(LOCAL_PAIRING_DISABLED_MESSAGE);
      await plugin.app.toast('ChatGPT pairing disabled in local-token mode.');
      return;
    }

    setLastOperationError(null);
    setActiveOperation('Approving ChatGPT pairing');
    try {
      const session = await approveChatGptPairing(plugin, serverUrl, {
        pairingCode: chatGptPairingCode,
        permissionMode,
        permissionScope,
        localConnectionLabel,
        workspaceLabel: 'Active RemNote workspace',
        toolTier: selectedToolTier,
      });
      setHostedSession(session);
      setToolTierState(null);
      const nextSessionScope: PermissionScope =
        session.accessScope === 'full-kb'
          ? 'workspace_allowed'
          : session.accessScope === 'current-rem-tree'
            ? 'focused_rem_and_descendants'
            : 'focused_rem_only';
      const nextSessionMode: PermissionMode =
        session.trustedWriteMode === 'trusted-inside-scope'
          ? 'full_control_delete_approval'
          : 'read_create_modify';
      setRuntimePermissionScope(nextSessionScope);
      setRuntimePermissionMode(nextSessionMode);
      setSelectedToolTier(normalizeBridgeToolTier(session.toolTier));
      await plugin.storage.setLocal('bridge-permission-scope', nextSessionScope);
      await plugin.storage.setLocal('bridge-permission-mode', nextSessionMode);
      await plugin.storage.setLocal(TOOL_TIER_STORAGE_KEY, normalizeBridgeToolTier(session.toolTier));
      await plugin.storage.setLocal('bridge-tool-access-tier', normalizeBridgeToolTier(session.toolTier));
      setPairingEvent(`Connected to ${session.connectedLabel || 'ChatGPT session'}.`);
      setChatGptPairingCode('');
      setChatGptPairingPreview(null);
      await plugin.app.toast('ChatGPT connection approved.');
    } catch (error: unknown) {
      const message = getFriendlyPairingError(error);
      setPairingEvent(message);
      setLastOperationError(message);
      await plugin.app.toast('ChatGPT pairing failed.');
    } finally {
      setActiveOperation(null);
    }
  };

  const handleLookupChatGptPairing = async () => {
    if (chatGptPairingDisabled) {
      setPairingEvent(LOCAL_PAIRING_DISABLED_MESSAGE);
      await plugin.app.toast('ChatGPT pairing disabled in local-token mode.');
      return;
    }

    setLastOperationError(null);
    setActiveOperation('Checking ChatGPT pairing code');
    try {
      const preview = await lookupChatGptPairing(serverUrl, chatGptPairingCode);
      setChatGptPairingPreview(preview);
      setPairingEvent(`Pending request from ${preview.connectionLabel}.`);
      await plugin.app.toast('Pairing request found.');
    } catch (error: unknown) {
      setChatGptPairingPreview(null);
      const message = getFriendlyPairingError(error);
      setPairingEvent(message);
      setLastOperationError(message);
      await plugin.app.toast('Pairing code not found.');
    } finally {
      setActiveOperation(null);
    }
  };

  const handleDenyChatGptPairing = async () => {
    if (chatGptPairingDisabled) {
      setPairingEvent(LOCAL_PAIRING_DISABLED_MESSAGE);
      await plugin.app.toast('ChatGPT pairing disabled in local-token mode.');
      return;
    }

    setLastOperationError(null);
    setActiveOperation('Denying ChatGPT pairing');
    try {
      await denyChatGptPairing(serverUrl, chatGptPairingCode);
      setPairingEvent('Connection denied.');
      setChatGptPairingCode('');
      setChatGptPairingPreview(null);
      await plugin.app.toast('ChatGPT connection denied.');
    } catch (error: unknown) {
      const message = getFriendlyPairingError(error);
      setPairingEvent(message);
      setLastOperationError(message);
      await plugin.app.toast('Could not deny pairing.');
    } finally {
      setActiveOperation(null);
    }
  };

  const handleHealthCheck = async (level: 'quick' | 'standard' | 'full' = 'quick') => {
    setLastOperationError(null);
    setActiveOperation(`Running ${level} health check`);
    try {
      const healthResponse = await fetch(companionHttpUrl(serverUrl, '/health'), {
        headers: { accept: 'application/json' },
      });
      const health = await healthResponse.json();
      setLastHealthCheck(health);

      if (effectiveHostedSession?.sessionSecret && !chatGptPairingDisabled) {
        const report = await runHostedPluginHealthCheck(serverUrl, effectiveHostedSession, {
          level,
          parentId: focusedRemStatus?.remId,
          targetRemId: focusedRemStatus?.remId,
        });
        setLastServerDiagnostics(report);
      } else {
        const headers: Record<string, string> = { accept: 'application/json' };
        if (bridgeToken) {
          headers.authorization = `Bearer ${bridgeToken}`;
        }
        const diagnosticsResponse = await fetch(companionHttpUrl(serverUrl, '/diagnostics'), { headers });
        if (diagnosticsResponse.ok) {
          setLastServerDiagnostics(await diagnosticsResponse.json());
        }
      }
      if (!healthResponse.ok || health?.ok === false) {
        const message =
          typeof health?.error === 'string'
            ? health.error
            : `${level} health check returned an error.`;
        setLastOperationError(message);
      }
      await plugin.app.toast(healthResponse.ok ? `${level} health checked.` : `${level} health failed.`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setLastHealthCheck({
        ok: false,
        error: message,
      });
      setLastOperationError(message);
      await plugin.app.toast('Bridge health check failed.');
    } finally {
      setActiveOperation(null);
    }
  };

  const handleDisconnect = async () => {
    if (hostedSession) {
      await disconnectChatGptPairing(serverUrl, hostedSession);
      await clearHostedPairingSession(plugin);
      setHostedSession(null);
      setPairingEvent('Disconnected. Open ChatGPT and reconnect the MCP connector, or enter a new pairing code.');
    }
    setBridgeEnabled(false);
    clientRef.current?.disconnect();
  };

  const handleCopyDiagnostics = async () => {
    let hostedDiagnostics = lastServerDiagnostics;
    if (effectiveHostedSession?.sessionSecret && !chatGptPairingDisabled) {
      try {
        hostedDiagnostics = await fetchHostedPluginDiagnostics(serverUrl, effectiveHostedSession);
        setLastServerDiagnostics(hostedDiagnostics);
      } catch (error: unknown) {
        setDebugCopyStatus(error instanceof Error ? error.message : String(error));
      }
    }

    const diagnostics = {
      bridge: bridgeStatus,
      permission: {
        mode: permissionMode,
        scope: permissionScope,
        approvedRootRemId,
      },
      focusedRem: focusedRemStatus,
      selection: currentSelection,
      pendingRequest: pendingRequest
        ? {
            id: pendingRequest.id,
            tool: pendingRequest.tool,
            riskLevel: pendingRequest.riskLevel,
            targetRemId: pendingRequest.targetRemId,
            timeoutDeadline: pendingRequest.timeoutDeadline,
          }
        : null,
      lastApprovalEvent,
      lastHealthCheck,
      lastServerDiagnostics: hostedDiagnostics,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(redactClientDiagnosticValue(diagnostics), null, 2));
      setDebugCopyStatus('Diagnostics JSON copied.');
      await plugin.app.toast('Bridge diagnostics copied.');
    } catch {
      setDebugCopyStatus('Diagnostics copy failed.');
      await plugin.app.toast('Could not copy diagnostics from this RemNote surface.');
    }
  };

  const handleCopyDeveloperDiagnosticBundle = async () => {
    let hostedDiagnostics = lastServerDiagnostics;
    if (effectiveHostedSession?.sessionSecret && !chatGptPairingDisabled) {
      try {
        hostedDiagnostics = await fetchHostedPluginDiagnostics(serverUrl, effectiveHostedSession);
        setLastServerDiagnostics(hostedDiagnostics);
      } catch (error: unknown) {
        setDebugCopyStatus(error instanceof Error ? error.message : String(error));
      }
    }

    const bundle =
      (hostedDiagnostics?.developerDiagnosticBundle as unknown) ??
      {
        copiedAt: new Date().toISOString(),
        redacted: true,
        payload: redactClientDiagnosticValue({
          bridge: bridgeStatus,
          lastServerDiagnostics: hostedDiagnostics,
          lastHealthCheck,
          recentRequests: lastRequests.slice(0, 25),
        }),
      };

    try {
      await navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
      setDebugCopyStatus('Developer diagnostic bundle copied.');
      await plugin.app.toast('Developer diagnostic bundle copied.');
    } catch {
      setDebugCopyStatus('Developer diagnostic bundle copy failed.');
      await plugin.app.toast('Could not copy developer diagnostic bundle.');
    }
  };

  const handleCopyRecentRequestLogs = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(lastRequests.slice(0, 10), null, 2));
      setDebugCopyStatus('Recent request logs copied.');
      await plugin.app.toast('Recent request logs copied.');
    } catch {
      setDebugCopyStatus('Recent request log copy failed.');
      await plugin.app.toast('Could not copy request logs.');
    }
  };

  const handleCopyFailedRequest = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(lastFailedRequest ?? null, null, 2));
      setDebugCopyStatus('Failed request report copied.');
      await plugin.app.toast('Failed request report copied.');
    } catch {
      setDebugCopyStatus('Failed request copy failed.');
      await plugin.app.toast('Could not copy failed request report.');
    }
  };

  const handleCopyToolVerificationMatrix = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(verificationMatrix, null, 2));
      setDebugCopyStatus('Tool verification matrix copied.');
      await plugin.app.toast('Tool verification matrix copied.');
    } catch {
      setDebugCopyStatus('Tool verification matrix copy failed.');
      await plugin.app.toast('Could not copy tool verification matrix.');
    }
  };

  useEffect(() => {
    if (!commandIntent?.id || handledIntentIdsRef.current.has(commandIntent.id)) {
      return;
    }

    handledIntentIdsRef.current.add(commandIntent.id);
    void (async () => {
      try {
        switch (commandIntent.kind) {
          case 'run_health_check':
            await handleHealthCheck('quick');
            break;
          case 'save_focused_template':
            await handleSaveFocusedTemplate();
            break;
          case 'use_focused_as_approved_root':
            await handleUseFocusedAsApprovedRoot();
            setAccessOpen(true);
            break;
          case 'copy_mcp_url':
            await handleCopyMcpUrl();
            break;
          case 'copy_diagnostics':
            await handleCopyDiagnostics();
            break;
          case 'open_settings':
            setAccessOpen(true);
            setAdvancedOpen(false);
            await plugin.app.toast('RemnoteMCP access settings shown.');
            break;
          default:
            break;
        }
      } finally {
        await plugin.storage.setSession(BRIDGE_COMMAND_INTENT_STORAGE_KEY, null);
      }
    })();
  }, [commandIntent?.id]);

  const approveLabel = pendingDecision?.destructive
    ? 'Approve Destructive Write'
    : pendingRequest
      ? 'Approve Write'
      : 'Approve';
  const approveDisabled =
    !pendingDecision?.allowed ||
    Boolean(pendingRequest?.confirmTextRequired && deleteConfirmText !== pendingRequest.confirmTextRequired);

  const waitingForPairing = uiConnectionState === 'not_paired' || uiConnectionState === 'pairing';
  const bridgeNextAction = getBridgeNextAction(uiBridgeStatus);
  const statusLabel = getBridgeStatusLabel(uiConnectionState);
  const initialSyncReady =
    bridgeStatus.initialSyncComplete === true && bridgeStatus.initialSyncTimedOut !== true;
  const approvedRootReady =
    permissionScope !== 'approved_document_or_folder' || Boolean(approvedRootRemId);
  const elevatedAccess =
    permissionMode === 'full_control_delete_approval' ||
    permissionMode === 'danger_zone' ||
    selectedToolTier === 'danger';
  const ready =
    uiConnectionState === 'connected' &&
    !pendingRequest &&
    !sessionStale &&
    initialSyncReady &&
    approvedRootReady;
  let activity = deriveBridgeActivity({
    connectionState: uiConnectionState,
    hasPendingApproval: Boolean(pendingRequest),
    activeOperation,
    lastOperationError,
    nextAction: bridgeNextAction,
  });
  if (activity.kind === 'connected' && !ready) {
    activity = {
      kind: 'blocked',
      title: 'Setup Blocked',
      copy: !initialSyncReady
        ? bridgeStatus.initialSyncWarning ?? 'RemNote initial sync is not complete.'
        : 'Choose an approved root Rem before using this scope.',
    };
  } else if (activity.kind === 'connected' && elevatedAccess) {
    activity = {
      kind: 'warning',
      title: 'Danger Access Enabled',
      copy: 'Connection is live, but elevated write or destructive tool access is enabled.',
    };
  }
  const taskVariant =
    activity.kind === 'connected'
      ? 'ready'
      : activity.kind === 'progress'
        ? 'progress'
        : activity.kind === 'failed'
          ? 'failed'
          : activity.kind === 'warning'
            ? 'warning'
          : activity.kind === 'pending'
            ? 'warning'
            : 'offline';
  const chatGptPairingConnected =
    Boolean(effectiveHostedSession && !chatGptPairingDisabled) && uiConnectionState === 'connected';

  const pendingSection = (
    <section
      className={['bridge-panel bridge-request-section', pendingRequest ? 'bridge-panel--attention' : '']
        .filter(Boolean)
        .join(' ')}
      aria-live="polite"
    >
      <div className="bridge-section-head bridge-request-head">
        <div className="bridge-heading-copy">
          <h3>{pendingRequest ? 'Approval Needed' : 'Pending Request'}</h3>
          {pendingRequest && <p>Review request before RemNote changes.</p>}
        </div>
        {pendingRequest && (
          <span
            className={[
              'bridge-pill',
              pendingDecision?.destructive ? 'bridge-pill-danger' : 'bridge-pill-warning',
            ].join(' ')}
          >
            {getToolImpactLabel(pendingRequest.tool)}
          </span>
        )}
      </div>

      {pendingRequest ? (
        <div className="bridge-pending">
          <div className="bridge-two-col">
            <DetailRow label="Request ID" value={pendingRequest.id} mono />
            <DetailRow label="Tool" value={formatToolName(pendingRequest.tool)} />
          </div>
          <div className="bridge-two-col">
            <DetailRow label="Mode" value={getPermissionModeLabel(pendingRequest.permissionMode)} />
            <DetailRow label="Risk" value={pendingRequest.riskLevel.replace(/_/g, ' ')} />
          </div>
          <DetailRow label="Scope" value={getPermissionScopeLabel(pendingRequest.permissionScope)} />
          <DetailRow label="Summary" value={pendingRequest.summary} />
          <DetailRow label="Lifecycle" value="waiting_for_remnote_approval" />
          {pendingRequest.targetRemId && <DetailRow label="Target Rem" value={pendingRequest.targetRemId} mono />}
          {pendingRequest.targetTitle && <DetailRow label="Target Title" value={pendingRequest.targetTitle} />}
          {pendingRequest.deletePreview && (
            <>
              <div className="bridge-two-col">
                <DetailRow
                  label="Parent"
                  value={pendingRequest.deletePreview.parentTitle ?? 'No parent'}
                />
                <DetailRow
                  label="Recursive"
                  value={pendingRequest.deletePreview.recursive ? 'Yes' : 'No'}
                />
              </div>
              {pendingRequest.deletePreview.parentRemId && (
                <DetailRow label="Parent Rem ID" value={pendingRequest.deletePreview.parentRemId} mono />
              )}
              <div className="bridge-two-col">
                <DetailRow label="Child Count" value={pendingRequest.deletePreview.childCount} />
                <DetailRow label="Descendants" value={pendingRequest.deletePreview.descendantCount} />
              </div>
            </>
          )}
          <DetailRow label="Deadline" value={new Date(pendingRequest.timeoutDeadline).toLocaleTimeString()} />
          {pendingRequest.hasChildren !== undefined && (
            <DetailRow label="Has Children" value={pendingRequest.hasChildren ? 'Yes' : 'No'} />
          )}
          {pendingRequest.confirmTextRequired && (
            <DetailRow label="Required Confirm Text" value={pendingRequest.confirmTextRequired} mono />
          )}
          {pendingRequest.confirmTextRequired && (
            <label className="bridge-confirm-label">
              Confirm destructive action
              <input
                className="bridge-confirm-input"
                value={deleteConfirmText}
                onChange={(event) => setDeleteConfirmText(event.target.value)}
                placeholder="Type DELETE"
                autoComplete="off"
              />
            </label>
          )}
          {pendingRequest.previewMarkdown && <pre className="bridge-preview">{pendingRequest.previewMarkdown}</pre>}
          {pendingRequest.warning && <div className="bridge-decision-note">{pendingRequest.warning}</div>}
          {pendingDecision && <div className="bridge-decision-note">{pendingDecision.reason}</div>}
          <div className="bridge-decision-note">Approval controls stay fixed at bottom.</div>
        </div>
      ) : (
        <div className="bridge-empty">No request waiting.</div>
      )}
      <div className="bridge-footnote">{lastApprovalEvent}</div>
    </section>
  );

  return (
    <div className="bridge-shell plugin-root">
      <BridgeWidgetHeader
        status={uiBridgeStatus}
        statusClassName={statusToneClass[uiConnectionState] ?? statusToneClass.disconnected}
        statusLabel={statusLabel}
        nextAction={bridgeNextAction}
      />

      <div className="plugin-body">
        <div className="bridge-stack">

        <BridgeTaskBanner
          variant={taskVariant}
          title={activity.title}
          copy={activity.copy}
          onChangeAccess={() => setAccessOpen((open) => !open)}
          actionLabel={accessOpen ? 'Hide Access' : 'Change Access'}
        />

        <section className="bridge-panel bridge-setup-panel">
          <div className="bridge-section-head">
            <div className="bridge-heading-copy">
              <h3>Setup</h3>
              <p>Connect, choose scope, pick a template, then approve writes when needed.</p>
            </div>
            <span className={elevatedAccess ? 'bridge-pill bridge-pill-danger' : ready ? 'bridge-pill bridge-pill-success' : 'bridge-pill bridge-pill-warning'}>
              {elevatedAccess ? 'Elevated' : ready ? 'Ready' : 'Needs check'}
            </span>
          </div>
          <div className="bridge-step-list">
            <div className="bridge-step">
              <span className={ready ? 'bridge-step-dot bridge-step-dot--success' : 'bridge-step-dot bridge-step-dot--warning'} />
              <div>
                <strong>Connection</strong>
                <p>{bridgeNextAction}</p>
              </div>
            </div>
            <div className="bridge-step">
              <span className={permissionScope === 'workspace_allowed' ? 'bridge-step-dot bridge-step-dot--warning' : 'bridge-step-dot bridge-step-dot--success'} />
              <div>
                <strong>Writing mode</strong>
                <p>{getPermissionScopeLabel(permissionScope)} + {getPermissionModeLabel(permissionMode)}</p>
              </div>
            </div>
            <div className="bridge-step">
              <span className={selectedTemplateId ? 'bridge-step-dot bridge-step-dot--success' : 'bridge-step-dot'} />
              <div>
                <strong>Template</strong>
                <p>{selectedTemplateId ? templateStatus : 'Optional. Save focused note style when ready.'}</p>
              </div>
            </div>
            <div className="bridge-step">
              <span className={pendingRequest ? 'bridge-step-dot bridge-step-dot--warning' : 'bridge-step-dot bridge-step-dot--success'} />
              <div>
                <strong>Approval</strong>
                <p>{pendingRequest ? `Waiting for ${formatToolName(pendingRequest.tool)}.` : 'No request waiting.'}</p>
              </div>
            </div>
          </div>
          <div className="bridge-actions">
            <button type="button" className="bridge-button bridge-button-approve" onClick={handleUseRecommendedNoteMode}>
              Use Recommended Mode
            </button>
            <button type="button" className="bridge-button bridge-button-secondary" onClick={() => handleHealthCheck('quick')}>
              Health Check
            </button>
          </div>
        </section>

        {!chatGptPairingDisabled && !chatGptPairingConnected && (
          <section className="bridge-panel bridge-panel--notice" aria-busy={Boolean(activeOperation)}>
            <div className="bridge-section-head">
              <div className="bridge-heading-copy">
                <h3>{effectiveHostedSession ? 'Paired Session Offline' : 'ChatGPT Pairing'}</h3>
                <p>
                  {effectiveHostedSession
                    ? 'The saved pairing exists, but the plugin connection is not currently confirmed.'
                    : 'Enter the hosted pairing code from ChatGPT. RemNote approval is required before access.'}
                </p>
              </div>
              <span className="bridge-pill bridge-pill-warning">Not connected</span>
            </div>
            {!effectiveHostedSession && <div className="bridge-access-editor">
              <label className="bridge-field">
                Pairing code
                <input
                  className="bridge-text-input"
                  value={chatGptPairingCode}
                  onChange={(event) => {
                    setChatGptPairingCode(event.target.value);
                    setChatGptPairingPreview(null);
                  }}
                  placeholder="482-913"
                  autoComplete="off"
                />
              </label>
              <label className="bridge-field">
                Local label
                <input
                  className="bridge-text-input"
                  value={localConnectionLabel}
                  onChange={(event) => setLocalConnectionLabel(event.target.value)}
                  placeholder="My ChatGPT"
                  autoComplete="off"
                />
              </label>
            </div>}
            {effectiveHostedSession && (
              <dl className="bridge-detail-list">
                <DetailRow label="Connection" value={effectiveHostedSession.connectedLabel ?? 'Saved ChatGPT pairing'} />
                <DetailRow label="Session Expires" value={new Date(effectiveHostedSession.expiresAt).toLocaleString()} />
              </dl>
            )}
            {chatGptPairingPreview && (
              <dl className="bridge-detail-list bridge-detail-list--spaced">
                <DetailRow label="Pending Request" value={chatGptPairingPreview.connectionLabel} />
                <DetailRow label="Expires" value={new Date(chatGptPairingPreview.expiresAt).toLocaleTimeString()} />
                <DetailRow
                  label="Requested Scopes"
                  value={chatGptPairingPreview.requestedScopes.join(', ') || 'No extra scopes requested'}
                />
                <DetailRow label="RemNote Access" value={chatGptPairingPreview.accessScope.replace(/-/g, ' ')} />
                <DetailRow label="Write Approval" value={chatGptPairingPreview.trustedWriteMode.replace(/-/g, ' ')} />
                <DetailRow label="Tool Tier" value={chatGptPairingPreview.toolTier ?? 'note_writer'} />
              </dl>
            )}
            <div
              className={lastOperationError ? 'bridge-event bridge-event--danger' : 'bridge-event'}
              role={lastOperationError ? 'alert' : 'status'}
            >
              {pairingEvent}
            </div>
            {!effectiveHostedSession ? <div className="bridge-actions">
              <button type="button" disabled={Boolean(activeOperation)} className="bridge-button bridge-button-secondary" onClick={handleLookupChatGptPairing}>
                Check Code
              </button>
              <button type="button" disabled={Boolean(activeOperation)} className="bridge-button bridge-button-approve" onClick={handleApproveChatGptPairing}>
                Approve
              </button>
              <button type="button" disabled={Boolean(activeOperation)} className="bridge-button bridge-button-reject" onClick={handleDenyChatGptPairing}>
                Deny
              </button>
            </div> : (
              <div className="bridge-actions">
                <button type="button" disabled={Boolean(activeOperation)} className="bridge-button bridge-button-secondary" onClick={() => void handleHealthCheck('quick')}>
                  Check Connection
                </button>
                <button type="button" disabled={Boolean(activeOperation)} className="bridge-button bridge-button-reject" onClick={() => void handleClearPairing()}>
                  Clear Pairing
                </button>
              </div>
            )}
          </section>
        )}

        <section className="bridge-panel bridge-access-panel">
          <div className="bridge-section-head">
            <div className="bridge-heading-copy">
              <h3>Writing Access</h3>
              <p>Default keeps ChatGPT inside focused Rem and descendants.</p>
            </div>
            <span
              className={
                permissionMode === 'danger_zone' || permissionMode === 'full_control_delete_approval'
                  ? 'bridge-pill bridge-pill-danger'
                  : 'bridge-pill bridge-pill-accent'
              }
            >
              {getPermissionModeLabel(permissionMode)}
            </span>
          </div>
          {accessOpen ? (
            <>
              <div className="bridge-access-editor bridge-access-editor--always">
                <label className="bridge-field">
                  Access scope
                  <select value={permissionScope} onChange={handleScopeChange}>
                    {permissionScopeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {getPermissionScopeLabel(option.value)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="bridge-field">
                  Standard write mode
                  <select value={permissionMode} onChange={handleModeChange}>
                    {!STANDARD_PERMISSION_MODE_OPTIONS.some((option) => option.value === permissionMode) && (
                      <option value={permissionMode} disabled>
                        {getPermissionModeLabel(permissionMode)} — manage in Danger Zone
                      </option>
                    )}
                    {STANDARD_PERMISSION_MODE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="bridge-field-help">
                {permissionScopeOptions.find((option) => option.value === permissionScope)?.description}
              </p>
              <dl className="bridge-detail-list">
                <DetailRow
                  label="Focused Rem"
                  value={focusedRemStatus?.found ? focusedRemStatus.label : focusedRemStatus?.label ?? 'Checking...'}
                />
                <DetailRow
                  label="Approved Root"
                  value={approvedRootRemId ?? (permissionScope === 'approved_document_or_folder' ? 'Missing approved root Rem ID' : 'Only needed for Approved Root scope')}
                  mono={Boolean(approvedRootRemId)}
                />
              </dl>
              <div className="bridge-actions">
                <button type="button" className="bridge-button bridge-button-secondary" onClick={handleUseFocusedAsApprovedRoot}>
                  Use Focused as Root
                </button>
                <button type="button" className="bridge-button bridge-button-secondary" onClick={handleCopyMcpUrl}>
                  Copy MCP URL
                </button>
              </div>
            </>
          ) : (
            <div className="bridge-access-summary">
              <p>{getPermissionScopeLabel(permissionScope)}. Standard controls are collapsed.</p>
              <button type="button" className="bridge-button bridge-button-secondary bridge-button-full" onClick={() => setAccessOpen(true)}>
                Show Access Controls
              </button>
            </div>
          )}
        </section>

        <section className="bridge-panel bridge-template-panel">
          <div className="bridge-section-head">
            <div className="bridge-heading-copy">
              <h3>Design Template</h3>
              <p>Reuse a saved note style for high-level note tools.</p>
            </div>
            <span className="bridge-pill bridge-pill-muted">{savedTemplates.length} saved</span>
          </div>
          <label className="bridge-field">
            Template
            <select value={selectedTemplateId} onChange={handleTemplateChange}>
              <option value="">No template</option>
              {savedTemplates.map((template) => (
                <option key={template.templateId} value={template.templateId}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
          <div className="bridge-actions">
            <button type="button" className="bridge-button bridge-button-secondary" onClick={handleSaveFocusedTemplate}>
              Save Focused Style
            </button>
            <button type="button" className="bridge-button bridge-button-secondary" onClick={loadTemplates}>
              Refresh Templates
            </button>
          </div>
          <div className="bridge-footnote">{templateStatus}</div>
        </section>

        {pendingSection}

        <section className="bridge-panel bridge-result-panel">
          <div className="bridge-section-head">
            <div className="bridge-heading-copy">
              <h3>Last Result</h3>
              <p>{latestResultCopy}</p>
            </div>
            <span
              className={
                latestResultOk === null
                  ? 'bridge-pill bridge-pill-muted'
                  : latestResultOk
                    ? 'bridge-pill bridge-pill-success'
                    : 'bridge-pill bridge-pill-danger'
              }
            >
              {latestResultOk === null ? 'No result yet' : latestResultOk ? 'Latest passed' : 'Latest failed'}
            </span>
          </div>
          <dl className="bridge-detail-list">
            <DetailRow
              label="Current Plugin Result"
              value={lastPluginResult ? `${formatToolName(lastPluginResult.tool)}: ${lastPluginResult.message}` : 'No current-session result yet'}
            />
            <DetailRow
              label="Last Health"
              value={lastHealthCheck ? (lastHealthCheck.ok === false ? 'Failed' : 'Checked') : 'Not checked yet'}
            />
            <DetailRow
              label="Last Tool Success"
              value={lastSuccessfulRequest ? `${lastSuccessfulRequest.tool ?? 'request'} ${lastSuccessfulRequest.durationMs ?? ''}ms` : 'No diagnostics fetch yet'}
            />
            <DetailRow
              label="Last Tool Failure"
              value={lastFailedRequest ? `${lastFailedRequest.tool ?? 'request'} ${lastFailedRequest.errorCode ?? ''}` : 'No failed request in fetched diagnostics'}
            />
          </dl>
        </section>

        <section className="bridge-panel">
          <button
            type="button"
            className="bridge-button bridge-button-secondary bridge-button-full"
            onClick={() => setAdvancedOpen((open) => !open)}
          >
            {advancedOpen ? 'Hide Advanced Details' : 'Advanced Details'}
          </button>
          {advancedOpen && (
            <div className="bridge-advanced">
              <section className="bridge-advanced-block">
                <div className="bridge-section-head">
                  <div className="bridge-heading-copy">
                    <h3>Tool Health and Tier</h3>
                    <p>Developer controls for visible tools, registry truth, and live verification.</p>
                  </div>
                  <span className={statusToneClass[uiConnectionState] ?? statusToneClass.disconnected}>
                    {statusLabel}
                  </span>
                </div>
                <label className="bridge-field">
                  Active tool tier
                  <select value={selectedToolTier} onChange={handleToolTierChange}>
                    {selectedToolTier === 'danger' && (
                      <option value="danger" disabled>
                        Danger — manage in Danger Zone
                      </option>
                    )}
                    {STANDARD_TOOL_TIER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <ToolProfileSummary
                  toolProfile={activeServerToolTier}
                  publicToolCount={toolTierState?.publicToolCount ?? bridgeStatus.publicToolCount}
                  allPublicToolCount={toolTierState?.allPublicToolCount ?? bridgeStatus.allPublicToolCount}
                  preferredToolCount={bridgeStatus.preferredTools?.length ?? 0}
                  hiddenByProfileCount={profileHiddenToolCount}
                />
                <div className="bridge-mode-grid bridge-tool-tier-grid">
                  {STANDARD_TOOL_TIER_OPTIONS.map((option) => {
                    const selected = selectedToolTier === option.value;
                    const activeOnServer = activeServerToolTier === option.value;
                    const count =
                      toolTierState?.toolCountsByTier?.[option.value] ??
                      toolCountForTier(visibleTierSummary, option.value);
                    return (
                      <div
                        key={option.value}
                        className={[
                          'bridge-mode-card',
                          selected ? 'bridge-mode-card--success' : 'bridge-mode-card--warning',
                          selected ? 'bridge-tool-tier-card--selected' : '',
                        ].join(' ')}
                      >
                        <span className={['bridge-pill', activeOnServer ? 'bridge-pill-success' : 'bridge-pill-muted'].join(' ')}>
                          {activeOnServer ? 'Active' : 'Inactive'}
                        </span>
                        <strong>{option.label}</strong>
                        <p>{count || 0} tools. {option.risk}. {option.description}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
              <section className="bridge-advanced-block bridge-auth-boundary">
                <div className="bridge-section-head">
                  <div className="bridge-heading-copy">
                    <h3>Authentication Boundary</h3>
                    <p>Connection identity is separate from RemNote write authority.</p>
                  </div>
                  <span className="bridge-pill bridge-pill-accent">
                    {reportedDeploymentMode === 'hosted' || effectiveHostedSession?.sessionSecret
                      ? 'Hosted OAuth'
                      : bridgeToken
                        ? 'Local bearer'
                        : 'No token'}
                  </span>
                </div>
                <dl className="bridge-detail-list">
                  <DetailRow label="Server URL" value={bridgeStatus.serverUrl} mono />
                  <DetailRow
                    label="Credential Location"
                    value="Sensitive values stay in RemNote native settings and copied diagnostics are redacted."
                  />
                </dl>
              </section>
              <section className="bridge-advanced-block bridge-danger-zone">
                <div className="bridge-section-head">
                  <div className="bridge-heading-copy">
                    <h3>Danger Zone</h3>
                    <p>Destructive access is isolated from normal note-writing controls.</p>
                  </div>
                  <span className="bridge-pill bridge-pill-danger">Destructive</span>
                </div>
                <div className="bridge-danger-summary">
                  <span>Write mode: {getPermissionModeLabel(permissionMode)}</span>
                  <span>Tool tier: {selectedToolTier}</span>
                </div>
                <label className="bridge-confirm-label">
                  Type ENABLE DANGER to unlock escalation
                  <input
                    className="bridge-confirm-input"
                    value={dangerConfirmText}
                    onChange={(event) => setDangerConfirmText(event.target.value)}
                    placeholder="ENABLE DANGER"
                    autoComplete="off"
                  />
                </label>
                <div className="bridge-actions">
                  <button
                    type="button"
                    disabled={dangerConfirmText !== 'ENABLE DANGER' || Boolean(activeOperation)}
                    className="bridge-button bridge-button-danger"
                    onClick={() => void applyPermissionMode('full_control_delete_approval')}
                  >
                    Enable Delete Approval
                  </button>
                  <button
                    type="button"
                    disabled={dangerConfirmText !== 'ENABLE DANGER' || Boolean(activeOperation)}
                    className="bridge-button bridge-button-danger"
                    onClick={() => void applyPermissionMode('danger_zone')}
                  >
                    Enable Danger Mode
                  </button>
                  <button
                    type="button"
                    disabled={dangerConfirmText !== 'ENABLE DANGER' || Boolean(activeOperation)}
                    className="bridge-button bridge-button-danger"
                    onClick={() => void applyToolTier('danger')}
                  >
                    Enable Danger Tools
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(activeOperation)}
                    className="bridge-button bridge-button-secondary"
                    onClick={() => void handleUseRecommendedNoteMode()}
                  >
                    Restore Recommended
                  </button>
                </div>
              </section>
              <section className="bridge-metrics" aria-label="Bridge summary">
                <StatusMetric
                  label="Exposed"
                  value={(toolTierState?.publicToolCount ?? bridgeStatus.publicToolCount) ? `${toolTierState?.publicToolCount ?? bridgeStatus.publicToolCount} tools` : 'Unknown'}
                  tone={(toolTierState?.publicToolCount ?? bridgeStatus.publicToolCount) && (toolTierState?.publicToolCount ?? bridgeStatus.publicToolCount ?? 0) < 20 ? 'warning' : 'success'}
                />
                <StatusMetric
                  label="Tier"
                  value={activeServerToolTier ?? 'Not reported'}
                  tone={activeServerToolTier ? (profileHiddenToolCount ? 'warning' : 'success') : 'warning'}
                />
                <StatusMetric
                  label="Runtime Verified"
                  value={`${runtimeVerifiedCount} tools`}
                  tone={runtimeVerifiedCount ? 'success' : 'warning'}
                />
                <StatusMetric
                  label="Server Local"
                  value={`${serverLocalVerifiedCount} tools`}
                  tone={serverLocalVerifiedCount ? 'neutral' : 'warning'}
                />
                <StatusMetric
                  label="Registry"
                  value={bridgeStatus.toolRegistryVersion ?? 'No stamp'}
                  tone={bridgeStatus.toolRegistryVersion ? 'success' : 'warning'}
                />
                <StatusMetric
                  label="Unverified"
                  value={runtimeUnverifiedCount}
                  tone={runtimeUnverifiedCount ? 'warning' : 'success'}
                />
                <StatusMetric
                  label="Unsupported"
                  value={bridgeStatus.sdkUnsupportedTools?.length ?? 0}
                  tone={bridgeStatus.sdkUnsupportedTools?.length ? 'warning' : 'success'}
                />
                <StatusMetric
                  label="Hidden"
                  value={hiddenToolCount}
                  tone={hiddenToolCount ? 'neutral' : 'warning'}
                />
                <StatusMetric
                  label="Scope"
                  value={getPermissionScopeLabel(permissionScope)}
                  tone={permissionScope === 'workspace_allowed' ? 'warning' : 'neutral'}
                />
                <StatusMetric
                  label="Stale"
                  value={sessionStale ? 'Yes' : 'No'}
                  tone={sessionStale ? 'warning' : 'success'}
                />
              </section>
              <dl className="bridge-detail-list">
                <DetailRow label="Deployment Mode" value={reportedDeploymentMode ?? (isHostedBridgeUrl(serverUrl) ? 'hosted' : 'local')} />
                <DetailRow label="Active Server Tier" value={activeServerToolTier ?? 'Not reported'} />
                {bridgeStatus.serverStartedAt && (
                  <DetailRow label="Server Started" value={new Date(bridgeStatus.serverStartedAt).toLocaleTimeString()} />
                )}
                <DetailRow label="Last Event" value={bridgeStatus.lastEvent} />
                <DetailRow
                  label="Callability"
                  value={bridgeStatus.callabilitySource ?? 'registry only'}
                />
                <DetailRow
                  label="SDK Unsupported"
                  value={bridgeStatus.sdkUnsupportedTools?.join(', ') || 'None reported'}
                />
                <DetailRow
                  label="Blocked In Current Mode"
                  value={toolAvailability.blocked}
                />
                <DetailRow
                  label="Tool Verification Matrix"
                  value={`${verificationMatrix.length} rows; ${runtimeVerifiedCount} live-runtime verified; ${serverLocalVerifiedCount} server-local verified`}
                />
                <DetailRow
                  label="User Summary"
                  value={
                    publicUserSummary
                      ? `${publicUserSummary.status ?? 'unknown'}: ${publicUserSummary.message ?? 'No message'}`
                      : 'No fetched public summary yet'
                  }
                />
                <DetailRow
                  label="Preferred Tools"
                  value={bridgeStatus.preferredTools?.join(', ') || 'Not reported'}
                />
                <DetailRow
                  label="Profile Hidden Tools"
                  value={bridgeStatus.profileHiddenTools?.map((tool) => tool.name).join(', ') || 'None'}
                />
                <DetailRow
                  label="Last Health"
                  value={
                    lastHealthCheck
                      ? JSON.stringify(lastHealthCheck).slice(0, 220)
                      : 'Not checked from UI yet'
                  }
                />
                <DetailRow
                  label="Last Success"
                  value={lastSuccessfulRequest ? `${lastSuccessfulRequest.tool ?? 'request'} ${lastSuccessfulRequest.id ?? ''}` : 'No diagnostics fetch yet'}
                  mono={Boolean(lastSuccessfulRequest)}
                />
                <DetailRow
                  label="Last Failure"
                  value={lastFailedRequest ? `${lastFailedRequest.tool ?? 'request'} ${lastFailedRequest.errorCode ?? ''}` : 'No failed request in fetched diagnostics'}
                  mono={Boolean(lastFailedRequest)}
                />
                {focusedRemStatus?.remId && <DetailRow label="Focused Rem ID" value={focusedRemStatus.remId} mono />}
                {currentSelection?.selectedRemIds.length ? (
                  <DetailRow label="Selected IDs" value={currentSelection.selectedRemIds.join(', ')} mono />
                ) : null}
                {bridgeStatus.lastError && (
                  <DetailRow label="Error" value={<span className="bridge-error-text">{bridgeStatus.lastError}</span>} />
                )}
              </dl>
              <div className="bridge-inline-actions">
                <button type="button" onClick={() => handleHealthCheck('quick')} className="bridge-button bridge-button-secondary">
                  Run Quick Health Check
                </button>
                <button type="button" onClick={() => handleHealthCheck('standard')} className="bridge-button bridge-button-secondary">
                  Run Standard Health Check
                </button>
                <button type="button" onClick={() => handleHealthCheck('full')} className="bridge-button bridge-button-secondary">
                  Run Full Health Check
                </button>
                <button type="button" onClick={handleCopyRecentRequestLogs} className="bridge-button bridge-button-secondary">
                  Copy Logs
                </button>
              </div>
              <button type="button" onClick={handleCopyDiagnostics} className="bridge-button bridge-button-secondary bridge-button-full">
                Copy Diagnostics
              </button>
              <button type="button" onClick={handleCopyDeveloperDiagnosticBundle} className="bridge-button bridge-button-secondary bridge-button-full">
                Copy Developer Bundle
              </button>
              <button type="button" onClick={handleCopyFailedRequest} className="bridge-button bridge-button-secondary bridge-button-full">
                Copy Failed Request
              </button>
              <button type="button" onClick={handleCopyToolVerificationMatrix} className="bridge-button bridge-button-secondary bridge-button-full">
                Copy Tool Verification Matrix
              </button>
              <div className="bridge-footnote">{debugCopyStatus}</div>
            </div>
          )}
        </section>
      </div>
      </div>

      <footer className="approval-footer">
        {pendingRequest ? (
          <div className="bridge-actions" role="group" aria-label="Bridge approval actions">
            <button
              type="button"
              onClick={handleApprove}
              disabled={approveDisabled}
              className={[
                'bridge-button bridge-button-approve',
                pendingDecision?.destructive ? 'bridge-button-danger' : '',
              ].join(' ')}
            >
              {approveLabel}
            </button>
            <button type="button" onClick={handleReject} className="bridge-button bridge-button-reject">
              Reject
            </button>
          </div>
        ) : (
          <div className="bridge-actions">
            <button
              type="button"
              onClick={() => setBridgeEnabled(true)}
              disabled={bridgeEnabled}
              className="bridge-button bridge-button-secondary"
            >
              Connect
            </button>
            <button type="button" onClick={handleDisconnect} className="bridge-button bridge-button-reject">
              Disconnect
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}

renderWidget(BridgeStatusWidget);
