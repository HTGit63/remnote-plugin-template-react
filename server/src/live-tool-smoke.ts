import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bridgeToolNameForPublicMcpTool } from './mcp-tool-map.js';

type JsonRecord = Record<string, unknown>;

interface RpcResult {
  status: number;
  text: string;
  json: unknown;
  durationMs: number;
}

interface ToolSmokeCase {
  tool: string;
  category: string;
  mutation: 'none' | 'dry_run' | 'write';
  args: (state: SmokeState) => Record<string, unknown> | null;
  skipReason?: (state: SmokeState) => string | null;
}

interface ToolSmokeResult {
  tool: string;
  category: string;
  durationMs: number;
  status: 'passed' | 'failed' | 'skipped';
  httpStatus?: number;
  errorCode?: string;
  layer?: string;
  recommendedFix?: string;
  reachedPlugin: boolean;
  remnoteChanged: boolean;
  createdRemIds: string[];
  updatedRemIds: string[];
  deletedRemIds: string[];
  verificationStatus: 'passed' | 'failed' | 'not_applicable' | 'unknown';
  message?: string;
}

interface ToolMatrixEntry {
  toolName: string;
  mcpRegistered: boolean;
  schemaExists: boolean;
  bridgeName: string | null;
  normalizeArgsWorks: boolean;
  handlerCaseExists: boolean;
  functionExists: boolean;
  dryRunSupport: boolean;
  liveResult: string;
}

interface SmokeState {
  focusedRemId?: string;
  disposableParentId?: string;
  createdRemId?: string;
  createdMarkdownRootId?: string;
  createdCardRootId?: string;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const reportDir = resolve(repoRoot, 'server/reports');
const mcpUrl = withToolTier(
  process.env.REMNOTE_MCP_URL ?? 'http://127.0.0.1:47392/mcp',
  process.env.REMNOTE_LIVE_TOOL_TIER ?? 'developer'
);
const bearerToken = process.env.REMNOTE_BRIDGE_TOKEN || process.env.REMNOTE_MCP_TOKEN || undefined;
const disposableParentId =
  process.env.REMNOTE_LIVE_TOOL_PARENT_ID ||
  process.env.REMNOTE_LIVE_TEST_PARENT_ID ||
  undefined;
const allowFocusedRoot = process.env.REMNOTE_LIVE_TOOL_USE_FOCUSED_ROOT === '1';

function withToolTier(urlText: string, tier: string): string {
  const url = new URL(urlText);
  if (!url.searchParams.has('tool_tier') && tier) {
    url.searchParams.set('tool_tier', tier);
  }
  return url.toString();
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function textField(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

async function postRpc(method: string, params: Record<string, unknown>): Promise<RpcResult> {
  const started = Date.now();
  const headers: Record<string, string> = {
    accept: 'application/json, text/event-stream',
    'content-type': 'application/json',
  };
  if (bearerToken) {
    headers.authorization = `Bearer ${bearerToken}`;
  }

  let response: Response;
  try {
    response = await fetch(mcpUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        method,
        params,
      }),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: 599,
      text: message,
      json: {
        error: {
          code: 'MCP_ENDPOINT_UNREACHABLE',
          message,
          layer: 'mcp_transport',
          recommendedFix: 'Start the MCP server and reconnect the RemNote plugin, then rerun live regression.',
        },
      },
      durationMs: Date.now() - started,
    };
  }
  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: response.status, text, json, durationMs: Date.now() - started };
}

async function callTool(tool: string, args: Record<string, unknown>): Promise<RpcResult> {
  return postRpc('tools/call', { name: tool, arguments: args });
}

function getStructured(json: unknown): JsonRecord {
  if (!isRecord(json) || !isRecord(json.result)) return {};
  return isRecord(json.result.structuredContent) ? json.result.structuredContent : {};
}

