import { WebSocket } from 'ws';
import {
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
        result: { targetRemId: request.args.remId, createdRemId: 'rem-child-1', status: 'appended' },
      };
    case 'create_rem':
      return {
        id: request.id,
        ok: true,
        result: { createdRemId: 'rem-created-1', parentId: request.args.parentId ?? null, status: 'created' },
      };
    default:
      return {
        id: request.id,
        ok: false,
        error: {
          code: 'UNKNOWN_TOOL',
          message: `Smoke mock does not handle ${request.tool}.`,
        },
      };
  }
}

async function connectMockPlugin(wsUrl: string): Promise<WebSocket> {
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
      const message = JSON.parse(raw.toString()) as BridgeRequest | BridgeServerHello;
      if ('type' in message && message.type === 'server_hello') {
        resolve(ws);
        return;
      }
      ws.send(JSON.stringify(bridgeResponse(message as BridgeRequest)));
    });
    ws.on('error', reject);
  });
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
    !tools.includes('get_plugin_status') ||
    !tools.includes('get_focused_rem') ||
    !tools.includes('append_to_rem')
  ) {
    throw new Error('Expected MCP tools were not listed.');
  }

  const ping = JSON.stringify(await callMcpTool(mcp, 'ping_remnote_plugin', { message: 'smoke' }));
  if (!ping.includes('pong')) {
    throw new Error('ping_remnote_plugin did not round-trip through the mock plugin.');
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
  if (!append.includes('rem-child-1')) {
    throw new Error('append_to_rem did not return mock child Rem ID.');
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

  const failedAppend = JSON.stringify(
    await callMcpTool(mcp, 'append_to_rem', {
      remId: 'missing-rem',
      markdown: 'This should fail cleanly',
    })
  );
  if (!failedAppend.includes('REM_NOT_FOUND')) {
    throw new Error('append_to_rem failure did not return REM_NOT_FOUND.');
  }

  const statusAfterFailure = JSON.stringify(await callMcpTool(mcp, 'get_bridge_status', {}));
  if (!statusAfterFailure.includes('"connected":true')) {
    throw new Error('Bridge status did not survive failed append request.');
  }

  console.log('Server smoke passed.');
} finally {
  ws.close();
  await app.stop();
}
