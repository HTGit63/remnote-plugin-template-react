import { callMcpTool, initializeMcp, listMcpTools, type McpClientOptions } from './mcp-client.js';

type LiveTestMode = 'read_only' | 'safe_sandbox' | 'full_sandbox';
type ToolStatus = {
  tool: string;
  status: 'passed' | 'failed' | 'skipped';
  reason?: string;
  error?: string;
};

function getMode(): LiveTestMode {
  const mode = process.env.REMNOTE_LIVE_TEST_MODE ?? process.env.BRIDGE_LIVE_TEST_MODE ?? 'safe_sandbox';
  if (mode === 'read_only' || mode === 'safe_sandbox' || mode === 'full_sandbox') {
    return mode;
  }
  throw new Error('REMNOTE_LIVE_TEST_MODE must be read_only, safe_sandbox, or full_sandbox.');
}

function getStructuredResult(response: unknown): Record<string, unknown> {
  if (typeof response !== 'object' || response === null) {
    return {};
  }
  const result = (response as { result?: unknown }).result;
  if (typeof result !== 'object' || result === null) {
    return {};
  }
  const structuredContent = (result as { structuredContent?: unknown }).structuredContent;
  if (typeof structuredContent !== 'object' || structuredContent === null) {
    return {};
  }
  const payload = (structuredContent as { result?: unknown }).result;
  return typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {};
}

function getToolNames(response: unknown): string[] {
  const result = typeof response === 'object' && response !== null ? (response as { result?: unknown }).result : undefined;
  const tools = typeof result === 'object' && result !== null ? (result as { tools?: unknown }).tools : undefined;
  return Array.isArray(tools)
    ? tools
        .map((tool) => (typeof tool === 'object' && tool !== null ? (tool as { name?: unknown }).name : undefined))
        .filter((name): name is string => typeof name === 'string')
    : [];
}

async function runTool(
  mcp: McpClientOptions,
  tool: string,
  args: Record<string, unknown>,
  results: ToolStatus[]
): Promise<unknown | undefined> {
  try {
    const response = await callMcpTool(mcp, tool, args);
    const text = JSON.stringify(response);
    if (text.includes('"ok":false') || text.includes('"isError":true')) {
      results.push({ tool, status: 'failed', error: text.slice(0, 1000) });
      return response;
    }
    results.push({ tool, status: 'passed' });
    return response;
  } catch (error: unknown) {
    results.push({
      tool,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
}

async function findRegressionRoot(mcp: McpClientOptions, results: ToolStatus[]): Promise<string | undefined> {
  const envRoot = process.env.REMNOTE_LIVE_TEST_PARENT_ID ?? process.env.REMNOTE_TEST_ROOT_ID;
  if (envRoot?.trim()) {
    return envRoot.trim();
  }

  const search = await runTool(
    mcp,
    'search_rems',
    {
      query: 'MCP Regression Test Root',
      maxResults: 1,
      scope: 'workspace_allowed',
    },
    results
  );
  const payload = getStructuredResult(search);
  const first = Array.isArray(payload.results) ? payload.results[0] : undefined;
  const remId =
    typeof first === 'object' && first !== null && typeof (first as { remId?: unknown }).remId === 'string'
      ? (first as { remId: string }).remId
      : undefined;
  if (remId) {
    return remId;
  }

  results.push({
    tool: 'sandbox_root',
    status: 'skipped',
    reason:
      'No MCP Regression Test Root found. Set REMNOTE_LIVE_TEST_PARENT_ID to a disposable Rem to run sandbox writes.',
  });
  return undefined;
}

const mode = getMode();
const mcp: McpClientOptions = {
  url: process.env.REMNOTE_MCP_URL ?? 'http://127.0.0.1:47392/mcp',
  token: process.env.REMNOTE_MCP_TOKEN ?? process.env.REMNOTE_BRIDGE_TOKEN,
};
const results: ToolStatus[] = [];

try {
  await initializeMcp(mcp);
  const listed = getToolNames(await listMcpTools(mcp));
  results.push({
    tool: 'tools/list',
    status: listed.length >= 40 ? 'passed' : 'failed',
    reason: `${listed.length} tools listed`,
  });

  await runTool(mcp, 'get_bridge_status', {}, results);
  await runTool(mcp, 'get_bridge_diagnostics', {}, results);
  await runTool(mcp, 'ping_remnote_plugin', { message: 'live-test' }, results);
  await runTool(mcp, 'get_plugin_status', {}, results);
  await runTool(mcp, 'get_focused_rem', {}, results);

  if (mode !== 'read_only') {
    const parentId = await findRegressionRoot(mcp, results);
    if (parentId) {
      await runTool(
        mcp,
        'apply_structured_note_batch',
        {
          target: { mode: 'parent_child', parentId },
          operation: 'create_child_tree',
          position: 'end',
          dryRun: mode !== 'full_sandbox',
          idempotencyKey: `live-${mode}-${Date.now()}`,
          rollbackOnFailure: true,
          verifyAfterWrite: mode === 'full_sandbox',
          note: {
            root: {
              text: 'MCP Regression Batch Note',
              style: { headingLevel: 'H2', color: 'blue' },
              children: [
                {
                  text: 'Inline math \\(a^2+b^2=c^2\\)',
                  style: { highlight: 'yellow' },
                },
                {
                  type: 'mathBlock',
                  latex: '\\int_0^1 x^2 dx',
                },
              ],
            },
          },
        },
        results
      );
    }
  }
} catch (error: unknown) {
  results.push({
    tool: 'live-test-runner',
    status: 'failed',
    error: error instanceof Error ? error.message : String(error),
  });
}

const passedTools = results.filter((result) => result.status === 'passed').map((result) => result.tool);
const failedTools = results.filter((result) => result.status === 'failed');
const skippedTools = results.filter((result) => result.status === 'skipped');
const report = {
  mode,
  mcpUrl: mcp.url,
  testedAt: new Date().toISOString(),
  passedTools,
  failedTools,
  skippedTools,
};

console.log(JSON.stringify(report, null, 2));
if (failedTools.length > 0) {
  process.exitCode = 1;
}
