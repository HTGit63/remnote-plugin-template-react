import type { BridgeResponse } from '../../../shared/bridge/protocol.js';
import { isRecord, stringArrayFrom, getUniqueStrings } from './bridge-hub-types.js';

export function extractCreatedRemIds(response: BridgeResponse): string[] {
  const ids: string[] = [];
  const payload = response.ok ? response.result : response.error.details;

  if (isRecord(payload)) {
    if (typeof payload.createdRemId === 'string') {
      ids.push(payload.createdRemId);
    }
    if (typeof payload.rootCreatedRemId === 'string') {
      ids.push(payload.rootCreatedRemId);
    }
    ids.push(...stringArrayFrom(payload.createdRemIds));
    ids.push(...stringArrayFrom(payload.createdChildRemIds));

    const partialExecution = isRecord(payload.partialExecution)
      ? payload.partialExecution
      : undefined;
    if (partialExecution) {
      if (typeof partialExecution.createdRemId === 'string') {
        ids.push(partialExecution.createdRemId);
      }
      if (typeof partialExecution.rootCreatedRemId === 'string') {
        ids.push(partialExecution.rootCreatedRemId);
      }
      ids.push(...stringArrayFrom(partialExecution.createdRemIds));
      ids.push(...stringArrayFrom(partialExecution.createdChildRemIds));
    }

    const originalDetails = isRecord(payload.originalDetails)
      ? payload.originalDetails
      : undefined;
    const nestedPartial = originalDetails && isRecord(originalDetails.partialExecution)
      ? originalDetails.partialExecution
      : undefined;
    if (nestedPartial) {
      ids.push(...stringArrayFrom(nestedPartial.createdRemIds));
    }
  }

  return getUniqueStrings(ids);
}

export function extractPartialExecution(
  response: BridgeResponse,
  createdRemIds: string[]
): unknown | undefined {
  if (response.ok) {
    return undefined;
  }

  const details = isRecord(response.error.details) ? response.error.details : undefined;
  if (!details) {
    return createdRemIds.length ? { createdRemIds } : undefined;
  }

  if (isRecord(details.partialExecution)) {
    return details.partialExecution;
  }

  if (createdRemIds.length) {
    return {
      createdRemIds,
      rollbackStatus: 'not_attempted',
    };
  }

  return undefined;
}

export function getUpdatedDeletedEvidence(response: BridgeResponse) {
  const payload = response.ok ? response.result : response.error.details;
  if (!isRecord(payload)) {
    return {};
  }

  const updatedRemIds = getUniqueStrings([
    ...stringArrayFrom(payload.updatedRemIds),
    ...(typeof payload.updatedRemId === 'string' ? [payload.updatedRemId] : []),
    ...(typeof payload.remId === 'string' ? [payload.remId] : []),
  ]);
  const deletedRemIds = getUniqueStrings([
    ...stringArrayFrom(payload.deletedRemIds),
    ...(typeof payload.deletedRemId === 'string' ? [payload.deletedRemId] : []),
  ]);
  return {
    ...(updatedRemIds.length ? { updatedRemIds } : {}),
    ...(deletedRemIds.length ? { deletedRemIds } : {}),
  };
}

export function getExecutionEvidence(response: BridgeResponse) {
  const createdRemIds = extractCreatedRemIds(response);
  const partialExecution = extractPartialExecution(response, createdRemIds);
  return {
    ...(createdRemIds.length ? { createdRemIds } : {}),
    ...getUpdatedDeletedEvidence(response),
    ...(partialExecution ? { partialExecution } : {}),
    ...(!response.ok && response.error.code === 'SDK_UNSUPPORTED' ? { sdkUnsupported: true } : {}),
  };
}
