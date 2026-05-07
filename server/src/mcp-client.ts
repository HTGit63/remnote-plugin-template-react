export interface McpClientOptions {
  url: string;
  token?: string;
}

let nextId = 1;

async function postJsonRpc(options: McpClientOptions, payload: unknown): Promise<unknown> {
  const headers: Record<string, string> = {
    accept: 'application/json, text/event-stream',
    'content-type': 'application/json',
  };

  if (options.token) {
    headers.authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(options.url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`MCP request failed with ${response.status}: ${text}`);
  }

  return text ? JSON.parse(text) : undefined;
}

export async function initializeMcp(options: McpClientOptions): Promise<unknown> {
  return postJsonRpc(options, {
    jsonrpc: '2.0',
    id: nextId++,
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: {
        name: 'remnote-bridge-test-client',
        version: '0.0.1',
      },
    },
  });
}

export async function listMcpTools(options: McpClientOptions): Promise<unknown> {
  return postJsonRpc(options, {
    jsonrpc: '2.0',
    id: nextId++,
    method: 'tools/list',
    params: {},
  });
}

export async function callMcpTool(
  options: McpClientOptions,
  name: string,
  toolArguments: Record<string, unknown>
): Promise<unknown> {
  return postJsonRpc(options, {
    jsonrpc: '2.0',
    id: nextId++,
    method: 'tools/call',
    params: {
      name,
      arguments: toolArguments,
    },
  });
}

