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
  CREATE_OR_REPLACE_NOTE_FROM_MARKDOWN_INPUT_SCHEMA,
  EXPECTED_STYLE_EXPECTATION_SCHEMA,
  REM_STYLE_SCHEMA,
  REORDER_CHILDREN_INPUT_SCHEMA,
  STYLED_REM_TREE_NODE_SCHEMA,
  STYLE_PLAN_OPERATION_SCHEMA,
  TREE_DEPTH_SCHEMA,
  MAX_TREE_NODE_COUNT_SCHEMA,
} from './tools/schemas.js';
import {
  markdownImportOutputTextFromTree,
  normalizeMarkdownImportArgs,
  parseMarkdownImportPlan,
  verifyMarkdownSourceFidelity,
} from '../../shared/bridge/markdown-importer.js';
import type { CreateOrReplaceNoteFromMarkdownArgs } from '../../shared/bridge/protocol.js';

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
  assert(REM_STYLE_SCHEMA.safeParse({ headingLevel: 'H1', textColor: 'blue', highlightColor: 'yellow', remType: 'concept' }).success, 'canonical style schema should accept textColor/highlightColor/remType.');
  assert(REM_STYLE_SCHEMA.safeParse({ headingLevel: 'H3', color: 'blue', highlight: 'yellow', type: 'descriptor' }).success, 'style schema should accept legacy aliases for internal normalization.');
  assert(CREATE_OR_REPLACE_NOTE_FROM_MARKDOWN_INPUT_SCHEMA.safeParse(markdownImportArgs(true)).success, 'markdown importer schema should accept required bulk note shape.');
  assert(TREE_DEPTH_SCHEMA.parse(undefined) === 8, 'tree maxDepth default should be 8.');
  assert(MAX_TREE_NODE_COUNT_SCHEMA.parse(undefined) === 200, 'tree maxNodeCount default should be 200.');
}

function markdownSample(): string {
  return [
    '# 5.9 - Coulomb Barrier and Temperature Estimate for Fusion',
    '',
    '### Physical Basis',
    '',
    'This chunk explains why fusion is difficult even when it releases energy.',
    '',
    '### Coulomb Repulsion as the Main Barrier',
    '',
    'Two positively charged nuclei repel each other before the strong nuclear force can act.',
    '',
    '$$',
    'E = \\frac{k q_1 q_2}{r}',
    '$$',
    '',
    '### Temperature Estimate',
    '',
    'Inline math $kT \\approx E$ stays in the paragraph.',
    '',
    '- preserve first bullet',
    '  - preserve nested bullet',
    '- preserve second bullet',
    '',
    '### Formula Heavy Section',
    '',
    'The source includes formulas, paragraphs, and code without compression.',
    '',
    '```ts',
    'const estimate = "T = E / k";',
    '```',
  ].join('\n');
}

function markdownImportArgs(dryRun: boolean): CreateOrReplaceNoteFromMarkdownArgs {
  return {
    parentRemId: 'parent-1',
    markdownText: markdownSample(),
    mode: 'create_child',
    duplicatePolicy: 'create_new',
    safetyOptions: {
      dryRun,
      verifyAfterWrite: true,
      rollbackOnFailure: true,
      idempotencyKey: 'area1-markdown',
    },
    limits: {
      maxMarkdownChars: 120000,
      maxDepth: 8,
      maxNodes: 200,
    },
  };
}

function checkMarkdownImporter() {
  const plan = parseMarkdownImportPlan(markdownSample());
  assert(plan.tree.text === '5.9 - Coulomb Barrier and Temperature Estimate for Fusion', 'markdown importer should use first H1 as root.');
  assert(plan.stats.headingCount >= 5, 'markdown importer should preserve root plus H3 headings.');
  assert(plan.stats.mathBlockCount >= 1, 'markdown importer should preserve block math.');
  assert(plan.stats.inlineMathCount >= 0, 'markdown importer stats should include inline math field.');
  assert(plan.stats.codeBlockCount === 1, 'markdown importer should preserve code blocks as text Rems.');
  assert(plan.stats.bulletCount >= 3, 'markdown importer should preserve nested bullet list nodes.');
  const output = markdownImportOutputTextFromTree(plan.tree);
  for (const forbidden of ['Size', 'H1', 'H2', 'H3']) {
    assert(!output.split('\n').some((line) => line.trim() === forbidden), `markdown importer created style-control Rem ${forbidden}.`);
  }
  const fidelity = verifyMarkdownSourceFidelity(plan.sourceSnippets, output, {}, plan.stats);
  assert(fidelity.passed, `markdown importer fidelity failed: ${JSON.stringify(fidelity.missingTextSnippets)}`);
  assert(fidelity.headingCount === plan.stats.headingCount, 'fidelity report should include heading count.');
  assert(fidelity.tableCount === plan.stats.tableCount, 'fidelity report should include table count.');
  let rejectedBadMode = false;
  try {
    normalizeMarkdownImportArgs({ ...markdownImportArgs(true), mode: 'bad_mode' as never });
  } catch {
    rejectedBadMode = true;
  }
  assert(rejectedBadMode, 'markdown importer should reject unknown import modes before execution.');
}

