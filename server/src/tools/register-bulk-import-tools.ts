import { z } from 'zod';
import {
  planNoteImport,
  summarizeBulkImportProgress,
  verifyBulkImportSourceText,
  type BulkImportChunk,
} from '../../../shared/bridge/bulk-import.js';
import { BRIDGE_TOOL_OUTPUT_SCHEMA } from './schemas.js';
import {
  estimateWriteTimeoutMs,
  type McpToolResult,
  type ToolRegistrationContext,
} from './tool-context.js';
import { bulkImportJobStore } from '../bulk-import/job-store.js';

const BULK_IMPORT_OPTIONS_SCHEMA = z.object({
  maxCharsPerChunk: z.number().int().min(500).max(24000).optional(),
  maxRemsPerChunk: z.number().int().min(1).max(120).optional(),
  maxDepth: z.number().int().min(1).max(12).optional(),
  maxChildrenPerParent: z.number().int().min(1).max(200).optional(),
}).optional();

const PLAN_IMPORT_INPUT_SCHEMA = z.object({
  sourceName: z.string().trim().max(256).optional(),
  sourceText: z.string().min(1).max(240000),
  targetRootId: z.string().trim().min(1).max(256),
  chapterSelector: z.string().trim().max(256).optional(),
  options: BULK_IMPORT_OPTIONS_SCHEMA,
});

function toolResult(
  text: string,
  structuredContent: Record<string, unknown>,
  isError = false
): McpToolResult {
  return {
    isError,
    content: [{ type: 'text', text }],
    structuredContent,
  };
}

function publicJob(jobId: string) {
  const job = bulkImportJobStore.getJob(jobId);
  if (!job) {
    throw new Error(`Unknown import job: ${jobId}`);
  }
  return {
    ...job,
    progress: summarizeBulkImportProgress(job),
  };
}

function chunkSummary(chunk: BulkImportChunk) {
  return {
    chunkId: chunk.chunkId,
    sectionKey: chunk.sectionKey,
    chunkIndex: chunk.chunkIndex,
    status: chunk.status,
    verificationStatus: chunk.verificationStatus,
    charCount: chunk.charCount,
    estimatedRemCount: chunk.estimatedRemCount,
    createdRemIds: chunk.createdRemIds,
    updatedRemIds: chunk.updatedRemIds,
    error: chunk.error,
    idempotencyKey: chunk.idempotencyKey,
  };
}

