import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  type BridgeFailure,
  type BridgeResponse,
  type BridgeToolAnnotations,
  type BridgeToolName,
  type BridgeToolArgs,
  BRIDGE_TOOL_ANNOTATIONS,
} from '../../src/bridge/protocol.js';
import type { BridgeHub } from './bridge-hub.js';
import { runBridgeHealthCheck } from './health-check.js';
import { publicMcpToolNameForBridgeTool } from './mcp-tool-map.js';
import {
  getRemnoteCapabilityGuide,
  type RemnoteCapabilityGuideSection,
} from './remnote-capability-guide.js';
import {
  SERVER_LOCAL_MCP_TOOLS,
  STATIC_SDK_UNSUPPORTED_TOOLS,
  assertRegisteredToolsMatchRegistry,
  getToolRegistrySummary,
  type RegisteredMcpToolName,
} from './tool-registry.js';

const REM_ID_SCHEMA = z.string().trim().min(1).max(256);
const MARKDOWN_SCHEMA = z.string().trim().min(1).max(20000);
const POSITION_SCHEMA = z.enum(['start', 'end']).default('end');
const MAX_CHILDREN_SCHEMA = z.number().int().min(1).max(100);
const MAX_SEARCH_RESULTS_SCHEMA = z.number().int().min(1).max(25);
const TREE_DEPTH_SCHEMA = z.number().int().min(0).max(3).default(1);
const ORDERED_CHILD_IDS_SCHEMA = z.array(REM_ID_SCHEMA).max(500);
const DELETE_CONFIRM_SCHEMA = z.literal('DELETE');
const COLOR_SCHEMA = z.enum([
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'gray',
  'brown',
  'default',
  'Red',
  'Orange',
  'Yellow',
  'Green',
  'Blue',
  'Purple',
  'Gray',
  'Brown',
  'Pink',
]);
const HEADING_LEVEL_SCHEMA = z.enum(['H1', 'H2', 'H3', 'normal']);
const REM_TYPE_SCHEMA = z.enum(['normal', 'concept', 'descriptor']);
const PRACTICE_DIRECTION_SCHEMA = z.enum(['forward', 'backward', 'none', 'both']).default('both');
const REMNOTE_COMMAND_SCHEMA = z.enum([
  'heading_1',
  'heading_2',
  'heading_3',
  'normal_text',
  'highlight_yellow',
  'highlight_blue',
  'highlight_green',
  'highlight_red',
  'hide_bullet',
  'show_bullet',
  'make_concept',
  'make_descriptor',
  'make_normal',
  'insert_inline_math',
  'insert_math_block',
]);
const REMNOTE_COMMAND_TARGET_SCHEMA = z.object({
  mode: z.enum(['focused_rem', 'selected_rem', 'rem_id']).describe('How to pick the target Rem.'),
  remId: REM_ID_SCHEMA.nullable().optional().describe('Required when mode is rem_id.'),
});
const STRUCTURED_NOTE_TARGET_SCHEMA = z.object({
  mode: z.enum(['focused_rem', 'rem_id', 'parent_child', 'approved_root']).describe('How to choose the batch root or parent.'),
  remId: REM_ID_SCHEMA.nullable().optional().describe('Existing target Rem for updates/replacements.'),
  parentId: REM_ID_SCHEMA.nullable().optional().describe('Parent Rem for create_child_tree.'),
  createIfMissing: z.boolean().default(false).optional().describe('Reserved for future root creation by title.'),
});
const STRUCTURED_NOTE_OPERATION_SCHEMA = z
  .enum(['replace_children', 'append_children', 'update_root_and_replace_children', 'create_child_tree'])
  .default('create_child_tree');
const TEXT_RANGE_SCHEMA = z.object({
  start: z.number().int().min(0).describe('Zero-based start character offset.'),
  end: z.number().int().min(1).describe('Exclusive end character offset.'),
});
const SPAN_RANGE_INPUT_SCHEMA = {
  range: TEXT_RANGE_SCHEMA.optional().describe('Character range in the Rem plain text.'),
  start: z.number().int().min(0).optional().describe('Zero-based start offset. Alternative to range.'),
  end: z.number().int().min(1).optional().describe('Exclusive end offset. Alternative to range.'),
  text: z.string().trim().min(1).max(1000).optional().describe('Text to locate when start/end are not provided.'),
  occurrence: z.number().int().min(1).max(100).default(1).optional().describe('One-based occurrence for text matching.'),
  verifyAfterWrite: z.boolean().default(false).optional().describe('Return write verification evidence when available.'),
};
const PERMISSION_SCOPE_SCHEMA = z
  .enum([
    'current_permission_scope',
    'focused_rem_only',
    'focused_rem_and_descendants',
    'selected_rem_only',
    'selected_rem_and_descendants',
    'approved_document_or_folder',
    'workspace_allowed',
  ])
  .default('current_permission_scope');
const BRIDGE_TOOL_OUTPUT_SCHEMA = z.object({
  ok: z.boolean(),
  result: z.unknown().optional(),
  error: z.unknown().optional(),
});
const REMNOTE_GUIDE_SECTION_SCHEMA = z
  .enum([
    'all',
    'core_model',
    'documents_folders',
    'references_tags_portals',
    'formatting_design',
    'flashcards',
    'bridge_workflow',
  ])
  .default('all');

const GET_CHILDREN_INPUT_SCHEMA = z
  .object({
    parentRemId: REM_ID_SCHEMA.optional().describe('The parent RemNote Rem ID whose direct children should be read.'),
    remId: REM_ID_SCHEMA.optional().describe('Alias for parentRemId.'),
    maxChildren: MAX_CHILDREN_SCHEMA.optional().describe('Maximum direct children to return, capped at 100.'),
    limit: MAX_CHILDREN_SCHEMA.optional().describe('Alias for maxChildren.'),
  })
  .refine((value) => Boolean(value.parentRemId || value.remId), {
    message: 'Provide parentRemId or remId.',
  });

const SEARCH_REMS_INPUT_SCHEMA = z.object({
  query: z.string().trim().min(1).max(500).describe('Search text. Keep focused and specific.'),
  contextRemId: REM_ID_SCHEMA.nullable().optional().describe('Optional Rem ID to scope search under.'),
  maxResults: MAX_SEARCH_RESULTS_SCHEMA.optional().describe('Maximum results to return, capped at 25.'),
  limit: MAX_SEARCH_RESULTS_SCHEMA.optional().describe('Alias for maxResults.'),
  scope: PERMISSION_SCOPE_SCHEMA.describe('Requested search scope; never expands beyond the plugin permission scope.'),
});

