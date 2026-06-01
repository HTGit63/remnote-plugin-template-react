import {
  STATIC_SDK_UNSUPPORTED_TOOLS,
  getPublicMcpToolNames,
  getToolRegistrySummary,
} from './tool-registry.js';
import {
  ADVANCED_NOTES_TIER_TOOLS,
  CORE_TIER_TOOLS,
  DEVELOPER_DIAGNOSTICS_TIER_TOOLS,
  TOOL_METADATA,
  getToolMetadata,
  normalizeToolProfile,
  type ToolProfile,
} from './tool-policy.js';
import {
  EXPECTED_STYLE_EXPECTATION_SCHEMA,
  REORDER_CHILDREN_INPUT_SCHEMA,
  STYLED_REM_TREE_NODE_SCHEMA,
  STYLE_PLAN_OPERATION_SCHEMA,
} from './tools/schemas.js';

const mode = process.argv[2] ?? 'all';
const removedDeleteTools = [
  ['delete', 'rem'].join('_'),
  ['delete', 'focused', 'rem'].join('_'),
  ['delete', 'selected', 'rem'].join('_'),
];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertNoRemovedTools(tools: readonly string[], label: string) {
  for (const tool of removedDeleteTools) {
    assert(!tools.includes(tool), `${label} still includes removed legacy tool ${tool}.`);
  }
}

function toolSet(profile: ToolProfile): Set<string> {
  return new Set(getPublicMcpToolNames(false, profile));
}

function checkCore() {
  const tools = getPublicMcpToolNames(false, 'core');
  assert(JSON.stringify(tools) === JSON.stringify([...CORE_TIER_TOOLS]), 'core tier must match Area 1 core list.');
  assertNoRemovedTools(tools, 'core tier');
  assert(!tools.includes('create_folder'), 'core tier must not expose unsupported create_folder.');
  assert(normalizeToolProfile('simple') === 'core', 'simple alias must normalize to core.');
  assert(normalizeToolProfile('full') === 'full', 'full alias must remain full.');
}

function checkAdvanced() {
  const tools = toolSet('advanced_notes');
  for (const tool of [...CORE_TIER_TOOLS, ...ADVANCED_NOTES_TIER_TOOLS]) {
    assert(tools.has(tool), `advanced_notes tier missing ${tool}.`);
  }
  for (const tool of DEVELOPER_DIAGNOSTICS_TIER_TOOLS) {
    assert(!tools.has(tool), `advanced_notes tier should not include diagnostics tool ${tool}.`);
  }
  assertNoRemovedTools([...tools], 'advanced_notes tier');
}

function checkDiagnostics() {
  const tools = toolSet('developer_diagnostics');
  for (const tool of [...CORE_TIER_TOOLS, ...DEVELOPER_DIAGNOSTICS_TIER_TOOLS]) {
    assert(tools.has(tool), `developer_diagnostics tier missing ${tool}.`);
  }
  for (const tool of ADVANCED_NOTES_TIER_TOOLS) {
    assert(!tools.has(tool), `developer_diagnostics tier should not include advanced write tool ${tool}.`);
  }
}

function checkFullAndMetadata() {
  const tools = getPublicMcpToolNames(false, 'full');
  assertNoRemovedTools(tools, 'full tier');
  assert(!tools.includes('create_folder'), 'full tier must not expose unsupported create_folder.');
  for (const tool of tools) {
    const metadata = getToolMetadata(tool);
    assert(metadata.name === tool, `metadata missing for ${tool}.`);
    assert(typeof metadata.requiresWrite === 'boolean', `metadata requiresWrite missing for ${tool}.`);
    assert(typeof metadata.supportsDryRun === 'boolean', `metadata supportsDryRun missing for ${tool}.`);
    assert(typeof metadata.runtimeVerified === 'boolean', `metadata runtimeVerified missing for ${tool}.`);
  }
  assert(
    TOOL_METADATA.some((tool) => tool.name === 'create_folder' && tool.exposedNormally === false && tool.sdkSupported === false),
    'create_folder must be metadata-only unsupported.'
  );
  assert(STATIC_SDK_UNSUPPORTED_TOOLS.includes('create_folder'), 'static SDK unsupported list must retain create_folder.');
}

