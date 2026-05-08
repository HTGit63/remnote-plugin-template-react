import { renderWidget, usePlugin, useTracker } from '@remnote/plugin-sdk';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import '../style.css';
import '../index.css';
import {
  type BridgeToolName,
  type PendingApprovalRequest,
  type PermissionMode,
  BRIDGE_TOOL_ANNOTATIONS,
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
      <dt className="bridge-detail-label">{label}</dt>
      <dd className={['bridge-detail-value', mono ? 'bridge-detail-value--mono' : ''].filter(Boolean).join(' ')}>
        {value}
      </dd>
    </div>
  );
}

export function BridgeStatusWidget() {
  const plugin = usePlugin();
  const [pendingRequest, setPendingRequest] = useState<PendingApprovalRequest | null>(null);
  const [lastApprovalEvent, setLastApprovalEvent] = useState('No approval activity yet.');
  const [bridgeStatus, setBridgeStatus] = useState(INITIAL_BRIDGE_STATUS);
  const approvalResolverRef = useRef<((approved: boolean) => void) | undefined>();
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
    async (approved: boolean) => {
      if (!pendingRequest || !approvalResolverRef.current) {
        return;
      }

      clearApprovalTimeout();
      approvalResolverRef.current(approved);
      approvalResolverRef.current = undefined;
      setLastApprovalEvent(
        `${approved ? 'Approved' : 'Rejected'} ${pendingRequest.tool} request ${pendingRequest.id}.`
      );
      setPendingRequest(null);
      await plugin.app.toast(approved ? 'Bridge request approved.' : 'Bridge request rejected.');
    },
    [pendingRequest, plugin]
  );

  const requestApproval = useCallback((request: PendingApprovalRequest): Promise<boolean> => {
    if (approvalResolverRef.current) {
      return Promise.resolve(false);
    }

    setPendingRequest(request);
    setLastApprovalEvent(`Awaiting approval for ${request.tool} request ${request.id}.`);

    return new Promise<boolean>((resolve) => {
      approvalResolverRef.current = resolve;
      approvalTimeoutRef.current = setTimeout(() => {
        approvalResolverRef.current = undefined;
        setPendingRequest(null);
        setLastApprovalEvent(`Approval timed out for ${request.tool} request ${request.id}.`);
        resolve(false);
      }, 90000);
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
        approvalResolverRef.current(false);
        approvalResolverRef.current = undefined;
      }
      setPendingRequest(null);
    };
  }, [plugin, serverUrl, bridgeToken, requestApproval]);

  const handleApprove = async () => {
    if (!pendingRequest) {
      return;
    }

    await resolveApproval(true);
  };

  const handleReject = async () => {
    if (!pendingRequest) {
      return;
    }

    await resolveApproval(false);
  };

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

        <section className="bridge-section">
          <div className="bridge-section-head">
            <h3>Pending Request</h3>
          </div>
          {pendingRequest ? (
            <div className="bridge-pending">
              <div className="bridge-two-col">
                <DetailRow label="Tool" value={formatToolName(pendingRequest.tool)} />
                <DetailRow label="Impact" value={getToolImpactLabel(pendingRequest.tool)} />
              </div>
              {pendingRequest.targetRemId && (
                <DetailRow label="Target" value={pendingRequest.targetRemId} mono />
              )}
              {pendingRequest.previewMarkdown && (
                <pre className="bridge-preview">{pendingRequest.previewMarkdown}</pre>
              )}
              {pendingDecision && <div className="bridge-decision-note">{pendingDecision.reason}</div>}
              <div className="bridge-actions">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={!pendingDecision?.allowed}
                  className="bridge-button bridge-button-approve"
                >
                  Approve
                </button>
                <button type="button" onClick={handleReject} className="bridge-button bridge-button-reject">
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="bridge-empty">
              No pending request. Read/write requests from local bridge will appear here before writes run.
            </div>
          )}
          <div className="bridge-footnote">{lastApprovalEvent}</div>
        </section>
      </div>
    </div>
  );
}

renderWidget(BridgeStatusWidget);
