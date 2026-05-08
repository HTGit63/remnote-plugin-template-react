import { renderWidget, usePlugin, useTracker } from '@remnote/plugin-sdk';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import '../style.css';
import '../index.css';
import {
  type ApprovalResolution,
  type BridgeToolName,
  type PendingApprovalRequest,
  type PermissionMode,
  BRIDGE_TOOL_ANNOTATIONS,
  WRITE_APPROVAL_TIMEOUT_MS,
} from '../bridge/protocol';
import {
  DEFAULT_BRIDGE_SERVER_URL,
  INITIAL_BRIDGE_STATUS,
  getBridgeStatusLabel,
} from '../bridge/status';
import { BrowserBridgeClient } from '../bridge/client';
import { getPermissionDecision, getPermissionModeLabel, normalizePermissionMode } from '../remnote/permissions';
import { getFocusedRemStatus } from '../remnote/read';

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

export function BridgeStatusWidget() {
  const plugin = usePlugin();
  const [pendingRequest, setPendingRequest] = useState<PendingApprovalRequest | null>(null);
  const [lastApprovalEvent, setLastApprovalEvent] = useState('No approval activity yet.');
  const [bridgeStatus, setBridgeStatus] = useState(INITIAL_BRIDGE_STATUS);
  const approvalResolverRef = useRef<((resolution: ApprovalResolution) => void) | undefined>();
  const approvalTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>();
  const permissionModeRef = useRef<PermissionMode>('confirm_writes');

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

  const pendingDecision = pendingRequest
    ? getPermissionDecision(permissionMode, pendingRequest.tool)
    : undefined;

  useEffect(() => {
    permissionModeRef.current = permissionMode;
  }, [permissionMode]);

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
      return Promise.resolve('APPROVAL_REJECTED');
    }

    setPendingRequest(request);
    setLastApprovalEvent(`Awaiting approval for ${request.tool} request ${request.id}.`);

    return new Promise<ApprovalResolution>((resolve) => {
      approvalResolverRef.current = resolve;
      approvalTimeoutRef.current = setTimeout(() => {
        approvalResolverRef.current = undefined;
        setPendingRequest(null);
        setLastApprovalEvent(`Approval timed out for ${request.tool} request ${request.id}.`);
        resolve('APPROVAL_TIMEOUT');
      }, WRITE_APPROVAL_TIMEOUT_MS);
    });
  }, []);

  useEffect(() => {
    const client = new BrowserBridgeClient({
      plugin,
      serverUrl,
      token: bridgeToken,
      getPermissionMode: () => permissionModeRef.current,
      requestApproval,
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
  }, [plugin, serverUrl, bridgeToken, requestApproval]);

  const handleApprove = async () => {
    if (!pendingRequest) {
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

  const approveLabel = pendingDecision?.destructive
    ? 'Approve Destructive Write'
    : pendingRequest
      ? 'Approve Write'
      : 'Approve';

  const pendingSection = (
    <section
      className={['bridge-section bridge-request-section', pendingRequest ? 'bridge-section--attention' : '']
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
          <DetailRow label="Summary" value={pendingRequest.summary} />
          {pendingRequest.targetRemId && <DetailRow label="Target Rem" value={pendingRequest.targetRemId} mono />}
          {pendingRequest.targetTitle && <DetailRow label="Target Title" value={pendingRequest.targetTitle} />}
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
          {pendingRequest.previewMarkdown && <pre className="bridge-preview">{pendingRequest.previewMarkdown}</pre>}
          {pendingRequest.warning && <div className="bridge-decision-note">{pendingRequest.warning}</div>}
          {pendingDecision && <div className="bridge-decision-note">{pendingDecision.reason}</div>}
          <div className="bridge-actions" role="group" aria-label="Bridge approval actions">
            <button
              type="button"
              onClick={handleApprove}
              disabled={!pendingDecision?.allowed}
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
        <div className="bridge-empty">No write request waiting.</div>
      )}
      <div className="bridge-footnote">{lastApprovalEvent}</div>
    </section>
  );

  return (
    <div className="bridge-shell">
      <div className="bridge-stack">
        <header className="bridge-hero">
          <div className="bridge-mark" aria-hidden="true">
            B
          </div>
          <div className="bridge-hero-copy">
            <h2 className="bridge-title">RemNote Bridge</h2>
            <p className="bridge-subtitle">Local SDK access. Writes wait for permission.</p>
          </div>
        </header>

        {pendingSection}

        <section className="bridge-section">
          <div className="bridge-section-head">
            <h3>Bridge Status</h3>
            <span className={statusToneClass[bridgeStatus.state] ?? statusToneClass.disconnected}>
              {getBridgeStatusLabel(bridgeStatus.state)}
            </span>
          </div>
          <dl className="bridge-detail-list">
            <DetailRow label="Local Server" value={bridgeStatus.serverUrl} mono />
            <DetailRow label="Last Event" value={bridgeStatus.lastEvent} />
            {bridgeStatus.lastError && (
              <DetailRow label="Error" value={<span className="bridge-error-text">{bridgeStatus.lastError}</span>} />
            )}
          </dl>
        </section>

        <section className="bridge-section">
          <div className="bridge-section-head">
            <h3>RemNote Context</h3>
            <span className="bridge-pill bridge-pill-accent">{getPermissionModeLabel(permissionMode)}</span>
          </div>
          <dl className="bridge-detail-list">
            <DetailRow
              label="Focused Rem"
              value={focusedRemStatus?.found ? focusedRemStatus.label : focusedRemStatus?.label ?? 'Checking...'}
            />
            {focusedRemStatus?.remId && <DetailRow label="Rem ID" value={focusedRemStatus.remId} mono />}
          </dl>
        </section>
      </div>
    </div>
  );
}

renderWidget(BridgeStatusWidget);
