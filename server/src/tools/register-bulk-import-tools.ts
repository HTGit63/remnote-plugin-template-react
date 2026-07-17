import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import {
  bulkImportDurabilityWarning,
  bulkSectionIdempotencyKey,
  buildBulkImportSourceManifest,
  flattenBulkImportReadbackText,
  normalizeBulkImportTitle,
  planNoteImport,
  summarizeBulkImportProgress,
  verifyBulkImportFinalReadback,
  verifyBulkImportReadback,
  verifyBulkImportSourceText,
  stableBulkImportHash,
  isBulkImportJobComplete,
  type BulkImportChunk,
  type BulkImportChunkStatus,
  type BulkImportJob,
} from '../../../shared/bridge/bulk-import.js';
import type { BridgeFailure, BridgeResponse } from '../../../shared/bridge/protocol.js';
import { extractCreatedRemIds, getUpdatedDeletedEvidence } from '../bridge/bridge-hub-evidence.js';
import { mutationCouldHaveStarted } from '../bridge/bridge-hub-retry.js';
import { BulkImportRevisionConflictError } from '../storage/types.js';
import { BRIDGE_TOOL_OUTPUT_SCHEMA } from './schemas.js';
import {
  estimateWriteTimeoutMs,
  type McpToolResult,
  type ToolRegistrationContext,
} from './tool-context.js';
import { bulkImportJobStore } from '../bulk-import/job-store.js';
import {
  bulkImportOwnerId,
  isOwnedBulkImportRecord,
  publicBulkImportChunk,
  publicBulkImportJob,
} from '../bulk-import/access.js';
import {
  BulkImportSourceFileError,
  loadBulkImportSourceFile,
  type BulkImportLoadedSourceFile,
} from '../bulk-import/source-file-loader.js';

const READ_ONLY_BULK_TOOL_ANNOTATIONS = {
  readOnlyHint: true,
  openWorldHint: false,
  destructiveHint: false,
} as const;

const WRITE_BULK_TOOL_ANNOTATIONS = {
  readOnlyHint: false,
  openWorldHint: false,
  destructiveHint: false,
} as const;

const STATEFUL_BULK_TOOL_ANNOTATIONS = {
  readOnlyHint: false,
  openWorldHint: false,
  destructiveHint: false,
} as const;

const FILE_BULK_TOOL_ANNOTATIONS = {
  readOnlyHint: false,
  openWorldHint: false,
  destructiveHint: false,
} as const;

const activeBulkChunkCommands = new Set<string>();

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
  startMarker: z.string().trim().max(256).optional(),
  stopBeforeMarker: z.string().trim().max(256).optional(),
  rootTitle: z.string().trim().max(256).optional(),
  chapterTitle: z.string().trim().max(256).optional(),
  sourceNormalization: z.enum(['none', 'auto', 'remnote_export']).default('auto'),
  options: BULK_IMPORT_OPTIONS_SCHEMA,
});

const SOURCE_FILE_REFERENCE_SCHEMA = z.union([
  z.string().trim().min(1).max(4096),
  z.object({
    path: z.string().trim().min(1).max(4096).optional(),
    filePath: z.string().trim().min(1).max(4096).optional(),
    sourceFilePath: z.string().trim().min(1).max(4096).optional(),
    uri: z.string().trim().min(1).max(4096).optional(),
    url: z.string().trim().min(1).max(4096).optional(),
    href: z.string().trim().min(1).max(4096).optional(),
    name: z.string().trim().max(256).optional(),
    download_url: z.string().trim().min(1).max(8192).optional(),
    file_id: z.string().trim().min(1).max(512).optional(),
    mime_type: z.string().trim().max(256).optional(),
    file_name: z.string().trim().max(512).optional(),
  }).passthrough().refine((value) => Boolean(
    value.path ||
    value.filePath ||
    value.sourceFilePath ||
    value.uri ||
    value.url ||
    value.href ||
    (value.download_url && value.file_id)
  ), {
    message: 'File object requires a local path alias or ChatGPT download_url plus file_id.',
  }),
]);

const PLAN_IMPORT_FROM_FILE_INPUT_SCHEMA = PLAN_IMPORT_INPUT_SCHEMA.omit({ sourceText: true, sourceName: true }).extend({
  sourceFilePath: z.string().trim().min(1).max(4096).optional(),
  filePath: z.string().trim().min(1).max(4096).optional(),
  path: z.string().trim().min(1).max(4096).optional(),
  sourceFileUri: z.string().trim().min(1).max(4096).optional(),
  sourceFile: SOURCE_FILE_REFERENCE_SCHEMA.optional(),
  sourceName: z.string().trim().max(256).optional(),
}).refine((value) => Boolean(
  value.sourceFilePath ||
  value.filePath ||
  value.path ||
  value.sourceFileUri ||
  value.sourceFile
), {
  message: 'Provide sourceFilePath, filePath, path, sourceFileUri, or sourceFile.',
});

const DEFAULT_SOURCE_FILE_POLICY = {
  allowedRoots: ['/mnt/data'],
  maxBytes: 2 * 1024 * 1024,
  remoteTimeoutMs: 15_000,
} as const;

function toolResult(
  text: string,
  structuredContent: Record<string, unknown>,
  isError = false
): McpToolResult {
  const toolName = typeof structuredContent.toolName === 'string' ? structuredContent.toolName : 'unknown';
  const operationId = typeof structuredContent.operationId === 'string'
    ? structuredContent.operationId
    : `${toolName}-${Date.now().toString(36)}`;
  const status = typeof structuredContent.status === 'string'
    ? structuredContent.status
    : isError || structuredContent.ok === false
      ? 'FAIL'
      : 'PASS';
  const warnings = Array.isArray(structuredContent.warnings)
    ? structuredContent.warnings.filter((warning): warning is string => typeof warning === 'string')
    : typeof structuredContent.warning === 'string'
      ? [structuredContent.warning]
      : [];
  const progress = typeof structuredContent.progress === 'object' && structuredContent.progress !== null
    ? structuredContent.progress as Record<string, unknown>
    : undefined;
  const createdRemIds = Array.isArray(structuredContent.createdRemIds)
    ? structuredContent.createdRemIds.filter((remId): remId is string => typeof remId === 'string')
    : Array.isArray(progress?.createdRemIds)
      ? progress.createdRemIds.filter((remId): remId is string => typeof remId === 'string')
      : [];
  const updatedRemIds = Array.isArray(structuredContent.updatedRemIds)
    ? structuredContent.updatedRemIds.filter((remId): remId is string => typeof remId === 'string')
    : [];
  const deletedRemIds = Array.isArray(structuredContent.deletedRemIds)
    ? structuredContent.deletedRemIds.filter((remId): remId is string => typeof remId === 'string')
    : [];
  const phaseDurations =
    typeof structuredContent.phaseDurations === 'object' && structuredContent.phaseDurations !== null
      ? structuredContent.phaseDurations as Record<string, number>
      : { totalMs: 0 };
  if (typeof phaseDurations.totalMs !== 'number') {
    phaseDurations.totalMs = 0;
  }
  const verification =
    typeof structuredContent.verification === 'object' && structuredContent.verification !== null
      ? structuredContent.verification as Record<string, unknown>
      : {
          attempted: false,
          passed: undefined,
          method: undefined,
          warnings,
        };
  const standard = {
    status,
    toolName,
    operationId,
    idempotencyKey: typeof structuredContent.idempotencyKey === 'string' ? structuredContent.idempotencyKey : undefined,
    idempotencyResult: typeof structuredContent.idempotencyResult === 'string' ? structuredContent.idempotencyResult : undefined,
    targetRemId: typeof structuredContent.targetRemId === 'string' ? structuredContent.targetRemId : undefined,
    parentRemId:
      typeof structuredContent.parentRemId === 'string'
        ? structuredContent.parentRemId
        : typeof structuredContent.targetRootId === 'string'
          ? structuredContent.targetRootId
          : undefined,
    createdRemIds,
    updatedRemIds,
    deletedRemIds,
    verification,
    errorCode: typeof structuredContent.errorCode === 'string' ? structuredContent.errorCode : undefined,
    errorMessage: typeof structuredContent.errorMessage === 'string' ? structuredContent.errorMessage : undefined,
    retryable: typeof structuredContent.retryable === 'boolean' ? structuredContent.retryable : undefined,
    phaseDurations,
    warnings,
  };
  return {
    isError,
    content: [{ type: 'text', text }],
    structuredContent: {
      ...standard,
      ...structuredContent,
      operationId,
      standard,
    },
  };
}

