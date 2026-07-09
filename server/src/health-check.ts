import { randomUUID } from 'node:crypto';
import type { BridgeResponse, BridgeToolArgs, BridgeToolName } from '../../shared/bridge/protocol.js';
import type { BridgeHub } from './bridge-hub.js';
import type { AuthenticatedPrincipal } from './auth/types.js';
import {
  getPublicMcpToolNames,
  SERVER_LOCAL_MCP_TOOLS,
  STATIC_SDK_UNSUPPORTED_TOOLS,
} from './tool-registry.js';
import {
  bridgeToolNameForPublicMcpTool,
} from './mcp-tool-map.js';
import { DEFAULT_TOOL_PROFILE, TOOL_METADATA, type ToolProfile } from './tool-policy.js';
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
  toolProfile?: ToolProfile;
  principal?: AuthenticatedPrincipal;
}

const DIRECT_SERVER_TOOLS = new Set<string>(SERVER_LOCAL_MCP_TOOLS);

const WRITE_TOOLS = new Set(
  TOOL_METADATA.filter((tool) => tool.isPublic && tool.sdkSupported && tool.requiresWrite).map((tool) => tool.name)
);

const EXISTING_REM_MUTATION_TOOLS = new Set(
  TOOL_METADATA.filter(
    (tool) => tool.isPublic && tool.sdkSupported && (tool.category === 'repair' || tool.category === 'danger')
  ).map((tool) => tool.name)
);

