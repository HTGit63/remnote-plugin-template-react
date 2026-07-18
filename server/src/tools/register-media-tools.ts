import { BRIDGE_TOOL_OUTPUT_SCHEMA, INSERT_AUDIO_FROM_URL_INPUT_SCHEMA, INSERT_IMAGE_FROM_URL_INPUT_SCHEMA, INSERT_VIDEO_FROM_URL_INPUT_SCHEMA } from './schemas.js';
import { annotationsFor, bridgeToolResult, type ToolRegistrationContext } from './tool-context.js';

export function registerMediaTools({ registerTool, callPlugin }: ToolRegistrationContext): void {
  registerTool(
    'insert_image_from_url',
    {
      title: 'Insert image from URL',
      description: 'Create a dedicated child Rem containing an image from a stable HTTP(S) URL without replacing existing content.',
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
    'insert_video_from_url',
    {
      title: 'Insert video from URL',
      description: 'Create a dedicated child Rem containing a video or YouTube embed from a stable HTTP(S) URL without replacing existing content.',
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
