import type { Rem } from '@remnote/plugin-sdk';
import type { BridgeErrorCode } from '../../../shared/bridge/protocol';
import { RichTextFormattingError } from '../richTextFormatting';

export class RemnoteWriteError extends Error {
  constructor(
    readonly code: BridgeErrorCode,
    message: string,
    readonly details?: unknown
  ) {
    super(message);
    this.name = 'RemnoteWriteError';
  }
}

export function getSdkErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function runSdkOperation<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    throw new RemnoteWriteError('SDK_ERROR', 'RemNote SDK operation failed.', {
      operation: operationName,
      sdkMessage: getSdkErrorMessage(error),
    });
  }
}

export function getPartialExecutionDetails(details: unknown): Record<string, unknown> {
  if (typeof details !== 'object' || details === null || Array.isArray(details)) {
    return {};
  }

  const partialExecution = (details as Record<string, unknown>).partialExecution;
  return typeof partialExecution === 'object' && partialExecution !== null && !Array.isArray(partialExecution)
    ? (partialExecution as Record<string, unknown>)
    : {};
}

export function mapFormattingError(error: unknown): RemnoteWriteError {
  if (error instanceof RichTextFormattingError) {
    return new RemnoteWriteError(error.code, error.message, error.details);
  }

  if (error instanceof RemnoteWriteError) {
    return error;
  }

  return new RemnoteWriteError('SDK_ERROR', 'RemNote SDK operation failed.', {
    sdkMessage: getSdkErrorMessage(error),
  });
}

export function wrapPartialCreateError(
  error: RemnoteWriteError,
  createdRem: Rem | null,
  failedStage: string
): RemnoteWriteError {
  if (!createdRem) {
    return error;
  }

  return new RemnoteWriteError(error.code, error.message, {
    originalDetails: error.details,
    partialExecution: {
      ...getPartialExecutionDetails(error.details),
      createdRemIds: [createdRem._id],
      failedStage,
      rollbackStatus: 'not_attempted',
    },
  });
}

