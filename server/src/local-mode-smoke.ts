import { WebSocket } from 'ws';
import type {
  BridgePluginHello,
  BridgeRequest,
  BridgeResponse,
  BridgeServerHello,
  BridgeToolName,
  SerializedRem,
} from '../../shared/bridge/protocol.js';
import { startCompanionApp } from './app.js';

const token = 'local-mode-smoke-token';
const localPairingDisabledMessage =
  'Server is in local-token mode. ChatGPT pairing is disabled. Use hosted mode for ChatGPT connector access.';
let nextId = 1;

const fakeRem: SerializedRem = {
  remId: 'rem-local-smoke-1',
  frontText: 'Local mode smoke Rem',
  backText: '',
  plainText: 'Local mode smoke Rem',
  breadcrumbs: ['Local mode smoke Rem'],
  hasChildren: false,
};

async function mcpRequest(
  url: string,
  method: string,
  params: Record<string, unknown>,
  bearerToken?: string
): Promise<{ status: number; text: string; json: unknown }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/event-stream',
      'content-type': 'application/json',
      ...(bearerToken ? { authorization: `Bearer ${bearerToken}` } : {}),
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: nextId++,
      method,
      params,
    }),
  });
  const text = await response.text();
  return {
    status: response.status,
    text,
    json: text ? JSON.parse(text) : null,
  };
}

async function postJson(url: string, body: unknown): Promise<{ status: number; text: string }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return {
    status: response.status,
    text: await response.text(),
  };
}

async function mcpToolCall(
  url: string,
  name: string,
  args: Record<string, unknown>,
  bearerToken?: string
) {
  return mcpRequest(url, 'tools/call', {
    name,
    arguments: args,
  }, bearerToken);
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
          focusedRem: {
            found: true,
            remId: fakeRem.remId,
            label: fakeRem.frontText,
            hasChildren: false,
          },
        },
      };
    case 'get_focused_rem':
      return { id: request.id, ok: true, result: fakeRem };
    case 'get_rem_tree':
      return {
        id: request.id,
        ok: true,
        result: {
          ...fakeRem,
          children: [],
        },
      };
    case 'apply_structured_note_batch':
      return {
        id: request.id,
        ok: true,
        result: {
          status: request.args.dryRun ? 'dry_run' : 'applied',
          parentId: request.args.parentId,
          createdRemIds: ['rem-local-batch-root-1'],
          verification: { checked: true, missingIds: [] },
        },
      };
    case 'create_or_replace_note_from_markdown':
      return {
        id: request.id,
        ok: true,
        result: {
          ok: true,
          dryRun: request.args.safetyOptions?.dryRun ?? false,
          mode: request.args.mode ?? 'create_child',
          status: request.args.safetyOptions?.dryRun ? 'dry_run' : 'created',
          rootRemId: request.args.safetyOptions?.dryRun ? undefined : 'rem-local-markdown-root-1',
          createdRemIds: request.args.safetyOptions?.dryRun ? [] : ['rem-local-markdown-root-1'],
          updatedRemIds: [],
          skippedRemIds: [],
          nodeCount: 3,
          maxDepth: 2,
          sourceHash: 'fnv1a32:local-source-smoke',
          outputHash: 'fnv1a32:local-output-smoke',
          idempotencyKey: request.args.safetyOptions?.idempotencyKey,
          verification: {
            passed: true,
            missingSourceSnippets: [],
            checkedSnippetCount: 3,
          },
        },
      };
    default:
      return {
        id: request.id,
        ok: false,
        error: {
          code: 'UNKNOWN_TOOL',
          message: `Unhandled local smoke bridge tool ${request.tool}.`,
        },
      };
  }
}

async function connectMockPlugin(
  wsUrl: string,
  seenTools: BridgeToolName[],
  bridgeToken?: string
): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => reject(new Error('Mock plugin did not receive server_hello.')), 3000);
    ws.on('open', () => {
      const hello: BridgePluginHello = {
        type: 'plugin_hello',
        protocolVersion: 1,
        clientName: 'remnote-plugin',
        ...(bridgeToken ? { token: bridgeToken } : {}),
      };
      ws.send(JSON.stringify(hello));
    });
    ws.on('message', (raw) => {
      const message = JSON.parse(raw.toString()) as BridgeServerHello | BridgeRequest;
      if ('type' in message && message.type === 'server_hello') {
        clearTimeout(timer);
        resolve(ws);
        return;
      }
      const request = message as BridgeRequest;
      seenTools.push(request.tool);
      ws.send(JSON.stringify(bridgeResponse(request)));
    });
    ws.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function assertNoPluginNotPaired(texts: string[]): void {
  const offender = texts.find((text) => text.includes('PLUGIN_NOT_PAIRED'));
  if (offender) {
    throw new Error(`Local mode returned PLUGIN_NOT_PAIRED: ${offender}`);
  }
}

