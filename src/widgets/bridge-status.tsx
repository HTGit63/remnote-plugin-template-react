import { renderWidget, usePlugin, useTracker } from '@remnote/plugin-sdk';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  connected: 'border-emerald-500/35 bg-emerald-500/15 text-emerald-100',
  connecting: 'border-amber-400/35 bg-amber-400/15 text-amber-100',
  disconnected: 'border-slate-500/35 bg-slate-500/20 text-slate-100',
  error: 'border-rose-400/40 bg-rose-500/15 text-rose-100',
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
    <div className="min-w-0 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</dt>
      <dd
        className={[
          'mt-1 min-w-0 overflow-hidden break-words text-sm leading-5 text-slate-100',
          mono ? 'font-mono text-[12px]' : '',
        ].join(' ')}
        style={{ overflowWrap: 'anywhere' }}
      >
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
    <div
      className="h-full w-full overflow-y-auto bg-[#090b0f] px-3 py-4 text-slate-100"
      style={{ fontFamily: 'var(--font-primary, Inter, sans-serif)', minHeight: '300px' }}
    >
      <div className="mx-auto flex w-full max-w-[520px] flex-col gap-3">
      <div className="rounded-lg border border-white/10 bg-[#111721] px-4 py-4 shadow-sm">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-cyan-300/25 bg-cyan-300/10 text-lg">
            🔌
          </div>
          <div className="min-w-0">
            <h2 className="text-[17px] font-semibold leading-6 text-white">RemNote Bridge</h2>
            <p className="mt-1 text-[12px] leading-5 text-slate-400">
              Local SDK access. Writes wait for permission.
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-white/10 bg-[#111721] p-4 shadow-sm">
        <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-white">Bridge Status</h3>
          <span
            className={[
              'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
              statusToneClass[bridgeStatus.state] ?? statusToneClass.disconnected,
            ].join(' ')}
          >
              {getBridgeStatusLabel(bridgeStatus.state)}
          </span>
        </div>
        <dl className="grid min-w-0 gap-2">
          <DetailRow label="Local Server" value={bridgeStatus.serverUrl} mono />
          <DetailRow label="Last Event" value={bridgeStatus.lastEvent} />
          {bridgeStatus.lastError && (
            <DetailRow label="Error" value={<span className="text-rose-200">{bridgeStatus.lastError}</span>} />
          )}
        </dl>
      </section>

      <section className="rounded-lg border border-white/10 bg-[#111721] p-4 shadow-sm">
        <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-white">RemNote Context</h3>
          <span className="shrink-0 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-100">
              {getPermissionModeLabel(permissionMode)}
          </span>
        </div>
        <dl className="grid min-w-0 gap-2">
          <DetailRow
            label="Focused Rem"
            value={focusedRemStatus?.found ? focusedRemStatus.label : focusedRemStatus?.label ?? 'Checking...'}
          />
          {focusedRemStatus?.remId && (
            <DetailRow label="Rem ID" value={focusedRemStatus.remId} mono />
          )}
        </dl>
      </section>

      <section className="rounded-lg border border-white/10 bg-[#111721] p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-white">Pending Request</h3>
        {pendingRequest ? (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <DetailRow label="Tool" value={formatToolName(pendingRequest.tool)} />
              <DetailRow label="Impact" value={getToolImpactLabel(pendingRequest.tool)} />
            </div>
            {pendingRequest.targetRemId && (
              <DetailRow label="Target" value={pendingRequest.targetRemId} mono />
            )}
            {pendingRequest.previewMarkdown && (
              <pre
                className="max-h-44 min-w-0 overflow-y-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/30 p-3 text-[12px] leading-5 text-slate-100"
                style={{ overflowWrap: 'anywhere' }}
              >
                {pendingRequest.previewMarkdown}
              </pre>
            )}
            {pendingDecision && (
              <div className="rounded-md border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
                {pendingDecision.reason}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleApprove}
                disabled={!pendingDecision?.allowed}
                className="min-h-[38px] flex-1 rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="min-h-[38px] flex-1 rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/15"
              >
                Reject
              </button>
            </div>
          </div>
        ) : (
          <div
            className="min-w-0 rounded-md border border-dashed border-white/20 bg-white/[0.04] p-3 text-sm leading-5 text-slate-300"
            style={{ overflowWrap: 'anywhere' }}
          >
            No pending request. Read/write requests from local bridge will appear here before writes run.
          </div>
        )}
        <div className="mt-3 min-w-0 break-words text-xs leading-5 text-slate-500">{lastApprovalEvent}</div>
      </section>
      </div>
    </div>
  );
}

renderWidget(BridgeStatusWidget);
