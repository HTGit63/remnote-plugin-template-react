import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { CompanionServerConfig } from './config.js';

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);
const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'cache-control': 'no-store',
};

export function isLoopbackHost(hostHeader: string | undefined): boolean {
  if (!hostHeader) {
    return true;
  }

  const normalized = hostHeader.trim().toLowerCase();
  const host = normalized.startsWith('[')
    ? normalized.slice(0, normalized.indexOf(']') + 1)
    : normalized.split(':')[0];
  return LOCAL_HOSTS.has(host);
}

export function validateRequestHost(req: IncomingMessage, config: CompanionServerConfig): boolean {
  return config.allowRemote || isLoopbackHost(req.headers.host);
}

export function hasValidBearerToken(req: IncomingMessage, token: string): boolean {
  if (!token) {
    return true;
  }

  const authorization = req.headers.authorization;
  if (safeTokenEquals(authorization, `Bearer ${token}`)) {
    return true;
  }

  return safeTokenEquals(req.headers['x-remnote-bridge-token'], token);
}

function safeTokenEquals(actual: string | string[] | undefined, expected: string): boolean {
  if (typeof actual !== 'string') {
    return false;
  }

  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function writeJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.writeHead(statusCode, {
    ...SECURITY_HEADERS,
    'content-type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(body));
}

export function writeText(res: ServerResponse, statusCode: number, text: string) {
  res.writeHead(statusCode, {
    ...SECURITY_HEADERS,
    'content-type': 'text/plain; charset=utf-8',
  });
  res.end(text);
}

export function setSecurityHeaders(res: ServerResponse) {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(name, value);
  }
}

export function applyCors(req: IncomingMessage, res: ServerResponse, config: CompanionServerConfig): boolean {
  if (!config.allowCors) {
    return false;
  }

  const origin = req.headers.origin;
  if (!origin || !config.allowedOrigins.includes(origin)) {
    return false;
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'content-type, mcp-session-id, authorization, x-remnote-bridge-token'
  );
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
  return true;
}

export function readJsonBody(req: IncomingMessage, maxBodyBytes: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;

    req.on('data', (chunk: Buffer) => {
      total += chunk.length;
      if (total > maxBodyBytes) {
        reject(new Error('Request body too large.'));
        req.destroy();
        return;
      }

      chunks.push(chunk);
    });

    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) {
        resolve(undefined);
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}
