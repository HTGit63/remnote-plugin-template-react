import { RemType, SetRemType } from '@remnote/plugin-sdk';
import type {
  PluginRem as Rem,
  RichTextFormatName,
  RichTextInterface,
  RNPlugin,
} from '@remnote/plugin-sdk';
import type {
  ApplyRemnoteCommandArgs,
  ApplyRemnoteCommandResult,
  ApplyStylePlanArgs,
  ApplyStylePlanResult,
  ApplyStructuredNoteBatchArgs,
  ApplyStructuredNoteBatchResult,
  AppendToRemArgs,
  AppendToRemResult,
  AppendMarkdownAsRemTreeArgs,
  AppendMarkdownAsRemTreeResult,
  BridgeErrorCode,
  ClearRemFormattingArgs,
  CreateDocumentArgs,
  CreateDocumentResult,
  CreateFlashcardArgs,
  CreateFlashcardResult,
  CreateFolderArgs,
  CreateFolderResult,
  CreateListAnswerCardArgs,
  CreateNoteFromMarkdownTreeArgs,
  CreateNoteFromMarkdownTreeResult,
  CreateMultipleChoiceCardArgs,
  CreateOrReplaceNoteFromMarkdownArgs,
  CreateOrReplaceNoteFromMarkdownResult,
  PreviewMarkdownNoteTreeArgs,
  PreviewMarkdownNoteTreeResult,
  CreatePolishedNoteTreeArgs,
  CreatePolishedNoteTreeResult,
  CreateRemTreeArgs,
  CreateRemTreeNode,
  CreateRemTreeResult,
  CreateRemArgs,
  CreateRemResult,
  CreateClozeCardArgs,
  CreateStyledRemTreeArgs,
  CreateStyledRemTreeResult,
  DeletePreview,
  DeleteRemByIdArgs,
  DeleteRemByIdResult,
  DeleteRemByIdTarget,
  ExpectedStyleMapEntry,
  FormatRemResult,
  MoveRemArgs,
  MoveRemResult,
  PracticeDirection,
  ReplaceRemArgs,
  ReplaceRemResult,
  ReorderChildrenArgs,
  ReorderChildrenResult,
  RemColorName,
  RemnoteCommandName,
  RemHeadingLevel,
  RemStyleInput,
  RemTypeName,
  RichTextSpanInput,
  SetHideBulletArgs,
  SetRemHeadingLevelArgs,
  SetRemHighlightColorArgs,
  SetRemTextColorArgs,
  SetRemTypeArgs,
  SetTextSpanColorArgs,
  SetTextSpanHighlightArgs,
  StyledRemTreeNode,
  StyledRemTreeNodeType,
  UpdateRemArgs,
  UpdateRemRichArgs,
  UpdateRemResult,
  VerifyNoteDesignArgs,
  VerifyNoteDesignResult,
} from '../../../shared/bridge/protocol';
import {
  markdownImportOutputTextFromTree,
  normalizeMarkdownImportArgs,
  parseMarkdownImportPlan,
  verifyMarkdownSourceFidelity,
} from '../../../shared/bridge/markdown-importer';
import { buildWritePerformanceReport } from '../../../shared/bridge/performance';
import { RemnoteWriteError, getPartialExecutionDetails, runSdkOperation } from './writeErrors';
import { MARKDOWN_IMPORT_RESULT_CACHE, getWriteIdempotencyKey } from './writeCaches';
import { STRUCTURED_BATCH_CACHE_LIMIT } from './writeTypes';
import { findRequiredRem, getRemPlainString } from './remnoteSdkHelpers';
import { applyStructuredNoteBatch, readCreatedRemIdsFromError } from './structuredBatch';
import { buildWriteOperationPlan } from '../write-engine/plan';
import { finalizeWriteOperationPlan, writeEngineExecutionFromPlan } from '../write-engine/execute';

const MARKDOWN_SECTION_CHUNK_NODE_THRESHOLD = 120;
const MARKDOWN_SECTION_CHUNK_CHAR_THRESHOLD = 60000;
const MARKDOWN_SECTION_CHUNK_MAX_NODES = 80;
const MARKDOWN_SECTION_CHUNK_MAX_CHARS = 24000;

function countTreeNodes(node: StyledRemTreeNode): number {
  return 1 + (node.children ?? []).reduce((sum, child) => sum + countTreeNodes(child), 0);
}

