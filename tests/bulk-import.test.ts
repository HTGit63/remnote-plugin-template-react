import { describe, expect, test } from 'vitest';
import {
  buildBulkImportSourceManifest,
  expectedBulkImportReadbackText,
  extractMarkedSourceText,
  planNoteImport,
  stableBulkImportHash,
  verifyBulkImportFinalReadback,
  verifyBulkImportSourceText,
} from '../shared/bridge/bulk-import';
import {
  markdownImportOutputTextFromTree,
  parseMarkdownImportFragmentPlan,
  parseMarkdownImportPlan,
  verifyMarkdownSourceFidelity,
} from '../shared/bridge/markdown-importer';
import { BulkImportJobStore } from '../server/src/bulk-import/job-store';
import { MemoryStorageProvider } from '../server/src/storage/memory-store';
import { previewMarkdownNoteTree } from '../src/remnote/write/markdownImportExecutor';

const chapter = [
  '# Chapter 1 Nuclear Physics',
  '',
  '## 1.1 Nuclear terminology',
  '',
  'Nuclide notation is preserved word by word.',
  '',
  '```ts',
  'const x = 1;',
  'const y = 2;',
  '```',
  '',
  '## 1.2 Mass spectrometer',
  '',
  'Velocity selector text.',
  '',
  '$$',
  'qvB = qE',
  '$$',
].join('\n');

const remnoteExportedChapter = [
  '- # Chapter One:',
  '    - ## 1.1 — Nuclear terminology and nuclide notation',
  '        - Nuclide notation is preserved word for word.',
  '        - $^{A}_{Z}X$ keeps formula text.',
  '    - ## 1.2 — Units, dimensions, and order-of-magnitude scales in nuclear physics',
  '        - Nuclear radii are measured in femtometres.',
  '    - ## 1.3 — Atomic mass, nuclear mass, atomic weight, and isotopic abundance',
  '        - Mass defect examples remain in order.',
  '    - ## 1.4 — Measuring atomic masses and isotopic abundances: velocity selector and mass spectrometer',
  '        - Velocity selector formula: $qE = qvB$.',
  '    - ## 1.5 — Rutherford alpha scattering experiment and the nuclear hypothesis',
  '        - Rutherford scattering supports the nuclear hypothesis.',
  '- # Chapter Two:',
  '    - ## 2.1 Should not import',
  '        - This line must never appear in Chapter One output.',
].join('\n');

