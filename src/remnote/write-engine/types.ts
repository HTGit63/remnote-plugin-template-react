import type { RNPlugin } from '@remnote/plugin-sdk';
import type {
  StyledRemTreeNode,
  WriteEngineExecution,
  WriteOperationPlan,
} from '../../../shared/bridge/protocol';

export type { WriteEngineExecution, WriteOperationPlan };

export interface WriteTreeMetrics {
  nodesToCreate: number;
  stylesToApply: number;
  mathBlocksToCreate: number;
  cardsToCreate: number;
  estimatedPayloadSize: number;
}

export interface BuildWriteOperationPlanInput {
  toolName: string;
  operation: string;
  dryRun: boolean;
  idempotencyKey?: string;
  target?: WriteOperationPlan['target'];
  nodes?: readonly StyledRemTreeNode[];
  nodesToCreate?: number;
  nodesToUpdate?: number;
  nodesToDelete?: number;
  stylesToApply?: number;
  mathBlocksToCreate?: number;
  cardsToCreate?: number;
  verificationChecks?: string[];
  rollbackStrategy?: WriteOperationPlan['rollbackStrategy'];
  replacement?: WriteOperationPlan['replacement'];
  estimatedPayloadSize?: number;
  estimatedOperationCount?: number;
  estimatedTimeBudgetMs?: number;
  operationId?: string;
}

export type TransactionCapablePlugin = RNPlugin & {
  app?: RNPlugin['app'] & {
    transaction?: <T>(fn: () => Promise<T>) => Promise<T>;
  };
};
