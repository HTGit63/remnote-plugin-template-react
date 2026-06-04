import { performance } from 'node:perf_hooks';
import {
  markdownImportOutputTextFromTree,
  parseMarkdownImportPlan,
  verifyMarkdownSourceFidelity,
} from '../../shared/bridge/markdown-importer.js';
import { NUCLEAR_PHYSICS_STYLE_PRESET } from '../../shared/bridge/protocol.js';

interface BenchmarkCase {
  name: string;
  markdownText: string;
  options?: Parameters<typeof parseMarkdownImportPlan>[1];
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function smallNote(): string {
  return [
    '# Small Markdown Note',
    '',
    '### Summary',
    '',
    'Clean hierarchy should preserve inline math $a^2+b^2=c^2$.',
    '',
    '- first child',
    '  - nested child',
  ].join('\n');
}

function nuclearNote(): string {
  return [
    '# 5.9 - Coulomb Barrier and Temperature Estimate for Fusion',
    '',
    '### Physical Basis',
    '',
    'Fusion requires nuclei to approach closely enough for the strong force to dominate.',
    '',
    '### Coulomb Repulsion',
    '',
    'For two protons, the electrostatic potential energy is',
    '',
    '$$',
    'E = \\frac{k q_1 q_2}{r}',
    '$$',
    '',
    '### Temperature Estimate',
    '',
    'Using $kT \\approx E$ gives an upper thermal scale.',
    '',
    'Worked example: compare a barrier estimate with thermal energy.',
    '',
    '- identify charges',
    '- estimate separation',
    '- solve for temperature',
  ].join('\n');
}

function formulaHeavyNote(): string {
  const formulas = Array.from({ length: 28 }, (_, index) =>
    `Formula ${index + 1}: \\(E_${index + 1}=mc^2+\\frac{${index + 1}}{r^2}\\) stays inline.`
  );
  return [
    '# Formula Heavy Note',
    '',
    '### Inline Formula Section',
    '',
    formulas.join(' '),
    '',
    '### Block Formula Section',
    '',
    '$$',
    '\\sigma(E)=\\sum_{\\ell=0}^{\\infty}(2\\ell+1)\\frac{\\pi}{k^2}T_{\\ell}(E)',
    '$$',
  ].join('\n');
}

function tableAndCardsNote(): string {
  return [
    '# Tables and Cards',
    '',
    '### Constants',
    '',
    '| Quantity | Symbol | Note |',
    '| --- | --- | --- |',
    '| Energy | $E$ | scalar |',
    '| Temperature | $T$ | thermal scale |',
    '',
    'Coulomb barrier:: Electrostatic repulsion between nuclei',
    '',
    '- Card marker stays structured only because flashcards are enabled.',
  ].join('\n');
}

const cases: BenchmarkCase[] = [
  { name: 'small_markdown_note', markdownText: smallNote() },
  {
    name: 'nuclear_physics_5_9_style',
    markdownText: nuclearNote(),
    options: { stylePreset: NUCLEAR_PHYSICS_STYLE_PRESET },
  },
  { name: 'formula_heavy_note', markdownText: formulaHeavyNote() },
  {
    name: 'tables_and_cards_note',
    markdownText: tableAndCardsNote(),
    options: { flashcardOptions: { enabled: true, marker: 'double_colon' } },
  },
];

const reports = cases.map((entry) => {
  const started = performance.now();
  const plan = parseMarkdownImportPlan(entry.markdownText, entry.options);
  const durationMs = performance.now() - started;
  const outputText = markdownImportOutputTextFromTree(plan.tree);
  const fidelity = verifyMarkdownSourceFidelity(
    plan.sourceSnippets,
    outputText,
    plan.options.fidelityOptions,
    plan.stats
  );
  const noBulletPollution = !outputText
    .split(/\r?\n/)
    .some((line) => /^[-*+]\s+/.test(line.trim()) || /^\d+[.)]\s+/.test(line.trim()));
  const noTableSeparatorPollution = !outputText.includes('| --- |');
  const correct =
    plan.formulaValidation.valid &&
    fidelity.passed &&
    noBulletPollution &&
    noTableSeparatorPollution;
  assert(correct, `${entry.name} markdown pipeline benchmark correctness failed.`);
  return {
    name: entry.name,
    durationMs: Number(durationMs.toFixed(3)),
    nodeCount: plan.stats.nodeCount,
    maxDepth: plan.stats.maxDepth,
    headingCount: plan.stats.headingCount,
    mathBlockCount: plan.stats.mathBlockCount,
    inlineMathCount: plan.stats.inlineMathCount,
    tableCount: plan.stats.tableCount,
    tableCellCount: plan.stats.tableCellCount,
    bulletCount: plan.stats.bulletCount,
    flashcardCount: plan.stats.flashcardCount,
    splitChunkCount: plan.stats.splitChunkCount,
    sourceHash: plan.sourceHash,
    outputHash: plan.outputHash,
    correctness: {
      formulaValidation: plan.formulaValidation.valid,
      fidelityPassed: fidelity.passed,
      noBulletPollution,
      noTableSeparatorPollution,
    },
  };
});

console.log(
  JSON.stringify(
    {
      benchmark: 'markdown_to_rem_hierarchy_pipeline',
      ranAt: new Date().toISOString(),
      cases: reports,
    },
    null,
    2
  )
);
