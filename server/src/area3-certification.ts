import { WebSocket } from 'ws';
import type {
  BridgePluginHello,
  BridgeRequest,
  BridgeResponse,
  BridgeServerHello,
  BridgeToolName,
  SerializedRem,
} from '../../src/bridge/protocol.js';
import { startCompanionApp } from './app.js';
import { bridgeToolNameForPublicMcpTool } from './mcp-tool-map.js';
import {
  STATIC_SDK_UNSUPPORTED_TOOLS,
  getPublicMcpToolNames,
  getToolRegistrySummary,
} from './tool-registry.js';
import {
  getToolMetadata,
  getToolPolicyEntry,
  type ToolProfile,
} from './tool-policy.js';

const mode = process.argv[2] ?? 'all';
const token = 'area3-certification-token';
const parentId = 'area3-parent';
const targetRemId = 'area3-rem';
const fakeRem: SerializedRem = {
  remId: targetRemId,
  frontText: 'Area 3 certification Rem',
  backText: '',
  plainText: 'Area 3 certification Rem',
  breadcrumbs: ['Area 3 Root', 'Area 3 certification Rem'],
  hasChildren: true,
  children: [
    {
      remId: 'area3-child-1',
      frontText: 'Area 3 child',
      backText: '',
      plainText: 'Area 3 child',
      breadcrumbs: ['Area 3 Root', 'Area 3 certification Rem', 'Area 3 child'],
      hasChildren: false,
    },
  ],
};

type JsonResponse = {
  status: number;
  text: string;
  json: any;
};

type SeenBridgeRequest = {
  tool: BridgeToolName;
  args: Record<string, unknown>;
};

let nextJsonRpcId = 1;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function p95(values: readonly number[]): number | null {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!sorted.length) {
    return null;
  }
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)];
}