function estimateTreeChars(node: StyledRemTreeNode): number {
  const own = [
    node.text,
    node.title,
    node.front,
    node.back,
    node.answer,
    node.latex,
    ...(node.items ?? []),
    ...(node.choices ?? []),
    ...(node.richText ?? []).map((span) => span.text ?? span.latex ?? ''),
  ]
    .filter((value): value is string => typeof value === 'string')
    .reduce((sum, value) => sum + value.length, 0);
  return own + (node.children ?? []).reduce((sum, child) => sum + estimateTreeChars(child), 0);
}

function chunkTopLevelChildren(children: readonly StyledRemTreeNode[]): StyledRemTreeNode[][] {
  const chunks: StyledRemTreeNode[][] = [];
  let current: StyledRemTreeNode[] = [];
  let currentNodes = 0;
  let currentChars = 0;

  for (const child of children) {
    const childNodes = countTreeNodes(child);
    const childChars = estimateTreeChars(child);
    const wouldExceed =
      current.length > 0 &&
      (currentNodes + childNodes > MARKDOWN_SECTION_CHUNK_MAX_NODES ||
        currentChars + childChars > MARKDOWN_SECTION_CHUNK_MAX_CHARS);
    if (wouldExceed) {
      chunks.push(current);
      current = [];
      currentNodes = 0;
      currentChars = 0;
    }
    current.push(child);
    currentNodes += childNodes;
    currentChars += childChars;
  }

  if (current.length) {
    chunks.push(current);
  }
  return chunks;
}

function markdownFallbackForPlan(
  plan: ReturnType<typeof parseMarkdownImportPlan>
): NonNullable<CreateOrReplaceNoteFromMarkdownResult['fallback']> {
  const needsFallback =
    plan.stats.nodeCount > MARKDOWN_SECTION_CHUNK_NODE_THRESHOLD ||
    estimateTreeChars(plan.tree) > MARKDOWN_SECTION_CHUNK_CHAR_THRESHOLD;
  if (!needsFallback) {
    return {
      used: false,
      strategy: 'one_shot',
    };
  }
  const chunks = chunkTopLevelChildren(plan.tree.children ?? []);
  return {
    used: true,
    reason: `payload exceeds one-shot budget (${plan.stats.nodeCount} nodes, ${estimateTreeChars(plan.tree)} chars)`,
    chunkCount: Math.max(1, chunks.length),
    strategy: 'section_chunks',
  };
}

export function rememberMarkdownImportResult(
  idempotencyKey: string,
  result: CreateOrReplaceNoteFromMarkdownResult
) {
  MARKDOWN_IMPORT_RESULT_CACHE.delete(idempotencyKey);
  MARKDOWN_IMPORT_RESULT_CACHE.set(idempotencyKey, result);

  while (MARKDOWN_IMPORT_RESULT_CACHE.size > STRUCTURED_BATCH_CACHE_LIMIT) {
    const oldestKey = MARKDOWN_IMPORT_RESULT_CACHE.keys().next().value;
    if (typeof oldestKey !== 'string') {
      return;
    }
    MARKDOWN_IMPORT_RESULT_CACHE.delete(oldestKey);
  }
}

export async function findDirectChildByPlainText(
  plugin: RNPlugin,
  parentId: string,
  plainText: string
): Promise<Rem | null> {
  const parent = await findRequiredRem(plugin, parentId, 'Parent', 'PARENT_NOT_FOUND');
  const children = await runSdkOperation('rem.getChildrenRem', () => parent.getChildrenRem());
  for (const child of children) {
    const childText = await getRemPlainString(plugin, child);
    if (childText.trim() === plainText.trim()) {
      return child;
    }
  }
  return null;
}

export async function collectPlainTextForRemIds(
  plugin: RNPlugin,
  remIds: readonly string[]
): Promise<string> {
  const parts: string[] = [];
  for (const remId of Array.from(new Set(remIds))) {
    const rem = await plugin.rem.findOne(remId);
    if (!rem) {
      continue;
    }
    parts.push(await getRemPlainString(plugin, rem));
  }
  return parts.join('\n');
}

