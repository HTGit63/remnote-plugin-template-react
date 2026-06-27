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
import { RemnoteWriteError, getPartialExecutionDetails, getSdkErrorMessage, runSdkOperation } from './writeErrors';
import {
  CREATE_TREE_RESULT_CACHE,
  POLISHED_TREE_RESULT_CACHE,
  getWriteIdempotencyKey,
  rememberCachedResult,
  rememberCreatedRemIds,
} from './writeCaches';
import { STRUCTURED_BATCH_CACHE_LIMIT, type TreeValidationState } from './writeTypes';
import { assertTreeLimits, collectStyledTreePlan, simpleTreeToStyledNode, validateTreeNode } from './writeValidation';
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
  applyRemStyle,
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
import { markdownTreeFastPathEnabled } from './runtimeFlags';
import { createNotePlanSummary } from './notePlan';

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

function styledNodeText(node: StyledRemTreeNode): string {
  return (node.text ?? node.title ?? '').replace(/\s+/g, ' ').trim();
}

function canUseMarkdownTreePath(node: StyledRemTreeNode): boolean {
  const type = node.type ?? 'rem';
  if (type !== 'rem') {
    return false;
  }
  if (node.richText?.length || node.latex || node.front || node.back || node.answer || node.clozeText || node.choices?.length || node.items?.length) {
    return false;
  }
  if (!styledNodeText(node)) {
    return false;
  }
  return (node.children ?? []).every(canUseMarkdownTreePath);
}

function styledNodeToMarkdownLines(node: StyledRemTreeNode, depth = 0): string[] {
  const text = styledNodeText(node);
  return [
    `${'  '.repeat(depth)}- ${text}`,
    ...(node.children ?? []).flatMap((child) => styledNodeToMarkdownLines(child, depth + 1)),
  ];
}

function flattenStyledNodes(node: StyledRemTreeNode): StyledRemTreeNode[] {
  return [node, ...(node.children ?? []).flatMap(flattenStyledNodes)];
}

async function collectRemRecordsPreOrder(
  roots: Rem[],
  parentId: string,
  depth = 0
): Promise<Array<{ rem: Rem; parentId: string; depth: number; index: number }>> {
  const records: Array<{ rem: Rem; parentId: string; depth: number; index: number }> = [];
  for (let index = 0; index < roots.length; index += 1) {
    const rem = roots[index];
    records.push({ rem, parentId, depth, index });
    const children = await runSdkOperation('rem.getChildrenRem', () => rem.getChildrenRem());
    records.push(...(await collectRemRecordsPreOrder(children, rem._id, depth + 1)));
  }
  return records;
}

