import {
  STATIC_SDK_UNSUPPORTED_TOOLS,
  getPublicMcpToolNames,
  getToolRegistrySummary,
} from './tool-registry.js';
import {
  BASIC_TIER_TOOLS,
  MASS_NOTE_WRITER_TIER_TOOLS,
  NOTE_WRITER_TIER_TOOLS,
  POWER_USER_TIER_TOOLS,
  DEVELOPER_TIER_TOOLS,
  TOOL_METADATA,
  getToolMetadata,
  normalizeToolProfile,
  type ToolProfile,
} from './tool-policy.js';
import {
  CREATE_OR_REPLACE_NOTE_FROM_MARKDOWN_INPUT_SCHEMA,
  PREVIEW_MARKDOWN_NOTE_TREE_INPUT_SCHEMA,
  CREATE_NOTE_FROM_MARKDOWN_TREE_INPUT_SCHEMA,
  APPEND_MARKDOWN_AS_REM_TREE_INPUT_SCHEMA,
  DESIGN_TEMPLATE_RULES_SCHEMA,
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
  splitTextFormulaSafe,
  validateMarkdownMathDelimiters,
  verifyMarkdownSourceFidelity,
} from '../../shared/bridge/markdown-importer.js';
import {
  applyStylePresetToTree,
  NUCLEAR_PHYSICS_SPACER_TEXT,
  NUCLEAR_PHYSICS_STYLE_PRESET,
  type CreateOrReplaceNoteFromMarkdownArgs,
} from '../../shared/bridge/protocol.js';
import {
  DEFAULT_WRITE_PERFORMANCE_BUDGET_MS,
  buildWritePerformanceReport,
} from '../../shared/bridge/performance.js';
import {
  getLastTrustedWriteDecision,
  validateMcpToolPermission,
} from './tool-permissions.js';
import type { AuthenticatedPrincipal } from './auth/types.js';

const mode = process.argv[2] ?? 'all';
const removedDeleteTools = [
  ['delete', 'rem'].join('_'),
  ['delete', 'focused', 'rem'].join('_'),
  ['delete', 'selected', 'rem'].join('_'),
];
const goal9ToolCategories = new Set([
  'system',
  'read',
  'simple_write',
  'markdown_note',
  'structured_note',
  'design_template',
  'study_card',
  'table',
  'repair',
  'debug',
  'danger',
]);

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
  const tools = getPublicMcpToolNames(false, 'basic');
  assert(JSON.stringify(tools) === JSON.stringify([...BASIC_TIER_TOOLS]), 'basic tier must match Area 1 basic list.');
  assertNoRemovedTools(tools, 'basic tier');
  assert(!tools.includes('create_folder'), 'basic tier must not expose unsupported create_folder.');
  assert(normalizeToolProfile('simple') === 'basic', 'simple alias must normalize to basic.');
  assert(normalizeToolProfile('core') === 'basic', 'core alias must normalize to basic.');
  assert(normalizeToolProfile('advanced_notes') === 'mass_note_writer', 'advanced_notes alias must normalize to mass_note_writer.');
  assert(normalizeToolProfile('mass_notes') === 'mass_note_writer', 'mass_notes alias must normalize to mass_note_writer.');
  assert(normalizeToolProfile('full') === 'danger', 'full alias must normalize to danger.');
}

function checkMassNoteWriter() {
  const tools = getPublicMcpToolNames(false, 'mass_note_writer');
  assert(JSON.stringify(tools) === JSON.stringify([...MASS_NOTE_WRITER_TIER_TOOLS]), 'mass_note_writer tier must match safe mass note list.');
  for (const tool of [
    'preview_markdown_note_tree',
    'create_note_from_markdown_tree',
    'append_markdown_as_rem_tree',
    'apply_structured_note_batch',
    'create_polished_note_tree',
    'create_designed_note_tree',
    'verify_card_set',
    'delete_rem_by_id',
    'debug_get_raw_rich_text',
    'set_rem_heading_level',
  ]) {
    assert(!tools.includes(tool), `mass_note_writer tier must not expose ${tool}.`);
  }
  assert(tools.includes('create_or_replace_note_from_markdown'), 'mass_note_writer must expose proven Markdown writer.');
  assertNoRemovedTools(tools, 'mass_note_writer tier');
}