const REORDER_CHILDREN_INPUT_SCHEMA = z
  .object({
    parentRemId: REM_ID_SCHEMA.optional().describe('The parent Rem whose direct children should be reordered.'),
    parentId: REM_ID_SCHEMA.optional().describe('Alias for parentRemId.'),
    orderedChildRemIds: ORDERED_CHILD_IDS_SCHEMA.optional().describe('Full ordered list of current direct child Rem IDs.'),
    orderedChildIds: ORDERED_CHILD_IDS_SCHEMA.optional().describe('Alias for orderedChildRemIds.'),
  })
  .refine((value) => Boolean(value.parentRemId || value.parentId), {
    message: 'Provide parentRemId or parentId.',
  })
  .refine((value) => Boolean(value.orderedChildRemIds || value.orderedChildIds), {
    message: 'Provide orderedChildRemIds or orderedChildIds.',
  });

interface RemTreeNodeInput {
  title: string;
  children?: RemTreeNodeInput[];
}

const REM_TREE_NODE_SCHEMA: z.ZodType<RemTreeNodeInput> = z.lazy(() =>
  z.object({
    title: z.string().trim().min(1).max(1000).describe('Text/markdown title for this Rem node.'),
    children: z.array(REM_TREE_NODE_SCHEMA).max(100).optional().describe('Ordered child Rem nodes.'),
  })
);

interface RichTextSpanInput {
  type?: 'text' | 'inlineMath' | 'mathBlock';
  text?: string;
  latex?: string;
  styles?: {
    color?: z.infer<typeof COLOR_SCHEMA>;
    highlight?: z.infer<typeof COLOR_SCHEMA>;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    quote?: boolean;
    cloze?: boolean;
  };
}

const RICH_TEXT_SPAN_SCHEMA: z.ZodType<RichTextSpanInput> = z.object({
  type: z.enum(['text', 'inlineMath', 'mathBlock']).optional().describe('Text span or RemNote math node.'),
  text: z.string().max(5000).optional().describe('Text content for text spans, or fallback LaTeX content.'),
  latex: z.string().max(5000).optional().describe('LaTeX for inlineMath or mathBlock spans.'),
  styles: z
    .object({
      color: COLOR_SCHEMA.optional(),
      highlight: COLOR_SCHEMA.optional(),
      bold: z.boolean().optional(),
      italic: z.boolean().optional(),
      underline: z.boolean().optional(),
      quote: z.boolean().optional(),
      cloze: z.boolean().optional(),
    })
    .optional(),
});

interface StyledRemTreeNodeInput {
  type?:
    | 'rem'
    | 'mathBlock'
    | 'inlineMath'
    | 'basicFlashcard'
    | 'conceptCard'
    | 'descriptorCard'
    | 'clozeCard'
    | 'multipleChoiceCard'
    | 'listAnswerCard';
  title?: string;
  text?: string;
  richText?: RichTextSpanInput[];
  latex?: string;
  front?: string;
  back?: string;
  answer?: string;
  clozeText?: string;
  choices?: string[];
  correctChoice?: string;
  items?: string[];
  direction?: z.infer<typeof PRACTICE_DIRECTION_SCHEMA>;
  style?: {
    headingLevel?: z.infer<typeof HEADING_LEVEL_SCHEMA>;
    color?: z.infer<typeof COLOR_SCHEMA>;
    highlight?: z.infer<typeof COLOR_SCHEMA>;
    hideBullet?: boolean;
    remType?: z.infer<typeof REM_TYPE_SCHEMA>;
  };
  children?: StyledRemTreeNodeInput[];
}

const STYLED_REM_TREE_NODE_SCHEMA: z.ZodType<StyledRemTreeNodeInput> = z.lazy(() =>
  z.object({
    type: z
      .enum([
        'rem',
        'mathBlock',
        'inlineMath',
        'basicFlashcard',
        'conceptCard',
        'descriptorCard',
        'clozeCard',
        'multipleChoiceCard',
        'listAnswerCard',
      ])
      .default('rem')
      .optional(),
    title: z.string().max(1000).optional(),
    text: z.string().max(5000).optional(),
    richText: z.array(RICH_TEXT_SPAN_SCHEMA).max(200).optional(),
    latex: z.string().max(5000).optional(),
    front: z.string().max(5000).optional(),
    back: z.string().max(5000).optional(),
    answer: z.string().max(5000).optional(),
    clozeText: z.string().max(1000).optional(),
    choices: z.array(z.string().min(1).max(1000)).max(20).optional(),
    correctChoice: z.string().max(1000).optional(),
    items: z.array(z.string().min(1).max(1000)).max(50).optional(),
    direction: PRACTICE_DIRECTION_SCHEMA.optional(),
    style: z
      .object({
        headingLevel: HEADING_LEVEL_SCHEMA.optional(),
        color: COLOR_SCHEMA.optional(),
        highlight: COLOR_SCHEMA.optional(),
        hideBullet: z.boolean().optional(),
        remType: REM_TYPE_SCHEMA.optional(),
      })
      .optional(),
    children: z.array(STYLED_REM_TREE_NODE_SCHEMA).max(100).optional(),
  })
);

const STRUCTURED_NOTE_SCHEMA = z.object({
  root: STYLED_REM_TREE_NODE_SCHEMA.optional().describe('Optional root payload. Required for create_child_tree and root update operations.'),
  children: z.array(STYLED_REM_TREE_NODE_SCHEMA).max(100).optional().describe('Ordered child nodes to append or replace under the target root.'),
});

const STYLE_PLAN_OPERATION_SCHEMA = z.object({
  remId: REM_ID_SCHEMA.describe('Target Rem ID for this style operation.'),
  type: z
    .enum([
      'heading',
      'whole_rem_highlight',
      'text_color_span',
      'text_highlight_span',
      'bold_span',
      'italic_span',
      'math_conversion',
    ])
    .describe('Style operation type.'),
  start: z.number().int().min(0).optional(),
  end: z.number().int().min(1).optional(),
  text: z.string().trim().min(1).max(1000).optional(),
  occurrence: z.number().int().min(1).max(100).default(1).optional(),
  value: z.string().trim().min(1).max(1000).describe('Color, heading level, or operation value.'),
});

const STYLING_PLAN_SCHEMA = z.object({
  operations: z.array(STYLE_PLAN_OPERATION_SCHEMA).max(100).optional(),
});

const EXPECTED_STYLE_MAP_ENTRY_SCHEMA = z.object({
  plainText: z.string().max(5000).optional(),
  headingLevel: HEADING_LEVEL_SCHEMA.optional(),
  wholeRemHighlight: COLOR_SCHEMA.optional(),
  textColorSpans: z
    .array(
      z.object({
        text: z.string().trim().min(1).max(1000).optional(),
        start: z.number().int().min(0).optional(),
        end: z.number().int().min(1).optional(),
        color: COLOR_SCHEMA,
      })
    )
    .max(50)
    .optional(),
  textHighlightSpans: z
    .array(
      z.object({
        text: z.string().trim().min(1).max(1000).optional(),
        start: z.number().int().min(0).optional(),
        end: z.number().int().min(1).optional(),
        color: COLOR_SCHEMA,
      })
    )
    .max(50)
    .optional(),
  childOrder: z.array(REM_ID_SCHEMA).max(200).optional(),
});

