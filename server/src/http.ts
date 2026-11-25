import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { CompanionServerConfig } from './config.js';

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);
const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'cache-control': 'no-store',
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  'cross-origin-resource-policy': 'same-origin',
};

const HOSTED_PLUGIN_SANDBOX_METHODS = new Map<string, readonly string[]>([
  ['/health', ['GET']],
  ['/pairing/status', ['GET']],
  ['/pairing/approve', ['POST']],
  ['/pairing/deny', ['POST']],
  ['/pairing/disconnect', ['POST']],
  ['/api/plugin/tool-tier', ['GET', 'POST']],
  ['/api/plugin/diagnostics', ['POST']],
  ['/api/plugin/health-check', ['POST']],
]);

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
  return config.deploymentMode === 'hosted' || config.allowRemote || isLoopbackHost(req.headers.host);
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

export function safeTokenEquals(actual: string | string[] | undefined, expected: string): boolean {
  if (typeof actual !== 'string') {
    return false;
  }

  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function hasValidHeaderSecret(
  req: IncomingMessage,
  headerName: string,
  expected: string
): boolean {
  return Boolean(expected) && safeTokenEquals(req.headers[headerName], expected);
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
  if (!origin || origin === 'null' || !config.allowedOrigins.includes(origin)) {
    return false;
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'content-type, mcp-session-id, authorization, x-remnote-bridge-token, x-remnote-plugin-session-secret'
  );
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
  return true;
}

export function applyHostedPluginSandboxCors(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  config: CompanionServerConfig
): boolean {
  if (
    req.headers.origin !== 'null' || !config.allowCors ||
    config.deploymentMode !== 'hosted' || !config.hostedPairingEnabled ||
    req.headers.cookie !== undefined || req.headers.authorization !== undefined
  ) {
    return false;
  }

  // Opaque origins do not identify a plugin. Limit them to the plugin's
  // credential-based routes and the public health check.
  const methods = HOSTED_PLUGIN_SANDBOX_METHODS.get(url.pathname);
  const method = req.method === 'OPTIONS' ? req.headers['access-control-request-method'] : req.method;
  if (!methods || typeof method !== 'string' || !methods.includes(method)) return false;
  const contentType = req.headers['content-type']?.split(';', 1)[0].trim().toLowerCase();
  if (req.method === 'POST' && contentType !== 'application/json') return false;
  if (url.pathname === '/pairing/status' && (url.searchParams.size !== 1 || !url.searchParams.has('pairing_code'))) {
    return false;
  }

  res.setHeader('Access-Control-Allow-Origin', 'null');
  res.setHeader('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-remnote-plugin-session-secret');
  return true;
}

export function readJsonBody(req: IncomingMessage, maxBodyBytes: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    let rejected = false;

    req.on('data', (chunk: Buffer) => {
      if (rejected) {
        return;
      }
      total += chunk.length;
      if (total > maxBodyBytes) {
        rejected = true;
        chunks.length = 0;
        reject(new Error('Request body too large.'));
        return;
      }

      chunks.push(chunk);
    });

    req.on('end', () => {
      if (rejected) {
        return;
      }
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