function checkAdvanced() {
  const tools = toolSet('note_writer');
  for (const tool of [...MASS_NOTE_WRITER_TIER_TOOLS, ...NOTE_WRITER_TIER_TOOLS]) {
    assert(tools.has(tool), `note_writer tier missing ${tool}.`);
  }
  for (const tool of [...POWER_USER_TIER_TOOLS, ...DEVELOPER_TIER_TOOLS]) {
    assert(!tools.has(tool), `note_writer tier should not include higher-tier tool ${tool}.`);
  }
  assertNoRemovedTools([...tools], 'note_writer tier');
}

function checkDiagnostics() {
  const tools = toolSet('developer');
  for (const tool of [...MASS_NOTE_WRITER_TIER_TOOLS, ...NOTE_WRITER_TIER_TOOLS, ...POWER_USER_TIER_TOOLS, ...DEVELOPER_TIER_TOOLS]) {
    assert(tools.has(tool), `developer tier missing ${tool}.`);
  }
  assert(!tools.has('delete_rem_by_id'), 'developer tier should not include danger tool.');
}

function checkFullAndMetadata() {
  const tools = getPublicMcpToolNames(false, 'danger');
  const metadataNames = new Set<string>();
  assertNoRemovedTools(tools, 'danger tier');
  assert(!tools.includes('create_folder'), 'danger tier must not expose unsupported create_folder.');
  assert(!tools.includes('replace_rem'), 'danger tier must not expose hidden replace_rem.');
  for (const tool of tools) {
    const metadata = getToolMetadata(tool);
    assert(metadata.name === tool, `metadata missing for ${tool}.`);
    assert(typeof metadata.requiresWrite === 'boolean', `metadata requiresWrite missing for ${tool}.`);
    assert(typeof metadata.supportsDryRun === 'boolean', `metadata supportsDryRun missing for ${tool}.`);
    assert(typeof metadata.runtimeVerified === 'boolean', `metadata runtimeVerified missing for ${tool}.`);
  }
  for (const metadata of TOOL_METADATA) {
    assert(!metadataNames.has(metadata.name), `duplicate metadata for ${metadata.name}.`);
    metadataNames.add(metadata.name);
    assert(goal9ToolCategories.has(metadata.category), `${metadata.name} has non-Goal9 category ${metadata.category}.`);
    assert(typeof metadata.operationTier === 'string', `${metadata.name} missing operationTier.`);
    assert(typeof metadata.scopeRequirement === 'string', `${metadata.name} missing scopeRequirement.`);
    assert(typeof metadata.toolAccessTier === 'string', `${metadata.name} missing toolAccessTier.`);
    assert(typeof metadata.sdkCapability === 'string' || metadata.sdkCapability === null, `${metadata.name} missing sdkCapability.`);
    assert(typeof metadata.isPublic === 'boolean', `${metadata.name} missing isPublic.`);
    assert(typeof metadata.isDebug === 'boolean', `${metadata.name} missing isDebug.`);
    assert(typeof metadata.isDangerous === 'boolean', `${metadata.name} missing isDangerous.`);
    assert(typeof metadata.liveVerificationRequired === 'boolean', `${metadata.name} missing liveVerificationRequired.`);
    assert(typeof metadata.performanceBudgetMs === 'number' && metadata.performanceBudgetMs > 0, `${metadata.name} missing performanceBudgetMs.`);
    assert(typeof metadata.userFacingName === 'string' && metadata.userFacingName.length > 0, `${metadata.name} missing userFacingName.`);
  }
  assert(
    TOOL_METADATA.some((tool) => tool.name === 'create_folder' && tool.exposedNormally === false && tool.sdkSupported === false),
    'create_folder must be metadata-only unsupported.'
  );
  assert(
    TOOL_METADATA.some((tool) => tool.name === 'replace_rem' && tool.isPublic === false && tool.exposedNormally === false),
    'replace_rem must stay explicitly hidden from the public MCP surface.'
  );
  assert(STATIC_SDK_UNSUPPORTED_TOOLS.includes('create_folder'), 'static SDK unsupported list must retain create_folder.');
}