type McpToolResult = {
  content: Array<{ type: 'text'; text: string }>;
  structuredContent: Record<string, unknown>;
  isError?: boolean;
};

export interface CreateMcpServerOptions {
  exposeDeleteTool?: boolean;
  requestSignal?: AbortSignal;
  discoveryAuthMode?: 'no_auth_required' | 'local_bearer_required';
  toolCallAuthMode?: 'no_auth_allowed' | 'local_bearer_required';
}

function annotationsFor(tool: BridgeToolName): BridgeToolAnnotations {
  return BRIDGE_TOOL_ANNOTATIONS[tool];
}

function defaultTimeoutForTool(tool: BridgeToolName): number {
  if (BRIDGE_TOOL_ANNOTATIONS[tool].readOnlyHint) {
    return 8000;
  }

  if (BRIDGE_TOOL_ANNOTATIONS[tool].destructiveHint) {
    return 45000;
  }

  if (tool === 'apply_structured_note_batch' || tool === 'create_polished_note_tree') {
    return 45000;
  }

  return 30000;
}

function failureToToolResult(failure: BridgeFailure): McpToolResult {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: `${failure.error.code}: ${failure.error.message}`,
      },
    ],
    structuredContent: {
      ok: false,
      error: failure.error,
    },
  };
}

function internalErrorToToolResult(error: unknown): McpToolResult {
  const message = error instanceof Error ? error.message : String(error);
  console.error('MCP bridge tool failed:', message);
  return failureToToolResult({
    id: 'unknown',
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Bridge tool call failed internally.',
      details: {
        message,
      },
    },
  });
}

function successToToolResult(response: BridgeResponse, message: string): McpToolResult {
  if (!response.ok) {
    return failureToToolResult(response);
  }

  return {
    content: [
      {
        type: 'text',
        text: message,
      },
    ],
    structuredContent: {
      ok: true,
      result: response.result,
    },
  };
}

async function bridgeToolResult(
  call: () => Promise<BridgeResponse>,
  successMessage: string
): Promise<McpToolResult> {
  try {
    return successToToolResult(await call(), successMessage);
  } catch (error: unknown) {
    return internalErrorToToolResult(error);
  }
}