function getToolError(json: unknown, httpStatus: number, text: string): JsonRecord | null {
  if (isRecord(json) && isRecord(json.error)) return json.error;
  const structured = getStructured(json);
  if (isRecord(structured.error)) return structured.error;
  if (httpStatus >= 400) {
    return {
      code: text.includes('Missing bearer token') ? 'MISSING_BEARER_TOKEN' : `HTTP_${httpStatus}`,
      message: text.slice(0, 500),
    };
  }
  return null;
}

function lifecycleReachedPlugin(structured: JsonRecord): boolean {
  const lifecycle = Array.isArray(structured.lifecycle) ? structured.lifecycle : [];
  return lifecycle.some((event) => isRecord(event) && textField(event.message)?.includes('Plugin handler received'));
}

function collectIds(value: unknown, keys: Set<string>, out = new Set<string>()): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectIds(item, keys, out);
  } else if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) {
      if (keys.has(key)) {
        if (typeof item === 'string') out.add(item);
        if (Array.isArray(item)) {
          for (const possibleId of item) {
            if (typeof possibleId === 'string') out.add(possibleId);
          }
        }
      }
      collectIds(item, keys, out);
    }
  }
  return [...out];
}

function classifyToolResult(toolCase: ToolSmokeCase, rpc: RpcResult): ToolSmokeResult {
  const structured = getStructured(rpc.json);
  const error = getToolError(rpc.json, rpc.status, rpc.text);
  const ok = rpc.status >= 200 && rpc.status < 300 && structured.ok === true && !error;
  const result = isRecord(structured.result) ? structured.result : structured;
  const createdRemIds = collectIds(result, new Set(['createdRemId', 'rootCreatedRemId', 'createdRemIds']));
  const updatedRemIds = collectIds(result, new Set(['updatedRemId', 'updatedRemIds', 'targetRemId']));
  const deletedRemIds = collectIds(result, new Set(['deletedRemId', 'deletedRemIds']));
  const layer =
    textField(error?.layer) ||
    (isRecord(error?.details) ? textField(error.details.layer) : undefined) ||
    (textField(error?.code) === 'PLUGIN_NOT_CONNECTED' ? 'server_or_bridge' : undefined);
  const recommendedFix =
    textField(error?.recommendedFix) ||
    (isRecord(error?.details) ? textField(error.details.recommendedFix) ?? textField(error.details.recommendation) : undefined);
  const errorCode = textField(error?.code);

  return {
    tool: toolCase.tool,
    category: toolCase.category,
    durationMs: rpc.durationMs,
    status: ok ? 'passed' : 'failed',
    httpStatus: rpc.status,
    errorCode,
    layer,
    recommendedFix,
    reachedPlugin: lifecycleReachedPlugin(structured),
    remnoteChanged: ok && toolCase.mutation === 'write' && Boolean(createdRemIds.length || updatedRemIds.length || deletedRemIds.length),
    createdRemIds,
    updatedRemIds,
    deletedRemIds,
    verificationStatus: toolCase.tool.startsWith('verify_') ? (ok ? 'passed' : 'failed') : 'not_applicable',
    message: ok ? undefined : textField(error?.message) ?? rpc.text.slice(0, 500),
  };
}

function skip(message: string, toolCase: ToolSmokeCase): ToolSmokeResult {
  return {
    tool: toolCase.tool,
    category: toolCase.category,
    durationMs: 0,
    status: 'skipped',
    reachedPlugin: false,
    remnoteChanged: false,
    createdRemIds: [],
    updatedRemIds: [],
    deletedRemIds: [],
    verificationStatus: 'unknown',
    message,
  };
}

function rootId(state: SmokeState): string | undefined {
  return state.disposableParentId ?? (allowFocusedRoot ? state.focusedRemId : undefined);
}

function targetId(state: SmokeState): string | undefined {
  return state.createdRemId ?? state.createdMarkdownRootId ?? rootId(state);
}

function idempotency(label: string): string {
  return `live-tool-smoke:${label}:${new Date().toISOString().slice(0, 10)}`;
}

