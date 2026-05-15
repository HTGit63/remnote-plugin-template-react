import { randomUUID } from 'node:crypto';
import type { BridgeResponse, BridgeToolArgs, BridgeToolName } from '../../src/bridge/protocol.js';
import type { BridgeHub } from './bridge-hub.js';
import {
  getPublicMcpToolNames,
  SERVER_LOCAL_MCP_TOOLS,
  STATIC_SDK_UNSUPPORTED_TOOLS,
} from './tool-registry.js';
import {
  bridgeToolNameForPublicMcpTool,
} from './mcp-tool-map.js';
import type {
  BridgeHealthCheckMode,
  BridgeHealthCheckResult,
  BridgeHealthCheckStatus,
  BridgeHealthCheckToolResult,
} from './health-check-types.js';

export interface RunBridgeHealthCheckOptions {
  mode?: BridgeHealthCheckMode;
  exposeDeleteTool?: boolean;
  includeWrites?: boolean;
  includeExistingRemMutations?: boolean;
  parentId?: string;
  targetRemId?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}

const DIRECT_SERVER_TOOLS = new Set<string>(SERVER_LOCAL_MCP_TOOLS);

const WRITE_TOOLS = new Set([
  'create_rem',
  'create_document',
  'create_folder',
  'append_to_rem',
  'update_rem',
  'replace_rem',
  'move_rem',
  'reorder_children',
  'create_rem_tree',
  'update_rem_rich',
  'set_rem_heading_level',
  'set_rem_text_color',
  'set_rem_highlight_color',
  'set_text_span_color',
  'set_text_span_highlight',
  'set_rem_type',
  'set_hide_bullet',
  'clear_rem_formatting',
  'create_styled_rem_tree',
  'apply_remnote_command',
  'apply_structured_note_batch',
  'create_basic_flashcard',
  'create_concept_card',
  'create_descriptor_card',
  'create_cloze_card',
  'create_multiple_choice_card',
  'create_list_answer_card',
  'create_polished_note_tree',
]);

const EXISTING_REM_MUTATION_TOOLS = new Set([
  'update_rem',
  'replace_rem',
  'move_rem',
  'reorder_children',
  'update_rem_rich',
  'set_rem_heading_level',
  'set_rem_text_color',
  'set_rem_highlight_color',
  'set_text_span_color',
  'set_text_span_highlight',
  'set_rem_type',
  'set_hide_bullet',
  'clear_rem_formatting',
  'apply_remnote_command',
  'apply_style_plan',
]);

const DESTRUCTIVE_TOOLS = new Set(['delete_rem_by_id', 'delete_focused_rem', 'delete_selected_rem', 'delete_rem']);

function nowMs(): number {
  return Date.now();
}

function durationFrom(startedAt: number): number {
  return Math.max(0, Date.now() - startedAt);
}

function skipped(tool: string, reason: string, startedAt = nowMs(), bridgeTool?: string): BridgeHealthCheckToolResult {
  return {
    tool,
    status: 'skipped',
    durationMs: durationFrom(startedAt),
    ...(bridgeTool ? { bridgeTool } : {}),
    reason,
  };
}

function directPass(tool: string, startedAt = nowMs()): BridgeHealthCheckToolResult {
  return {
    tool,
    status: 'passed',
    durationMs: durationFrom(startedAt),
    reason: 'Server-local tool is registered and does not require the RemNote plugin round trip.',
  };
}

function resolveMode(options: RunBridgeHealthCheckOptions): BridgeHealthCheckMode {
  if (options.mode) {
    return options.mode;
  }
  if (options.includeExistingRemMutations) {
    return 'mutation_on_disposable_rem';
  }
  if (options.includeWrites) {
    return 'safe_write';
  }
  return 'read_only';
}

function modeIncludesWrites(mode: BridgeHealthCheckMode): boolean {
  return mode !== 'read_only';
}