export function createMcpServer(hub: BridgeHub, options: CreateMcpServerOptions = {}): McpServer {
  const server = new McpServer({
    name: 'remnote-chatgpt-bridge',
    version: '0.1.0',
  });
  const registeredToolNames: RegisteredMcpToolName[] = [];
  const currentRegistry = () =>
    getToolRegistrySummary(options.exposeDeleteTool, registeredToolNames, {
      discoveryAuthMode: options.discoveryAuthMode ?? 'no_auth_required',
      toolCallAuthMode: options.toolCallAuthMode ?? 'no_auth_allowed',
    });
  const callPlugin = <TTool extends BridgeToolName>(
    tool: TTool,
    args: BridgeToolArgs[TTool],
    timeoutMs?: number
  ) => hub.callPlugin(tool, args, timeoutMs ?? defaultTimeoutForTool(tool), options.requestSignal);
  const registerTool = ((name: string, config: unknown, handler: unknown) => {
    registeredToolNames.push(name as RegisteredMcpToolName);
    return server.registerTool(name, config as never, handler as never);
  }) as McpServer['registerTool'];

  registerTool(
    'get_bridge_status',
    {
      title: 'Get bridge status',
      description: 'Use this when you need to know whether the RemNote plugin is connected.',
      inputSchema: z.object({}),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async () => ({
      content: [{ type: 'text', text: hub.getStatus().connected ? 'RemNote plugin connected.' : 'RemNote plugin not connected.' }],
      structuredContent: {
        ok: true,
        result: {
          ...hub.getStatus(),
          ...currentRegistry(),
          serverStartedAt: hub.getDiagnostics().startedAt,
          recentRequestCount: hub.getDiagnostics().recentRequests.length,
        },
      },
    })
  );

  registerTool(
    'get_bridge_diagnostics',
    {
      title: 'Get bridge diagnostics',
      description:
        'Use this when the RemNote connector looks stale, a tool call did not return, or you need the live tool registry and recent request outcomes.',
      inputSchema: z.object({}),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async () => {
      const diagnostics = hub.getDiagnostics();
      const registry = currentRegistry();
      const serverLocalTools = SERVER_LOCAL_MCP_TOOLS.filter((tool) => registry.publicTools.includes(tool));
      const successfulPluginTools = Array.from(
        new Set(
          diagnostics.recentRequests
            .filter((request) => request.ok)
            .map((request) => publicMcpToolNameForBridgeTool(request.tool))
        )
      );
      const sdkUnsupportedTools = Array.from(
        new Set([
          ...STATIC_SDK_UNSUPPORTED_TOOLS,
          ...diagnostics.recentRequests
            .filter((request) => request.errorCode === 'SDK_UNSUPPORTED' || request.sdkUnsupported)
            .map((request) => publicMcpToolNameForBridgeTool(request.tool)),
        ])
      ).filter((tool) => registry.publicTools.includes(tool));
      const callableTools = Array.from(new Set([...serverLocalTools, ...successfulPluginTools]));
      const runtimeUnverifiedTools = registry.publicTools.filter(
        (tool) => !callableTools.includes(tool) && !sdkUnsupportedTools.includes(tool)
      );
      const lastSuccessfulToolCalls = diagnostics.recentRequests
        .filter((request) => request.ok)
        .map((request) => ({
          ...request,
          mcpTool: publicMcpToolNameForBridgeTool(request.tool),
        }));
      const lastFailedToolCalls = diagnostics.recentRequests
        .filter((request) => !request.ok)
        .map((request) => ({
          ...request,
          mcpTool: publicMcpToolNameForBridgeTool(request.tool),
        }));
      const partialExecutions = diagnostics.recentRequests
        .filter((request) => request.partialExecution)
        .map((request) => ({
          ...request,
          mcpTool: publicMcpToolNameForBridgeTool(request.tool),
        }));
      return {
        content: [
          {
            type: 'text',
            text: `Bridge diagnostics: ${registry.publicToolCount} listed tools, ${successfulPluginTools.length} recently verified, ${diagnostics.status.pendingRequests} pending requests.`,
          },
        ],
        structuredContent: {
          ok: true,
          result: {
            ...registry,
            ...diagnostics,
            pendingRequests: diagnostics.status.pendingRequests,
            pendingApproval: diagnostics.pending[0] ?? null,
            recentErrors: diagnostics.recentRequests.filter((request) => !request.ok),
            recentRequestLifecycle: diagnostics.recentRequests,
            lastSuccessfulToolCalls,
            lastFailedToolCalls,
            partialExecutions,
            lastPartialExecution: partialExecutions[0] ?? null,
            serverLocalVerifiedTools: serverLocalTools,
            serverLocalVerifiedToolCount: serverLocalTools.length,
            realPluginVerifiedTools: successfulPluginTools,
            verifiedToolCount: successfulPluginTools.length,
            runtimeUnverifiedTools,
            runtimeUnverifiedToolCount: runtimeUnverifiedTools.length,
            sdkUnsupportedTools,
            callableTools,
            actualMcpCallableTools: callableTools,
            unauthMcpCallableTools:
              registry.toolCallAuthMode === 'no_auth_allowed' ? callableTools : [],
          },
        },
      };
    }
  );

  registerTool(
    'run_bridge_health_check',
    {
      title: 'Run bridge health check',
      description:
        'Use this to test registered RemNote bridge tools and record pass/fail/skipped/unsupported results in diagnostics. read_only is default; write/delete modes use disposable Rems under parentId.',
      inputSchema: z.object({
        mode: z.enum(['read_only', 'safe_write', 'mutation_on_disposable_rem', 'destructive_on_disposable_rem']).default('read_only').describe('read_only only probes reads; safe_write creates disposable content under parentId; mutation_on_disposable_rem mutates a disposable Rem; destructive_on_disposable_rem deletes only its own disposable Rem with delete_rem_by_id.'),
        includeWrites: z.boolean().default(false).describe('False runs read-only checks plus a structured batch dry run when parentId is provided. True executes safe create/write checks under parentId.'),
        includeExistingRemMutations: z.boolean().default(false).describe('True also tests updates/formatting against targetRemId, which requires RemNote approval. Destructive deletes are never executed.'),
        parentId: REM_ID_SCHEMA.optional().describe('Existing parent Rem ID for dry-run/batch/create checks.'),
        targetRemId: REM_ID_SCHEMA.optional().describe('Existing target Rem ID for read and explicit existing-Rem mutation checks. Defaults to parentId when omitted.'),
        timeoutMs: z.number().int().min(1000).max(30000).default(5000).describe('Per-tool bridge timeout.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async ({ mode, includeWrites, includeExistingRemMutations, parentId, targetRemId, timeoutMs }) => {
      const result = await runBridgeHealthCheck(hub, {
        mode,
        exposeDeleteTool: options.exposeDeleteTool,
        includeWrites,
        includeExistingRemMutations,
        parentId,
        targetRemId,
        timeoutMs,
        signal: options.requestSignal,
      });
      return {
        content: [
          {
            type: 'text',
            text: `Bridge health check ${result.status}: ${result.passedCount} passed, ${result.failedCount} failed, ${result.skippedCount} skipped, ${result.unsupportedCount} unsupported.`,
          },
        ],
        structuredContent: {
          ok: result.status !== 'failed',
          result,
        },
      };
    }
  );

  registerTool(
    'get_remnote_capability_guide',
    {
      title: 'Get RemNote capability guide',
      description:
        'Use this before planning RemNote notes. Returns a compact knowledge pool for Rems, documents, folders, hierarchy, formatting, flashcards, references, tags, portals, and the safest bridge workflow.',
      inputSchema: z.object({
        section: REMNOTE_GUIDE_SECTION_SCHEMA.describe('Guide section to return. Use all for the complete knowledge pool.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ section }) => {
      const guide = getRemnoteCapabilityGuide(section as RemnoteCapabilityGuideSection);
      return {
        content: [
          {
            type: 'text',
            text: guide.blocks
              .map((block) => `${block.title}\n${block.facts.join('\n')}\nBridge use:\n${block.bridgeUse.join('\n')}`)
              .join('\n\n'),
          },
        ],
        structuredContent: {
          ok: true,
          result: guide,
        },
      };
    }
  );

  registerTool(
    'ping_remnote_plugin',
    {
      title: 'Ping RemNote plugin',
      description: 'Use this when you need to verify the WebSocket path to the running RemNote plugin.',
      inputSchema: z.object({
        message: z.string().trim().max(200).optional().describe('Optional ping message to echo through the plugin.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('ping'),
    },
    async ({ message }) =>
      bridgeToolResult(() => callPlugin('ping', { message }), 'RemNote plugin ping completed.')
  );

  registerTool(
    'get_plugin_status',
    {
      title: 'Get plugin status',
      description: 'Use this when you need RemNote-side bridge status, permission mode, and focused Rem availability.',
      inputSchema: z.object({}),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('get_status'),
    },
    async () => bridgeToolResult(() => callPlugin('get_status', {}), 'Read RemNote plugin status.')
  );

  registerTool(
    'get_focused_rem',
    {
      title: 'Get focused Rem',
      description: 'Use this when the user asks to read the Rem currently focused in RemNote.',
      inputSchema: z.object({}),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('get_focused_rem'),
    },
    async () => bridgeToolResult(() => callPlugin('get_focused_rem', {}), 'Read focused Rem.')
  );

  registerTool(
    'get_rem',
    {
      title: 'Get Rem',
      description: 'Use this when the user provides a Rem ID and asks to read that specific Rem.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The RemNote Rem ID to read.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('get_rem'),
    },
    async ({ remId }) => bridgeToolResult(() => callPlugin('get_rem', { remId }), 'Read Rem by ID.')
  );

  registerTool(
    'get_rem_tree',
    {
      title: 'Get Rem tree',
      description: 'Use this when the user asks to inspect a bounded Rem subtree by Rem ID.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The root RemNote Rem ID to read.'),
        depth: TREE_DEPTH_SCHEMA.describe('Maximum descendant depth, capped at 3.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('get_rem_tree'),
    },
    async ({ remId, depth }) =>
      bridgeToolResult(() => callPlugin('get_rem_tree', { remId, depth }), 'Read bounded Rem tree.')
  );

  registerTool(
    'get_rem_rich',
    {
      title: 'Get Rem rich content',
      description: 'Use this when the user needs normalized rich text, math hints, and plain text for a Rem.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The RemNote Rem ID to read.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('get_rem_rich'),
    },
    async ({ remId }) => bridgeToolResult(() => callPlugin('get_rem_rich', { remId }), 'Read rich Rem content.')
  );

  registerTool(
    'get_current_selection',
    {
      title: 'Get current RemNote selection',
      description: 'Use this when the user asks what Rem is focused or selected in RemNote.',
      inputSchema: z.object({}),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('get_current_selection'),
    },
    async () => bridgeToolResult(() => callPlugin('get_current_selection', {}), 'Read current RemNote selection.')
  );

  registerTool(
    'get_children',
    {
      title: 'Get ordered Rem children',
      description:
        'Use this when the user needs direct child Rems of a parent Rem in their exact RemNote order.',
      inputSchema: GET_CHILDREN_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('get_children'),
    },
    async ({ parentRemId, remId, maxChildren, limit }) =>
      bridgeToolResult(
        () =>
          callPlugin('get_children', {
            parentRemId: parentRemId ?? remId ?? '',
            maxChildren: maxChildren ?? limit,
          }),
        'Read ordered Rem children.'
      )
  );

  registerTool(
    'get_rem_breadcrumbs',
    {
      title: 'Get Rem breadcrumbs',
      description: 'Use this when the user needs the parent chain for a Rem before editing or navigating.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The RemNote Rem ID whose parent chain should be read.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('get_rem_breadcrumbs'),
    },
    async ({ remId }) =>
      bridgeToolResult(
        () => callPlugin('get_rem_breadcrumbs', { remId }),
        'Read Rem breadcrumbs.'
      )
  );

  registerTool(
    'search_rems',
    {
      title: 'Search Rems',
      description:
        'Use this when the user asks to find Rems by text. Results are capped and may be scoped to one context Rem.',
      inputSchema: SEARCH_REMS_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('search_rems'),
    },
    async ({ query, contextRemId, maxResults, limit, scope }) =>
      bridgeToolResult(
        () =>
          callPlugin('search_rems', {
            query,
            contextRemId: contextRemId ?? null,
            maxResults: maxResults ?? limit,
            scope,
          }),
        'Searched Rems.'
      )
  );

  registerTool(
    'get_document_or_folder_tree',
    {
      title: 'Get document or folder tree',
      description:
        'Use this when the user needs the current document/folder context or a bounded tree rooted at a document-like Rem.',
      inputSchema: z.object({
        rootRemId: REM_ID_SCHEMA.nullable().optional().describe('Optional document, folder, portal, or Rem root ID.'),
        depth: TREE_DEPTH_SCHEMA.describe('Maximum descendant depth, capped at 3.'),
        maxChildren: MAX_CHILDREN_SCHEMA.optional().describe('Maximum children per node, capped at 100.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('get_document_or_folder_tree'),
    },
    async ({ rootRemId, depth, maxChildren }) =>
      bridgeToolResult(
        () =>
          callPlugin('get_document_or_folder_tree', {
            rootRemId: rootRemId ?? null,
            depth,
            maxChildren,
          }),
        'Read document or folder tree.'
      )
  );

  registerTool(
    'create_rem',
    {
      title: 'Create Rem',
      description: 'Use this when the user explicitly asks to create a new Rem from markdown.',
      inputSchema: z.object({
        parentId: z.string().trim().max(256).nullable().optional().describe('Optional parent Rem ID.'),
        markdown: MARKDOWN_SCHEMA.describe('Markdown content to create in RemNote.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_rem'),
    },
    async ({ parentId, markdown }) =>
      bridgeToolResult(
        () => callPlugin('create_rem', { parentId: parentId ?? null, markdown }),
        'Create Rem request processed.'
      )
  );

  registerTool(
    'create_document',
    {
      title: 'Create RemNote document',
      description:
        'Use this when the user explicitly asks to create a new RemNote document from markdown.',
      inputSchema: z.object({
        parentId: z.string().trim().max(256).nullable().optional().describe('Optional parent Rem ID.'),
        markdown: MARKDOWN_SCHEMA.describe('Markdown title/content for the new document Rem.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_document'),
    },
    async ({ parentId, markdown }) =>
      bridgeToolResult(
        () => callPlugin('create_document', { parentId: parentId ?? null, markdown }),
        'Create document request processed.'
      )
  );

  registerTool(
    'create_folder',
    {
      title: 'Create RemNote folder',
      description:
        'Use this when the user asks to create a RemNote folder. Returns SDK_UNSUPPORTED if the installed RemNote SDK cannot create folders.',
      inputSchema: z.object({
        parentId: z.string().trim().max(256).nullable().optional().describe('Optional parent Rem ID.'),
        markdown: MARKDOWN_SCHEMA.describe('Folder title/content requested by the user.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_folder'),
    },
    async ({ parentId, markdown }) =>
      bridgeToolResult(
        () => callPlugin('create_folder', { parentId: parentId ?? null, markdown }),
        'Create folder request processed.'
      )
  );

  registerTool(
    'append_to_rem',
    {
      title: 'Append to Rem',
      description: 'Use this when the user explicitly asks to append markdown as a child of an existing Rem.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target RemNote Rem ID.'),
        markdown: MARKDOWN_SCHEMA.describe('Markdown content to append under the target Rem.'),
        position: POSITION_SCHEMA.describe('Where to place the new child under the target Rem.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('append_to_rem'),
    },
    async ({ remId, markdown, position }) =>
      bridgeToolResult(
        () => callPlugin('append_to_rem', { remId, markdown, position }),
        'Append request processed.'
      )
  );

  registerTool(
    'update_rem',
    {
      title: 'Update Rem text',
      description: 'Use this when the user explicitly asks to replace the text of an existing Rem.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target RemNote Rem ID.'),
        markdown: MARKDOWN_SCHEMA.describe('Markdown content that replaces the target Rem text.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('update_rem'),
    },
    async ({ remId, markdown }) =>
      bridgeToolResult(() => callPlugin('update_rem', { remId, markdown }), 'Update request processed.')
  );

  registerTool(
    'replace_rem',
    {
      title: 'Replace Rem text',
      description:
        'Use this when the user explicitly asks to overwrite the visible text of an existing Rem. Children are not rewritten.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target RemNote Rem ID.'),
        markdown: MARKDOWN_SCHEMA.describe('Markdown content that replaces the target Rem text.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('replace_rem'),
    },
    async ({ remId, markdown }) =>
      bridgeToolResult(() => callPlugin('replace_rem', { remId, markdown }), 'Replace request processed.')
  );

  registerTool(
    'move_rem',
    {
      title: 'Move Rem',
      description: 'Use this when the user explicitly asks to move a Rem under another Rem at a specific index.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The Rem ID to move.'),
        newParentId: REM_ID_SCHEMA.describe('The new parent Rem ID.'),
        index: z.number().int().min(0).describe('Zero-based child index under the new parent.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('move_rem'),
    },
    async ({ remId, newParentId, index }) =>
      bridgeToolResult(() => callPlugin('move_rem', { remId, newParentId, index }), 'Move request processed.')
  );

  registerTool(
    'reorder_children',
    {
      title: 'Reorder Rem children',
      description:
        'Use this when the user explicitly asks to reorder all direct children under one parent Rem.',
      inputSchema: REORDER_CHILDREN_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('reorder_children'),
    },
    async ({ parentRemId, parentId, orderedChildRemIds, orderedChildIds }) =>
      bridgeToolResult(
        () =>
          callPlugin('reorder_children', {
            parentRemId: parentRemId ?? parentId ?? '',
            orderedChildRemIds: orderedChildRemIds ?? orderedChildIds ?? [],
          }),
        'Reorder children request processed.'
      )
  );

  registerTool(
    'delete_rem_by_id',
    {
      title: 'Delete Rem by ID safely',
      description:
        'Use this for deletion. Defaults to dryRun=true. Real delete requires dryRun=false plus matching expectedParentId or expectedAncestorId guard.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The exact Rem ID to inspect/delete.'),
        expectedParentId: REM_ID_SCHEMA.optional().describe('Guard: must match actual parent for real delete.'),
        expectedAncestorId: REM_ID_SCHEMA.optional().describe('Guard: must appear in breadcrumbs for real delete.'),
        confirmTitle: z.string().trim().max(1000).optional().describe('Optional guard: must match target plain text exactly when provided.'),
        dryRun: z.boolean().default(true).describe('Default true. Set false only after reviewing the dry-run target.'),
        idempotencyKey: z.string().trim().min(1).max(128).optional().describe('Returns the same delete result on retry in this plugin session.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('delete_rem_by_id'),
    },
    async ({ remId, expectedParentId, expectedAncestorId, confirmTitle, dryRun, idempotencyKey }) =>
      bridgeToolResult(
        () => callPlugin('delete_rem_by_id', { remId, expectedParentId, expectedAncestorId, confirmTitle, dryRun, idempotencyKey }),
        dryRun === false ? 'Delete Rem by ID request processed.' : 'Delete Rem by ID dry run processed.'
      )
  );

  // Legacy delete tools stay hidden unless local destructive exposure is explicitly enabled.
  if (options.exposeDeleteTool) {
    registerTool(
      'delete_focused_rem',
      {
        title: 'Delete focused Rem',
        description:
          'Legacy/private. Prefer delete_rem_by_id; focus-based delete can target the wrong Rem.',
        inputSchema: z.object({
          recursive: z.boolean().default(false).describe('Whether to delete descendants too. Defaults to false.'),
          confirmText: DELETE_CONFIRM_SCHEMA.describe('Required literal confirmation text.'),
        }),
        outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
        annotations: annotationsFor('delete_focused_rem'),
      },
      async ({ recursive, confirmText }) =>
        bridgeToolResult(
          () => callPlugin('delete_focused_rem', { recursive, confirmText }),
          'Delete focused Rem request processed.'
        )
    );

    registerTool(
      'delete_selected_rem',
      {
        title: 'Delete selected Rem',
        description:
          'Legacy/private. Prefer delete_rem_by_id; selection-based delete can target the wrong Rem.',
        inputSchema: z.object({
          recursive: z.boolean().default(false).describe('Whether to delete descendants too. Defaults to false.'),
          confirmText: DELETE_CONFIRM_SCHEMA.describe('Required literal confirmation text.'),
        }),
        outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
        annotations: annotationsFor('delete_selected_rem'),
      },
      async ({ recursive, confirmText }) =>
        bridgeToolResult(
          () => callPlugin('delete_selected_rem', { recursive, confirmText }),
          'Delete selected Rem request processed.'
        )
    );

    registerTool(
      'delete_rem',
      {
        title: 'Delete Rem',
        description: 'Use this only in local development when destructive tool exposure is explicitly enabled.',
        inputSchema: z.object({
          remId: REM_ID_SCHEMA.describe('The Rem ID to delete.'),
          recursive: z.boolean().default(false).describe('Whether to delete descendants too. Defaults to false.'),
          confirmText: DELETE_CONFIRM_SCHEMA.describe('Required literal confirmation text.'),
        }),
        outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
        annotations: annotationsFor('delete_rem'),
      },
      async ({ remId, recursive, confirmText }) =>
        bridgeToolResult(
          () => callPlugin('delete_rem', { remId, recursive, confirmText }),
          'Delete request processed.'
        )
    );
  }

  registerTool(
    'create_rem_tree',
    {
      title: 'Create Rem tree',
      description: 'Use this when the user explicitly asks to create a nested Rem tree from structured JSON.',
      inputSchema: z.object({
        parentId: REM_ID_SCHEMA.describe('The parent Rem ID for the created tree root.'),
        position: POSITION_SCHEMA.describe('Where to place the tree root under the parent Rem.'),
        tree: REM_TREE_NODE_SCHEMA.describe('Structured Rem tree to create.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_rem_tree'),
    },
    async ({ parentId, position, tree }) =>
      bridgeToolResult(
        () => callPlugin('create_rem_tree', { parentId, position, tree }),
        'Create Rem tree request processed.'
      )
  );

  registerTool(
    'update_rem_rich',
    {
      title: 'Update Rem rich text',
      description: 'Use this when you need to replace a Rem with structured rich text spans or math nodes.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target Rem ID.'),
        richText: z.array(RICH_TEXT_SPAN_SCHEMA).min(1).max(200).describe('Ordered RemNote rich text spans.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('update_rem_rich'),
    },
    async ({ remId, richText }) =>
      bridgeToolResult(() => callPlugin('update_rem_rich', { remId, richText }), 'Updated Rem rich text.')
  );

  registerTool(
    'set_rem_heading_level',
    {
      title: 'Set Rem heading level',
      description: 'Use this when a Rem should become H1, H2, H3, or normal text.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target Rem ID.'),
        level: HEADING_LEVEL_SCHEMA.describe('Heading level to apply.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('set_rem_heading_level'),
    },
    async ({ remId, level }) =>
      bridgeToolResult(() => callPlugin('set_rem_heading_level', { remId, level }), 'Set Rem heading level.')
  );

  registerTool(
    'set_rem_text_color',
    {
      title: 'Set whole Rem text color',
      description: 'Use this when all text in one Rem should be colored.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target Rem ID.'),
        color: COLOR_SCHEMA.describe('Color to apply.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('set_rem_text_color'),
    },
    async ({ remId, color }) =>
      bridgeToolResult(() => callPlugin('set_rem_text_color', { remId, color }), 'Set Rem text color.')
  );

  registerTool(
    'set_rem_highlight_color',
    {
      title: 'Set Rem highlight color',
      description: 'Use this when an entire Rem should receive a RemNote highlight color.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target Rem ID.'),
        color: COLOR_SCHEMA.describe('Highlight color to apply.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('set_rem_highlight_color'),
    },
    async ({ remId, color }) =>
      bridgeToolResult(() => callPlugin('set_rem_highlight_color', { remId, color }), 'Set Rem highlight color.')
  );

  registerTool(
    'set_text_span_color',
    {
      title: 'Set partial text color',
      description: 'Use this when one word or character range inside a Rem should be colored.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target Rem ID.'),
        ...SPAN_RANGE_INPUT_SCHEMA,
        color: COLOR_SCHEMA.describe('Color to apply to this text range.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('set_text_span_color'),
    },
    async ({ remId, range, start, end, text, occurrence, verifyAfterWrite, color }) =>
      bridgeToolResult(() => callPlugin('set_text_span_color', { remId, range, start, end, text, occurrence, verifyAfterWrite, color }), 'Set text span color.')
  );

  registerTool(
    'set_text_span_highlight',
    {
      title: 'Set partial text highlight',
      description: 'Use this when one word or character range inside a Rem should be highlighted.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target Rem ID.'),
        ...SPAN_RANGE_INPUT_SCHEMA,
        color: COLOR_SCHEMA.describe('Highlight color to apply to this text range.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('set_text_span_highlight'),
    },
    async ({ remId, range, start, end, text, occurrence, verifyAfterWrite, color }) =>
      bridgeToolResult(
        () => callPlugin('set_text_span_highlight', { remId, range, start, end, text, occurrence, verifyAfterWrite, color }),
        'Set text span highlight.'
      )
  );

  registerTool(
    'set_rem_type',
    {
      title: 'Set Rem type',
      description: 'Use this when a Rem should become normal, concept, or descriptor.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target Rem ID.'),
        type: REM_TYPE_SCHEMA.describe('Rem type to apply.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('set_rem_type'),
    },
    async ({ remId, type }) =>
      bridgeToolResult(() => callPlugin('set_rem_type', { remId, type }), 'Set Rem type.')
  );

  registerTool(
    'set_hide_bullet',
    {
      title: 'Set bullet visibility',
      description: 'Use this when a Rem bullet should be hidden or restored through SDK list-item state.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target Rem ID.'),
        hideBullet: z.boolean().describe('True hides the bullet, false restores list-item bullet behavior.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('set_hide_bullet'),
    },
    async ({ remId, hideBullet }) =>
      bridgeToolResult(() => callPlugin('set_hide_bullet', { remId, hideBullet }), 'Set bullet visibility.')
  );

  registerTool(
    'clear_rem_formatting',
    {
      title: 'Clear Rem formatting',
      description: 'Use this when a Rem should return to plain text and normal heading/type.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target Rem ID.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('clear_rem_formatting'),
    },
    async ({ remId }) =>
      bridgeToolResult(() => callPlugin('clear_rem_formatting', { remId }), 'Cleared Rem formatting.')
  );

  registerTool(
    'create_styled_rem_tree',
    {
      title: 'Create styled Rem tree',
      description:
        'Use this when one call should create a real nested RemNote tree with rich spans, headings, math, colors, and flashcards.',
      inputSchema: z.object({
        parentId: REM_ID_SCHEMA.describe('The parent Rem ID for the created tree root.'),
        position: POSITION_SCHEMA.describe('Where to place the tree root under the parent Rem.'),
        tree: STYLED_REM_TREE_NODE_SCHEMA.describe('Structured styled Rem tree.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_styled_rem_tree'),
    },
    async ({ parentId, position, tree }) =>
      bridgeToolResult(
        () => callPlugin('create_styled_rem_tree', { parentId, position, tree }),
        'Create styled Rem tree request processed.'
      )
  );

  registerTool(
    'apply_remnote_command',
    {
      title: 'Apply RemNote command',
      description:
        'Use this when one safe shortcut-like RemNote command should apply to a focused, selected, or explicit Rem without keyboard simulation.',
      inputSchema: z.object({
        target: REMNOTE_COMMAND_TARGET_SCHEMA.describe('Focused Rem, selected Rem, or explicit Rem ID target.'),
        command: REMNOTE_COMMAND_SCHEMA.describe('Safe RemNote command to apply.'),
        args: z
          .object({
            latex: z.string().max(5000).optional().describe('LaTeX for insert_inline_math or insert_math_block.'),
            text: z.string().max(5000).optional().describe('Optional prefix text for math insertion.'),
          })
          .optional(),
        idempotencyKey: z.string().trim().min(1).max(128).optional().describe('Prevents duplicate command application for repeated calls in this plugin session.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('apply_remnote_command'),
    },
    async ({ target, command, args, idempotencyKey }) =>
      bridgeToolResult(
        () => callPlugin('apply_remnote_command', { target, command, args, idempotencyKey }),
        'Applied RemNote command.'
      )
  );

  registerTool(
    'apply_structured_note_batch',
    {
      title: 'Apply structured note batch',
      description:
        'Use this when one approved call should create a complete styled RemNote note tree with math, dry-run, idempotency, rollback, and optional verification.',
      inputSchema: z.object({
        target: STRUCTURED_NOTE_TARGET_SCHEMA.optional().describe('Preferred target object. Use focused_rem + create_child_tree for normal note writing.'),
        operation: STRUCTURED_NOTE_OPERATION_SCHEMA.describe('Batch operation. create_child_tree is safest for new notes.'),
        parentId: REM_ID_SCHEMA.optional().describe('Legacy parent Rem ID for create_child_tree.'),
        position: POSITION_SCHEMA.describe('Where to place the batch root under the parent Rem.'),
        root: STYLED_REM_TREE_NODE_SCHEMA.optional().describe('Legacy structured styled note root and descendants.'),
        note: STRUCTURED_NOTE_SCHEMA.optional().describe('Production note payload with root plus ordered children.'),
        dryRun: z.boolean().default(false).describe('Validate and preview the batch without writing Rems.'),
        idempotencyKey: z.string().trim().min(1).max(128).optional().describe('Prevents duplicate writes for repeated calls in this server session.'),
        rollbackOnFailure: z.boolean().default(true).describe('Best-effort remove Rems created before a failed batch.'),
        verifyAfterWrite: z.boolean().default(false).describe('Read created Rem IDs after write and report missing IDs.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('apply_structured_note_batch'),
    },
    async ({ target, operation, parentId, position, root, note, dryRun, idempotencyKey, rollbackOnFailure, verifyAfterWrite }) =>
      bridgeToolResult(
        () =>
          callPlugin('apply_structured_note_batch', {
            target,
            operation,
            parentId,
            position,
            root,
            note,
            dryRun,
            idempotencyKey,
            rollbackOnFailure,
            verifyAfterWrite,
          }),
        'Structured note batch request processed.'
      )
  );

  registerTool(
    'create_polished_note_tree',
    {
      title: 'Create polished note tree',
      description:
        'Use this when one call should create a polished RemNote note tree, apply optional style operations, and verify after write.',
      inputSchema: z.object({
        parentId: REM_ID_SCHEMA.describe('Parent Rem ID for the created polished tree.'),
        tree: STYLED_REM_TREE_NODE_SCHEMA.describe('Structured styled Rem tree.'),
        stylingPlan: STYLING_PLAN_SCHEMA.optional().describe('Optional post-create style operations with explicit Rem IDs.'),
        verifyAfterWrite: z.boolean().default(false).describe('Read created Rem IDs after write and report missing IDs.'),
        idempotencyKey: z.string().trim().min(1).max(128).optional().describe('Prevents duplicate note trees for repeated calls in this plugin session.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_polished_note_tree'),
    },
    async ({ parentId, tree, stylingPlan, verifyAfterWrite, idempotencyKey }) =>
      bridgeToolResult(
        () => callPlugin('create_polished_note_tree', { parentId, tree, stylingPlan, verifyAfterWrite, idempotencyKey }),
        'Create polished note tree request processed.'
      )
  );

  registerTool(
    'apply_style_plan',
    {
      title: 'Apply style plan',
      description:
        'Use this when existing Rems need multiple safe style operations with per-operation status.',
      inputSchema: z.object({
        operations: z.array(STYLE_PLAN_OPERATION_SCHEMA).min(1).max(100).describe('Ordered style operations.'),
        continueOnError: z.boolean().default(true).describe('True returns per-operation failures and keeps going.'),
        verifyAfterWrite: z.boolean().default(false).describe('Return verification evidence when available.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('apply_style_plan'),
    },
    async ({ operations, continueOnError, verifyAfterWrite }) =>
      bridgeToolResult(
        () => callPlugin('apply_style_plan', { operations, continueOnError, verifyAfterWrite }),
        'Apply style plan request processed.'
      )
  );

  registerTool(
    'verify_note_design',
    {
      title: 'Verify note design',
      description:
        'Use this after note creation/styling to compare headings, whole-Rem highlight, colored spans, and child order against an expected style map.',
      inputSchema: z.object({
        rootRemId: REM_ID_SCHEMA.describe('Root Rem ID for the design verification.'),
        expectedStyleMap: z.record(REM_ID_SCHEMA, EXPECTED_STYLE_MAP_ENTRY_SCHEMA).describe('Expected styles keyed by Rem ID.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('verify_note_design'),
    },
    async ({ rootRemId, expectedStyleMap }) =>
      bridgeToolResult(
        () => callPlugin('verify_note_design', { rootRemId, expectedStyleMap }),
        'Verify note design request processed.'
      )
  );

  const FLASHCARD_INPUT_SCHEMA = z.object({
    parentId: REM_ID_SCHEMA.describe('The parent Rem ID for the card Rem.'),
    front: z.string().trim().min(1).max(5000).describe('Card front text.'),
    back: z.string().trim().min(1).max(5000).describe('Card back text.'),
    direction: PRACTICE_DIRECTION_SCHEMA.describe('Practice direction.'),
  });

  registerTool(
    'create_basic_flashcard',
    {
      title: 'Create basic flashcard',
      description: 'Use this when the user wants an explicit RemNote flashcard with front/back text.',
      inputSchema: FLASHCARD_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_basic_flashcard'),
    },
    async ({ parentId, front, back, direction }) =>
      bridgeToolResult(
        () => callPlugin('create_basic_flashcard', { parentId, front, back, direction }),
        'Created basic flashcard.'
      )
  );

  registerTool(
    'create_concept_card',
    {
      title: 'Create concept card',
      description: 'Use this when the user wants an explicit RemNote concept card.',
      inputSchema: FLASHCARD_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_concept_card'),
    },
    async ({ parentId, front, back, direction }) =>
      bridgeToolResult(
        () => callPlugin('create_concept_card', { parentId, front, back, direction }),
        'Created concept card.'
      )
  );

  registerTool(
    'create_descriptor_card',
    {
      title: 'Create descriptor card',
      description: 'Use this when the user wants an explicit RemNote descriptor card.',
      inputSchema: FLASHCARD_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_descriptor_card'),
    },
    async ({ parentId, front, back, direction }) =>
      bridgeToolResult(
        () => callPlugin('create_descriptor_card', { parentId, front, back, direction }),
        'Created descriptor card.'
      )
  );

  registerTool(
    'create_cloze_card',
    {
      title: 'Create cloze card',
      description: 'Use this when the user wants a cloze card without fragile raw syntax parsing.',
      inputSchema: z.object({
        parentId: REM_ID_SCHEMA.describe('The parent Rem ID for the card Rem.'),
        text: z.string().trim().min(1).max(5000).describe('Full cloze text.'),
        clozeText: z.string().trim().max(1000).optional().describe('Optional exact text range to cloze.'),
        direction: PRACTICE_DIRECTION_SCHEMA.describe('Practice direction.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_cloze_card'),
    },
    async ({ parentId, text, clozeText, direction }) =>
      bridgeToolResult(
        () => callPlugin('create_cloze_card', { parentId, text, clozeText, direction }),
        'Created cloze card.'
      )
  );

  registerTool(
    'create_multiple_choice_card',
    {
      title: 'Create multiple choice card',
      description:
        'Use this when the user wants a multiple-choice RemNote card represented with explicit answer and choice items.',
      inputSchema: z.object({
        parentId: REM_ID_SCHEMA.describe('The parent Rem ID for the card Rem.'),
        question: z.string().trim().min(1).max(5000).describe('Question prompt.'),
        choices: z.array(z.string().trim().min(1).max(1000)).min(2).max(20).describe('Available choices.'),
        correctChoice: z.string().trim().min(1).max(1000).describe('Correct choice text.'),
        direction: PRACTICE_DIRECTION_SCHEMA.describe('Practice direction.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_multiple_choice_card'),
    },
    async ({ parentId, question, choices, correctChoice, direction }) =>
      bridgeToolResult(
        () => callPlugin('create_multiple_choice_card', { parentId, question, choices, correctChoice, direction }),
        'Created multiple-choice card.'
      )
  );

  registerTool(
    'create_list_answer_card',
    {
      title: 'Create list answer card',
      description: 'Use this when the user wants a RemNote list-answer card with explicit ordered items.',
      inputSchema: z.object({
        parentId: REM_ID_SCHEMA.describe('The parent Rem ID for the card Rem.'),
        prompt: z.string().trim().min(1).max(5000).describe('Card prompt.'),
        items: z.array(z.string().trim().min(1).max(1000)).min(1).max(50).describe('Expected list items.'),
        direction: PRACTICE_DIRECTION_SCHEMA.describe('Practice direction.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_list_answer_card'),
    },
    async ({ parentId, prompt, items, direction }) =>
      bridgeToolResult(
        () => callPlugin('create_list_answer_card', { parentId, prompt, items, direction }),
        'Created list-answer card.'
      )
  );

  assertRegisteredToolsMatchRegistry(Boolean(options.exposeDeleteTool), registeredToolNames);
  return server;
}
