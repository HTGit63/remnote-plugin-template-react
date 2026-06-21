import type { RNPlugin } from '@remnote/plugin-sdk';
import type { TransactionCapablePlugin, WriteEngineExecution, WriteOperationPlan } from './types';
import { sdkTransactionsDisabledByRuntimeFlag } from '../write/runtimeFlags';
import { RemnoteWriteError } from '../write/writeErrors';

export function sdkTransactionSupported(plugin: RNPlugin): boolean {
  return typeof (plugin as TransactionCapablePlugin).app?.transaction === 'function';
}

export function finalizeWriteOperationPlan(
  plugin: RNPlugin,
  plan: WriteOperationPlan,
  options: {
    requestTransaction?: boolean;
    skipTransaction?: boolean;
    idempotencyReplay?: boolean;
  } = {}
): WriteOperationPlan {
  const requested = options.requestTransaction ?? true;
  const supported = sdkTransactionSupported(plugin);
  const disabledByRuntimeFlag = sdkTransactionsDisabledByRuntimeFlag();
  const willUse = requested && supported && !options.skipTransaction && !plan.dryRun && !disabledByRuntimeFlag;
  return {
    ...plan,
    transaction: {
      requested,
      supported,
      willUse,
      reason: willUse
        ? 'plugin.app.transaction'
        : plan.dryRun
          ? 'dry_run'
          : options.skipTransaction
            ? 'nested_transaction_skipped'
            : disabledByRuntimeFlag
              ? 'sdk_transactions_disabled_by_default'
              : supported
                ? 'transaction_not_requested'
                : 'sdk_transaction_unavailable',
    },
    idempotency: {
      ...plan.idempotency,
      replayStatus: options.idempotencyReplay ? 'already_applied' : plan.idempotency.replayStatus,
    },
  };
}

export function writeEngineExecutionFromPlan(
  plan: WriteOperationPlan,
  options: {
    idempotencyReplay?: boolean;
    transactionReturnedValue?: boolean;
    callbackReturnedValue?: boolean;
    fallbackUsed?: boolean;
    fallbackReason?: string;
    createdRemIdsBeforeError?: string[];
  } = {}
): WriteEngineExecution {
  return {
    transactional: plan.transaction.requested,
    transactionRequested: plan.transaction.requested,
    transactionSupported: plan.transaction.supported,
    transactionUsed: plan.transaction.willUse,
    transactionReturnedValue: options.transactionReturnedValue,
    callbackReturnedValue: options.callbackReturnedValue,
    fallbackUsed: options.fallbackUsed,
    fallbackReason: options.fallbackReason,
    createdRemIdsBeforeError: options.createdRemIdsBeforeError,
    idempotencyReplay: Boolean(options.idempotencyReplay),
    persistentHostedIdempotencyPlanned: plan.idempotency.scope === 'hosted_persistent_planned',
  };
}

export async function executeWriteOperation<T>(
  plugin: RNPlugin,
  plan: WriteOperationPlan,
  operation: (activePlan: WriteOperationPlan) => Promise<T>,
  options: {
    skipTransaction?: boolean;
    getCreatedRemIds?: () => string[];
    getFallbackUsed?: () => boolean;
    getFallbackReason?: () => string | undefined;
  } = {}
): Promise<{ result: T; operationPlan: WriteOperationPlan; writeEngine: WriteEngineExecution }> {
  const operationPlan = finalizeWriteOperationPlan(plugin, plan, {
    skipTransaction: options.skipTransaction,
  });
  const transaction = (plugin as TransactionCapablePlugin).app?.transaction;
  let result: T | undefined;
  let transactionReturnedValue: boolean | undefined;
  let callbackReturnedValue = false;
  if (operationPlan.transaction.willUse && typeof transaction === 'function') {
    const app = (plugin as TransactionCapablePlugin).app;
    result = await app.transaction!(async () => {
      const callbackResult = await operation(operationPlan);
      callbackReturnedValue = callbackResult !== undefined;
      return callbackResult;
    });
    transactionReturnedValue = result !== undefined;
  } else {
    result = await operation(operationPlan);
    callbackReturnedValue = result !== undefined;
    transactionReturnedValue = operationPlan.transaction.willUse ? false : undefined;
  }

  if (result === undefined) {
    const createdRemIdsBeforeError = options.getCreatedRemIds?.() ?? [];
    throw new RemnoteWriteError(
      operationPlan.transaction.willUse ? 'TRANSACTION_RETURN_BUG' : 'SDK_ERROR',
      operationPlan.transaction.willUse
        ? 'RemNote SDK transaction did not return the callback result.'
        : 'Write operation did not return a result.',
      {
        operationId: operationPlan.operationId,
        transactionRequested: operationPlan.transaction.requested,
        transactionSupported: operationPlan.transaction.supported,
        transactionUsed: operationPlan.transaction.willUse,
        transactionReturnedValue: false,
        callbackReturnedValue,
        fallbackUsed: options.getFallbackUsed?.() ?? false,
        fallbackReason: options.getFallbackReason?.(),
        createdRemIdsBeforeError,
        partialExecution: {
          createdRemIds: createdRemIdsBeforeError,
          failedStage: operationPlan.transaction.willUse ? 'sdk_transaction_return' : 'write_operation_return',
          rollbackStatus: 'not_attempted',
        },
      }
    );
  }

  return {
    result,
    operationPlan,
    writeEngine: writeEngineExecutionFromPlan(operationPlan, {
      transactionReturnedValue,
      callbackReturnedValue,
      fallbackUsed: options.getFallbackUsed?.() ?? false,
      fallbackReason: options.getFallbackReason?.(),
      createdRemIdsBeforeError: options.getCreatedRemIds?.() ?? [],
    }),
  };
}
