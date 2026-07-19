import { randomUUID } from 'node:crypto';
import type {
  BulkImportCheckpoint,
  BulkImportChunk,
  BulkImportChunkAttempt,
  BulkImportChunkStatus,
  BulkImportJob,
  BulkImportJobStatus,
  BulkImportPlan,
} from '../../../shared/bridge/bulk-import.js';
import {
  canTransitionBulkImportChunkStatus,
  bulkChapterIdempotencyKey,
  bulkChunkId,
  bulkChunkIdempotencyKey,
  bulkImportRootIdempotencyKey,
  bulkSectionIdempotencyKey,
  isBulkImportChunkRunnable,
  isBulkImportJobComplete,
  migrateBulkImportJob,
  summarizeBulkImportProgress,
} from '../../../shared/bridge/bulk-import.js';

type ChunkPatch = Partial<Omit<BulkImportChunk, 'chunkId' | 'sectionKey' | 'chunkIndex' | 'sourceHash'>>;
type BulkImportJobStoreOptions = {
  storageDurability?: BulkImportJob['storageDurability'];
};

export class BulkImportJobStore {
  private plans = new Map<string, BulkImportPlan>();
  private jobs = new Map<string, BulkImportJob>();
  private readonly storageDurability: BulkImportJob['storageDurability'];

  constructor(options: BulkImportJobStoreOptions = {}) {
    this.storageDurability = options.storageDurability ?? 'memory_only';
  }

  savePlan(plan: BulkImportPlan): BulkImportPlan {
    this.plans.set(plan.planId, plan);
    return plan;
  }

  getPlan(planId: string): BulkImportPlan | null {
    return this.plans.get(planId) ?? null;
  }

  saveJob(job: BulkImportJob): BulkImportJob {
    const migrated = migrateBulkImportJob(job);
    this.jobs.set(migrated.jobId, migrated);
    return migrated;
  }

