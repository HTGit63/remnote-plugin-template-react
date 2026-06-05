import type { RNPlugin } from '@remnote/plugin-sdk';
import type { TransactionCapablePlugin, WriteEngineExecution, WriteOperationPlan } from './types';

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
  const willUse = requested && supported && !options.skipTransaction && !plan.dryRun;
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
  options: { idempotencyReplay?: boolean } = {}
): WriteEngineExecution {
  return {
    transactional: plan.transaction.requested,
    transactionSupported: plan.transaction.supported,
    transactionUsed: plan.transaction.willUse,
    idempotencyReplay: Boolean(options.idempotencyReplay),
    persistentHostedIdempotencyPlanned: plan.idempotency.scope === 'hosted_persistent_planned',
  };
}

export async function executeWriteOperation<T>(
  plugin: RNPlugin,
  plan: WriteOperationPlan,
  operation: (activePlan: WriteOperationPlan) => Promise<T>,
  options: { skipTransaction?: boolean } = {}
): Promise<{ result: T; operationPlan: WriteOperationPlan; writeEngine: WriteEngineExecution }> {
  const operationPlan = finalizeWriteOperationPlan(plugin, plan, {
    skipTransaction: options.skipTransaction,
  });
  const transaction = (plugin as TransactionCapablePlugin).app?.transaction;
  let result: T | undefined;
  if (operationPlan.transaction.willUse && typeof transaction === 'function') {
    await transaction.call((plugin as TransactionCapablePlugin).app, async () => {
      result = await operation(operationPlan);
    });
  } else {
    result = await operation(operationPlan);
  }

  if (result === undefined) {
    throw new Error('Write operation did not return a result.');
  }

  return {
    result,
    operationPlan,
    writeEngine: writeEngineExecutionFromPlan(operationPlan),
  };
}
