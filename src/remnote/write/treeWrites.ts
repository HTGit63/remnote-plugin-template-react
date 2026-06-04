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
import { applyStylePresetToTree } from '../../../shared/bridge/style-presets';
import { RemnoteWriteError, getPartialExecutionDetails, getSdkErrorMessage } from './writeErrors';
import {
  CREATE_TREE_RESULT_CACHE,
  POLISHED_TREE_RESULT_CACHE,
  getWriteIdempotencyKey,
  rememberCachedResult,
} from './writeCaches';
import { STRUCTURED_BATCH_CACHE_LIMIT, type TreeValidationState } from './writeTypes';
import { assertTreeLimits, simpleTreeToStyledNode, validateTreeNode } from './writeValidation';
import {
  createStyledRemTree,
  readCreatedRemIdsFromError,
  rollbackCreatedRems,
  verifyCreatedRems,
} from './structuredBatch';
import { applyStylePlan } from './formattingWrites';
import { buildWritePerformanceReport } from '../../../shared/bridge/performance';
import {
  collectCreatedTreeRemIds,
  createRemTreeWithMarkdownApi,
  findRequiredRem,
  getRemSiblingIndex,
  hasRemSdkApi,
} from './remnoteSdkHelpers';
import { buildWriteOperationPlan } from '../write-engine/plan';
import {
  executeWriteOperation,
  finalizeWriteOperationPlan,
  writeEngineExecutionFromPlan,
} from '../write-engine/execute';

type ValidatedSimpleTreeNode = ReturnType<typeof validateTreeNode>;

function simpleTreeNodeToMarkdownLines(node: ValidatedSimpleTreeNode, depth = 0): string[] {
  const title = node.title.replace(/\s+/g, ' ').trim();
  const line = `${'  '.repeat(depth)}- ${title}`;
  return [
    line,
    ...node.children.flatMap((child) => simpleTreeNodeToMarkdownLines(child, depth + 1)),
  ];
}

function simpleTreeNodeToMarkdown(node: ValidatedSimpleTreeNode): string {
  return simpleTreeNodeToMarkdownLines(node).join('\n');
}

export async function createRemTree(
  plugin: RNPlugin,
  args: CreateRemTreeArgs
): Promise<CreateRemTreeResult> {
  const idempotencyKey = getWriteIdempotencyKey(args.idempotencyKey, 'create-tree');
  const cached = CREATE_TREE_RESULT_CACHE.get(idempotencyKey);
  if (cached) {
    return cached;
  }

  const validationState: TreeValidationState = { nodeCount: 0 };
  const tree = validateTreeNode(args.tree, 1, validationState);
  assertTreeLimits(validationState, {}, 'Rem tree');

  try {
    if ((args.position ?? 'end') === 'end' && hasRemSdkApi(plugin, 'createTreeWithMarkdown')) {
      const parent = await findRequiredRem(plugin, args.parentId, 'Parent', 'PARENT_NOT_FOUND');
      const createdRoots = await createRemTreeWithMarkdownApi(
        plugin,
        simpleTreeNodeToMarkdown(tree),
        parent
      );
      const root = createdRoots[0];
      const createdRemIds = await collectCreatedTreeRemIds([root]);
      const rootInsertIndex = await getRemSiblingIndex(root);
      const result: CreateRemTreeResult = {
        rootCreatedRemId: root._id,
        createdNodeCount: createdRemIds.length,
        createdRemIds,
        ...(rootInsertIndex !== undefined ? { rootInsertIndex } : {}),
        rootInsertPosition: 'end',
        status: 'created_tree',
        idempotencyKey,
      };
      rememberCachedResult(CREATE_TREE_RESULT_CACHE, idempotencyKey, result);
      return result;
    }

    const created = await createStyledRemTree(plugin, {
      parentId: args.parentId,
      position: args.position ?? 'end',
      tree: simpleTreeToStyledNode(tree),
    });
    const result: CreateRemTreeResult = {
      rootCreatedRemId: created.rootCreatedRemId,
      createdNodeCount: created.createdNodeCount,
      createdRemIds: created.createdRemIds,
      rootInsertIndex: created.rootInsertIndex,
      rootInsertPosition: args.position ?? 'end',
      status: 'created_tree',
      idempotencyKey,
    };
    rememberCachedResult(CREATE_TREE_RESULT_CACHE, idempotencyKey, result);
    return result;
  } catch (error: unknown) {
    if (error instanceof RemnoteWriteError) {
      const createdRemIds = readCreatedRemIdsFromError(error);
      throw new RemnoteWriteError(error.code, error.message, {
        originalDetails: error.details,
        createdNodeCount: createdRemIds.length,
        createdRemIds,
        partialExecution: {
          ...getPartialExecutionDetails(error.details),
          createdNodeCount: createdRemIds.length,
          createdRemIds,
          failedStage: 'create_rem_tree',
          rollbackStatus: 'not_attempted',
        },
      });
    }

    const createdRemIds: string[] = [];
    throw new RemnoteWriteError('SDK_ERROR', 'RemNote tree creation failed.', {
      createdNodeCount: createdRemIds.length,
      createdRemIds,
      partialExecution: {
        createdNodeCount: createdRemIds.length,
        createdRemIds,
        failedStage: 'create_rem_tree',
        rollbackStatus: 'not_attempted',
      },
      sdkMessage: getSdkErrorMessage(error),
    });
  }
}

