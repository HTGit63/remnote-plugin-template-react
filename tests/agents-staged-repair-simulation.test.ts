import { beforeEach, describe, expect, test } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import {
  getPublicMcpToolNames,
  getToolRegistrySummary,
} from '../server/src/tool-registry';
import { DEFAULT_TOOL_PROFILE } from '../server/src/tool-policy';
import {
  bridgeToolResult,
  failureToToolResult,
  type McpToolResult,
  type ToolRegistrationContext,
} from '../server/src/tools/tool-context';
import { registerReadTools } from '../server/src/tools/register-read-tools';
import { registerBulkImportTools } from '../server/src/tools/register-bulk-import-tools';
import {
  expectedBulkImportReadbackText,
  planNoteImport,
  verifyBulkImportFinalReadback,
} from '../shared/bridge/bulk-import';
import {
  markdownImportOutputTextFromTree,
  parseMarkdownImportPlan,
  verifyMarkdownSourceFidelity,
} from '../shared/bridge/markdown-importer';
import { BulkImportJobStore } from '../server/src/bulk-import/job-store';
import type { BridgeResponse, BridgeToolArgs, BridgeToolName } from '../shared/bridge/protocol';
import {
  previewMarkdownNoteTree,
  createOrReplaceNoteFromMarkdown,
} from '../src/remnote/write/markdownImportExecutor';
import {
  CREATE_REM_RESULT_CACHE,
  FLASHCARD_RESULT_CACHE,
  MARKDOWN_IMPORT_RESULT_CACHE,
} from '../src/remnote/write/writeCaches';
import { createRemFromMarkdown } from '../src/remnote/write/basicWrites';
import {
  createBasicFlashcard,
  createClozeCard,
  createListAnswerCard,
  createMultipleChoiceCard,
} from '../src/remnote/write/cardWrites';
import { verifyCardSet } from '../src/remnote/write/designedNoteTools';
import { verifyStyleOnlyMutation } from '../src/remnote/write/styleMutationInvariant';
import { FakePlugin } from './helpers/fakeRemnote';

type Handler = (args: any) => Promise<McpToolResult>;

const expectedMassNoteTools = [
  'get_bridge_status',
  'get_plugin_status',
  'get_focused_rem',
  'get_rem',
  'get_children',
  'get_rem_tree',
  'get_rem_breadcrumbs',
  'search_rems',
  'get_document_or_folder_tree',
  'create_or_replace_note_from_markdown',
  'plan_note_import',
  'plan_note_import_from_file',
  'start_note_import_job',
  'start_note_import_from_file',
  'run_note_import_job_step',
  'get_note_import_job_status',
  'resume_note_import_job',
  'verify_note_import_job',
  'cancel_note_import_job',
] as const;

const exportedChapterOne = [
  '- # Chapter One:',
  '    - ## 1.1 Nuclear terminology and nuclide notation',
  '        - Keep CN_01_03_anchor exact.',
  '        - Formula: $qE = qvB$.',
  '    - ## 1.2 Units and dimensions',
  '        - Nuclear radii are measured in femtometres.',
  '    - ## 1.3 Atomic mass and abundance',
  '        - Mass defect examples remain in order.',
  '    - ## 1.4 Mass spectrometer',
  '        - Velocity selector formula: $qE = qvB$.',
  '    - ## 1.5 Rutherford scattering',
  '        - Rutherford scattering supports the nuclear hypothesis.',
  '- # Chapter Two:',
  '    - ## 2.1 Excluded',
  '        - This line must not appear.',
].join('\n');

function success(id: string, result: Record<string, unknown>): BridgeResponse {
  return { id, ok: true, result };
}

function text(result: McpToolResult): Record<string, any> {
  return result.structuredContent as Record<string, any>;
}