export function markdownImportPlanSummary(
  plan: ReturnType<typeof parseMarkdownImportPlan>
): NonNullable<CreateOrReplaceNoteFromMarkdownResult['plan']> {
  return {
    previewOutline: plan.previewOutline,
    headingCount: plan.stats.headingCount,
    mathBlockCount: plan.stats.mathBlockCount,
    inlineMathCount: plan.stats.inlineMathCount,
    codeBlockCount: plan.stats.codeBlockCount,
    tableCount: plan.stats.tableCount,
    tableRowCount: plan.stats.tableRowCount,
    tableCellCount: plan.stats.tableCellCount,
    paragraphCount: plan.stats.paragraphCount,
    bulletCount: plan.stats.bulletCount,
    calloutCount: plan.stats.calloutCount,
    workedExampleCount: plan.stats.workedExampleCount,
    flashcardCount: plan.stats.flashcardCount,
    splitChunkCount: plan.stats.splitChunkCount,
  };
}

export function previewMarkdownNoteTree(
  args: PreviewMarkdownNoteTreeArgs
): PreviewMarkdownNoteTreeResult {
  const plan = parseMarkdownImportPlan(args.markdownText, {
    headingMapping: args.headingMapping,
    remnoteLayout: args.remnoteLayout,
    mathOptions: args.mathOptions,
    fidelityOptions: args.fidelityOptions,
    flashcardOptions: args.flashcardOptions,
    limits: args.limits,
    stylePreset: args.stylePreset,
    course: args.course,
    rootHeadingLevel: args.rootHeadingLevel,
    sectionHeadingLevel: args.sectionHeadingLevel,
    insertSiblingSpacers: args.insertSiblingSpacers,
    spacerText: args.spacerText,
    majorFormulaMode: args.majorFormulaMode,
    verifyAfterWrite: args.verifyAfterWrite,
  });
  const outputText = markdownImportOutputTextFromTree(plan.tree);
  return {
    ok: true,
    status: 'previewed',
    dryRun: true,
    tree: plan.tree,
    nodeCount: plan.stats.nodeCount,
    maxDepth: plan.stats.maxDepth,
    sourceHash: plan.sourceHash,
    outputHash: plan.outputHash,
    outputText,
    formulaValidation: plan.formulaValidation,
    flashcardOptions: plan.options.flashcardOptions,
    verification: verifyMarkdownSourceFidelity(
      plan.sourceSnippets,
      outputText,
      plan.options.fidelityOptions,
      plan.stats
    ),
    plan: markdownImportPlanSummary(plan),
  };
}

export async function createNoteFromMarkdownTree(
  plugin: RNPlugin,
  args: CreateNoteFromMarkdownTreeArgs
): Promise<CreateNoteFromMarkdownTreeResult> {
  return createOrReplaceNoteFromMarkdown(plugin, {
    ...args,
    parentRemId: args.parentRemId,
    mode: 'create_child',
    duplicatePolicy: args.duplicatePolicy ?? 'create_new',
    safetyOptions: {
      dryRun: args.safetyOptions?.dryRun ?? false,
      verifyAfterWrite: args.safetyOptions?.verifyAfterWrite ?? true,
      rollbackOnFailure: args.safetyOptions?.rollbackOnFailure ?? true,
      idempotencyKey: args.safetyOptions?.idempotencyKey,
    },
  });
}

export async function appendMarkdownAsRemTree(
  plugin: RNPlugin,
  args: AppendMarkdownAsRemTreeArgs
): Promise<AppendMarkdownAsRemTreeResult> {
  return createOrReplaceNoteFromMarkdown(plugin, {
    ...args,
    targetRemId: args.targetRemId,
    mode: 'append_to_target',
    duplicatePolicy: 'create_new',
    safetyOptions: {
      dryRun: args.safetyOptions?.dryRun ?? false,
      verifyAfterWrite: args.safetyOptions?.verifyAfterWrite ?? true,
      rollbackOnFailure: args.safetyOptions?.rollbackOnFailure ?? true,
      idempotencyKey: args.safetyOptions?.idempotencyKey,
    },
  });
}

