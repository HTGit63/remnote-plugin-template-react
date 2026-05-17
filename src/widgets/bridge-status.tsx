import { renderWidget, usePlugin, useTracker } from '@remnote/plugin-sdk';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import '../style.css';
import '../index.css';
import {
  type ApprovalResolution,
  type BridgeToolName,
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
  BridgeTaskBanner,
  BridgeWidgetHeader,
  RecommendedModeCard,
  ToolProfileSummary,
} from './components/BridgeWidgetPieces';
import {
  getPermissionDecision,
  getPermissionModeLabel,
  getPermissionScopeLabel,
  normalizePermissionMode,
  normalizePermissionScope,
} from '../remnote/permissions';
import { getCurrentSelection, getFocusedRemStatus } from '../remnote/read';

const statusToneClass: Record<string, string> = {
  connected: 'bridge-pill bridge-pill-success',
  connecting: 'bridge-pill bridge-pill-warning',
  disconnected: 'bridge-pill bridge-pill-muted',
  error: 'bridge-pill bridge-pill-danger',
};

const permissionScopeOptions: Array<{ value: PermissionScope; description: string }> = [
  {
    value: 'focused_rem_only',
    description: 'ChatGPT can only work with the Rem you are currently focused on.',
  },
  {
    value: 'focused_rem_and_descendants',
    description: 'ChatGPT can work inside the focused Rem and its children. Best for creating one note.',
  },
  {
    value: 'selected_rem_only',
    description: 'ChatGPT can work only with selected Rems.',
  },
  {
    value: 'selected_rem_and_descendants',
    description: 'ChatGPT can work inside selected Rems and their children.',
  },
  {
    value: 'approved_document_or_folder',
    description: 'ChatGPT can work inside one approved document or folder.',
  },
  {
    value: 'workspace_allowed',
    description: 'ChatGPT can search and create more broadly. Use carefully.',
  },
];

const permissionModeOptions: Array<{ value: PermissionMode; label: string }> = [
  { value: 'read_only', label: 'Read only' },
  { value: 'confirm_writes', label: 'Ask for existing notes' },
  { value: 'trusted_writes', label: 'Trusted writes' },
  { value: 'danger_zone', label: 'Danger zone' },
];

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
    } else if (mode === 'confirm_writes') {
      gated += 1;
    } else {
      free += 1;
    }
  }

  return { free, gated, blocked };
}

