import { describe, expect, test } from 'vitest';
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { registerBulkImportTools } from '../server/src/tools/register-bulk-import-tools';
import type { AuthenticatedPrincipal } from '../server/src/auth/types';
import type { BulkImportSourceFileLoader } from '../server/src/bulk-import/source-file-loader';
import type { McpToolResult, ToolRegistrationContext } from '../server/src/tools/tool-context';
import type { BridgeResponse, BridgeToolArgs, BridgeToolName } from '../shared/bridge/protocol';

type Handler = (args: any) => Promise<McpToolResult>;

const chapter = [
  '# Chapter One',
  '',
  '## 1.1 Atomic nuclei',
  '',
  'Alpha source text.',
  '',
  '## 1.2 Mass defect',
  '',
  'Beta source text.',
].join('\n');

const exportedChapter = [
  '- # Chapter One:',
  '    - ## 1.1 Atomic nuclei',
  '        - Alpha source text.',
  '    - ## 1.2 Mass defect',
  '        - Beta source text with $E=mc^2$.',
  '- # Chapter Two:',
  '    - ## 2.1 Excluded',
  '        - This must not be imported.',
].join('\n');

function success(id: string, result: Record<string, unknown>): BridgeResponse {
  return { id, ok: true, result };
}

function failure(id: string, code: 'TIMEOUT' | 'PLUGIN_NOT_CONNECTED', message = code): BridgeResponse {
  return { id, ok: false, error: { code, message } };
}