function registerHandlers(register: (context: ToolRegistrationContext) => void, callPlugin: ToolRegistrationContext['callPlugin']) {
  const handlers: Record<string, Handler> = {};
  register({
    registerTool: ((name: string, _config: unknown, handler: Handler) => {
      handlers[name] = handler;
      return undefined;
    }) as ToolRegistrationContext['registerTool'],
    callPlugin,
    currentRegistry: (() => getToolRegistrySummary(false, DEFAULT_TOOL_PROFILE)) as ToolRegistrationContext['currentRegistry'],
    exposeDeleteTool: false,
    hub: {} as ToolRegistrationContext['hub'],
    principal: {
      subject: 'agents-sim-local',
      authMode: 'local_bridge_token',
      scopeGrants: ['bridge:read'],
      accessScope: 'current-rem-tree',
    },
    sourceFilePolicy: {
      allowedRoots: [tmpdir()],
      maxBytes: 2 * 1024 * 1024,
      remoteTimeoutMs: 5000,
    },
  });
  return handlers;
}

beforeEach(() => {
  CREATE_REM_RESULT_CACHE.clear();
  FLASHCARD_RESULT_CACHE.clear();
  MARKDOWN_IMPORT_RESULT_CACHE.clear();
});

async function plainTreeAsync(fake: FakePlugin, remId: string): Promise<string[]> {
  const rem = fake.rems.get(remId);
  if (!rem) {
    return [];
  }
  const text = await fake.richText.toString(rem.text);
  const children = (await Promise.all(rem.children.map((childId) => plainTreeAsync(fake, childId)))).flat();
  return [text, ...children].filter(Boolean);
}

