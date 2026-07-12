import { describe, expect, test } from 'vitest';
import { planNoteImport } from '../shared/bridge/bulk-import';
import { BulkImportJobStore } from '../server/src/bulk-import/job-store';
import {
  bulkImportOwnerId,
  isOwnedBulkImportRecord,
  publicBulkImportJob,
} from '../server/src/bulk-import/access';

describe('bulk import access module', () => {
  test('derives stable principal identity and rejects foreign records', () => {
    const principal = {
      subject: 'user-1',
      authMode: 'hosted_oauth' as const,
      scopeGrants: ['bridge:read' as const],
    };
    const ownerId = bulkImportOwnerId(principal);

    expect(ownerId).toBe('hosted_oauth:user-1');
    expect(isOwnedBulkImportRecord({ ownerId }, ownerId)).toBe(true);
    expect(isOwnedBulkImportRecord({ ownerId: 'hosted_oauth:user-2' }, ownerId)).toBe(false);
    expect(isOwnedBulkImportRecord(undefined, ownerId)).toBe(false);
  });

  test('projects job status without source or owner data', () => {
    const ownerId = 'local_bridge_token:local-remnote-bridge';
    const plan = planNoteImport({
      ownerId,
      sourceText: '# Private\n\n## Section\n\nSensitive source text.',
      targetRootId: 'root',
    });
    const store = new BulkImportJobStore();
    store.savePlan(plan);
    const job = store.createJob(plan.planId, 'bulk-job:access-test');
    const projected = publicBulkImportJob(job);
    const json = JSON.stringify(projected);

    expect(projected.jobId).toBe(job.jobId);
    expect(projected.chunks).toHaveLength(job.chunks.length);
    expect(json).not.toMatch(/ownerId|sourceText|expectedSourceText|Sensitive source text/);
  });
});
