import { describe, expect, test } from 'vitest';
import { runBridgeHealthCheck } from '../server/src/health-check';

const MEDIA_TOOLS = [
  'insert_image_from_url',
  'insert_audio_from_url',
  'insert_video_from_url',
] as const;

describe('bridge health media probe', () => {
  test('runs only requested media tools with stable keys and returns readback evidence', async () => {
    const calls: Array<{ tool: string; args: Record<string, unknown> }> = [];
    const seenKeys = new Set<string>();
    const hub = {
      getStatus: () => ({ connected: true, pendingRequests: 0 }),
      callPlugin: async (tool: string, args: Record<string, unknown>) => {
        calls.push({ tool, args });
        const idempotencyKey = String(args.idempotencyKey);
        const alreadyApplied = seenKeys.has(idempotencyKey);
        seenKeys.add(idempotencyKey);
        const mediaKind = tool.replace('insert_', '').replace('_from_url', '');
        return {
          id: `response-${calls.length}`,
          ok: true,
          result: {
            createdRemId: `${mediaKind}-rem`,
            parentId: args.parentId,
            mediaKind,
            url: args.url,
            position: 'end',
            insertIndex: calls.length - 1,
            status: alreadyApplied ? 'already_applied' : 'inserted',
            idempotencyKey,
            verification: {
              attempted: true,
              createdRemFound: true,
              mediaKindMatched: true,
              urlMatched: true,
            },
          },
        };
      },
      recordHealthCheck: () => undefined,
    };
    const options = {
      mode: 'safe_write' as const,
      includeWrites: true,
      parentId: 'media-proof-parent',
      useParentDirectly: true,
      toolNames: [...MEDIA_TOOLS],
      mediaFixtures: {
        imageUrl: 'https://example.com/image.jpg',
        audioUrl: 'https://example.com/audio.mp3',
        videoUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
      },
      mediaIdempotencyKeyPrefix: 'stage6-media-proof',
      toolProfile: 'developer' as const,
    };

    const first = await runBridgeHealthCheck(hub as never, options);
    const second = await runBridgeHealthCheck(hub as never, options);

    expect(first.results.map((result) => result.tool)).toEqual(MEDIA_TOOLS);
    expect(first.results.every((result) => result.status === 'passed')).toBe(true);
    expect(first.results.map((result) => result.evidence)).toEqual([
      expect.objectContaining({ mediaKind: 'image', status: 'inserted', url: options.mediaFixtures.imageUrl }),
      expect.objectContaining({ mediaKind: 'audio', status: 'inserted', url: options.mediaFixtures.audioUrl }),
      expect.objectContaining({ mediaKind: 'video', status: 'inserted', url: options.mediaFixtures.videoUrl }),
    ]);
    expect(second.results.map((result) => result.evidence)).toEqual([
      expect.objectContaining({ mediaKind: 'image', status: 'already_applied' }),
      expect.objectContaining({ mediaKind: 'audio', status: 'already_applied' }),
      expect.objectContaining({ mediaKind: 'video', status: 'already_applied' }),
    ]);
    expect(calls.map(({ tool }) => tool)).toEqual([...MEDIA_TOOLS, ...MEDIA_TOOLS]);
    expect(calls.map(({ args }) => args.idempotencyKey)).toEqual([
      'stage6-media-proof:image',
      'stage6-media-proof:audio',
      'stage6-media-proof:video',
      'stage6-media-proof:image',
      'stage6-media-proof:audio',
      'stage6-media-proof:video',
    ]);
  });
});
