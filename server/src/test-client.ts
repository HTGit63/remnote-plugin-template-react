import { callMcpTool, initializeMcp, listMcpTools } from './mcp-client.js';

const port = process.env.REMNOTE_BRIDGE_MCP_PORT || '47392';
const path = process.env.REMNOTE_BRIDGE_MCP_PATH || '/mcp';
const url = process.env.REMNOTE_BRIDGE_MCP_URL || `http://127.0.0.1:${port}${path}`;
const token = process.env.REMNOTE_BRIDGE_TOKEN || '';
const command = process.argv[2] || 'get_bridge_status';
const rawArgs = process.argv[3] || '{}';
const args = JSON.parse(rawArgs) as Record<string, unknown>;

await initializeMcp({ url, token });

if (command === 'tools/list') {
  console.log(JSON.stringify(await listMcpTools({ url, token }), null, 2));
} else {
  console.log(JSON.stringify(await callMcpTool({ url, token }, command, args), null, 2));
}