function checkSchemas() {
  assert(STYLE_PLAN_OPERATION_SCHEMA.safeParse({ remId: 'r1', type: 'heading', headingLevel: 'H2' }).success, 'heading style op schema should use headingLevel.');
  assert(STYLE_PLAN_OPERATION_SCHEMA.safeParse({ remId: 'r1', type: 'text_color_span', text: 'Bridge', color: 'Blue' }).success, 'text color style op schema should use color.');
  assert(STYLE_PLAN_OPERATION_SCHEMA.safeParse({ remId: 'r1', type: 'whole_rem_highlight', highlightColor: 'Yellow' }).success, 'highlight style op schema should use highlightColor.');
  assert(STYLED_REM_TREE_NODE_SCHEMA.safeParse({ clientNodeId: 'n1', text: 'Root', children: [{ clientNodeId: 'n2', text: 'Child' }] }).success, 'styled tree schema should accept clientNodeId.');
  assert(REORDER_CHILDREN_INPUT_SCHEMA.safeParse({ parentRemId: 'p1', orderedChildRemIds: ['c1'], dryRun: true, idempotencyKey: 'k1' }).success, 'reorder schema should accept dryRun/idempotency.');
  assert(EXPECTED_STYLE_EXPECTATION_SCHEMA.safeParse({ remId: 'r1', expected: { headingLevel: 'H1' } }).success, 'verify schema should accept explicit expectations.');
}

function checkHostedDiagnostics() {
  const summary = getToolRegistrySummary(false, 'full', undefined, {
    discoveryAuthMode: 'no_auth_required',
    toolCallAuthMode: 'hosted_oauth_required',
  });
  assert(summary.toolCallAuthMode === 'hosted_oauth_required', 'hosted registry summary must report hosted OAuth tool auth.');
  assert(summary.activeToolTier === 'full', 'hosted registry summary must include active tier.');
  assert(summary.legacyDeleteToolsRemoved === true, 'registry must flag legacy delete removal.');
  assert(summary.staticSdkUnsupportedTools.includes('create_folder'), 'hosted diagnostics must expose unsupported static tools.');
}

function checkTierSwitching() {
  const tiers: ToolProfile[] = ['core', 'advanced_notes', 'developer_diagnostics', 'full'];
  const counts = tiers.map((tier) => getPublicMcpToolNames(false, tier).length);
  assert(counts[0] < counts[1], 'advanced_notes should expose more tools than core.');
  assert(counts[0] < counts[2], 'developer_diagnostics should expose more tools than core.');
  assert(counts[3] > counts[1] && counts[3] > counts[2], 'full should expose the largest tool set.');
}

function checkIdempotency() {
  for (const tool of [
    'create_rem',
    'create_document',
    'append_to_rem',
    'update_rem',
    'move_rem',
    'reorder_children',
    'replace_rem',
    'create_rem_tree',
    'create_styled_rem_tree',
    'create_polished_note_tree',
    'apply_structured_note_batch',
    'apply_style_plan',
    'apply_remnote_command',
    'create_basic_flashcard',
    'create_cloze_card',
    'create_multiple_choice_card',
    'create_list_answer_card',
    'delete_rem_by_id',
  ]) {
    const metadata = getToolMetadata(tool);
    assert(metadata.supportsIdempotency, `${tool} must advertise idempotency.`);
  }
  for (const tool of ['delete_rem_by_id', 'apply_structured_note_batch', 'create_polished_note_tree', 'apply_style_plan', 'reorder_children']) {
    const metadata = getToolMetadata(tool);
    assert(metadata.supportsDryRun, `${tool} must advertise dry-run support.`);
  }
}

function checkPerformance() {
  const first = getPublicMcpToolNames(false, 'full');
  const second = getPublicMcpToolNames(false, 'full');
  assert(JSON.stringify(first) === JSON.stringify(second), 'cached public tool list must be stable.');
  const summary = getToolRegistrySummary(false, 'full');
  assert(summary.registryCache.enabled, 'registry summary must advertise cache dimensions.');
  assert(summary.registryCache.dimensions.includes('activeTier'), 'registry cache dimensions must include active tier.');
}

const checks: Record<string, () => void> = {
  all: () => {
    checkCore();
    checkAdvanced();
    checkDiagnostics();
    checkFullAndMetadata();
    checkSchemas();
    checkHostedDiagnostics();
    checkTierSwitching();
    checkIdempotency();
    checkPerformance();
  },
  core: checkCore,
  advanced: checkAdvanced,
  diagnostics: checkDiagnostics,
  schemas: checkSchemas,
  hosted: checkHostedDiagnostics,
  switching: checkTierSwitching,
  idempotency: checkIdempotency,
  performance: checkPerformance,
};

const check = checks[mode];
assert(check, `Unknown Area 1 smoke mode: ${mode}`);
check();
console.log(`Area 1 ${mode} smoke passed.`);