async function runLocalBearerMode(): Promise<void> {
  const app = await startCompanionApp({
    deploymentMode: 'local',
    bridgePort: 0,
    mcpPort: 0,
    bridgeToken: token,
    toolProfile: 'full',
    allowNoToken: false,
    allowRemote: false,
    allowCors: false,
  });
  const baseUrl = `http://127.0.0.1:${app.mcpPort}`;
  const mcpUrl = `${baseUrl}${app.config.mcpPath}`;
  const healthUrl = `${baseUrl}/health`;
  const diagnosticsUrl = `${baseUrl}/diagnostics`;
  const seenTools: BridgeToolName[] = [];
  const texts: string[] = [];
  let ws: WebSocket | undefined;

  try {
    const list = await mcpRequest(mcpUrl, 'tools/list', {}, undefined);
    texts.push(list.text);
    if (list.status !== 200 || !list.text.includes('get_plugin_status')) {
      throw new Error(`tools/list without auth failed in local bearer mode: ${list.status} ${list.text}`);
    }

    const health = await fetch(healthUrl);
    const healthText = await health.text();
    texts.push(healthText);
    if (health.status !== 200 || !healthText.includes('"bridge"') || !healthText.includes('"deploymentMode":"local"')) {
      throw new Error(`/health missed local bridge status: ${health.status} ${healthText}`);
    }

    const localPairing = await postJson(`${baseUrl}/pairing/create`, {
      clientName: 'Local mode should not pair ChatGPT',
    });
    texts.push(localPairing.text);
    if (
      localPairing.status !== 403 ||
      !localPairing.text.includes(localPairingDisabledMessage) ||
      localPairing.text.includes('"status":"connected"')
    ) {
      throw new Error(`Local mode claimed ChatGPT pairing was usable: ${localPairing.status} ${localPairing.text}`);
    }

    const unauthCall = await mcpToolCall(mcpUrl, 'get_plugin_status', {}, undefined);
    texts.push(unauthCall.text);
    if (unauthCall.status !== 401) {
      throw new Error(`tools/call without bearer did not return 401: ${unauthCall.status} ${unauthCall.text}`);
    }

    const unauthDiagnostics = await fetch(diagnosticsUrl);
    if (unauthDiagnostics.status !== 401) {
      throw new Error(`/diagnostics without bearer did not return 401: ${unauthDiagnostics.status}`);
    }

    ws = await connectMockPlugin(`ws://127.0.0.1:${app.bridgePort}${app.config.bridgePath}`, seenTools, token);

    const authedPing = await mcpToolCall(mcpUrl, 'ping_remnote_plugin', { message: 'local bearer' }, token);
    texts.push(authedPing.text);
    if (authedPing.status !== 200 || !authedPing.text.includes('pong')) {
      throw new Error(`tools/call with bearer did not reach mock plugin: ${authedPing.status} ${authedPing.text}`);
    }

    const authedDiagnostics = await fetch(diagnosticsUrl, {
      headers: { authorization: `Bearer ${token}` },
    });
    const diagnosticsText = await authedDiagnostics.text();
    texts.push(diagnosticsText);
    if (
      authedDiagnostics.status !== 200 ||
      !diagnosticsText.includes('"deploymentMode":"local"') ||
      !diagnosticsText.includes('"localTokenRequired":true') ||
      !diagnosticsText.includes('"hostedPairingEnabled":false') ||
      !diagnosticsText.includes(localPairingDisabledMessage)
    ) {
      throw new Error(`/diagnostics missed local mode proof: ${authedDiagnostics.status} ${diagnosticsText}`);
    }

    for (const [toolName, args] of [
      ['get_bridge_status', {}],
      ['get_bridge_diagnostics', {}],
      ['get_plugin_status', {}],
      ['get_focused_rem', {}],
      ['get_rem_tree', { remId: fakeRem.remId, depth: 1 }],
      [
        'apply_structured_note_batch',
        {
          operation: 'create_child_tree',
          parentId: fakeRem.remId,
          position: 'end',
          dryRun: false,
          idempotencyKey: 'local-mode-smoke-batch',
          rollbackOnFailure: true,
          verifyAfterWrite: true,
          root: { text: 'Local batch root' },
        },
      ],
      [
        'create_or_replace_note_from_markdown',
        {
          parentRemId: fakeRem.remId,
          mode: 'create_child',
          duplicatePolicy: 'create_new',
          markdownText: '# Local Markdown\n\nParagraph with \\(q_1\\).',
          safetyOptions: {
            dryRun: false,
            verifyAfterWrite: true,
            rollbackOnFailure: true,
            idempotencyKey: 'local-mode-smoke-markdown',
          },
          limits: {
            maxDepth: 8,
            maxNodes: 200,
          },
        },
      ],
    ] as Array<[string, Record<string, unknown>]>) {
      const result = await mcpToolCall(mcpUrl, toolName, args, token);
      texts.push(result.text);
      if (result.status !== 200 || !result.text.includes('"ok":true')) {
        throw new Error(`${toolName} failed in local bearer mode: ${result.status} ${result.text}`);
      }
    }

    for (const expectedBridgeTool of [
      'get_status',
      'get_focused_rem',
      'get_rem_tree',
      'apply_structured_note_batch',
      'create_or_replace_note_from_markdown',
    ] as const) {
      if (!seenTools.includes(expectedBridgeTool)) {
        throw new Error(`${expectedBridgeTool} did not route through local BridgeHub WebSocket path.`);
      }
    }

    assertNoPluginNotPaired(texts);
  } finally {
    ws?.close();
    await app.stop();
  }
}