function checkSchemas() {
  assert(STYLE_PLAN_OPERATION_SCHEMA.safeParse({ remId: 'r1', type: 'heading', headingLevel: 'H2' }).success, 'heading style op schema should use headingLevel.');
  assert(STYLE_PLAN_OPERATION_SCHEMA.safeParse({ remId: 'r1', type: 'heading', value: 'H3' }).success, 'heading style op schema should accept value-only alias.');
  assert(!STYLE_PLAN_OPERATION_SCHEMA.safeParse({ remId: 'r1', type: 'heading', headingLevel: 'H2', value: 'H3' }).success, 'heading style op schema should reject conflicting value and headingLevel.');
  assert(STYLE_PLAN_OPERATION_SCHEMA.safeParse({ remId: 'r1', type: 'text_color_span', text: 'Bridge', color: 'Blue' }).success, 'text color style op schema should use color.');
  assert(STYLE_PLAN_OPERATION_SCHEMA.safeParse({ remId: 'r1', type: 'whole_rem_highlight', highlightColor: 'Yellow' }).success, 'highlight style op schema should use highlightColor.');
  assert(STYLED_REM_TREE_NODE_SCHEMA.safeParse({ clientNodeId: 'n1', text: 'Root', children: [{ clientNodeId: 'n2', text: 'Child' }] }).success, 'styled tree schema should accept clientNodeId.');
  assert(REORDER_CHILDREN_INPUT_SCHEMA.safeParse({ parentRemId: 'p1', orderedChildRemIds: ['c1'], dryRun: true, idempotencyKey: 'k1' }).success, 'reorder schema should accept dryRun/idempotency.');
  assert(EXPECTED_STYLE_EXPECTATION_SCHEMA.safeParse({ remId: 'r1', expected: { headingLevel: 'H1' } }).success, 'verify schema should accept explicit expectations.');
  assert(REM_STYLE_SCHEMA.safeParse({ headingLevel: 'H1', textColor: 'blue', highlightColor: 'yellow', remType: 'concept' }).success, 'canonical style schema should accept textColor/highlightColor/remType.');
  assert(REM_STYLE_SCHEMA.safeParse({ headingLevel: 'H3', color: 'blue', highlight: 'yellow', type: 'descriptor' }).success, 'style schema should accept legacy aliases for internal normalization.');
  assert(CREATE_OR_REPLACE_NOTE_FROM_MARKDOWN_INPUT_SCHEMA.safeParse(markdownImportArgs(true)).success, 'markdown importer schema should accept required bulk note shape.');
  assert(CREATE_OR_REPLACE_NOTE_FROM_MARKDOWN_INPUT_SCHEMA.safeParse({ ...markdownImportArgs(true), stylePreset: NUCLEAR_PHYSICS_STYLE_PRESET }).success, 'markdown importer schema should accept nuclear physics preset.');
  assert(PREVIEW_MARKDOWN_NOTE_TREE_INPUT_SCHEMA.safeParse({ markdownText: markdownSample() }).success, 'preview markdown tree schema should accept parser-only request.');
  assert(CREATE_NOTE_FROM_MARKDOWN_TREE_INPUT_SCHEMA.safeParse({ parentRemId: 'parent-1', markdownText: markdownSample(), safetyOptions: { dryRun: true } }).success, 'create markdown tree schema should accept clean hierarchy request.');
  assert(APPEND_MARKDOWN_AS_REM_TREE_INPUT_SCHEMA.safeParse({ targetRemId: 'target-1', markdownText: markdownSample(), safetyOptions: { dryRun: true } }).success, 'append markdown tree schema should accept clean hierarchy request.');
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
    '| Quantity | Symbol | Meaning |',
    '| --- | --- | --- |',
    '| Energy | $E$ | Work capacity |',
    '| Temperature | $T$ | Thermal scale |',
    '',
    '> [!note] Worked warning',
    '> Keep Coulomb barrier and thermal estimates separate.',
    '',
    'Worked example: Estimate the scale using \\(kT \\approx E\\).',
    '',
    'Card marker:: stays plain unless flashcards are enabled',
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
  assert(plan.formulaValidation.valid, 'markdown importer should validate balanced math delimiters.');
  assert(plan.stats.headingCount >= 5, 'markdown importer should preserve root plus H3 headings.');
  assert(plan.stats.mathBlockCount >= 1, 'markdown importer should preserve block math.');
  assert(plan.stats.inlineMathCount >= 2, 'markdown importer should convert inline math to rich text spans.');
  assert(plan.stats.codeBlockCount === 1, 'markdown importer should preserve code blocks as text Rems.');
  assert(plan.stats.bulletCount >= 3, 'markdown importer should preserve nested bullet list nodes.');
  assert(plan.stats.tableCount === 1, 'markdown importer should convert markdown table to table hierarchy.');
  assert(plan.stats.tableCellCount >= 9, 'markdown importer should preserve table cell content.');
  assert(plan.stats.calloutCount === 1, 'markdown importer should convert blockquote admonition to callout Rem.');
  assert(plan.stats.workedExampleCount === 1, 'markdown importer should detect worked examples.');
  assert(plan.stats.flashcardCount === 0, 'markdown importer must not create flashcards unless requested.');
  const output = markdownImportOutputTextFromTree(plan.tree);
  assert(!output.split('\n').some((line) => /^[-*+]\s+/.test(line.trim()) || /^\d+[.)]\s+/.test(line.trim())), 'markdown importer should not leave visible markdown bullet markers.');
  assert(!output.includes('| --- |'), 'markdown importer should not leave visible markdown table separator rows.');
  const inlineMathNode = (plan.tree.children ?? [])
    .flatMap((child) => child.children ?? [])
    .find((child) => child.richText?.some((span) => span.type === 'inlineMath'));
  assert(inlineMathNode, 'markdown importer should emit richText inlineMath spans.');
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
  const flashcardPlan = parseMarkdownImportPlan('Question:: Answer', {
    flashcardOptions: { enabled: true, marker: 'double_colon' },
    headingMapping: { explicitTitle: 'Cards', rootHeading: 'explicit_title' },
  });
  assert(flashcardPlan.stats.flashcardCount === 1, 'flashcard markers should create cards only when enabled.');
  assert(validateMarkdownMathDelimiters('Valid inline \\(x+y\\) and block $$z$$').valid, 'math delimiter validator should accept common delimiters.');
  assert(!validateMarkdownMathDelimiters('Broken inline $x+y').valid, 'math delimiter validator should reject unclosed inline dollar math.');
  const formulaChunks = splitTextFormulaSafe(`Lead ${'word '.repeat(1200)} \\(${`x+${'y+'.repeat(200)}z`}\\) tail`, 200);
  assert(formulaChunks.every((chunk) => !(chunk.includes('\\(') && !chunk.includes('\\)'))), 'formula-safe splitter must not split inside inline math.');
}