function modeIncludesExistingMutations(mode: BridgeHealthCheckMode): boolean {
  return mode === 'mutation_on_disposable_rem';
}

function resultFromResponse(
  tool: string,
  bridgeTool: BridgeToolName,
  response: BridgeResponse,
  startedAt: number
): BridgeHealthCheckToolResult {
  if (response.ok) {
    return {
      tool,
      bridgeTool,
      status: 'passed',
      durationMs: durationFrom(startedAt),
    };
  }

  return {
    tool,
    bridgeTool,
    status: response.error.code === 'SDK_UNSUPPORTED' ? 'unsupported' : 'failed',
    durationMs: durationFrom(startedAt),
    errorCode: response.error.code,
    errorMessage: response.error.message,
    reason: response.error.code === 'SDK_UNSUPPORTED' ? 'Installed RemNote SDK does not expose this operation.' : undefined,
  };
}

function responseRawTextItems(response: BridgeResponse): Array<Record<string, unknown>> {
  if (!response.ok || typeof response.result !== 'object' || response.result === null) {
    return [];
  }

  const rawText = (response.result as Record<string, unknown>).rawText;
  if (!Array.isArray(rawText)) {
    return [];
  }

  return rawText.filter((item): item is Record<string, unknown> => {
    return typeof item === 'object' && item !== null && !Array.isArray(item);
  });
}

function rawRoundtripResultFromResponse(
  tool: string,
  bridgeTool: BridgeToolName,
  response: BridgeResponse,
  startedAt: number
): BridgeHealthCheckToolResult {
  const base = resultFromResponse(tool, bridgeTool, response, startedAt);
  if (!response.ok || base.status !== 'passed') {
    return base;
  }

  const rawTextItems = responseRawTextItems(response);
  const hasFontColor = rawTextItems.some((item) => item.tc !== undefined);
  const hasHighlight = rawTextItems.some((item) => item.h !== undefined);
  if (hasFontColor && hasHighlight) {
    return {
      ...base,
      reason: 'Raw rich text contains true font-color field tc and selected-text highlight field h.',
    };
  }

  return {
    ...base,
    status: 'failed',
    reason: 'Raw rich text did not preserve both expected fields: true font color tc and text highlight h.',
    errorCode: 'SDK_ERROR',
    errorMessage: 'Missing raw tc and/or h fields after font/highlight writes.',
  };
}

