import type { PluginRem as Rem, RichTextInterface, RNPlugin } from '@remnote/plugin-sdk';
import type {
  InsertImageFromUrlArgs,
  InsertMediaFromUrlArgs,
  InsertMediaFromUrlResult,
  MediaKind,
} from '../../../shared/bridge/protocol';
import {
  MEDIA_RESULT_CACHE,
  getWriteIdempotencyKey,
  rememberCachedResult,
  rememberCreatedRemIds,
} from './writeCaches';
import { findRequiredRem, getFreshInsertIndex } from './remnoteSdkHelpers';
import { RemnoteWriteError, runSdkOperation } from './writeErrors';

const MAX_MEDIA_URL_CHARS = 2048;
const MAX_MEDIA_LABEL_CHARS = 500;
const MAX_MEDIA_DIMENSION = 4096;

type NormalizedMediaArgs = {
  parentId: string;
  url: string;
  position: 'start' | 'end';
  label?: string;
  width?: number;
  height?: number;
  idempotencyKey?: string;
  verifyAfterWrite: boolean;
};

function normalizeMediaUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Missing url.');
  }
  const trimmed = value.trim();
  if (trimmed.length > MAX_MEDIA_URL_CHARS) {
    throw new RemnoteWriteError('INVALID_ARGS', `url exceeds ${MAX_MEDIA_URL_CHARS} characters.`);
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new RemnoteWriteError('INVALID_ARGS', 'url is malformed.');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new RemnoteWriteError('INVALID_ARGS', 'Media URL must use http or https.');
  }
  return parsed.toString();
}

function normalizeMediaArgs(
  mediaKind: MediaKind,
  args: InsertImageFromUrlArgs | InsertMediaFromUrlArgs
): NormalizedMediaArgs {
  const parentId = typeof args.parentId === 'string' ? args.parentId.trim() : '';
  if (!parentId || parentId.length > 256) {
    throw new RemnoteWriteError('INVALID_ARGS', 'parentId is missing or invalid.');
  }
  const position = args.position ?? 'end';
  if (position !== 'start' && position !== 'end') {
    throw new RemnoteWriteError('INVALID_ARGS', 'position must be "start" or "end".');
  }

  let label: string | undefined;
  if (args.label !== undefined) {
    if (typeof args.label !== 'string' || !args.label.trim()) {
      throw new RemnoteWriteError('INVALID_ARGS', 'label must be a non-empty string.');
    }
    label = args.label.trim();
    if (label.length > MAX_MEDIA_LABEL_CHARS) {
      throw new RemnoteWriteError('INVALID_ARGS', `label exceeds ${MAX_MEDIA_LABEL_CHARS} characters.`);
    }
  }

  const imageArgs = args as InsertImageFromUrlArgs;
  const dimensions = mediaKind === 'image'
    ? { width: imageArgs.width, height: imageArgs.height }
    : {};
  for (const [field, value] of Object.entries(dimensions)) {
    if (value !== undefined && (!Number.isInteger(value) || value < 1 || value > MAX_MEDIA_DIMENSION)) {
      throw new RemnoteWriteError(
        'INVALID_ARGS',
        `${field} must be an integer between 1 and ${MAX_MEDIA_DIMENSION}.`
      );
    }
  }

  return {
    parentId,
    url: normalizeMediaUrl(args.url),
    position,
    ...(label ? { label } : {}),
    ...dimensions,
    idempotencyKey: args.idempotencyKey,
    verifyAfterWrite: args.verifyAfterWrite !== false,
  };
}

function capabilityName(mediaKind: MediaKind): `plugin.richText.${MediaKind}` {
  return `plugin.richText.${mediaKind}`;
}

function assertMediaCapability(plugin: RNPlugin, mediaKind: MediaKind): void {
  const namespace = plugin.richText as unknown as Record<string, unknown>;
  if (typeof namespace[mediaKind] !== 'function') {
    const capability = capabilityName(mediaKind);
    throw new RemnoteWriteError(
      'SDK_UNSUPPORTED',
      `${capability} is not available in this RemNote runtime.`,
      { capability, mediaKind }
    );
  }
}

async function buildMediaRichText(
  plugin: RNPlugin,
  mediaKind: MediaKind,
  args: NormalizedMediaArgs
): Promise<RichTextInterface> {
  const builder = mediaKind === 'image'
    ? plugin.richText.image(args.url, args.width, args.height)
    : mediaKind === 'audio'
      ? plugin.richText.audio(args.url)
      : plugin.richText.video(args.url);
  if (args.label) {
    builder.newline().text(args.label);
  }
  return runSdkOperation(`richText.${mediaKind}.value`, () => builder.value());
}

function mediaRecordMatches(
  richText: RichTextInterface,
  mediaKind: MediaKind,
  url: string
): { mediaKindMatched: boolean; urlMatched: boolean } {
  let mediaKindMatched = false;
  let urlMatched = false;
  for (const item of richText) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      continue;
    }
    const record = item as Record<string, unknown>;
    const kindMatches = mediaKind === 'image'
      ? record.i === 'i'
      : record.i === 'a' && record.onlyAudio === (mediaKind === 'audio');
    if (kindMatches) {
      mediaKindMatched = true;
      if (record.url === url) {
        urlMatched = true;
      }
    }
  }
  return { mediaKindMatched, urlMatched };
}

