import { describe, expect, test } from 'vitest';
import { registerReadTools } from '../server/src/tools/register-read-tools';
import { GET_DOCUMENT_OR_FOLDER_TREE_INPUT_SCHEMA } from '../server/src/tools/schemas';
import type { McpToolResult, ToolRegistrationContext } from '../server/src/tools/tool-context';
import type { BridgeResponse, BridgeToolArgs, BridgeToolName } from '../shared/bridge/protocol';

type Handler = (args: any) => Promise<McpToolResult>;

function success(id: string, result: Record<string, unknown>): BridgeResponse {
  return { id, ok: true, result };
}

describe('read tool argument routing', () => {
  test('get_document_or_folder_tree accepts remId alias and forwards it as rootRemId', async () => {
    const handlers: Record<string, Handler> = {};
    const calls: Array<{ tool: BridgeToolName; args: unknown }> = [];
    const callPlugin = async <TTool extends BridgeToolName>(
      tool: TTool,
      args: BridgeToolArgs[TTool]
    ): Promise<BridgeResponse> => {
      calls.push({ tool, args });
      return success('tree', {
        rootRemId: (args as any).rootRemId,
        rootType: 'rem',
        source: 'requested_root',
        tree: { remId: (args as any).rootRemId, frontText: 'Root', plainText: 'Root', backText: '', breadcrumbs: [], hasChildren: false },
        truncated: false,
      });
    };

    registerReadTools({
      registerTool: ((name: string, _config: unknown, handler: Handler) => {
        handlers[name] = handler;
        return undefined;
      }) as ToolRegistrationContext['registerTool'],
      callPlugin: callPlugin as ToolRegistrationContext['callPlugin'],
      currentRegistry: (() => ({})) as ToolRegistrationContext['currentRegistry'],
      exposeDeleteTool: false,
      hub: {} as ToolRegistrationContext['hub'],
    });

    const result = await handlers.get_document_or_folder_tree({ remId: 'rem-123', depth: 2 });

    expect(result.structuredContent?.ok).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      tool: 'get_document_or_folder_tree',
      args: { rootRemId: 'rem-123', depth: 2 },
    });
  });

  test('get_document_or_folder_tree schema rejects unknown fallback args', () => {
    expect(GET_DOCUMENT_OR_FOLDER_TREE_INPUT_SCHEMA.safeParse({ rootId: 'wrong', depth: 2 }).success).toBe(false);
    expect(GET_DOCUMENT_OR_FOLDER_TREE_INPUT_SCHEMA.safeParse({ remId: 'rem-123', depth: 2 }).success).toBe(true);
  });
});
