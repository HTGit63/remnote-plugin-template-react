import { randomUUID } from 'node:crypto';
import type { BridgeFailure } from '../../../shared/bridge/protocol.js';
import {
  loadHostedImageFile,
  loadHostedMediaFile,
  type ChatGptMediaFileReference,
  type HostedMediaKind,
} from '../media/hosted-image-loader.js';
import {
  assessSuccessfulHostedImageRetention,
  assessSuccessfulHostedMediaRetention,
  cleanupNewHostedImageAfterFailure,
  cleanupNewHostedMediaAfterFailure,
  findReusableHostedImageAsset,
  findReusableHostedMediaAsset,
  persistHostedImageAsset,
  persistHostedMediaAsset,
} from '../media/hosted-image-service.js';
import { recordToolHistoryEvent } from '../tool-health-history.js';
import {
  BRIDGE_TOOL_OUTPUT_SCHEMA,
  INSERT_AUDIO_FROM_FILE_INPUT_SCHEMA,
  INSERT_AUDIO_FROM_URL_INPUT_SCHEMA,
  INSERT_IMAGE_FROM_FILE_INPUT_SCHEMA,
  INSERT_IMAGE_FROM_URL_INPUT_SCHEMA,
  INSERT_VIDEO_FROM_FILE_INPUT_SCHEMA,
  INSERT_VIDEO_FROM_URL_INPUT_SCHEMA,
} from './schemas.js';
import {
  annotationsFor,
  bridgeToolResult,
  failureToToolResult,
  successToToolResult,
  type ToolRegistrationContext,
} from './tool-context.js';

const HOSTED_FILE_MEDIA_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