async function runLocalNoTokenMode(): Promise<void> {
  const app = await startCompanionApp({
    deploymentMode: 'local',
    bridgePort: 0,
    mcpPort: 0,
    bridgeToken: '',
    allowNoToken: true,
    allowRemote: false,
    allowCors: false,
  });
  const seenTools: BridgeToolName[] = [];
  let ws: WebSocket | undefined;

  try {
    ws = await connectMockPlugin(`ws://127.0.0.1:${app.bridgePort}${app.config.bridgePath}`, seenTools);
    const mcpUrl = `http://127.0.0.1:${app.mcpPort}${app.config.mcpPath}`;
    const result = await mcpToolCall(mcpUrl, 'get_plugin_status', {});
    if (result.status !== 200 || !result.text.includes('"ok":true')) {
      throw new Error(`No-token local tool call failed despite REMNOTE_BRIDGE_ALLOW_NO_TOKEN=1: ${result.status} ${result.text}`);
    }
    if (!seenTools.includes('get_status')) {
      throw new Error('No-token local mode did not route get_plugin_status through BridgeHub.');
    }
    assertNoPluginNotPaired([result.text]);
  } finally {
    ws?.close();
    await app.stop();
  }
}

async function runDisconnectedLocalMode(): Promise<void> {
  const app = await startCompanionApp({
    deploymentMode: 'local',
    bridgePort: 0,
    mcpPort: 0,
    bridgeToken: token,
    toolProfile: 'full',
    allowNoToken: false,
    allowRemote: false,
    allowCors: false,
  });
  const mcpUrl = `http://127.0.0.1:${app.mcpPort}${app.config.mcpPath}`;
  const texts: string[] = [];

  try {
    for (const [toolName, args] of [
      ['get_plugin_status', {}],
      ['get_focused_rem', {}],
      ['get_rem_tree', { remId: fakeRem.remId, depth: 1 }],
      [
        'apply_structured_note_batch',
        {
          operation: 'create_child_tree',
          parentId: fakeRem.remId,
          position: 'end',
          dryRun: false,
          idempotencyKey: 'local-mode-smoke-disconnected',
          rollbackOnFailure: true,
          verifyAfterWrite: true,
          root: { text: 'Disconnected local batch root' },
        },
      ],
    ] as Array<[string, Record<string, unknown>]>) {
      const result = await mcpToolCall(mcpUrl, toolName, args, token);
      texts.push(result.text);
      if (result.status !== 200 || !result.text.includes('PLUGIN_NOT_CONNECTED')) {
        throw new Error(`${toolName} disconnected local result was not PLUGIN_NOT_CONNECTED: ${result.status} ${result.text}`);
      }
    }
    assertNoPluginNotPaired(texts);
  } finally {
    await app.stop();
  }
}

await runLocalBearerMode();
await runLocalNoTokenMode();
await runDisconnectedLocalMode();

console.log('Local mode smoke passed.');
