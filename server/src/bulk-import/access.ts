import type { BulkImportChunk, BulkImportJob } from '../../../shared/bridge/bulk-import.js';
import { summarizeBulkImportProgress } from '../../../shared/bridge/bulk-import.js';
import type { AuthenticatedPrincipal } from '../auth/types.js';

export function bulkImportOwnerId(principal?: AuthenticatedPrincipal): string {
  return principal ? `${principal.authMode}:${principal.subject}` : 'unauthenticated';
}

export function isOwnedBulkImportRecord<T extends { ownerId?: string }>(
  record: T | null | undefined,
  ownerId: string
): record is T {
  return Boolean(record && record.ownerId === ownerId);
}

export function publicBulkImportChunk(chunk: BulkImportChunk) {
  return {
    chunkId: chunk.chunkId,
    sectionKey: chunk.sectionKey,
    sectionTitle: chunk.sectionTitle,
    chunkIndex: chunk.chunkIndex,
    status: chunk.status,
    verificationStatus: chunk.verificationStatus,
    charCount: chunk.charCount,
    estimatedRemCount: chunk.estimatedRemCount,
    expectedSourceHash: chunk.expectedSourceHash,
    createdRemIds: chunk.createdRemIds,
    updatedRemIds: chunk.updatedRemIds,
    importRootRemId: chunk.importRootRemId,
    chapterRootRemId: chunk.chapterRootRemId,
    sectionRootRemId: chunk.sectionRootRemId,
    chunkParentRemId: chunk.chunkParentRemId,
    durationMs: chunk.durationMs,
    error: chunk.error,
    idempotencyKey: chunk.idempotencyKey,
  };
}

export function publicBulkImportJob(job: BulkImportJob) {
  return {
    jobId: job.jobId,
    planId: job.planId,
    sourceName: job.sourceName,
    sourceHash: job.sourceHash,
    sourceMetadata: job.sourceMetadata,
    plannedSourceLength: job.plannedSourceLength,
    extractedSourceLength: job.extractedSourceLength,
    targetRootId: job.targetRootId,
    importRootTitle: job.importRootTitle,
    importRootRemId: job.importRootRemId,
    chapterTitle: job.chapterTitle,
    chapterRootRemId: job.chapterRootRemId,
    status: job.status,
    storageDurability: job.storageDurability,
    sections: job.sections.map((section) => ({
      sectionKey: section.sectionKey,
      title: section.title,
      sourceHash: section.sourceHash,
      sectionRootRemId: section.sectionRootRemId,
      chunkCount: section.chunkCount,
      chunks: section.chunks.map(publicBulkImportChunk),
    })),
    chunks: job.chunks.map(publicBulkImportChunk),
    checkpoints: job.checkpoints,
    events: job.events,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    completedAt: job.completedAt,
    cancelledAt: job.cancelledAt,
    lastError: job.lastError,
    progress: summarizeBulkImportProgress(job),
  };
}