const tinyMarkdown = [
  '# Live Tool Smoke Tiny Note',
  '',
  '## Section',
  '- Bullet one',
  '- Inline math $E=mc^2$',
  '',
  '$$',
  'F = ma',
  '$$',
].join('\n');

const cases: ToolSmokeCase[] = [
  { tool: 'get_bridge_status', category: 'system/read', mutation: 'none', args: () => ({}) },
  { tool: 'get_plugin_status', category: 'system/read', mutation: 'none', args: () => ({}) },
  { tool: 'ping_remnote_plugin', category: 'system/read', mutation: 'none', args: () => ({ message: 'live-tool-smoke' }) },
  { tool: 'get_focused_rem', category: 'system/read', mutation: 'none', args: () => ({}) },
  { tool: 'get_current_selection', category: 'system/read', mutation: 'none', args: () => ({}) },
  {
    tool: 'get_children',
    category: 'system/read',
    mutation: 'none',
    skipReason: (state) => (rootId(state) ? null : 'Missing disposable root Rem ID.'),
    args: (state) => rootId(state) ? ({ parentRemId: rootId(state), maxChildren: 20 }) : null,
  },
  {
    tool: 'get_rem_tree',
    category: 'system/read',
    mutation: 'none',
    skipReason: (state) => (rootId(state) ? null : 'Missing disposable root Rem ID.'),
    args: (state) => rootId(state) ? ({ remId: rootId(state), depth: 2 }) : null,
  },
  {
    tool: 'get_rem_rich',
    category: 'system/read',
    mutation: 'none',
    skipReason: (state) => (rootId(state) ? null : 'Missing disposable root Rem ID.'),
    args: (state) => rootId(state) ? ({ remId: rootId(state) }) : null,
  },
  {
    tool: 'create_rem',
    category: 'simple_write',
    mutation: 'write',
    skipReason: (state) => (rootId(state) ? null : 'Missing disposable parent Rem ID.'),
    args: (state) => rootId(state) ? ({ parentId: rootId(state), markdown: 'Live tool smoke child', idempotencyKey: idempotency('create-rem') }) : null,
  },
  {
    tool: 'append_to_rem',
    category: 'simple_write',
    mutation: 'write',
    skipReason: (state) => (targetId(state) ? null : 'Missing target Rem ID.'),
    args: (state) => targetId(state) ? ({ remId: targetId(state), markdown: 'Appended by live tool smoke.', position: 'end', idempotencyKey: idempotency('append') }) : null,
  },
  {
    tool: 'create_rem_tree',
    category: 'simple_write',
    mutation: 'write',
    skipReason: (state) => (rootId(state) ? null : 'Missing disposable parent Rem ID.'),
    args: (state) => rootId(state) ? ({ parentId: rootId(state), tree: { title: 'Live smoke tree', children: [{ title: 'Child node' }] }, idempotencyKey: idempotency('tree') }) : null,
  },
  {
    tool: 'create_styled_rem_tree',
    category: 'simple_write',
    mutation: 'write',
    skipReason: (state) => (rootId(state) ? null : 'Missing disposable parent Rem ID.'),
    args: (state) => rootId(state) ? ({ parentId: rootId(state), tree: { title: 'Styled smoke tree', style: { headingLevel: 'h2', textColor: 'blue' }, children: [{ title: 'Styled child' }] }, verifyAfterWrite: false, idempotencyKey: idempotency('styled-tree') }) : null,
  },
  { tool: 'preview_markdown_note_tree', category: 'markdown_note', mutation: 'none', args: () => ({ markdownText: tinyMarkdown }) },
  {
    tool: 'create_note_from_markdown_tree',
    category: 'markdown_note',
    mutation: 'write',
    skipReason: (state) => (rootId(state) ? null : 'Missing disposable parent Rem ID.'),
    args: (state) => rootId(state) ? ({ parentRemId: rootId(state), markdownText: tinyMarkdown, duplicatePolicy: 'create_new', verifyAfterWrite: true, idempotencyKey: idempotency('markdown-create') }) : null,
  },
  {
    tool: 'append_markdown_as_rem_tree',
    category: 'markdown_note',
    mutation: 'write',
    skipReason: (state) => (targetId(state) ? null : 'Missing target Rem ID.'),
    args: (state) => targetId(state) ? ({ targetRemId: targetId(state), markdownText: '## Appended Section\n- Appended markdown child', verifyAfterWrite: true, idempotencyKey: idempotency('markdown-append') }) : null,
  },
  {
    tool: 'apply_structured_note_batch',
    category: 'complex_note',
    mutation: 'write',
    skipReason: (state) => (rootId(state) ? null : 'Missing disposable parent Rem ID.'),
    args: (state) => rootId(state) ? ({ parentId: rootId(state), root: { title: 'Structured smoke root', children: [{ title: 'Structured child' }] }, operation: 'create_child_tree', verifyAfterWrite: true, idempotencyKey: idempotency('structured') }) : null,
  },
  {
    tool: 'create_polished_note_tree',
    category: 'complex_note',
    mutation: 'write',
    skipReason: (state) => (rootId(state) ? null : 'Missing disposable parent Rem ID.'),
    args: (state) => rootId(state) ? ({ parentId: rootId(state), tree: { title: 'Polished smoke root', children: [{ title: 'Polished child' }] }, verifyAfterWrite: true, idempotencyKey: idempotency('polished') }) : null,
  },
  {
    tool: 'create_designed_note_tree',
    category: 'complex_note',
    mutation: 'write',
    skipReason: (state) => (rootId(state) ? null : 'Missing disposable parent Rem ID.'),
    args: (state) => rootId(state) ? ({ parentId: rootId(state), title: 'Designed smoke note', content: '## Section\n- Designed child', verifyAfterWrite: true, idempotencyKey: idempotency('designed') }) : null,
  },
  {
    tool: 'verify_note_design',
    category: 'complex_note',
    mutation: 'none',
    skipReason: (state) => (targetId(state) ? null : 'Missing created/target Rem ID.'),
    args: (state) => targetId(state) ? ({ rootRemId: targetId(state), expectedStyleMap: {} }) : null,
  },
  {
    tool: 'analyze_note_design',
    category: 'complex_note',
    mutation: 'none',
    skipReason: (state) => (targetId(state) ? null : 'Missing created/target Rem ID.'),
    args: (state) => targetId(state) ? ({ rootRemId: targetId(state), maxDepth: 2, maxNodes: 20 }) : null,
  },
  { tool: 'preview_note_design_plan', category: 'complex_note', mutation: 'none', args: () => ({ title: 'Preview smoke', content: '## Section\n- Child', mode: 'create' }) },
  {
    tool: 'create_basic_flashcard',
    category: 'flashcard',
    mutation: 'write',
    skipReason: (state) => (rootId(state) ? null : 'Missing disposable parent Rem ID.'),
    args: (state) => rootId(state) ? ({ parentId: rootId(state), front: 'Smoke front', back: 'Smoke back', idempotencyKey: idempotency('basic-card') }) : null,
  },
  {
    tool: 'create_cloze_card',
    category: 'flashcard',
    mutation: 'write',
    skipReason: (state) => (rootId(state) ? null : 'Missing disposable parent Rem ID.'),
    args: (state) => rootId(state) ? ({ parentId: rootId(state), text: 'The capital of France is Paris.', clozeText: 'Paris', idempotencyKey: idempotency('cloze-card') }) : null,
  },
  {
    tool: 'create_flashcards_from_markdown',
    category: 'flashcard',
    mutation: 'write',
    skipReason: (state) => (rootId(state) ? null : 'Missing disposable parent Rem ID.'),
    args: (state) => rootId(state) ? ({ parentId: rootId(state), markdownText: '- Q: Smoke question\n  A: Smoke answer', marker: 'qa', maxCards: 3, idempotencyKey: idempotency('markdown-cards') }) : null,
  },
  {
    tool: 'verify_card_set',
    category: 'flashcard',
    mutation: 'none',
    skipReason: (state) => (targetId(state) ? null : 'Missing created/target Rem ID.'),
    args: (state) => targetId(state) ? ({ rootRemId: targetId(state), maxCards: 10 }) : null,
  },
  {
    tool: 'set_rem_heading_level',
    category: 'style',
    mutation: 'write',
    skipReason: (state) => (targetId(state) ? null : 'Missing target Rem ID.'),
    args: (state) => targetId(state) ? ({ remId: targetId(state), level: 'h2' }) : null,
  },
  {
    tool: 'set_rem_text_color',
    category: 'style',
    mutation: 'write',
    skipReason: (state) => (targetId(state) ? null : 'Missing target Rem ID.'),
    args: (state) => targetId(state) ? ({ remId: targetId(state), color: 'red' }) : null,
  },
  {
    tool: 'set_rem_highlight_color',
    category: 'style',
    mutation: 'write',
    skipReason: (state) => (targetId(state) ? null : 'Missing target Rem ID.'),
    args: (state) => targetId(state) ? ({ remId: targetId(state), color: 'yellow' }) : null,
  },
  {
    tool: 'set_hide_bullet',
    category: 'style',
    mutation: 'write',
    skipReason: (state) => (targetId(state) ? null : 'Missing target Rem ID.'),
    args: (state) => targetId(state) ? ({ remId: targetId(state), hideBullet: true }) : null,
  },
  {
    tool: 'apply_style_plan',
    category: 'style',
    mutation: 'write',
    skipReason: (state) => (targetId(state) ? null : 'Missing target Rem ID.'),
    args: (state) => targetId(state) ? ({ operations: [{ remId: targetId(state), kind: 'text_color', color: 'blue' }], verifyAfterWrite: true, idempotencyKey: idempotency('style-plan') }) : null,
  },
  {
    tool: 'repair_note_design',
    category: 'repair/danger',
    mutation: 'dry_run',
    skipReason: (state) => (targetId(state) ? null : 'Missing target Rem ID.'),
    args: (state) => targetId(state) ? ({ rootRemId: targetId(state), dryRun: true, approved: false }) : null,
  },
  {
    tool: 'repair_card_set',
    category: 'repair/danger',
    mutation: 'dry_run',
    skipReason: (state) => (targetId(state) ? null : 'Missing target Rem ID.'),
    args: (state) => targetId(state) ? ({ rootRemId: targetId(state), dryRun: true, approved: false }) : null,
  },
  {
    tool: 'delete_rem_by_id',
    category: 'repair/danger',
    mutation: 'dry_run',
    skipReason: (state) => (targetId(state) ? null : 'Missing target Rem ID.'),
    args: (state) => targetId(state) ? ({ remId: targetId(state), dryRun: true, expectedAncestorId: rootId(state) }) : null,
  },
];