function checkSourceFidelity() {
  const plan = parseMarkdownImportPlan(markdownSample());
  const brokenOutput = markdownImportOutputTextFromTree(plan.tree).replace('Two positively charged nuclei repel each other', '');
  const fidelity = verifyMarkdownSourceFidelity(plan.sourceSnippets, brokenOutput, {}, plan.stats);
  assert(!fidelity.passed, 'source fidelity should fail when a source paragraph is removed.');
  assert(
    fidelity.missingTextSnippets.some((snippet) => snippet.includes('Two positively charged nuclei')),
    'source fidelity should report missing source paragraph snippet.'
  );
  const polluted = verifyMarkdownSourceFidelity(plan.sourceSnippets, `${markdownImportOutputTextFromTree(plan.tree)}\nH1\nSize`, {}, plan.stats);
  assert(!polluted.passed, 'source fidelity should fail when style pollution Rems appear.');
  assert(polluted.pollutionRems.includes('H1') && polluted.pollutionRems.includes('Size'), 'source fidelity should report pollution Rems.');
}

function fiveLevelTree(depth = 5): Record<string, unknown> {
  let node: Record<string, unknown> = {
    text: `Level ${depth}`,
    style: { headingLevel: depth === 1 ? 'H1' : 'H3' },
  };
  for (let level = depth - 1; level >= 1; level -= 1) {
    node = {
      text: `Level ${level}`,
      style: { headingLevel: level === 1 ? 'H1' : 'H3' },
      children: [node],
    };
  }
  return node;
}

function checkStructuredDepth() {
  assert(STYLED_REM_TREE_NODE_SCHEMA.safeParse(fiveLevelTree(5)).success, '5-level study-note tree should pass schema.');
  const plan = parseMarkdownImportPlan(markdownSample(), { limits: { maxDepth: 8, maxNodes: 200 } });
  assert(plan.stats.maxDepth <= 8, 'markdown importer should accept realistic study-note depth.');
  const deep = fiveLevelTree(13);
  assert(STYLED_REM_TREE_NODE_SCHEMA.safeParse(deep).success, 'schema permits recursive tree; runtime hard depth rejects later.');
  const tooDeepMarkdown = Array.from({ length: 13 }, (_, index) => `${'#'.repeat(Math.min(index + 1, 4))} Deep ${index + 1}`).join('\n');
  let failed = false;
  try {
    parseMarkdownImportPlan(tooDeepMarkdown, { limits: { maxDepth: 2, maxNodes: 200 } });
  } catch {
    failed = true;
  }
  assert(failed, 'unsafe markdown depth should fail safely.');
}

function checkStyleSchema() {
  checkSchemas();
  const plan = parseMarkdownImportPlan(markdownSample());
  const output = markdownImportOutputTextFromTree(plan.tree);
  assert(!/\n(Size|H1|H2|H3)\n/.test(`\n${output}\n`), 'style schema/importer must not produce style-control Rems.');
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
  'tool-profile': checkFullAndMetadata,
  'structured-depth': checkStructuredDepth,
  'style-schema': checkStyleSchema,
  'markdown-importer': checkMarkdownImporter,
  'source-fidelity': checkSourceFidelity,
  hosted: checkHostedDiagnostics,
  switching: checkTierSwitching,
  idempotency: checkIdempotency,
  performance: checkPerformance,
};

const check = checks[mode];
assert(check, `Unknown Area 1 smoke mode: ${mode}`);
check();
console.log(`Area 1 ${mode} smoke passed.`);