describe('bulk import planner', () => {
  test('plans sections in source order with stable chunk idempotency', () => {
    const plan = planNoteImport({
      sourceName: 'nuclear.md',
      sourceText: chapter,
      targetRootId: 'Plugin Test',
      chapterSelector: 'Chapter 1',
      options: { maxCharsPerChunk: 120, maxRemsPerChunk: 4 },
    });

    expect(plan.chapterTitle).toBe('Chapter 1 Nuclear Physics');
    expect(plan.sections.map((section) => section.sectionKey)).toEqual(['1.1', '1.2']);
    expect(plan.chunks.length).toBeGreaterThanOrEqual(2);
    expect(plan.chunks[0].idempotencyKey).toContain('bulk-import:job-pending:section:1.1:chunk:1');
    expect(plan.chunks.map((chunk) => chunk.sourceText).join('\n')).toContain('const x = 1;');
  });

  test('extracts RemNote-exported Chapter One only and normalizes heading bullets', () => {
    const extracted = extractMarkedSourceText({
      sourceName: 'Nuclear Phyiscs.md',
      sourceText: remnoteExportedChapter,
      startMarker: '# Chapter One:',
      stopBeforeMarker: '# Chapter Two:',
      sourceNormalization: 'auto',
    });

    expect(extracted.metadata.startLine).toBe(1);
    expect(extracted.metadata.stopMarkerFound).toBe(true);
    expect(extracted.text).toContain('# Chapter One:');
    expect(extracted.text).toContain('## 1.5 — Rutherford alpha scattering experiment and the nuclear hypothesis');
    expect(extracted.text).not.toContain('Chapter Two');
    expect(extracted.text).not.toMatch(/^\s*-\s*#/m);
    expect(extracted.metadata.extractedSourceLength).toBe(
      remnoteExportedChapter.split('\n').slice(0, 12).join('\n').length
    );
    expect(extracted.metadata.plannedSourceHash).toBe(stableBulkImportHash(extracted.text));
  });

  test('plans file-style Chapter One sections without duplicating section headings into chunks', () => {
    const plan = planNoteImport({
      sourceName: 'Nuclear Phyiscs.md',
      sourceKind: 'file',
      sourceFilePath: '/mnt/data/Nuclear Phyiscs.md',
      sourceText: remnoteExportedChapter,
      targetRootId: 'Plugin Test',
      rootTitle: 'Nuclear Physics — Chapter One Bulk Import Test',
      startMarker: '# Chapter One:',
      stopBeforeMarker: '# Chapter Two:',
      options: { maxCharsPerChunk: 24000, maxRemsPerChunk: 120 },
    });

    expect(plan.importRootTitle).toBe('Nuclear Physics — Chapter One Bulk Import Test');
    expect(plan.chapterTitle).toBe('Chapter One');
    expect(plan.sections.map((section) => section.title)).toEqual([
      '1.1 — Nuclear terminology and nuclide notation',
      '1.2 — Units, dimensions, and order-of-magnitude scales in nuclear physics',
      '1.3 — Atomic mass, nuclear mass, atomic weight, and isotopic abundance',
      '1.4 — Measuring atomic masses and isotopic abundances: velocity selector and mass spectrometer',
      '1.5 — Rutherford alpha scattering experiment and the nuclear hypothesis',
    ]);
    expect(plan.plannedSourceLength).toBe(plan.sourceMetadata.plannedSourceLength);
    expect(plan.extractedSourceLength).toBe(plan.sourceMetadata.extractedSourceLength);
    expect(plan.chunks.map((chunk) => chunk.sourceText).join('\n')).toContain('$qE = qvB$');
    expect(plan.chunks.map((chunk) => chunk.sourceText).join('\n')).not.toContain('Chapter Two');
    expect(plan.sections[0].chunks[0].sourceText).not.toContain('## 1.1');
  });

  test('groups the chapter preamble into the first H2 logical chunk', () => {
    const source = [
      '# Tiny Bulk Import Test',
      '',
      'Intro paragraph one.',
      '',
      'Intro paragraph two.',
      '',
      '## 1.1 Section A',
      '',
      '- Bullet A',
      '',
      '## 1.2 Section B',
      '',
      '- Bullet B',
      '',
      '## 1.3 Section C',
      '',
      '- Bullet C',
      '',
      '## 1.4 Section D',
      '',
      '- Bullet D',
    ].join('\n');

    const plan = planNoteImport({
      sourceText: source,
      targetRootId: 'Plugin Test',
      rootTitle: 'Tiny Bulk Import Test',
      chapterTitle: 'Tiny Bulk Import Test',
      options: { maxCharsPerChunk: 500, maxRemsPerChunk: 30 },
    });
    expect(plan.logicalChunkCount).toBe(4);
    expect(plan.nativeChunkCount).toBe(4);
    expect(plan.sections.map((section) => section.title)).toEqual([
      '1.1 Section A',
      '1.2 Section B',
      '1.3 Section C',
      '1.4 Section D',
    ]);
    expect(plan.sections[0].sourceText).toContain('# Tiny Bulk Import Test');
    expect(plan.sections[0].sourceText).toContain('Intro paragraph one.');
    expect(plan.sections[0].sourceText).toContain('## 1.1 Section A');
    expect(plan.sections[0].bodySourceText).toContain('Intro paragraph one.');
    expect(plan.sections[0].bodySourceText).toContain('Intro paragraph two.');
    expect(plan.sections[0].bodySourceText).toContain('Bullet A');
    expect(plan.sections[0].bodySourceText).not.toContain('# Tiny Bulk Import Test');
    expect(plan.sections[0].bodySourceText).not.toContain('## 1.1 Section A');
    expect(plan.sections.some((section) => section.sectionKey === 'chapter-introduction')).toBe(false);
  });

  test('keeps sibling bullets and following formula as siblings in tiny import chunks', () => {
    const plan = parseMarkdownImportPlan([
      '# Tiny Bulk Import Test',
      '',
      '## Section A',
      '',
      '- Bullet A',
      '- Bullet B',
      '',
      'Formula: $E=mc^2$',
    ].join('\n'));
    const section = plan.tree.children?.find((child) => child.text === 'Section A');
    const childTexts = section?.children?.map((child) => child.text) ?? [];
    const bulletA = section?.children?.find((child) => child.text === 'Bullet A');
    const bulletB = section?.children?.find((child) => child.text === 'Bullet B');

    expect(childTexts).toContain('Bullet A');
    expect(childTexts).toContain('Bullet B');
    expect(childTexts).toContain('Formula: E=mc^2');
    expect(bulletA?.children ?? []).toEqual([]);
    expect(bulletB?.children ?? []).toEqual([]);
  });

  test('preserveBlankLines false disables implicit empty section spacers', () => {
    const plan = parseMarkdownImportPlan([
      '# No Spacer Note',
      '',
      '## Section A',
      '',
      'Alpha.',
      '',
      '## Section B',
      '',
      'Beta.',
    ].join('\n'), {
      remnoteLayout: { preserveBlankLines: false },
    });

    expect(plan.tree.children?.map((child) => child.text)).toEqual(['Section A', 'Section B']);
    expect(plan.stats.nodeCount).toBe(5);
  });

  test('keeps loose nested bullets under their source parent across blank lines', () => {
    const plan = parseMarkdownImportPlan([
      '# Loose List Import',
      '',
      '## Section A',
      '',
      '- Parent bullet',
      '',
      '  - Nested bullet',
      '- Sibling bullet',
    ].join('\n'));
    const section = plan.tree.children?.find((child) => child.text === 'Section A');
    const parent = section?.children?.find((child) => child.text === 'Parent bullet');

    expect(section?.children?.map((child) => child.text)).toEqual([
      'Parent bullet',
      'Sibling bullet',
    ]);
    expect(parent?.children?.map((child) => child.text)).toEqual(['Nested bullet']);
  });

  test('marks Markdown list items as visible RemNote bullets', () => {
    const plan = parseMarkdownImportPlan([
      '# Summary note',
      '',
      '## Summary',
      '',
      '- First point',
      '- Second point',
    ].join('\n'));
    const summary = plan.tree.children?.find((child) => child.text === 'Summary');

    expect(summary?.children).toHaveLength(2);
    expect(summary?.children?.map((child) => child.style?.hideBullet)).toEqual([false, false]);
  });

  test('plans generic H2 sections for small synthetic bulk import without wrapper duplication', () => {
    const source = [
      '# Mini Bulk Import Test — Test 07',
      '',
      '## Section A — Nuclear Notation',
      '',
      'Formula: $A=Z+N$',
      '',
      'Formula: $N=A-Z$',
      '',
      '## Section B — Mass Spectrometer',
      '',
      'Formula: $qV=\\frac{1}{2}mv^2$',
      '',
      'Formula: $r=\\frac{mv}{qB}$',
      '',
      '## Section C — Verification Anchor',
      '',
      'TEST_07_BULK_IMPORT_VERIFICATION_ANCHOR',
    ].join('\n');

    const plan = planNoteImport({
      sourceText: source,
      targetRootId: 'Plugin Test',
      rootTitle: 'Mini Bulk Import Test — Test 07',
      chapterTitle: 'Mini Bulk Import Test — Test 07',
      options: { maxCharsPerChunk: 500, maxRemsPerChunk: 30 },
    });

    expect(plan.chapterTitle).toBe('Mini Bulk Import Test — Test 07');
    expect(plan.sections.map((section) => section.title)).toEqual([
      'Section A — Nuclear Notation',
      'Section B — Mass Spectrometer',
      'Section C — Verification Anchor',
    ]);
    expect(plan.chunks.map((chunk) => chunk.sourceText).join('\n')).not.toContain('# Mini Bulk Import Test — Test 07');
    expect(plan.chunks.map((chunk) => chunk.sourceText).join('\n')).not.toContain('## Section A — Nuclear Notation');
    expect(plan.chunks.map((chunk) => chunk.sourceText).join('\n')).toContain('TEST_07_BULK_IMPORT_VERIFICATION_ANCHOR');
  });

  test('keeps nested headings inside principal logical sections and reports native mapping', () => {
    const plan = planNoteImport({
      sourceText: [
        '# Chapter One',
        '',
        '## 1.1 Principal section',
        '',
        '### Topic A',
        '',
        '- Alpha',
        '  - Alpha child',
        '',
        '### Topic B',
        '',
        '- Beta',
        '',
        '## 1.2 Second principal section',
        '',
        '### Topic C',
        '',
        '- Gamma',
      ].join('\n'),
      targetRootId: 'Plugin Test',
      options: { maxCharsPerChunk: 24000, maxRemsPerChunk: 120 },
    });

    expect(plan.sections.map((section) => section.title)).toEqual([
      '1.1 Principal section',
      '1.2 Second principal section',
    ]);
    expect(plan.sections[0].bodySourceText).toContain('### Topic A');
    expect(plan.sections[0].bodySourceText).toContain('### Topic B');
    expect(plan.logicalChunkCount).toBe(2);
    expect(plan.nativeChunkCount).toBe(plan.chunks.length);
    expect(plan.chunks.every((chunk) => chunk.logicalSectionKey === chunk.sectionKey)).toBe(true);
  });

  test('never starts a native chunk inside a nested list subtree', () => {
    const plan = planNoteImport({
      sourceText: [
        '# Chapter One',
        '## 1.1 Lists',
        '- Parent A',
        '  - Child A1',
        '  - Child A2',
        '- Parent B',
        '  - Child B1',
      ].join('\n'),
      targetRootId: 'Plugin Test',
      options: { maxCharsPerChunk: 500, maxRemsPerChunk: 2 },
    });

    expect(plan.chunks).toHaveLength(2);
    expect(plan.chunks.map((chunk) => chunk.sourceText.split('\n').find((line) => line.trim()))).toEqual([
      '- Parent A',
      '- Parent B',
    ]);
    expect(plan.chunks[0].estimatedRemCount).toBe(3);
    expect(plan.warnings).toEqual(expect.arrayContaining([
      expect.stringMatching(/atomic Markdown subtree exceeded.*maxRemsPerChunk/i),
    ]));
  });

  test('parses a Markdown chunk as sibling fragment nodes without a visible wrapper', () => {
    const fragment = parseMarkdownImportFragmentPlan([
      '- **1. Derivative**',
      '  - Definition',
      '  - Notation',
      '- 2. Partial Derivative',
      '- 3. Differential',
    ].join('\n'));

    expect(fragment.nodes.map((node) => node.text)).toEqual([
      '1. Derivative',
      '2. Partial Derivative',
      '3. Differential',
    ]);
    expect(fragment.nodes[0].children?.map((node) => node.text)).toEqual(['Definition', 'Notation']);
    expect(fragment.outputText.split('\n')).not.toContain('- 1. Derivative');
  });

  test('represents supported strong and emphasis spans as rich text', () => {
    const plan = parseMarkdownImportPlan('# Styled\n\n**Gross counts** and *net counts*.');
    const paragraph = plan.tree.children?.find((node) => node.clientNodeId?.startsWith('paragraph-'));

    expect(paragraph?.text).toBe('Gross counts and net counts.');
    expect(paragraph?.richText).toEqual([
      { text: 'Gross counts', styles: { bold: true } },
      { text: ' and ' },
      { text: 'net counts', styles: { italic: true } },
      { text: '.' },
    ]);
  });

  test('hashes are deterministic and source fidelity reports mismatch previews', () => {
    const hashA = stableBulkImportHash('same source');
    const hashB = stableBulkImportHash('same source');
    expect(hashA).toBe(hashB);

    const passed = verifyBulkImportSourceText({
      expectedText: 'Alpha\n- Beta',
      actualText: 'Alpha\n* Beta',
    });
    expect(passed.ok).toBe(true);

    const failed = verifyBulkImportSourceText({
      expectedText: 'Expected physics text',
      actualText: 'Different text',
    });
    expect(failed.ok).toBe(false);
    expect(failed.status).toBe('source_fidelity_failed');
    expect(failed.missingTextPreview).toContain('Expected physics text');
  });

  test('source fidelity rejects reordered semantic snippets', () => {
    const report = verifyMarkdownSourceFidelity(
      ['Alpha source sentence.', 'Beta source sentence.'],
      'Beta source sentence. Alpha source sentence.',
      { preserveSourceOrder: true }
    );

    expect(report.passed).toBe(false);
    expect(report.structureMismatches).toEqual([
      expect.stringMatching(/source order mismatch/i),
    ]);
  });

  test('source fidelity accepts formatting-only and formula-delimiter differences', () => {
    const report = verifyMarkdownSourceFidelity(
      ['Important formula E=mc^2.'],
      '**Important** formula \\(E=mc^2\\).',
      { allowWhitespaceNormalization: true }
    );

    expect(report.passed).toBe(true);
    expect(report.missingTextSnippets).toEqual([]);
  });

  test('builds distinct raw and semantic manifests for rendered Markdown equivalents', () => {
    const source = [
      '## Results',
      '- **Energy**: [Einstein relation](https://example.test/e) is $E=mc^2$.',
      '> Observation:  caf\u00e9  is stable.',
    ].join('\n');
    const rendered = [
      'Results',
      'Energy: Einstein relation is E=mc^2.',
      'Callout: Observation: café is stable.',
    ].join('\n');
    const manifest = buildBulkImportSourceManifest(source);
    const renderedManifest = buildBulkImportSourceManifest(rendered, { renderedReadback: true });
    const report = verifyBulkImportSourceText({ expectedText: source, actualText: rendered });

    expect(manifest.rawSourceHash).not.toBe(manifest.semanticHash);
    expect(manifest.semanticHash).toBe(renderedManifest.semanticHash);
    expect(manifest.units.map((unit) => unit.semanticText)).toEqual([
      'Results',
      'Energy: Einstein relation is E=mc^2.',
      'Observation: café is stable.',
    ]);
    expect(manifest.formattingExpectations).toEqual(expect.arrayContaining(['emphasis', 'link', 'inline_math', 'blockquote']));
    expect(manifest.supportedLosses).toEqual(expect.arrayContaining([
      expect.objectContaining({ feature: 'link_destination' }),
    ]));
    expect(report.ok).toBe(true);
    expect(report.method).toBe('semantic_manifest');
    expect(report.rawSourceHash).toBe(manifest.rawSourceHash);
    expect(report.semanticHash).toBe(manifest.semanticHash);
    expect(report.renderedReadbackHash).toBe(renderedManifest.rawSourceHash);
  });

  test('ordinary blockquotes preserve exact visible text and native quote style without a synthetic label', () => {
    const plan = parseMarkdownImportPlan('# Quote note\n\n> Exact warning text.');
    const quote = plan.tree.children?.find((child) => child.text === 'Exact warning text.');

    expect(quote).toBeDefined();
    expect(quote?.text).toBe('Exact warning text.');
    expect(quote?.richText).toEqual([
      expect.objectContaining({ text: 'Exact warning text.', styles: expect.objectContaining({ quote: true }) }),
    ]);
    expect(JSON.stringify(plan.tree)).not.toContain('Callout:');
  });

  test('preview declares native heading loss instead of counting planned headings as live properties', () => {
    const preview = previewMarkdownNoteTree({
      markdownText: '# Root heading\n\n## Section heading\n\nBody.',
    });

    expect(preview.plan.headingCount).toBe(2);
    expect(preview.verification).toMatchObject({
      passed: true,
      verificationScope: 'semantic_content_math_and_order',
      requestedHeadingCount: 2,
      nativeHeadingCount: 0,
    });
    expect(preview.warnings).toEqual(expect.arrayContaining([
      expect.stringMatching(/native heading properties are not written/i),
    ]));
  });

  test('declares inline-code presentation as a supported semantic loss', () => {
    const manifest = buildBulkImportSourceManifest('Use `npm test` before release.');

    expect(manifest.supportedLosses).toEqual(expect.arrayContaining([
      expect.objectContaining({ feature: 'inline_code_style' }),
    ]));
  });

  test('does not call section names duplicated when they recur only inside content text', () => {
    const store = new BulkImportJobStore();
    const plan = store.savePlan(planNoteImport({
      sourceText: '# Direction Notes\n\n## North\n\nNorth paragraph.\n\n## East\n\nEast item.',
      sourceName: 'directions.md',
      targetRootId: 'target-root',
      rootTitle: 'Direction Notes',
    }));
    const job = store.createJob(plan.planId, 'bulk-job:section-words-in-content');
    const report = verifyBulkImportFinalReadback({
      job,
      readbackTree: {
        remId: 'import-root',
        frontText: job.chapterTitle,
        children: [
          { remId: 'north', frontText: 'North', children: [{ remId: 'north-body', frontText: 'North paragraph.', children: [] }] },
          { remId: 'east', frontText: 'East', children: [{ remId: 'east-body', frontText: 'East item.', children: [] }] },
        ],
      },
    });

    expect(report.ok).toBe(true);
    expect(report.structure.duplicateSectionTitles).toEqual([]);
    expect(report.recommendedAction).toBeUndefined();
  });

  test('reports exact semantic units and source spans on fidelity failure', () => {
    const report = verifyBulkImportSourceText({
      expectedText: '## Results\n- Alpha\n- Beta',
      actualText: 'Results\nAlpha\nGamma',
      jobId: 'job-semantic',
      sectionKey: 'results',
      chunkIndex: 2,
    });

    expect(report.ok).toBe(false);
    expect(report.missingUnits).toEqual([
      expect.objectContaining({ semanticText: 'Beta', sourceSpan: { startLine: 3, endLine: 3 } }),
    ]);
    expect(report.extraUnits).toEqual([
      expect.objectContaining({ semanticText: 'Gamma', sourceSpan: { startLine: 3, endLine: 3 } }),
    ]);
  });

  test('preserves underscore anchors and rejects visible style metadata pollution', () => {
    const plan = parseMarkdownImportPlan([
      '# Chapter One',
      '',
      '## 1.1 Anchors',
      '',
      'Keep CN_01_03_anchor and formula $qE = qvB$ exact.',
    ].join('\n'));
    const output = markdownImportOutputTextFromTree(plan.tree);

    expect(output).toContain('CN_01_03_anchor');
    expect(output).not.toContain('CN01_03_anchor');
    expect(output.split('\n').map((line) => line.trim())).not.toEqual(expect.arrayContaining(['Size', 'H1', 'H2', 'H3', 'normal']));

    const verified = verifyMarkdownSourceFidelity(plan.sourceSnippets, output, {}, plan.stats);
    expect(verified.passed).toBe(true);

    const polluted = verifyMarkdownSourceFidelity(plan.sourceSnippets, `${output}\nSize\nH1`, {}, plan.stats);
    expect(polluted.passed).toBe(false);
    expect(polluted.pollutionRems).toEqual(['Size', 'H1']);
  });

  test('counts only rich formula spans and ignores dollar text inside fenced code', () => {
    const plan = parseMarkdownImportPlan([
      '# Formula Count',
      '',
      'Inline formula: $E=mc^2$.',
      '',
      '```text',
      '$not_a_formula$',
      '```',
      '',
      '$$',
      'F = ma',
      '$$',
    ].join('\n'));

    expect(plan.stats.inlineMathCount).toBe(1);
    expect(plan.stats.mathBlockCount).toBe(1);
    expect(plan.stats.codeBlockCount).toBe(1);
  });

  test('preserves empty table columns and fenced code text without silent native-format claims', () => {
    const markdownText = [
      '# Table And Code',
      '',
      '| A | | C |',
      '| --- | --- | --- |',
      '| 1 | | 3 |',
      '',
      '```ts',
      'const formula = "$not_math$";',
      '```',
    ].join('\n');
    const plan = parseMarkdownImportPlan(markdownText);
    const table = plan.tree.children?.find((child) => child.clientNodeId === 'table-1');
    const header = table?.children?.find((child) => child.clientNodeId === 'table-1-header');
    const row = table?.children?.find((child) => child.clientNodeId === 'table-1-row-1');
    const code = plan.tree.children?.find((child) => child.clientNodeId === 'code-1');
    const preview = previewMarkdownNoteTree({ markdownText });

    expect(header?.children).toHaveLength(3);
    expect(header?.children?.[1]?.text).toBe(' ');
    expect(row?.children).toHaveLength(3);
    expect(row?.children?.[1]?.text).toBe(' ');
    expect(plan.stats.tableCellCount).toBe(6);
    expect(code?.text).toBe('const formula = "$not_math$";');
    expect(code?.text).not.toContain('```');
    expect(preview.massNoteManifest?.warnings).toEqual(expect.arrayContaining([
      expect.stringMatching(/tables.*Rem hierarchy.*not native/i),
      expect.stringMatching(/code blocks.*literal text.*not native/i),
    ]));
  });

  test('converts thematic breaks into hidden spacer Rems without visible Markdown pollution', () => {
    const plan = parseMarkdownImportPlan([
      '# Divided Note',
      '',
      'First section.',
      '',
      '---',
      '',
      'Second section.',
    ].join('\n'));
    const output = markdownImportOutputTextFromTree(plan.tree);
    const divider = plan.tree.children?.find((child) => child.clientNodeId?.startsWith('thematic-break-'));

    expect(output.split('\n').map((line) => line.trim())).not.toContain('---');
    expect(divider).toMatchObject({ text: ' ', style: { hideBullet: true } });
    expect(plan.representationWarnings).toEqual(expect.arrayContaining([
      expect.stringMatching(/thematic break.*spacer/i),
    ]));
  });

  test('consumes first-line title so one-line chunk does not duplicate itself', () => {
    const plan = parseMarkdownImportPlan('Formula: A=Z+N.');

    expect(plan.tree.text).toBe('Formula: A=Z+N.');
    expect(plan.tree.children ?? []).toEqual([]);
    expect(markdownImportOutputTextFromTree(plan.tree)).toBe('Formula: A=Z+N.');
    expect(plan.stats.nodeCount).toBe(1);
  });
});

describe('bulk import final verification', () => {
  test('detects full readback match, missing text, extra Chapter Two text, and visible dash pollution', () => {
    const store = new BulkImportJobStore();
    const plan = store.savePlan(planNoteImport({
      sourceText: remnoteExportedChapter,
      targetRootId: 'Plugin Test',
      rootTitle: 'Nuclear Physics — Chapter One Bulk Import Test',
      startMarker: '# Chapter One:',
      stopBeforeMarker: '# Chapter Two:',
    }));
    const job = store.createJob(plan.planId, 'bulk-job:final-verify');
    const expected = expectedBulkImportReadbackText(job);

    const passed = verifyBulkImportFinalReadback({ job, actualText: expected });
    expect(passed.ok).toBe(true);
    expect(passed.normalizedMatchPercentage).toBe(100);

    const missing = verifyBulkImportFinalReadback({
      job,
      actualText: expected.replace('Velocity selector formula: $qE = qvB$.', ''),
    });
    expect(missing.ok).toBe(false);
    expect(missing.missingTextPreview).toContain('Velocity selector formula');

    const extra = verifyBulkImportFinalReadback({
      job,
      actualText: `${expected}\nChapter Two:\n2.1 Should not import`,
    });
    expect(extra.ok).toBe(false);
    expect(extra.extraTextPreview).toContain('Chapter Two');
    expect(extra.checks.noChapterTwo).toBe(false);

    const dashPolluted = verifyBulkImportFinalReadback({
      job,
      actualText: expected.replace('Chapter One', '- # Chapter One'),
    });
    expect(dashPolluted.ok).toBe(false);
    expect(dashPolluted.checks.noVisibleDashPrefixes).toBe(false);
  });

  test('does not count equivalent frontText and plainText fields as duplicate readback', () => {
    const store = new BulkImportJobStore();
    const plan = store.savePlan(planNoteImport({
      sourceText: [
        '# Mini Bulk Import Test — Test 07',
        '',
        '## Section A',
        '',
        'Formula: A=Z+N.',
        '',
        '## Section B',
        '',
        'Anchor: TEST_07_BULK_IMPORT_VERIFICATION_ANCHOR.',
      ].join('\n'),
      targetRootId: 'Plugin Test',
      rootTitle: 'Mini Bulk Import Test — Test 07',
      chapterTitle: 'Mini Bulk Import Test — Test 07',
    }));
    const job = store.createJob(plan.planId, 'bulk-job:readback-dedup');

    const readbackTree = {
      frontText: 'Mini Bulk Import Test — Test 07',
      plainText: 'Mini Bulk Import Test — Test 07',
      children: [
        {
          frontText: 'Section A',
          plainText: 'Section A',
          children: [{ frontText: 'Formula: A=Z+N.', plainText: 'Formula: A=Z+N.' }],
        },
        {
          frontText: 'Section B',
          plainText: 'Section B',
          children: [{
            frontText: 'Anchor: TEST_07_BULK_IMPORT_VERIFICATION_ANCHOR.',
            plainText: 'Anchor: TEST_07_BULK_IMPORT_VERIFICATION_ANCHOR.',
          }],
        },
      ],
    };

    const report = verifyBulkImportFinalReadback({ job, readbackTree });
    expect(report.ok).toBe(true);
    expect(report.structure.duplicateSectionTitles).toEqual([]);
    expect(report.checks.noDuplicateChunkContent).toBe(true);
  });

  test('detects Bullet B and formula moved under Bullet A in final readback', () => {
    const store = new BulkImportJobStore();
    const source = [
      '# Tiny Bulk Import Test',
      '',
      'Alpha source sentence.',
      '',
      '## Section A',
      '',
      '- Bullet A',
      '- Bullet B',
      '',
      'Formula: $E=mc^2$',
    ].join('\n');
    const plan = store.savePlan(planNoteImport({
      sourceText: source,
      targetRootId: 'Plugin Test',
      rootTitle: 'Tiny Bulk Import Test',
      chapterTitle: 'Tiny Bulk Import Test',
      options: { maxCharsPerChunk: 500, maxRemsPerChunk: 30 },
    }));
    const job = store.createJob(plan.planId, 'bulk-job:wrong-bullet-parent');
    const sectionChunk = job.chunks.find((chunk) => chunk.sectionTitle === 'Section A');

    const wrongTree = {
      plainText: 'Tiny Bulk Import Test',
      children: [
        {
          plainText: 'Chapter introduction',
          children: [{ plainText: 'Alpha source sentence.' }],
        },
        {
          remId: 'section-a-rem',
          plainText: 'Section A',
          children: [
            {
              remId: 'bullet-a-rem',
              plainText: 'Bullet A',
              children: [
                {
                  remId: 'bullet-b-rem',
                  plainText: 'Bullet B',
                  children: [{ remId: 'formula-rem', plainText: 'Formula: $E=mc^2$' }],
                },
              ],
            },
          ],
        },
      ],
    };

    const report = verifyBulkImportFinalReadback({ job, readbackTree: wrongTree });
    expect(report.ok).toBe(false);
    expect(report.wrongParentChunks).toEqual(expect.arrayContaining([sectionChunk?.chunkId]));
    expect(report.hierarchyMismatches).toEqual(expect.arrayContaining([
      expect.objectContaining({
        chunkId: sectionChunk?.chunkId,
        semanticText: 'Bullet B',
        sourceSpan: { startLine: 3, endLine: 3 },
        expectedParentRemId: 'section-a-rem',
        actualParentRemId: 'bullet-a-rem',
        remId: 'bullet-b-rem',
      }),
    ]));
    expect(report.warnings.join(' ')).toContain('Bullet B');
  });
});

describe('bulk import job store', () => {
  test('creates resumable memory job and skips verified chunks', () => {
    const store = new BulkImportJobStore();
    const plan = store.savePlan(planNoteImport({
      sourceText: chapter,
      targetRootId: 'Plugin Test',
      options: { maxCharsPerChunk: 160, maxRemsPerChunk: 5 },
    }));
    const job = store.createJob(plan.planId, 'bulk-job:test');
    expect(job.storageDurability).toBe('memory_only');
    const first = store.nextRunnableChunk(job.jobId);
    expect(first?.status).toBe('pending');

    store.updateChunk(job.jobId, first?.chunkId ?? '', {
      status: 'verified',
      verificationStatus: 'passed',
      createdRemIds: ['r1'],
    });
    const next = store.nextRunnableChunk(job.jobId);
    expect(next?.chunkId).not.toBe(first?.chunkId);
    expect(store.progress(job.jobId).chunksVerified).toBe(1);
  });

  test('blocks source mutation after planning', () => {
    const store = new BulkImportJobStore();
    const plan = store.savePlan(planNoteImport({
      sourceText: chapter,
      targetRootId: 'Plugin Test',
    }));
    const job = store.createJob(plan.planId, 'bulk-job:mutation-test');
    const first = store.nextRunnableChunk(job.jobId);
    expect(() => store.updateChunk(job.jobId, first?.chunkId ?? '', {
      sourceText: 'changed',
    })).toThrow(/Cannot change chunk sourceText/);
  });

  test('rejects ambiguous direct promotion from partial or failed to verified', () => {
    const store = new BulkImportJobStore();
    const plan = store.savePlan(planNoteImport({
      sourceText: chapter,
      targetRootId: 'Plugin Test',
      options: { maxCharsPerChunk: 160, maxRemsPerChunk: 5 },
    }));
    const job = store.createJob(plan.planId, 'bulk-job:transition-guard');
    const first = store.nextRunnableChunk(job.jobId);
    expect(first).toBeTruthy();

    store.beginChunkAttempt(job.jobId, first?.chunkId ?? '', {
      attemptId: 'transition-attempt',
      operationId: 'transition-operation',
      expectedParent: first?.expectedParent ?? 'Plugin Test',
    });
    store.finishChunkAttempt(job.jobId, first?.chunkId ?? '', {
      attemptId: 'transition-attempt',
      state: 'unknown',
      status: 'partial',
      verificationStatus: 'partial',
      error: 'Readback missing.',
    });

    expect(() => store.updateChunk(job.jobId, first?.chunkId ?? '', {
      status: 'verified',
    })).toThrow(/Cannot transition bulk import chunk/);

    store.updateChunk(job.jobId, first?.chunkId ?? '', {
      status: 'failed',
      verificationStatus: 'failed',
      error: 'Plugin disconnected.',
    });

    expect(() => store.updateChunk(job.jobId, first?.chunkId ?? '', {
      status: 'verified',
      verificationStatus: 'passed',
    })).toThrow(/Cannot transition bulk import chunk/);
  });

  test('rejects failure classification for a chunk that was never attempted', () => {
    const store = new BulkImportJobStore();
    const plan = store.savePlan(planNoteImport({
      sourceText: chapter,
      targetRootId: 'Plugin Test',
      options: { maxCharsPerChunk: 160, maxRemsPerChunk: 5 },
    }));
    const job = store.createJob(plan.planId, 'bulk-job:never-attempted');
    const first = store.nextRunnableChunk(job.jobId);

    expect(() => store.updateChunk(job.jobId, first?.chunkId ?? '', {
      status: 'partial',
      verificationStatus: 'partial',
      error: 'A verifier must not classify untouched work.',
    })).toThrow(/never attempted/i);
  });

  test('does not select attempted-unknown chunks for blind resume', () => {
    const store = new BulkImportJobStore();
    const plan = store.savePlan(planNoteImport({
      sourceText: chapter,
      targetRootId: 'Plugin Test',
      options: { maxCharsPerChunk: 160, maxRemsPerChunk: 5 },
    }));
    const job = store.createJob(plan.planId, 'bulk-job:unknown-outcome');
    const first = store.nextRunnableChunk(job.jobId);
    expect(first).toBeTruthy();

    store.beginChunkAttempt(job.jobId, first?.chunkId ?? '', {
      attemptId: 'attempt-1',
      operationId: 'operation-1',
      expectedParent: first?.expectedParent ?? 'Plugin Test',
    });
    store.finishChunkAttempt(job.jobId, first?.chunkId ?? '', {
      attemptId: 'attempt-1',
      state: 'unknown',
      status: 'partial_needs_verification',
      verificationStatus: 'partial',
      error: 'Acknowledgement was lost.',
    });

    expect(store.nextRunnableChunk(job.jobId)?.chunkId).not.toBe(first?.chunkId);
    expect(store.firstReconciliationRequiredChunk(job.jobId)?.chunkId).toBe(first?.chunkId);
  });

  test('rejects manual job completion while unsafe chunks remain', () => {
    const store = new BulkImportJobStore();
    const plan = store.savePlan(planNoteImport({
      sourceText: chapter,
      targetRootId: 'Plugin Test',
      options: { maxCharsPerChunk: 160, maxRemsPerChunk: 5 },
    }));
    const job = store.createJob(plan.planId, 'bulk-job:job-transition-guard');
    const first = store.nextRunnableChunk(job.jobId);
    expect(first).toBeTruthy();
    store.beginChunkAttempt(job.jobId, first?.chunkId ?? '', {
      attemptId: 'completion-attempt',
      operationId: 'completion-operation',
      expectedParent: first?.expectedParent ?? 'Plugin Test',
    });
    store.finishChunkAttempt(job.jobId, first?.chunkId ?? '', {
      attemptId: 'completion-attempt',
      state: 'unknown',
      status: 'failed',
      verificationStatus: 'failed',
      error: 'Plugin disconnected.',
    });

    expect(() => store.updateJobStatus(job.jobId, 'completed', 'Manual completion should fail.'))
      .toThrow(/Cannot complete bulk import job/);
  });

  test('storage provider round-trips bulk plans and jobs with durability label', async () => {
    const storage = new MemoryStorageProvider();
    await storage.initialize();
    const store = new BulkImportJobStore();
    const plan = store.savePlan(planNoteImport({
      sourceText: chapter,
      targetRootId: 'Plugin Test',
      options: { maxCharsPerChunk: 160, maxRemsPerChunk: 5 },
    }));
    await storage.saveBulkImportPlan(plan);
    const storedPlan = await storage.getBulkImportPlan(plan.planId);
    expect(storedPlan?.sourceHash).toBe(plan.sourceHash);

    const job = store.createJob(plan.planId, 'bulk-job:storage-round-trip');
    await storage.saveBulkImportJob(job);
    const storedJob = await storage.getBulkImportJob(job.jobId);
    expect(storedJob?.jobId).toBe(job.jobId);
    expect(storedJob?.storageDurability).toBe('memory_only');
    expect(storedJob?.chunks).toHaveLength(job.chunks.length);
    await storage.close();
  });

  test('storage rejects a stale bulk-import writer with expected and actual revisions', async () => {
    const storage = new MemoryStorageProvider();
    await storage.initialize();
    const store = new BulkImportJobStore();
    const plan = store.savePlan(planNoteImport({
      sourceText: chapter,
      targetRootId: 'Plugin Test',
    }));
    const job = store.createJob(plan.planId, 'bulk-job:cas');
    const firstSave = await storage.saveBulkImportJob(job, { expectedRevision: 0 });
    const writerA = structuredClone(firstSave);
    const writerB = structuredClone(firstSave);
    writerA.lastError = 'writer-a';
    writerB.lastError = 'writer-b';

    const secondSave = await storage.saveBulkImportJob(writerA, { expectedRevision: firstSave.revision });
    expect(secondSave.revision).toBe(firstSave.revision + 1);
    await expect(storage.saveBulkImportJob(writerB, { expectedRevision: firstSave.revision }))
      .rejects.toMatchObject({
        code: 'BULK_IMPORT_REVISION_CONFLICT',
        expectedRevision: firstSave.revision,
        actualRevision: secondSave.revision,
      });
    await storage.close();
  });

  test('legacy ambiguous job JSON migrates conservatively and remains non-runnable', async () => {
    const storage = new MemoryStorageProvider();
    await storage.initialize();
    const store = new BulkImportJobStore();
    const plan = store.savePlan(planNoteImport({
      sourceText: chapter,
      targetRootId: 'Plugin Test',
    }));
    const job = store.createJob(plan.planId, 'bulk-job:legacy-migration');
    const legacy = structuredClone(job) as any;
    delete legacy.revision;
    legacy.chunks[0].status = 'running';
    delete legacy.chunks[0].attempts;
    delete legacy.chunks[0].reconciliationStatus;
    await storage.saveBulkImportJob(legacy, { expectedRevision: 0 });

    const migrated = await storage.getBulkImportJob(job.jobId);
    expect(migrated?.chunks[0]).toMatchObject({
      reconciliationStatus: 'required',
    });
    expect(migrated?.chunks[0].attempts[0]).toMatchObject({
      state: 'unknown',
      provenance: 'legacy_migration',
      semanticHash: expect.stringMatching(/^fnv1a32:/),
      stage: 'chunk_write',
    });
    expect(migrated?.schemaVersion).toBe(2);
    const restartedStore = new BulkImportJobStore();
    restartedStore.saveJob(migrated as any);
    expect(restartedStore.nextRunnableChunk(job.jobId)?.chunkId).not.toBe(migrated?.chunks[0].chunkId);
    await storage.close();
  });
});
