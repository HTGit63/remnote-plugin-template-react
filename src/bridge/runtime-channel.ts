import type { RNPlugin } from '@remnote/plugin-sdk';
import type {
  ApprovalResolution,
  PendingApprovalRequest,
} from '../../shared/bridge/protocol';
import { WRITE_APPROVAL_TIMEOUT_MS } from '../../shared/bridge/protocol';
import type { BridgeStatusSnapshot } from './status';

export const BRIDGE_RUNTIME_STATUS_KEY = 'remnotemcp-runtime-status-v1';
export const BRIDGE_RUNTIME_APPROVAL_REQUEST_KEY = 'remnotemcp-runtime-approval-request-v1';
export const BRIDGE_RUNTIME_APPROVAL_RESOLUTION_KEY = 'remnotemcp-runtime-approval-resolution-v1';
export const BRIDGE_RUNTIME_ENABLED_KEY = 'remnotemcp-runtime-enabled-v1';
export const BRIDGE_RUNTIME_RECONNECT_GENERATION_KEY = 'remnotemcp-runtime-reconnect-generation-v1';

export interface BridgeRuntimeApprovalResolution {
  requestId: string;
  resolution: ApprovalResolution;
  resolvedAt: string;
}

interface BridgeRuntimeChannelOptions {
  openApprovalPanel: () => Promise<void>;
  pollIntervalMs?: number;
  defaultTimeoutMs?: number;
}

interface ActiveApproval {
  request: PendingApprovalRequest;
  resolve: (resolution: ApprovalResolution) => void;
  deadlineAt: number;
  timer?: ReturnType<typeof setTimeout>;
}

export async function resolveBridgeRuntimeApproval(
  plugin: RNPlugin,
  requestId: string,
  resolution: ApprovalResolution
): Promise<void> {
  const value: BridgeRuntimeApprovalResolution = {
    requestId,
    resolution,
    resolvedAt: new Date().toISOString(),
  };
  await plugin.storage.setSession(BRIDGE_RUNTIME_APPROVAL_RESOLUTION_KEY, value);
}

export async function setBridgeRuntimeEnabled(plugin: RNPlugin, enabled: boolean): Promise<void> {
  await plugin.storage.setLocal(BRIDGE_RUNTIME_ENABLED_KEY, enabled);
}

export async function requestBridgeRuntimeReconnect(plugin: RNPlugin): Promise<void> {
  const current = await plugin.storage.getLocal<number>(BRIDGE_RUNTIME_RECONNECT_GENERATION_KEY);
  await plugin.storage.setLocal(
    BRIDGE_RUNTIME_RECONNECT_GENERATION_KEY,
    Number.isFinite(current) ? Math.floor(current as number) + 1 : 1
  );
}

export class BridgeRuntimeChannel {
  private readonly pollIntervalMs: number;
  private readonly defaultTimeoutMs: number;
  private activeApproval: ActiveApproval | null = null;

  constructor(
    private readonly plugin: RNPlugin,
    private readonly options: BridgeRuntimeChannelOptions
  ) {
    this.pollIntervalMs = Math.max(10, options.pollIntervalMs ?? 100);
    this.defaultTimeoutMs = Math.max(this.pollIntervalMs, options.defaultTimeoutMs ?? WRITE_APPROVAL_TIMEOUT_MS);
  }

  publishStatus(status: BridgeStatusSnapshot): Promise<void> {
    return this.plugin.storage.setSession(BRIDGE_RUNTIME_STATUS_KEY, status);
  }

  requestApproval(request: PendingApprovalRequest): Promise<ApprovalResolution> {
    if (this.activeApproval) {
      return Promise.resolve('APPROVAL_PENDING');
    }

    return new Promise<ApprovalResolution>((resolve) => {
      const parsedDeadline = new Date(request.timeoutDeadline).getTime();
      this.activeApproval = {
        request,
        resolve,
        deadlineAt: Number.isFinite(parsedDeadline)
          ? parsedDeadline
          : Date.now() + this.defaultTimeoutMs,
      };
      void this.beginApproval(request);
    });
  }

  cancelApproval(requestId: string, _message: string): void {
    if (this.activeApproval?.request.id !== requestId) {
      return;
    }
    void this.finishApproval(requestId, 'REQUEST_CANCELLED');
  }

  private async beginApproval(request: PendingApprovalRequest): Promise<void> {
    try {
      await this.plugin.storage.setSession(BRIDGE_RUNTIME_APPROVAL_RESOLUTION_KEY, null);
      await this.plugin.storage.setSession(BRIDGE_RUNTIME_APPROVAL_REQUEST_KEY, request);
      await this.options.openApprovalPanel();
      this.schedulePoll(request.id);
    } catch {
      await this.finishApproval(request.id, 'APPROVAL_REJECTED');
    }
  }

  private schedulePoll(requestId: string): void {
    const active = this.activeApproval;
    if (!active || active.request.id !== requestId) {
      return;
    }
    active.timer = setTimeout(() => {
      void this.pollApproval(requestId);
    }, this.pollIntervalMs);
  }

  private async pollApproval(requestId: string): Promise<void> {
    const active = this.activeApproval;
    if (!active || active.request.id !== requestId) {
      return;
    }

    const stored = await this.plugin.storage.getSession<BridgeRuntimeApprovalResolution>(
      BRIDGE_RUNTIME_APPROVAL_RESOLUTION_KEY
    );
    if (stored?.requestId === requestId) {
      await this.finishApproval(requestId, stored.resolution);
      return;
    }

    if (Date.now() >= active.deadlineAt) {
      await this.finishApproval(requestId, 'APPROVAL_TIMEOUT');
      return;
    }
    this.schedulePoll(requestId);
  }

  private async finishApproval(
    requestId: string,
    resolution: ApprovalResolution
  ): Promise<void> {
    const active = this.activeApproval;
    if (!active || active.request.id !== requestId) {
      return;
    }
    this.activeApproval = null;
    if (active.timer) {
      clearTimeout(active.timer);
    }
    await Promise.all([
      this.plugin.storage.setSession(BRIDGE_RUNTIME_APPROVAL_REQUEST_KEY, null),
      this.plugin.storage.setSession(BRIDGE_RUNTIME_APPROVAL_RESOLUTION_KEY, null),
    ]);
    active.resolve(resolution);
  }
}