function companionHttpUrl(serverUrl: string, pathname: '/health' | '/diagnostics'): string {
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
  const approvalResolverRef = useRef<((resolution: ApprovalResolution) => void) | undefined>();
  const approvalTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>();
  const pendingRequestRef = useRef<PendingApprovalRequest | null>(null);
  const permissionModeRef = useRef<PermissionMode>('confirm_writes');
  const permissionScopeRef = useRef<PermissionScope>('focused_rem_only');
  const approvedRootRemIdRef = useRef<string | null>(null);
  const clientRef = useRef<BrowserBridgeClient | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

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
  const hiddenToolCount = bridgeStatus.hiddenTools?.length ?? 1;
  const profileHiddenToolCount = bridgeStatus.profileHiddenTools?.length ?? 0;
  const lastRequests =
    typeof lastServerDiagnostics?.bridge === 'object' &&
    lastServerDiagnostics.bridge !== null &&
    Array.isArray((lastServerDiagnostics.bridge as { recentRequests?: unknown }).recentRequests)
      ? ((lastServerDiagnostics.bridge as { recentRequests: Array<Record<string, unknown>> }).recentRequests)
      : [];
  const lastSuccessfulRequest = lastRequests.find((request) => request.ok === true);
  const lastFailedRequest = lastRequests.find((request) => request.ok === false);

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

  useEffect(() => {
    if (!bridgeEnabled) {
      setBridgeStatus({
        ...INITIAL_BRIDGE_STATUS,
        serverUrl,
        lastEvent: 'Bridge disconnected from this panel.',
      });
      return undefined;
    }

    const client = new BrowserBridgeClient({
      plugin,
      serverUrl,
      token: bridgeToken,
      getPermissionMode: () => permissionModeRef.current,
      getPermissionScope: () => permissionScopeRef.current,
      getApprovedRootRemId: () => approvedRootRemIdRef.current,
      requestApproval,
      cancelApproval,
      onStatus: setBridgeStatus,
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
  }, [plugin, serverUrl, bridgeToken, requestApproval, cancelApproval, bridgeEnabled]);

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

  const handleScopeChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRuntimePermissionScope(event.target.value as PermissionScope);
    await plugin.app.toast(`Bridge access changed to ${getPermissionScopeLabel(event.target.value as PermissionScope)}.`);
  };

  const handleModeChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRuntimePermissionMode(event.target.value as PermissionMode);
    await plugin.app.toast(`Write mode changed to ${getPermissionModeLabel(event.target.value as PermissionMode)}.`);
  };

  const handleUseFocusedAsApprovedRoot = async () => {
    if (!focusedRemStatus?.remId) {
      await plugin.app.toast('Focus a Rem before setting an approved root.');
      return;
    }

    setRuntimeApprovedRootRemId(focusedRemStatus.remId);
    await plugin.app.toast('Approved root set to focused Rem.');
  };

  const handleUseRecommendedNoteMode = async () => {
    setRuntimePermissionScope('focused_rem_and_descendants');
    setRuntimePermissionMode('trusted_writes');
    await plugin.app.toast('Recommended note mode enabled.');
  };

  const handleHealthCheck = async () => {
    try {
      const healthResponse = await fetch(companionHttpUrl(serverUrl, '/health'), {
        headers: { accept: 'application/json' },
      });
      const health = await healthResponse.json();
      setLastHealthCheck(health);

      const headers: Record<string, string> = { accept: 'application/json' };
      if (bridgeToken) {
        headers.authorization = `Bearer ${bridgeToken}`;
      }
      const diagnosticsResponse = await fetch(companionHttpUrl(serverUrl, '/diagnostics'), { headers });
      if (diagnosticsResponse.ok) {
        setLastServerDiagnostics(await diagnosticsResponse.json());
      }
      await plugin.app.toast(healthResponse.ok ? 'Bridge health checked.' : 'Bridge health failed.');
    } catch (error: unknown) {
      setLastHealthCheck({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
      await plugin.app.toast('Bridge health check failed.');
    }
  };

  const handleDisconnect = () => {
    setBridgeEnabled(false);
    clientRef.current?.disconnect();
  };

  const handleCopyDiagnostics = async () => {
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
      lastServerDiagnostics,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
      setDebugCopyStatus('Diagnostics JSON copied.');
      await plugin.app.toast('Bridge diagnostics copied.');
    } catch {
      setDebugCopyStatus('Diagnostics copy failed.');
      await plugin.app.toast('Could not copy diagnostics from this RemNote surface.');
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

  const approveLabel = pendingDecision?.destructive
    ? 'Approve Destructive Write'
    : pendingRequest
      ? 'Approve Write'
      : 'Approve';
  const approveDisabled =
    !pendingDecision?.allowed ||
    Boolean(pendingRequest?.confirmTextRequired && deleteConfirmText !== pendingRequest.confirmTextRequired);

  const ready = bridgeStatus.state === 'connected' && !pendingRequest;
  const needsAction = Boolean(pendingRequest);
  const taskVariant = needsAction ? 'warning' : ready ? 'ready' : 'offline';
  const bridgeNextAction = getBridgeNextAction(bridgeStatus);
  const taskTitle = needsAction ? 'Action Needed' : ready ? 'Ready' : 'Bridge Offline';
  const taskCopy = needsAction
    ? 'Review this write before RemNote changes.'
    : ready
      ? 'ChatGPT can use the connected RemNote tools.'
      : 'Start the companion server or check the token.';

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
        status={bridgeStatus}
        statusClassName={statusToneClass[bridgeStatus.state] ?? statusToneClass.disconnected}
        statusLabel={getBridgeStatusLabel(bridgeStatus.state)}
        nextAction={bridgeNextAction}
      />

      <div className="plugin-body">
        <div className="bridge-stack">

        <BridgeTaskBanner
          variant={taskVariant}
          title={taskTitle}
          copy={taskCopy}
          onChangeAccess={() => setAccessOpen((open) => !open)}
        />

        <section className="bridge-panel bridge-recommendation-panel">
          <div className="bridge-section-head">
            <div className="bridge-heading-copy">
              <h3>Recommended Mode</h3>
              <p>Best for normal note writing: focused Rem and descendants with trusted writes.</p>
            </div>
            <span className="bridge-pill bridge-pill-success">Recommended</span>
          </div>
          <ToolProfileSummary
            toolProfile={bridgeStatus.toolProfile}
            publicToolCount={bridgeStatus.publicToolCount}
            allPublicToolCount={bridgeStatus.allPublicToolCount}
            preferredToolCount={bridgeStatus.preferredTools?.length ?? 0}
            hiddenByProfileCount={profileHiddenToolCount}
          />
          <div className="bridge-mode-grid">
            <RecommendedModeCard tone="success" badge="Green" title="Focused Rem + Descendants">
              Vivy can work inside current note and children it creates under it.
            </RecommendedModeCard>
            <RecommendedModeCard tone="success" badge="Green" title="Trusted Writes">
              Safe write tools run without repeated RemNote approval prompts.
            </RecommendedModeCard>
            <RecommendedModeCard tone="warning" badge="Caution" title="Workspace Allowed">
              Broad testing/search mode. Does not fix unsupported tools.
            </RecommendedModeCard>
            <RecommendedModeCard tone="danger" badge="Danger" title="Danger Zone">
              High-risk mode. Delete and replace still require approval.
            </RecommendedModeCard>
          </div>
          <button type="button" className="bridge-button bridge-button-approve bridge-button-full" onClick={handleUseRecommendedNoteMode}>
            Use Recommended Note Mode
          </button>
        </section>

        <section className="bridge-panel">
          <div className="bridge-section-head">
            <h3>Access</h3>
            <span className="bridge-pill bridge-pill-accent">{getPermissionModeLabel(permissionMode)}</span>
          </div>
          <dl className="bridge-detail-list">
            <DetailRow
              label="Effective Mode"
              value={`${getPermissionScopeLabel(permissionScope)} + ${getPermissionModeLabel(permissionMode)}`}
            />
            <DetailRow label="ChatGPT Can Access" value={getPermissionScopeLabel(permissionScope)} />
            <DetailRow label="Writes" value={getPermissionModeLabel(permissionMode)} />
            <DetailRow
              label="Focused Rem"
              value={focusedRemStatus?.found ? focusedRemStatus.label : focusedRemStatus?.label ?? 'Checking...'}
            />
            <DetailRow
              label="Selected Rems"
              value={
                currentSelection?.selectionSupported
                  ? `${currentSelection.selectedRemIds.length} selected`
                  : 'Selection unavailable'
              }
            />
            <DetailRow label="Pending Request" value={pendingRequest ? formatToolName(pendingRequest.tool) : 'No request waiting'} />
            <div className="bridge-three-col">
              <DetailRow label="Free Tools" value={toolAvailability.free} />
              <DetailRow label="Gated Tools" value={toolAvailability.gated} />
              <DetailRow label="Hidden Tools" value={hiddenToolCount} />
            </div>
          </dl>
          {accessOpen && (
            <div className="bridge-access-editor">
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
              <p className="bridge-field-help">
                {permissionScopeOptions.find((option) => option.value === permissionScope)?.description}
              </p>
              <label className="bridge-field">
                Write mode
                <select value={permissionMode} onChange={handleModeChange}>
                  {permissionModeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {permissionScope === 'approved_document_or_folder' && (
                <div className="bridge-inline-actions">
                  <DetailRow label="Approved Root" value={approvedRootRemId ?? 'Missing approved root Rem ID'} mono />
                  <button type="button" className="bridge-button bridge-button-secondary" onClick={handleUseFocusedAsApprovedRoot}>
                    Use Focused Rem
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {pendingSection}

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
              <section className="bridge-metrics" aria-label="Bridge summary">
                <StatusMetric
                  label="Exposed"
                  value={bridgeStatus.publicToolCount ? `${bridgeStatus.publicToolCount} tools` : 'Unknown'}
                  tone={bridgeStatus.publicToolCount && bridgeStatus.publicToolCount < 20 ? 'warning' : 'success'}
                />
                <StatusMetric
                  label="Profile"
                  value={bridgeStatus.toolProfile ?? 'full'}
                  tone={profileHiddenToolCount ? 'warning' : 'success'}
                />
                <StatusMetric
                  label="Verified"
                  value={`${bridgeStatus.realPluginVerifiedTools?.length ?? 0} live`}
                  tone={bridgeStatus.realPluginVerifiedTools?.length ? 'success' : 'warning'}
                />
                <StatusMetric
                  label="Registry"
                  value={bridgeStatus.toolRegistryVersion ?? 'No stamp'}
                  tone={bridgeStatus.toolRegistryVersion ? 'success' : 'warning'}
                />
                <StatusMetric
                  label="Unverified"
                  value={bridgeStatus.runtimeUnverifiedTools?.length ?? 0}
                  tone={bridgeStatus.runtimeUnverifiedTools?.length ? 'warning' : 'success'}
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
              </section>
              <dl className="bridge-detail-list">
                <DetailRow label="Local Server" value={bridgeStatus.serverUrl} mono />
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
                <button type="button" onClick={handleHealthCheck} className="bridge-button bridge-button-secondary">
                  Run Final Health Check
                </button>
                <button type="button" onClick={handleCopyRecentRequestLogs} className="bridge-button bridge-button-secondary">
                  Copy Logs
                </button>
              </div>
              <button type="button" onClick={handleCopyDiagnostics} className="bridge-button bridge-button-secondary bridge-button-full">
                Copy Diagnostics
              </button>
              <button type="button" onClick={handleCopyFailedRequest} className="bridge-button bridge-button-secondary bridge-button-full">
                Copy Failed Request
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
