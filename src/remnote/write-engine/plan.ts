import type { StyledRemTreeNode } from '../../../shared/bridge/protocol';
import { DEFAULT_WRITE_PERFORMANCE_BUDGET_MS } from '../../../shared/bridge/performance';
import type { BuildWriteOperationPlanInput, WriteOperationPlan, WriteTreeMetrics } from './types';

const CARD_NODE_TYPES = new Set([
  'basicFlashcard',
  'conceptCard',
  'descriptorCard',
  'clozeCard',
  'multipleChoiceCard',
  'listAnswerCard',
]);

function hashText(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function createWriteOperationId(
  toolName: string,
  operation: string,
  idempotencyKey?: string
): string {
  const base =
    idempotencyKey?.trim() ||
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `op-${hashText(`${toolName}:${operation}:${base}`)}`;
}

function textSize(node: StyledRemTreeNode): number {
  return [
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
}

function hasStyle(node: StyledRemTreeNode): boolean {
  const style = node.style;
  return Boolean(
    style?.headingLevel ||
    style?.textColor ||
    style?.color ||
    style?.highlightColor ||
    style?.highlight ||
    style?.hideBullet !== undefined ||
    style?.remType ||
    style?.type
  );
}

export function collectWriteTreeMetrics(nodes: readonly StyledRemTreeNode[]): WriteTreeMetrics {
  const metrics: WriteTreeMetrics = {
    nodesToCreate: 0,
    stylesToApply: 0,
    mathBlocksToCreate: 0,
    cardsToCreate: 0,
    estimatedPayloadSize: 0,
  };

  function visit(node: StyledRemTreeNode) {
    metrics.nodesToCreate += 1;
    metrics.estimatedPayloadSize += textSize(node);
    if (hasStyle(node)) {
      metrics.stylesToApply += 1;
    }
    if (node.type === 'mathBlock' || node.type === 'inlineMath') {
      metrics.mathBlocksToCreate += 1;
    }
    if (
      node.richText?.some(
        (span) => span.type === 'mathBlock' || span.type === 'inlineMath' || span.latex
      )
    ) {
      metrics.mathBlocksToCreate += 1;
    }
    if (node.type && CARD_NODE_TYPES.has(node.type)) {
      metrics.cardsToCreate += 1;
    }
    for (const child of node.children ?? []) {
      visit(child);
    }
  }

  for (const node of nodes) {
    visit(node);
  }
  return metrics;
}

export function buildWriteOperationPlan(input: BuildWriteOperationPlanInput): WriteOperationPlan {
  const nodeMetrics = input.nodes ? collectWriteTreeMetrics(input.nodes) : undefined;
  const nodesToCreate = input.nodesToCreate ?? nodeMetrics?.nodesToCreate ?? 0;
  const nodesToUpdate = input.nodesToUpdate ?? 0;
  const nodesToDelete = input.nodesToDelete ?? 0;
  const stylesToApply = input.stylesToApply ?? nodeMetrics?.stylesToApply ?? 0;
  const mathBlocksToCreate = input.mathBlocksToCreate ?? nodeMetrics?.mathBlocksToCreate ?? 0;
  const cardsToCreate = input.cardsToCreate ?? nodeMetrics?.cardsToCreate ?? 0;
  const estimatedOperationCount =
    input.estimatedOperationCount ??
    nodesToCreate +
      nodesToUpdate +
      nodesToDelete +
      stylesToApply +
      mathBlocksToCreate +
      cardsToCreate;

  return {
    operationId:
      input.operationId ??
      createWriteOperationId(input.toolName, input.operation, input.idempotencyKey),
    idempotencyKey: input.idempotencyKey,
    toolName: input.toolName,
    operation: input.operation,
    dryRun: input.dryRun,
    target: input.target ?? {},
    nodesToCreate,
    nodesToUpdate,
    nodesToDelete,
    stylesToApply,
    mathBlocksToCreate,
    cardsToCreate,
    verificationChecks: input.verificationChecks ?? [],
    rollbackStrategy: input.rollbackStrategy ?? 'delete_created_rems',
    estimatedPayloadSize: input.estimatedPayloadSize ?? nodeMetrics?.estimatedPayloadSize ?? 0,
    estimatedOperationCount,
    estimatedTimeBudgetMs:
      input.estimatedTimeBudgetMs ?? Math.max(750, Math.min(5000, estimatedOperationCount * 75)),
    performanceBudgetMs: DEFAULT_WRITE_PERFORMANCE_BUDGET_MS,
    transaction: {
      requested: true,
      supported: false,
      willUse: false,
      reason: 'transaction_support_not_checked',
    },
    idempotency: {
      required: Boolean(input.idempotencyKey),
      scope: input.idempotencyKey ? 'hosted_persistent_planned' : 'plugin_memory',
      replayStatus: 'new',
    },
    ...(input.replacement ? { replacement: input.replacement } : {}),
  };
}
