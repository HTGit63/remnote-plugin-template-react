import { RemType, SetRemType } from '@remnote/plugin-sdk';
import type { Rem, RichTextFormatName, RichTextInterface, RNPlugin } from '@remnote/plugin-sdk';
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
import { CREATE_TREE_RESULT_CACHE, POLISHED_TREE_RESULT_CACHE, getWriteIdempotencyKey, rememberCachedResult } from './writeCaches';
import { STRUCTURED_BATCH_CACHE_LIMIT, type TreeValidationState } from './writeTypes';
import { assertTreeLimits, simpleTreeToStyledNode, validateTreeNode } from './writeValidation';
import { createStyledRemTree, readCreatedRemIdsFromError, verifyCreatedRems } from './structuredBatch';
import { applyStylePlan } from './formattingWrites';

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


export function rememberPolishedTreeResult(idempotencyKey: string, result: CreatePolishedNoteTreeResult) {
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
  const idempotencyKey = getWriteIdempotencyKey(args.idempotencyKey, 'polished-tree');
  if (!args.dryRun) {
    const cached = POLISHED_TREE_RESULT_CACHE.get(idempotencyKey);
    if (cached) {
      return cached;
    }
  }

    const created = await createStyledRemTree(plugin, {
      parentId: args.parentId,
      position: 'end',
      tree: applyStylePresetToTree(args.tree, args),
      dryRun: args.dryRun,
      idempotencyKey,
      maxDepth: args.maxDepth,
    maxNodeCount: args.maxNodeCount,
  });
  const stylePlan = args.stylingPlan?.operations?.length
    ? await applyStylePlan(plugin, {
        operations: args.stylingPlan.operations,
        continueOnError: true,
        verifyAfterWrite: args.verifyAfterWrite,
        dryRun: args.dryRun || args.stylingPlan.dryRun,
        idempotencyKey: args.stylingPlan.idempotencyKey,
      })
    : undefined;
  const verification = args.verifyAfterWrite
    ? await verifyCreatedRems(plugin, created.createdRemIds, created.rootCreatedRemId)
    : undefined;
  const result: CreatePolishedNoteTreeResult = {
    ...created,
    ...(stylePlan ? { stylePlan } : {}),
    ...(verification ? { verification } : {}),
    idempotencyKey,
    rootRemId: created.rootCreatedRemId,
    createdRemCount: created.createdRemIds.length,
    styleOperationsApplied: stylePlan?.operations.filter((operation) => operation.status === 'applied').length ?? 0,
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

  if (!args.dryRun) {
    rememberPolishedTreeResult(idempotencyKey, result);
  }

  return result;
}