export function registerBulkImportTools({
  registerTool,
  callPlugin,
  timeoutBudgets,
}: ToolRegistrationContext): void {
  registerTool(
    'plan_note_import',
    {
      title: 'Plan note import',
      description: 'Plan a large Markdown note import into safe resumable chunks without writing to RemNote.',
      inputSchema: PLAN_IMPORT_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) => {
      try {
        const plan = planNoteImport(args);
        bulkImportJobStore.savePlan(plan);
        return toolResult('Note import plan created.', {
          ok: true,
          status: 'PASS',
          toolName: 'plan_note_import',
          planId: plan.planId,
          sourceHash: plan.sourceHash,
          targetRootId: plan.targetRootId,
          chapterTitle: plan.chapterTitle,
          sections: plan.sections.map((section) => ({
            sectionKey: section.sectionKey,
            title: section.title,
            chunkCount: section.chunkCount,
          })),
          estimatedChunks: plan.estimatedChunks,
          estimatedRems: plan.estimatedRems,
          warnings: plan.warnings,
          nextAction: 'call start_note_import_job with this planId',
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return toolResult(`${message}`, {
          ok: false,
          status: 'FAIL',
          toolName: 'plan_note_import',
          errorCode: 'INVALID_ARGS',
          errorMessage: message,
        }, true);
      }
    }
  );

  registerTool(
    'start_note_import_job',
    {
      title: 'Start note import job',
      description: 'Create a resumable import job from a saved plan. This does not write the full chapter.',
      inputSchema: z.object({
        planId: z.string().trim().min(1).max(256),
        jobId: z.string().trim().min(1).max(256).optional(),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ planId, jobId }) => {
      try {
        const job = bulkImportJobStore.createJob(planId, jobId);
        return toolResult('Note import job started.', {
          ok: true,
          status: 'PASS',
          toolName: 'start_note_import_job',
          jobId: job.jobId,
          jobStatus: job.status,
          targetRootId: job.targetRootId,
          chapterTitle: job.chapterTitle,
          storageDurability: job.storageDurability,
          warning: 'memory storage is not durable across server restart',
          progress: summarizeBulkImportProgress(job),
          nextAction: 'call run_note_import_job_step',
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return toolResult(message, {
          ok: false,
          status: 'FAIL',
          toolName: 'start_note_import_job',
          errorCode: 'INVALID_ARGS',
          errorMessage: message,
        }, true);
      }
    }
  );

  registerTool(
    'get_note_import_job_status',
    {
      title: 'Get note import job status',
      description: 'Return resumable progress for a note import job without writing.',
      inputSchema: z.object({ jobId: z.string().trim().min(1).max(256) }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ jobId }) => {
      try {
        return toolResult('Note import job status loaded.', {
          ok: true,
          status: 'PASS',
          toolName: 'get_note_import_job_status',
          job: publicJob(jobId),
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return toolResult(message, {
          ok: false,
          status: 'FAIL',
          toolName: 'get_note_import_job_status',
          errorCode: 'INVALID_ARGS',
          errorMessage: message,
        }, true);
      }
    }
  );

  async function runOneChunk(jobId: string, chunk: BulkImportChunk, dryRun: boolean) {
    const startedAt = new Date().toISOString();
    bulkImportJobStore.updateJobStatus(jobId, 'running');
    bulkImportJobStore.updateChunk(jobId, chunk.chunkId, {
      status: 'running',
      startedAt,
      retryCount: chunk.retryCount + (chunk.status === 'failed' || chunk.status === 'partial' ? 1 : 0),
    });

    const markdownArgs = {
      parentRemId: chunk.expectedParent,
      markdownText: chunk.sourceText,
      mode: 'create_child' as const,
      duplicatePolicy: 'skip' as const,
      safetyOptions: {
        dryRun,
        verifyAfterWrite: !dryRun,
        rollbackOnFailure: true,
        idempotencyKey: chunk.idempotencyKey,
      },
      limits: {
        maxMarkdownChars: Math.max(1000, chunk.charCount + 100),
        maxDepth: 8,
        maxNodes: Math.max(10, chunk.estimatedRemCount + 5),
      },
      isBulkImportStep: true,
    };
    const timeoutMs = estimateWriteTimeoutMs({
      tool: 'create_or_replace_note_from_markdown',
      args: markdownArgs,
      charCount: chunk.charCount,
      nodeCount: chunk.estimatedRemCount,
      hasVerification: !dryRun,
      isBulkImportStep: true,
      budgets: timeoutBudgets,
    });

    const response = await callPlugin(
      'create_or_replace_note_from_markdown',
      markdownArgs,
      timeoutMs
    );
    const finishedAt = new Date().toISOString();
    if (!response.ok) {
      const partial = response.error.code === 'TIMEOUT' || response.error.code === 'RETRYABLE_UNKNOWN_WRITE_STATUS';
      const job = bulkImportJobStore.updateChunk(jobId, chunk.chunkId, {
        status: partial ? 'partial' : 'failed',
        verificationStatus: partial ? 'partial' : 'failed',
        finishedAt,
        error: `${response.error.code}: ${response.error.message}`,
      });
      bulkImportJobStore.saveCheckpoint(jobId, {
        chunkId: chunk.chunkId,
        sectionKey: chunk.sectionKey,
        chunkIndex: chunk.chunkIndex,
        status: partial ? 'partial' : 'failed',
        message: response.error.message,
      });
      return { response, job, status: partial ? 'partial' : 'failed' };
    }

    const result = typeof response.result === 'object' && response.result !== null
      ? response.result as Record<string, unknown>
      : {};
    const createdRemIds = Array.isArray(result.createdRemIds)
      ? result.createdRemIds.filter((id): id is string => typeof id === 'string')
      : [];
    const updatedRemIds = Array.isArray(result.updatedRemIds)
      ? result.updatedRemIds.filter((id): id is string => typeof id === 'string')
      : [];
    const verification = typeof result.verification === 'object' && result.verification !== null
      ? result.verification as { passed?: boolean }
      : undefined;
    const nextStatus = dryRun
      ? 'pending'
      : verification?.passed === false
        ? 'partial'
        : 'verified';
    const job = bulkImportJobStore.updateChunk(jobId, chunk.chunkId, {
      status: nextStatus,
      verificationStatus: dryRun ? 'not_verifiable' : verification?.passed === false ? 'partial' : 'passed',
      finishedAt,
      createdRemIds,
      updatedRemIds,
      error: undefined,
    });
    bulkImportJobStore.saveCheckpoint(jobId, {
      chunkId: chunk.chunkId,
      sectionKey: chunk.sectionKey,
      chunkIndex: chunk.chunkIndex,
      status: nextStatus,
      message: dryRun ? 'Dry run completed; chunk not marked written.' : 'Chunk written and manifest checkpoint saved.',
    });
    return { response, job, status: nextStatus };
  }

  registerTool(
    'run_note_import_job_step',
    {
      title: 'Run note import job step',
      description: 'Write one bounded chunk from a resumable note import job. Repeat until status is completed.',
      inputSchema: z.object({
        jobId: z.string().trim().min(1).max(256),
        maxChunks: z.number().int().min(1).max(5).default(1),
        maxChars: z.number().int().min(500).max(24000).optional(),
        dryRun: z.boolean().default(false),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: { readOnlyHint: false, openWorldHint: false },
    },
    async ({ jobId, maxChunks, maxChars, dryRun }) => {
      try {
        const steps = [];
        for (let index = 0; index < maxChunks; index += 1) {
          const chunk = bulkImportJobStore.nextRunnableChunk(jobId);
          if (!chunk) {
            bulkImportJobStore.updateJobStatus(jobId, 'completed', 'All chunks are verified or skipped.');
            break;
          }
          if (maxChars && chunk.charCount > maxChars) {
            bulkImportJobStore.updateChunk(jobId, chunk.chunkId, {
              status: 'needs_manual_review',
              verificationStatus: 'not_verifiable',
              error: `Chunk ${chunk.chunkId} exceeds maxChars ${maxChars}.`,
            });
            break;
          }
          const step = await runOneChunk(jobId, chunk, dryRun);
          steps.push({
            sectionKey: chunk.sectionKey,
            chunkIndex: chunk.chunkIndex,
            chunkId: chunk.chunkId,
            status: step.status,
          });
          if (step.status === 'failed' || step.status === 'partial') {
            break;
          }
        }
        const job = bulkImportJobStore.getJob(jobId);
        if (!job) {
          throw new Error(`Unknown import job: ${jobId}`);
        }
        return toolResult('Note import job step processed.', {
          ok: true,
          status: job.status === 'completed' ? 'PASS' : job.status === 'partial' ? 'PARTIAL' : 'PASS',
          toolName: 'run_note_import_job_step',
          jobId,
          jobStatus: job.status,
          progress: summarizeBulkImportProgress(job),
          lastStep: steps[steps.length - 1],
          steps,
          nextAction: job.status === 'completed' ? 'call verify_note_import_job' : 'call run_note_import_job_step again',
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return toolResult(message, {
          ok: false,
          status: 'FAIL',
          toolName: 'run_note_import_job_step',
          errorCode: 'INTERNAL_ERROR',
          errorMessage: message,
        }, true);
      }
    }
  );

  registerTool(
    'resume_note_import_job',
    {
      title: 'Resume note import job',
      description: 'Resume a note import job from first pending, partial, or failed chunk without rewriting verified chunks.',
      inputSchema: z.object({ jobId: z.string().trim().min(1).max(256), dryRun: z.boolean().default(false) }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: { readOnlyHint: false, openWorldHint: false },
    },
    async ({ jobId, dryRun }) => {
      const chunk = bulkImportJobStore.nextRunnableChunk(jobId);
      if (!chunk) {
        const job = bulkImportJobStore.updateJobStatus(jobId, 'completed', 'No pending chunks remain.');
        return toolResult('Import job already has no pending chunks.', {
          ok: true,
          status: 'PASS',
          toolName: 'resume_note_import_job',
          jobId,
          jobStatus: job.status,
          progress: summarizeBulkImportProgress(job),
        });
      }
      return runOneChunk(jobId, chunk, dryRun)
        .then(({ job, status }) => toolResult('Note import job resumed.', {
          ok: true,
          status: status === 'partial' ? 'PARTIAL' : 'PASS',
          toolName: 'resume_note_import_job',
          jobId,
          jobStatus: job.status,
          progress: summarizeBulkImportProgress(job),
          lastStep: chunkSummary(chunk),
          nextAction: job.status === 'completed' ? 'call verify_note_import_job' : 'call run_note_import_job_step again',
        }))
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          return toolResult(message, {
            ok: false,
            status: 'FAIL',
            toolName: 'resume_note_import_job',
            errorCode: 'INTERNAL_ERROR',
            errorMessage: message,
          }, true);
        });
    }
  );

  registerTool(
    'verify_note_import_job',
    {
      title: 'Verify note import job',
      description: 'Verify import manifest progress. Live source-fidelity readback remains not verifiable until actual RemNote text is supplied.',
      inputSchema: z.object({
        jobId: z.string().trim().min(1).max(256),
        actualTextByChunkId: z.record(z.string(), z.string()).optional(),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ jobId, actualTextByChunkId }) => {
      try {
        const job = bulkImportJobStore.getJob(jobId);
        if (!job) {
          throw new Error(`Unknown import job: ${jobId}`);
        }
        const reports = job.chunks.map((chunk) =>
          verifyBulkImportSourceText({
            expectedText: chunk.sourceText,
            actualText: actualTextByChunkId?.[chunk.chunkId],
            jobId,
            sectionKey: chunk.sectionKey,
            chunkIndex: chunk.chunkIndex,
          })
        );
        const failed = reports.filter((report) => !report.ok && report.status !== 'not_verifiable');
        const notVerifiable = reports.filter((report) => report.status === 'not_verifiable');
        return toolResult('Note import verification report generated.', {
          ok: failed.length === 0,
          status: failed.length > 0 ? 'FAIL' : notVerifiable.length > 0 ? 'PARTIAL' : 'PASS',
          toolName: 'verify_note_import_job',
          jobId,
          jobStatus: job.status,
          verificationStatus: failed.length > 0 ? 'source_fidelity_failed' : notVerifiable.length > 0 ? 'not_verifiable' : 'passed',
          reports,
          progress: summarizeBulkImportProgress(job),
          limitation: notVerifiable.length > 0
            ? 'No live RemNote readback was supplied for some chunks; only manifest state was checked.'
            : undefined,
          recommendedAction: failed.length > 0 ? 'resume_note_import_job' : 'manual live readback check if needed',
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return toolResult(message, {
          ok: false,
          status: 'FAIL',
          toolName: 'verify_note_import_job',
          errorCode: 'INVALID_ARGS',
          errorMessage: message,
        }, true);
      }
    }
  );

  registerTool(
    'cancel_note_import_job',
    {
      title: 'Cancel note import job',
      description: 'Cancel future steps for a note import job. This never deletes created Rems.',
      inputSchema: z.object({ jobId: z.string().trim().min(1).max(256) }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ jobId }) => {
      try {
        const job = bulkImportJobStore.cancelJob(jobId);
        return toolResult('Note import job cancelled.', {
          ok: true,
          status: 'PASS',
          toolName: 'cancel_note_import_job',
          jobId,
          jobStatus: job.status,
          deletionPerformed: false,
          progress: summarizeBulkImportProgress(job),
          nextAction: 'No future chunks will run for this job.',
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return toolResult(message, {
          ok: false,
          status: 'FAIL',
          toolName: 'cancel_note_import_job',
          errorCode: 'INVALID_ARGS',
          errorMessage: message,
        }, true);
      }
    }
  );
}
