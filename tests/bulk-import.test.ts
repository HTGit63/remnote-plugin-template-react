import { describe, expect, test } from 'vitest';
import {
  expectedBulkImportReadbackText,
  extractMarkedSourceText,
  planNoteImport,
  stableBulkImportHash,
  verifyBulkImportFinalReadback,
  verifyBulkImportSourceText,
} from '../shared/bridge/bulk-import';
import {
  markdownImportOutputTextFromTree,
  parseMarkdownImportPlan,
  verifyMarkdownSourceFidelity,
} from '../shared/bridge/markdown-importer';
import { BulkImportJobStore } from '../server/src/bulk-import/job-store';

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
});