function updateStateFromResult(state: SmokeState, result: ToolSmokeResult) {
  if (result.status !== 'passed') return;
  const firstCreated = result.createdRemIds[0];
  if (!firstCreated) return;
  if (result.tool === 'create_rem') state.createdRemId = firstCreated;
  if (result.tool === 'create_note_from_markdown_tree') state.createdMarkdownRootId = firstCreated;
  if (result.tool === 'create_basic_flashcard' || result.tool === 'create_flashcards_from_markdown') {
    state.createdCardRootId = firstCreated;
  }
}

function buildMatrix(listedTools: string[], results: ToolSmokeResult[]): ToolMatrixEntry[] {
  const argsSource = readFileSync(resolve(repoRoot, 'src/bridge/handlers/args.ts'), 'utf8');
  const handlerSource = readFileSync(resolve(repoRoot, 'src/bridge/handlers.ts'), 'utf8');
  const liveByTool = new Map(results.map((result) => [result.tool, result]));
  return listedTools.sort().map((toolName) => {
    const bridgeName = bridgeToolNameForPublicMcpTool(toolName);
    const bridgeText = bridgeName ?? toolName;
    const caseRegex = new RegExp(`case ['"]${bridgeText}['"]`);
    const dryRunCase = cases.find((toolCase) => toolCase.tool === toolName);
    return {
      toolName,
      mcpRegistered: true,
      schemaExists: true,
      bridgeName: bridgeName ?? null,
      normalizeArgsWorks: bridgeName ? caseRegex.test(argsSource) : toolName.startsWith('get_bridge_') || toolName === 'run_bridge_health_check' || toolName === 'get_remnote_capability_guide',
      handlerCaseExists: bridgeName ? caseRegex.test(handlerSource) : toolName.startsWith('get_bridge_') || toolName === 'run_bridge_health_check' || toolName === 'get_remnote_capability_guide',
      functionExists: bridgeName ? caseRegex.test(handlerSource) : true,
      dryRunSupport: dryRunCase?.mutation === 'dry_run' || toolName.includes('repair') || toolName === 'delete_rem_by_id',
      liveResult: liveByTool.get(toolName)?.status ?? 'not_run',
    };
  });
}