function nuclearStyleSample(): string {
  return [
    '# X.Y - MCP Nuclear Physics Style Regression',
    '',
    '### Physical Basis',
    '',
    'This disposable note verifies that the MCP can create a Nuclear Physics note with correct structure.',
    '',
    '### Definitions and Core Quantities',
    '',
    'Let \\(A\\) represent mass number and \\(Z\\) represent atomic number.',
    '',
    '\\[',
    'A = Z + N',
    '\\]',
    '',
    '### Mathematical Setup',
    '',
    'For a simple nonrelativistic kinetic-energy expression,',
    '',
    '$$',
    'E_k = \\frac{1}{2}mv^2',
    '$$',
    '',
    '### Interpretation',
    '',
    'The formula shows that kinetic energy depends quadratically on speed.',
    '',
    '### Common Error Patterns',
    '',
    'Students often confuse mass number \\(A\\) with atomic number \\(Z\\).',
  ].join('\n');
}

function checkNuclearPhysicsStylePreset() {
  const plan = parseMarkdownImportPlan(nuclearStyleSample(), {
    stylePreset: NUCLEAR_PHYSICS_STYLE_PRESET,
  });
  assert(plan.tree.style?.headingLevel === 'H1', 'nuclear preset root must be H1.');
  const children = plan.tree.children ?? [];
  const sectionChildren = children.filter((child) => child.text !== NUCLEAR_PHYSICS_SPACER_TEXT);
  const spacerChildren = children.filter((child) => child.text === NUCLEAR_PHYSICS_SPACER_TEXT);
  assert(sectionChildren.length === 5, 'nuclear preset should preserve five H3 sections.');
  assert(spacerChildren.length === 4, 'nuclear preset should insert spacer siblings between five sections.');
  assert(children[0].text !== NUCLEAR_PHYSICS_SPACER_TEXT, 'nuclear preset must not insert leading spacer.');
  assert(children[children.length - 1].text !== NUCLEAR_PHYSICS_SPACER_TEXT, 'nuclear preset must not insert trailing spacer.');
  for (const child of sectionChildren) {
    assert(child.style?.headingLevel === 'H3', `nuclear section ${child.text ?? child.title} must be H3.`);
    assert((child.children ?? []).every((grandchild) => grandchild.text !== NUCLEAR_PHYSICS_SPACER_TEXT), 'spacers must not be nested inside H3 sections.');
  }
  assert(plan.stats.mathBlockCount >= 2, 'nuclear preset sample should preserve at least two math block Rems.');
  assert(markdownImportOutputTextFromTree(plan.tree).includes('\\(A\\)'), 'nuclear preset should preserve inline math text.');

  const transformed = applyStylePresetToTree(
    {
      text: 'X.Y - Structured Preset',
      children: [
        { text: 'Physical Basis', children: [{ text: 'Content.' }] },
        { text: 'Interpretation', children: [{ text: 'Meaning.' }] },
      ],
    },
    { stylePreset: NUCLEAR_PHYSICS_STYLE_PRESET }
  );
  assert(transformed.style?.headingLevel === 'H1', 'structured nuclear preset root must be H1.');
  assert(transformed.children?.[0]?.style?.headingLevel === 'H3', 'structured nuclear preset section must be H3.');
  assert(transformed.children?.[1]?.text === NUCLEAR_PHYSICS_SPACER_TEXT, 'structured nuclear preset must insert sibling spacer.');
  assert(transformed.children?.[2]?.style?.headingLevel === 'H3', 'structured nuclear preset second section must be H3.');
}

