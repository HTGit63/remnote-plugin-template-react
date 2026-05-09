import { WebSocket } from 'ws';
import {
  type BridgeCancelRequest,
  type BridgeRequest,
  type BridgeResponse,
  type BridgeServerHello,
  type SerializedRem,
} from '../../src/bridge/protocol.js';
import { startCompanionApp } from './app.js';
import { callMcpTool, initializeMcp, listMcpTools } from './mcp-client.js';

const token = 'smoke-token';

const fakeRem: SerializedRem = {
  remId: 'rem-smoke-1',
  frontText: 'Smoke focused Rem',
  backText: 'Back text',
  plainText: 'Smoke focused Rem\n\nBack text',
  breadcrumbs: ['Smoke focused Rem'],
  hasChildren: false,
};

type MockBridgeResponder = (request: BridgeRequest, socket: WebSocket) => BridgeResponse | undefined;
type MockCancelHandler = (request: BridgeCancelRequest) => void;

function bridgeResponse(request: BridgeRequest): BridgeResponse {
  switch (request.tool) {
    case 'ping':
      return { id: request.id, ok: true, result: { message: 'pong' } };
    case 'get_status':
      return {
        id: request.id,
        ok: true,
        result: {
          connected: true,
          permissionMode: 'confirm_writes',
          permissionScope: 'workspace_allowed',
          approvedRootRemId: null,
          focusedRem: {
            found: true,
            remId: fakeRem.remId,
            label: fakeRem.frontText,
            hasChildren: fakeRem.hasChildren,
          },
        },
      };
    case 'get_focused_rem':
      return { id: request.id, ok: true, result: fakeRem };
    case 'get_rem':
    case 'get_rem_tree':
      return { id: request.id, ok: true, result: fakeRem };
    case 'get_rem_rich':
      return {
        id: request.id,
        ok: true,
        result: {
          remId: request.args.remId,
          frontText: fakeRem.frontText,
          backText: fakeRem.backText,
          plainText: fakeRem.plainText,
          rich: { front: ['Smoke focused Rem'], back: ['Back text'] },
          richSupported: true,
          detectedContentTypes: ['plain_text'],
        },
      };
    case 'get_current_selection':
      return {
        id: request.id,
        ok: true,
        result: {
          focusedRemId: fakeRem.remId,
          selectedRemIds: [fakeRem.remId],
          selectionSupported: true,
        },
      };
    case 'get_children':
      return {
        id: request.id,
        ok: true,
        result: {
          parentRemId: request.args.parentRemId,
          children: [
            {
              remId: 'rem-existing-1',
              title: 'Existing 1',
              index: 0,
              hasChildren: false,
              type: 'rem',
            },
            {
              remId: 'rem-existing-2',
              title: 'Existing 2',
              index: 1,
              hasChildren: false,
              type: 'rem',
            },
          ],
          truncated: false,
        },
      };
    case 'get_rem_breadcrumbs':
      return {
        id: request.id,
        ok: true,
        result: {
          remId: request.args.remId,
          breadcrumbs: [
            { remId: 'rem-root', title: 'Root' },
            { remId: request.args.remId, title: fakeRem.frontText },
          ],
        },
      };
    case 'search_rems':
      return {
        id: request.id,
        ok: true,
        result: {
          query: request.args.query,
          contextRemId: request.args.contextRemId ?? null,
          results: [
            {
              remId: fakeRem.remId,
              title: fakeRem.frontText,
              index: 0,
              hasChildren: fakeRem.hasChildren,
              type: 'rem',
            },
          ],
          truncated: false,
          searchSupported: true,
        },
      };
    case 'get_document_or_folder_tree':
      return {
        id: request.id,
        ok: true,
        result: {
          rootRemId: request.args.rootRemId ?? fakeRem.remId,
          rootType: 'document',
          source: request.args.rootRemId ? 'requested_root' : 'focused_portal',
          tree: {
            ...fakeRem,
            children: [
              {
                remId: 'rem-existing-1',
                frontText: 'Existing 1',
                backText: '',
                plainText: 'Existing 1',
                breadcrumbs: ['Smoke focused Rem', 'Existing 1'],
                hasChildren: false,
              },
            ],
          },
          truncated: false,
        },
      };
    case 'append_to_rem':
      if (request.args.remId === 'missing-rem') {
        return {
          id: request.id,
          ok: false,
          error: {
            code: 'REM_NOT_FOUND',
            message: 'Target Rem was not found.',
          },
        };
      }

      return {
        id: request.id,
        ok: true,
        result: {
          targetRemId: request.args.remId,
          createdRemId: 'rem-child-1',
          insertIndex: request.args.position === 'start' ? 0 : 2,
          position: request.args.position ?? 'end',
          status: 'appended',
        },
      };
    case 'create_rem':
      return {
        id: request.id,
        ok: true,
        result: {
          createdRemId: 'rem-created-1',
          parentId: request.args.parentId ?? null,
          insertIndex: request.args.parentId ? 2 : undefined,
          insertPosition: request.args.parentId ? 'end' : undefined,
          status: 'created',
        },
      };
    case 'create_document':
      return {
        id: request.id,
        ok: true,
        result: {
          createdRemId: 'rem-document-1',
          parentId: request.args.parentId ?? null,
          insertIndex: request.args.parentId ? 2 : undefined,
          insertPosition: request.args.parentId ? 'end' : undefined,
          document: true,
          status: 'created_document',
        },
      };
    case 'create_folder':
      return {
        id: request.id,
        ok: false,
        error: {
          code: 'SDK_UNSUPPORTED',
          message: 'Folder creation is not exposed by the installed @remnote/plugin-sdk typings.',
        },
      };
    case 'update_rem':
      return {
        id: request.id,
        ok: true,
        result: { updatedRemId: request.args.remId, status: 'updated' },
      };
    case 'move_rem':
      if (request.args.remId === 'bad-rem-id') {
        return {
          id: request.id,
          ok: false,
          error: {
            code: 'REM_NOT_FOUND',
            message: 'Target Rem was not found.',
          },
        };
      }

      return {
        id: request.id,
        ok: true,
        result: {
          movedRemId: request.args.remId,
          newParentId: request.args.newParentId,
          index: request.args.index,
          status: 'moved',
        },
      };
    case 'reorder_children':
      return {
        id: request.id,
        ok: true,
        result: {
          parentRemId: request.args.parentRemId,
          orderedChildRemIds: request.args.orderedChildRemIds,
          status: 'reordered',
        },
      };
    case 'replace_rem':
      return {
        id: request.id,
        ok: true,
        result: { remId: request.args.remId },
      };
    case 'delete_focused_rem':
    case 'delete_selected_rem':
      return {
        id: request.id,
        ok: true,
        result: {
          deletedRemId: fakeRem.remId,
          recursive: request.args.recursive ?? false,
          preview: {
            targetRemId: fakeRem.remId,
            targetTitle: fakeRem.frontText,
            parentRemId: 'rem-root',
            parentTitle: 'Root',
            childCount: 0,
            descendantCount: 0,
            recursive: request.args.recursive ?? false,
            requiresConfirmText: 'DELETE',
          },
          status: 'deleted',
        },
      };
    case 'delete_rem':
      return {
        id: request.id,
        ok: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'delete_rem is not exposed in the default MCP smoke path.',
        },
      };
    case 'create_rem_tree':
      return {
        id: request.id,
        ok: true,
        result: {
          rootCreatedRemId: 'rem-tree-root-1',
          createdNodeCount: 3,
          createdRemIds: ['rem-tree-root-1', 'rem-tree-child-1', 'rem-tree-child-2'],
          rootInsertIndex: 2,
          status: 'created_tree',
        },
      };
    default: {
      const unhandled = request as BridgeRequest;
      return {
        id: unhandled.id,
        ok: false,
        error: {
          code: 'UNKNOWN_TOOL',
          message: `Smoke mock does not handle ${unhandled.tool}.`,
        },
      };
    }
  }
}

