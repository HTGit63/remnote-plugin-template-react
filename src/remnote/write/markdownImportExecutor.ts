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
  BridgeErrorCode,
  ClearRemFormattingArgs,
  CreateDocumentArgs,
  CreateDocumentResult,
  CreateFlashcardArgs,
  CreateFlashcardResult,
  CreateFolderArgs,
  CreateFolderResult,
  CreateListAnswerCardArgs,
  CreateMultipleChoiceCardArgs,
  CreateOrReplaceNoteFromMarkdownArgs,
  CreateOrReplaceNoteFromMarkdownResult,
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
import { RemnoteWriteError, getPartialExecutionDetails, runSdkOperation } from './writeErrors';
import { MARKDOWN_IMPORT_RESULT_CACHE, getWriteIdempotencyKey } from './writeCaches';
import { STRUCTURED_BATCH_CACHE_LIMIT } from './writeTypes';
import { findRequiredRem, getRemPlainString } from './remnoteSdkHelpers';
import { applyStructuredNoteBatch, readCreatedRemIdsFromError } from './structuredBatch';
import { buildWriteOperationPlan } from '../write-engine/plan';
import { finalizeWriteOperationPlan, writeEngineExecutionFromPlan } from '../write-engine/execute';

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
): CreateOrReplaceNoteFromMarkdownResult['plan'] {
  return {
    previewOutline: plan.previewOutline,
    headingCount: plan.stats.headingCount,
    mathBlockCount: plan.stats.mathBlockCount,
    inlineMathCount: plan.stats.inlineMathCount,
    codeBlockCount: plan.stats.codeBlockCount,
    tableCount: plan.stats.tableCount,
    paragraphCount: plan.stats.paragraphCount,
    bulletCount: plan.stats.bulletCount,
  };
}

export async function createOrReplaceNoteFromMarkdown(
  plugin: RNPlugin,
  args: CreateOrReplaceNoteFromMarkdownArgs
): Promise<CreateOrReplaceNoteFromMarkdownResult> {
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
      limits: normalized.limits,
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
  };

  if (dryRun) {
    return {
      ...baseResult,
      status: 'dry_run',
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
        const result: CreateOrReplaceNoteFromMarkdownResult = {
          ...baseResult,
          rootRemId: duplicate._id,
          skippedRemIds: [duplicate._id],
          status: 'skipped',
          verification: normalized.safetyOptions.verifyAfterWrite
            ? verifyMarkdownSourceFidelity(
                plan.sourceSnippets,
                await getRemPlainString(plugin, duplicate),
                normalized.fidelityOptions,
                plan.stats
              )
            : undefined,
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
      batchResult = await applyStructuredNoteBatch(plugin, {
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
    const outputText = normalized.safetyOptions.verifyAfterWrite
      ? await collectPlainTextForRemIds(plugin, idsForVerification)
      : markdownImportOutputTextFromTree(plan.tree);
    const verification = normalized.safetyOptions.verifyAfterWrite
      ? verifyMarkdownSourceFidelity(
          normalized.mode === 'replace_target_children'
            ? plan.sourceSnippets.slice(1)
            : plan.sourceSnippets,
          outputText,
          normalized.fidelityOptions,
          plan.stats
        )
      : undefined;
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
      status,
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