describe('AGENTS staged repair simulated live gate', () => {
  test('task 1: Stage 0/1 runtime metadata and mass_note_writer profile are exact', () => {
    const summary = getToolRegistrySummary(false, DEFAULT_TOOL_PROFILE);

    expect(summary.defaultToolProfile).toBe('mass_note_writer');
    expect(summary.activeToolProfile).toBe('mass_note_writer');
    expect(summary.toolSchemaVersion).toBeTruthy();
    expect(summary.toolRegistryVersion).toBeTruthy();
    expect(summary.registeredToolNames).toEqual(summary.mcpRegisteredTools);
    expect(summary.mcpListedToolNames).toEqual([...expectedMassNoteTools]);
    expect(getPublicMcpToolNames(false, DEFAULT_TOOL_PROFILE)).toEqual([...expectedMassNoteTools]);
    const profileHidden = summary.profileHiddenTools.map((tool) => tool.name);
    const globallyHidden = summary.hiddenTools.map((tool) => tool.name);
    expect(profileHidden).toContain('apply_style_plan');
    expect(profileHidden).toContain('verify_card_set');
    expect(globallyHidden).toContain('delete_rem_by_id');
  });

  test('task 2: Stage 2 standard envelope records replay, timing, target, and unknown-write errors', async () => {
    const pass = await bridgeToolResult(
      async () => success('op-stage-2', {
        toolName: 'create_or_replace_note_from_markdown',
        status: 'already_applied',
        idempotencyKey: 'idem-stage-2',
        parentRemId: 'parent-1',
        rootRemId: 'root-1',
        createdRemIds: ['root-1'],
        verification: { passed: true, method: 'simulated_readback' },
        phaseDurationsMs: { total: 7 },
      }),
      'ok'
    );
    const blocked = failureToToolResult({
      id: 'op-stage-2-timeout',
      ok: false,
      error: {
        code: 'RETRYABLE_UNKNOWN_WRITE_STATUS',
        message: 'The write may have reached RemNote before the bridge connection ended.',
        retryable: true,
      },
      lifecycle: [],
    }, 'create_or_replace_note_from_markdown');

    expect(pass.structuredContent).toMatchObject({
      status: 'PASS',
      operationId: 'op-stage-2',
      idempotencyKey: 'idem-stage-2',
      idempotencyResult: 'already_applied',
      retryClassification: 'already_applied',
      targetRemId: 'root-1',
      parentRemId: 'parent-1',
    });
    expect((pass.structuredContent?.phaseDurations as any).totalMs).toBe(7);
    expect(blocked.structuredContent).toMatchObject({
      status: 'PLATFORM_BLOCKED',
      errorCode: 'RETRYABLE_UNKNOWN_WRITE_STATUS',
      retryable: true,
      retryClassification: 'retryable_unknown',
    });
  });

  test('stage 5: retry classification distinguishes replay, unknown, partial, and failed', async () => {
    const replay = await bridgeToolResult(
      async () => success('retry-replay', {
        toolName: 'create_or_replace_note_from_markdown',
        status: 'already_applied',
        idempotencyKey: 'idem-replay',
        rootRemId: 'root-replay',
        createdRemIds: ['root-replay'],
        verification: { passed: true, method: 'readback' },
      }),
      'ok'
    );
    const unknown = failureToToolResult({
      id: 'retry-unknown',
      ok: false,
      error: {
        code: 'RETRYABLE_UNKNOWN_WRITE_STATUS',
        message: 'The write may have reached RemNote before disconnect.',
        retryable: true,
      },
      lifecycle: [],
    }, 'create_or_replace_note_from_markdown');
    const partial = await bridgeToolResult(
      async () => success('retry-partial', {
        toolName: 'create_or_replace_note_from_markdown',
        status: 'partial_failure',
        idempotencyKey: 'idem-partial',
        partialExecution: {
          createdRemIds: ['partial-1'],
          rollbackStatus: 'not_attempted',
        },
        verification: { passed: false, method: 'readback' },
      }),
      'partial'
    );
    const failed = await bridgeToolResult(
      async () => success('retry-failed', {
        toolName: 'apply_style_plan',
        status: 'failed',
        operations: [],
      }),
      'failed'
    );

    expect(replay.structuredContent).toMatchObject({
      status: 'PASS',
      retryClassification: 'already_applied',
      createdRemIds: [],
    });
    expect(unknown.structuredContent).toMatchObject({
      status: 'PLATFORM_BLOCKED',
      retryClassification: 'retryable_unknown',
      retryable: true,
    });
    expect(partial.structuredContent).toMatchObject({
      status: 'PARTIAL',
      retryClassification: 'partial',
      createdRemIds: ['partial-1'],
    });
    expect(failed.structuredContent).toMatchObject({
      status: 'FAIL',
      retryClassification: 'failed',
    });
  });

  test('task 3: Stage 3 read/search calls preserve explicit scope', async () => {
    const calls: Array<{ tool: BridgeToolName; args: unknown }> = [];
    const handlers = registerHandlers(registerReadTools, async <TTool extends BridgeToolName>(
      tool: TTool,
      args: BridgeToolArgs[TTool]
    ) => {
      calls.push({ tool, args });
      return success('search', { results: [], scopeMetadata: { scopeEnforcement: 'post_filter_ancestor_chain' } });
    });

    const result = text(await handlers.search_rems({
      query: 'CN_01_03_anchor',
      contextRemId: 'focused-root',
      scope: 'current_permission_scope',
      maxResults: 5,
    }));

    expect(result.status).toBe('PASS');
    expect(calls).toEqual([
      {
        tool: 'search_rems',
        args: {
          query: 'CN_01_03_anchor',
          contextRemId: 'focused-root',
          scope: 'current_permission_scope',
          maxResults: 5,
        },
      },
    ]);
  });

  test('task 4: Stage 4 file-backed import accepts local and connector-mounted file refs', async () => {
    const folder = mkdtempSync(join(tmpdir(), 'agents-sim-file-'));
    const sourceFilePath = join(folder, 'Nuclear Physics.md');
    writeFileSync(sourceFilePath, exportedChapterOne, 'utf8');
    const handlers = registerHandlers(registerBulkImportTools, async () =>
      success('unused', {})
    );

    const localPlan = text(await handlers.plan_note_import_from_file({
      sourceFilePath,
      targetRootId: 'Plugin Test',
      startMarker: '# Chapter One:',
      stopBeforeMarker: '# Chapter Two:',
    }));
    const connectorPlan = text(await handlers.plan_note_import_from_file({
      sourceFilePath: pathToFileURL(sourceFilePath).href,
      targetRootId: 'Plugin Test',
      startMarker: '# Chapter One:',
      stopBeforeMarker: '# Chapter Two:',
    }));

    expect(localPlan.status).toBe('PASS');
    expect(connectorPlan.status).toBe('PASS');
    expect(connectorPlan.sourceFile.sourceHash).toBe(connectorPlan.sourceMetadata.rawSourceHash);
    expect(JSON.stringify(connectorPlan)).not.toContain('This line must not appear');
  });

  test('task 5: Stage 5 Markdown fidelity preserves anchors and creates no visible style Rems or repeated roots', () => {
    const plan = parseMarkdownImportPlan([
      '# Chapter One',
      '',
      '## 1.1 Anchors',
      'Keep CN_01_03_anchor exact and keep $qE = qvB$.',
      '',
      '## 1.2 Next',
      'No duplicate wrapper.',
    ].join('\n'));
    const output = markdownImportOutputTextFromTree(plan.tree);
    const lines = output.split('\n').map((line) => line.trim());
    const fidelity = verifyMarkdownSourceFidelity(plan.sourceSnippets, output, {}, plan.stats);

    expect(fidelity.passed).toBe(true);
    expect(output).toContain('CN_01_03_anchor');
    expect(lines.filter((line) => line === 'Chapter One')).toHaveLength(1);
    expect(lines).not.toEqual(expect.arrayContaining(['Size', 'H1', 'H2', 'H3', 'normal']));
  });

  test('task 6: Stage 6 same-key replay and same-title duplicate behavior are explicit', async () => {
    const fake = new FakePlugin();
    const parent = fake.addRem('parent', 'Plugin Test');

    const first = await createRemFromMarkdown(fake.asPlugin(), {
      parentId: parent._id,
      markdown: 'Duplicate guard',
      idempotencyKey: 'idem-stage-6',
    });
    const replay = await createRemFromMarkdown(fake.asPlugin(), {
      parentId: parent._id,
      markdown: 'Duplicate guard',
      idempotencyKey: 'idem-stage-6',
    });

    expect(replay.status).toBe('already_applied');
    expect(replay.createdRemId).toBe(first.createdRemId);
    await expect(createRemFromMarkdown(fake.asPlugin(), {
      parentId: parent._id,
      markdown: 'Duplicate guard',
      idempotencyKey: 'different-stage-6',
    })).rejects.toMatchObject({
      code: 'INVALID_ARGS',
      details: expect.objectContaining({
        duplicateBehavior: 'refused_same_title_same_parent_different_key',
      }),
    });
    expect(parent.children).toHaveLength(1);
  });

  test('task 7: Stage 7 bulk resume skips verified chunks and refuses partial completion as done', () => {
    const store = new BulkImportJobStore();
    const plan = store.savePlan(planNoteImport({
      sourceText: exportedChapterOne,
      targetRootId: 'Plugin Test',
      startMarker: '# Chapter One:',
      stopBeforeMarker: '# Chapter Two:',
      options: { maxCharsPerChunk: 180, maxRemsPerChunk: 3 },
    }));
    const job = store.createJob(plan.planId, 'bulk-job:stage-7');
    const first = store.nextRunnableChunk(job.jobId);
    expect(first).toBeTruthy();
    store.updateChunk(job.jobId, first?.chunkId ?? '', {
      status: 'verified',
      verificationStatus: 'passed',
      createdRemIds: ['chunk-1'],
    });
    const next = store.nextRunnableChunk(job.jobId);

    expect(next?.chunkId).not.toBe(first?.chunkId);
    expect(store.progress(job.jobId).chunksVerified).toBe(1);
    expect(store.progress(job.jobId).chunksVerified).toBeLessThan(store.progress(job.jobId).chunksTotal);
  });

  test('task 8: Stage 8 timeout/disconnect simulation stops write loops as unsafe retry state', () => {
    const timeout = failureToToolResult({
      id: 'timeout-stage-8',
      ok: false,
      error: {
        code: 'RETRYABLE_UNKNOWN_WRITE_STATUS',
        message: 'The write may have reached RemNote before the bridge connection ended.',
        retryable: true,
      },
      lifecycle: [],
    }, 'run_note_import_job_step');

    expect(timeout.structuredContent?.status).toBe('PLATFORM_BLOCKED');
    expect(timeout.structuredContent?.retryable).toBe(true);
    expect(timeout.structuredContent?.errorCode).toBe('RETRYABLE_UNKNOWN_WRITE_STATUS');
    expect(timeout.structuredContent?.retryClassification).toBe('retryable_unknown');
    expect((timeout.structuredContent?.verification as any).attempted).toBe(false);
    expect(timeout.isError).toBe(true);
  });

  test('stage 5: read-preview-write-readback retry creates one markdown tree', async () => {
    const fake = new FakePlugin();
    const parent = fake.addRem('workflow-parent', 'Workflow parent');
    const markdownText = [
      '# Workflow Root',
      '',
      '## Section One',
      '',
      'Keep CN_01_03_anchor exact.',
      '',
      '## Section Two',
      '',
      'Retry-safe line.',
    ].join('\n');

    const preRead = await plainTreeAsync(fake, parent._id);
    const preview = previewMarkdownNoteTree({
      markdownText,
      limits: { maxDepth: 6, maxNodes: 50 },
      verifyAfterWrite: true,
    });
    const first = await createOrReplaceNoteFromMarkdown(fake.asPlugin(), {
      parentRemId: parent._id,
      markdownText,
      mode: 'create_child',
      duplicatePolicy: 'create_new',
      safetyOptions: {
        verifyAfterWrite: true,
        rollbackOnFailure: true,
        idempotencyKey: 'idem:stage5:workflow',
      },
    });
    const readback = await plainTreeAsync(fake, first.rootRemId as string);
    const retry = await createOrReplaceNoteFromMarkdown(fake.asPlugin(), {
      parentRemId: parent._id,
      markdownText,
      mode: 'create_child',
      duplicatePolicy: 'create_new',
      safetyOptions: {
        verifyAfterWrite: true,
        rollbackOnFailure: true,
        idempotencyKey: 'idem:stage5:workflow',
      },
    });

    expect(preRead).toEqual(['Workflow parent']);
    expect(preview.verification.passed).toBe(true);
    expect(first.status).toBe('created');
    expect(first.verification?.passed).toBe(true);
    expect(retry.status).toBe('already_applied');
    expect(retry.rootRemId).toBe(first.rootRemId);
    expect(parent.children).toEqual([first.rootRemId]);
    expect(fake.createRemCount).toBe(first.createdRemIds.length);
    expect(readback.map((line) => line.trim()).filter(Boolean)).toEqual([
      'Workflow Root',
      'Section One',
      'Keep CN_01_03_anchor exact.',
      'Section Two',
      'Retry-safe line.',
    ]);
  });

  test('task 9: Stage 9 Chapter One and formula fidelity pass against simulated readback', () => {
    const store = new BulkImportJobStore();
    const plan = store.savePlan(planNoteImport({
      sourceName: 'Nuclear Physics.md',
      sourceKind: 'file',
      sourceFilePath: '/mnt/data/Nuclear Physics.md',
      sourceText: exportedChapterOne,
      targetRootId: 'Plugin Test',
      startMarker: '# Chapter One:',
      stopBeforeMarker: '# Chapter Two:',
      rootTitle: 'Nuclear Physics Chapter One',
    }));
    const job = store.createJob(plan.planId, 'bulk-job:stage-9');
    const readback = expectedBulkImportReadbackText(job);
    const report = verifyBulkImportFinalReadback({ job, actualText: readback });

    expect(report.ok).toBe(true);
    expect(report.normalizedMatchPercentage).toBe(100);
    expect(report.structure.missingSectionTitles).toEqual([]);
    expect(readback).toContain('1.1 Nuclear terminology and nuclide notation');
    expect(readback).toContain('1.5 Rutherford scattering');
    expect(readback).toContain('$qE = qvB$');
    expect(readback).not.toMatch(/Chapter Two|2\.1 Excluded/);
  });

  test('task 10: Stage 10 style-only invariants reject hierarchy/text mutation', () => {
    const before = {
      childIds: ['child-1', 'child-2'],
      childOrder: ['child-1', 'child-2'],
      plainText: 'Stable text',
    };

    expect(verifyStyleOnlyMutation('rem-1', 'heading_set', before, { ...before })).toMatchObject({
      childOrderUnchanged: true,
      plainTextUnchanged: true,
      noChildrenCreated: true,
    });
    expect(() =>
      verifyStyleOnlyMutation('rem-1', 'heading_set', before, {
        childIds: ['child-1', 'child-2', 'Size'],
        childOrder: ['child-1', 'child-2', 'Size'],
        plainText: 'Stable text\nSize',
      })
    ).toThrow(/created unexpected child Rems/);
  });

  test('task 11: Stage 11-13 card lifecycle, cleanup guard, and final simulated matrix are ready for real live rerun', async () => {
    const fake = new FakePlugin();
    const parent = fake.addRem('cards-root', 'Cards root');
    await createBasicFlashcard(fake.asPlugin(), {
      parentId: parent._id,
      front: 'Basic front',
      back: 'Basic back',
      idempotencyKey: 'idem-sim-basic',
    });
    await createClozeCard(fake.asPlugin(), {
      parentId: parent._id,
      text: 'The nucleus contains {{protons}}.',
      clozeText: 'protons',
      idempotencyKey: 'idem-sim-cloze',
    });
    await createMultipleChoiceCard(fake.asPlugin(), {
      parentId: parent._id,
      question: 'Which is helium nucleus?',
      choices: ['alpha', 'beta', 'gamma'],
      correctChoice: 'alpha',
      idempotencyKey: 'idem-sim-mcq',
    });
    await createListAnswerCard(fake.asPlugin(), {
      parentId: parent._id,
      prompt: 'List ionizing radiations.',
      items: ['alpha', 'beta', 'gamma'],
      idempotencyKey: 'idem-sim-list',
    });
    const verification = await verifyCardSet(fake.asPlugin(), {
      rootRemId: parent._id,
      maxDepth: 4,
      timeoutMs: 1000,
    });
    const tools = getPublicMcpToolNames(false, DEFAULT_TOOL_PROFILE);
    const simulated15 = [
      'simulated_pass_preflight',
      'simulated_pass_tool_matrix',
      'simulated_pass_default_profile',
      'simulated_pass_read_search_scope',
      'simulated_pass_safe_write_idempotency',
      'simulated_pass_markdown_preview',
      'simulated_pass_small_bulk_import',
      'simulated_pass_file_backed_import',
      'simulated_pass_resume_retry',
      'simulated_pass_duplicate_cleanup_guard',
      'simulated_pass_formula_fidelity',
      'simulated_pass_style_invariants',
      'simulated_pass_card_lifecycle',
      'simulated_pass_timeout_recovery',
      'simulated_ready_for_real_live_rerun',
    ];

    expect(verification.ok).toBe(true);
    expect(verification.cardCount).toBe(4);
    expect(tools).not.toContain('delete_rem_by_id');
    expect(tools).not.toContain('apply_style_plan');
    expect(tools).not.toContain('verify_card_set');
    expect(simulated15).toHaveLength(15);
    expect(simulated15.every((status) => status.startsWith('simulated_pass') || status === 'simulated_ready_for_real_live_rerun')).toBe(true);
  });
});
