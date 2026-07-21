import { z } from 'zod';
import {
  BRIDGE_TOOL_OUTPUT_SCHEMA,
} from './schemas.js';
import type { ToolRegistrationContext } from './tool-context.js';

export function registerStatusTools({ hub, registerTool, currentRegistry, runtimeInfo, principal }: ToolRegistrationContext): void {
  registerTool(
    'get_bridge_status',
    {
      title: 'Get bridge status',
      description: 'Use this when you need to know whether the RemNote plugin is connected.',
      inputSchema: z.object({}),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async () => {
      const startedAt = Date.now();
      const registry = currentRegistry();
      const status = hub.getStatus();
      const diagnostics = hub.getDiagnostics();
      const operationId = `status-${Date.now().toString(36)}`;
      const phaseDurations = { totalMs: Date.now() - startedAt };
      return {
        content: [{ type: 'text', text: status.connected ? 'RemNote plugin connected.' : 'RemNote plugin not connected.' }],
        structuredContent: {
          ok: true,
          status: 'PASS',
          toolName: 'get_bridge_status',
          operationId,
          target: { deploymentMode: runtimeInfo?.deploymentMode ?? 'unknown' },
          created: [],
          updated: [],
          deleted: [],
          createdRemIds: [],
          updatedRemIds: [],
          deletedRemIds: [],
          counts: { created: 0, updated: 0, deleted: 0 },
          verification: { attempted: true, passed: status.connected, method: 'bridge_hub_status', pluginConnected: status.connected },
          phaseDurations,
          warnings: [],
          result: {
            ...status,
            ...(runtimeInfo ?? {}),
            ...registry,
            gitSha: runtimeInfo?.deployCommit ?? runtimeInfo?.gitCommit ?? registry.gitSha,
            branchName: runtimeInfo?.deployBranch ?? runtimeInfo?.gitBranch ?? registry.branchName,
            activeToolProfile: registry.activeToolTier,
            permissionMode: principal?.trustedWriteMode ?? 'unauthenticated_or_discovery',
            permissionScope: principal?.accessScope ?? 'unauthenticated_or_discovery',
            serverStartedAt: diagnostics.startedAt,
            recentRequestCount: diagnostics.recentRequests.length,
            pluginConnected: status.connected,
            activePluginConnectionCount: diagnostics.activePluginConnectionCount ?? 0,
            connectorCompatNoAuthTools: diagnostics.connectorCompatNoAuthTools ?? false,
            connectorCompatRouting: diagnostics.connectorCompatRouting ?? 'disabled',
            pluginAuthMode: principal?.authMode ?? 'unauthenticated_or_discovery',
            sharedPluginAuthentication: principal?.authMode === 'hosted_oauth',
            sessionRouterStatus: diagnostics.sessionRouter,
          },
          standard: {
            status: 'PASS',
            toolName: 'get_bridge_status',
            operationId,
            target: { deploymentMode: runtimeInfo?.deploymentMode ?? 'unknown' },
            created: [],
            updated: [],
            deleted: [],
            createdRemIds: [],
            updatedRemIds: [],
            deletedRemIds: [],
            counts: { created: 0, updated: 0, deleted: 0 },
            verification: { attempted: true, passed: status.connected, method: 'bridge_hub_status', pluginConnected: status.connected },
            phaseDurations,
            warnings: [],
          },
        },
      };
    }
  );
}