export async function createOrReplaceNoteFromMarkdown(
  plugin: RNPlugin,
  args: CreateOrReplaceNoteFromMarkdownArgs
): Promise<CreateOrReplaceNoteFromMarkdownResult> {
  const startedAt = Date.now();
  const normalized = normalizeMarkdownImportArgs(args);
  const idempotencyKey = getWriteIdempotencyKey(
    normalized.safetyOptions.idempotencyKey,
    'markdown-import'
  );
  const dryRun = normalized.safetyOptions.dryRun;
  if (!dryRun) {
    const cached = MARKDOWN_IMPORT_RESULT_CACHE.get(idempotencyKey);
    if (cached) {
      const replayPlan = finalizeWriteOperationPlan(
        plugin,
        cached.operationPlan ??
          buildWriteOperationPlan({
            toolName: 'create_or_replace_note_from_markdown',
            operation: cached.mode,
            dryRun: false,
            idempotencyKey,
            target: {
              parentId: normalized.parentRemId,
              targetRemId: normalized.targetRemId,
              rootRemId: cached.rootRemId,
            },
            nodesToCreate: cached.createdRemIds.length,
            nodesToUpdate: cached.updatedRemIds.length,
          }),
        { idempotencyReplay: true }
      );
      return {
        ...cached,
        status: 'already_applied',
        operationPlan: replayPlan,
        writeEngine: writeEngineExecutionFromPlan(replayPlan, { idempotencyReplay: true }),
      };
    }
  }

  let plan: ReturnType<typeof parseMarkdownImportPlan>;
  try {
    plan = parseMarkdownImportPlan(normalized.markdownText, {
      headingMapping: normalized.headingMapping,
      remnoteLayout: normalized.remnoteLayout,
      mathOptions: normalized.mathOptions,
      fidelityOptions: normalized.fidelityOptions,
      flashcardOptions: normalized.flashcardOptions,
      limits: normalized.limits,
      stylePreset: normalized.stylePreset,
      course: normalized.course,
      rootHeadingLevel: normalized.rootHeadingLevel,
      sectionHeadingLevel: normalized.sectionHeadingLevel,
      insertSiblingSpacers: normalized.insertSiblingSpacers,
      spacerText: normalized.spacerText,
      majorFormulaMode: normalized.majorFormulaMode,
      verifyAfterWrite: normalized.verifyAfterWrite,
    });
  } catch (error: unknown) {
    throw new RemnoteWriteError(
      'INVALID_ARGS',
      error instanceof Error ? error.message : String(error)
    );
  }
  const replacementMode =
    normalized.mode === 'replace_target_children' ||
    normalized.mode === 'update_target_and_replace_children' ||
    (normalized.mode === 'create_child' && normalized.duplicatePolicy === 'replace');
  const operationPlan = finalizeWriteOperationPlan(
    plugin,
    buildWriteOperationPlan({
      toolName: 'create_or_replace_note_from_markdown',
      operation: normalized.mode,
      dryRun,
      idempotencyKey,
      target: { parentId: normalized.parentRemId, targetRemId: normalized.targetRemId },
      nodes: [plan.tree],
      nodesToUpdate: normalized.mode === 'update_target_and_replace_children' ? 1 : 0,
      verificationChecks: [
        'parse_markdown_import_plan',
        ...(normalized.safetyOptions.verifyAfterWrite ? ['verify_markdown_source_fidelity'] : []),
        ...(replacementMode ? ['staged_replacement_verified_before_delete'] : []),
      ],
      rollbackStrategy: replacementMode ? 'create_new_verify_swap' : 'sdk_transaction',
      replacement: {
        strategy: replacementMode
          ? 'create_new_verify_swap'
          : normalized.mode === 'append_to_target'
            ? 'direct_append'
            : 'create_child_tree',
        preservesExistingUntilVerified: replacementMode,
        oldChildrenSnapshotRequired: replacementMode,
      },
    })
  );
  const fallback = markdownFallbackForPlan(plan);
  const planningDurationMs = Date.now() - startedAt;

  const baseResult = {
    ok: true,
    createdRemIds: [] as string[],
    updatedRemIds: [] as string[],
    nodeCount: plan.stats.nodeCount,
    maxDepth: plan.stats.maxDepth,
    sourceHash: plan.sourceHash,
    outputHash: plan.outputHash,
    dryRun,
    idempotencyKey,
    mode: normalized.mode,
    duplicatePolicy: normalized.duplicatePolicy,
    operationPlan,
    writeEngine: writeEngineExecutionFromPlan(operationPlan),
    plan: markdownImportPlanSummary(plan),
    fallback,
  };

  if (dryRun) {
    const performance = buildWritePerformanceReport({
      phaseDurationsMs: {
        planning: planningDurationMs,
        singleWriteExecution: 0,
        verification: 0,
        total: Date.now() - startedAt,
      },
      primaryToolCallCount: 1,
      sdkOperationCount: 0,
      fallbackUsed: fallback.used,
      fallbackReason: fallback.reason,
    });
    return {
      ...baseResult,
      status: 'dry_run',
      performance,
      verification: verifyMarkdownSourceFidelity(
        plan.sourceSnippets,
        markdownImportOutputTextFromTree(plan.tree),
        normalized.fidelityOptions,
        plan.stats
      ),
    };
  }

  try {
    let batchResult: ApplyStructuredNoteBatchResult;
    let rootRemId: string | undefined;
    let skippedRemIds: string[] | undefined;
    let verificationDurationMs = 0;
    const writeStartedAt = Date.now();

    async function createRootThenAppendSectionChunks(parentId: string): Promise<ApplyStructuredNoteBatchResult> {
      const rootShell: StyledRemTreeNode = {
        ...plan.tree,
        children: [],
      };
      const rootBatch = await applyStructuredNoteBatch(plugin, {
        target: { mode: 'parent_child', parentId },
        operation: 'create_child_tree',
        parentId,
        position: 'end',
        root: rootShell,
        dryRun: false,
        idempotencyKey: `${idempotencyKey}:root`,
        rollbackOnFailure: normalized.safetyOptions.rollbackOnFailure,
        verifyAfterWrite: false,
        maxDepth: normalized.limits.maxDepth,
        maxNodeCount: normalized.limits.maxNodes,
      });
      const createdRemIds = [...rootBatch.createdRemIds];
      const updatedRemIds = [...(rootBatch.updatedRemIds ?? [])];
      const rootId = rootBatch.rootCreatedRemId;
      if (!rootId) {
        throw new RemnoteWriteError('PARTIAL_FAILURE', 'Markdown chunk fallback created no root Rem.', {
          partialExecution: {
            createdRemIds,
            failedStage: 'markdown_chunk_create_root',
            rollbackStatus: 'not_attempted',
          },
        });
      }

      const chunks = chunkTopLevelChildren(plan.tree.children ?? []);
      for (let index = 0; index < chunks.length; index += 1) {
        const chunk = chunks[index];
        if (!chunk.length) {
          continue;
        }
        const chunkResult = await applyStructuredNoteBatch(plugin, {
          target: { mode: 'rem_id', remId: rootId },
          operation: 'append_children',
          note: { children: chunk },
          dryRun: false,
          idempotencyKey: `${idempotencyKey}:chunk:${index + 1}`,
          rollbackOnFailure: normalized.safetyOptions.rollbackOnFailure,
          verifyAfterWrite: false,
          maxDepth: normalized.limits.maxDepth,
          maxNodeCount: normalized.limits.maxNodes,
        });
        createdRemIds.push(...chunkResult.createdRemIds);
        updatedRemIds.push(...(chunkResult.updatedRemIds ?? []));
      }

      return {
        ...rootBatch,
        createdRemIds,
        updatedRemIds,
        createdNodeCount: createdRemIds.length,
        verifyAfterWrite: normalized.safetyOptions.verifyAfterWrite,
      };
    }

    if (normalized.mode === 'create_child') {
      if (!normalized.parentRemId) {
        throw new RemnoteWriteError('INVALID_ARGS', 'create_child mode requires parentRemId.');
      }
      const duplicate =
        normalized.duplicatePolicy === 'create_new'
          ? null
          : await findDirectChildByPlainText(
              plugin,
              normalized.parentRemId,
              plan.tree.text ?? plan.tree.title ?? ''
            );
      if (duplicate && normalized.duplicatePolicy === 'skip') {
        const verificationStartedAt = Date.now();
        const verification = normalized.safetyOptions.verifyAfterWrite
          ? verifyMarkdownSourceFidelity(
              plan.sourceSnippets,
              await getRemPlainString(plugin, duplicate),
              normalized.fidelityOptions,
              plan.stats
            )
          : undefined;
        verificationDurationMs += Date.now() - verificationStartedAt;
        const performance = buildWritePerformanceReport({
          phaseDurationsMs: {
            planning: planningDurationMs,
            singleWriteExecution: Math.max(0, Date.now() - writeStartedAt - verificationDurationMs),
            verification: verificationDurationMs,
            total: Date.now() - startedAt,
          },
          primaryToolCallCount: 1,
          sdkOperationCount: 0,
          fallbackUsed: false,
        });
        const result: CreateOrReplaceNoteFromMarkdownResult = {
          ...baseResult,
          rootRemId: duplicate._id,
          skippedRemIds: [duplicate._id],
          status: 'skipped',
          verification,
          performance,
        };
        rememberMarkdownImportResult(idempotencyKey, result);
        return result;
      }
      if (duplicate && normalized.duplicatePolicy === 'replace') {
        batchResult = await applyStructuredNoteBatch(plugin, {
          target: { mode: 'rem_id', remId: duplicate._id },
          operation: 'update_root_and_replace_children',
          root: plan.tree,
          dryRun: false,
          idempotencyKey,
          rollbackOnFailure: normalized.safetyOptions.rollbackOnFailure,
          verifyAfterWrite: normalized.safetyOptions.verifyAfterWrite,
          maxDepth: normalized.limits.maxDepth,
          maxNodeCount: normalized.limits.maxNodes,
        });
        rootRemId = duplicate._id;
      } else if (fallback.used) {
        batchResult = await createRootThenAppendSectionChunks(normalized.parentRemId);
        rootRemId = batchResult.rootCreatedRemId;
      } else {
        batchResult = await applyStructuredNoteBatch(plugin, {
          target: { mode: 'parent_child', parentId: normalized.parentRemId },
          operation: 'create_child_tree',
          parentId: normalized.parentRemId,
          position: 'end',
          root: plan.tree,
          dryRun: false,
          idempotencyKey,
          rollbackOnFailure: normalized.safetyOptions.rollbackOnFailure,
          verifyAfterWrite: normalized.safetyOptions.verifyAfterWrite,
          maxDepth: normalized.limits.maxDepth,
          maxNodeCount: normalized.limits.maxNodes,
        });
        rootRemId = batchResult.rootCreatedRemId;
      }
    } else if (normalized.mode === 'append_to_target') {
      if (!normalized.targetRemId) {
        throw new RemnoteWriteError('INVALID_ARGS', 'append_to_target mode requires targetRemId.');
      }
      batchResult = fallback.used
        ? await createRootThenAppendSectionChunks(normalized.targetRemId)
        : await applyStructuredNoteBatch(plugin, {
            target: { mode: 'rem_id', remId: normalized.targetRemId },
            operation: 'append_children',
            note: { children: [plan.tree] },
            dryRun: false,
            idempotencyKey,
            rollbackOnFailure: normalized.safetyOptions.rollbackOnFailure,
            verifyAfterWrite: normalized.safetyOptions.verifyAfterWrite,
            maxDepth: normalized.limits.maxDepth,
            maxNodeCount: normalized.limits.maxNodes,
          });
      rootRemId = batchResult.rootCreatedRemId ?? normalized.targetRemId;
    } else if (normalized.mode === 'replace_target_children') {
      if (!normalized.targetRemId) {
        throw new RemnoteWriteError(
          'INVALID_ARGS',
          'replace_target_children mode requires targetRemId.'
        );
      }
      batchResult = await applyStructuredNoteBatch(plugin, {
        target: { mode: 'rem_id', remId: normalized.targetRemId },
        operation: 'replace_children',
        note: { children: plan.tree.children ?? [] },
        dryRun: false,
        idempotencyKey,
        rollbackOnFailure: normalized.safetyOptions.rollbackOnFailure,
        verifyAfterWrite: normalized.safetyOptions.verifyAfterWrite,
        maxDepth: normalized.limits.maxDepth,
        maxNodeCount: normalized.limits.maxNodes,
      });
      rootRemId = normalized.targetRemId;
    } else {
      if (!normalized.targetRemId) {
        throw new RemnoteWriteError(
          'INVALID_ARGS',
          'update_target_and_replace_children mode requires targetRemId.'
        );
      }
      batchResult = await applyStructuredNoteBatch(plugin, {
        target: { mode: 'rem_id', remId: normalized.targetRemId },
        operation: 'update_root_and_replace_children',
        root: plan.tree,
        dryRun: false,
        idempotencyKey,
        rollbackOnFailure: normalized.safetyOptions.rollbackOnFailure,
        verifyAfterWrite: normalized.safetyOptions.verifyAfterWrite,
        maxDepth: normalized.limits.maxDepth,
        maxNodeCount: normalized.limits.maxNodes,
      });
      rootRemId = normalized.targetRemId;
    }

    const idsForVerification = Array.from(
      new Set([
        ...(rootRemId ? [rootRemId] : []),
        ...batchResult.createdRemIds,
        ...(batchResult.updatedRemIds ?? []),
      ])
    );
    let outputText = markdownImportOutputTextFromTree(plan.tree);
    let verification: CreateOrReplaceNoteFromMarkdownResult['verification'];
    if (normalized.safetyOptions.verifyAfterWrite) {
      const verificationStartedAt = Date.now();
      outputText = await collectPlainTextForRemIds(plugin, idsForVerification);
      verification = verifyMarkdownSourceFidelity(
        normalized.mode === 'replace_target_children'
          ? plan.sourceSnippets.slice(1)
          : plan.sourceSnippets,
        outputText,
        normalized.fidelityOptions,
        plan.stats
      );
      verificationDurationMs += Date.now() - verificationStartedAt;
    }
    if (verification && !verification.passed && normalized.fidelityOptions.failOnContentLoss) {
      throw new RemnoteWriteError(
        'PARTIAL_FAILURE',
        'Markdown import verification detected source content loss.',
        {
          verification,
          createdRemIds: batchResult.createdRemIds,
          updatedRemIds: batchResult.updatedRemIds ?? [],
          partialExecution: {
            createdRemIds: batchResult.createdRemIds,
            failedStage: 'verify_markdown_source_fidelity',
            rollbackStatus: 'not_attempted',
          },
        }
      );
    }

    const status: CreateOrReplaceNoteFromMarkdownResult['status'] =
      normalized.mode === 'append_to_target'
        ? 'appended'
        : normalized.mode === 'create_child'
          ? 'created'
          : normalized.mode === 'replace_target_children'
            ? 'replaced'
            : 'updated';
    const writeDurationMs = Date.now() - writeStartedAt;
    const performance = buildWritePerformanceReport({
      phaseDurationsMs: {
        planning: planningDurationMs,
        singleWriteExecution: Math.max(0, writeDurationMs - verificationDurationMs),
        verification: verificationDurationMs,
        total: Date.now() - startedAt,
      },
      primaryToolCallCount: 1,
      sdkOperationCount: operationPlan.estimatedOperationCount,
      fallbackUsed: fallback.used,
      fallbackReason: fallback.reason,
    });
    const result: CreateOrReplaceNoteFromMarkdownResult = {
      ...baseResult,
      rootRemId,
      createdRemIds: batchResult.createdRemIds,
      updatedRemIds: batchResult.updatedRemIds ?? [],
      ...(skippedRemIds ? { skippedRemIds } : {}),
      outputHash:
        batchResult.createdRemIds.length || batchResult.updatedRemIds?.length
          ? markdownImportOutputTextFromTree(plan.tree)
            ? plan.outputHash
            : undefined
          : plan.outputHash,
      verification,
      operationPlan: batchResult.operationPlan
        ? {
            ...operationPlan,
            transaction: batchResult.operationPlan.transaction,
          }
        : operationPlan,
      writeEngine: batchResult.writeEngine ?? writeEngineExecutionFromPlan(operationPlan),
      status: performance.status === 'success_with_performance_warning'
        ? 'success_with_performance_warning'
        : status,
      performance,
    };
    rememberMarkdownImportResult(idempotencyKey, result);
    return result;
  } catch (error: unknown) {
    if (error instanceof RemnoteWriteError) {
      const partial = getPartialExecutionDetails(error.details);
      throw new RemnoteWriteError(error.code, error.message, {
        originalDetails: error.details,
        operationPlan,
        partialExecution: {
          createdRemIds: readCreatedRemIdsFromError(error),
          failedAtPath:
            typeof partial.failedStage === 'string'
              ? partial.failedStage
              : 'create_or_replace_note_from_markdown',
          failedReason: error.message,
          rollbackStatus:
            typeof partial.rollbackStatus === 'string' ? partial.rollbackStatus : 'not_attempted',
        },
      });
    }
    throw error;
  }
}