async function connectMockPlugin(
  wsUrl: string,
  responder: MockBridgeResponder = (request) => bridgeResponse(request),
  onCancel?: MockCancelHandler
): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.on('open', () => {
      ws.send(
        JSON.stringify({
          type: 'plugin_hello',
          protocolVersion: 1,
          clientName: 'remnote-plugin',
          token,
        })
      );
    });
    ws.on('message', (raw) => {
      const message = JSON.parse(raw.toString()) as BridgeRequest | BridgeServerHello | BridgeCancelRequest;
      if ('type' in message && message.type === 'server_hello') {
        resolve(ws);
        return;
      }
      if ('type' in message && message.type === 'cancel_request') {
        onCancel?.(message);
        return;
      }
      const response = responder(message as BridgeRequest, ws);
      if (response) {
        ws.send(JSON.stringify(response));
      }
    });
    ws.on('error', reject);
  });
}

async function runReliabilitySmoke() {
  const timeoutApp = await startCompanionApp({
    bridgePort: 0,
    mcpPort: 0,
    bridgeToken: token,
    allowRemote: false,
    allowCors: false,
    requestTimeoutMs: 50,
  });
  const timeoutWs = await connectMockPlugin(
    `ws://127.0.0.1:${timeoutApp.bridgePort}${timeoutApp.config.bridgePath}`,
    () => undefined
  );
  const timeoutMcp = {
    url: `http://127.0.0.1:${timeoutApp.mcpPort}${timeoutApp.config.mcpPath}`,
    token,
  };

  try {
    await initializeMcp(timeoutMcp);
    const timeoutResult = JSON.stringify(
      await callMcpTool(timeoutMcp, 'ping_remnote_plugin', { message: 'no response' })
    );
    if (!timeoutResult.includes('TIMEOUT')) {
      throw new Error('Server timeout did not return TIMEOUT.');
    }
  } finally {
    timeoutWs.close();
    await timeoutApp.stop();
  }

  const disconnectApp = await startCompanionApp({
    bridgePort: 0,
    mcpPort: 0,
    bridgeToken: token,
    allowRemote: false,
    allowCors: false,
    requestTimeoutMs: 5000,
  });
  const disconnectWs = await connectMockPlugin(
    `ws://127.0.0.1:${disconnectApp.bridgePort}${disconnectApp.config.bridgePath}`,
    (_request, socket) => {
      socket.close();
      return undefined;
    }
  );
  const disconnectMcp = {
    url: `http://127.0.0.1:${disconnectApp.mcpPort}${disconnectApp.config.mcpPath}`,
    token,
  };

  try {
    await initializeMcp(disconnectMcp);
    const disconnectResult = JSON.stringify(
      await callMcpTool(disconnectMcp, 'ping_remnote_plugin', { message: 'disconnect' })
    );
    if (!disconnectResult.includes('PLUGIN_NOT_CONNECTED')) {
      throw new Error('Plugin disconnect did not return PLUGIN_NOT_CONNECTED.');
    }
  } finally {
    disconnectWs.close();
    await disconnectApp.stop();
  }
}