const DESTRUCTIVE_TOOLS = new Set(
  TOOL_METADATA.filter((tool) => tool.isPublic && tool.sdkSupported && tool.isDangerous).map((tool) => tool.name)
);

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
  signal?: AbortSignal,
  principal?: AuthenticatedPrincipal
): Promise<BridgeHealthCheckToolResult[]> {
  const sections: BridgeHealthCheckToolResult[] = [];

  async function runSection(
    tool: string,
    bridgeTool: BridgeToolName,
    args: BridgeToolArgs[BridgeToolName],
    inspect?: (response: BridgeResponse, startedAt: number) => BridgeHealthCheckToolResult
  ) {
    const sectionStartedAt = nowMs();
    const response = await hub.callPlugin(bridgeTool, args as never, timeoutMs, signal, principal);
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

async function runReorderChildrenHealthSection(
  hub: BridgeHub,
  parentRemId: string,
  timeoutMs: number,
  signal?: AbortSignal,
  principal?: AuthenticatedPrincipal
): Promise<BridgeHealthCheckToolResult[]> {
  const results: BridgeHealthCheckToolResult[] = [];
  const createdChildIds: string[] = [];

  for (const label of ['Reorder A', 'Reorder B', 'Reorder C']) {
    const startedAt = nowMs();
    const response = await hub.callPlugin(
      'create_rem',
      {
        parentId: parentRemId,
        markdown: label,
        idempotencyKey: `health-reorder-${parentRemId}-${label}`,
      },
      timeoutMs,
      signal,
      principal
    );
    results.push(resultFromResponse(`reorder_children_setup_${label.replace(/\s+/g, '_').toLowerCase()}`, 'create_rem', response, startedAt));
    const childId = createdRemIdFromResponse(response);
    if (childId) {
      createdChildIds.push(childId);
    }
  }

  if (createdChildIds.length !== 3) {
    results.push({
      tool: 'reorder_children_live_order',
      bridgeTool: 'reorder_children',
      status: 'failed',
      durationMs: 0,
      errorCode: 'PARTIAL_FAILURE',
      errorMessage: 'Could not create all disposable reorder children.',
      reason: `Expected 3 disposable children, got ${createdChildIds.length}.`,
    });
    return results;
  }

  const desiredOrder = [createdChildIds[2], createdChildIds[0], createdChildIds[1]];
  const reorderStartedAt = nowMs();
  const reorderResponse = await hub.callPlugin(
    'reorder_children',
    {
      parentRemId,
      orderedChildRemIds: desiredOrder,
      dryRun: false,
      allowPartial: true,
      idempotencyKey: `health-reorder-apply-${parentRemId}`,
    },
    timeoutMs,
    signal,
    principal
  );
  results.push(resultFromResponse('reorder_children_apply', 'reorder_children', reorderResponse, reorderStartedAt));
  if (!reorderResponse.ok) {
    return results;
  }

  const readStartedAt = nowMs();
  const readResponse = await hub.callPlugin(
    'get_children',
    {
      parentRemId,
      maxChildren: 10,
    },
    timeoutMs,
    signal,
    principal
  );
  const base = resultFromResponse('reorder_children_live_order', 'get_children', readResponse, readStartedAt);
  if (!readResponse.ok || base.status !== 'passed') {
    results.push(base);
    return results;
  }

  const children = (readResponse.result as { children?: Array<{ remId?: string }> }).children ?? [];
  const actualOrder = children.map((child) => child.remId).filter((id): id is string => typeof id === 'string');
  const desiredSequence = desiredOrder.join('|');
  const actualSequence = actualOrder.filter((id) => desiredOrder.includes(id)).join('|');
  results.push({
    ...base,
    status: actualSequence === desiredSequence ? 'passed' : 'failed',
    reason:
      actualSequence === desiredSequence
        ? 'Disposable reorder children read back in requested order: Reorder C, Reorder A, Reorder B.'
        : `Disposable reorder readback mismatch. Expected ${desiredSequence}; got ${actualSequence || 'none'}.`,
    errorCode: actualSequence === desiredSequence ? undefined : 'SDK_ERROR',
    errorMessage: actualSequence === desiredSequence ? undefined : 'reorder_children readback order mismatch.',
  });
  return results;
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
    case 'create_or_replace_note_from_markdown':
      return parentId
        ? {
            parentRemId: parentId,
            markdownText: [
              '# Bridge health Markdown import',
              '',
              '### Health section',
              '',
              'Inline math $a^2+b^2=c^2$ stays in source.',
              '',
              '$$',
              'E=mc^2',
              '$$',
            ].join('\n'),
            mode: 'create_child',
            duplicatePolicy: 'create_new',
            safetyOptions: {
              dryRun: !options.includeWrites,
              verifyAfterWrite: Boolean(options.includeWrites),
              rollbackOnFailure: true,
              idempotencyKey: `health-markdown-${Date.now()}`,
            },
            limits: {
              maxDepth: 8,
              maxNodes: 200,
            },
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
    case 'analyze_note_design':
      return targetRemId ? { rootRemId: targetRemId, maxDepth: 2, maxNodes: 50 } : undefined;
    case 'save_note_design_template':
      return targetRemId
        ? {
            templateId: `health-template-${targetRemId}`,
            name: 'Bridge health design template',
            rootRemId: targetRemId,
            overwrite: true,
          }
        : undefined;
    case 'list_note_design_templates':
      return { includeRules: false };
    case 'preview_note_design_plan':
      return {
        rules: {
          headingPattern: { rootHeadingLevel: 'H1', sectionHeadingLevel: 'H3' },
          colorPattern: {},
          spacingPattern: { spacerCount: 0, spacerTexts: [], blankRemCount: 0, siblingSpacerLikely: false },
          mathPattern: { inlineMathCount: 0, blockMathCount: 0, visibleDelimiterCount: 0, malformedMathLikely: false },
          bulletNesting: { maxDepth: 1, maxChildrenPerRem: 1, averageChildrenPerNonLeaf: 1 },
          formulaPlacement: { displayFormulasAsSeparateRems: false, inlineFormulasInsideText: false, rawDisplayDelimitersVisible: false },
          tableStyle: { tableLikeRemCount: 0, markdownTableCount: 0, tableHeadings: [] },
          cardStyle: { cardLikeRemCount: 0, clozeLikeRemCount: 0, doubleColonMarkerCount: 0 },
          workedExampleStyle: { workedExampleCount: 0, labels: [] },
        },
        parentId,
        targetRemId,
        title: 'Bridge health design preview',
        content: 'Bridge health preview content',
        mode: targetRemId ? 'repair' : 'create',
      };
    case 'export_note_design_template':
      return options.includeWrites && targetRemId ? { templateId: `health-template-${targetRemId}` } : undefined;
    case 'import_note_design_template':
      return {
        templateJson: JSON.stringify({
          template: {
            schemaVersion: 1,
            templateId: 'health-import-template',
            name: 'Bridge health imported template',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1,
            conflictBehavior: 'versioned_reject',
            localOnly: true,
            rules: {
              headingPattern: { rootHeadingLevel: 'H1', sectionHeadingLevel: 'H3' },
              colorPattern: {},
              spacingPattern: { spacerCount: 0, spacerTexts: [], blankRemCount: 0, siblingSpacerLikely: false },
              mathPattern: { inlineMathCount: 0, blockMathCount: 0, visibleDelimiterCount: 0, malformedMathLikely: false },
              bulletNesting: { maxDepth: 1, maxChildrenPerRem: 1, averageChildrenPerNonLeaf: 1 },
              formulaPlacement: { displayFormulasAsSeparateRems: false, inlineFormulasInsideText: false, rawDisplayDelimitersVisible: false },
              tableStyle: { tableLikeRemCount: 0, markdownTableCount: 0, tableHeadings: [] },
              cardStyle: { cardLikeRemCount: 0, clozeLikeRemCount: 0, doubleColonMarkerCount: 0 },
              workedExampleStyle: { workedExampleCount: 0, labels: [] },
            },
          },
        }),
        overwrite: true,
      };
    case 'create_designed_note_tree':
      return parentId
        ? {
            parentId,
            title: 'Bridge health designed note',
            content: '# Bridge health designed note\n\nContent',
            writingMode: 'markdown',
            dryRun: !options.includeWrites,
            verifyAfterWrite: Boolean(options.includeWrites),
            performanceTargetMs: 5000,
            idempotencyKey: `health-designed-${Date.now()}`,
          }
        : undefined;
    case 'update_note_with_design':
      return targetRemId
        ? {
            targetRemId,
            mode: 'append_sections',
            markdownText: '### Bridge health append\n\nContent',
            dryRun: true,
            approved: false,
            verifyAfterWrite: false,
            idempotencyKey: `health-update-design-${Date.now()}`,
          }
        : undefined;
    case 'verify_note_against_design':
      return targetRemId
        ? {
            rootRemId: targetRemId,
            rules: {
              headingPattern: {},
              colorPattern: {},
              spacingPattern: { spacerCount: 0, spacerTexts: [], blankRemCount: 0, siblingSpacerLikely: false },
              mathPattern: { inlineMathCount: 0, blockMathCount: 0, visibleDelimiterCount: 0, malformedMathLikely: false },
              bulletNesting: { maxDepth: 1, maxChildrenPerRem: 1, averageChildrenPerNonLeaf: 1 },
              formulaPlacement: { displayFormulasAsSeparateRems: false, inlineFormulasInsideText: false, rawDisplayDelimitersVisible: false },
              tableStyle: { tableLikeRemCount: 0, markdownTableCount: 0, tableHeadings: [] },
              cardStyle: { cardLikeRemCount: 0, clozeLikeRemCount: 0, doubleColonMarkerCount: 0 },
              workedExampleStyle: { workedExampleCount: 0, labels: [] },
            },
          }
        : undefined;
    case 'repair_note_design':
      return targetRemId
        ? {
            rootRemId: targetRemId,
            dryRun: true,
            approved: false,
            verifyAfterWrite: false,
            idempotencyKey: `health-repair-design-${Date.now()}`,
          }
        : undefined;
    case 'create_card_set_from_note':
      return targetRemId
        ? {
            rootRemId: targetRemId,
            parentId: parentId ?? targetRemId,
            maxCards: 5,
            dryRun: !options.includeWrites,
            direction: 'both',
            idempotencyKey: `health-card-set-${Date.now()}`,
          }
        : undefined;
    case 'create_flashcards_from_markdown':
      return parentId
        ? {
            parentId,
            markdownText: 'Bridge health front:: Bridge health back',
            marker: 'both',
            maxCards: 5,
            dryRun: !options.includeWrites,
            direction: 'both',
            idempotencyKey: `health-cards-markdown-${Date.now()}`,
          }
        : undefined;
    case 'create_cloze_cards_from_note':
      return targetRemId
        ? {
            rootRemId: targetRemId,
            parentId: parentId ?? targetRemId,
            maxCards: 5,
            dryRun: !options.includeWrites,
            direction: 'both',
            idempotencyKey: `health-cloze-note-${Date.now()}`,
          }
        : undefined;
    case 'verify_card_set':
      return targetRemId ? { rootRemId: targetRemId, maxCards: 5 } : undefined;
    case 'repair_card_set':
      return targetRemId
        ? {
            rootRemId: targetRemId,
            cards: [{ front: 'Bridge health front', back: 'Bridge health back' }],
            dryRun: true,
            approved: false,
            direction: 'both',
            idempotencyKey: `health-repair-cards-${Date.now()}`,
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
        ? {
            remId: targetRemId,
            richText: [
              { text: 'Bridge health disposable mutation target', styles: { bold: true } },
            ],
          }
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
        ? { remId: targetRemId, newParentId: parentId, expectedParentId: parentId, index: 0 }
        : undefined;
    case 'reorder_children':
      return undefined;
    case 'replace_rem':
      return options.includeExistingRemMutations && targetRemId
        ? {
            remId: targetRemId,
            markdown: 'Bridge health check replaced disposable Rem',
            expectedPlainText: 'Bridge health disposable mutation target',
            dryRun: true,
          }
        : undefined;
    case 'delete_rem_by_id':
      return options.mode === 'destructive_on_disposable_rem' && parentId && targetRemId
        ? {
            remId: targetRemId,
            expectedParentId: parentId,
            expectedAncestorId: parentId,
            confirmTitle: 'Bridge health disposable delete target',
            dryRun: false,
            idempotencyKey: `health-delete-${targetRemId}`,
            requirePriorDryRun: true,
          }
        : undefined;
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
  const publicTools = getPublicMcpToolNames(Boolean(options.exposeDeleteTool), options.toolProfile ?? DEFAULT_TOOL_PROFILE);
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
      options.signal,
      options.principal
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
      options.signal,
      options.principal
    )));
    results.push(...(await runReorderChildrenHealthSection(
      hub,
      disposableSandboxRemId,
      timeoutMs,
      options.signal,
      options.principal
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

    if (bridgeTool === 'delete_rem_by_id' && (args as BridgeToolArgs['delete_rem_by_id']).dryRun === false) {
      const dryRunStartedAt = nowMs();
      const dryRunResponse = await hub.callPlugin(
        bridgeTool,
        {
          ...(args as BridgeToolArgs['delete_rem_by_id']),
          dryRun: true,
        },
        timeoutMs,
        options.signal,
        options.principal
      );
      results.push(resultFromResponse('delete_rem_by_id_dry_run', bridgeTool, dryRunResponse, dryRunStartedAt));
      if (!dryRunResponse.ok) {
        continue;
      }
    }

    const response = await hub.callPlugin(
      bridgeTool,
      args as never,
      timeoutMs,
      options.signal,
      options.principal
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