function text(result: McpToolResult): Record<string, any> {
  return result.structuredContent as Record<string, any>;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function principal(authMode: AuthenticatedPrincipal['authMode']): AuthenticatedPrincipal {
  return {
    subject: `test:${authMode}`,
    authMode,
    scopeGrants: ['bridge:read'],
    accessScope: 'focused-rem-only',
    trustedWriteMode: 'ask-every-write',
    toolTier: 'mass_note_writer',
  };
}

function makeHarness(options: {
  writeResponses?: BridgeResponse[];
  readbackFails?: boolean;
  readbackFailures?: number;
  polluteWriteReadback?: boolean;
  principal?: AuthenticatedPrincipal | null;
  sourceFileAllowRoots?: string[];
  sourceFileMaxBytes?: number;
  sourceFileLoader?: BulkImportSourceFileLoader;
} = {}) {
  const handlers: Record<string, Handler> = {};
  const toolConfigs: Record<string, Record<string, any>> = {};
  const childMap = new Map<string, Array<{ remId: string; title: string; frontText: string; plainText: string; children: any[] }>>();
  const createCalls: Array<{ parentId: string | null; markdown: string; idempotencyKey?: string }> = [];
  const writeCalls: Array<{ parentRemId: string; idempotencyKey?: string; markdownText: string }> = [];
  const idempotency = new Map<string, string>();
  let idCounter = 0;
  const nextId = () => `fake-rem-${++idCounter}`;
  const ensureList = (parentId: string) => {
    const list = childMap.get(parentId) ?? [];
    childMap.set(parentId, list);
    return list;
  };
  const nodeById = (remId: string): any => {
    for (const children of childMap.values()) {
      const found = children.find((child) => child.remId === remId);
      if (found) {
        return {
          remId: found.remId,
          frontText: found.frontText,
          plainText: found.plainText,
          title: found.title,
          children: childMap.get(found.remId) ?? [],
        };
      }
    }
    return { remId, frontText: remId, plainText: remId, title: remId, children: childMap.get(remId) ?? [] };
  };

  const writeResponses = [...(options.writeResponses ?? [])];
  let readbackFailuresRemaining = options.readbackFails ? Number.POSITIVE_INFINITY : options.readbackFailures ?? 0;
  const callPlugin = async <TTool extends BridgeToolName>(
    tool: TTool,
    args: BridgeToolArgs[TTool]
  ): Promise<BridgeResponse> => {
    if (tool === 'get_children') {
      const parentRemId = (args as any).parentRemId;
      return success('get-children', {
        parentRemId,
        remId: parentRemId,
        children: ensureList(parentRemId).map((child, index) => ({ ...child, breadcrumbs: [], index, hasChildren: true, type: 'rem' })),
        childCount: ensureList(parentRemId).length,
        truncated: false,
      });
    }
    if (tool === 'create_rem') {
      const input = args as any;
      createCalls.push({ parentId: input.parentId, markdown: input.markdown, idempotencyKey: input.idempotencyKey });
      const cached = input.idempotencyKey ? idempotency.get(input.idempotencyKey) : undefined;
      if (cached) {
        return success('create-rem', { createdRemId: cached, parentId: input.parentId, status: 'created' });
      }
      const remId = nextId();
      if (input.idempotencyKey) {
        idempotency.set(input.idempotencyKey, remId);
      }
      ensureList(input.parentId).push({
        remId,
        title: input.markdown,
        frontText: input.markdown,
        plainText: input.markdown,
        children: [],
      });
      return success('create-rem', { createdRemId: remId, parentId: input.parentId, status: 'created' });
    }
    if (tool === 'create_or_replace_note_from_markdown') {
      const input = args as any;
      writeCalls.push({
        parentRemId: input.parentRemId,
        idempotencyKey: input.safetyOptions?.idempotencyKey,
        markdownText: input.markdownText,
      });
      const queued = writeResponses.shift();
      if (queued && !queued.ok) {
        return queued;
      }
      const createdRemId = nextId();
      ensureList(input.parentRemId).push({
        remId: createdRemId,
        title: input.markdownText,
        frontText: input.markdownText,
        plainText: input.markdownText,
        children: [],
      });
      if (options.polluteWriteReadback) {
        const sizeId = nextId();
        const hId = nextId();
        const sizeNode = {
          remId: sizeId,
          title: 'Size',
          frontText: 'Size',
          plainText: 'Size',
          children: [],
        };
        ensureList(input.parentRemId).push(sizeNode);
        ensureList(sizeId).push({
          remId: hId,
          title: 'H3',
          frontText: 'H3',
          plainText: 'H3',
          children: [],
        });
      }
      return queued ?? success('write', {
        createdRemIds: [createdRemId],
        updatedRemIds: [],
        verification: { passed: true },
      });
    }
    if (tool === 'get_rem_tree') {
      if (readbackFailuresRemaining > 0) {
        readbackFailuresRemaining -= 1;
        return failure('readback', 'PLUGIN_NOT_CONNECTED', 'No fake readback.');
      }
      return success('tree', nodeById((args as any).remId));
    }
    return failure('unknown', 'PLUGIN_NOT_CONNECTED', `Unhandled fake tool ${tool}`);
  };

  registerBulkImportTools({
    registerTool: ((name: string, config: Record<string, any>, handler: Handler) => {
      toolConfigs[name] = config;
      handlers[name] = handler;
      return undefined;
    }) as ToolRegistrationContext['registerTool'],
    callPlugin: callPlugin as ToolRegistrationContext['callPlugin'],
    currentRegistry: (() => ({})) as ToolRegistrationContext['currentRegistry'],
    exposeDeleteTool: false,
    hub: {} as ToolRegistrationContext['hub'],
    principal: options.principal === undefined ? principal('local_bridge_token') : options.principal ?? undefined,
    sourceFilePolicy: {
      allowedRoots: options.sourceFileAllowRoots ?? [tmpdir()],
      maxBytes: options.sourceFileMaxBytes ?? 2 * 1024 * 1024,
      remoteTimeoutMs: 5000,
    },
    sourceFileLoader: options.sourceFileLoader,
  });

  async function createJob(jobId: string) {
    const plan = text(await handlers.plan_note_import({
      sourceText: chapter,
      targetRootId: 'Plugin Test',
      options: { maxCharsPerChunk: 2000 },
    }));
    const start = text(await handlers.start_note_import_job({ planId: plan.planId, jobId }));
    return { plan, start, jobId };
  }

  return { handlers, toolConfigs, createJob, createCalls, writeCalls, childMap };
}

describe('bulk import MCP tools', () => {
  test('plans and starts a file-backed import without passing full source through tool args', async () => {
    const h = makeHarness();
    const folder = mkdtempSync(join(tmpdir(), 'remnote-bulk-import-'));
    const sourceFilePath = join(folder, 'Nuclear Phyiscs.md');
    writeFileSync(sourceFilePath, exportedChapter, 'utf8');

    const plan = text(await h.handlers.plan_note_import_from_file({
      sourceFilePath,
      targetRootId: 'Plugin Test',
      rootTitle: 'Nuclear Physics — Chapter One Bulk Import Test',
      startMarker: '# Chapter One:',
      stopBeforeMarker: '# Chapter Two:',
    }));

    expect(plan.status).toBe('PASS');
    expect(plan.sourceMetadata.sourceKind).toBe('file');
    expect(plan.sourceMetadata.stopMarkerFound).toBe(true);
    expect(plan.chapterTitle).toBe('Chapter One');
    expect(plan.importRootTitle).toBe('Nuclear Physics — Chapter One Bulk Import Test');
    expect(plan.sections.map((section: any) => section.sectionKey)).toEqual(['1.1', '1.2']);
    expect(JSON.stringify(plan)).not.toContain('This must not be imported');

    const started = text(await h.handlers.start_note_import_from_file({
      sourceFilePath,
      targetRootId: 'Plugin Test',
      rootTitle: 'Nuclear Physics — Chapter One Bulk Import Test',
      startMarker: '# Chapter One:',
      stopBeforeMarker: '# Chapter Two:',
      jobId: 'bulk-job:file-backed',
    }));
    expect(started.jobId).toBe('bulk-job:file-backed');
    expect(started.progress.chunksTotal).toBe(2);
    expect(started.nextAction).toBe('call run_note_import_job_step');
  });

  test('accepts connector-style mounted file references and returns source hashes', async () => {
    const h = makeHarness();
    const folder = mkdtempSync(join(tmpdir(), 'remnote-bulk-import-mounted-'));
    const sourceFilePath = join(folder, 'Nuclear Phyiscs.md');
    writeFileSync(sourceFilePath, exportedChapter, 'utf8');

    const plan = text(await h.handlers.plan_note_import_from_file({
      sourceFilePath: pathToFileURL(sourceFilePath).href,
      targetRootId: 'Plugin Test',
      rootTitle: 'Nuclear Physics — Chapter One Bulk Import Test',
      startMarker: '# Chapter One:',
      stopBeforeMarker: '# Chapter Two:',
    }));

    expect(plan.status).toBe('PASS');
    expect(plan.sourceFile.path).toBe(sourceFilePath);
    expect(plan.sourceFile.byteLength).toBeGreaterThan(0);
    expect(plan.sourceFile.sourceHash).toBe(plan.sourceMetadata.rawSourceHash);
    expect(plan.sourceFile.extractedChapterHash).toBe(plan.sourceMetadata.extractedSourceHash);
    expect(plan.sourceFile.plannedSourceHash).toBe(plan.sourceMetadata.plannedSourceHash);
    expect(plan.standard.operationId).toMatch(/^plan_note_import_from_file-/);
    expect(plan.standard.parentRemId).toBe('Plugin Test');
    expect(plan.standard.phaseDurations.totalMs).toBe(0);

    const sandboxPlan = text(await h.handlers.plan_note_import_from_file({
      sourceFilePath: `sandbox:${sourceFilePath}`,
      targetRootId: 'Plugin Test',
      rootTitle: 'Nuclear Physics — Chapter One Bulk Import Test',
      startMarker: '# Chapter One:',
      stopBeforeMarker: '# Chapter Two:',
    }));
    expect(sandboxPlan.status).toBe('PASS');
    expect(sandboxPlan.sourceFile.path).toBe(sourceFilePath);
  });

  test('accepts mounted file object aliases from connector file pickers', async () => {
    const h = makeHarness();
    const folder = mkdtempSync(join(tmpdir(), 'remnote-bulk-import-object-'));
    const sourceFilePath = join(folder, 'Nuclear Phyiscs.md');
    writeFileSync(sourceFilePath, exportedChapter, 'utf8');

    const plan = text(await h.handlers.plan_note_import_from_file({
      sourceFile: { path: sourceFilePath, name: 'Nuclear Phyiscs.md' },
      targetRootId: 'Plugin Test',
      rootTitle: 'Nuclear Physics — Chapter One Bulk Import Test',
      startMarker: '# Chapter One:',
      stopBeforeMarker: '# Chapter Two:',
    }));

    expect(plan.status).toBe('PASS');
    expect(plan.sourceFile.path).toBe(sourceFilePath);
    expect(plan.sourceMetadata.sourceKind).toBe('file');
  });

  test.each([
    ['filePath', (sourceFilePath: string) => ({ filePath: sourceFilePath })],
    ['path', (sourceFilePath: string) => ({ path: sourceFilePath })],
    ['sourceFileUri', (sourceFilePath: string) => ({ sourceFileUri: pathToFileURL(sourceFilePath).href })],
    ['sourceFile.filePath', (sourceFilePath: string) => ({ sourceFile: { filePath: sourceFilePath } })],
    ['sourceFile.uri', (sourceFilePath: string) => ({ sourceFile: { uri: pathToFileURL(sourceFilePath).href } })],
  ])('accepts safe %s alias', async (_label, sourceArgs) => {
    const allowedRoot = mkdtempSync(join(tmpdir(), 'remnote-bulk-import-alias-'));
    const sourceFilePath = join(allowedRoot, 'chapter.md');
    writeFileSync(sourceFilePath, exportedChapter, 'utf8');
    const h = makeHarness({ sourceFileAllowRoots: [allowedRoot] });

    const plan = text(await h.handlers.plan_note_import_from_file({
      ...sourceArgs(sourceFilePath),
      targetRootId: 'Plugin Test',
      startMarker: '# Chapter One:',
      stopBeforeMarker: '# Chapter Two:',
    }));

    expect(plan.status).toBe('PASS');
    expect(plan.sourceFile.path).toBe(sourceFilePath);
  });

  test('rejects relative, file URI, connector URI, and symlink root escapes', async () => {
    const parent = mkdtempSync(join(tmpdir(), 'remnote-bulk-import-boundary-'));
    const allowedRoot = join(parent, 'allowed');
    const outsideRoot = join(parent, 'outside');
    mkdirSync(allowedRoot);
    mkdirSync(outsideRoot);
    const outsideFile = join(outsideRoot, 'secret.md');
    writeFileSync(outsideFile, exportedChapter, 'utf8');
    const symlinkPath = join(allowedRoot, 'linked-secret.md');
    symlinkSync(outsideFile, symlinkPath);
    const h = makeHarness({ sourceFileAllowRoots: [allowedRoot] });

    const references = [
      relative(process.cwd(), outsideFile),
      pathToFileURL(outsideFile).href,
      `file://${pathToFileURL(outsideFile).pathname.replace('/outside/', '/allowed/%2e%2e/outside/')}`,
      'connector:../etc/passwd',
      symlinkPath,
    ];

    for (const sourceFilePath of references) {
      const result = text(await h.handlers.plan_note_import_from_file({
        sourceFilePath,
        targetRootId: 'Plugin Test',
      }));
      expect(result.status).toBe('FAIL');
      expect(result.errorCode).toBe('SOURCE_FILE_OUTSIDE_ALLOWED_ROOTS');
    }
  });

  test('rejects oversized files before planning any source content', async () => {
    const allowedRoot = mkdtempSync(join(tmpdir(), 'remnote-bulk-import-size-'));
    const sourceFilePath = join(allowedRoot, 'too-large.md');
    writeFileSync(sourceFilePath, '# Too large\n' + 'x'.repeat(128), 'utf8');
    const h = makeHarness({ sourceFileAllowRoots: [allowedRoot], sourceFileMaxBytes: 64 });

    const result = text(await h.handlers.plan_note_import_from_file({
      sourceFilePath,
      targetRootId: 'Plugin Test',
    }));

    expect(result.status).toBe('FAIL');
    expect(result.errorCode).toBe('SOURCE_FILE_TOO_LARGE');
    expect(result.errorMessage).toContain('64 bytes');
    expect(result).not.toHaveProperty('planId');
  });

  test('declares and accepts official ChatGPT top-level file params without leaking signed URL', async () => {
    const fileRef = {
      download_url: 'https://files.example.invalid/chapter.md?signature=secret',
      file_id: 'file_stage8',
      mime_type: 'text/markdown',
      file_name: 'chapter.md',
    };
    const h = makeHarness({
      principal: principal('hosted_oauth'),
      sourceFileLoader: async (args) => {
        expect(args.sourceFile).toEqual(fileRef);
        return {
          sourceText: exportedChapter,
          sourceName: fileRef.file_name,
          byteLength: Buffer.byteLength(exportedChapter),
          sourceReference: {
            kind: 'chatgpt_file',
            fileId: fileRef.file_id,
            fileName: fileRef.file_name,
          },
        };
      },
    });

    expect(h.toolConfigs.plan_note_import_from_file._meta['openai/fileParams']).toEqual(['sourceFile']);
    expect(h.toolConfigs.start_note_import_from_file._meta['openai/fileParams']).toEqual(['sourceFile']);
    expect(h.toolConfigs.plan_note_import_from_file.annotations).toMatchObject({
      readOnlyHint: false,
      openWorldHint: false,
      destructiveHint: false,
    });

    const plan = text(await h.handlers.plan_note_import_from_file({
      sourceFile: fileRef,
      targetRootId: 'Plugin Test',
      startMarker: '# Chapter One:',
      stopBeforeMarker: '# Chapter Two:',
    }));

    expect(plan.status).toBe('PASS');
    expect(plan.sourceFile).toMatchObject({
      kind: 'chatgpt_file',
      fileId: 'file_stage8',
      fileName: 'chapter.md',
    });
    expect(JSON.stringify(plan)).not.toContain('signature=secret');
  });

  test('keeps local paths and ChatGPT file references in their authenticated lanes', async () => {
    const allowedRoot = mkdtempSync(join(tmpdir(), 'remnote-bulk-import-auth-'));
    const sourceFilePath = join(allowedRoot, 'chapter.md');
    writeFileSync(sourceFilePath, exportedChapter, 'utf8');

    const unauthenticated = makeHarness({ principal: null, sourceFileAllowRoots: [allowedRoot] });
    const unauthResult = text(await unauthenticated.handlers.plan_note_import_from_file({
      sourceFilePath,
      targetRootId: 'Plugin Test',
    }));
    expect(unauthResult.errorCode).toBe('SOURCE_FILE_AUTH_REQUIRED');

    const hosted = makeHarness({ principal: principal('hosted_oauth'), sourceFileAllowRoots: [allowedRoot] });
    const hostedLocalResult = text(await hosted.handlers.plan_note_import_from_file({
      sourceFilePath,
      targetRootId: 'Plugin Test',
    }));
    expect(hostedLocalResult.errorCode).toBe('SOURCE_FILE_LOCAL_AUTH_REQUIRED');

    const unlinkedCodex = makeHarness({ principal: principal('codex_bearer'), sourceFileAllowRoots: [allowedRoot] });
    const unlinkedCodexLocalResult = text(await unlinkedCodex.handlers.plan_note_import_from_file({
      sourceFilePath,
      targetRootId: 'Plugin Test',
    }));
    expect(unlinkedCodexLocalResult.errorCode).toBe('SOURCE_FILE_CODEX_PAIRING_REQUIRED');

    const codex = makeHarness({
      principal: { ...principal('codex_bearer'), codexPairingStatus: 'linked', codexLinkId: 'pairing:file-owner' },
      sourceFileAllowRoots: [allowedRoot],
    });
    const codexLocalResult = text(await codex.handlers.plan_note_import_from_file({
      sourceFilePath,
      targetRootId: 'Plugin Test',
    }));
    expect(codexLocalResult.status).toBe('PASS');

    const codexWithoutReadScope = makeHarness({
      principal: { ...principal('codex_bearer'), scopeGrants: [] },
      sourceFileAllowRoots: [allowedRoot],
    });
    const noReadScopeResult = text(await codexWithoutReadScope.handlers.plan_note_import_from_file({
      sourceFilePath,
      targetRootId: 'Plugin Test',
    }));
    expect(noReadScopeResult.errorCode).toBe('SOURCE_FILE_READ_SCOPE_REQUIRED');

    const codexChatGptResult = text(await codex.handlers.plan_note_import_from_file({
      sourceFile: {
        download_url: 'https://files.example.invalid/chapter.md',
        file_id: 'file_stage8',
      },
      targetRootId: 'Plugin Test',
    }));
    expect(codexChatGptResult.errorCode).toBe('SOURCE_FILE_CHATGPT_AUTH_REQUIRED');
  });

  test('dry-run resume previews next chunk without mutating job state', async () => {
    const h = makeHarness();
    const { jobId } = await h.createJob('bulk-job:resume-dry-run');
    const before = clone(text(await h.handlers.get_note_import_job_status({ jobId })).job);
    const resume = text(await h.handlers.resume_note_import_job({ jobId, dryRun: true }));
    const after = clone(text(await h.handlers.get_note_import_job_status({ jobId })).job);

    expect(resume.status).toBe('PASS');
    expect(resume.dryRun).toBe(true);
    expect(resume.previewStep.status).toBe('would_run');
    expect(after.status).toBe(before.status);
    expect(after.updatedAt).toBe(before.updatedAt);
    expect(after.checkpoints).toEqual(before.checkpoints);
    expect(after.chunks).toEqual(before.chunks);
    expect(h.createCalls).toHaveLength(0);
    expect(h.writeCalls).toHaveLength(0);
  });

  test('dry-run job step previews chunks without mutating job state', async () => {
    const h = makeHarness();
    const { jobId } = await h.createJob('bulk-job:step-dry-run');
    const before = clone(text(await h.handlers.get_note_import_job_status({ jobId })).job);
    const run = text(await h.handlers.run_note_import_job_step({ jobId, maxChunks: 2, dryRun: true }));
    const after = clone(text(await h.handlers.get_note_import_job_status({ jobId })).job);

    expect(run.status).toBe('PASS');
    expect(run.dryRun).toBe(true);
    expect(run.steps.map((step: any) => step.status)).toEqual(['would_run', 'would_run']);
    expect(after.updatedAt).toBe(before.updatedAt);
    expect(after.checkpoints).toEqual(before.checkpoints);
    expect(after.chunks).toEqual(before.chunks);
    expect(h.createCalls).toHaveLength(0);
    expect(h.writeCalls).toHaveLength(0);
  });

  test('status exposes top-level memory-only durability warning', async () => {
    const h = makeHarness();
    const { jobId } = await h.createJob('bulk-job:durability-status');
    const status = text(await h.handlers.get_note_import_job_status({ jobId }));

    expect(status.status).toBe('PASS');
    expect(status.storageDurability).toBe('memory_only');
    expect(status.durabilityWarning).toContain('not durable across server restart');
    expect(status.job.storageDurability).toBe('memory_only');
    expect(JSON.stringify(status.job)).not.toMatch(/sourceText|expectedSourceText|ownerId|Alpha source text|Beta source text/);
  });

  test('binds plans and jobs to authenticated principal', async () => {
    const owner = makeHarness({
      principal: { ...principal('hosted_oauth'), subject: 'owner:a', userId: 'user:a' },
    });
    const other = makeHarness({
      principal: { ...principal('hosted_oauth'), subject: 'owner:b', userId: 'user:b' },
    });
    const { plan, jobId } = await owner.createJob('bulk-job:ownership-boundary');

    const foreignStatus = text(await other.handlers.get_note_import_job_status({ jobId }));
    const foreignStart = text(await other.handlers.start_note_import_job({
      planId: plan.planId,
      jobId: 'bulk-job:foreign-start',
    }));

    expect(foreignStatus.status).toBe('FAIL');
    expect(foreignStatus.errorMessage).toContain('Unknown import job');
    expect(foreignStart.status).toBe('FAIL');
    expect(foreignStart.errorMessage).toContain('Unknown import plan');
  });

  test('does not mark chunk verified when write lacks explicit verification', async () => {
    const h = makeHarness({
      readbackFails: true,
      writeResponses: [success('write', { createdRemIds: ['chunk-1'] })],
    });
    const { jobId } = await h.createJob('bulk-job:no-false-verified');
    const run = text(await h.handlers.run_note_import_job_step({ jobId, maxChunks: 1, dryRun: false }));

    expect(run.progress.chunksVerified).toBe(0);
    expect(run.jobStatus).toBe('partial');
    expect(run.lastStep.status).toBe('written_not_verified');

    const status = text(await h.handlers.get_note_import_job_status({ jobId }));
    expect(status.job.chunks[0].status).toBe('written_not_verified');
    expect(status.job.chunks[0].verificationStatus).toBe('written_not_verified');
  });

  test('does not mark chunk verified when readback passes but write omits explicit verification', async () => {
    const h = makeHarness({
      writeResponses: [success('write', { createdRemIds: ['chunk-1'] })],
    });
    const { jobId } = await h.createJob('bulk-job:readback-without-write-verification');
    const run = text(await h.handlers.run_note_import_job_step({ jobId, maxChunks: 1, dryRun: false }));

    expect(run.progress.chunksVerified).toBe(0);
    expect(run.jobStatus).toBe('partial');
    expect(run.lastStep.status).toBe('written_not_verified');

    const status = text(await h.handlers.get_note_import_job_status({ jobId }));
    expect(status.job.chunks[0].status).toBe('written_not_verified');
    expect(status.job.chunks[0].verificationStatus).toBe('written_not_verified');
  });

  test('marks chunk verified only when verification passed is true', async () => {
    const h = makeHarness({ writeResponses: [success('write', { createdRemIds: ['chunk-1'], verification: { passed: true } })] });
    const { jobId } = await h.createJob('bulk-job:verified-only');
    const run = text(await h.handlers.run_note_import_job_step({ jobId, maxChunks: 1, dryRun: false }));

    expect(run.lastStep.status).toBe('verified');
    expect(run.progress.chunksVerified).toBe(1);
    expect(run.createdRemIds).toEqual(run.progress.createdRemIds);
    expect(run.createdRemIds.length).toBeGreaterThan(0);
  });

  test('chunk step envelope exposes chunk verification and write evidence', async () => {
    const h = makeHarness({
      writeResponses: [success('write', { createdRemIds: ['chunk-1'], verification: { passed: true } })],
    });
    const { jobId } = await h.createJob('bulk-job:step-envelope');
    const run = text(await h.handlers.run_note_import_job_step({ jobId, maxChunks: 1, dryRun: false }));

    expect(run.verification).toMatchObject({
      attempted: true,
      passed: true,
      method: 'plugin_write_verification_and_chunk_readback',
    });
    expect(run.standard.verification.passed).toBe(true);
    expect(run.lastStep).toMatchObject({
      status: 'verified',
      verificationStatus: 'passed',
      chunkId: expect.any(String),
      idempotencyKey: expect.any(String),
    });
    expect(run.lastStep.createdRemIds.length).toBeGreaterThan(0);
    expect(run.lastStep.verification).toMatchObject({
      pluginPassed: true,
      readbackPassed: true,
      readbackStatus: 'passed',
    });
  });

  test('collapses matching import root and chapter titles during small bulk import', async () => {
    const h = makeHarness();
    const source = [
      '# Mini Bulk Import Test — Test 07',
      '',
      '## Section A — Nuclear Notation',
      '',
      'Formula: $A=Z+N$',
      '',
      '## Section B — Mass Spectrometer',
      '',
      'Formula: $qV=\\frac{1}{2}mv^2$',
      '',
      '## Section C — Verification Anchor',
      '',
      'TEST_07_BULK_IMPORT_VERIFICATION_ANCHOR',
    ].join('\n');
    const plan = text(await h.handlers.plan_note_import({
      sourceText: source,
      targetRootId: 'Plugin Test',
      rootTitle: 'Mini Bulk Import Test — Test 07',
      chapterTitle: 'Mini Bulk Import Test — Test 07',
      options: { maxCharsPerChunk: 500, maxRemsPerChunk: 30 },
    }));
    await h.handlers.start_note_import_job({ planId: plan.planId, jobId: 'bulk-job:collapse-matching-title' });
    await h.handlers.run_note_import_job_step({ jobId: 'bulk-job:collapse-matching-title', maxChunks: 3, dryRun: false });

    expect(h.createCalls.filter((call) => call.markdown === 'Mini Bulk Import Test — Test 07')).toHaveLength(1);
    expect(h.createCalls.map((call) => call.markdown)).toEqual(expect.arrayContaining([
      'Section A — Nuclear Notation',
      'Section B — Mass Spectrometer',
      'Section C — Verification Anchor',
    ]));
    expect(h.writeCalls.some((call) => call.markdownText.includes('# Mini Bulk Import Test — Test 07'))).toBe(false);
    expect(h.writeCalls.some((call) => call.markdownText.includes('## Section A — Nuclear Notation'))).toBe(false);
  });

  test('chunk step refuses verified status when live readback contains visible style pollution', async () => {
    const h = makeHarness({
      polluteWriteReadback: true,
      writeResponses: [success('write', { createdRemIds: ['chunk-1'], verification: { passed: true } })],
    });
    const { jobId } = await h.createJob('bulk-job:polluted-readback');
    const run = text(await h.handlers.run_note_import_job_step({ jobId, maxChunks: 1, dryRun: false }));

    expect(run.progress.chunksVerified).toBe(0);
    expect(run.lastStep.status).toBe('partial');
    const status = text(await h.handlers.get_note_import_job_status({ jobId }));
    expect(status.job.chunks[0].verificationStatus).toBe('source_fidelity_failed');
    expect(status.job.chunks[0].error).toContain('Formatting pollution');
  });

  test('resume retries unverified chunk with same idempotency key', async () => {
    const h = makeHarness({
      readbackFailures: 1,
      writeResponses: [
        success('write-1', { createdRemIds: ['chunk-1'] }),
        success('write-2', { createdRemIds: ['chunk-1'], verification: { passed: true } }),
      ],
    });
    const { jobId } = await h.createJob('bulk-job:resume-unverified');
    await h.handlers.run_note_import_job_step({ jobId, maxChunks: 1, dryRun: false });
    await h.handlers.resume_note_import_job({ jobId, dryRun: false });

    expect(h.writeCalls.length).toBe(2);
    expect(h.writeCalls[1].idempotencyKey).toBe(h.writeCalls[0].idempotencyKey);
    expect(h.createCalls.filter((call) => call.markdown === 'Chapter One')).toHaveLength(1);
    expect(h.createCalls.filter((call) => call.markdown === '1.1 Atomic nuclei')).toHaveLength(1);
  });

  test('timeout marks chunk partial and keeps it resumable', async () => {
    const h = makeHarness({ writeResponses: [failure('timeout', 'TIMEOUT', 'Timed out waiting for chunk.')] });
    const { jobId } = await h.createJob('bulk-job:timeout');
    const run = text(await h.handlers.run_note_import_job_step({ jobId, maxChunks: 1, dryRun: false }));

    expect(run.status).toBe('PARTIAL');
    expect(run.lastStep.status).toBe('partial');
    const status = text(await h.handlers.get_note_import_job_status({ jobId }));
    expect(status.job.chunks[0].error).toContain('TIMEOUT');
  });

  test('disconnect marks chunk failed without verified progress', async () => {
    const h = makeHarness({ writeResponses: [failure('disconnect', 'PLUGIN_NOT_CONNECTED', 'Plugin disconnected.')] });
    const { jobId } = await h.createJob('bulk-job:disconnect');
    const run = text(await h.handlers.run_note_import_job_step({ jobId, maxChunks: 1, dryRun: false }));

    expect(run.status).toBe('PARTIAL');
    expect(run.lastStep.status).toBe('failed');
    expect(run.progress.chunksVerified).toBe(0);
  });

  test('cancel blocks later run and resume without deleting written content', async () => {
    const h = makeHarness();
    const { jobId } = await h.createJob('bulk-job:cancel-blocks-future-work');
    const cancelled = text(await h.handlers.cancel_note_import_job({ jobId }));
    expect(cancelled.status).toBe('PASS');
    expect(cancelled.jobStatus).toBe('cancelled');
    expect(cancelled.deletionPerformed).toBe(false);

    const runAfterCancel = text(await h.handlers.run_note_import_job_step({ jobId, maxChunks: 1, dryRun: false }));
    expect(runAfterCancel.status).toBe('FAIL');
    expect(runAfterCancel.errorCode).toBe('JOB_CANCELLED');

    const resumeAfterCancel = text(await h.handlers.resume_note_import_job({ jobId, dryRun: false }));
    expect(resumeAfterCancel.status).toBe('FAIL');
    expect(resumeAfterCancel.errorCode).toBe('JOB_CANCELLED');
    expect(h.writeCalls).toHaveLength(0);
  });

  test('verify reports not_verifiable when live readback unavailable', async () => {
    const h = makeHarness({
      readbackFails: true,
      writeResponses: [success('write', { createdRemIds: ['chunk-1'] })],
    });
    const { jobId } = await h.createJob('bulk-job:no-readback');
    await h.handlers.run_note_import_job_step({ jobId, maxChunks: 1, dryRun: false });
    const verify = text(await h.handlers.verify_note_import_job({ jobId }));

    expect(verify.status).toBe('PARTIAL');
    expect(verify.verificationStatus).toBe('not_verifiable');
    expect(verify.verification).toMatchObject({
      attempted: true,
      status: 'not_verifiable',
      method: 'manifest_only',
    });
    expect(verify.limitation).toContain('Live/readback verification unavailable');
  });

  test('supplied readback verifies source fidelity and chunk order', async () => {
    const h = makeHarness({
      writeResponses: [success('write', { createdRemIds: ['chunk-1'] })],
    });
    const { jobId } = await h.createJob('bulk-job:readback');
    await h.handlers.run_note_import_job_step({ jobId, maxChunks: 1, dryRun: false });
    const status = text(await h.handlers.get_note_import_job_status({ jobId }));
    const chunk = status.job.chunks[0];
    const verify = text(await h.handlers.verify_note_import_job({
      jobId,
      actualTextByChunkId: { [chunk.chunkId]: 'Alpha source text.' },
    }));

    expect(verify.status).toBe('PARTIAL');
    expect(verify.reports[0].status).toBe('passed');
    expect(verify.verification).toMatchObject({
      attempted: true,
      status: 'not_verifiable',
      method: 'supplied_chunk_text',
    });
    const verified = text(await h.handlers.get_note_import_job_status({ jobId }));
    expect(verified.job.chunks[0].status).toBe('verified');
  });
});