function markdownReport(results: ToolSmokeResult[], matrix: ToolMatrixEntry[]): string {
  const passed = results.filter((result) => result.status === 'passed').length;
  const failed = results.filter((result) => result.status === 'failed').length;
  const skipped = results.filter((result) => result.status === 'skipped').length;
  const lines = [
    '# RemnoteMCP Live Tool Smoke Report',
    '',
    `- MCP URL: ${mcpUrl.replace(/token=[^&]+/g, 'token=REDACTED')}`,
    `- Generated: ${new Date().toISOString()}`,
    `- Passed: ${passed}`,
    `- Failed: ${failed}`,
    `- Skipped: ${skipped}`,
    '',
    '## Tool Results',
    '',
    '| Tool | Category | Status | ms | Code | Layer | Reached Plugin | Changed | Fix |',
    '|---|---|---:|---:|---|---|---:|---:|---|',
    ...results.map((result) => [
      result.tool,
      result.category,
      result.status,
      String(result.durationMs),
      result.errorCode ?? '',
      result.layer ?? '',
      result.reachedPlugin ? 'yes' : 'no',
      result.remnoteChanged ? 'yes' : 'no',
      (result.recommendedFix ?? result.message ?? '').replace(/\|/g, '/').slice(0, 160),
    ].join(' | ')).map((row) => `| ${row} |`),
    '',
    '## Static Execution Matrix',
    '',
    '| Tool | MCP | Schema | Bridge | Normalize | Handler | Function | Live |',
    '|---|---:|---:|---|---:|---:|---:|---|',
    ...matrix.map((entry) => [
      entry.toolName,
      entry.mcpRegistered ? 'yes' : 'no',
      entry.schemaExists ? 'yes' : 'no',
      entry.bridgeName ?? '',
      entry.normalizeArgsWorks ? 'yes' : 'no',
      entry.handlerCaseExists ? 'yes' : 'no',
      entry.functionExists ? 'yes' : 'no',
      entry.liveResult,
    ].join(' | ')).map((row) => `| ${row} |`),
    '',
  ];
  return `${lines.join('\n')}\n`;
}

