import { buildWritePerformanceReport } from '../../shared/bridge/performance.js';
import {
  markdownImportOutputTextFromTree,
  parseMarkdownImportPlan,
  verifyMarkdownSourceFidelity,
} from '../../shared/bridge/markdown-importer.js';

type BenchmarkCase = {
  name: string;
  markdownText: string;
  stylePreset?: 'nuclear_physics_h1_h3_spacer_math';
};

const FALLBACK_NODE_THRESHOLD = 120;
const FALLBACK_CHAR_THRESHOLD = 60000;
const CHUNK_NODE_TARGET = 80;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function smallNote(): string {
  return ['# Small Note', '', '### Claim', '', 'Fast import keeps inline math $E=mc^2$ real.'].join('\n');
}

function medium59Note(): string {
  return [
    '# 5.9 - Coulomb Barrier and Temperature Estimate for Fusion',
    '',
    '### Goal',
    '',
    'Estimate why fusion needs high temperature even when the reaction is energetically allowed.',
    '',
    '### Coulomb Barrier',
    '',
    'The electrostatic potential is',
    '',
    '$$',
    'U(r)=\\frac{1}{4\\pi\\epsilon_0}\\frac{Z_1Z_2e^2}{r}',
    '$$',
    '',
    '### Temperature Scale',
    '',
    '- Compare $kT$ with the barrier scale.',
    '- Quantum tunneling reduces the required thermal energy.',
    '',
    '### Worked example',
    '',
    'Worked example: compute the approximate barrier for two deuterons separated by a nuclear radius.',
    '',
    '### Summary',
    '',
    'Fusion rate depends on the Maxwell tail, tunneling, and density.',
  ].join('\n');
}

function largeFormulaHeavyNote(): string {
  const sections = Array.from({ length: 36 }, (_, index) => [
    `### Formula Section ${index + 1}`,
    '',
    `Inline conservation law $E_${index}=m_${index}c^2$ and rate equation \\(\\lambda_${index}=n\\sigma v\\).`,
    '',
    '$$',
    `I_${index}=\\int_0^\\infty x^${(index % 5) + 1}e^{-x}\\,dx`,
    '$$',
    '',
    `- Term ${index + 1}.1 preserves $q_${index}$`,
    `- Term ${index + 1}.2 preserves $\\Delta E_${index}$`,
  ].join('\n'));
  return ['# Large Formula Note', '', ...sections].join('\n\n');
}

function flashcardSet(): string {
  return [
    '# Flashcard Set',
    '',
    '### Cards',
    '',
    'Coulomb barrier:: Electrostatic repulsion between nuclei',
    'Gamow factor:: Tunneling probability term',
    'Binding energy:: Mass defect converted to energy',
  ].join('\n');
}

function tableNote(): string {
  return [
    '# Table Note',
    '',
    '### Data',
    '',
    '| Quantity | Symbol | Unit |',
    '| --- | --- | --- |',
    '| Energy | $E$ | J |',
    '| Cross section | $\\sigma$ | m^2 |',
  ].join('\n');
}

function repairPassNote(): string {
  return [
    '# Repair Check',
    '',
    '### Clean Section',
    '',
    'No visible display delimiters should remain after import.',
  ].join('\n');
}

function chunkCountFor(nodeCount: number, childCount: number): number {
  if (nodeCount <= FALLBACK_NODE_THRESHOLD) {
    return 0;
  }
  return Math.max(1, Math.ceil(Math.max(1, childCount) / Math.max(1, Math.floor(CHUNK_NODE_TARGET / 4))));
}

function runCase(entry: BenchmarkCase) {
  const startedAt = Date.now();
  const planningStartedAt = Date.now();
  const plan = parseMarkdownImportPlan(entry.markdownText, {
    ...(entry.stylePreset ? { stylePreset: entry.stylePreset } : {}),
    flashcardOptions: { enabled: entry.name === 'flashcard_set', marker: 'double_colon' },
    limits: { maxNodes: 1000, maxDepth: 12 },
  });
  const planningMs = Date.now() - planningStartedAt;
  const verificationStartedAt = Date.now();
  const outputText = markdownImportOutputTextFromTree(plan.tree);
  const verification = verifyMarkdownSourceFidelity(
    plan.sourceSnippets,
    outputText,
    plan.options.fidelityOptions,
    plan.stats
  );
  const verificationMs = Date.now() - verificationStartedAt;
  const fallbackUsed =
    plan.stats.nodeCount > FALLBACK_NODE_THRESHOLD ||
    entry.markdownText.length > FALLBACK_CHAR_THRESHOLD;
  const fallbackChunkCount = fallbackUsed
    ? Math.max(1, chunkCountFor(plan.stats.nodeCount, plan.tree.children?.length ?? 0))
    : 0;
  const totalMs = Date.now() - startedAt;
  const performance = buildWritePerformanceReport({
    phaseDurationsMs: {
      planning: planningMs,
      singleWriteExecution: 0,
      verification: verificationMs,
      total: totalMs,
    },
    primaryToolCallCount: 1,
    bridgeRequestCount: 1,
    sdkOperationCount: plan.stats.nodeCount,
    fallbackUsed,
    fallbackReason: fallbackUsed ? 'section chunk fallback would be used for safe payload size' : undefined,
  });
  const failures = [
    ...(plan.formulaValidation.valid ? [] : ['formula_validation_failed']),
    ...(verification.passed ? [] : ['source_fidelity_failed']),
    ...(entry.name === 'medium_5_9_style_note' && performance.phaseDurationsMs.total >= 5000
      ? ['medium_note_over_5000ms']
      : []),
  ];

  return {
    name: entry.name,
    nodeCount: plan.stats.nodeCount,
    maxDepth: plan.stats.maxDepth,
    totalTimeMs: performance.phaseDurationsMs.total,
    phaseTimeMs: performance.phaseDurationsMs,
    primaryToolCalls: performance.primaryToolCallCount,
    internalWriteCalls: fallbackUsed ? 1 + fallbackChunkCount : 1,
    fallbackUsed,
    fallbackChunkCount,
    fallbackReason: performance.fallbackReason,
    failures,
    status: failures.length ? 'failed' : performance.status,
    bottleneckLayer: performance.bottleneckLayer,
  };
}

const cases: BenchmarkCase[] = [
  { name: 'small_note', markdownText: smallNote() },
  { name: 'medium_5_9_style_note', markdownText: medium59Note() },
  { name: 'large_formula_heavy_note', markdownText: largeFormulaHeavyNote() },
  { name: 'flashcard_set', markdownText: flashcardSet() },
  { name: 'table_note', markdownText: tableNote() },
  { name: 'repair_pass', markdownText: repairPassNote() },
  {
    name: 'template_based_note',
    markdownText: medium59Note(),
    stylePreset: 'nuclear_physics_h1_h3_spacer_math',
  },
];

const results = cases.map(runCase);
for (const result of results) {
  assert(result.failures.length === 0, `${result.name} performance benchmark failed: ${result.failures.join(', ')}`);
}
const medium = results.find((result) => result.name === 'medium_5_9_style_note');
assert(medium && medium.totalTimeMs < 5000, 'medium 5.9-style note missed the 5000ms target.');

console.log(JSON.stringify({
  benchmark: 'large_payload_resilience_under_5s_path',
  ranAt: new Date().toISOString(),
  budgetsMs: {
    planning: 500,
    singleWriteExecution: 3000,
    verification: 1000,
    total: 5000,
  },
  results,
}, null, 2));
