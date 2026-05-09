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
  WRITE_APPROVAL_TIMEOUT_MS,
} from '../bridge/protocol';
import {
  DEFAULT_BRIDGE_SERVER_URL,
  INITIAL_BRIDGE_STATUS,
  getBridgeStatusLabel,
} from '../bridge/status';
import { BrowserBridgeClient } from '../bridge/client';
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
  const approvalResolverRef = useRef<((resolution: ApprovalResolution) => void) | undefined>();
  const approvalTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>();
  const pendingRequestRef = useRef<PendingApprovalRequest | null>(null);
  const permissionModeRef = useRef<PermissionMode>('confirm_writes');
  const permissionScopeRef = useRef<PermissionScope>('focused_rem_only');
  const approvedRootRemIdRef = useRef<string | null>(null);
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

  const permissionMode = normalizePermissionMode(
    useTracker(async (reactivePlugin) => {
      return await reactivePlugin.settings.getSetting<string>('bridge-permission-mode');
    })
  );

  const permissionScope = normalizePermissionScope(
    useTracker(async (reactivePlugin) => {
      return await reactivePlugin.settings.getSetting<string>('bridge-permission-scope');
    })
  );

  const approvedRootRemId =
    useTracker(async (reactivePlugin) => {
      const configuredRoot = await reactivePlugin.settings.getSetting<string>('bridge-approved-root-rem-id');
      return configuredRoot?.trim() || null;
    }) ?? null;

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

    client.connect();
    return () => {
      client.disconnect();
      clearApprovalTimeout();
      if (approvalResolverRef.current) {
        approvalResolverRef.current('APPROVAL_REJECTED');
        approvalResolverRef.current = undefined;
      }
      setPendingRequest(null);
    };
  }, [plugin, serverUrl, bridgeToken, requestApproval, cancelApproval]);

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
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
      await plugin.app.toast('Bridge diagnostics copied.');
    } catch {
      await plugin.app.toast('Could not copy diagnostics from this RemNote surface.');
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
            <DetailRow label="Tool" value={formatToolName(pendingRequest.tool)} />
            <DetailRow label="Mode" value={getPermissionModeLabel(pendingRequest.permissionMode)} />
          </div>
          <DetailRow label="Scope" value={getPermissionScopeLabel(pendingRequest.permissionScope)} />
          <DetailRow label="Summary" value={pendingRequest.summary} />
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
          <div className="bridge-two-col">
            <DetailRow label="Risk" value={pendingRequest.riskLevel.replace(/_/g, ' ')} />
            <DetailRow label="Deadline" value={new Date(pendingRequest.timeoutDeadline).toLocaleTimeString()} />
          </div>
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
        </div>
      ) : (
        <div className="bridge-empty">No write request waiting. Keep this panel open while testing writes.</div>
      )}
      <div className="bridge-footnote">{lastApprovalEvent}</div>
    </section>
  );

  return (
    <div className="bridge-shell">
      <div className="bridge-stack">
        <header className="bridge-hero">
          <div className="bridge-mark" aria-hidden="true">RN</div>
          <div className="bridge-hero-copy">
            <h2 className="bridge-title">RemNote Bridge</h2>
            <p className="bridge-subtitle">Local ChatGPT tools. Writes wait here for approval.</p>
          </div>
          <span className={statusToneClass[bridgeStatus.state] ?? statusToneClass.disconnected}>
            {getBridgeStatusLabel(bridgeStatus.state)}
          </span>
        </header>

        <section className={['bridge-task-banner', needsAction ? 'bridge-task-banner--warning' : ready ? 'bridge-task-banner--ready' : 'bridge-task-banner--offline'].join(' ')}>
          <div>
            <h3>{taskTitle}</h3>
            <p>{taskCopy}</p>
          </div>
          <button type="button" onClick={handleCopyDiagnostics} className="bridge-button bridge-button-secondary">
            Copy Diagnostics
          </button>
        </section>

        <section className="bridge-metrics" aria-label="Bridge summary">
          <StatusMetric
            label="Tools"
            value={bridgeStatus.publicToolCount ? `${bridgeStatus.publicToolCount} live` : 'Unknown'}
            tone={bridgeStatus.publicToolCount && bridgeStatus.publicToolCount < 20 ? 'warning' : 'success'}
          />
          <StatusMetric
            label="Registry"
            value={bridgeStatus.toolRegistryVersion ?? 'No stamp'}
            tone={bridgeStatus.toolRegistryVersion ? 'success' : 'warning'}
          />
          <StatusMetric
            label="Scope"
            value={getPermissionScopeLabel(permissionScope)}
            tone={permissionScope === 'workspace_allowed' ? 'warning' : 'neutral'}
          />
        </section>

        {pendingSection}

        <section className="bridge-panel bridge-panel--notice">
          <div className="bridge-section-head">
            <h3>ChatGPT Tool Refresh</h3>
          </div>
          <p className="bridge-notice-copy">
            If ChatGPT still shows only 8 tools, refresh the app or connector after restarting this server.
            Current live registry should show 24 tools unless destructive ID delete is enabled.
          </p>
        </section>

        <section className="bridge-panel">
          <div className="bridge-section-head">
            <h3>Bridge Status</h3>
          </div>
          <dl className="bridge-detail-list">
            <DetailRow label="Local Server" value={bridgeStatus.serverUrl} mono />
            {bridgeStatus.serverStartedAt && (
              <DetailRow label="Server Started" value={new Date(bridgeStatus.serverStartedAt).toLocaleTimeString()} />
            )}
            <DetailRow label="Last Event" value={bridgeStatus.lastEvent} />
            {bridgeStatus.lastError && (
              <DetailRow label="Error" value={<span className="bridge-error-text">{bridgeStatus.lastError}</span>} />
            )}
          </dl>
        </section>

        <section className="bridge-panel">
          <div className="bridge-section-head">
            <h3>RemNote Context</h3>
            <span className="bridge-pill bridge-pill-accent">{getPermissionModeLabel(permissionMode)}</span>
          </div>
          <dl className="bridge-detail-list">
            <DetailRow label="Permission Scope" value={getPermissionScopeLabel(permissionScope)} />
            {permissionScope === 'approved_document_or_folder' && (
              <DetailRow label="Approved Root" value={approvedRootRemId ?? 'Missing approved root Rem ID'} mono />
            )}
            <DetailRow
              label="Focused Rem"
              value={focusedRemStatus?.found ? focusedRemStatus.label : focusedRemStatus?.label ?? 'Checking...'}
            />
            {focusedRemStatus?.remId && <DetailRow label="Rem ID" value={focusedRemStatus.remId} mono />}
            <DetailRow
              label="Selection"
              value={
                currentSelection?.selectionSupported
                  ? `${currentSelection.selectedRemIds.length} selected`
                  : 'Selection unavailable'
              }
            />
            {currentSelection?.selectedRemIds.length ? (
              <DetailRow label="Selected IDs" value={currentSelection.selectedRemIds.join(', ')} mono />
            ) : null}
          </dl>
        </section>
      </div>
    </div>
  );
}

renderWidget(BridgeStatusWidget);
