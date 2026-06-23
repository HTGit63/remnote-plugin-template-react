import { describe, expect, test } from 'vitest';
import { registerBulkImportTools } from '../server/src/tools/register-bulk-import-tools';
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

function success(id: string, result: Record<string, unknown>): BridgeResponse {
  return { id, ok: true, result };
}

function failure(id: string, code: 'TIMEOUT' | 'PLUGIN_NOT_CONNECTED', message = code): BridgeResponse {
  return { id, ok: false, error: { code, message } };
}

function text(result: McpToolResult): Record<string, any> {
  return result.structuredContent as Record<string, any>;
}

function makeHarness(options: {
  writeResponses?: BridgeResponse[];
  readbackFails?: boolean;
} = {}) {
  const handlers: Record<string, Handler> = {};
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
      return queued ?? success('write', {
        createdRemIds: [createdRemId],
        updatedRemIds: [],
        verification: { passed: true },
      });
    }
    if (tool === 'get_rem_tree') {
      if (options.readbackFails) {
        return failure('readback', 'PLUGIN_NOT_CONNECTED', 'No fake readback.');
      }
      return success('tree', nodeById((args as any).remId));
    }
    return failure('unknown', 'PLUGIN_NOT_CONNECTED', `Unhandled fake tool ${tool}`);
  };

  registerBulkImportTools({
    registerTool: ((name: string, _config: unknown, handler: Handler) => {
      handlers[name] = handler;
      return undefined;
    }) as ToolRegistrationContext['registerTool'],
    callPlugin: callPlugin as ToolRegistrationContext['callPlugin'],
    currentRegistry: (() => ({})) as ToolRegistrationContext['currentRegistry'],
    exposeDeleteTool: false,
    hub: {} as ToolRegistrationContext['hub'],
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

  return { handlers, createJob, createCalls, writeCalls, childMap };
}

describe('bulk import MCP tools', () => {
  test('does not mark chunk verified when write lacks explicit verification', async () => {
    const h = makeHarness({ writeResponses: [success('write', { createdRemIds: ['chunk-1'] })] });
    const { jobId } = await h.createJob('bulk-job:no-false-verified');
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
  });

  test('resume retries unverified chunk with same idempotency key', async () => {
    const h = makeHarness({
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
      actualTextByChunkId: { [chunk.chunkId]: chunk.sourceText },
    }));

    expect(verify.status).toBe('PARTIAL');
    expect(verify.reports[0].status).toBe('passed');
    const verified = text(await h.handlers.get_note_import_job_status({ jobId }));
    expect(verified.job.chunks[0].status).toBe('verified');
  });
});
