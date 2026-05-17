import { z } from 'zod';
import {
  BRIDGE_TOOL_OUTPUT_SCHEMA,
} from './schemas.js';
import type { ToolRegistrationContext } from './tool-context.js';

export function registerStatusTools({ hub, registerTool, currentRegistry }: ToolRegistrationContext): void {
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
    async () => ({
      content: [{ type: 'text', text: hub.getStatus().connected ? 'RemNote plugin connected.' : 'RemNote plugin not connected.' }],
      structuredContent: {
        ok: true,
        result: {
          ...hub.getStatus(),
          ...currentRegistry(),
          serverStartedAt: hub.getDiagnostics().startedAt,
          recentRequestCount: hub.getDiagnostics().recentRequests.length,
        },
      },
    })
  );
}