export function rememberPolishedTreeResult(
  idempotencyKey: string,
  result: CreatePolishedNoteTreeResult
) {
  POLISHED_TREE_RESULT_CACHE.delete(idempotencyKey);
  POLISHED_TREE_RESULT_CACHE.set(idempotencyKey, result);

  while (POLISHED_TREE_RESULT_CACHE.size > STRUCTURED_BATCH_CACHE_LIMIT) {
    const oldestKey = POLISHED_TREE_RESULT_CACHE.keys().next().value;
    if (typeof oldestKey !== 'string') {
      return;
    }
    POLISHED_TREE_RESULT_CACHE.delete(oldestKey);
  }
}

export async function createPolishedNoteTree(
  plugin: RNPlugin,
  args: CreatePolishedNoteTreeArgs
): Promise<CreatePolishedNoteTreeResult> {
  const startedAt = Date.now();
  const idempotencyKey = getWriteIdempotencyKey(args.idempotencyKey, 'polished-tree');
  if (!args.dryRun) {
    const cached = POLISHED_TREE_RESULT_CACHE.get(idempotencyKey);
    if (cached) {
      const replayPlan = finalizeWriteOperationPlan(
        plugin,
        cached.operationPlan ??
          buildWriteOperationPlan({
            toolName: 'create_polished_note_tree',
            operation: 'create_polished_note_tree',
            dryRun: false,
            idempotencyKey,
            target: { parentId: args.parentId, rootRemId: cached.rootRemId },
            nodesToCreate: cached.createdNodeCount,
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

  const presetTree = applyStylePresetToTree(args.tree, args);
  const operationPlan = finalizeWriteOperationPlan(
    plugin,
    buildWriteOperationPlan({
      toolName: 'create_polished_note_tree',
      operation: 'create_polished_note_tree',
      dryRun: Boolean(args.dryRun),
      idempotencyKey,
      target: { parentId: args.parentId },
      nodes: [presetTree],
      stylesToApply: args.stylingPlan?.operations?.length,
      verificationChecks: args.verifyAfterWrite
        ? ['created_rems_exist', 'verify_note_design']
        : ['validate_tree_limits'],
      rollbackStrategy: 'sdk_transaction',
      replacement: {
        strategy: 'create_child_tree',
        preservesExistingUntilVerified: true,
        oldChildrenSnapshotRequired: false,
      },
    })
  );
  const planningDurationMs = Date.now() - startedAt;

  let createdRemIdsForRollback: string[] = [];
  let verificationDurationMs = 0;
  try {
    const executionStartedAt = Date.now();
    const executed = await executeWriteOperation(plugin, operationPlan, async (activePlan) => {
      const created = await createStyledRemTree(
        plugin,
        {
          parentId: args.parentId,
          position: 'end',
          tree: presetTree,
          dryRun: args.dryRun,
          idempotencyKey,
          maxDepth: args.maxDepth,
          maxNodeCount: args.maxNodeCount,
        },
        { skipTransaction: true }
      );
      createdRemIdsForRollback = created.createdRemIds;
      const stylePlan = args.stylingPlan?.operations?.length
        ? await applyStylePlan(plugin, {
            operations: args.stylingPlan.operations,
            continueOnError: true,
            verifyAfterWrite: args.verifyAfterWrite,
            dryRun: args.dryRun || args.stylingPlan.dryRun,
            idempotencyKey: args.stylingPlan.idempotencyKey,
          })
        : undefined;
      if (!args.dryRun && stylePlan && stylePlan.status !== 'applied') {
        throw new RemnoteWriteError(
          'PARTIAL_FAILURE',
          'Polished note style plan failed after note creation.',
          {
            operationId: activePlan.operationId,
            idempotencyKey,
            stylePlan,
            partialExecution: {
              createdRemIds: created.createdRemIds,
              failedStage: 'apply_polished_style_plan',
              rollbackStatus: 'not_attempted',
            },
          }
        );
      }
      let verification: CreatePolishedNoteTreeResult['verification'];
      if (args.verifyAfterWrite) {
        const verificationStartedAt = Date.now();
        verification = await verifyCreatedRems(plugin, created.createdRemIds, created.rootCreatedRemId);
        verificationDurationMs += Date.now() - verificationStartedAt;
      }
      if (!args.dryRun && verification && !verification.ok) {
        throw new RemnoteWriteError(
          'PARTIAL_FAILURE',
          'Polished note verification failed after note creation.',
          {
            operationId: activePlan.operationId,
            idempotencyKey,
            verification,
            partialExecution: {
              createdRemIds: created.createdRemIds,
              failedStage: 'verify_polished_note_tree',
              rollbackStatus: 'not_attempted',
            },
          }
        );
      }
      const result: CreatePolishedNoteTreeResult = {
        ...created,
        ...(stylePlan ? { stylePlan } : {}),
        ...(verification ? { verification } : {}),
        idempotencyKey,
        rootRemId: created.rootCreatedRemId,
        createdRemCount: created.createdRemIds.length,
        operationPlan: activePlan,
        writeEngine: writeEngineExecutionFromPlan(activePlan),
        styleOperationsApplied:
          stylePlan?.operations.filter((operation) => operation.status === 'applied').length ?? 0,
        rollback: {
          attempted: false,
          completed: false,
        },
        phases: [
          { name: 'validate_tree', status: 'completed' },
          { name: 'create_tree', status: created.status === 'dry_run' ? 'skipped' : 'completed' },
          { name: 'apply_styles', status: stylePlan ? 'completed' : 'skipped' },
          { name: 'verify_design', status: verification ? 'completed' : 'skipped' },
          { name: 'rollback', status: 'skipped' },
        ],
      };
      return result;
    });
    const executionDurationMs = Date.now() - executionStartedAt;
    const performance = buildWritePerformanceReport({
      phaseDurationsMs: {
        planning: planningDurationMs,
        singleWriteExecution: Math.max(0, executionDurationMs - verificationDurationMs),
        verification: verificationDurationMs,
        total: Date.now() - startedAt,
      },
      primaryToolCallCount: 1,
      sdkOperationCount: operationPlan.estimatedOperationCount,
    });
    const result = {
      ...executed.result,
      status: performance.status === 'success_with_performance_warning'
        ? 'success_with_performance_warning' as const
        : executed.result.status,
      operationPlan: executed.operationPlan,
      writeEngine: executed.writeEngine,
      performance,
    };

    if (!args.dryRun) {
      rememberPolishedTreeResult(idempotencyKey, result);
    }

    return result;
  } catch (error: unknown) {
    if (error instanceof RemnoteWriteError) {
      const rollback =
        !args.dryRun && createdRemIdsForRollback.length
          ? await rollbackCreatedRems(plugin, createdRemIdsForRollback)
          : { status: 'not_attempted' as const, removedRemIds: [], failedRemIds: [] };
      throw new RemnoteWriteError(
        error.code === 'PARTIAL_FAILURE' ? 'PARTIAL_FAILURE' : error.code,
        error.message,
        {
          originalDetails: error.details,
          operationPlan,
          partialExecution: {
            ...getPartialExecutionDetails(error.details),
            createdRemIds: createdRemIdsForRollback,
            failedStage: 'create_polished_note_tree',
            rollbackStatus: rollback.status,
            rollbackRemovedRemIds: rollback.removedRemIds,
            rollbackFailedRemIds: rollback.failedRemIds,
          },
        }
      );
    }
    throw error;
  }
}
