import { createRequire } from 'node:module';
import { describe, expect, test } from 'vitest';

const require = createRequire(import.meta.url);

describe('RemNote localhost dev-server cache policy', () => {
  test('forces plugin assets to be revalidated instead of serving a stale iframe bundle', () => {
    const { staticResponseHeaders } = require('../scripts/dev-server-headers.cjs') as {
      staticResponseHeaders: (contentType: string) => Record<string, string>;
    };

    expect(staticResponseHeaders('text/javascript; charset=utf-8')).toMatchObject({
      'Cache-Control': 'no-store, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
      'Content-Type': 'text/javascript; charset=utf-8',
    });
  });
});