function publicJob(jobId: string) {
  const job = bulkImportJobStore.getJob(jobId);
  if (!job) {
    throw new Error(`Unknown import job: ${jobId}`);
  }
  return publicBulkImportJob(job);
}

function chunkStepOutput(
  chunk: BulkImportChunk,
  status: BulkImportChunkStatus,
  verification?: Record<string, unknown>
) {
  return {
    ...publicBulkImportChunk(chunk),
    status,
    ...(verification ? { verification } : {}),
  };
}

function bulkStepVerificationSummary(steps: Array<Record<string, unknown>>) {
  const verificationSteps = steps
    .map((step) => step.verification)
    .filter((verification): verification is Record<string, unknown> =>
      typeof verification === 'object' && verification !== null
    );
  const attempted = verificationSteps.some((verification) => verification.attempted === true);
  const warnings = verificationSteps.flatMap((verification) =>
    Array.isArray(verification.warnings)
      ? verification.warnings.filter((warning): warning is string => typeof warning === 'string')
      : []
  );
  return {
    attempted,
    passed: attempted ? steps.every((step) => step.status === 'verified') : undefined,
    method: verificationSteps.length ? 'plugin_write_verification_and_chunk_readback' : undefined,
    warnings,
  };
}

function resultRecord(response: BridgeResponse): Record<string, unknown> {
  return response.ok && typeof response.result === 'object' && response.result !== null
    ? response.result as Record<string, unknown>
    : {};
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function sourceFileIdentity(file: BulkImportLoadedSourceFile): string {
  return file.sourceReference.kind === 'local_file'
    ? file.sourceReference.path
    : `chatgpt-file:${file.sourceReference.fileId}`;
}

function sourceFileStructuredOutput(
  file: BulkImportLoadedSourceFile,
  plan: ReturnType<typeof planNoteImport>
) {
  return {
    ...file.sourceReference,
    byteLength: file.byteLength,
    sourceHash: stableBulkImportHash(file.sourceText),
    extractedChapterHash: plan.sourceMetadata.extractedSourceHash,
    plannedSourceHash: plan.sourceMetadata.plannedSourceHash,
  };
}

function sourceFileErrorCode(error: unknown): string {
  return error instanceof BulkImportSourceFileError ? error.code : 'INVALID_ARGS';
}

function planStructuredOutput(plan: ReturnType<typeof planNoteImport>, toolName: string) {
  return {
    ok: true,
    status: 'PASS',
    toolName,
    planId: plan.planId,
    sourceHash: plan.sourceHash,
    sourceManifest: plan.sourceManifest,
    sourceMetadata: plan.sourceMetadata,
    plannedSourceLength: plan.plannedSourceLength,
    extractedSourceLength: plan.extractedSourceLength,
    targetRootId: plan.targetRootId,
    importRootTitle: plan.importRootTitle,
    chapterTitle: plan.chapterTitle,
    sections: plan.sections.map((section) => ({
      sectionKey: section.sectionKey,
      title: section.title,
      sourceHash: section.sourceHash,
      sourceManifest: section.sourceManifest,
      sourceLength: section.sourceText.length,
      bodySourceLength: section.bodySourceText.length,
      chunkCount: section.chunkCount,
      chunks: section.chunks.map((chunk) => ({
        chunkId: chunk.chunkId,
        logicalSectionKey: chunk.logicalSectionKey,
        nativeChunkIndex: chunk.nativeChunkIndex,
        sourceHash: chunk.sourceHash,
        sourceManifest: chunk.sourceManifest,
      })),
    })),
    estimatedChunks: plan.estimatedChunks,
    logicalChunkCount: plan.logicalChunkCount,
    nativeChunkCount: plan.nativeChunkCount,
    estimatedRems: plan.estimatedRems,
    warnings: plan.warnings,
    nextAction: 'call start_note_import_job with this planId',
  };
}

function bridgeFailureMessage(response: BridgeFailure): string {
  return `${response.error.code}: ${response.error.message}`;
}

function failureAttemptState(response: BridgeFailure): 'unknown' | 'failed_before_write' {
  return response.error.code === 'TIMEOUT' ||
    response.error.code === 'RETRYABLE_UNKNOWN_WRITE_STATUS' ||
    mutationCouldHaveStarted(response)
    ? 'unknown'
    : 'failed_before_write';
}

function failureChunkStatus(response: BridgeFailure): BulkImportChunkStatus {
  return failureAttemptState(response) === 'unknown' ? 'partial_needs_verification' : 'failed';
}

function childTitle(child: Record<string, unknown>): string {
  for (const key of ['title', 'frontText', 'plainText']) {
    const value = child[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return '';
}

function findChildByTitle(children: unknown, title: string): { remId: string; duplicateCount: number } | null {
  if (!Array.isArray(children)) {
    return null;
  }
  const normalized = normalizeBulkImportTitle(title);
  const matches = children
    .filter((child): child is Record<string, unknown> => typeof child === 'object' && child !== null)
    .filter((child) => normalizeBulkImportTitle(childTitle(child)) === normalized);
  const first = matches.find((child) => typeof child.remId === 'string' && child.remId);
  return first ? { remId: first.remId as string, duplicateCount: matches.length } : null;
}

export function registerBulkImportTools({
  registerTool,
  callPlugin,
  timeoutBudgets,
  storage,
  principal,
  requestSignal,
  sourceFilePolicy = DEFAULT_SOURCE_FILE_POLICY,
  sourceFileLoader = loadBulkImportSourceFile,
}: ToolRegistrationContext): void {
  const storageDurability = storage?.bulkImportStorageDurability() ?? 'memory_only';
  const ownerId = bulkImportOwnerId(principal);

  function durabilityFields(job: Pick<BulkImportJob, 'storageDurability'>) {
    return {
      storageDurability: job.storageDurability,
      durabilityWarning: bulkImportDurabilityWarning(job.storageDurability),
    };
  }

  async function savePlan(plan: ReturnType<typeof planNoteImport>) {
    if (!isOwnedBulkImportRecord(plan, ownerId)) {
      throw new Error('Import plan owner mismatch.');
    }
    bulkImportJobStore.savePlan(plan);
    if (storage) {
      await storage.saveBulkImportPlan(plan);
    }
    return plan;
  }

  async function hydratePlan(planId: string): Promise<ReturnType<typeof planNoteImport> | null> {
    const existing = bulkImportJobStore.getPlan(planId);
    if (existing) {
      return isOwnedBulkImportRecord(existing, ownerId) ? existing : null;
    }
    if (!storage) {
      return null;
    }
    const plan = await storage.getBulkImportPlan(planId);
    if (isOwnedBulkImportRecord(plan, ownerId)) {
      bulkImportJobStore.savePlan(plan);
      return plan;
    }
    return null;
  }

  async function hydrateJob(jobId: string, refreshFromStorage = false): Promise<BulkImportJob | null> {
    const existing = bulkImportJobStore.getJob(jobId);
    if (existing && (!refreshFromStorage || !storage)) {
      return isOwnedBulkImportRecord(existing, ownerId) ? existing : null;
    }
    if (!storage) {
      return null;
    }
    const stored = await storage.getBulkImportJob(jobId);
    if (isOwnedBulkImportRecord(stored, ownerId)) {
      bulkImportJobStore.saveJob(stored);
      return stored;
    }
    return null;
  }

  async function persistJob(jobId: string): Promise<void> {
    if (!storage) {
      return;
    }
    const job = bulkImportJobStore.getJob(jobId);
    if (isOwnedBulkImportRecord(job, ownerId)) {
      const stored = await storage.saveBulkImportJob({
        ...job,
        storageDurability,
      }, { expectedRevision: job.revision });
      bulkImportJobStore.saveJob(stored);
    }
  }

  function persistenceConflictResult(toolName: string, error: BulkImportRevisionConflictError): McpToolResult {
    return toolResult(error.message, {
      ok: false,
      status: 'FAIL',
      toolName,
      jobId: error.jobId,
      errorCode: error.code,
      errorMessage: error.message,
      expectedRevision: error.expectedRevision,
      actualRevision: error.actualRevision,
      retryable: false,
      recommendedAction: 'Reload the job status and reconcile the newer durable revision before another write.',
    }, true);
  }

  async function createJob(planId: string, jobId?: string): Promise<BulkImportJob> {
    const plan = await hydratePlan(planId);
    if (!plan) {
      throw new Error(`Unknown import plan: ${planId}`);
    }
    if (jobId) {
      const existingJob = bulkImportJobStore.getJob(jobId);
      if (existingJob && !isOwnedBulkImportRecord(existingJob, ownerId)) {
        throw new Error(`Unknown import job: ${jobId}`);
      }
    }
    const job = bulkImportJobStore.createJob(planId, jobId, storageDurability);
    if (job.ownerId !== ownerId) {
      throw new Error(`Unknown import job: ${job.jobId}`);
    }
    await persistJob(job.jobId);
    return bulkImportJobStore.getJob(job.jobId) ?? job;
  }

  function cancelledJobResult(toolName: string, job: BulkImportJob): McpToolResult {
    return toolResult('Bulk import job is cancelled. No content was deleted; create a new job to continue.', {
      ok: false,
      status: 'FAIL',
      toolName,
      jobId: job.jobId,
      jobStatus: job.status,
      ...durabilityFields(job),
      deletionPerformed: false,
      progress: summarizeBulkImportProgress(job),
      errorCode: 'JOB_CANCELLED',
      errorMessage: 'Job is cancelled. No content was deleted; create a new job to continue.',
      nextAction: 'create a new bulk import job if more chunks should run',
    }, true);
  }

  function reconciliationRequiredResult(toolName: string, job: BulkImportJob, chunk: BulkImportChunk): McpToolResult {
    const attempt = chunk.attempts.at(-1);
    return toolResult('Import chunk has an unresolved write outcome. Reconcile live IDs and content before retry.', {
      ok: false,
      status: 'PARTIAL',
      toolName,
      jobId: job.jobId,
      jobStatus: job.status,
      jobRevision: job.revision,
      chunkId: chunk.chunkId,
      attemptId: attempt?.attemptId,
      operationId: attempt?.operationId,
      expectedParent: chunk.expectedParent,
      expectedSourceHash: chunk.expectedSourceHash,
      createdRemIds: chunk.createdRemIds,
      updatedRemIds: chunk.updatedRemIds,
      errorCode: 'RECONCILIATION_REQUIRED',
      errorMessage: 'Unknown or unverified write outcome blocks blind replay.',
      retryable: false,
      progress: summarizeBulkImportProgress(job),
      recommendedAction: 'call reconcile_note_import_job_chunk with exact live IDs, expected parent, and source readback',
    });
  }

  function manualReviewRequiredResult(toolName: string, job: BulkImportJob, chunk: BulkImportChunk): McpToolResult {
    const attempt = chunk.attempts.at(-1);
    return toolResult('Import chunk is in terminal manual-review state; no automatic resume was attempted.', {
      ok: false,
      status: 'PARTIAL',
      toolName,
      jobId: job.jobId,
      jobStatus: job.status,
      jobRevision: job.revision,
      chunkId: chunk.chunkId,
      attemptId: attempt?.attemptId,
      operationId: attempt?.operationId,
      expectedParent: chunk.expectedParent,
      chunk: publicBulkImportChunk(chunk),
      errorCode: 'MANUAL_REVIEW_REQUIRED',
      errorMessage: 'The durable chunk state was explicitly classified for manual review and cannot be replayed automatically.',
      retryable: false,
      progress: summarizeBulkImportProgress(job),
      recommendedAction: 'Inspect the exact live Rem IDs and parent tree, then create a new import job only after resolving the ambiguous artifact.',
    });
  }

  registerTool(
    'plan_note_import',
    {
      title: 'Plan note import',
      description: 'Use this when you need to plan a large Markdown note import into safe resumable chunks before writing to RemNote.',
      inputSchema: PLAN_IMPORT_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: STATEFUL_BULK_TOOL_ANNOTATIONS,
    },
    async (args) => {
      try {
        const plan = planNoteImport({ ...args, ownerId });
        await savePlan(plan);
        return toolResult('Note import plan created.', planStructuredOutput(plan, 'plan_note_import'));
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
    'plan_note_import_from_file',
    {
      title: 'Plan note import from file',
      description: 'Use this when you need to read an authorized source file and persist a bounded resumable import plan without writing to RemNote.',
      inputSchema: PLAN_IMPORT_FROM_FILE_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: FILE_BULK_TOOL_ANNOTATIONS,
      _meta: {
        'openai/fileParams': ['sourceFile'],
      },
    },
    async (args) => {
      try {
        const file = await sourceFileLoader(args, {
          principal,
          policy: sourceFilePolicy,
          signal: requestSignal,
        });
        const plan = planNoteImport({
          ...args,
          ownerId,
          sourceKind: 'file',
          sourceFilePath: sourceFileIdentity(file),
          sourceName: args.sourceName ?? file.sourceName,
          sourceText: file.sourceText,
        });
        await savePlan(plan);
        return toolResult('File-backed note import plan created.', {
          ...planStructuredOutput(plan, 'plan_note_import_from_file'),
          sourceFile: sourceFileStructuredOutput(file, plan),
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return toolResult(message, {
          ok: false,
          status: 'FAIL',
          toolName: 'plan_note_import_from_file',
          errorCode: sourceFileErrorCode(error),
          errorMessage: message,
        }, true);
      }
    }
  );

  registerTool(
    'start_note_import_job',
    {
      title: 'Start note import job',
      description: 'Use this when you need to create a resumable import job from a saved plan without writing the chapter yet.',
      inputSchema: z.object({
        planId: z.string().trim().min(1).max(256),
        jobId: z.string().trim().min(1).max(256).optional(),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: STATEFUL_BULK_TOOL_ANNOTATIONS,
    },
    async ({ planId, jobId }) => {
      try {
        const job = await createJob(planId, jobId);
        return toolResult('Note import job started.', {
          ok: true,
          status: 'PASS',
          toolName: 'start_note_import_job',
          jobId: job.jobId,
          jobStatus: job.status,
          targetRootId: job.targetRootId,
          importRootTitle: job.importRootTitle,
          chapterTitle: job.chapterTitle,
          sourceMetadata: job.sourceMetadata,
          plannedSourceLength: job.plannedSourceLength,
          extractedSourceLength: job.extractedSourceLength,
          ...durabilityFields(job),
          warning: bulkImportDurabilityWarning(job.storageDurability),
          progress: summarizeBulkImportProgress(job),
          nextAction: 'call run_note_import_job_step',
        });
      } catch (error: unknown) {
        if (error instanceof BulkImportRevisionConflictError) {
          return persistenceConflictResult('start_note_import_job', error);
        }
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
    'start_note_import_from_file',
    {
      title: 'Start note import from file',
      description: 'Use this when you need to read an authorized source file, persist a safe plan, and start a resumable job without writing chunks yet.',
      inputSchema: PLAN_IMPORT_FROM_FILE_INPUT_SCHEMA.extend({
        jobId: z.string().trim().min(1).max(256).optional(),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: FILE_BULK_TOOL_ANNOTATIONS,
      _meta: {
        'openai/fileParams': ['sourceFile'],
      },
    },
    async (args) => {
      try {
        const file = await sourceFileLoader(args, {
          principal,
          policy: sourceFilePolicy,
          signal: requestSignal,
        });
        const plan = planNoteImport({
          ...args,
          ownerId,
          sourceKind: 'file',
          sourceFilePath: sourceFileIdentity(file),
          sourceName: args.sourceName ?? file.sourceName,
          sourceText: file.sourceText,
        });
        await savePlan(plan);
        const job = await createJob(plan.planId, args.jobId);
        return toolResult('File-backed note import job started.', {
          ...planStructuredOutput(plan, 'start_note_import_from_file'),
          jobId: job.jobId,
          jobStatus: job.status,
          ...durabilityFields(job),
          warning: bulkImportDurabilityWarning(job.storageDurability),
          progress: summarizeBulkImportProgress(job),
          sourceFile: sourceFileStructuredOutput(file, plan),
          nextAction: 'call run_note_import_job_step',
        });
      } catch (error: unknown) {
        if (error instanceof BulkImportRevisionConflictError) {
          return persistenceConflictResult('start_note_import_from_file', error);
        }
        const message = error instanceof Error ? error.message : String(error);
        return toolResult(message, {
          ok: false,
          status: 'FAIL',
          toolName: 'start_note_import_from_file',
          errorCode: sourceFileErrorCode(error),
          errorMessage: message,
        }, true);
      }
    }
  );

  registerTool(
    'get_note_import_job_status',
    {
      title: 'Get note import job status',
      description: 'Use this when you need to read resumable progress for a note import job without changing it.',
      inputSchema: z.object({ jobId: z.string().trim().min(1).max(256) }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: READ_ONLY_BULK_TOOL_ANNOTATIONS,
    },
    async ({ jobId }) => {
      try {
        const ownedJob = await hydrateJob(jobId);
        if (!ownedJob) {
          throw new Error(`Unknown import job: ${jobId}`);
        }
        const job = publicJob(jobId);
        return toolResult('Note import job status loaded.', {
          ok: true,
          status: 'PASS',
          toolName: 'get_note_import_job_status',
          job,
          ...durabilityFields(job),
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
    const commandKey = jobId;
    if (activeBulkChunkCommands.has(commandKey)) {
      throw new Error(`Bulk import chunk ${chunk.chunkId} already has an in-flight command.`);
    }
    activeBulkChunkCommands.add(commandKey);
    try {
    const startedAt = new Date().toISOString();
    const attemptId = `attempt:${randomUUID()}`;
    const operationId = `bulk-import:${jobId}:${attemptId}`;
    bulkImportJobStore.updateJobStatus(jobId, 'running');
    bulkImportJobStore.beginChunkAttempt(jobId, chunk.chunkId, {
      attemptId,
      operationId,
      expectedParent: chunk.expectedParent,
    });
    await persistJob(jobId);

    const hierarchy = await ensureChunkHierarchy(jobId, chunk, dryRun);
    if (!hierarchy.ok) {
      const attemptState = failureAttemptState(hierarchy.response);
      const status = failureChunkStatus(hierarchy.response);
      const finishedAt = new Date().toISOString();
      const evidence = getUpdatedDeletedEvidence(hierarchy.response);
      const job = bulkImportJobStore.finishChunkAttempt(jobId, chunk.chunkId, {
        attemptId,
        state: attemptState,
        status,
        verificationStatus: attemptState === 'unknown' ? 'partial' : 'failed',
        hierarchyCreatedRemIds: Array.from(new Set([
          ...hierarchy.createdRemIds,
          ...extractCreatedRemIds(hierarchy.response),
        ])),
        updatedRemIds: evidence.updatedRemIds,
        finishedAt,
        error: bridgeFailureMessage(hierarchy.response),
        errorCode: hierarchy.response.error.code,
        lifecycle: hierarchy.response.lifecycle,
      });
      bulkImportJobStore.saveCheckpoint(jobId, {
        chunkId: chunk.chunkId,
        sectionKey: chunk.sectionKey,
        chunkIndex: chunk.chunkIndex,
        status,
        message: hierarchy.response.error.message,
      });
      await persistJob(jobId);
      const updatedChunk = job.chunks.find((candidate) => candidate.chunkId === chunk.chunkId) ?? chunk;
      return {
        response: hierarchy.response,
        job,
        status,
        step: chunkStepOutput(updatedChunk, status, {
          attempted: true,
          attemptId,
          operationId,
          outcome: attemptState,
          method: 'plugin_write_verification_and_chunk_readback',
          warnings: [hierarchy.response.error.message],
          error: bridgeFailureMessage(hierarchy.response),
        }),
      };
    }

    const markdownArgs = {
      targetRemId: hierarchy.parentRemId,
      markdownText: chunk.sourceText,
      mode: 'append_children_to_target' as const,
      duplicatePolicy: 'skip' as const,
      remnoteLayout: {
        bulletMode: 'plain_child_rems' as const,
      },
      safetyOptions: {
        dryRun,
        verifyAfterWrite: !dryRun,
        rollbackOnFailure: true,
        idempotencyKey: chunk.idempotencyKey,
      },
      limits: {
        maxMarkdownChars: Math.max(1000, chunk.charCount + 100),
        maxDepth: 8,
        maxNodes: Math.max(
          10,
          chunk.estimatedRemCount + 5,
          chunk.sourceManifest.units.length + 12
        ),
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
      const attemptState = failureAttemptState(response);
      const status = failureChunkStatus(response);
      const durationMs = Math.max(0, Date.parse(finishedAt) - Date.parse(startedAt));
      const evidence = getUpdatedDeletedEvidence(response);
      const job = bulkImportJobStore.finishChunkAttempt(jobId, chunk.chunkId, {
        attemptId,
        state: attemptState,
        status,
        verificationStatus: attemptState === 'unknown' ? 'partial' : 'failed',
        hierarchyCreatedRemIds: hierarchy.createdRemIds,
        createdRemIds: extractCreatedRemIds(response),
        updatedRemIds: evidence.updatedRemIds,
        finishedAt,
        error: bridgeFailureMessage(response),
        errorCode: response.error.code,
        lifecycle: response.lifecycle,
      });
      bulkImportJobStore.updateChunk(jobId, chunk.chunkId, { durationMs });
      bulkImportJobStore.saveCheckpoint(jobId, {
        chunkId: chunk.chunkId,
        sectionKey: chunk.sectionKey,
        chunkIndex: chunk.chunkIndex,
        status,
        message: response.error.message,
      });
      await persistJob(jobId);
      const updatedChunk = job.chunks.find((candidate) => candidate.chunkId === chunk.chunkId) ?? chunk;
      return {
        response,
        job,
        status,
        step: chunkStepOutput(updatedChunk, status, {
          attempted: true,
          attemptId,
          operationId,
          outcome: attemptState,
          method: 'plugin_write_verification_and_chunk_readback',
          warnings: [response.error.message],
          error: bridgeFailureMessage(response),
        }),
      };
    }

    const result = resultRecord(response);
    const durationMs = Math.max(0, Date.parse(finishedAt) - Date.parse(startedAt));
    const createdRemIds = Array.from(new Set([
      ...chunk.createdRemIds,
      ...stringArray(result.createdRemIds),
      ...stringArray(result.createdRemId ? [result.createdRemId] : undefined),
    ]));
    const updatedRemIds = Array.from(new Set([
      ...chunk.updatedRemIds,
      ...stringArray(result.updatedRemIds),
    ]));
    const hasChunkMutationIds = createdRemIds.length > 0 || updatedRemIds.length > 0;
    bulkImportJobStore.finishChunkAttempt(jobId, chunk.chunkId, {
      attemptId,
      state: 'acknowledged',
      status: 'written_not_verified',
      verificationStatus: 'written_not_verified',
      hierarchyCreatedRemIds: hierarchy.createdRemIds,
      createdRemIds,
      updatedRemIds,
      finishedAt,
    });
    await persistJob(jobId);
    const verification = typeof result.verification === 'object' && result.verification !== null
      ? result.verification as { passed?: boolean }
      : undefined;
    const pluginVerificationPassed = verification?.passed === true;
    let readbackVerification = null as ReturnType<typeof verifyBulkImportSourceText> | null;
    let readbackError: string | undefined;
    if (!dryRun) {
      const readback = await callPlugin('get_rem_tree', {
        remId: hierarchy.parentRemId,
        depth: 12,
      });
      if (readback.ok) {
        readbackVerification = verifyBulkImportSourceText({
          expectedText: chunk.expectedSourceText ?? chunk.sourceText,
          actualText: flattenBulkImportReadbackText(readback.result),
          jobId,
          sectionKey: chunk.sectionKey,
          chunkIndex: chunk.chunkIndex,
        });
      } else {
        readbackError = bridgeFailureMessage(readback);
      }
    }
    const nextStatus = dryRun
      ? 'pending'
      : readbackVerification?.ok === true && pluginVerificationPassed && hasChunkMutationIds
        ? 'verified'
        : readbackVerification?.ok === false || verification?.passed === false
        ? 'partial'
        : 'written_not_verified';
    const job = bulkImportJobStore.finishChunkAttempt(jobId, chunk.chunkId, {
      attemptId,
      state: 'acknowledged',
      status: nextStatus,
      verificationStatus: dryRun
        ? 'not_verifiable'
        : readbackVerification?.ok === true && pluginVerificationPassed && hasChunkMutationIds
          ? 'passed'
          : readbackVerification?.ok === false || verification?.passed === false
            ? 'source_fidelity_failed'
            : 'written_not_verified',
      finishedAt,
      createdRemIds,
      updatedRemIds,
      error: !dryRun && readbackVerification?.ok === true && pluginVerificationPassed && !hasChunkMutationIds
        ? 'Write and readback verification passed, but exact chunk mutation IDs were missing.'
        : readbackVerification?.ok === false
        ? [
            readbackVerification.missingTextPreview
              ? `Missing: ${readbackVerification.missingTextPreview}`
              : '',
            readbackVerification.extraTextPreview
              ? `Extra: ${readbackVerification.extraTextPreview}`
              : '',
            ...readbackVerification.warnings,
          ].filter(Boolean).join(' ')
        : readbackError,
    });
    bulkImportJobStore.updateChunk(jobId, chunk.chunkId, { durationMs });
    bulkImportJobStore.saveCheckpoint(jobId, {
      chunkId: chunk.chunkId,
      sectionKey: chunk.sectionKey,
      chunkIndex: chunk.chunkIndex,
      status: nextStatus,
      message: dryRun
        ? 'Dry run completed; chunk not marked written.'
        : nextStatus === 'verified'
          ? 'Chunk written and explicit verification passed.'
          : nextStatus === 'written_not_verified'
            ? 'Chunk written but explicit verification evidence was missing.'
          : 'Chunk write needs verification review.',
    });
    await persistJob(jobId);
    const updatedChunk = job.chunks.find((candidate) => candidate.chunkId === chunk.chunkId) ?? chunk;
    const verificationEvidence = {
      attempted: !dryRun,
      method: 'plugin_write_verification_and_chunk_readback',
      pluginPassed: verification?.passed,
      readbackPassed: readbackVerification?.ok,
      readbackStatus: readbackVerification?.status ?? (readbackError ? 'not_verifiable' : undefined),
      missingTextPreview: readbackVerification?.missingTextPreview,
      extraTextPreview: readbackVerification?.extraTextPreview,
      warnings: [
        ...(readbackVerification?.warnings ?? (readbackError ? [readbackError] : [])),
        ...(!dryRun && readbackVerification?.ok === true && pluginVerificationPassed && !hasChunkMutationIds
          ? ['Exact chunk mutation IDs were missing; hierarchy root IDs cannot verify the chunk write.']
          : []),
      ],
      error: readbackError,
    };
    return {
      response,
      job,
      status: nextStatus,
      step: chunkStepOutput(updatedChunk, nextStatus, verificationEvidence),
    };
    } finally {
      activeBulkChunkCommands.delete(commandKey);
    }
  }

  function previewRunnableChunks(jobId: string, maxChunks = 1, maxChars?: number) {
    const job = bulkImportJobStore.getJob(jobId);
    if (!job) {
      throw new Error(`Unknown import job: ${jobId}`);
    }
    const runnable = job.chunks
      .filter((chunk) => chunk.status === 'pending')
      .slice(0, maxChunks);
    const blocked = maxChars
      ? runnable.find((chunk) => chunk.charCount > maxChars)
      : undefined;
    const steps = runnable.map((chunk) => ({
      sectionKey: chunk.sectionKey,
      chunkIndex: chunk.chunkIndex,
      chunkId: chunk.chunkId,
      status: blocked?.chunkId === chunk.chunkId ? 'would_block_max_chars' : 'would_run',
      currentStatus: chunk.status,
      idempotencyKey: chunk.idempotencyKey,
      charCount: chunk.charCount,
    }));
    return {
      job,
      steps,
      chunk: runnable[0],
      blocked,
      nextAction: runnable.length === 0
        ? bulkImportJobStore.firstReconciliationRequiredChunk(jobId)
          ? 'call reconcile_note_import_job_chunk before any retry'
          : 'call verify_note_import_job'
        : 'retry with dryRun=false to write the previewed chunk',
    };
  }

  async function ensureChildRem(input: {
    parentRemId: string;
    title: string;
    idempotencyKey: string;
    dryRun: boolean;
  }): Promise<
    | { ok: true; remId: string; createdRemIds: string[]; duplicateCount: number }
    | { ok: false; response: BridgeFailure }
  > {
    if (input.dryRun) {
      return { ok: true, remId: input.parentRemId, createdRemIds: [], duplicateCount: 0 };
    }

    const childrenResponse = await callPlugin('get_children', {
      parentRemId: input.parentRemId,
      maxChildren: 100,
    });
    if (!childrenResponse.ok) {
      return { ok: false, response: childrenResponse };
    }
    const existing = findChildByTitle(resultRecord(childrenResponse).children, input.title);
    if (existing) {
      return { ok: true, remId: existing.remId, createdRemIds: [], duplicateCount: existing.duplicateCount };
    }

    const createResponse = await callPlugin('create_rem', {
      parentId: input.parentRemId,
      markdown: input.title,
      idempotencyKey: input.idempotencyKey,
    });
    if (!createResponse.ok) {
      return { ok: false, response: createResponse };
    }
    const createdRemId = resultRecord(createResponse).createdRemId;
    if (typeof createdRemId !== 'string' || !createdRemId) {
      return {
        ok: false,
        response: {
          id: createResponse.id,
          ok: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: `create_rem did not return createdRemId for ${input.title}.`,
          },
          lifecycle: createResponse.lifecycle,
        },
      };
    }
    return { ok: true, remId: createdRemId, createdRemIds: [createdRemId], duplicateCount: 0 };
  }

  async function ensureChunkHierarchy(
    jobId: string,
    chunk: BulkImportChunk,
    dryRun: boolean
  ): Promise<
    | { ok: true; parentRemId: string; createdRemIds: string[] }
    | { ok: false; response: BridgeFailure; createdRemIds: string[] }
  > {
    const job = bulkImportJobStore.getJob(jobId);
    if (!job) {
      throw new Error(`Unknown import job: ${jobId}`);
    }
    const createdRemIds: string[] = [];
    let chapterParentRemId = job.targetRootId;
    if (job.importRootTitle) {
      let importRootRemId = job.importRootRemId;
      if (!importRootRemId) {
        const importRoot = await ensureChildRem({
          parentRemId: job.targetRootId,
          title: job.importRootTitle,
          idempotencyKey: job.importRootIdempotencyKey ?? `bulk-import:${jobId}:import-root`,
          dryRun,
        });
        if (!importRoot.ok) {
          return { ...importRoot, createdRemIds };
        }
        importRootRemId = importRoot.remId;
        createdRemIds.push(...importRoot.createdRemIds);
        if (!dryRun) {
          bulkImportJobStore.recordImportRoot(jobId, importRootRemId);
          if (importRoot.duplicateCount > 1) {
            bulkImportJobStore.appendEvent(jobId, {
              status: 'needs_manual_review',
              message: `Duplicate import roots detected for "${job.importRootTitle}". Reused first match.`,
            });
          }
          await persistJob(jobId);
        }
      }
      chapterParentRemId = importRootRemId;
    }
    let chapterRootRemId = job.chapterRootRemId;
    const importRootIsChapter =
      Boolean(job.importRootTitle) &&
      normalizeBulkImportTitle(job.importRootTitle ?? '') === normalizeBulkImportTitle(job.chapterTitle);
    if (!chapterRootRemId && importRootIsChapter) {
      chapterRootRemId = chapterParentRemId;
      if (!dryRun) {
        bulkImportJobStore.recordChapterRoot(jobId, chapterRootRemId);
        bulkImportJobStore.appendEvent(jobId, {
          status: 'skipped_already_verified',
          message: `Chapter root reused import root because titles match "${job.chapterTitle}".`,
        });
        await persistJob(jobId);
      }
    }
    if (!chapterRootRemId) {
      const chapter = await ensureChildRem({
        parentRemId: chapterParentRemId,
        title: job.chapterTitle,
        idempotencyKey: job.chapterIdempotencyKey,
        dryRun,
      });
      if (!chapter.ok) {
        return { ...chapter, createdRemIds };
      }
      chapterRootRemId = chapter.remId;
      createdRemIds.push(...chapter.createdRemIds);
      if (!dryRun) {
        bulkImportJobStore.recordChapterRoot(jobId, chapterRootRemId);
        if (chapter.duplicateCount > 1) {
          bulkImportJobStore.appendEvent(jobId, {
            status: 'needs_manual_review',
            message: `Duplicate chapter roots detected for "${job.chapterTitle}". Reused first match.`,
          });
        }
        await persistJob(jobId);
      }
    }

    const latestJob = bulkImportJobStore.getJob(jobId) as BulkImportJob;
    const section = latestJob.sections.find((candidate) => candidate.sectionKey === chunk.sectionKey);
    if (!section) {
      throw new Error(`Unknown import section: ${chunk.sectionKey}`);
    }
    let sectionRootRemId = section.sectionRootRemId;
    if (!sectionRootRemId) {
      const sectionRoot = await ensureChildRem({
        parentRemId: chapterRootRemId,
        title: section.title,
        idempotencyKey: bulkSectionIdempotencyKey(jobId, section.sectionKey, section.sourceHash),
        dryRun,
      });
      if (!sectionRoot.ok) {
        return { ...sectionRoot, createdRemIds };
      }
      sectionRootRemId = sectionRoot.remId;
      createdRemIds.push(...sectionRoot.createdRemIds);
      if (!dryRun) {
        bulkImportJobStore.recordSectionRoot(jobId, section.sectionKey, sectionRootRemId);
        if (sectionRoot.duplicateCount > 1) {
          bulkImportJobStore.appendEvent(jobId, {
            sectionKey: section.sectionKey,
            status: 'needs_manual_review',
            message: `Duplicate section roots detected for "${section.title}". Reused first match.`,
          });
        }
        await persistJob(jobId);
      }
    }

    return {
      ok: true,
      parentRemId: dryRun ? chunk.expectedParent : sectionRootRemId,
      createdRemIds,
    };
  }

  registerTool(
    'run_note_import_job_step',
    {
      title: 'Run note import job step',
      description: 'Use this when you need to write one bounded chunk from a resumable note import job; repeat only until the job reports completion.',
      inputSchema: z.object({
        jobId: z.string().trim().min(1).max(256),
        maxChunks: z.number().int().min(1).max(5).default(1),
        maxChars: z.number().int().min(500).max(24000).optional(),
        dryRun: z.boolean().default(false),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: WRITE_BULK_TOOL_ANNOTATIONS,
    },
    async ({ jobId, maxChunks, maxChars, dryRun }) => {
      try {
        const existingJob = await hydrateJob(jobId, true);
        if (!existingJob) {
          throw new Error(`Unknown import job: ${jobId}`);
        }
        if (existingJob.status === 'cancelled') {
          return cancelledJobResult('run_note_import_job_step', existingJob);
        }
        const manualReview = existingJob.chunks.find((chunk) =>
          chunk.status === 'needs_manual_review' || chunk.reconciliationStatus === 'manual_review'
        );
        if (manualReview) {
          return manualReviewRequiredResult('run_note_import_job_step', existingJob, manualReview);
        }
        const unresolved = bulkImportJobStore.firstReconciliationRequiredChunk(jobId);
        if (unresolved) {
          return reconciliationRequiredResult('run_note_import_job_step', existingJob, unresolved);
        }
        if (dryRun) {
          const preview = previewRunnableChunks(jobId, maxChunks, maxChars);
          return toolResult('Dry run: note import job step previewed without mutating job state.', {
            ok: true,
            status: preview.blocked ? 'PARTIAL' : 'PASS',
            toolName: 'run_note_import_job_step',
            dryRun: true,
            jobId,
            jobStatus: preview.job.status,
            ...durabilityFields(preview.job),
            progress: summarizeBulkImportProgress(preview.job),
            lastStep: preview.steps[0],
            steps: preview.steps,
            nextAction: preview.nextAction,
            warning: preview.blocked
              ? `Chunk ${preview.blocked.chunkId} exceeds maxChars ${maxChars}.`
              : undefined,
          });
        }
        const steps: Array<Record<string, unknown>> = [];
        for (let index = 0; index < maxChunks; index += 1) {
          const chunk = bulkImportJobStore.nextRunnableChunk(jobId);
          if (!chunk) {
            bulkImportJobStore.updateJobStatus(jobId, 'completed', 'All chunks are verified or safely skipped.');
            await persistJob(jobId);
            break;
          }
          if (maxChars && chunk.charCount > maxChars) {
            return toolResult(`Chunk ${chunk.chunkId} exceeds maxChars ${maxChars}; no write was attempted.`, {
              ok: false,
              status: 'PARTIAL',
              toolName: 'run_note_import_job_step',
              jobId,
              jobStatus: existingJob.status,
              ...durabilityFields(existingJob),
              chunk: publicBulkImportChunk(chunk),
              maxChars,
              actualChars: chunk.charCount,
              errorCode: 'CHUNK_EXCEEDS_MAX_CHARS',
              errorMessage: `Chunk ${chunk.chunkId} exceeds maxChars ${maxChars}; no write was attempted.`,
              retryable: false,
              progress: summarizeBulkImportProgress(existingJob),
              nextAction: 'Increase maxChars to at least actualChars or create a new plan with smaller native chunks.',
            });
          }
          const step = await runOneChunk(jobId, chunk, dryRun);
          steps.push(step.step);
          if (
            step.status === 'failed' ||
            step.status === 'partial' ||
            step.status === 'partial_needs_verification' ||
            step.status === 'written_not_verified'
          ) {
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
          ...durabilityFields(job),
          progress: summarizeBulkImportProgress(job),
          verification: bulkStepVerificationSummary(steps),
          lastStep: steps[steps.length - 1],
          steps,
          nextAction: job.status === 'completed' ? 'call verify_note_import_job' : 'call run_note_import_job_step again',
        });
      } catch (error: unknown) {
        if (error instanceof BulkImportRevisionConflictError) {
          return persistenceConflictResult('run_note_import_job_step', error);
        }
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
      description: 'Use this when you need to resume a note import job from its first pending, unverified, partial, or failed chunk without rewriting verified chunks.',
      inputSchema: z.object({ jobId: z.string().trim().min(1).max(256), dryRun: z.boolean().default(false) }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: WRITE_BULK_TOOL_ANNOTATIONS,
    },
    async ({ jobId, dryRun }) => {
      try {
      const existingJob = await hydrateJob(jobId, true);
      if (!existingJob) {
        return toolResult(`Unknown import job: ${jobId}`, {
          ok: false,
          status: 'FAIL',
          toolName: 'resume_note_import_job',
          errorCode: 'INVALID_ARGS',
          errorMessage: `Unknown import job: ${jobId}`,
        }, true);
      }
      if (existingJob.status === 'cancelled') {
        return cancelledJobResult('resume_note_import_job', existingJob);
      }
      const manualReview = existingJob.chunks.find((chunk) =>
        chunk.status === 'needs_manual_review' || chunk.reconciliationStatus === 'manual_review'
      );
      if (manualReview) {
        return manualReviewRequiredResult('resume_note_import_job', existingJob, manualReview);
      }
      const unresolved = bulkImportJobStore.firstReconciliationRequiredChunk(jobId);
      if (unresolved) {
        return reconciliationRequiredResult('resume_note_import_job', existingJob, unresolved);
      }
      if (dryRun) {
        try {
          const preview = previewRunnableChunks(jobId, 1);
          return toolResult('Dry run: note import resume previewed without mutating job state.', {
            ok: true,
            status: 'PASS',
            toolName: 'resume_note_import_job',
            dryRun: true,
            jobId,
            jobStatus: preview.job.status,
            ...durabilityFields(preview.job),
            progress: summarizeBulkImportProgress(preview.job),
            lastStep: preview.chunk ? publicBulkImportChunk(preview.chunk) : undefined,
            previewStep: preview.steps[0],
            nextAction: preview.nextAction,
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          return toolResult(message, {
            ok: false,
            status: 'FAIL',
            toolName: 'resume_note_import_job',
            errorCode: 'INVALID_ARGS',
            errorMessage: message,
          }, true);
        }
      }
      const chunk = bulkImportJobStore.nextRunnableChunk(jobId);
      if (!chunk) {
        const job = bulkImportJobStore.updateJobStatus(jobId, 'completed', 'No pending chunks remain.');
        await persistJob(jobId);
        return toolResult('Import job already has no pending chunks.', {
          ok: true,
          status: 'PASS',
          toolName: 'resume_note_import_job',
          jobId,
          jobStatus: job.status,
          ...durabilityFields(job),
          progress: summarizeBulkImportProgress(job),
        });
      }
      return runOneChunk(jobId, chunk, dryRun)
        .then(({ job, status, step }) => toolResult('Note import job resumed.', {
          ok: true,
          status: ['failed', 'partial', 'partial_needs_verification', 'written_not_verified'].includes(status)
            ? 'PARTIAL'
            : 'PASS',
          toolName: 'resume_note_import_job',
          jobId,
          jobStatus: job.status,
          ...durabilityFields(job),
          progress: summarizeBulkImportProgress(job),
          verification: bulkStepVerificationSummary([step]),
          lastStep: step,
          nextAction: job.status === 'completed' ? 'call verify_note_import_job' : 'call run_note_import_job_step again',
        }))
        .catch((error: unknown) => {
          if (error instanceof BulkImportRevisionConflictError) {
            return persistenceConflictResult('resume_note_import_job', error);
          }
          const message = error instanceof Error ? error.message : String(error);
          return toolResult(message, {
            ok: false,
            status: 'FAIL',
            toolName: 'resume_note_import_job',
            errorCode: 'INTERNAL_ERROR',
            errorMessage: message,
          }, true);
        });
      } catch (error: unknown) {
        if (error instanceof BulkImportRevisionConflictError) {
          return persistenceConflictResult('resume_note_import_job', error);
        }
        const message = error instanceof Error ? error.message : String(error);
        return toolResult(message, {
          ok: false,
          status: 'FAIL',
          toolName: 'resume_note_import_job',
          errorCode: 'INTERNAL_ERROR',
          errorMessage: message,
        }, true);
      }
    }
  );

  registerTool(
    'reconcile_note_import_job_chunk',
    {
      title: 'Reconcile note import job chunk',
      description: 'Use this when live ID, parent, and source readback resolves an unknown chunk outcome and job state must be explicitly reconciled.',
      inputSchema: z.object({
        jobId: z.string().trim().min(1).max(256),
        chunkId: z.string().trim().min(1).max(512).optional(),
        expectedRevision: z.number().int().min(0).optional(),
        expectedParent: z.string().trim().min(1).max(256).optional(),
        outcome: z.enum(['written', 'not_written', 'manual_review']).optional(),
        actualText: z.string().max(240000).optional(),
        createdRemIds: z.array(z.string().trim().min(1).max(256)).max(1000).default([]),
        updatedRemIds: z.array(z.string().trim().min(1).max(256)).max(1000).default([]),
        provenance: z.string().trim().min(3).max(1000).optional(),
        dryRun: z.boolean().default(false),
      }).superRefine((value, context) => {
        if (value.dryRun) return;
        for (const field of ['chunkId', 'expectedRevision', 'expectedParent', 'outcome', 'provenance'] as const) {
          if (value[field] === undefined) {
            context.addIssue({ code: 'custom', path: [field], message: `${field} is required unless dryRun=true.` });
          }
        }
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: STATEFUL_BULK_TOOL_ANNOTATIONS,
    },
    async ({
      jobId,
      chunkId,
      expectedRevision,
      expectedParent,
      outcome,
      actualText,
      createdRemIds,
      updatedRemIds,
      provenance,
      dryRun,
    }) => {
      try {
        const suppliedCreatedRemIds = createdRemIds ?? [];
        const suppliedUpdatedRemIds = updatedRemIds ?? [];
        const job = await hydrateJob(jobId, true);
        if (!job) {
          throw new Error(`Unknown import job: ${jobId}`);
        }
        if (dryRun) {
          const previewChunk = bulkImportJobStore.firstReconciliationRequiredChunk(jobId) ?? job.chunks[0];
          return toolResult('Dry run: reconciliation requirements previewed without changing job state.', {
            ok: true,
            status: 'PASS',
            toolName: 'reconcile_note_import_job_chunk',
            dryRun: true,
            jobId,
            jobRevision: job.revision,
            chunk: previewChunk ? publicBulkImportChunk(previewChunk) : undefined,
            requiredEvidence: ['expectedRevision', 'chunkId', 'expectedParent', 'outcome', 'provenance'],
          });
        }
        if (
          chunkId === undefined ||
          expectedRevision === undefined ||
          expectedParent === undefined ||
          outcome === undefined ||
          provenance === undefined
        ) {
          throw new Error('Reconciliation identity, outcome, revision, and provenance are required.');
        }
        if (job.revision !== expectedRevision) {
          return persistenceConflictResult(
            'reconcile_note_import_job_chunk',
            new BulkImportRevisionConflictError(jobId, expectedRevision, job.revision)
          );
        }
        const chunk = job.chunks.find((candidate) => candidate.chunkId === chunkId);
        if (!chunk) {
          throw new Error(`Unknown import chunk: ${chunkId}`);
        }
        if (chunk.expectedParent !== expectedParent) {
          return toolResult('Reconciliation parent identity does not match the durable chunk manifest.', {
            ok: false,
            status: 'FAIL',
            toolName: 'reconcile_note_import_job_chunk',
            jobId,
            chunkId,
            errorCode: 'RECONCILIATION_IDENTITY_MISMATCH',
            errorMessage: `Expected parent ${chunk.expectedParent}, received ${expectedParent}.`,
            expectedParent: chunk.expectedParent,
            actualParent: expectedParent,
            retryable: false,
          }, true);
        }
        const sourceReport = actualText === undefined
          ? undefined
          : verifyBulkImportSourceText({
              expectedText: chunk.expectedSourceText,
              actualText,
              jobId,
              sectionKey: chunk.sectionKey,
              chunkIndex: chunk.chunkIndex,
            });
        const observedExpectedUnitCount = actualText === undefined
          ? undefined
          : buildBulkImportSourceManifest(actualText, { renderedReadback: true }).units
              .filter((actualUnit) => chunk.sourceManifest.units.some(
                (expectedUnit) => expectedUnit.semanticText === actualUnit.semanticText
              )).length;
        const allCreatedIds = Array.from(new Set([...chunk.createdRemIds, ...suppliedCreatedRemIds]));
        const allUpdatedIds = Array.from(new Set([...chunk.updatedRemIds, ...suppliedUpdatedRemIds]));
        if (outcome === 'written' && (!sourceReport?.ok || allCreatedIds.length + allUpdatedIds.length === 0)) {
          return toolResult('Written reconciliation requires both matching source readback and exact mutation IDs.', {
            ok: false,
            status: 'FAIL',
            toolName: 'reconcile_note_import_job_chunk',
            jobId,
            chunkId,
            errorCode: 'RECONCILIATION_EVIDENCE_INSUFFICIENT',
            errorMessage: 'A hash-only or ID-only match cannot establish written identity.',
            verification: sourceReport,
            createdRemIds: allCreatedIds,
            updatedRemIds: allUpdatedIds,
            retryable: false,
          }, true);
        }
        if (outcome === 'not_written' && (actualText === undefined || (observedExpectedUnitCount ?? 0) > 0)) {
          return toolResult('Not-written reconciliation requires live readback with no semantic units from the expected chunk.', {
            ok: false,
            status: 'FAIL',
            toolName: 'reconcile_note_import_job_chunk',
            jobId,
            chunkId,
            errorCode: 'RECONCILIATION_EVIDENCE_INSUFFICIENT',
            errorMessage: 'Supply live parent readback proving the expected chunk is entirely absent; partial presence requires written reconciliation or manual review.',
            verification: sourceReport,
            observedExpectedUnitCount,
            retryable: false,
          }, true);
        }
        const reconciled = bulkImportJobStore.reconcileChunk(jobId, chunkId, {
          outcome,
          createdRemIds: suppliedCreatedRemIds,
          updatedRemIds: suppliedUpdatedRemIds,
          provenance,
        });
        bulkImportJobStore.saveCheckpoint(jobId, {
          chunkId,
          sectionKey: chunk.sectionKey,
          chunkIndex: chunk.chunkIndex,
          status: outcome === 'written' ? 'verified' : outcome === 'not_written' ? 'pending' : 'needs_manual_review',
          message: `Chunk explicitly reconciled as ${outcome}. Provenance: ${provenance}`,
        });
        await persistJob(jobId);
        const durableJob = bulkImportJobStore.getJob(jobId) ?? reconciled;
        const durableChunk = durableJob.chunks.find((candidate) => candidate.chunkId === chunkId) ?? chunk;
        return toolResult('Note import chunk reconciliation persisted.', {
          ok: true,
          status: 'PASS',
          toolName: 'reconcile_note_import_job_chunk',
          jobId,
          jobRevision: durableJob.revision,
          chunk: publicBulkImportChunk(durableChunk),
          progress: summarizeBulkImportProgress(durableJob),
          verification: sourceReport,
          nextAction: outcome === 'not_written'
            ? 'call resume_note_import_job to perform the explicitly cleared retry'
            : 'call get_note_import_job_status',
        });
      } catch (error: unknown) {
        if (error instanceof BulkImportRevisionConflictError) {
          return persistenceConflictResult('reconcile_note_import_job_chunk', error);
        }
        const message = error instanceof Error ? error.message : String(error);
        return toolResult(message, {
          ok: false,
          status: 'FAIL',
          toolName: 'reconcile_note_import_job_chunk',
          errorCode: 'INVALID_ARGS',
          errorMessage: message,
        }, true);
      }
    }
  );

  registerTool(
    'verify_note_import_job',
    {
      title: 'Verify note import job',
      description: 'Use this when you need a read-only import source-fidelity report from supplied text or live RemNote readback without changing job state.',
      inputSchema: z.object({
        jobId: z.string().trim().min(1).max(256),
        actualTextByChunkId: z.record(z.string(), z.string()).optional(),
        readbackTree: z.unknown().optional(),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: READ_ONLY_BULK_TOOL_ANNOTATIONS,
    },
    async ({ jobId, actualTextByChunkId, readbackTree }) => {
      try {
        const job = await hydrateJob(jobId);
        if (!job) {
          throw new Error(`Unknown import job: ${jobId}`);
        }
        let liveReadbackFailed: string | undefined;
        let liveReadbackTree = readbackTree;
        if (!liveReadbackTree && !actualTextByChunkId && job.chapterRootRemId) {
          const readback = await callPlugin('get_rem_tree', {
            remId: job.chapterRootRemId,
            depth: 12,
          });
          if (readback.ok) {
            liveReadbackTree = readback.result;
          } else {
            liveReadbackFailed = `${readback.error.code}: ${readback.error.message}`;
          }
        }
        const reports = liveReadbackTree || actualTextByChunkId
          ? verifyBulkImportReadback({ job, readbackTree: liveReadbackTree, actualTextByChunkId })
          : job.chunks.map((chunk) =>
              verifyBulkImportSourceText({
                expectedText: chunk.expectedSourceText ?? chunk.sourceText,
                actualText: undefined,
                jobId,
                sectionKey: chunk.sectionKey,
                chunkIndex: chunk.chunkIndex,
              })
            );
        for (const report of reports) {
          const chunk = job.chunks.find((candidate) =>
            candidate.sectionKey === report.sectionKey && candidate.chunkIndex === report.chunkIndex
          );
          if (!chunk) {
            continue;
          }
          const hasMutationIds = chunk.createdRemIds.length > 0 || chunk.updatedRemIds.length > 0;
          if (report.ok && !hasMutationIds) {
            report.ok = false;
            report.status = 'partial';
            report.missingChunks = [...(report.missingChunks ?? []), chunk.chunkId];
            report.warnings.push('Created/updated Rem IDs are missing for this chunk.');
          }
        }
        const updatedJob = job;
        const finalReport = verifyBulkImportFinalReadback({
          job: updatedJob,
          readbackTree: liveReadbackTree,
          chunkReports: reports,
        });
        const failed = reports.filter((report) => !report.ok && report.status !== 'not_verifiable');
        const finalFailed = !finalReport.ok && finalReport.status !== 'not_verifiable';
        const notVerifiable = reports.filter((report) => report.status === 'not_verifiable');
        if (finalReport.status === 'not_verifiable') {
          notVerifiable.push(finalReport);
        }
        const verificationStatus = failed.length > 0 || finalFailed
          ? 'source_fidelity_failed'
          : notVerifiable.length > 0
            ? 'not_verifiable'
            : 'passed';
        const verificationMethod = liveReadbackTree
          ? 'live_readback_tree'
          : actualTextByChunkId
            ? 'supplied_chunk_text'
            : 'manifest_only';
        const verificationWarnings = Array.from(new Set([
          ...reports.flatMap((report) => report.warnings),
          ...finalReport.warnings,
        ]));
        const reconciliationRequired = updatedJob.chunks.some((chunk) =>
          chunk.reconciliationStatus === 'required' || chunk.status === 'needs_manual_review'
        );
        const hasRunnableChunk = updatedJob.chunks.some((chunk) => chunk.status === 'pending');
        const verificationFailed = failed.length > 0 || finalFailed;
        const recommendedAction = verificationFailed
          ? reconciliationRequired
            ? 'inspect exact live Rem IDs, then call reconcile_note_import_job_chunk; do not replay an ambiguous chunk'
            : hasRunnableChunk && updatedJob.status !== 'completed'
              ? 'resume_note_import_job for the first pending chunk only'
              : 'inspect the exact live Rem IDs and repair the existing artifact; do not resume or replay completed chunks'
          : notVerifiable.length > 0
            ? 'perform exact live readback using Rem IDs before claiming source fidelity'
            : 'no action required; retain the verification evidence';
        return toolResult('Note import verification report generated.', {
          ok: failed.length === 0 && !finalFailed,
          status: failed.length > 0 || finalFailed ? 'FAIL' : notVerifiable.length > 0 ? 'PARTIAL' : 'PASS',
          toolName: 'verify_note_import_job',
          jobId,
          jobStatus: updatedJob.status,
          ...durabilityFields(updatedJob),
          verificationStatus,
          verification: {
            attempted: true,
            passed: failed.length === 0 && !finalFailed && notVerifiable.length === 0,
            status: verificationStatus,
            method: verificationMethod,
            reportCount: reports.length,
            finalReportStatus: finalReport.status,
            missingTextPreview: finalReport.missingTextPreview,
            extraTextPreview: finalReport.extraTextPreview,
            wrongParentChunks: finalReport.wrongParentChunks,
            warnings: verificationWarnings,
          },
          reports,
          finalReport,
          progress: summarizeBulkImportProgress(updatedJob),
          limitation: notVerifiable.length > 0 || liveReadbackFailed
            ? `Live/readback verification unavailable for some chunks.${liveReadbackFailed ? ` ${liveReadbackFailed}` : ''}`
            : undefined,
          recommendedAction,
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
      description: 'Use this when the user asks to cancel future steps for a note import job; this never deletes created Rems.',
      inputSchema: z.object({ jobId: z.string().trim().min(1).max(256) }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: STATEFUL_BULK_TOOL_ANNOTATIONS,
    },
    async ({ jobId }) => {
      try {
        const ownedJob = await hydrateJob(jobId, true);
        if (!ownedJob) {
          throw new Error(`Unknown import job: ${jobId}`);
        }
        const job = bulkImportJobStore.cancelJob(jobId);
        await persistJob(jobId);
        return toolResult('Note import job cancelled.', {
          ok: true,
          status: 'PASS',
          toolName: 'cancel_note_import_job',
          jobId,
          jobStatus: job.status,
          ...durabilityFields(job),
          deletionPerformed: false,
          progress: summarizeBulkImportProgress(job),
          nextAction: 'No future chunks will run for this job.',
        });
      } catch (error: unknown) {
        if (error instanceof BulkImportRevisionConflictError) {
          return persistenceConflictResult('cancel_note_import_job', error);
        }
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
