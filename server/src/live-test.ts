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

function unwrapToolResult(response: unknown): Record<string, unknown> {
  const payload = getStructuredResult(response);
  const nested = payload.result;
  return typeof nested === 'object' && nested !== null ? (nested as Record<string, unknown>) : payload;
}

function stringField(record: Record<string, unknown>, field: string): string | undefined {
  return typeof record[field] === 'string' ? record[field] as string : undefined;
}

function stringArrayField(record: Record<string, unknown>, field: string): string[] {
  return Array.isArray(record[field])
    ? (record[field] as unknown[]).filter((value): value is string => typeof value === 'string')
    : [];
}

function liveMarkdown(title: string, sectionCount: number): string {
  return [
    `# ${title}`,
    '',
    ...Array.from({ length: sectionCount }, (_, index) => [
      `## Section ${index + 1}`,
      '',
      `Body ${index + 1} preserves text, inline math \\(x_${index + 1}\\), and source order.`,
      '',
    ]).flat(),
  ].join('\n');
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

function isToolErrorResponse(response: unknown): boolean {
  if (typeof response !== 'object' || response === null) {
    return false;
  }
  const result = (response as { result?: unknown; error?: unknown }).result;
  if ((response as { error?: unknown }).error) {
    return true;
  }
  if (typeof result !== 'object' || result === null) {
    return false;
  }
  if ((result as { isError?: unknown }).isError === true) {
    return true;
  }
  const structuredContent = (result as { structuredContent?: unknown }).structuredContent;
  if (typeof structuredContent !== 'object' || structuredContent === null) {
    return false;
  }
  return (structuredContent as { ok?: unknown }).ok === false;
}

function withToolTier(options: McpClientOptions, toolTier: string): McpClientOptions {
  const url = new URL(options.url);
  url.searchParams.set('tool_tier', toolTier);
  return {
    ...options,
    url: url.toString(),
  };
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
    if (isToolErrorResponse(response)) {
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

async function cleanupCurrentSessionRoot(
  dangerMcp: McpClientOptions,
  rootRemId: string,
  confirmTitle: string,
  expectedAncestorId: string,
  idempotencyKey: string,
  results: ToolStatus[]
) {
  await runTool(
    dangerMcp,
    'delete_rem_by_id',
    {
      remId: rootRemId,
      dryRun: true,
      confirmTitle,
      expectedParentId: expectedAncestorId,
      expectedAncestorId,
      requireCreatedInCurrentSession: true,
      requirePriorDryRun: true,
      idempotencyKey,
    },
    results
  );
  await runTool(
    dangerMcp,
    'delete_rem_by_id',
    {
      remId: rootRemId,
      dryRun: false,
      confirmTitle,
      expectedParentId: expectedAncestorId,
      expectedAncestorId,
      requireCreatedInCurrentSession: true,
      requirePriorDryRun: true,
      idempotencyKey,
    },
    results
  );
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
  const diagnosticMcp = withToolTier(mcp, 'developer');
  const noteWriterMcp = withToolTier(mcp, 'note_writer');
  const powerMcp = withToolTier(mcp, 'power_user');
  const dangerMcp = withToolTier(mcp, 'danger');
  results.push({
    tool: 'tools/list',
    status: listed.length > 0 ? 'passed' : 'failed',
    reason: `${listed.length} tools listed for the active profile`,
  });

  await runTool(mcp, 'get_bridge_status', {}, results);
  await runTool(diagnosticMcp, 'get_bridge_diagnostics', {}, results);
  await runTool(diagnosticMcp, 'ping_remnote_plugin', { message: 'live-test' }, results);
  await runTool(mcp, 'get_plugin_status', {}, results);
  await runTool(mcp, 'get_focused_rem', {}, results);

  if (mode !== 'read_only') {
    const parentId = await findRegressionRoot(mcp, results);
    if (parentId) {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const dryRunCases = mode === 'full_sandbox' ? [250, 500] : [15, 25, 50, 100, 250, 500];
      for (const size of dryRunCases) {
        await runTool(
          mcp,
          'create_or_replace_note_from_markdown',
          {
            parentRemId: parentId,
            markdownText: liveMarkdown(`MCP Live Dry Run ${size} ${stamp}`, Math.max(1, Math.floor(size / 2))),
            mode: 'create_child',
            duplicatePolicy: 'create_new',
            safetyOptions: {
              dryRun: true,
              verifyAfterWrite: true,
              rollbackOnFailure: true,
              idempotencyKey: `live-dry-${size}-${stamp}`,
            },
            limits: { maxNodes: 2000, maxDepth: 12, maxMarkdownChars: 500000 },
          },
          results
        );
      }

      if (mode === 'full_sandbox') {
        for (const size of [15, 25, 50, 100]) {
          const title = `MCP Live Write ${size} ${stamp}`;
          const idempotencyKey = `live-write-${size}-${stamp}`;
          const response = await runTool(
            mcp,
            'create_or_replace_note_from_markdown',
            {
              parentRemId: parentId,
              markdownText: liveMarkdown(title, Math.max(1, Math.floor(size / 2))),
              mode: 'create_child',
              duplicatePolicy: 'create_new',
              safetyOptions: {
                dryRun: false,
                verifyAfterWrite: true,
                rollbackOnFailure: true,
                idempotencyKey,
              },
              limits: { maxNodes: 2000, maxDepth: 12, maxMarkdownChars: 500000 },
            },
            results
          );
          const payload = unwrapToolResult(response);
          const rootRemId = stringField(payload, 'rootRemId') ?? stringArrayField(payload, 'createdRemIds')[0];
          if (!rootRemId) {
            results.push({ tool: `live-write-${size}-root-id`, status: 'failed', error: 'Write did not return rootRemId or createdRemIds.' });
            continue;
          }
          await runTool(mcp, 'get_rem_tree', { remId: rootRemId, depth: 3, maxNodes: Math.max(50, size + 10) }, results);
          const replay = await runTool(
            mcp,
            'create_or_replace_note_from_markdown',
            {
              parentRemId: parentId,
              markdownText: liveMarkdown(title, Math.max(1, Math.floor(size / 2))),
              mode: 'create_child',
              duplicatePolicy: 'create_new',
              safetyOptions: {
                dryRun: false,
                verifyAfterWrite: true,
                rollbackOnFailure: true,
                idempotencyKey,
              },
              limits: { maxNodes: 2000, maxDepth: 12, maxMarkdownChars: 500000 },
            },
            results
          );
          const replayPayload = unwrapToolResult(replay);
          if (replayPayload.status !== 'already_applied') {
            results.push({ tool: `idempotency-replay-${size}`, status: 'failed', error: `Expected already_applied, got ${String(replayPayload.status)}` });
          } else {
            results.push({ tool: `idempotency-replay-${size}`, status: 'passed' });
          }
          await cleanupCurrentSessionRoot(
            dangerMcp,
            rootRemId,
            title,
            parentId,
            `cleanup-${idempotencyKey}`,
            results
          );
        }

        const cardTitle = `MCP Live Card Root ${stamp}`;
        const cardRootResponse = await runTool(
          mcp,
          'create_or_replace_note_from_markdown',
          {
            parentRemId: parentId,
            markdownText: `# ${cardTitle}\n\nCard lifecycle parent.`,
            mode: 'create_child',
            duplicatePolicy: 'create_new',
            safetyOptions: {
              dryRun: false,
              verifyAfterWrite: true,
              rollbackOnFailure: true,
              idempotencyKey: `live-card-root-${stamp}`,
            },
          },
          results
        );
        const cardRootPayload = unwrapToolResult(cardRootResponse);
        const cardRootId = stringField(cardRootPayload, 'rootRemId') ?? stringArrayField(cardRootPayload, 'createdRemIds')[0];
        if (cardRootId) {
          await runTool(noteWriterMcp, 'create_basic_flashcard', {
            parentId: cardRootId,
            front: 'Basic front',
            back: 'Basic back',
            idempotencyKey: `live-basic-card-${stamp}`,
          }, results);
          await runTool(noteWriterMcp, 'create_cloze_card', {
            parentId: cardRootId,
            text: 'The nucleus emits energy',
            clozeText: 'nucleus',
            idempotencyKey: `live-cloze-card-${stamp}`,
          }, results);
          await runTool(powerMcp, 'create_flashcards_from_markdown', {
            parentId: cardRootId,
            markdownText: 'Markdown front:: Markdown back',
            marker: 'double_colon',
            idempotencyKey: `live-markdown-card-${stamp}`,
          }, results);
          await runTool(powerMcp, 'verify_card_set', { rootRemId: cardRootId, maxDepth: 2, maxNodes: 50, timeoutMs: 1000 }, results);
          await cleanupCurrentSessionRoot(
            dangerMcp,
            cardRootId,
            cardTitle,
            parentId,
            `cleanup-live-card-root-${stamp}`,
            results
          );
        } else {
          results.push({ tool: 'card-lifecycle-root', status: 'failed', error: 'Card lifecycle parent was not created.' });
        }
      }
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
