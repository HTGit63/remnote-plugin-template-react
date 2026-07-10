import { Readable } from 'node:stream';
import { describe, expect, test } from 'vitest';
import { readJsonBody } from '../server/src/http';

describe('HTTP body limits', () => {
  test('rejects an oversized JSON body with the stable safe error', async () => {
    const request = Readable.from([JSON.stringify({ sourceText: 'x'.repeat(256) })]);

    await expect(readJsonBody(request as any, 64)).rejects.toThrow('Request body too large.');
  });
});