async function runCancellationSmoke() {
  const cancelApp = await startCompanionApp({
    bridgePort: 0,
    mcpPort: 0,
    bridgeToken: token,
    allowRemote: false,
    allowCors: false,
    requestTimeoutMs: 5000,
  });
  let cancelMessage: BridgeCancelRequest | undefined;
  const cancelWs = await connectMockPlugin(
    `ws://127.0.0.1:${cancelApp.bridgePort}${cancelApp.config.bridgePath}`,
    () => undefined,
    (request) => {
      cancelMessage = request;
    }
  );
  const abortController = new AbortController();

  try {
    const pending = cancelApp.hub.callPlugin(
      'ping',
      { message: 'cancel this request' },
      5000,
      abortController.signal
    );
    abortController.abort();
    const response = await pending;
    if (response.ok || response.error.code !== 'CLIENT_DISCONNECTED') {
      throw new Error('Aborted bridge request did not return CLIENT_DISCONNECTED.');
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
    if (!cancelMessage || cancelMessage.reason !== 'client_disconnected') {
      throw new Error('Bridge did not send cancel_request to the plugin on client disconnect.');
    }
    const diagnostics = cancelApp.hub.getDiagnostics();
    if (diagnostics.recentRequests[0]?.errorCode !== 'CLIENT_DISCONNECTED') {
      throw new Error('Bridge diagnostics did not record CLIENT_DISCONNECTED outcome.');
    }
  } finally {
    cancelWs.close();
    await cancelApp.stop();
  }
}

const app = await startCompanionApp({
  bridgePort: 0,
  mcpPort: 0,
  bridgeToken: token,
  allowRemote: false,
  allowCors: false,
});

const ws = await connectMockPlugin(`ws://127.0.0.1:${app.bridgePort}${app.config.bridgePath}`);
const mcp = {
  url: `http://127.0.0.1:${app.mcpPort}${app.config.mcpPath}`,
  token,
};

try {
  await initializeMcp(mcp);
  const tools = JSON.stringify(await listMcpTools(mcp));
  if (
    !tools.includes('ping_remnote_plugin') ||
    !tools.includes('get_bridge_diagnostics') ||
    !tools.includes('get_plugin_status') ||
    !tools.includes('get_focused_rem') ||
    !tools.includes('create_rem') ||
    !tools.includes('append_to_rem') ||
    !tools.includes('create_document') ||
    !tools.includes('create_folder') ||
    !tools.includes('update_rem') ||
    !tools.includes('replace_rem') ||
    !tools.includes('move_rem') ||
    !tools.includes('reorder_children') ||
    !tools.includes('create_rem_tree') ||
    !tools.includes('delete_focused_rem') ||
    !tools.includes('delete_selected_rem') ||
    !tools.includes('get_rem_rich') ||
    !tools.includes('get_current_selection') ||
    !tools.includes('get_children') ||
    !tools.includes('get_rem_breadcrumbs') ||
    !tools.includes('search_rems') ||
    !tools.includes('get_document_or_folder_tree')
  ) {
    throw new Error('Expected MCP tools were not listed.');
  }

  if (tools.includes('delete_rem')) {
    throw new Error('arbitrary ID delete must not be exposed through MCP by default.');
  }

  if (!tools.includes('outputSchema')) {
    throw new Error('Expected MCP tools to declare outputSchema.');
  }

  const ping = JSON.stringify(await callMcpTool(mcp, 'ping_remnote_plugin', { message: 'smoke' }));
  if (!ping.includes('pong')) {
    throw new Error('ping_remnote_plugin did not round-trip through the mock plugin.');
  }

  const diagnostics = JSON.stringify(await callMcpTool(mcp, 'get_bridge_diagnostics', {}));
  if (!diagnostics.includes('"publicToolCount":24') || !diagnostics.includes('toolRegistryVersion')) {
    throw new Error('get_bridge_diagnostics did not report the live 24-tool registry.');
  }

  const pluginStatus = JSON.stringify(await callMcpTool(mcp, 'get_plugin_status', {}));
  if (!pluginStatus.includes('confirm_writes')) {
    throw new Error('get_plugin_status did not return the mock permission mode.');
  }

  const focused = JSON.stringify(await callMcpTool(mcp, 'get_focused_rem', {}));
  if (!focused.includes('Smoke focused Rem')) {
    throw new Error('get_focused_rem did not return mock Rem content.');
  }

  const append = JSON.stringify(
    await callMcpTool(mcp, 'append_to_rem', {
      remId: fakeRem.remId,
      markdown: 'Child note from smoke test',
    })
  );
  if (!append.includes('rem-child-1') || !append.includes('"position":"end"') || !append.includes('"insertIndex":2')) {
    throw new Error('append_to_rem did not default to ordered append/end behavior.');
  }

  const prepend = JSON.stringify(
    await callMcpTool(mcp, 'append_to_rem', {
      remId: fakeRem.remId,
      markdown: 'Child note from smoke test at top',
      position: 'start',
    })
  );
  if (!prepend.includes('rem-child-1')) {
    throw new Error('append_to_rem position=start did not return mock child Rem ID.');
  }

  const create = JSON.stringify(
    await callMcpTool(mcp, 'create_rem', {
      parentId: fakeRem.remId,
      markdown: 'Created Rem from smoke test',
    })
  );
  if (!create.includes('rem-created-1') || !create.includes('created')) {
    throw new Error('create_rem did not return mock created Rem ID.');
  }

  const document = JSON.stringify(
    await callMcpTool(mcp, 'create_document', {
      parentId: fakeRem.remId,
      markdown: 'Created document from smoke test',
    })
  );
  if (!document.includes('rem-document-1') || !document.includes('created_document')) {
    throw new Error('create_document did not return mock document status.');
  }

  const folder = JSON.stringify(
    await callMcpTool(mcp, 'create_folder', {
      parentId: fakeRem.remId,
      markdown: 'Created folder from smoke test',
    })
  );
  if (!folder.includes('SDK_UNSUPPORTED')) {
    throw new Error('create_folder did not report SDK_UNSUPPORTED honestly.');
  }

  const update = JSON.stringify(
    await callMcpTool(mcp, 'update_rem', {
      remId: fakeRem.remId,
      markdown: 'Updated smoke Rem',
    })
  );
  if (!update.includes('updated')) {
    throw new Error('update_rem did not return updated status.');
  }

  const replace = JSON.stringify(
    await callMcpTool(mcp, 'replace_rem', {
      remId: fakeRem.remId,
      markdown: 'Replaced smoke Rem',
    })
  );
  if (!replace.includes(fakeRem.remId)) {
    throw new Error('replace_rem did not return replaced Rem ID.');
  }

  const move = JSON.stringify(
    await callMcpTool(mcp, 'move_rem', {
      remId: 'rem-child-1',
      newParentId: fakeRem.remId,
      index: 0,
    })
  );
  if (!move.includes('moved')) {
    throw new Error('move_rem did not return moved status.');
  }

  const reorder = JSON.stringify(
    await callMcpTool(mcp, 'reorder_children', {
      parentRemId: fakeRem.remId,
      orderedChildRemIds: ['rem-existing-2', 'rem-existing-1'],
    })
  );
  if (!reorder.includes('reordered') || !reorder.includes('rem-existing-2')) {
    throw new Error('reorder_children did not return deterministic reorder status.');
  }

  const tree = JSON.stringify(
    await callMcpTool(mcp, 'create_rem_tree', {
      parentId: fakeRem.remId,
      tree: {
        title: 'Smoke tree',
        children: [{ title: 'Child A' }, { title: 'Child B' }],
      },
    })
  );
  if (!tree.includes('created_tree') || !tree.includes('rem-tree-root-1') || !tree.includes('"rootInsertIndex":2')) {
    throw new Error('create_rem_tree did not return ordered append status.');
  }

  const rich = JSON.stringify(await callMcpTool(mcp, 'get_rem_rich', { remId: fakeRem.remId }));
  if (!rich.includes('richSupported')) {
    throw new Error('get_rem_rich did not return rich support metadata.');
  }

  const selection = JSON.stringify(await callMcpTool(mcp, 'get_current_selection', {}));
  if (!selection.includes('selectionSupported')) {
    throw new Error('get_current_selection did not return selection support metadata.');
  }

  const children = JSON.stringify(await callMcpTool(mcp, 'get_children', { parentRemId: fakeRem.remId }));
  if (!children.includes('"index":0') || !children.includes('Existing 1') || !children.includes('Existing 2')) {
    throw new Error('get_children did not return ordered direct children.');
  }

  const breadcrumbs = JSON.stringify(await callMcpTool(mcp, 'get_rem_breadcrumbs', { remId: fakeRem.remId }));
  if (!breadcrumbs.includes('Root') || !breadcrumbs.includes(fakeRem.remId)) {
    throw new Error('get_rem_breadcrumbs did not return breadcrumb IDs and titles.');
  }

  const search = JSON.stringify(await callMcpTool(mcp, 'search_rems', { query: 'Smoke' }));
  if (!search.includes('searchSupported') || !search.includes(fakeRem.remId)) {
    throw new Error('search_rems did not return bounded search results.');
  }

  const documentTree = JSON.stringify(await callMcpTool(mcp, 'get_document_or_folder_tree', { depth: 1 }));
  if (!documentTree.includes('focused_portal') || !documentTree.includes('Existing 1')) {
    throw new Error('get_document_or_folder_tree did not return a bounded structure tree.');
  }

  const deleteFocused = JSON.stringify(
    await callMcpTool(mcp, 'delete_focused_rem', {
      recursive: false,
      confirmText: 'DELETE',
    })
  );
  if (!deleteFocused.includes('deleted') || !deleteFocused.includes('requiresConfirmText')) {
    throw new Error('delete_focused_rem did not return strict delete preview/result shape.');
  }

  const deleteSelected = JSON.stringify(
    await callMcpTool(mcp, 'delete_selected_rem', {
      recursive: false,
      confirmText: 'DELETE',
    })
  );
  if (!deleteSelected.includes('deleted') || !deleteSelected.includes(fakeRem.remId)) {
    throw new Error('delete_selected_rem did not return mock selected delete status.');
  }

  const failedAppend = JSON.stringify(
    await callMcpTool(mcp, 'append_to_rem', {
      remId: 'missing-rem',
      markdown: 'This should fail cleanly',
    })
  );
  if (!failedAppend.includes('REM_NOT_FOUND')) {
    throw new Error('append_to_rem failure did not return REM_NOT_FOUND.');
  }

  const failedMove = JSON.stringify(
    await callMcpTool(mcp, 'move_rem', {
      remId: 'bad-rem-id',
      newParentId: fakeRem.remId,
      index: 0,
    })
  );
  if (!failedMove.includes('REM_NOT_FOUND')) {
    throw new Error('move_rem failure did not return REM_NOT_FOUND.');
  }

  const statusAfterFailure = JSON.stringify(await callMcpTool(mcp, 'get_bridge_status', {}));
  if (!statusAfterFailure.includes('"connected":true')) {
    throw new Error('Bridge status did not survive failed append request.');
  }

} finally {
  ws.close();
  await app.stop();
}

await runReliabilitySmoke();
await runCancellationSmoke();
console.log('Server smoke passed.');