  createJob(
    planId: string,
    requestedJobId?: string,
    storageDurability: BulkImportJob['storageDurability'] = this.storageDurability
  ): BulkImportJob {
    const plan = this.getPlan(planId);
    if (!plan) {
      throw new Error(`Unknown import plan: ${planId}`);
    }
    const jobId = requestedJobId?.trim() || `bulk-job:${randomUUID()}`;
    if (this.jobs.has(jobId)) {
      return this.jobs.get(jobId) as BulkImportJob;
    }
    const now = new Date().toISOString();
    const chunks = plan.chunks.map((chunk) => ({
      ...chunk,
      chunkId: bulkChunkId(jobId, chunk.sectionKey, chunk.chunkIndex, chunk.sourceHash),
      idempotencyKey: bulkChunkIdempotencyKey(jobId, chunk.sectionKey, chunk.chunkIndex, chunk.sourceHash),
    }));
    const chunksByOriginalId = new Map(plan.chunks.map((chunk, index) => [chunk.chunkId, chunks[index]]));
    const sections = plan.sections.map((section) => ({
      ...section,
      chunks: section.chunks.map((chunk) => chunksByOriginalId.get(chunk.chunkId) ?? chunk),
    }));
    const job: BulkImportJob = {
      schemaVersion: 2,
      jobId,
      revision: 0,
      planId,
      ownerId: plan.ownerId,
      sourceName: plan.sourceName,
      sourceHash: plan.sourceHash,
      sourceMetadata: plan.sourceMetadata,
      plannedSourceLength: plan.plannedSourceLength,
      extractedSourceLength: plan.extractedSourceLength,
      targetRootId: plan.targetRootId,
      importRootTitle: plan.importRootTitle,
      importRootIdempotencyKey: plan.importRootTitle ? bulkImportRootIdempotencyKey(jobId, plan.sourceHash) : undefined,
      chapterTitle: plan.chapterTitle,
      chapterIdempotencyKey: bulkChapterIdempotencyKey(jobId, plan.sourceHash),
      status: 'planned',
      storageDurability,
      sections,
      chunks,
      checkpoints: [],
      events: [
        {
          at: now,
          status: 'planned',
          message: storageDurability === 'memory_only'
            ? 'Bulk import job created. Memory storage is not durable across server restart.'
            : 'Bulk import job created. Persistent storage is configured.',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.set(jobId, job);
    return job;
  }

  getJob(jobId: string): BulkImportJob | null {
    return this.jobs.get(jobId) ?? null;
  }

  listActiveJobs(): BulkImportJob[] {
    return Array.from(this.jobs.values()).filter((job) =>
      ['planned', 'running', 'paused', 'partial', 'failed', 'needs_manual_review'].includes(job.status)
    );
  }

  appendEvent(jobId: string, event: Omit<BulkImportCheckpoint, 'at'> & { at?: string }): BulkImportJob {
    const job = this.requireJob(jobId);
    job.events.push({ ...event, at: event.at ?? new Date().toISOString() });
    job.updatedAt = new Date().toISOString();
    return job;
  }

  saveCheckpoint(jobId: string, checkpoint: Omit<BulkImportCheckpoint, 'at'> & { at?: string }): BulkImportJob {
    const job = this.requireJob(jobId);
    const entry = { ...checkpoint, at: checkpoint.at ?? new Date().toISOString() };
    job.checkpoints.push(entry);
    job.events.push(entry);
    job.updatedAt = entry.at;
    return job;
  }

  updateJobStatus(jobId: string, status: BulkImportJobStatus, message?: string): BulkImportJob {
    const job = this.requireJob(jobId);
    if (job.status === 'cancelled' && status !== 'cancelled') {
      throw new Error('Cannot transition cancelled bulk import job. Create a new job to continue.');
    }
    if (status === 'completed' && !isBulkImportJobComplete(job)) {
      throw new Error('Cannot complete bulk import job while unsafe chunks remain.');
    }
    const now = new Date().toISOString();
    job.status = status;
    job.updatedAt = now;
    if (status === 'completed') {
      job.completedAt = now;
    }
    if (status === 'cancelled') {
      job.cancelledAt = now;
    }
    if (message) {
      job.events.push({ at: now, status, message });
    }
    return job;
  }

  updateChunk(jobId: string, chunkId: string, patch: ChunkPatch & { status?: BulkImportChunkStatus }): BulkImportJob {
    const job = this.requireJob(jobId);
    const chunk = job.chunks.find((candidate) => candidate.chunkId === chunkId);
    if (!chunk) {
      throw new Error(`Unknown import chunk: ${chunkId}`);
    }
    if (patch.sourceText && patch.sourceText !== chunk.sourceText) {
      throw new Error('Cannot change chunk sourceText after planning.');
    }
    if (patch.expectedSourceText && patch.expectedSourceText !== chunk.expectedSourceText) {
      throw new Error('Cannot change chunk expectedSourceText after planning.');
    }
    if (
      chunk.status === 'pending' &&
      (chunk.attempts?.length ?? 0) === 0 &&
      patch.status &&
      ['partial', 'partial_needs_verification', 'written_not_verified', 'failed', 'needs_manual_review'].includes(patch.status)
    ) {
      throw new Error(`Cannot classify bulk import chunk ${chunk.chunkId} as ${patch.status}; it was never attempted.`);
    }
    const nextChunk: BulkImportChunk = {
      ...chunk,
      ...patch,
      createdRemIds: patch.createdRemIds ?? chunk.createdRemIds,
      updatedRemIds: patch.updatedRemIds ?? chunk.updatedRemIds,
    };
    if (
      patch.status &&
      !canTransitionBulkImportChunkStatus(chunk.status, patch.status, nextChunk)
    ) {
      throw new Error(`Cannot transition bulk import chunk ${chunk.chunkId} from ${chunk.status} to ${patch.status}.`);
    }
    Object.assign(chunk, patch);
    for (const section of job.sections) {
      const sectionChunk = section.chunks.find((candidate) => candidate.chunkId === chunkId);
      if (sectionChunk) {
        Object.assign(sectionChunk, patch);
      }
    }
    job.updatedAt = new Date().toISOString();
    this.refreshJobStatus(job);
    return job;
  }

  nextRunnableChunk(jobId: string): BulkImportChunk | null {
    const job = this.requireJob(jobId);
    if (job.status === 'cancelled' || job.status === 'completed' || job.status === 'needs_manual_review') {
      return null;
    }
    return job.chunks.find((chunk) => isBulkImportChunkRunnable(chunk.status)) ?? null;
  }

  firstReconciliationRequiredChunk(jobId: string): BulkImportChunk | null {
    const job = this.requireJob(jobId);
    return job.chunks.find((chunk) => chunk.reconciliationStatus === 'required') ?? null;
  }

  beginChunkAttempt(
    jobId: string,
    chunkId: string,
    input: Pick<BulkImportChunkAttempt, 'attemptId' | 'operationId' | 'expectedParent'>
  ): BulkImportJob {
    const job = this.requireJob(jobId);
    const chunk = job.chunks.find((candidate) => candidate.chunkId === chunkId);
    if (!chunk) {
      throw new Error(`Unknown import chunk: ${chunkId}`);
    }
    if (chunk.status !== 'pending') {
      throw new Error(`Cannot dispatch bulk import chunk ${chunkId} from ${chunk.status}; reconcile it first.`);
    }
    const startedAt = new Date().toISOString();
    const attempt: BulkImportChunkAttempt = {
      ...input,
      state: 'dispatching',
      sourceHash: chunk.sourceHash,
      semanticHash: chunk.sourceManifest.semanticHash,
      idempotencyKey: chunk.idempotencyKey,
      stage: 'chunk_write',
      startedAt,
      hierarchyCreatedRemIds: [],
      createdRemIds: [],
      updatedRemIds: [],
      provenance: 'runtime',
    };
    return this.updateChunk(jobId, chunkId, {
      status: 'running',
      startedAt,
      attempts: [...chunk.attempts, attempt],
      reconciliationStatus: 'not_required',
      reconciliationProvenance: undefined,
      error: undefined,
    });
  }

  finishChunkAttempt(
    jobId: string,
    chunkId: string,
    input: {
      attemptId: string;
      state: BulkImportChunkAttempt['state'];
      status: BulkImportChunkStatus;
      verificationStatus: BulkImportChunk['verificationStatus'];
      hierarchyCreatedRemIds?: string[];
      createdRemIds?: string[];
      updatedRemIds?: string[];
      pluginVerificationPassed?: boolean;
      readbackVerificationPassed?: boolean;
      error?: string;
      errorCode?: string;
      lifecycle?: unknown[];
      finishedAt?: string;
    }
  ): BulkImportJob {
    const job = this.requireJob(jobId);
    const chunk = job.chunks.find((candidate) => candidate.chunkId === chunkId);
    if (!chunk) {
      throw new Error(`Unknown import chunk: ${chunkId}`);
    }
    const attemptIndex = chunk.attempts.findIndex((attempt) => attempt.attemptId === input.attemptId);
    if (attemptIndex < 0) {
      throw new Error(`Unknown import attempt: ${input.attemptId}`);
    }
    const finishedAt = input.finishedAt ?? new Date().toISOString();
    const hierarchyCreatedRemIds = Array.from(new Set([
      ...chunk.hierarchyCreatedRemIds,
      ...(input.hierarchyCreatedRemIds ?? []),
    ]));
    const createdRemIds = Array.from(new Set([...chunk.createdRemIds, ...(input.createdRemIds ?? [])]));
    const updatedRemIds = Array.from(new Set([...chunk.updatedRemIds, ...(input.updatedRemIds ?? [])]));
    const attempts = chunk.attempts.map((attempt, index) => index === attemptIndex
      ? {
          ...attempt,
          state: input.state,
          finishedAt,
          hierarchyCreatedRemIds: Array.from(new Set([
            ...attempt.hierarchyCreatedRemIds,
            ...(input.hierarchyCreatedRemIds ?? []),
          ])),
          createdRemIds: Array.from(new Set([...attempt.createdRemIds, ...(input.createdRemIds ?? [])])),
          updatedRemIds: Array.from(new Set([...attempt.updatedRemIds, ...(input.updatedRemIds ?? [])])),
          pluginVerificationPassed: input.pluginVerificationPassed ?? attempt.pluginVerificationPassed,
          readbackVerificationPassed: input.readbackVerificationPassed ?? attempt.readbackVerificationPassed,
          error: input.error,
          errorCode: input.errorCode,
          lifecycle: input.lifecycle,
        }
      : attempt);
    return this.updateChunk(jobId, chunkId, {
      status: input.status,
      verificationStatus: input.verificationStatus,
      attempts,
      hierarchyCreatedRemIds,
      createdRemIds,
      updatedRemIds,
      finishedAt,
      reconciliationStatus: input.state === 'unknown'
        ? 'required'
        : input.state === 'failed_before_write'
          ? 'required'
          : input.status === 'verified'
            ? 'reconciled_written'
            : 'required',
      error: input.error,
    });
  }

  reconcileChunk(
    jobId: string,
    chunkId: string,
    input: {
      outcome: 'written' | 'not_written' | 'manual_review';
      createdRemIds?: string[];
      updatedRemIds?: string[];
      provenance: string;
    }
  ): BulkImportJob {
    const job = this.requireJob(jobId);
    const chunk = job.chunks.find((candidate) => candidate.chunkId === chunkId);
    if (!chunk) {
      throw new Error(`Unknown import chunk: ${chunkId}`);
    }
    if (chunk.reconciliationStatus !== 'required') {
      throw new Error(`Chunk ${chunkId} does not require reconciliation.`);
    }
    const createdRemIds = Array.from(new Set([...chunk.createdRemIds, ...(input.createdRemIds ?? [])]));
    const updatedRemIds = Array.from(new Set([...chunk.updatedRemIds, ...(input.updatedRemIds ?? [])]));
    const attempts = chunk.attempts.map((attempt, index) => index === chunk.attempts.length - 1
      ? {
          ...attempt,
          state: input.outcome === 'written' ? 'acknowledged' as const : attempt.state,
          createdRemIds: Array.from(new Set([...attempt.createdRemIds, ...(input.createdRemIds ?? [])])),
          updatedRemIds: Array.from(new Set([...attempt.updatedRemIds, ...(input.updatedRemIds ?? [])])),
        }
      : attempt);
    if (input.outcome === 'manual_review') {
      return this.updateChunk(jobId, chunkId, {
        status: 'needs_manual_review',
        verificationStatus: 'not_verifiable',
        reconciliationStatus: 'manual_review',
        reconciliationProvenance: input.provenance,
        attempts,
        createdRemIds,
        updatedRemIds,
      });
    }
    return this.updateChunk(jobId, chunkId, {
      status: input.outcome === 'written' ? 'verified' : 'pending',
      verificationStatus: input.outcome === 'written' ? 'passed' : 'not_verifiable',
      reconciliationStatus: input.outcome === 'written' ? 'reconciled_written' : 'reconciled_not_written',
      reconciliationProvenance: input.provenance,
      attempts,
      createdRemIds,
      updatedRemIds,
      error: undefined,
    });
  }

  recordChapterRoot(jobId: string, chapterRootRemId: string): BulkImportJob {
    const job = this.requireJob(jobId);
    job.chapterRootRemId = chapterRootRemId;
    for (const chunk of job.chunks) {
      chunk.chapterRootRemId = chapterRootRemId;
    }
    for (const section of job.sections) {
      for (const chunk of section.chunks) {
        chunk.chapterRootRemId = chapterRootRemId;
      }
    }
    job.updatedAt = new Date().toISOString();
    return job;
  }

  recordImportRoot(jobId: string, importRootRemId: string): BulkImportJob {
    const job = this.requireJob(jobId);
    job.importRootRemId = importRootRemId;
    for (const chunk of job.chunks) {
      chunk.importRootRemId = importRootRemId;
    }
    for (const section of job.sections) {
      for (const chunk of section.chunks) {
        chunk.importRootRemId = importRootRemId;
      }
    }
    job.updatedAt = new Date().toISOString();
    return job;
  }

  recordSectionRoot(jobId: string, sectionKey: string, sectionRootRemId: string): BulkImportJob {
    const job = this.requireJob(jobId);
    const section = job.sections.find((candidate) => candidate.sectionKey === sectionKey);
    if (!section) {
      throw new Error(`Unknown import section: ${sectionKey}`);
    }
    section.sectionRootRemId = sectionRootRemId;
    section.idempotencyKey = section.idempotencyKey ?? bulkSectionIdempotencyKey(jobId, section.sectionKey, section.sourceHash);
    for (const chunk of job.chunks.filter((candidate) => candidate.sectionKey === sectionKey)) {
      chunk.sectionRootRemId = sectionRootRemId;
      chunk.chunkParentRemId = sectionRootRemId;
      chunk.expectedParent = sectionRootRemId;
    }
    for (const chunk of section.chunks) {
      chunk.sectionRootRemId = sectionRootRemId;
      chunk.chunkParentRemId = sectionRootRemId;
      chunk.expectedParent = sectionRootRemId;
    }
    job.updatedAt = new Date().toISOString();
    return job;
  }

  cancelJob(jobId: string): BulkImportJob {
    return this.updateJobStatus(jobId, 'cancelled', 'Job cancelled. No content was deleted.');
  }

  progress(jobId: string) {
    return summarizeBulkImportProgress(this.requireJob(jobId));
  }

  private requireJob(jobId: string): BulkImportJob {
    const job = this.getJob(jobId);
    if (!job) {
      throw new Error(`Unknown import job: ${jobId}`);
    }
    return job;
  }

  private refreshJobStatus(job: BulkImportJob): void {
    if (job.status === 'cancelled') {
      return;
    }
    if (job.chunks.some((chunk) => chunk.status === 'needs_manual_review')) {
      job.status = 'needs_manual_review';
      return;
    }
    if (job.chunks.some((chunk) =>
      chunk.status === 'partial' ||
      chunk.status === 'partial_needs_verification' ||
      chunk.status === 'written_not_verified' ||
      chunk.status === 'failed'
    )) {
      job.status = 'partial';
      return;
    }
    if (job.chunks.every((chunk) =>
      (chunk.status === 'verified' || chunk.status === 'skipped_already_verified') &&
      chunk.verificationStatus === 'passed'
    )) {
      job.status = 'completed';
      job.completedAt = job.completedAt ?? new Date().toISOString();
      return;
    }
    if (job.chunks.some((chunk) => chunk.status === 'running' || chunk.status === 'written')) {
      job.status = 'running';
      return;
    }
    job.status = 'planned';
  }
}

export const bulkImportJobStore = new BulkImportJobStore();
