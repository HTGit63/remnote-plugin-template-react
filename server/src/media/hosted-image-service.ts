import { createHash, randomUUID } from 'node:crypto';
import type { BridgeFailure } from '../../../shared/bridge/protocol.js';
import type { StorageProvider } from '../storage/types.js';
import type { HostedImageFile } from './hosted-image-loader.js';

export class HostedMediaError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(`${code}: ${message}`);
    this.name = 'HostedMediaError';
  }
}

function validatedPublicBaseUrl(value: string): URL {
  let publicBaseUrl: URL;
  try {
    publicBaseUrl = new URL(value);
  } catch {
    throw new HostedMediaError(
      'HOSTED_MEDIA_PUBLIC_URL_INVALID',
      'A valid public HTTPS base URL is required.'
    );
  }
  if (publicBaseUrl.protocol !== 'https:') {
    throw new HostedMediaError(
      'HOSTED_MEDIA_PUBLIC_URL_INVALID',
      'A valid public HTTPS base URL is required.'
    );
  }
  return publicBaseUrl;
}

function assertDurableStorage(storage: StorageProvider): void {
  if (storage.hostedMediaStorageDurability() !== 'persistent') {
    throw new HostedMediaError(
      'HOSTED_MEDIA_STORAGE_NOT_DURABLE',
      'Durable hosted images require PostgreSQL storage.'
    );
  }
}

export async function findReusableHostedImageAsset(input: {
  storage: StorageProvider;
  ownerId: string;
  idempotencyKey: string;
  sourceFileId: string;
  publicBaseUrl: string;
}) {
  assertDurableStorage(input.storage);
  const publicBaseUrl = validatedPublicBaseUrl(input.publicBaseUrl);
  const asset = await input.storage.getHostedMediaAssetByIdempotency(input.ownerId, input.idempotencyKey);
  if (!asset) return null;
  if (asset.sourceFileId !== input.sourceFileId) {
    throw new HostedMediaError(
      'HOSTED_MEDIA_IDEMPOTENCY_CONFLICT',
      'The idempotency key is already bound to a different ChatGPT file.'
    );
  }
  return {
    status: 'already_hosted' as const,
    asset,
    url: new URL(`/media/images/${asset.assetId}`, publicBaseUrl).toString(),
  };
}

export async function persistHostedImageAsset(input: {
  storage: StorageProvider;
  ownerId: string;
  idempotencyKey: string;
  publicBaseUrl: string;
  file: HostedImageFile;
}) {
  assertDurableStorage(input.storage);
  const publicBaseUrl = validatedPublicBaseUrl(input.publicBaseUrl);

  const sha256 = createHash('sha256').update(input.file.bytes).digest('hex');
  const stored = await input.storage.createHostedMediaAsset({
    assetId: randomUUID(),
    ownerId: input.ownerId,
    idempotencyKey: input.idempotencyKey,
    sourceFileId: input.file.fileId,
    sha256,
    contentType: input.file.contentType,
    fileName: input.file.fileName,
    bytes: input.file.bytes,
    createdAt: new Date().toISOString(),
  });
  return {
    status: stored.created ? 'hosted' as const : 'already_hosted' as const,
    asset: stored.asset,
    url: new URL(`/media/images/${stored.asset.assetId}`, publicBaseUrl).toString(),
  };
}

type HostedAssetCleanupStatus =
  | 'deleted_unreferenced_after_failure'
  | 'retained_remote_dependency'
  | 'retained_unverified'
  | 'retained_uncertain_reference'
  | 'cleanup_failed';

export interface HostedAssetCleanupResult {
  cleanupStatus: HostedAssetCleanupStatus;
  deleted: boolean;
  remnoteStillReferencesHostedUrl: boolean | null;
  reason: string;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function failureHasUnresolvedCreatedRem(details: unknown): boolean {
  const visited = new Set<object>();
  const visit = (value: unknown): boolean => {
    const record = asRecord(value);
    if (!record || visited.has(record)) return false;
    visited.add(record);

    if (record.rollbackStatus === 'completed') {
      return false;
    }
    if (typeof record.createdRemId === 'string' || typeof record.rootCreatedRemId === 'string') {
      return true;
    }
    if (Array.isArray(record.createdRemIds) && record.createdRemIds.some((id) => typeof id === 'string')) {
      return true;
    }
    return ['partialExecution', 'originalDetails', 'originalError', 'details']
      .some((key) => visit(record[key]));
  };
  return visit(details);
}

export function assessSuccessfulHostedImageRetention(
  result: unknown,
  hostedUrl: string
): HostedAssetCleanupResult {
  const record = asRecord(result);
  const verification = asRecord(record?.verification);
  const remnoteStillReferencesHostedUrl = record?.url === hostedUrl || verification?.urlMatched === true;
  if (remnoteStillReferencesHostedUrl) {
    return {
      cleanupStatus: 'retained_remote_dependency',
      deleted: false,
      remnoteStillReferencesHostedUrl: true,
      reason: 'RemNote rich text still references the bridge-hosted URL; deleting the bytes would break rendering.',
    };
  }
  return {
    cleanupStatus: 'retained_unverified',
    deleted: false,
    remnoteStillReferencesHostedUrl: null,
    reason: 'The bridge could not prove that RemNote owns an independent durable copy, so cleanup was refused.',
  };
}

export async function cleanupNewHostedImageAfterFailure(input: {
  storage: StorageProvider;
  ownerId: string;
  assetId: string;
  wasCreated: boolean;
  failure: BridgeFailure;
}): Promise<HostedAssetCleanupResult> {
  const uncertain = input.failure.error.code === 'RETRYABLE_UNKNOWN_WRITE_STATUS'
    || input.failure.error.code === 'RETRYABLE_UNKNOWN_DELETE_STATUS'
    || failureHasUnresolvedCreatedRem(input.failure.error.details);
  if (!input.wasCreated || uncertain) {
    return {
      cleanupStatus: 'retained_uncertain_reference',
      deleted: false,
      remnoteStillReferencesHostedUrl: null,
      reason: input.wasCreated
        ? 'The plugin write may have created a RemNote reference, so automatic deletion was refused.'
        : 'The asset existed before this attempt and may already be referenced by RemNote.',
    };
  }

  try {
    const deleted = await input.storage.deleteHostedMediaAsset(input.assetId, input.ownerId);
    return deleted
      ? {
          cleanupStatus: 'deleted_unreferenced_after_failure',
          deleted: true,
          remnoteStillReferencesHostedUrl: false,
          reason: 'The plugin returned a definitive no-write failure, so the newly hosted orphan was deleted.',
        }
      : {
          cleanupStatus: 'cleanup_failed',
          deleted: false,
          remnoteStillReferencesHostedUrl: null,
          reason: 'The orphan cleanup did not delete the owner-scoped hosted asset.',
        };
  } catch {
    return {
      cleanupStatus: 'cleanup_failed',
      deleted: false,
      remnoteStillReferencesHostedUrl: null,
      reason: 'The owner-scoped hosted asset cleanup failed.',
    };
  }
}