async function mcpRequest(
  baseUrl: string,
  method: string,
  params: Record<string, unknown>,
  bearerToken = token
): Promise<JsonResponse> {
  const response = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/event-stream',
      authorization: `Bearer ${bearerToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: nextJsonRpcId++,
      method,
      params,
    }),
  });
  const text = await response.text();
  return { status: response.status, text, json: text ? JSON.parse(text) : null };
}

async function mcpToolCall(baseUrl: string, name: string, args: Record<string, unknown>): Promise<JsonResponse> {
  return mcpRequest(baseUrl, 'tools/call', {
    name,
    arguments: args,
  });
}

function idempotencyKey(tool: string): string {
  return `area3-${tool}`;
}

function styledTree() {
  return {
    clientNodeId: 'root',
    text: 'Area 3 styled root',
    style: {
      headingLevel: 'H2',
      color: 'blue',
    },
    children: [
      {
        clientNodeId: 'child',
        text: 'Area 3 styled child',
      },
    ],
  };
}

function mcpArgsFor(tool: string): Record<string, unknown> {
  switch (tool) {
    case 'get_bridge_status':
    case 'get_bridge_diagnostics':
      return {};
    case 'run_bridge_health_check':
      return {
        mode: 'read_only',
        parentId,
        targetRemId,
        timeoutMs: 3000,
      };
    case 'get_remnote_capability_guide':
      return { section: 'all' };
    case 'ping_remnote_plugin':
      return { message: 'area3' };
    case 'get_plugin_status':
    case 'get_focused_rem':
    case 'get_current_selection':
      return {};
    case 'get_rem':
    case 'get_rem_rich':
    case 'debug_get_raw_rich_text':
    case 'get_rem_breadcrumbs':
      return { remId: targetRemId };
    case 'get_children':
      return { parentRemId: parentId, maxChildren: 3 };
    case 'get_rem_tree':
      return { remId: targetRemId, depth: 1 };
    case 'search_rems':
      return { query: 'Area 3', contextRemId: parentId, maxResults: 3, scope: 'current_permission_scope' };
    case 'get_document_or_folder_tree':
      return { rootRemId: parentId, depth: 1, maxChildren: 3 };
    case 'create_basic_flashcard':
    case 'create_concept_card':
    case 'create_descriptor_card':
      return {
        parentId,
        front: 'Area 3 front',
        back: 'Area 3 back',
        direction: 'both',
        idempotencyKey: idempotencyKey(tool),
      };
    case 'create_cloze_card':
      return {
        parentId,
        text: 'Area 3 cloze certification',
        clozeText: 'cloze',
        direction: 'both',
        idempotencyKey: idempotencyKey(tool),
      };
    case 'create_multiple_choice_card':
      return {
        parentId,
        question: 'Area 3 question?',
        choices: ['A', 'B'],
        correctChoice: 'A',
        direction: 'forward',
        idempotencyKey: idempotencyKey(tool),
      };
    case 'create_list_answer_card':
      return {
        parentId,
        prompt: 'Area 3 list',
        items: ['One'],
        direction: 'forward',
        idempotencyKey: idempotencyKey(tool),
      };
    case 'delete_rem_by_id':
      return {
        remId: 'area3-delete-candidate',
        expectedParentId: parentId,
        confirmTitle: 'Area 3 delete candidate',
        dryRun: true,
        idempotencyKey: idempotencyKey(tool),
      };
    case 'create_rem':
    case 'create_document':
      return {
        parentId,
        markdown: `Area 3 ${tool}`,
        idempotencyKey: idempotencyKey(tool),
      };
    case 'append_to_rem':
      return {
        remId: parentId,
        markdown: 'Area 3 appended child',
        position: 'end',
        idempotencyKey: idempotencyKey(tool),
      };
    case 'update_rem':
    case 'replace_rem':
      return {
        remId: targetRemId,
        markdown: 'Area 3 replacement text',
        dryRun: true,
        expectedPlainText: fakeRem.plainText,
        idempotencyKey: idempotencyKey(tool),
      };
    case 'move_rem':
      return {
        remId: targetRemId,
        newParentId: parentId,
        index: 0,
        dryRun: true,
        expectedParentId: parentId,
        idempotencyKey: idempotencyKey(tool),
      };
    case 'reorder_children':
      return {
        parentRemId: parentId,
        orderedChildRemIds: ['area3-child-1', 'area3-child-2'],
        dryRun: true,
        allowPartial: true,
        idempotencyKey: idempotencyKey(tool),
      };
    case 'create_rem_tree':
      return {
        parentId,
        position: 'end',
        tree: {
          title: 'Area 3 tree root',
          children: [{ title: 'Area 3 tree child' }],
        },
        idempotencyKey: idempotencyKey(tool),
      };
    case 'update_rem_rich':
      return {
        remId: targetRemId,
        richText: [{ text: 'Area 3 rich text' }],
        idempotencyKey: idempotencyKey(tool),
      };
    case 'set_rem_heading_level':
      return { remId: targetRemId, level: 'H2' };
    case 'set_rem_text_color':
    case 'set_text_span_color':
      return tool === 'set_rem_text_color'
        ? { remId: targetRemId, color: 'blue' }
        : { remId: targetRemId, text: 'Area', color: 'blue', verifyAfterWrite: false };
    case 'set_rem_highlight_color':
    case 'set_text_span_highlight':
      return tool === 'set_rem_highlight_color'
        ? { remId: targetRemId, color: 'yellow' }
        : { remId: targetRemId, text: 'Area', color: 'yellow', verifyAfterWrite: false };
    case 'set_rem_type':
      return { remId: targetRemId, type: 'concept' };
    case 'set_hide_bullet':
      return { remId: targetRemId, hideBullet: false };
    case 'clear_rem_formatting':
      return { remId: targetRemId };
    case 'create_styled_rem_tree':
      return {
        parentId,
        position: 'end',
        tree: styledTree(),
        dryRun: true,
        maxDepth: 1,
        maxNodeCount: 5,
        idempotencyKey: idempotencyKey(tool),
      };
    case 'apply_remnote_command':
      return {
        target: { mode: 'rem_id', remId: targetRemId },
        command: 'heading_2',
        dryRun: true,
        idempotencyKey: idempotencyKey(tool),
      };
    case 'apply_structured_note_batch':
      return {
        target: { mode: 'parent_child', parentId },
        operation: 'create_child_tree',
        parentId,
        position: 'end',
        root: styledTree(),
        dryRun: true,
        rollbackOnFailure: true,
        verifyAfterWrite: true,
        maxDepth: 1,
        maxNodeCount: 5,
        idempotencyKey: idempotencyKey(tool),
      };
    case 'create_polished_note_tree':
      return {
        parentId,
        tree: styledTree(),
        stylingPlan: {
          dryRun: true,
          operations: [],
        },
        dryRun: true,
        verifyAfterWrite: true,
        maxDepth: 1,
        maxNodeCount: 5,
        idempotencyKey: idempotencyKey(tool),
      };
    case 'apply_style_plan':
      return {
        operations: [{ remId: targetRemId, type: 'heading', headingLevel: 'H2' }],
        continueOnError: true,
        verifyAfterWrite: false,
        dryRun: true,
        idempotencyKey: idempotencyKey(tool),
      };
    case 'verify_note_design':
      return {
        rootRemId: targetRemId,
        expectations: [{ remId: targetRemId, plainText: fakeRem.plainText, headingLevel: 'H2' }],
      };
    default:
      throw new Error(`No Area 3 certification args for ${tool}.`);
  }
}

function bridgeResponse(request: BridgeRequest): BridgeResponse {
  switch (request.tool) {
    case 'ping':
      return { id: request.id, ok: true, result: { message: request.args.message ?? 'pong' } };
    case 'get_status':
      return {
        id: request.id,
        ok: true,
        result: {
          connected: true,
          permissionMode: 'trusted_writes',
          permissionScope: 'focused_rem_and_descendants',
          approvedRootRemId: parentId,
          focusedRem: {
            found: true,
            remId: fakeRem.remId,
            label: fakeRem.frontText,
            hasChildren: true,
          },
        },
      };
    case 'get_focused_rem':
    case 'get_rem':
    case 'get_rem_rich':
      return {
        id: request.id,
        ok: true,
        result: {
          ...fakeRem,
          richText: [{ text: fakeRem.plainText }],
          math: [],
        },
      };
    case 'debug_get_raw_rich_text':
      return {
        id: request.id,
        ok: true,
        result: {
          remId: request.args.remId,
          rawText: [
            { text: 'A', tc: 'blue' },
            { text: 'B', h: 'yellow' },
          ],
          normalizedText: fakeRem.plainText,
        },
      };
    case 'get_current_selection':
      return {
        id: request.id,
        ok: true,
        result: {
          focusedRemId: fakeRem.remId,
          selectedRemIds: [fakeRem.remId],
          focusedRem: fakeRem,
        },
      };
    case 'get_children':
      return {
        id: request.id,
        ok: true,
        result: {
          parentRemId: request.args.parentRemId,
          children: fakeRem.children ?? [],
          truncated: false,
        },
      };
    case 'get_rem_tree':
    case 'get_document_or_folder_tree':
      return {
        id: request.id,
        ok: true,
        result: {
          rootRemId: request.tool === 'get_rem_tree' ? request.args.remId : request.args.rootRemId,
          tree: fakeRem,
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
            { remId: parentId, title: 'Area 3 Root', text: 'Area 3 Root' },
            { remId: fakeRem.remId, title: fakeRem.frontText, text: fakeRem.plainText },
          ],
        },
      };
    case 'search_rems':
      return {
        id: request.id,
        ok: true,
        result: {
          query: request.args.query,
          results: [fakeRem],
          truncated: false,
        },
      };
    case 'delete_rem_by_id': {
      const dryRun = request.args.dryRun !== false;
      return {
        id: request.id,
        ok: true,
        result: {
          dryRun,
          target: {
            remId: request.args.remId,
            plainText: request.args.confirmTitle ?? 'Area 3 delete candidate',
            parentId: request.args.expectedParentId ?? parentId,
            breadcrumbs: [
              { id: parentId, text: 'Area 3 Root' },
              { id: request.args.remId, text: request.args.confirmTitle ?? 'Area 3 delete candidate' },
            ],
            childCount: 0,
          },
          wouldDelete: {
            remId: request.args.remId,
            childCount: 0,
            includesDescendants: false,
          },
          guards: {
            expectedParentMatches: true,
            confirmTitleMatches: true,
          },
        },
      };
    }
    case 'create_rem':
    case 'create_document':
    case 'append_to_rem':
    case 'create_rem_tree':
    case 'update_rem':
    case 'replace_rem':
    case 'move_rem':
    case 'reorder_children':
    case 'update_rem_rich':
    case 'set_rem_heading_level':
    case 'set_rem_text_color':
    case 'set_rem_highlight_color':
    case 'set_text_span_color':
    case 'set_text_span_highlight':
    case 'set_rem_type':
    case 'set_hide_bullet':
    case 'clear_rem_formatting':
    case 'create_styled_rem_tree':
    case 'apply_remnote_command':
    case 'apply_structured_note_batch':
    case 'create_polished_note_tree':
    case 'apply_style_plan':
    case 'verify_note_design':
    case 'create_basic_flashcard':
    case 'create_concept_card':
    case 'create_descriptor_card':
    case 'create_cloze_card':
    case 'create_multiple_choice_card':
    case 'create_list_answer_card':
      return {
        id: request.id,
        ok: true,
        result: {
          ok: true,
          tool: request.tool,
          dryRun: 'dryRun' in request.args ? Boolean(request.args.dryRun) : undefined,
          idempotencyKey: 'idempotencyKey' in request.args ? request.args.idempotencyKey : undefined,
          createdRemId: request.tool.startsWith('create_') ? `created-${request.tool}` : undefined,
          createdRemIds: request.tool.includes('tree') || request.tool.includes('batch')
            ? [`created-${request.tool}-root`, `created-${request.tool}-child`]
            : undefined,
          updatedRemIds: request.tool.startsWith('update_') || request.tool.startsWith('set_') || request.tool.startsWith('apply_')
            ? [targetRemId]
            : undefined,
          checkedRemIds: request.tool === 'verify_note_design' ? [targetRemId] : undefined,
          mismatches: request.tool === 'verify_note_design' ? [] : undefined,
          status: 'area3_certified',
        },
      };
    default: {
      const unhandled = request as BridgeRequest;
      return {
        id: unhandled.id,
        ok: false,
        error: {
          code: 'UNKNOWN_TOOL',
          message: `Area 3 mock plugin does not implement ${unhandled.tool}.`,
        },
      };
    }
  }
}

async function connectMockPlugin(wsUrl: string, seen: SeenBridgeRequest[]): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => reject(new Error('Area 3 mock plugin did not receive server_hello.')), 3000);
    ws.on('open', () => {
      const hello: BridgePluginHello = {
        type: 'plugin_hello',
        protocolVersion: 1,
        clientName: 'remnote-plugin',
        token,
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
      seen.push({ tool: request.tool, args: request.args as Record<string, unknown> });
      ws.send(JSON.stringify(bridgeResponse(request)));
    });
    ws.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function assertToolResult(tool: string, result: JsonResponse) {
  assert(result.status === 200, `${tool} returned HTTP ${result.status}: ${result.text}`);
  assert(!result.json?.error, `${tool} returned JSON-RPC error: ${result.text}`);
  assert(!result.json?.result?.isError, `${tool} returned MCP tool error: ${result.text}`);
  assert(result.json?.result, `${tool} returned no JSON-RPC result: ${result.text}`);
}

async function assertToolsList(baseUrl: string, expectedTools: readonly string[]) {
  const listed = await mcpRequest(baseUrl, 'tools/list', {});
  assert(listed.status === 200, `tools/list returned HTTP ${listed.status}: ${listed.text}`);
  const names = new Set((listed.json?.result?.tools ?? []).map((tool: { name?: string }) => tool.name));
  for (const tool of expectedTools) {
    assert(names.has(tool), `tools/list missing ${tool}.`);
  }
  assert(!names.has('create_folder'), 'tools/list exposed unsupported create_folder.');
}

async function getDiagnostics(baseUrl: string) {
  const response = await fetch(`${baseUrl}/diagnostics`, {
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${token}`,
    },
  });
  const text = await response.text();
  assert(response.status === 200, `/diagnostics returned HTTP ${response.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

function assertMatrixShape(matrix: readonly Record<string, unknown>[], tools: readonly string[]) {
  const byName = new Map(matrix.map((entry) => [String(entry.name), entry]));
  const requiredFields = [
    'name',
    'toolName',
    'tier',
    'category',
    'riskLevel',
    'registered',
    'exposed',
    'runtimeVerified',
    'lastSuccessTimestamp',
    'lastFailureTimestamp',
    'lastErrorCode',
    'averageLatencyMs',
    'p95LatencyMs',
    'supportsDryRun',
    'supportsIdempotency',
    'requiresWrite',
    'requiresDelete',
    'recommendedFallback',
    'schemaWarningStatus',
  ];

  for (const tool of tools) {
    const entry = byName.get(tool);
    assert(entry, `runtime verification matrix missing ${tool}.`);
    for (const field of requiredFields) {
      assert(field in entry, `runtime verification matrix ${tool} missing ${field}.`);
    }
    assert(entry.registered === true, `runtime verification matrix ${tool} is not registered.`);
    assert(entry.exposed === true, `runtime verification matrix ${tool} is not exposed.`);
  }
}

function assertSchemaQuality(profile: ToolProfile = 'full') {
  const publicTools = getPublicMcpToolNames(false, profile);
  assert(!publicTools.includes('create_folder'), `${profile} exposed unsupported create_folder.`);
  for (const tool of ['delete_rem', 'delete_focused_rem', 'delete_selected_rem']) {
    assert(!publicTools.includes(tool), `${profile} exposed removed legacy tool ${tool}.`);
  }

  for (const tool of publicTools) {
    const metadata = getToolMetadata(tool);
    const policy = getToolPolicyEntry(tool);
    assert(metadata.name === tool, `${tool} metadata name mismatch.`);
    assert(metadata.exposedNormally === true, `${tool} must be normally exposed metadata.`);
    assert(metadata.sdkSupported === true, `${tool} must be SDK-supported or removed from public exposure.`);
    assert(['low', 'medium', 'high', 'dangerous'].includes(metadata.riskLevel), `${tool} risk metadata invalid.`);
    assert(['core', 'advanced_notes', 'developer_diagnostics'].includes(String(metadata.tier)), `${tool} tier metadata invalid.`);
    if (policy.policy === 'unsupported') {
      throw new Error(`${tool} has unsupported policy while public.`);
    }
  }

  const unsupported = getToolRegistrySummary(false, 'full').staticSdkUnsupportedTools;
  assert(unsupported.includes('create_folder'), 'create_folder must remain in static unsupported diagnostics.');
  assert((STATIC_SDK_UNSUPPORTED_TOOLS as readonly string[]).includes('create_folder'), 'create_folder unsupported constant missing.');

  const summary = getToolRegistrySummary(false, profile);
  assertMatrixShape(summary.runtimeVerificationMatrix as Array<Record<string, unknown>>, publicTools);
}

function assertIdempotencyAndDryRun(seen: readonly SeenBridgeRequest[]) {
  const deleteRequest = seen.find((request) => request.tool === 'delete_rem_by_id');
  assert(deleteRequest, 'Area 3 certification did not reach delete_rem_by_id.');
  assert(deleteRequest.args.dryRun === true, 'delete_rem_by_id certification must stay dryRun=true.');

  for (const request of seen) {
    const publicName = request.tool === 'ping'
      ? 'ping_remnote_plugin'
      : request.tool === 'get_status'
        ? 'get_plugin_status'
        : request.tool;
    const metadata = getToolMetadata(publicName);
    if (metadata.supportsDryRun && 'dryRun' in request.args && metadata.requiresWrite) {
      assert(request.args.dryRun !== false, `${publicName} certification must not execute a real dry-run-capable write.`);
    }
    if (metadata.requiresDelete) {
      assert(request.args.dryRun === true, `${publicName} delete certification must use dryRun=true.`);
    }
  }
}

async function certifyProfile(profile: ToolProfile) {
  assertSchemaQuality(profile);
  const app = await startCompanionApp({
    deploymentMode: 'local',
    storageMode: 'memory',
    bridgeToken: token,
    allowNoToken: false,
    allowRemote: false,
    allowCors: false,
    bindHost: '127.0.0.1',
    bridgePath: '/remnote',
    mcpPath: '/mcp',
    singlePort: true,
    port: 0,
    bridgePort: 0,
    mcpPort: 0,
    toolProfile: profile,
    rateLimitMaxRequests: 2000,
    requestTimeoutMs: 8000,
    auditLog: false,
  });
  const baseUrl = `http://127.0.0.1:${app.mcpPort}`;
  const seen: SeenBridgeRequest[] = [];
  const durations: number[] = [];
  let ws: WebSocket | undefined;

  try {
    ws = await connectMockPlugin(`ws://127.0.0.1:${app.mcpPort}${app.config.bridgePath}`, seen);
    const tools = getPublicMcpToolNames(false, profile);
    await assertToolsList(baseUrl, tools);

    for (const tool of tools) {
      const startedAt = Date.now();
      const result = await mcpToolCall(baseUrl, tool, mcpArgsFor(tool));
      durations.push(Date.now() - startedAt);
      assertToolResult(tool, result);
    }

    const diagnostics = await getDiagnostics(baseUrl);
    const matrix = diagnostics?.runtimeVerificationMatrix as Array<Record<string, unknown>>;
    assert(Array.isArray(matrix), '/diagnostics did not return runtimeVerificationMatrix.');
    assertMatrixShape(matrix, tools);

    const unverified = matrix
      .filter((entry) => tools.includes(String(entry.name)) && entry.runtimeVerified !== true)
      .map((entry) => entry.name);
    assert(unverified.length === 0, `Runtime certification left unverified tools: ${unverified.join(', ')}.`);

    assertIdempotencyAndDryRun(seen);

    const p95Ms = p95(durations);
    if (p95Ms !== null && p95Ms > 5000) {
      console.warn(`Area 3 ${profile} performance warning: MCP p95 ${p95Ms}ms exceeds 5000ms.`);
    }
    const slowTools = durations.filter((duration) => duration > 8000);
    assert(slowTools.length === 0, `Area 3 ${profile} certification had ${slowTools.length} tool call(s) over 8000ms.`);
    console.log(`Area 3 ${profile} certification passed: ${tools.length} tools, p95=${p95Ms ?? 0}ms.`);
  } finally {
    ws?.close();
    await app.stop();
  }
}

const checks: Record<string, () => Promise<void> | void> = {
  all: async () => {
    assertSchemaQuality('full');
    await certifyProfile('full');
  },
  core: () => certifyProfile('core'),
  advanced: () => certifyProfile('advanced_notes'),
  diagnostics: () => certifyProfile('developer_diagnostics'),
  schemas: () => assertSchemaQuality('full'),
  hosted: () => {
    const summary = getToolRegistrySummary(false, 'full', undefined, {
      discoveryAuthMode: 'no_auth_required',
      toolCallAuthMode: 'hosted_oauth_required',
    });
    assert(summary.toolCallAuthMode === 'hosted_oauth_required', 'hosted matrix must use hosted_oauth_required.');
    assert(summary.unauthMcpCallableTools.length === 0, 'hosted matrix must not claim unauthenticated MCP callability.');
    assertSchemaQuality('full');
  },
  idempotency: async () => {
    assertSchemaQuality('full');
    await certifyProfile('full');
  },
  performance: () => certifyProfile('full'),
};

const check = checks[mode];
assert(check, `Unknown Area 3 certification mode: ${mode}`);
await check();
console.log(`Area 3 ${mode} check passed.`);
