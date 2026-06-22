import { describe, expect, test } from 'vitest';
import {
  planNoteImport,
  stableBulkImportHash,
  verifyBulkImportSourceText,
} from '../shared/bridge/bulk-import';
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
