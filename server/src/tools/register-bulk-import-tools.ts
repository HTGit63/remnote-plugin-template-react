import { existsSync, readFileSync, statSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import {
  bulkSectionIdempotencyKey,
  flattenBulkImportReadbackText,
  normalizeBulkImportTitle,
  planNoteImport,
  summarizeBulkImportProgress,
  verifyBulkImportFinalReadback,
  verifyBulkImportReadback,
  verifyBulkImportSourceText,
  stableBulkImportHash,
  type BulkImportChunk,
  type BulkImportChunkStatus,
  type BulkImportJob,
} from '../../../shared/bridge/bulk-import.js';
import type { BridgeFailure, BridgeResponse } from '../../../shared/bridge/protocol.js';
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
  }).passthrough(),
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

const MAX_BULK_IMPORT_SOURCE_FILE_BYTES = 2 * 1024 * 1024;

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
  return {
    ...job,
    progress: summarizeBulkImportProgress(job),
  };
}

function chunkSummary(chunk: BulkImportChunk) {
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

function resultRecord(response: BridgeResponse): Record<string, unknown> {
  return response.ok && typeof response.result === 'object' && response.result !== null
    ? response.result as Record<string, unknown>
    : {};
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function configuredSourceRoots(): string[] {
  const cwd = process.cwd();
  const repoRoot = cwd.endsWith('/server') ? resolve(cwd, '..') : cwd;
  const envRoots = (process.env.REMNOTE_MCP_SOURCE_FILE_ALLOW_ROOTS ?? '')
    .split(',')
    .map((root) => root.trim())
    .filter(Boolean);
  return Array.from(new Set([
    ...envRoots,
    cwd,
    repoRoot,
    tmpdir(),
    '/mnt/data',
    resolve(homedir(), 'Downloads', 'Remnote'),
  ].map((root) => resolve(root))));
}

function isPathUnderRoot(pathname: string, root: string): boolean {
  const normalizedPath = resolve(pathname);
  const normalizedRoot = resolve(root);
  return normalizedPath === normalizedRoot || normalizedPath.startsWith(`${normalizedRoot}/`);
}

function readBulkImportSourceFile(sourceFilePath: string): {
  sourceText: string;
  resolvedPath: string;
  sourceName: string;
  byteLength: number;
} {
  const resolvedPath = resolveConnectorSourcePath(sourceFilePath);
  const allowedRoots = configuredSourceRoots();
  if (!allowedRoots.some((root) => isPathUnderRoot(resolvedPath, root))) {
    throw new Error(
      `sourceFilePath is outside allowed roots. Configure REMNOTE_MCP_SOURCE_FILE_ALLOW_ROOTS or place the file under ${allowedRoots.join(', ')}.`
    );
  }
  if (!existsSync(resolvedPath)) {
    throw new Error(`sourceFilePath does not exist: ${resolvedPath}`);
  }
  const stats = statSync(resolvedPath);
  if (!stats.isFile()) {
    throw new Error(`sourceFilePath must be a regular file: ${resolvedPath}`);
  }
  if (stats.size > MAX_BULK_IMPORT_SOURCE_FILE_BYTES) {
    throw new Error(`sourceFilePath exceeds ${MAX_BULK_IMPORT_SOURCE_FILE_BYTES} bytes.`);
  }
  return {
    sourceText: readFileSync(resolvedPath, 'utf8'),
    resolvedPath,
    sourceName: basename(resolvedPath),
    byteLength: stats.size,
  };
}

function sourceFilePathFromArgs(args: {
  sourceFilePath?: unknown;
  filePath?: unknown;
  path?: unknown;
  sourceFileUri?: unknown;
  sourceFile?: unknown;
}): string {
  for (const candidate of [args.sourceFilePath, args.filePath, args.path, args.sourceFileUri, args.sourceFile]) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
    if (typeof candidate === 'object' && candidate !== null) {
      for (const key of ['path', 'filePath', 'sourceFilePath', 'uri', 'url', 'href']) {
        const value = (candidate as Record<string, unknown>)[key];
        if (typeof value === 'string' && value.trim()) {
          return value.trim();
        }
      }
    }
  }
  throw new Error('sourceFilePath is required.');
}

function resolveConnectorSourcePath(sourceFilePath: string): string {
  const trimmed = sourceFilePath.trim();
  if (!trimmed) {
    throw new Error('sourceFilePath is required.');
  }

  if (trimmed.startsWith('file://')) {
    return resolve(fileURLToPath(trimmed));
  }

  const sandboxMatch = trimmed.match(/^sandbox:(?:\/\/)?(.+)$/);
  if (sandboxMatch) {
    const pathPart = decodeURIComponent(sandboxMatch[1]);
    return resolve(pathPart.startsWith('/') ? pathPart : `/${pathPart}`);
  }

  const mountedFileMatch = trimmed.match(/^(?:connector|chatgpt|openai-file|mnt-data):(?:\/\/)?(.+)$/);
  if (mountedFileMatch) {
    const pathPart = decodeURIComponent(mountedFileMatch[1]);
    if (pathPart.startsWith('/')) {
      return resolve(pathPart);
    }
    return resolve('/mnt/data', pathPart.replace(/^mnt\/data\//, ''));
  }

  return resolve(decodeURIComponent(trimmed.replace(/^\/?mnt\/data\//, '/mnt/data/')));
}

function planStructuredOutput(plan: ReturnType<typeof planNoteImport>, toolName: string) {
  return {
    ok: true,
    status: 'PASS',
    toolName,
    planId: plan.planId,
    sourceHash: plan.sourceHash,
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
      sourceLength: section.sourceText.length,
      bodySourceLength: section.bodySourceText.length,
      chunkCount: section.chunkCount,
    })),
    estimatedChunks: plan.estimatedChunks,
    estimatedRems: plan.estimatedRems,
    warnings: plan.warnings,
    nextAction: 'call start_note_import_job with this planId',
  };
}

function bridgeFailureMessage(response: BridgeFailure): string {
  return `${response.error.code}: ${response.error.message}`;
}

function partialFailureStatus(response: BridgeFailure): BulkImportChunkStatus {
  return response.error.code === 'TIMEOUT' || response.error.code === 'RETRYABLE_UNKNOWN_WRITE_STATUS'
    ? 'partial'
    : 'failed';
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
      description: 'Read a local source file on the server, extract a bounded chapter span, and plan a resumable import without writing.',
      inputSchema: PLAN_IMPORT_FROM_FILE_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) => {
      try {
        const sourceFilePath = sourceFilePathFromArgs(args);
        const file = readBulkImportSourceFile(sourceFilePath);
        const plan = planNoteImport({
          ...args,
          sourceKind: 'file',
          sourceFilePath: file.resolvedPath,
          sourceName: args.sourceName ?? file.sourceName,
          sourceText: file.sourceText,
        });
        bulkImportJobStore.savePlan(plan);
        return toolResult('File-backed note import plan created.', {
          ...planStructuredOutput(plan, 'plan_note_import_from_file'),
          sourceFile: {
            path: file.resolvedPath,
            byteLength: file.byteLength,
            sourceHash: stableBulkImportHash(file.sourceText),
            extractedChapterHash: plan.sourceMetadata.extractedSourceHash,
            plannedSourceHash: plan.sourceMetadata.plannedSourceHash,
          },
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return toolResult(message, {
          ok: false,
          status: 'FAIL',
          toolName: 'plan_note_import_from_file',
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
          importRootTitle: job.importRootTitle,
          chapterTitle: job.chapterTitle,
          sourceMetadata: job.sourceMetadata,
          plannedSourceLength: job.plannedSourceLength,
          extractedSourceLength: job.extractedSourceLength,
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
    'start_note_import_from_file',
    {
      title: 'Start note import from file',
      description: 'Read a local source file, create a safe import plan, and start a resumable job without writing chunks yet.',
      inputSchema: PLAN_IMPORT_FROM_FILE_INPUT_SCHEMA.extend({
        jobId: z.string().trim().min(1).max(256).optional(),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) => {
      try {
        const sourceFilePath = sourceFilePathFromArgs(args);
        const file = readBulkImportSourceFile(sourceFilePath);
        const plan = planNoteImport({
          ...args,
          sourceKind: 'file',
          sourceFilePath: file.resolvedPath,
          sourceName: args.sourceName ?? file.sourceName,
          sourceText: file.sourceText,
        });
        bulkImportJobStore.savePlan(plan);
        const job = bulkImportJobStore.createJob(plan.planId, args.jobId);
        return toolResult('File-backed note import job started.', {
          ...planStructuredOutput(plan, 'start_note_import_from_file'),
          jobId: job.jobId,
          jobStatus: job.status,
          storageDurability: job.storageDurability,
          warning: 'memory storage is not durable across server restart',
          progress: summarizeBulkImportProgress(job),
          sourceFile: {
            path: file.resolvedPath,
            byteLength: file.byteLength,
            sourceHash: stableBulkImportHash(file.sourceText),
            extractedChapterHash: plan.sourceMetadata.extractedSourceHash,
            plannedSourceHash: plan.sourceMetadata.plannedSourceHash,
          },
          nextAction: 'call run_note_import_job_step',
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return toolResult(message, {
          ok: false,
          status: 'FAIL',
          toolName: 'start_note_import_from_file',
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

    const hierarchy = await ensureChunkHierarchy(jobId, chunk, dryRun);
    if (!hierarchy.ok) {
      const status = partialFailureStatus(hierarchy.response);
      const finishedAt = new Date().toISOString();
      const job = bulkImportJobStore.updateChunk(jobId, chunk.chunkId, {
        status,
        verificationStatus: status === 'partial' ? 'partial' : 'failed',
        finishedAt,
        durationMs: Math.max(0, Date.parse(finishedAt) - Date.parse(startedAt)),
        error: bridgeFailureMessage(hierarchy.response),
      });
      bulkImportJobStore.saveCheckpoint(jobId, {
        chunkId: chunk.chunkId,
        sectionKey: chunk.sectionKey,
        chunkIndex: chunk.chunkIndex,
        status,
        message: hierarchy.response.error.message,
      });
      return { response: hierarchy.response, job, status };
    }

    const markdownArgs = {
      parentRemId: hierarchy.parentRemId,
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
      const status = partialFailureStatus(response);
      const durationMs = Math.max(0, Date.parse(finishedAt) - Date.parse(startedAt));
      const job = bulkImportJobStore.updateChunk(jobId, chunk.chunkId, {
        status,
        verificationStatus: status === 'partial' ? 'partial' : 'failed',
        finishedAt,
        durationMs,
        error: bridgeFailureMessage(response),
      });
      bulkImportJobStore.saveCheckpoint(jobId, {
        chunkId: chunk.chunkId,
        sectionKey: chunk.sectionKey,
        chunkIndex: chunk.chunkIndex,
        status,
        message: response.error.message,
      });
      return { response, job, status };
    }

    const result = resultRecord(response);
    const durationMs = Math.max(0, Date.parse(finishedAt) - Date.parse(startedAt));
    const createdRemIds = Array.from(new Set([
      ...hierarchy.createdRemIds,
      ...stringArray(result.createdRemIds),
      ...stringArray(result.createdRemId ? [result.createdRemId] : undefined),
    ]));
    const updatedRemIds = stringArray(result.updatedRemIds);
    const verification = typeof result.verification === 'object' && result.verification !== null
      ? result.verification as { passed?: boolean }
      : undefined;
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
      : readbackVerification?.ok === true && verification?.passed !== false
        ? 'verified'
        : readbackVerification?.ok === false || verification?.passed === false
        ? 'partial'
        : 'written_not_verified';
    const job = bulkImportJobStore.updateChunk(jobId, chunk.chunkId, {
      status: nextStatus,
      verificationStatus: dryRun
        ? 'not_verifiable'
        : readbackVerification?.ok === true && verification?.passed !== false
          ? 'passed'
          : readbackVerification?.ok === false || verification?.passed === false
            ? 'source_fidelity_failed'
            : 'written_not_verified',
      finishedAt,
      durationMs,
      createdRemIds,
      updatedRemIds,
      error: readbackVerification?.ok === false
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
    return { response, job, status: nextStatus };
  }

  function previewRunnableChunks(jobId: string, maxChunks = 1, maxChars?: number) {
    const job = bulkImportJobStore.getJob(jobId);
    if (!job) {
      throw new Error(`Unknown import job: ${jobId}`);
    }
    const runnable = job.chunks
      .filter((chunk) =>
        ['pending', 'partial', 'partial_needs_verification', 'written_not_verified', 'failed'].includes(chunk.status)
      )
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
        ? 'call verify_note_import_job'
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
    | { ok: false; response: BridgeFailure }
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
          return importRoot;
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
        return chapter;
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
        return sectionRoot;
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
        if (dryRun) {
          const preview = previewRunnableChunks(jobId, maxChunks, maxChars);
          return toolResult('Dry run: note import job step previewed without mutating job state.', {
            ok: true,
            status: preview.blocked ? 'PARTIAL' : 'PASS',
            toolName: 'run_note_import_job_step',
            dryRun: true,
            jobId,
            jobStatus: preview.job.status,
            progress: summarizeBulkImportProgress(preview.job),
            lastStep: preview.steps[0],
            steps: preview.steps,
            nextAction: preview.nextAction,
            warning: preview.blocked
              ? `Chunk ${preview.blocked.chunkId} exceeds maxChars ${maxChars}.`
              : undefined,
          });
        }
        const steps = [];
        for (let index = 0; index < maxChunks; index += 1) {
          const chunk = bulkImportJobStore.nextRunnableChunk(jobId);
          if (!chunk) {
            bulkImportJobStore.updateJobStatus(jobId, 'completed', 'All chunks are verified or safely skipped.');
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
      description: 'Resume a note import job from first pending, unverified, partial, or failed chunk without rewriting verified chunks.',
      inputSchema: z.object({ jobId: z.string().trim().min(1).max(256), dryRun: z.boolean().default(false) }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: { readOnlyHint: false, openWorldHint: false },
    },
    async ({ jobId, dryRun }) => {
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
            progress: summarizeBulkImportProgress(preview.job),
            lastStep: preview.chunk ? chunkSummary(preview.chunk) : undefined,
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
      description: 'Verify import source fidelity from supplied text or live RemNote readback when available.',
      inputSchema: z.object({
        jobId: z.string().trim().min(1).max(256),
        actualTextByChunkId: z.record(z.string(), z.string()).optional(),
        readbackTree: z.unknown().optional(),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ jobId, actualTextByChunkId, readbackTree }) => {
      try {
        const job = bulkImportJobStore.getJob(jobId);
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
          if (report.ok && hasMutationIds) {
            bulkImportJobStore.updateChunk(jobId, chunk.chunkId, {
              status: 'verified',
              verificationStatus: 'passed',
              error: undefined,
            });
          } else if (report.ok && !hasMutationIds) {
            bulkImportJobStore.updateChunk(jobId, chunk.chunkId, {
              status: 'partial_needs_verification',
              verificationStatus: 'partial',
              error: 'Readback text matched, but created/updated Rem IDs are missing.',
            });
            report.ok = false;
            report.status = 'partial';
            report.missingChunks = [...(report.missingChunks ?? []), chunk.chunkId];
            report.warnings.push('Created/updated Rem IDs are missing for this chunk.');
          } else if (report.status === 'source_fidelity_failed') {
            bulkImportJobStore.updateChunk(jobId, chunk.chunkId, {
              status: 'partial_needs_verification',
              verificationStatus: 'source_fidelity_failed',
              error: 'Source fidelity verification failed.',
            });
          }
        }
        const updatedJob = bulkImportJobStore.getJob(jobId) ?? job;
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
        return toolResult('Note import verification report generated.', {
          ok: failed.length === 0 && !finalFailed,
          status: failed.length > 0 || finalFailed ? 'FAIL' : notVerifiable.length > 0 ? 'PARTIAL' : 'PASS',
          toolName: 'verify_note_import_job',
          jobId,
          jobStatus: updatedJob.status,
          verificationStatus: failed.length > 0 || finalFailed
            ? 'source_fidelity_failed'
            : notVerifiable.length > 0
              ? 'not_verifiable'
              : 'passed',
          reports,
          finalReport,
          progress: summarizeBulkImportProgress(updatedJob),
          limitation: notVerifiable.length > 0 || liveReadbackFailed
            ? `Live/readback verification unavailable for some chunks.${liveReadbackFailed ? ` ${liveReadbackFailed}` : ''}`
            : undefined,
          recommendedAction: failed.length > 0 || finalFailed ? 'resume_note_import_job' : 'manual live readback check if needed',
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
