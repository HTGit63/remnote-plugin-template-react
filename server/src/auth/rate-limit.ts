import type { IncomingMessage, ServerResponse } from 'node:http';
import type { CompanionServerConfig } from '../config.js';
import { writeJson } from '../http.js';

interface Bucket {
  resetAt: number;
  count: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimitRequest(
  req: IncomingMessage,
  res: ServerResponse,
  config: CompanionServerConfig,
  bucketName: string
): boolean {
  const windowMs = Math.max(1000, config.rateLimitWindowMs);
  const maxRequests = Math.max(1, config.rateLimitMaxRequests);
  const now = Date.now();
  const key = `${bucketName}:${req.socket.remoteAddress ?? 'unknown'}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { resetAt: now + windowMs, count: 1 });
    return true;
  }

  bucket.count += 1;
  if (bucket.count <= maxRequests) {
    return true;
  }

  res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
  writeJson(res, 429, {
    error: 'rate_limited',
    error_description: 'Too many requests. Retry later.',
  });
  return false;
}