function mcpBody(tool: string, args: Record<string, unknown>) {
  return {
    method: 'tools/call',
    params: {
      name: tool,
      arguments: args,
    },
  };
}

function hostedPrincipal(overrides: Partial<AuthenticatedPrincipal> = {}): AuthenticatedPrincipal {
  return {
    subject: 'pairing:area1',
    userId: 'area1-user',
    authMode: 'hosted_oauth',
    scopeGrants: ['bridge:read', 'bridge:write', 'bridge:trusted_write'],
    accessScope: 'current-rem-tree',
    trustedWriteMode: 'trusted-inside-scope',
    ...overrides,
  };
}

function checkDirectWriteTrustedModeRegression() {
  const directSafeWriteTools = [
    ['create_rem', { parentId: 'parent-1', markdown: 'direct create' }],
    ['apply_structured_note_batch', { target: { mode: 'parent_child', parentId: 'parent-1' }, operation: 'create_child_tree', root: { text: 'Batch root' }, dryRun: false }],
    ['create_polished_note_tree', { parentId: 'parent-1', tree: { text: 'Polished root' }, dryRun: false }],
    ['create_note_from_markdown_tree', { parentRemId: 'parent-1', markdownText: '# Direct Markdown', safetyOptions: { dryRun: false } }],
    ['append_markdown_as_rem_tree', { targetRemId: 'child-1', markdownText: '### Appended', safetyOptions: { dryRun: false } }],
    ['apply_style_plan', { operations: [{ remId: 'child-1', type: 'heading', value: 'H3' }], dryRun: false }],
    ['apply_remnote_command', { target: { mode: 'rem_id', remId: 'child-1' }, command: 'heading_3', dryRun: false }],
  ] as const;

  for (const [tool, args] of directSafeWriteTools) {
    const result = validateMcpToolPermission(mcpBody(tool, args), hostedPrincipal());
    assert(result.ok, `direct-write-trusted-mode-regression: ${tool} should route to plugin in trusted mode.`);
  }
  const last = getLastTrustedWriteDecision();
  assert(last?.allowed === true, 'direct-write-trusted-mode-regression should record allowed trusted write decision.');
  assert(last?.trustedWriteModeEffective === true, 'direct-write-trusted-mode-regression should report trustedWriteModeEffective=true.');

  const confirmResult = validateMcpToolPermission(
    mcpBody('create_rem', { parentId: 'parent-1', markdown: 'confirm create' }),
    hostedPrincipal({ trustedWriteMode: 'ask-every-write' })
  );
  assert(confirmResult.ok, 'read_create_modify direct route should reach plugin so RemNote approval can be requested.');

  const outOfScope = validateMcpToolPermission(
    mcpBody('create_rem', { parentId: 'parent-1', markdown: 'out of scope' }),
    hostedPrincipal({ accessScope: 'focused-rem-only' })
  );
  assert(!outOfScope.ok && outOfScope.code === 'OUT_OF_SCOPE', 'out-of-scope direct write should be blocked by server scope policy.');

  const noWrite = validateMcpToolPermission(
    mcpBody('create_rem', { parentId: 'parent-1', markdown: 'no write' }),
    hostedPrincipal({ scopeGrants: ['bridge:read'] })
  );
  assert(!noWrite.ok && noWrite.code === 'INSUFFICIENT_SCOPE', 'direct write without bridge:write should be blocked cleanly.');
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
  assert(!DESIGN_TEMPLATE_RULES_SCHEMA.safeParse({}).success, 'design rules schema must reject incomplete rule objects.');
  const plan = parseMarkdownImportPlan(markdownSample());
  const output = markdownImportOutputTextFromTree(plan.tree);
  assert(!/\n(Size|H1|H2|H3)\n/.test(`\n${output}\n`), 'style schema/importer must not produce style-control Rems.');
}

