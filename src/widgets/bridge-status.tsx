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
      className="h-full w-full overflow-y-auto bg-white p-4 text-gray-900 dark:bg-gray-900 dark:text-gray-100"
      style={{ fontFamily: 'var(--font-primary, sans-serif)', minHeight: '300px' }}
    >
      <div className="mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
        <h2 className="text-lg font-semibold">RemNote ChatGPT Bridge</h2>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
          RemNote SDK access layer. AI reasoning runs outside this plugin.
        </p>
      </div>

      <section className="mb-4 rounded border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-2 text-sm font-semibold">Bridge Status</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-gray-600 dark:text-gray-300">Connection</dt>
            <dd className="rounded bg-gray-200 px-2 py-1 text-xs font-semibold dark:bg-gray-700">
              {getBridgeStatusLabel(bridgeStatus.state)}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-gray-600 dark:text-gray-300">Local Server</dt>
            <dd className="break-all text-right font-mono text-xs">{bridgeStatus.serverUrl}</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-gray-600 dark:text-gray-300">Last Event</dt>
            <dd className="text-right text-xs">{bridgeStatus.lastEvent}</dd>
          </div>
          {bridgeStatus.lastError && (
            <div className="flex items-start justify-between gap-3">
              <dt className="text-gray-600 dark:text-gray-300">Error</dt>
              <dd className="text-right text-xs text-red-600 dark:text-red-300">{bridgeStatus.lastError}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="mb-4 rounded border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-2 text-sm font-semibold">RemNote Context</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-gray-600 dark:text-gray-300">Permission Mode</dt>
            <dd className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-100">
              {getPermissionModeLabel(permissionMode)}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-gray-600 dark:text-gray-300">Focused Rem</dt>
            <dd className="text-right text-xs">
              {focusedRemStatus?.found ? focusedRemStatus.label : focusedRemStatus?.label ?? 'Checking...'}
            </dd>
          </div>
          {focusedRemStatus?.remId && (
            <div className="flex items-start justify-between gap-3">
              <dt className="text-gray-600 dark:text-gray-300">Rem ID</dt>
              <dd className="break-all text-right font-mono text-xs">{focusedRemStatus.remId}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="rounded border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-2 text-sm font-semibold">Pending Request</h3>
        {pendingRequest ? (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Tool</div>
                <div className="font-semibold">{formatToolName(pendingRequest.tool)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Impact</div>
                <div className="font-semibold">{getToolImpactLabel(pendingRequest.tool)}</div>
              </div>
            </div>
            {pendingRequest.targetRemId && (
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Target</div>
                <div className="break-all font-mono text-xs">{pendingRequest.targetRemId}</div>
              </div>
            )}
            {pendingRequest.previewMarkdown && (
              <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded border border-gray-200 bg-white p-2 text-xs dark:border-gray-700 dark:bg-gray-900">
                {pendingRequest.previewMarkdown}
              </pre>
            )}
            {pendingDecision && (
              <div className="rounded bg-yellow-50 p-2 text-xs text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100">
                {pendingDecision.reason}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleApprove}
                disabled={!pendingDecision?.allowed}
                className="flex-1 rounded bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="flex-1 rounded bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              >
                Reject
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded border border-dashed border-gray-300 p-3 text-sm text-gray-600 dark:border-gray-600 dark:text-gray-300">
            No pending request. Read/write requests from local bridge will appear here before writes run.
          </div>
        )}
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">{lastApprovalEvent}</div>
      </section>
    </div>
  );
}

renderWidget(BridgeStatusWidget);