export function registerMediaTools({
  registerTool,
  callPlugin,
  principal,
  storage,
  requestSignal,
  hostedMediaPolicy,
  hostedImageLoader = loadHostedImageFile,
  hostedMediaLoader = loadHostedMediaFile,
}: ToolRegistrationContext): void {
  const handleHostedMediaFile = async (input: {
    toolName: 'insert_audio_from_file' | 'insert_video_from_file';
    mediaKind: Exclude<HostedMediaKind, 'image'>;
    file: ChatGptMediaFileReference;
    parentId: string;
    position: 'start' | 'end';
    label?: string;
    idempotencyKey: string;
    verifyAfterWrite: boolean;
  }) => {
    const operationId = `${input.toolName}-${randomUUID()}`;
    const startedAt = Date.now();
    try {
      if (!storage) {
        throw Object.assign(new Error('Hosted media storage is unavailable.'), {
          code: 'HOSTED_MEDIA_STORAGE_UNAVAILABLE',
        });
      }
      if (!hostedMediaPolicy?.publicBaseUrl) {
        throw Object.assign(new Error('Hosted media public URL is unavailable.'), {
          code: 'HOSTED_MEDIA_PUBLIC_URL_INVALID',
        });
      }
      const ownerId = principal?.userId ?? principal?.subject;
      if (!ownerId) {
        throw Object.assign(new Error('Authenticated hosted media owner is unavailable.'), {
          code: 'HOSTED_MEDIA_AUTH_REQUIRED',
        });
      }
      const reusable = await findReusableHostedMediaAsset({
        storage,
        ownerId,
        idempotencyKey: input.idempotencyKey,
        sourceFileId: input.file.file_id,
        publicBaseUrl: hostedMediaPolicy.publicBaseUrl,
        mediaKind: input.mediaKind,
      });
      const hosted = reusable ?? await (async () => {
        const maxBytes = input.mediaKind === 'audio'
          ? hostedMediaPolicy.maxAudioBytes ?? hostedMediaPolicy.maxImageBytes
          : hostedMediaPolicy.maxVideoBytes ?? hostedMediaPolicy.maxImageBytes;
        const file = await hostedMediaLoader(input.mediaKind, input.file, {
          principal,
          policy: { maxBytes, remoteTimeoutMs: hostedMediaPolicy.remoteTimeoutMs },
          signal: requestSignal,
        });
        return persistHostedMediaAsset({
          storage,
          ownerId,
          idempotencyKey: input.idempotencyKey,
          publicBaseUrl: hostedMediaPolicy.publicBaseUrl,
          file,
        });
      })();
      const pluginArgs = {
        parentId: input.parentId,
        url: hosted.url,
        position: input.position,
        label: input.label,
        idempotencyKey: input.idempotencyKey,
        verifyAfterWrite: input.verifyAfterWrite,
      };
      const response = input.mediaKind === 'audio'
        ? await callPlugin('insert_audio_from_url', pluginArgs)
        : await callPlugin('insert_video_from_url', pluginArgs);
      if (!response.ok) {
        const hostedAssetCleanup = await cleanupNewHostedMediaAfterFailure({
          storage,
          ownerId,
          assetId: hosted.asset.assetId,
          wasCreated: hosted.status === 'hosted',
          failure: response,
        });
        recordToolHistoryEvent({
          tool: input.toolName,
          kind: 'failure',
          durationMs: Date.now() - startedAt,
          errorCode: response.error.code,
          source: 'bridge',
        });
        const originalDetails = typeof response.error.details === 'object'
          && response.error.details !== null
          && !Array.isArray(response.error.details)
          ? response.error.details as Record<string, unknown>
          : response.error.details === undefined
            ? {}
            : { originalDetails: response.error.details };
        return failureToToolResult({
          ...response,
          error: {
            ...response.error,
            details: { ...originalDetails, hostedAssetCleanup },
          },
        }, input.toolName);
      }
      const result = typeof response.result === 'object' && response.result !== null && !Array.isArray(response.result)
        ? response.result as Record<string, unknown>
        : { value: response.result };
      const hostedAssetCleanup = assessSuccessfulHostedMediaRetention(result, hosted.url);
      recordToolHistoryEvent({
        tool: input.toolName,
        kind: 'success',
        durationMs: Date.now() - startedAt,
        source: 'bridge',
      });
      return successToToolResult({
        ...response,
        result: {
          ...result,
          toolName: input.toolName,
          hostedAsset: {
            assetId: hosted.asset.assetId,
            url: hosted.url,
            contentType: hosted.asset.contentType,
            fileName: hosted.asset.fileName,
            byteLength: hosted.asset.bytes.byteLength,
            storageDurability: storage.hostedMediaStorageDurability(),
            hostingStatus: hosted.status,
            ...hostedAssetCleanup,
          },
        },
      }, `ChatGPT ${input.mediaKind} file hosted and inserted as native RemNote media.`);
    } catch (error) {
      const errorCode = typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code: unknown }).code)
        : 'HOSTED_MEDIA_INTERNAL_ERROR';
      const safeErrorCode = errorCode !== 'HOSTED_MEDIA_INTERNAL_ERROR'
        && errorCode.startsWith('HOSTED_MEDIA_');
      const message = safeErrorCode && error instanceof Error
        ? error.message
        : 'Hosted media processing failed internally.';
      recordToolHistoryEvent({
        tool: input.toolName,
        kind: 'failure',
        durationMs: Date.now() - startedAt,
        errorCode,
        source: 'bridge',
      });
      return failureToToolResult({
        id: operationId,
        ok: false,
        error: {
          code: safeErrorCode ? 'INVALID_ARGS' : 'INTERNAL_ERROR',
          message,
          details: { errorCode, layer: 'server_hosted_media' },
        },
      }, input.toolName);
    }
  };

  registerTool(
    'insert_image_from_url',
    {
      title: 'Insert image from URL',
      description: 'Use this when a stable HTTP(S) image URL already exists. Create a native RemNote image child without replacing existing content; do not insert the URL as plain text.',
      inputSchema: INSERT_IMAGE_FROM_URL_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('insert_image_from_url'),
    },
    async ({ parentId, url, position, label, width, height, idempotencyKey, verifyAfterWrite }) =>
      bridgeToolResult(
        () => callPlugin('insert_image_from_url', { parentId, url, position, label, width, height, idempotencyKey, verifyAfterWrite }),
        'Insert image from URL request processed.'
      )
  );

  registerTool(
    'insert_image_from_file',
    {
      title: 'Host and insert ChatGPT image file',
      description:
        'Use this when ChatGPT creates or receives an image file. Download the authorized top-level imageFile, store it durably at an opaque HTTPS URL, and create a native RemNote image child with readback verification. Do not insert a file name or URL as plain text.',
      inputSchema: INSERT_IMAGE_FROM_FILE_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: HOSTED_FILE_MEDIA_ANNOTATIONS,
      _meta: {
        'openai/fileParams': ['imageFile'],
      },
    },
    async ({ parentId, imageFile, position, label, width, height, idempotencyKey, verifyAfterWrite }) => {
      const operationId = `insert_image_from_file-${randomUUID()}`;
      const startedAt = Date.now();
      try {
        if (!storage) {
          throw Object.assign(new Error('Hosted media storage is unavailable.'), {
            code: 'HOSTED_MEDIA_STORAGE_UNAVAILABLE',
          });
        }
        if (!hostedMediaPolicy?.publicBaseUrl) {
          throw Object.assign(new Error('Hosted media public URL is unavailable.'), {
            code: 'HOSTED_MEDIA_PUBLIC_URL_INVALID',
          });
        }
        const ownerId = principal?.userId ?? principal?.subject;
        if (!ownerId) {
          throw Object.assign(new Error('Authenticated hosted media owner is unavailable.'), {
            code: 'HOSTED_IMAGE_AUTH_REQUIRED',
          });
        }
        const reusable = await findReusableHostedImageAsset({
          storage,
          ownerId,
          idempotencyKey,
          sourceFileId: imageFile.file_id,
          publicBaseUrl: hostedMediaPolicy.publicBaseUrl,
        });
        const hosted = reusable ?? await (async () => {
          const file = await hostedImageLoader(imageFile, {
            principal,
            policy: {
              maxBytes: hostedMediaPolicy.maxImageBytes,
              remoteTimeoutMs: hostedMediaPolicy.remoteTimeoutMs,
            },
            signal: requestSignal,
          });
          return persistHostedImageAsset({
            storage,
            ownerId,
            idempotencyKey,
            publicBaseUrl: hostedMediaPolicy.publicBaseUrl,
            file,
          });
        })();
        const response = await callPlugin('insert_image_from_url', {
          parentId,
          url: hosted.url,
          position,
          label,
          width,
          height,
          idempotencyKey,
          verifyAfterWrite,
        });
        if (!response.ok) {
          const hostedAssetCleanup = await cleanupNewHostedImageAfterFailure({
            storage,
            ownerId,
            assetId: hosted.asset.assetId,
            wasCreated: hosted.status === 'hosted',
            failure: response,
          });
          recordToolHistoryEvent({
            tool: 'insert_image_from_file',
            kind: 'failure',
            durationMs: Date.now() - startedAt,
            errorCode: response.error.code,
            source: 'bridge',
          });
          const originalDetails = typeof response.error.details === 'object'
            && response.error.details !== null
            && !Array.isArray(response.error.details)
            ? response.error.details as Record<string, unknown>
            : response.error.details === undefined
              ? {}
              : { originalDetails: response.error.details };
          return failureToToolResult({
            ...response,
            error: {
              ...response.error,
              details: {
                ...originalDetails,
                hostedAssetCleanup,
              },
            },
          }, 'insert_image_from_file');
        }
        const result = typeof response.result === 'object' && response.result !== null && !Array.isArray(response.result)
          ? response.result as Record<string, unknown>
          : { value: response.result };
        const hostedAssetCleanup = assessSuccessfulHostedImageRetention(result, hosted.url);
        recordToolHistoryEvent({
          tool: 'insert_image_from_file',
          kind: 'success',
          durationMs: Date.now() - startedAt,
          source: 'bridge',
        });
        return successToToolResult({
          ...response,
          result: {
            ...result,
            toolName: 'insert_image_from_file',
            hostedAsset: {
              assetId: hosted.asset.assetId,
              url: hosted.url,
              contentType: hosted.asset.contentType,
              fileName: hosted.asset.fileName,
              byteLength: hosted.asset.bytes.byteLength,
              storageDurability: storage.hostedMediaStorageDurability(),
              hostingStatus: hosted.status,
              ...hostedAssetCleanup,
            },
          },
        }, 'ChatGPT image file hosted and inserted as a native RemNote image.');
      } catch (error) {
        const errorCode = typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code: unknown }).code)
          : 'HOSTED_IMAGE_INTERNAL_ERROR';
        const safeErrorCode = errorCode !== 'HOSTED_IMAGE_INTERNAL_ERROR' && (
          errorCode.startsWith('HOSTED_IMAGE_')
          || errorCode.startsWith('HOSTED_MEDIA_')
        );
        const message = safeErrorCode && error instanceof Error
          ? error.message
          : 'Hosted image processing failed internally.';
        recordToolHistoryEvent({
          tool: 'insert_image_from_file',
          kind: 'failure',
          durationMs: Date.now() - startedAt,
          errorCode,
          source: 'bridge',
        });
        const failure: BridgeFailure = {
          id: operationId,
          ok: false,
          error: {
            code: safeErrorCode ? 'INVALID_ARGS' : 'INTERNAL_ERROR',
            message,
            details: {
              errorCode,
              layer: 'server_hosted_media',
            },
          },
        };
        return failureToToolResult(failure, 'insert_image_from_file');
      }
    }
  );

  registerTool(
    'insert_audio_from_file',
    {
      title: 'Host and insert ChatGPT audio file',
      description: 'Use this when ChatGPT receives an audio file. Host the authorized top-level audioFile durably, then create and verify a native RemNote audio child.',
      inputSchema: INSERT_AUDIO_FROM_FILE_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: HOSTED_FILE_MEDIA_ANNOTATIONS,
      _meta: { 'openai/fileParams': ['audioFile'] },
    },
    async ({ parentId, audioFile, position, label, idempotencyKey, verifyAfterWrite }) =>
      handleHostedMediaFile({
        toolName: 'insert_audio_from_file',
        mediaKind: 'audio',
        file: audioFile,
        parentId,
        position,
        label,
        idempotencyKey,
        verifyAfterWrite,
      })
  );

  registerTool(
    'insert_audio_from_url',
    {
      title: 'Insert audio from URL',
      description: 'Create a dedicated child Rem containing an audio player from a stable HTTP(S) URL without replacing existing content.',
      inputSchema: INSERT_AUDIO_FROM_URL_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('insert_audio_from_url'),
    },
    async ({ parentId, url, position, label, idempotencyKey, verifyAfterWrite }) =>
      bridgeToolResult(
        () => callPlugin('insert_audio_from_url', { parentId, url, position, label, idempotencyKey, verifyAfterWrite }),
        'Insert audio from URL request processed.'
      )
  );

  registerTool(
    'insert_video_from_file',
    {
      title: 'Host and insert ChatGPT video file',
      description: 'Use this when ChatGPT receives a video file. Host the authorized top-level videoFile durably, then create and verify a native RemNote video child.',
      inputSchema: INSERT_VIDEO_FROM_FILE_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: HOSTED_FILE_MEDIA_ANNOTATIONS,
      _meta: { 'openai/fileParams': ['videoFile'] },
    },
    async ({ parentId, videoFile, position, label, idempotencyKey, verifyAfterWrite }) =>
      handleHostedMediaFile({
        toolName: 'insert_video_from_file',
        mediaKind: 'video',
        file: videoFile,
        parentId,
        position,
        label,
        idempotencyKey,
        verifyAfterWrite,
      })
  );

  registerTool(
    'insert_video_from_url',
    {
      title: 'Insert video from URL',
      description: 'Use this when a stable video or YouTube HTTP(S) URL is available. Create a native RemNote video child and verify its media representation. Do not insert the URL as plain text.',
      inputSchema: INSERT_VIDEO_FROM_URL_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('insert_video_from_url'),
    },
    async ({ parentId, url, position, label, idempotencyKey, verifyAfterWrite }) =>
      bridgeToolResult(
        () => callPlugin('insert_video_from_url', { parentId, url, position, label, idempotencyKey, verifyAfterWrite }),
        'Insert video from URL request processed.'
      )
  );
}
