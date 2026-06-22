import { randomUUID } from 'node:crypto';
import type {
  BulkImportCheckpoint,
  BulkImportChunk,
  BulkImportChunkStatus,
  BulkImportJob,
  BulkImportJobStatus,
  BulkImportPlan,
} from '../../../shared/bridge/bulk-import.js';
import {
  bulkChunkId,
  bulkChunkIdempotencyKey,
  summarizeBulkImportProgress,
} from '../../../shared/bridge/bulk-import.js';

type ChunkPatch = Partial<Omit<BulkImportChunk, 'chunkId' | 'sectionKey' | 'chunkIndex' | 'sourceHash'>>;

export class BulkImportJobStore {
  private plans = new Map<string, BulkImportPlan>();
  private jobs = new Map<string, BulkImportJob>();

  savePlan(plan: BulkImportPlan): BulkImportPlan {
    this.plans.set(plan.planId, plan);
    return plan;
  }

  getPlan(planId: string): BulkImportPlan | null {
    return this.plans.get(planId) ?? null;
  }

  createJob(planId: string, requestedJobId?: string): BulkImportJob {
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
      jobId,
      planId,
      sourceName: plan.sourceName,
      sourceHash: plan.sourceHash,
      targetRootId: plan.targetRootId,
      chapterTitle: plan.chapterTitle,
      status: 'planned',
      storageDurability: 'memory_only',
      sections,
      chunks,
      checkpoints: [],
      events: [
        {
          at: now,
          status: 'planned',
          message: 'Bulk import job created. Memory storage is not durable across server restart.',
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
    return job.chunks.find((chunk) =>
      ['pending', 'partial', 'failed'].includes(chunk.status)
    ) ?? null;
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
    if (job.chunks.some((chunk) => chunk.status === 'partial' || chunk.status === 'failed')) {
      job.status = 'partial';
      return;
    }
    if (job.chunks.every((chunk) => chunk.status === 'verified' || chunk.status === 'skipped_already_verified')) {
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