function writeSmokeReport(report: JsonRecord) {
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(resolve(reportDir, 'live-tool-smoke.json'), `${JSON.stringify(report, null, 2)}\n`);
  const results = Array.isArray(report.results) ? report.results.filter(isRecord) as unknown as ToolSmokeResult[] : [];
  const matrix = Array.isArray(report.matrix) ? report.matrix.filter(isRecord) as unknown as ToolMatrixEntry[] : [];
  writeFileSync(resolve(reportDir, 'live-tool-smoke.md'), markdownReport(results, matrix));
}

const state: SmokeState = { disposableParentId };
const init = await postRpc('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: { name: 'remnote-live-tool-smoke', version: '1.0.0' },
});
if (init.status >= 400) {
  const result = classifyToolResult(
    { tool: 'mcp_initialize', category: 'system/read', mutation: 'none', args: () => ({}) },
    init
  );
  const report = {
    ok: false,
    generatedAt: new Date().toISOString(),
    mcpUrl: mcpUrl.replace(/token=[^&]+/g, 'token=REDACTED'),
    disposableParentId: disposableParentId ? 'provided' : 'missing',
    allowFocusedRoot,
    totals: { passed: 0, failed: 1, skipped: 0, listedTools: 0, matrixUnknown: 0 },
    results: [result],
    matrix: [],
  };
  writeSmokeReport(report);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
  process.exit();
}

