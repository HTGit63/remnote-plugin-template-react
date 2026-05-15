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
import { getPublicMcpToolNames } from './tool-registry.js';

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

function getResultPayload(response: unknown): Record<string, unknown> {
  if (typeof response !== 'object' || response === null) {
    return {};
  }

  const result = (response as { result?: unknown }).result;
  return typeof result === 'object' && result !== null ? (result as Record<string, unknown>) : {};
}

function getStructuredContent(response: unknown): Record<string, unknown> {
  const result = getResultPayload(response);
  const structuredContent = result.structuredContent;
  return typeof structuredContent === 'object' && structuredContent !== null
    ? (structuredContent as Record<string, unknown>)
    : {};
}

function getToolNamesFromList(response: unknown): string[] {
  const result = getResultPayload(response);
  const tools = result.tools;
  if (!Array.isArray(tools)) {
    return [];
  }

  return tools
    .map((tool) => (typeof tool === 'object' && tool !== null ? (tool as { name?: unknown }).name : undefined))
    .filter((name): name is string => typeof name === 'string');
}

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
    {
      const allChildren = [
        {
          remId: 'rem-existing-1',
          title: 'Existing 1',
          frontText: 'Existing 1',
          plainText: 'Existing 1',
          breadcrumbs: [fakeRem.frontText, 'Existing 1'],
          index: 0,
          hasChildren: false,
          type: 'rem',
        },
        {
          remId: 'rem-existing-2',
          title: 'Existing 2',
          frontText: 'Existing 2',
          plainText: 'Existing 2',
          breadcrumbs: [fakeRem.frontText, 'Existing 2'],
          index: 1,
          hasChildren: false,
          type: 'rem',
        },
      ];
      const maxChildren =
        typeof request.args.maxChildren === 'number' ? request.args.maxChildren : allChildren.length;
      const children = allChildren.slice(0, maxChildren);
      return {
        id: request.id,
        ok: true,
        result: {
          parentRemId: request.args.parentRemId,
          remId: request.args.parentRemId,
          children,
          childCount: allChildren.length,
          maxChildren,
          truncated: allChildren.length > children.length,
        },
      };
    }
    case 'get_rem_breadcrumbs':
      return {
        id: request.id,
        ok: true,
        result: {
          remId: request.args.remId,
          breadcrumbs: [
            { remId: 'rem-root', title: 'Root', text: 'Root' },
            { remId: request.args.remId, title: fakeRem.frontText, text: fakeRem.frontText },
          ],
        },
      };
    case 'search_rems':
    {
      const allResults = [
        {
          remId: fakeRem.remId,
          title: fakeRem.frontText,
          frontText: fakeRem.frontText,
          plainText: fakeRem.plainText,
          breadcrumbs: [fakeRem.frontText],
          index: 0,
          hasChildren: fakeRem.hasChildren,
          type: 'rem',
        },
        {
          remId: 'rem-search-2',
          title: 'Second result',
          frontText: 'Second result',
          plainText: 'Second result',
          breadcrumbs: ['Second result'],
          index: 1,
          hasChildren: false,
          type: 'rem',
        },
      ];
      const maxResults =
        typeof request.args.maxResults === 'number' ? request.args.maxResults : allResults.length;
      const results = allResults.slice(0, maxResults);
      return {
        id: request.id,
        ok: true,
        result: {
          query: request.args.query,
          contextRemId: request.args.contextRemId ?? null,
          results,
          maxResults,
          truncated: allResults.length > results.length,
          searchSupported: true,
        },
      };
    }
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
          parentId: request.args.parentRemId,
          orderedChildRemIds: request.args.orderedChildRemIds,
          orderedChildIds: request.args.orderedChildRemIds,
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
          rootInsertPosition: request.args.position ?? 'end',
          status: 'created_tree',
        },
      };
    case 'update_rem_rich':
      return {
        id: request.id,
        ok: true,
        result: { remId: request.args.remId, status: 'updated_rich' },
      };
    case 'set_rem_heading_level':
      return {
        id: request.id,
        ok: true,
        result: { remId: request.args.remId, status: 'heading_set' },
      };
    case 'set_rem_text_color':
      return {
        id: request.id,
        ok: true,
        result: { remId: request.args.remId, status: 'text_color_set' },
      };
    case 'set_rem_highlight_color':
      return {
        id: request.id,
        ok: true,
        result: { remId: request.args.remId, status: 'highlight_set' },
      };
    case 'set_text_span_color':
      return {
        id: request.id,
        ok: true,
        result: { remId: request.args.remId, status: 'span_color_set' },
      };
    case 'set_text_span_highlight':
      return {
        id: request.id,
        ok: true,
        result: { remId: request.args.remId, status: 'span_highlight_set' },
      };
    case 'set_rem_type':
      return {
        id: request.id,
        ok: true,
        result: { remId: request.args.remId, status: 'rem_type_set' },
      };
    case 'set_hide_bullet':
      return {
        id: request.id,
        ok: true,
        result: { remId: request.args.remId, status: 'hide_bullet_set' },
      };
    case 'clear_rem_formatting':
      return {
        id: request.id,
        ok: true,
        result: { remId: request.args.remId, status: 'formatting_cleared' },
      };
    case 'create_styled_rem_tree':
      return {
        id: request.id,
        ok: true,
        result: {
          rootCreatedRemId: 'rem-styled-root-1',
          createdNodeCount: 2,
          createdRemIds: ['rem-styled-root-1', 'rem-styled-child-1'],
          createdNodes: [
            {
              remId: 'rem-styled-root-1',
              parentId: request.args.parentId,
              depth: 0,
              index: 2,
              type: 'rem',
            },
            {
              remId: 'rem-styled-child-1',
              parentId: 'rem-styled-root-1',
              depth: 1,
              index: 0,
              type: 'rem',
            },
          ],
          rootInsertIndex: 2,
          rootInsertPosition: request.args.position ?? 'end',
          status: 'created_styled_tree',
        },
      };
    case 'apply_remnote_command':
      return {
        id: request.id,
        ok: true,
        result: {
          remId: request.args.target.mode === 'rem_id' ? request.args.target.remId ?? fakeRem.remId : fakeRem.remId,
          command: request.args.command,
          status: 'command_applied',
          idempotencyKey: request.args.idempotencyKey,
        },
      };
    case 'apply_structured_note_batch': {
      const dryRun = request.args.dryRun ?? false;
      return {
        id: request.id,
        ok: true,
        result: {
          status: dryRun ? 'dry_run' : 'applied',
          parentId: request.args.parentId,
          plannedNodeCount: 2,
          createdNodeCount: dryRun ? 0 : 2,
          createdRemIds: dryRun ? [] : ['rem-batch-root-1', 'rem-batch-child-1'],
          rootCreatedRemId: dryRun ? undefined : 'rem-batch-root-1',
          rootInsertIndex: dryRun ? undefined : 2,
          rootInsertPosition: request.args.position ?? 'end',
          dryRun,
          idempotencyKey: request.args.idempotencyKey,
          rollbackOnFailure: request.args.rollbackOnFailure ?? true,
          verifyAfterWrite: request.args.verifyAfterWrite ?? false,
          verification:
            dryRun || !request.args.verifyAfterWrite
              ? undefined
              : {
                  ok: true,
                  checkedRemIds: ['rem-batch-root-1', 'rem-batch-child-1'],
                  missingRemIds: [],
                  rootPlainText: 'Batch root',
                },
        },
      };
    }
    case 'create_basic_flashcard':
    case 'create_concept_card':
    case 'create_descriptor_card':
      return {
        id: request.id,
        ok: true,
        result: {
          createdRemId: 'rem-card-1',
          parentId: request.args.parentId,
          cardType:
            request.tool === 'create_concept_card'
              ? 'concept'
              : request.tool === 'create_descriptor_card'
                ? 'descriptor'
                : 'basic',
          direction: request.args.direction ?? 'both',
          status: 'created_flashcard',
        },
      };
    case 'create_cloze_card':
      return {
        id: request.id,
        ok: true,
        result: {
          createdRemId: 'rem-cloze-card-1',
          parentId: request.args.parentId,
          cardType: 'cloze',
          direction: request.args.direction ?? 'both',
          status: 'created_flashcard',
        },
      };
    case 'create_multiple_choice_card':
      return {
        id: request.id,
        ok: true,
        result: {
          createdRemId: 'rem-mc-card-1',
          parentId: request.args.parentId,
          cardType: 'multiple_choice',
          direction: request.args.direction ?? 'forward',
          createdChildRemIds: ['rem-choice-1', 'rem-choice-2'],
          status: 'created_flashcard',
        },
      };
    case 'create_list_answer_card':
      return {
        id: request.id,
        ok: true,
        result: {
          createdRemId: 'rem-list-card-1',
          parentId: request.args.parentId,
          cardType: 'list_answer',
          direction: request.args.direction ?? 'forward',
          createdChildRemIds: ['rem-list-item-1'],
          status: 'created_flashcard',
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
    if (!diagnostics.recentRequests[0]?.lifecycle.some((event) => event.phase === 'cancelled')) {
      throw new Error('Bridge diagnostics did not record cancellation lifecycle.');
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
  const toolListResponse = await listMcpTools(mcp);
  const toolNames = getToolNamesFromList(toolListResponse);
  const expectedToolNames = getPublicMcpToolNames(false);
  const tools = JSON.stringify(toolListResponse);
  if (JSON.stringify(toolNames) !== JSON.stringify(expectedToolNames)) {
    throw new Error(
      `MCP tools/list does not match public registry. Expected ${expectedToolNames.join(', ')}, got ${toolNames.join(', ')}.`
    );
  }

  if (toolNames.includes('delete_rem')) {
    throw new Error('arbitrary ID delete must not be exposed through MCP by default.');
  }

  if (!tools.includes('outputSchema')) {
    throw new Error('Expected MCP tools to declare outputSchema.');
  }

  const noAuthMcp = { url: mcp.url };
  await initializeMcp(noAuthMcp);
  const noAuthToolNames = getToolNamesFromList(await listMcpTools(noAuthMcp));
  if (JSON.stringify(noAuthToolNames) !== JSON.stringify(expectedToolNames)) {
    throw new Error(
      `No-auth MCP discovery does not expose public registry. Expected ${expectedToolNames.length}, got ${noAuthToolNames.length}.`
    );
  }

  const status = await callMcpTool(mcp, 'get_bridge_status', {});
  const statusResult = getStructuredContent(status).result as { publicTools?: string[]; publicToolCount?: number } | undefined;
  if (
    !statusResult ||
    JSON.stringify(statusResult.publicTools) !== JSON.stringify(toolNames) ||
    statusResult.publicToolCount !== toolNames.length
  ) {
    throw new Error('get_bridge_status publicTools did not match MCP tools/list.');
  }

  const unknownTool = JSON.stringify(await callMcpTool(mcp, 'not_a_real_bridge_tool', {}));
  if (!unknownTool.includes('UNKNOWN_TOOL')) {
    throw new Error('Unknown MCP tool did not return structured UNKNOWN_TOOL.');
  }

  const capabilityGuide = JSON.stringify(
    await callMcpTool(mcp, 'get_remnote_capability_guide', {
      section: 'all',
    })
  );
  if (!capabilityGuide.includes('Rems and hierarchy') || !capabilityGuide.includes('apply_structured_note_batch')) {
    throw new Error('get_remnote_capability_guide did not return the RemNote knowledge pool.');
  }

  const ping = JSON.stringify(await callMcpTool(mcp, 'ping_remnote_plugin', { message: 'smoke' }));
  if (!ping.includes('pong')) {
    throw new Error('ping_remnote_plugin did not round-trip through the mock plugin.');
  }

  const diagnosticsResponse = await callMcpTool(mcp, 'get_bridge_diagnostics', {});
  const diagnostics = JSON.stringify(diagnosticsResponse);
  const diagnosticsResult = getStructuredContent(diagnosticsResponse).result as
    | {
      hiddenTools?: Array<{ name: string }>;
      callableTools?: string[];
      actualMcpCallableTools?: string[];
      serverLocalVerifiedTools?: string[];
      registryMismatch?: { missing?: string[]; unexpected?: string[] };
      callabilitySource?: string;
      realPluginVerifiedTools?: string[];
      runtimeUnverifiedTools?: string[];
      sdkUnsupportedTools?: string[];
        recentRequestLifecycle?: Array<{ lifecycle?: Array<{ phase?: string }> }>;
      }
    | undefined;
  if (
    !diagnostics.includes(`"publicToolCount":${expectedToolNames.length}`) ||
    !diagnostics.includes('toolRegistryVersion') ||
    !diagnostics.includes('"discoveryAuthMode":"no_auth_required"') ||
    !diagnostics.includes('"callabilitySource":"registry_only_not_live_execution"')
  ) {
    throw new Error('get_bridge_diagnostics did not report the live registry, discovery auth mode, and callability source.');
  }
  if (
    !diagnosticsResult ||
    !diagnosticsResult.serverLocalVerifiedTools?.includes('get_remnote_capability_guide') ||
    !diagnosticsResult.callableTools?.includes('ping_remnote_plugin') ||
    !diagnosticsResult.callableTools?.includes('run_bridge_health_check') ||
    !diagnosticsResult.actualMcpCallableTools?.includes('get_bridge_status') ||
    diagnosticsResult.callabilitySource !== 'registry_only_not_live_execution' ||
    !diagnosticsResult.realPluginVerifiedTools?.includes('ping_remnote_plugin') ||
    !diagnosticsResult.runtimeUnverifiedTools?.includes('create_rem') ||
    !diagnosticsResult.sdkUnsupportedTools?.includes('create_folder') ||
    !diagnosticsResult.recentRequestLifecycle?.some((request) =>
      request.lifecycle?.some((event) => event.phase === 'completed')
    ) ||
    !diagnosticsResult.hiddenTools?.some((tool) => tool.name === 'delete_rem') ||
    diagnosticsResult.registryMismatch?.missing?.length ||
    diagnosticsResult.registryMismatch?.unexpected?.length
  ) {
    throw new Error('get_bridge_diagnostics did not return callable/hidden registry parity fields.');
  }

  const pluginStatus = JSON.stringify(await callMcpTool(mcp, 'get_plugin_status', {}));
  if (!pluginStatus.includes('confirm_writes')) {
    throw new Error('get_plugin_status did not return the mock permission mode.');
  }

  const health = JSON.stringify(
    await callMcpTool(mcp, 'run_bridge_health_check', {
      parentId: fakeRem.remId,
      targetRemId: fakeRem.remId,
      includeWrites: false,
      includeExistingRemMutations: false,
      timeoutMs: 2000,
    })
  );
  if (!health.includes('"status":"passed"') || !health.includes('apply_structured_note_batch')) {
    throw new Error('run_bridge_health_check did not pass safe/read health checks.');
  }

  const diagnosticsAfterHealth = JSON.stringify(await callMcpTool(mcp, 'get_bridge_diagnostics', {}));
  if (!diagnosticsAfterHealth.includes('lastHealthCheck') || !diagnosticsAfterHealth.includes('"skippedCount"')) {
    throw new Error('get_bridge_diagnostics did not surface the last health check.');
  }

  const focused = JSON.stringify(await callMcpTool(mcp, 'get_focused_rem', {}));
  if (!focused.includes('Smoke focused Rem')) {
    throw new Error('get_focused_rem did not return mock Rem content.');
  }

  const rem = JSON.stringify(await callMcpTool(mcp, 'get_rem', { remId: fakeRem.remId }));
  if (!rem.includes('Smoke focused Rem')) {
    throw new Error('get_rem did not return mock Rem content.');
  }

  const remTree = JSON.stringify(await callMcpTool(mcp, 'get_rem_tree', { remId: fakeRem.remId, depth: 1 }));
  if (!remTree.includes('Smoke focused Rem')) {
    throw new Error('get_rem_tree did not return mock Rem tree content.');
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
      parentId: fakeRem.remId,
      orderedChildIds: ['rem-existing-2', 'rem-existing-1'],
    })
  );
  if (!reorder.includes('reordered') || !reorder.includes('orderedChildIds') || !reorder.includes('rem-existing-2')) {
    throw new Error('reorder_children did not return deterministic reorder status with alias fields.');
  }

  const tree = JSON.stringify(
    await callMcpTool(mcp, 'create_rem_tree', {
      parentId: fakeRem.remId,
      position: 'end',
      tree: {
        title: 'Smoke tree',
        children: [{ title: 'Child A' }, { title: 'Child B' }],
      },
    })
  );
  if (
    !tree.includes('created_tree') ||
    !tree.includes('rem-tree-root-1') ||
    !tree.includes('"rootInsertIndex":2') ||
    !tree.includes('"rootInsertPosition":"end"')
  ) {
    throw new Error('create_rem_tree did not return ordered append status.');
  }

  const updateRich = JSON.stringify(
    await callMcpTool(mcp, 'update_rem_rich', {
      remId: fakeRem.remId,
      richText: [
        { text: 'Quadratic Functions Clean Paste-Style ' },
        { text: 'Note', styles: { color: 'green' } },
        { text: ' uses $f(x)=ax^2+bx+c$ and ' },
        { type: 'mathBlock', latex: 'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}' },
      ],
    })
  );
  if (!updateRich.includes('updated_rich')) {
    throw new Error('update_rem_rich did not return rich update status.');
  }

  const heading = JSON.stringify(
    await callMcpTool(mcp, 'set_rem_heading_level', {
      remId: fakeRem.remId,
      level: 'H2',
    })
  );
  if (!heading.includes('heading_set')) {
    throw new Error('set_rem_heading_level did not return heading status.');
  }

  const spanColor = JSON.stringify(
    await callMcpTool(mcp, 'set_text_span_color', {
      remId: fakeRem.remId,
      range: { start: 0, end: 4 },
      color: 'green',
    })
  );
  if (!spanColor.includes('span_color_set')) {
    throw new Error('set_text_span_color did not return span color status.');
  }

  const styledTree = JSON.stringify(
    await callMcpTool(mcp, 'create_styled_rem_tree', {
      parentId: fakeRem.remId,
      position: 'end',
      tree: {
        richText: [
          { text: 'Quadratic Functions Clean Paste-Style ' },
          { text: 'Note', styles: { color: 'green' } },
        ],
        style: { headingLevel: 'H2' },
        children: [
          {
            text: 'Core Idea',
            style: { headingLevel: 'H3' },
          },
        ],
      },
    })
  );
  if (!styledTree.includes('created_styled_tree') || !styledTree.includes('rem-styled-root-1')) {
    throw new Error('create_styled_rem_tree did not return styled tree status.');
  }

  const command = JSON.stringify(
    await callMcpTool(mcp, 'apply_remnote_command', {
      target: { mode: 'rem_id', remId: fakeRem.remId },
      command: 'heading_1',
      idempotencyKey: 'smoke-command-1',
    })
  );
  if (!command.includes('command_applied') || !command.includes('heading_1')) {
    throw new Error('apply_remnote_command did not return command status.');
  }

  const batchDryRun = JSON.stringify(
    await callMcpTool(mcp, 'apply_structured_note_batch', {
      target: { mode: 'parent_child', parentId: fakeRem.remId },
      operation: 'create_child_tree',
      parentId: fakeRem.remId,
      position: 'end',
      dryRun: true,
      idempotencyKey: 'smoke-batch-1',
      rollbackOnFailure: true,
      verifyAfterWrite: true,
      root: {
        richText: [
          { text: 'Batch root with \\(a^2+b^2=c^2\\)' },
          { text: ' styled', styles: { color: 'blue', underline: true } },
        ],
        style: { headingLevel: 'H2' },
        children: [{ type: 'mathBlock', latex: '\\int_0^1 x^2 dx' }],
      },
    })
  );
  if (!batchDryRun.includes('dry_run') || !batchDryRun.includes('"plannedNodeCount":2')) {
    throw new Error('apply_structured_note_batch dry run did not return planned status.');
  }

  const batchApply = JSON.stringify(
    await callMcpTool(mcp, 'apply_structured_note_batch', {
      target: { mode: 'parent_child', parentId: fakeRem.remId },
      operation: 'create_child_tree',
      parentId: fakeRem.remId,
      position: 'end',
      dryRun: false,
      idempotencyKey: 'smoke-batch-2',
      rollbackOnFailure: true,
      verifyAfterWrite: true,
      root: {
        text: 'Batch root with $E=mc^2$',
        children: [{ text: 'Child with $$x^2+y^2=z^2$$' }],
      },
    })
  );
  if (!batchApply.includes('applied') || !batchApply.includes('rem-batch-root-1') || !batchApply.includes('verification')) {
    throw new Error('apply_structured_note_batch did not return applied verification status.');
  }

  const basicCard = JSON.stringify(
    await callMcpTool(mcp, 'create_basic_flashcard', {
      parentId: fakeRem.remId,
      front: 'Quadratic function',
      back: 'A function whose highest power is 2.',
      direction: 'both',
    })
  );
  if (!basicCard.includes('created_flashcard')) {
    throw new Error('create_basic_flashcard did not return card status.');
  }

  const clozeCard = JSON.stringify(
    await callMcpTool(mcp, 'create_cloze_card', {
      parentId: fakeRem.remId,
      text: 'A parabola has a vertex.',
      clozeText: 'vertex',
    })
  );
  if (!clozeCard.includes('cloze')) {
    throw new Error('create_cloze_card did not return cloze card status.');
  }

  const rich = JSON.stringify(await callMcpTool(mcp, 'get_rem_rich', { remId: fakeRem.remId }));
  if (!rich.includes('richSupported')) {
    throw new Error('get_rem_rich did not return rich support metadata.');
  }

  const selection = JSON.stringify(await callMcpTool(mcp, 'get_current_selection', {}));
  if (!selection.includes('selectionSupported')) {
    throw new Error('get_current_selection did not return selection support metadata.');
  }

  const children = JSON.stringify(await callMcpTool(mcp, 'get_children', { remId: fakeRem.remId, limit: 1 }));
  if (
    !children.includes('"index":0') ||
    !children.includes('"childCount":2') ||
    !children.includes('"maxChildren":1') ||
    !children.includes('"truncated":true') ||
    !children.includes('Existing 1') ||
    children.includes('Existing 2')
  ) {
    throw new Error('get_children did not honor limit alias while returning ordered direct children.');
  }

  const breadcrumbs = JSON.stringify(await callMcpTool(mcp, 'get_rem_breadcrumbs', { remId: fakeRem.remId }));
  if (!breadcrumbs.includes('Root') || !breadcrumbs.includes(fakeRem.remId)) {
    throw new Error('get_rem_breadcrumbs did not return breadcrumb IDs and titles.');
  }

  const search = JSON.stringify(
    await callMcpTool(mcp, 'search_rems', {
      query: 'Smoke',
      limit: 1,
      scope: 'focused_rem_and_descendants',
    })
  );
  if (
    !search.includes('searchSupported') ||
    !search.includes(fakeRem.remId) ||
    !search.includes('"maxResults":1') ||
    !search.includes('"truncated":true') ||
    search.includes('Second result')
  ) {
    throw new Error('search_rems did not honor limit alias while returning bounded search results.');
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