async function rollbackCreatedMedia(
  plugin: RNPlugin,
  createdRem: Rem,
  failedStage: string,
  originalError: RemnoteWriteError
): Promise<never> {
  try {
    await runSdkOperation('rem.remove', () => createdRem.remove());
  } catch (rollbackError: unknown) {
    throw new RemnoteWriteError('PARTIAL_FAILURE', 'Media insertion failed and rollback could not remove the new Rem.', {
      originalCode: originalError.code,
      originalMessage: originalError.message,
      originalDetails: originalError.details,
      partialExecution: {
        createdRemIds: [createdRem._id],
        failedStage,
        rollbackStatus: 'failed',
        rollbackFailedRemIds: [createdRem._id],
        rollbackError: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
      },
    });
  }

  throw new RemnoteWriteError(originalError.code, originalError.message, {
    originalDetails: originalError.details,
    partialExecution: {
      createdRemIds: [createdRem._id],
      failedStage,
      rollbackStatus: 'completed',
      rollbackRemovedRemIds: [createdRem._id],
    },
  });
}

function mediaSignature(mediaKind: MediaKind, args: NormalizedMediaArgs): string {
  return JSON.stringify({
    mediaKind,
    parentId: args.parentId,
    url: args.url,
    position: args.position,
    label: args.label ?? null,
    width: args.width ?? null,
    height: args.height ?? null,
  });
}

export async function insertMediaFromUrl(
  plugin: RNPlugin,
  mediaKind: MediaKind,
  input: InsertImageFromUrlArgs | InsertMediaFromUrlArgs
): Promise<InsertMediaFromUrlResult> {
  const args = normalizeMediaArgs(mediaKind, input);
  const idempotencyKey = getWriteIdempotencyKey(args.idempotencyKey, `insert-${mediaKind}`);
  const signature = mediaSignature(mediaKind, args);
  const cached = MEDIA_RESULT_CACHE.get(idempotencyKey);
  if (cached) {
    if (cached.signature !== signature) {
      throw new RemnoteWriteError(
        'INVALID_ARGS',
        'idempotencyKey was already used for a different media insertion payload.',
        { idempotencyKey, mediaKind }
      );
    }
    return { ...cached.result, status: 'already_applied' };
  }

  assertMediaCapability(plugin, mediaKind);
  const parent = await findRequiredRem(plugin, args.parentId, 'Parent', 'PARENT_NOT_FOUND');
  const richText = await buildMediaRichText(plugin, mediaKind, args);
  const insertIndex = await getFreshInsertIndex(plugin, parent, args.position);
  let createdRem: Rem | null = null;
  let failedStage = 'rem.createRem';

  try {
    const maybeCreatedRem = await runSdkOperation('rem.createRem', () => plugin.rem.createRem());
    if (!maybeCreatedRem) {
      throw new RemnoteWriteError('SDK_ERROR', 'RemNote did not return a created media Rem.', {
        operation: 'rem.createRem',
      });
    }
    createdRem = maybeCreatedRem;
    failedStage = 'rem.setText';
    await runSdkOperation('rem.setText', () => createdRem!.setText(richText));
    failedStage = 'rem.setParent';
    await runSdkOperation('rem.setParent', () => createdRem!.setParent(parent, insertIndex));
  } catch (error: unknown) {
    const typed = error instanceof RemnoteWriteError
      ? error
      : new RemnoteWriteError('SDK_ERROR', 'RemNote SDK operation failed.', {
          sdkMessage: error instanceof Error ? error.message : String(error),
        });
    if (createdRem) {
      return rollbackCreatedMedia(plugin, createdRem, failedStage, typed);
    }
    throw typed;
  }

  let verification: InsertMediaFromUrlResult['verification'];
  if (args.verifyAfterWrite) {
    failedStage = 'media.readback';
    try {
      const refreshed = await findRequiredRem(plugin, createdRem._id, 'Target', 'REM_NOT_FOUND');
      const matches = mediaRecordMatches(refreshed.text ?? [], mediaKind, args.url);
      verification = {
        attempted: true,
        createdRemFound: true,
        ...matches,
      };
      if (!matches.mediaKindMatched || !matches.urlMatched) {
        throw new RemnoteWriteError('SDK_ERROR', 'Created media Rem failed rich-text readback verification.', {
          capability: capabilityName(mediaKind),
          mediaKind,
          createdRemId: createdRem._id,
          verification,
        });
      }
    } catch (error: unknown) {
      const typed = error instanceof RemnoteWriteError
        ? error
        : new RemnoteWriteError('SDK_ERROR', 'Media readback verification failed.');
      return rollbackCreatedMedia(plugin, createdRem, failedStage, typed);
    }
  }

  const result: InsertMediaFromUrlResult = {
    createdRemId: createdRem._id,
    parentId: parent._id,
    mediaKind,
    url: args.url,
    position: args.position,
    insertIndex,
    status: 'inserted',
    idempotencyKey,
    ...(args.label ? { label: args.label } : {}),
    ...(args.width !== undefined ? { width: args.width } : {}),
    ...(args.height !== undefined ? { height: args.height } : {}),
    ...(verification ? { verification } : {}),
  };
  rememberCreatedRemIds([createdRem._id]);
  rememberCachedResult(MEDIA_RESULT_CACHE, idempotencyKey, { signature, result });
  return result;
}

export function insertImageFromUrl(
  plugin: RNPlugin,
  args: InsertImageFromUrlArgs
): Promise<InsertMediaFromUrlResult> {
  return insertMediaFromUrl(plugin, 'image', args);
}

export function insertAudioFromUrl(
  plugin: RNPlugin,
  args: InsertMediaFromUrlArgs
): Promise<InsertMediaFromUrlResult> {
  return insertMediaFromUrl(plugin, 'audio', args);
}

export function insertVideoFromUrl(
  plugin: RNPlugin,
  args: InsertMediaFromUrlArgs
): Promise<InsertMediaFromUrlResult> {
  return insertMediaFromUrl(plugin, 'video', args);
}