async function runFormattingHealthSections(
  hub: BridgeHub,
  targetRemId: string,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<BridgeHealthCheckToolResult[]> {
  const sections: BridgeHealthCheckToolResult[] = [];

  async function runSection(
    tool: string,
    bridgeTool: BridgeToolName,
    args: BridgeToolArgs[BridgeToolName],
    inspect?: (response: BridgeResponse, startedAt: number) => BridgeHealthCheckToolResult
  ) {
    const sectionStartedAt = nowMs();
    const response = await hub.callPlugin(bridgeTool, args as never, timeoutMs, signal);
    sections.push(
      inspect
        ? inspect(response, sectionStartedAt)
        : resultFromResponse(tool, bridgeTool, response, sectionStartedAt)
    );
  }

  await runSection('true_font_color_write', 'set_rem_text_color', {
    remId: targetRemId,
    color: 'Blue',
  });
  await runSection('text_span_font_color_write', 'set_text_span_color', {
    remId: targetRemId,
    range: { start: 0, end: 1 },
    color: 'Red',
  });
  await runSection('whole_rem_highlight_write', 'set_rem_highlight_color', {
    remId: targetRemId,
    color: 'Yellow',
  });
  await runSection('text_span_highlight_write', 'set_text_span_highlight', {
    remId: targetRemId,
    range: { start: 1, end: 2 },
    color: 'Green',
  });
  await runSection(
    'raw_rich_text_roundtrip',
    'debug_get_raw_rich_text',
    {
      remId: targetRemId,
    },
    (response, startedAt) => rawRoundtripResultFromResponse(
      'raw_rich_text_roundtrip',
      'debug_get_raw_rich_text',
      response,
      startedAt
    )
  );

  return sections;
}

function healthCheckArgsFor(
  bridgeTool: BridgeToolName,
  options: RunBridgeHealthCheckOptions
): BridgeToolArgs[BridgeToolName] | undefined {
  const parentId = options.parentId?.trim();
  const targetRemId = options.targetRemId?.trim() || parentId;

  switch (bridgeTool) {
    case 'ping':
      return { message: 'bridge health check' };
    case 'get_status':
    case 'get_focused_rem':
    case 'get_current_selection':
      return {};
    case 'get_document_or_folder_tree':
      return { rootRemId: targetRemId ?? null, depth: 1, maxChildren: 10 };
    case 'search_rems':
      return { query: 'health', contextRemId: targetRemId ?? null, maxResults: 3 };
    case 'get_rem':
    case 'get_rem_tree':
    case 'get_rem_rich':
    case 'debug_get_raw_rich_text':
    case 'get_rem_breadcrumbs':
      return targetRemId
        ? ({
            remId: targetRemId,
            ...(bridgeTool === 'get_rem_tree' ? { depth: 1 } : {}),
          } as BridgeToolArgs[BridgeToolName])
        : undefined;
    case 'get_children':
      return targetRemId ? { parentRemId: targetRemId, maxChildren: 10 } : undefined;
    case 'apply_structured_note_batch':
      return parentId
        ? {
            target: { mode: 'parent_child', parentId },
            operation: 'create_child_tree',
            parentId,
            position: 'end',
            dryRun: !options.includeWrites,
            idempotencyKey: `health-${Date.now()}`,
            rollbackOnFailure: true,
            verifyAfterWrite: Boolean(options.includeWrites),
            root: {
              text: 'RemNote bridge health check',
              children: [
                {
                  richText: [
                    { text: 'Inline math ' },
                    { type: 'inlineMath', latex: 'a^2+b^2=c^2' },
                  ],
                },
              ],
            },
          }
        : undefined;
    case 'create_polished_note_tree':
      return options.includeWrites && parentId
        ? {
            parentId,
            tree: {
              text: 'Bridge health polished tree',
              style: { headingLevel: 'H3', highlightColor: 'yellow' },
              children: [
                {
                  richText: [
                    { text: 'alpha ' },
                    { text: 'beta', styles: { color: 'blue', bold: true } },
                  ],
                },
              ],
            },
            stylingPlan: {
              operations: [],
            },
            verifyAfterWrite: true,
            idempotencyKey: `health-polished-${Date.now()}`,
          }
        : undefined;
    case 'apply_style_plan':
      return options.includeExistingRemMutations && targetRemId
        ? {
            operations: [
              {
                remId: targetRemId,
                type: 'text_color_span',
                text: 'Bridge',
                occurrence: 1,
                value: 'Blue',
              },
            ],
            continueOnError: true,
            verifyAfterWrite: true,
          }
        : undefined;
    case 'verify_note_design':
      return targetRemId
        ? {
            rootRemId: targetRemId,
            expectedStyleMap: {
              [targetRemId]: {},
            },
          }
        : undefined;
    case 'apply_remnote_command':
      return options.includeExistingRemMutations && targetRemId
        ? {
            target: { mode: 'rem_id', remId: targetRemId },
            command: 'heading_3',
            idempotencyKey: `health-command-${Date.now()}`,
          }
        : undefined;
    case 'create_rem':
      return options.includeWrites && parentId ? { parentId, markdown: 'Bridge health check Rem' } : undefined;
    case 'create_document':
      return options.includeWrites && parentId ? { parentId, markdown: 'Bridge health check document' } : undefined;
    case 'create_folder':
      return options.includeWrites && parentId ? { parentId, markdown: 'Bridge health check folder' } : undefined;
    case 'append_to_rem':
      return options.includeWrites && parentId ? { remId: parentId, markdown: 'Bridge health check child', position: 'end' } : undefined;
    case 'create_rem_tree':
      return options.includeWrites && parentId
        ? {
            parentId,
            position: 'end',
            tree: {
              title: 'Bridge health check tree',
              children: [{ title: 'Child' }],
            },
          }
        : undefined;
    case 'create_styled_rem_tree':
      return options.includeWrites && parentId
        ? {
            parentId,
            position: 'end',
            tree: {
              text: 'Bridge health check styled tree',
              style: { headingLevel: 'H3' },
              children: [{ type: 'mathBlock', latex: 'x=1' }],
            },
          }
        : undefined;
    case 'create_basic_flashcard':
    case 'create_concept_card':
    case 'create_descriptor_card':
      return options.includeWrites && parentId
        ? {
            parentId,
            front: 'Bridge health check front',
            back: 'Bridge health check back',
            direction: 'both',
          }
        : undefined;
    case 'create_cloze_card':
      return options.includeWrites && parentId
        ? {
            parentId,
            text: 'Bridge health check cloze text',
            clozeText: 'cloze',
            direction: 'both',
          }
        : undefined;
    case 'create_multiple_choice_card':
      return options.includeWrites && parentId
        ? {
            parentId,
            question: 'Bridge health check choice?',
            choices: ['A', 'B'],
            correctChoice: 'A',
            direction: 'forward',
          }
        : undefined;
    case 'create_list_answer_card':
      return options.includeWrites && parentId
        ? {
            parentId,
            prompt: 'Bridge health check list',
            items: ['One'],
            direction: 'forward',
          }
        : undefined;
    case 'update_rem':
      return options.includeExistingRemMutations && targetRemId
        ? { remId: targetRemId, markdown: 'Bridge health check updated existing Rem' }
        : undefined;
    case 'update_rem_rich':
      return options.includeExistingRemMutations && targetRemId
        ? { remId: targetRemId, richText: [{ text: 'Bridge health check rich update' }] }
        : undefined;
    case 'set_rem_heading_level':
      return options.includeExistingRemMutations && targetRemId ? { remId: targetRemId, level: 'H3' } : undefined;
    case 'set_rem_text_color':
      return options.includeExistingRemMutations && targetRemId ? { remId: targetRemId, color: 'blue' } : undefined;
    case 'set_rem_highlight_color':
      return options.includeExistingRemMutations && targetRemId ? { remId: targetRemId, color: 'yellow' } : undefined;
    case 'set_text_span_color':
      return options.includeExistingRemMutations && targetRemId
        ? { remId: targetRemId, range: { start: 0, end: 1 }, color: 'green' }
        : undefined;
    case 'set_text_span_highlight':
      return options.includeExistingRemMutations && targetRemId
        ? { remId: targetRemId, range: { start: 0, end: 1 }, color: 'yellow' }
        : undefined;
    case 'set_rem_type':
      return options.includeExistingRemMutations && targetRemId ? { remId: targetRemId, type: 'concept' } : undefined;
    case 'set_hide_bullet':
      return options.includeExistingRemMutations && targetRemId ? { remId: targetRemId, hideBullet: false } : undefined;
    case 'clear_rem_formatting':
      return options.includeExistingRemMutations && targetRemId ? { remId: targetRemId } : undefined;
    case 'move_rem':
      return options.includeExistingRemMutations && parentId && targetRemId
        ? { remId: targetRemId, newParentId: parentId, index: 0 }
        : undefined;
    case 'reorder_children':
      return undefined;
    case 'replace_rem':
      return options.includeExistingRemMutations && targetRemId
        ? { remId: targetRemId, markdown: 'Bridge health check replaced disposable Rem' }
        : undefined;
    case 'delete_rem_by_id':
      return options.mode === 'destructive_on_disposable_rem' && parentId && targetRemId
        ? {
            remId: targetRemId,
            expectedParentId: parentId,
            confirmTitle: 'Bridge health disposable delete target',
            dryRun: false,
            idempotencyKey: `health-delete-${targetRemId}`,
          }
        : undefined;
    case 'delete_focused_rem':
    case 'delete_selected_rem':
    case 'delete_rem':
      return undefined;
    default:
      return undefined;
  }
}

function summarizeStatus(results: BridgeHealthCheckToolResult[]): BridgeHealthCheckStatus {
  const failedCount = results.filter((result) => result.status === 'failed').length;
  const passedCount = results.filter((result) => result.status === 'passed').length;
  const skippedCount = results.filter((result) => result.status === 'skipped').length;
  const unsupportedCount = results.filter((result) => result.status === 'unsupported').length;

  if (failedCount > 0 && passedCount > 0) {
    return 'partial';
  }
  if (failedCount > 0) {
    return 'failed';
  }
  if (passedCount === 0 && (skippedCount > 0 || unsupportedCount > 0)) {
    return 'skipped';
  }
  return 'passed';
}

function createdRemIdFromResponse(response: BridgeResponse): string | undefined {
  if (!response.ok || typeof response.result !== 'object' || response.result === null) {
    return undefined;
  }

  const result = response.result as Record<string, unknown>;
  return typeof result.createdRemId === 'string' ? result.createdRemId : undefined;
}

export async function runBridgeHealthCheck(
  hub: BridgeHub,
  options: RunBridgeHealthCheckOptions = {}
): Promise<BridgeHealthCheckResult> {
  const startedAtMs = Date.now();
  const startedAt = new Date(startedAtMs).toISOString();
  const connectedAtStart = hub.getStatus().connected;
  const publicTools = getPublicMcpToolNames(Boolean(options.exposeDeleteTool));
  const results: BridgeHealthCheckToolResult[] = [];
  const mode = resolveMode(options);
  const includeWrites = modeIncludesWrites(mode);
  const includeExistingRemMutations = modeIncludesExistingMutations(mode);
  const timeoutMs = Math.min(Math.max(options.timeoutMs ?? 5000, 1000), 30000);
  let effectiveParentId = options.parentId?.trim();
  let effectiveTargetRemId = options.targetRemId?.trim() || effectiveParentId;
  let disposableSandboxRemId: string | undefined;

  if (connectedAtStart && includeWrites && effectiveParentId) {
    const toolStartedAt = nowMs();
    const title =
      mode === 'destructive_on_disposable_rem'
        ? 'Bridge health disposable delete target'
        : `Bridge health disposable sandbox ${new Date().toISOString()}`;
    const response = await hub.callPlugin(
      'create_rem',
      {
        parentId: effectiveParentId,
        markdown: title,
      },
      timeoutMs,
      options.signal
    );
    results.push(resultFromResponse('health_disposable_sandbox', 'create_rem', response, toolStartedAt));
    disposableSandboxRemId = createdRemIdFromResponse(response);
    if (disposableSandboxRemId) {
      if (mode === 'safe_write') {
        effectiveParentId = disposableSandboxRemId;
      } else {
        effectiveTargetRemId = disposableSandboxRemId;
      }
    }
  }

  const effectiveOptions: RunBridgeHealthCheckOptions = {
    ...options,
    mode,
    includeWrites,
    includeExistingRemMutations,
    parentId: mode === 'destructive_on_disposable_rem' ? options.parentId?.trim() : effectiveParentId,
    targetRemId: effectiveTargetRemId,
  };

  if (connectedAtStart && mode === 'mutation_on_disposable_rem' && disposableSandboxRemId) {
    results.push(...(await runFormattingHealthSections(
      hub,
      disposableSandboxRemId,
      timeoutMs,
      options.signal
    )));
  }

  for (const tool of publicTools) {
    if (tool === 'create_rem' && disposableSandboxRemId) {
      continue;
    }

    const toolStartedAt = nowMs();
    if (DIRECT_SERVER_TOOLS.has(tool)) {
      results.push(directPass(tool, toolStartedAt));
      continue;
    }

    if ((STATIC_SDK_UNSUPPORTED_TOOLS as readonly string[]).includes(tool)) {
      results.push({
        ...skipped(tool, 'Known installed SDK unsupported tool.', toolStartedAt),
        status: 'unsupported',
      });
      continue;
    }

    const bridgeTool = bridgeToolNameForPublicMcpTool(tool);
    if (!bridgeTool) {
      results.push(skipped(tool, 'No bridge tool mapping exists for this MCP tool.', toolStartedAt));
      continue;
    }

    if (DESTRUCTIVE_TOOLS.has(tool)) {
      if (tool !== 'delete_rem_by_id' || mode !== 'destructive_on_disposable_rem') {
        results.push(skipped(tool, 'Health check never uses focus/selection/legacy deletion.', toolStartedAt, bridgeTool));
        continue;
      }
      if (!disposableSandboxRemId || !options.parentId?.trim()) {
        results.push(skipped(tool, 'delete_rem_by_id destructive health check requires a disposable Rem created under parentId.', toolStartedAt, bridgeTool));
        continue;
      }
    }

    if (mode === 'destructive_on_disposable_rem' && WRITE_TOOLS.has(tool)) {
      results.push(skipped(tool, 'Destructive health mode only creates and deletes its own disposable Rem.', toolStartedAt, bridgeTool));
      continue;
    }

    if (WRITE_TOOLS.has(tool) && !includeWrites && bridgeTool !== 'apply_structured_note_batch') {
      results.push(skipped(tool, 'Write checks disabled in read_only mode.', toolStartedAt, bridgeTool));
      continue;
    }

    if (WRITE_TOOLS.has(tool) && includeWrites && !effectiveParentId) {
      results.push(skipped(tool, 'Write health checks require parentId so disposable children stay scoped.', toolStartedAt, bridgeTool));
      continue;
    }

    if (EXISTING_REM_MUTATION_TOOLS.has(tool) && !includeExistingRemMutations) {
      results.push(skipped(tool, 'Existing-Rem mutation checks run only in mutation_on_disposable_rem mode.', toolStartedAt, bridgeTool));
      continue;
    }

    if (!connectedAtStart) {
      results.push(skipped(tool, 'RemNote plugin is not connected.', toolStartedAt, bridgeTool));
      continue;
    }

    const args = healthCheckArgsFor(bridgeTool, effectiveOptions);
    if (!args) {
      results.push(skipped(tool, 'Health check needs parentId, targetRemId, or a safer manual workflow for this tool.', toolStartedAt, bridgeTool));
      continue;
    }

    const response = await hub.callPlugin(
      bridgeTool,
      args as never,
      timeoutMs,
      options.signal
    );
    results.push(resultFromResponse(tool, bridgeTool, response, toolStartedAt));
  }

  const passedCount = results.filter((result) => result.status === 'passed').length;
  const failedCount = results.filter((result) => result.status === 'failed').length;
  const skippedCount = results.filter((result) => result.status === 'skipped').length;
  const unsupportedCount = results.filter((result) => result.status === 'unsupported').length;
  const result: BridgeHealthCheckResult = {
    id: randomUUID(),
    status: summarizeStatus(results),
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: durationFrom(startedAtMs),
    connectedAtStart,
    mode,
    includeWrites,
    includeExistingRemMutations,
    ...(options.parentId ? { parentId: options.parentId } : {}),
    ...(effectiveTargetRemId ? { targetRemId: effectiveTargetRemId } : {}),
    ...(disposableSandboxRemId ? { disposableSandboxRemId } : {}),
    totalTools: results.length,
    passedCount,
    failedCount,
    skippedCount,
    unsupportedCount,
    results,
  };

  hub.recordHealthCheck(result);
  return result;
}