const toolsList = await postRpc('tools/list', {});
if (toolsList.status >= 400) {
  const result = classifyToolResult(
    { tool: 'mcp_tools_list', category: 'system/read', mutation: 'none', args: () => ({}) },
    toolsList
  );
  const report = {
    ok: false,
    generatedAt: new Date().toISOString(),
    mcpUrl: mcpUrl.replace(/token=[^&]+/g, 'token=REDACTED'),
    disposableParentId: disposableParentId ? 'provided' : 'missing',
    allowFocusedRoot,
    totals: { passed: 0, failed: 1, skipped: 0, listedTools: 0, matrixUnknown: 0 },
    results: [result],
    matrix: [],
  };
  writeSmokeReport(report);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
  process.exit();
}

const listedTools = isRecord(toolsList.json) &&
  isRecord(toolsList.json.result) &&
  Array.isArray(toolsList.json.result.tools)
  ? toolsList.json.result.tools
      .filter(isRecord)
      .map((tool) => textField(tool.name))
      .filter((name): name is string => Boolean(name))
  : [];

const results: ToolSmokeResult[] = [];
for (const toolCase of cases) {
  if (!listedTools.includes(toolCase.tool)) {
    results.push(skip('Tool not listed for active tool tier.', toolCase));
    continue;
  }

  const skipReason = toolCase.skipReason?.(state);
  if (skipReason) {
    results.push(skip(skipReason, toolCase));
    continue;
  }

  const args = toolCase.args(state);
  if (!args) {
    results.push(skip('Tool arguments unavailable.', toolCase));
    continue;
  }

  const rpc = await callTool(toolCase.tool, args);
  const result = classifyToolResult(toolCase, rpc);
  results.push(result);
  updateStateFromResult(state, result);

  if (toolCase.tool === 'get_focused_rem' && result.status === 'passed') {
    const structured = getStructured(rpc.json);
    const remId = isRecord(structured.result) ? textField(structured.result.remId) : undefined;
    if (remId) state.focusedRemId = remId;
  }
}

const matrix = buildMatrix(listedTools, results);
const report = {
  ok: results.every((result) => result.status !== 'failed'),
  generatedAt: new Date().toISOString(),
  mcpUrl: mcpUrl.replace(/token=[^&]+/g, 'token=REDACTED'),
  disposableParentId: disposableParentId ? 'provided' : 'missing',
  allowFocusedRoot,
  totals: {
    passed: results.filter((result) => result.status === 'passed').length,
    failed: results.filter((result) => result.status === 'failed').length,
    skipped: results.filter((result) => result.status === 'skipped').length,
    listedTools: listedTools.length,
    matrixUnknown: matrix.filter((entry) => entry.liveResult === 'not_run').length,
  },
  results,
  matrix,
};

writeSmokeReport(report);

console.log(JSON.stringify(report, null, 2));
if (!report.ok) {
  process.exitCode = 1;
}