export async function createRemTree(
  plugin: RNPlugin,
  args: CreateRemTreeArgs
): Promise<CreateRemTreeResult> {
  const startedAt = Date.now();
  const idempotencyKey = getWriteIdempotencyKey(args.idempotencyKey, 'create-tree');
  const cached = CREATE_TREE_RESULT_CACHE.get(idempotencyKey);
  if (cached) {
    return { ...cached, durationMs: Date.now() - startedAt };
  }

  const validationState: TreeValidationState = { nodeCount: 0 };
  const tree = validateTreeNode(args.tree, 1, validationState);
  assertTreeLimits(validationState, {}, 'Rem tree');
  let markdownFastPathFallbackReason: string | undefined;

  try {
    if (
      markdownTreeFastPathEnabled() &&
      (args.position ?? 'end') === 'end' &&
      hasRemSdkApi(plugin, 'createTreeWithMarkdown')
    ) {
      const parent = await findRequiredRem(plugin, args.parentId, 'Parent', 'PARENT_NOT_FOUND');
      let createdRoots: Rem[] | null = null;
      try {
        createdRoots = await createRemTreeWithMarkdownApi(
          plugin,
          simpleTreeNodeToMarkdown(tree),
          parent
        );
      } catch (error: unknown) {
        createdRoots = null;
        markdownFastPathFallbackReason = getSdkErrorMessage(error);
      }

      if (createdRoots) {
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
          fallback: { used: false },
          durationMs: Date.now() - startedAt,
        };
        rememberCreatedRemIds(createdRemIds);
        rememberCachedResult(CREATE_TREE_RESULT_CACHE, idempotencyKey, result);
        return result;
      }
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
      fallback: markdownFastPathFallbackReason
        ? { used: true, reason: markdownFastPathFallbackReason }
        : { used: false },
      durationMs: Date.now() - startedAt,
    };
    rememberCreatedRemIds(created.createdRemIds);
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
        durationMs: Date.now() - startedAt,
      };
    }
  }

  const presetTree = applyStylePresetToTree(args.tree, args);
  const notePlan = createNotePlanSummary(presetTree, 'polished');
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
  let markdownFastPathFallbackUsed = false;
  let markdownFastPathFallbackReason: string | undefined;
  try {
    const executionStartedAt = Date.now();
    const executed = await executeWriteOperation(plugin, operationPlan, async (activePlan) => {
      const canUseReliableMarkdownTree =
        markdownTreeFastPathEnabled() &&
        !args.dryRun &&
        !args.stylingPlan?.operations?.length &&
        hasRemSdkApi(plugin, 'createTreeWithMarkdown') &&
        canUseMarkdownTreePath(presetTree);
      let created: CreateStyledRemTreeResult;
      if (canUseReliableMarkdownTree) {
        const parent = await findRequiredRem(plugin, args.parentId, 'Parent', 'PARENT_NOT_FOUND');
        let roots: Rem[] | null = null;
        try {
          roots = await createRemTreeWithMarkdownApi(
            plugin,
            styledNodeToMarkdownLines(presetTree).join('\n'),
            parent
          );
        } catch (error: unknown) {
          roots = null;
          markdownFastPathFallbackUsed = true;
          markdownFastPathFallbackReason = getSdkErrorMessage(error);
        }
        if (!roots) {
          created = await createStyledRemTree(
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
          markdownFastPathFallbackUsed = markdownFastPathFallbackUsed || Boolean(created.writeEngine?.fallbackUsed);
          markdownFastPathFallbackReason = markdownFastPathFallbackReason ?? created.writeEngine?.fallbackReason;
        } else {
          const records = await collectRemRecordsPreOrder(roots, parent._id);
          const plannedNodes = flattenStyledNodes(presetTree);
          const root = roots[0];
          const createdRemIds = await collectCreatedTreeRemIds(roots);
          createdRemIdsForRollback = createdRemIds;
          for (let index = 0; index < Math.min(records.length, plannedNodes.length); index += 1) {
            await applyRemStyle(plugin, records[index].rem, plannedNodes[index].style);
          }
          created = {
            rootCreatedRemId: root._id,
            createdNodeCount: createdRemIds.length,
            createdRemIds,
            createdNodes: records.map((record, index) => ({
              remId: record.rem._id,
              parentId: record.parentId,
              depth: record.depth,
              index: record.index,
              type: plannedNodes[index]?.type ?? 'rem',
            })),
            rootInsertIndex: await getRemSiblingIndex(root),
            rootInsertPosition: 'end',
            status: 'created_styled_tree',
            idempotencyKey,
            idMap: Object.fromEntries(
              plannedNodes
                .map((node, index) => [node.clientNodeId, records[index]?.rem._id] as const)
                .filter((entry): entry is readonly [string, string] => Boolean(entry[0] && entry[1]))
            ),
            previewOutline: [presetTree].reduce((outline, node) => {
              collectStyledTreePlan(node, 0, outline);
              return outline;
            }, [] as string[]),
            styleOperationCount: plannedNodes.reduce(
              (count, node) => count + (node.style ? Object.values(node.style).filter((value) => value !== undefined).length : 0),
              0
            ),
            mathNodeCount: 0,
            cardNodeCount: 0,
            operationPlan: activePlan,
            writeEngine: writeEngineExecutionFromPlan(activePlan),
          };
        }
      } else {
        created = await createStyledRemTree(
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
        markdownFastPathFallbackUsed = Boolean(created.writeEngine?.fallbackUsed);
        markdownFastPathFallbackReason = created.writeEngine?.fallbackReason;
      }
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
        notePlan,
        phases: [
          { name: 'validate_tree', status: 'completed' },
          { name: 'create_tree', status: created.status === 'dry_run' ? 'skipped' : 'completed' },
          { name: 'apply_styles', status: stylePlan ? 'completed' : 'skipped' },
          { name: 'verify_design', status: verification ? 'completed' : 'skipped' },
          { name: 'rollback', status: 'skipped' },
        ],
      };
      return result;
    }, {
      getCreatedRemIds: () => createdRemIdsForRollback,
      getFallbackUsed: () => markdownFastPathFallbackUsed,
      getFallbackReason: () => markdownFastPathFallbackReason,
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
      fallbackUsed: executed.writeEngine.fallbackUsed,
      fallbackReason: executed.writeEngine.fallbackReason,
    });
    const result = {
      ...executed.result,
      status: performance.status === 'success_with_performance_warning'
        ? 'success_with_performance_warning' as const
        : executed.result.status,
      operationPlan: executed.operationPlan,
      writeEngine: executed.writeEngine,
      performance,
      durationMs: Date.now() - startedAt,
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
