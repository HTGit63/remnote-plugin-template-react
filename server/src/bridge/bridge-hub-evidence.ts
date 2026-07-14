import type { BridgeResponse } from '../../../shared/bridge/protocol.js';
import { isRecord, stringArrayFrom, getUniqueStrings } from './bridge-hub-types.js';

function evidenceRecords(value: unknown): Record<string, unknown>[] {
  const records: Record<string, unknown>[] = [];
  const seen = new Set<Record<string, unknown>>();
  const visit = (candidate: unknown) => {
    if (!isRecord(candidate) || seen.has(candidate)) return;
    seen.add(candidate);
    records.push(candidate);
    for (const key of ['partialExecution', 'originalDetails', 'originalError', 'details']) {
      visit(candidate[key]);
    }
  };
  visit(value);
  return records;
}

export function extractCreatedRemIds(response: BridgeResponse): string[] {
  const ids: string[] = [];
  const payload = response.ok ? response.result : response.error.details;

  for (const record of evidenceRecords(payload)) {
    if (typeof record.createdRemId === 'string') ids.push(record.createdRemId);
    if (typeof record.rootCreatedRemId === 'string') ids.push(record.rootCreatedRemId);
    ids.push(...stringArrayFrom(record.createdRemIds));
    ids.push(...stringArrayFrom(record.createdChildRemIds));
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
  const records = evidenceRecords(payload);
  if (!records.length) {
    return {};
  }

  const updatedRemIds = getUniqueStrings(records.flatMap((record) => [
    ...stringArrayFrom(record.updatedRemIds),
    ...(typeof record.updatedRemId === 'string' ? [record.updatedRemId] : []),
    ...(typeof record.remId === 'string' ? [record.remId] : []),
  ]));
  const deletedRemIds = getUniqueStrings(records.flatMap((record) => [
    ...stringArrayFrom(record.deletedRemIds),
    ...(typeof record.deletedRemId === 'string' ? [record.deletedRemId] : []),
  ]));
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