function checkHostedDiagnostics() {
  const summary = getToolRegistrySummary(false, 'danger', undefined, {
    discoveryAuthMode: 'no_auth_required',
    toolCallAuthMode: 'hosted_oauth_required',
  });
  assert(summary.toolCallAuthMode === 'hosted_oauth_required', 'hosted registry summary must report hosted OAuth tool auth.');
  assert(summary.activeToolTier === 'danger', 'hosted registry summary must include active tier.');
  assert(summary.legacyDeleteToolsRemoved === true, 'registry must flag legacy delete removal.');
  assert(summary.staticSdkUnsupportedTools.includes('create_folder'), 'hosted diagnostics must expose unsupported static tools.');
}

function checkTierSwitching() {
  const tiers: ToolProfile[] = ['basic', 'mass_note_writer', 'note_writer', 'power_user', 'developer', 'danger'];
  const counts = tiers.map((tier) => getPublicMcpToolNames(false, tier).length);
  assert(counts[0] < counts[1], 'mass_note_writer should expose more tools than basic.');
  assert(counts[1] < counts[2], 'note_writer should expose more tools than mass_note_writer.');
  assert(counts[2] < counts[3], 'power_user should expose more tools than note_writer.');
  assert(counts[3] < counts[4], 'developer should expose more tools than power_user.');
  assert(counts[5] >= counts[4], 'danger should expose at least the developer tool set.');
}

function checkIdempotency() {
  for (const tool of [
    'create_rem',
    'create_document',
    'append_to_rem',
    'insert_image_from_url',
    'insert_audio_from_url',
    'insert_video_from_url',
    'update_rem',
    'move_rem',
    'reorder_children',
    'replace_rem',
    'create_rem_tree',
    'create_styled_rem_tree',
    'create_polished_note_tree',
    'preview_markdown_note_tree',
    'create_note_from_markdown_tree',
    'append_markdown_as_rem_tree',
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
  for (const tool of ['delete_rem_by_id', 'preview_markdown_note_tree', 'create_note_from_markdown_tree', 'append_markdown_as_rem_tree', 'apply_structured_note_batch', 'create_polished_note_tree', 'apply_style_plan', 'reorder_children']) {
    const metadata = getToolMetadata(tool);
    assert(metadata.supportsDryRun, `${tool} must advertise dry-run support.`);
  }
}

function checkPerformance() {
  const first = getPublicMcpToolNames(false, 'danger');
  const second = getPublicMcpToolNames(false, 'danger');
  assert(JSON.stringify(first) === JSON.stringify(second), 'cached public tool list must be stable.');
  const summary = getToolRegistrySummary(false, 'danger');
  assert(summary.registryCache.enabled, 'registry summary must advertise cache dimensions.');
  assert(summary.registryCache.dimensions.includes('activeTier'), 'registry cache dimensions must include active tier.');
  assert(DEFAULT_WRITE_PERFORMANCE_BUDGET_MS.planning === 500, 'planning budget must be 500ms.');
  assert(DEFAULT_WRITE_PERFORMANCE_BUDGET_MS.singleWriteExecution === 3000, 'single write execution budget must be 3000ms.');
  assert(DEFAULT_WRITE_PERFORMANCE_BUDGET_MS.verification === 1000, 'verification budget must be 1000ms.');
  assert(DEFAULT_WRITE_PERFORMANCE_BUDGET_MS.total === 5000, 'total performance target must be 5000ms.');
  const slow = buildWritePerformanceReport({
    phaseDurationsMs: {
      planning: 50,
      singleWriteExecution: 3500,
      verification: 100,
      total: 3650,
    },
  });
  assert(slow.status === 'success_with_performance_warning', 'slow success must report success_with_performance_warning.');
  assert(slow.bottleneckLayer === 'remnote_sdk', 'single-write budget breach must classify RemNote SDK bottleneck.');
}

const checks: Record<string, () => void> = {
  all: () => {
    checkCore();
    checkMassNoteWriter();
    checkAdvanced();
    checkDiagnostics();
    checkFullAndMetadata();
    checkSchemas();
    checkNuclearPhysicsStylePreset();
    checkDirectWriteTrustedModeRegression();
    checkHostedDiagnostics();
    checkTierSwitching();
    checkIdempotency();
    checkPerformance();
  },
  core: checkCore,
  mass: checkMassNoteWriter,
  advanced: checkAdvanced,
  diagnostics: checkDiagnostics,
  schemas: checkSchemas,
  'tool-profile': checkFullAndMetadata,
  'structured-depth': checkStructuredDepth,
  'style-schema': checkStyleSchema,
  'nuclear-physics-style-preset': checkNuclearPhysicsStylePreset,
  'direct-write-trusted-mode-regression': checkDirectWriteTrustedModeRegression,
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
