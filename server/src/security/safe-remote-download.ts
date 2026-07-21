import { lookup } from 'node:dns/promises';
import { request as httpsRequest } from 'node:https';
import { BlockList, isIP } from 'node:net';

export type SafeRemoteDownloadPolicy = {
  maxBytes: number;
  timeoutMs: number;
  accept: string;
  maxRedirects?: number;
};

export class SafeRemoteDownloadError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'SafeRemoteDownloadError';
  }
}

const blockedNetworks = new BlockList();
for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  blockedNetworks.addSubnet(network, prefix, 'ipv4');
}
for (const [network, prefix] of [
  ['::', 128],
  ['::', 96],
  ['::1', 128],
  ['64:ff9b::', 96],
  ['64:ff9b:1::', 48],
  ['100::', 64],
  ['2001::', 32],
  ['2001:db8::', 32],
  ['2002::', 16],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  blockedNetworks.addSubnet(network, prefix, 'ipv6');
}
const mappedIpv6Networks = new BlockList();
mappedIpv6Networks.addSubnet('::ffff:0:0', 96, 'ipv6');

export function isPublicRemoteAddress(address: string, family: 4 | 6): boolean {
  if (isIP(address) !== family) return false;
  // Keep this subnet in a separate list: Node applies it to IPv4 checks when it
  // shares a BlockList with IPv4 ranges, which would block every public IPv4.
  if (family === 6 && mappedIpv6Networks.check(address, 'ipv6')) return false;
  return !blockedNetworks.check(address, family === 4 ? 'ipv4' : 'ipv6');
}

export function createPinnedRemoteLookup(pinnedAddress: { address: string; family: 4 | 6 }) {
  return (
    _hostname: string,
    options: { all?: boolean } | number | undefined,
    callback: (...args: any[]) => void
  ): void => {
    if (typeof options === 'object' && options?.all) {
      callback(null, [{ address: pinnedAddress.address, family: pinnedAddress.family }]);
      return;
    }
    callback(null, pinnedAddress.address, pinnedAddress.family);
  };
}

function remoteError(code: string, message: string): never {
  throw new SafeRemoteDownloadError(code, `${code}: ${message}`);
}

function validatedUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    remoteError('REMOTE_INVALID_URL', 'Remote download URL must be an absolute HTTPS URL.');
  }
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) {
    remoteError(
      'REMOTE_HOST_BLOCKED',
      'Remote download URL must use HTTPS, default port 443, and no embedded credentials.'
    );
  }
  return url;
}

async function resolvePublicAddress(hostname: string): Promise<{ address: string; family: 4 | 6 }> {
  let addresses: Array<{ address: string; family: 4 | 6 }>;
  try {
    const resolved = await lookup(hostname, { all: true, verbatim: true });
    if (resolved.some((entry) => entry.family !== 4 && entry.family !== 6)) {
      remoteError('REMOTE_DNS_FAILED', 'Remote host returned an unsupported address family.');
    }
    addresses = resolved.map((entry) => ({
      address: entry.address,
      family: entry.family === 6 ? 6 : 4,
    }));
  } catch (error) {
    if (error instanceof SafeRemoteDownloadError) throw error;
    remoteError('REMOTE_DNS_FAILED', 'Remote download host could not be resolved.');
  }
  const publicAddresses = addresses.filter((entry) => (
    isPublicRemoteAddress(entry.address, entry.family)
  ));
  if (publicAddresses.length === 0) {
    remoteError('REMOTE_HOST_BLOCKED', 'Remote download host resolves to a non-public address.');
  }
  return publicAddresses[0];
}

export async function downloadSafeRemoteBytes(
  value: string,
  policy: SafeRemoteDownloadPolicy,
  signal?: AbortSignal,
  redirectsRemaining = policy.maxRedirects ?? 3
): Promise<Buffer> {
  const url = validatedUrl(value);
  const hostname = url.hostname.replace(/^\[(.*)\]$/, '$1');
  const pinnedAddress = await resolvePublicAddress(hostname);

  return await new Promise<Buffer>((resolvePromise, rejectPromise) => {
    const request = httpsRequest(
      url,
      {
        method: 'GET',
        headers: {
          accept: policy.accept,
          'accept-encoding': 'identity',
        },
        lookup: createPinnedRemoteLookup(pinnedAddress) as any,
        servername: isIP(hostname) ? undefined : hostname,
        signal,
      },
      (response) => {
        const statusCode = response.statusCode ?? 0;
        if ([301, 302, 303, 307, 308].includes(statusCode)) {
          const location = response.headers.location;
          response.resume();
          if (!location || redirectsRemaining <= 0) {
            rejectPromise(new SafeRemoteDownloadError(
              'REMOTE_REDIRECT_BLOCKED',
              'REMOTE_REDIRECT_BLOCKED: Remote download exceeded safe redirect limits.'
            ));
            return;
          }
          resolvePromise(downloadSafeRemoteBytes(
            new URL(location, url).toString(),
            policy,
            signal,
            redirectsRemaining - 1
          ));
          return;
        }
        if (statusCode !== 200) {
          response.resume();
          rejectPromise(new SafeRemoteDownloadError(
            'REMOTE_DOWNLOAD_FAILED',
            `REMOTE_DOWNLOAD_FAILED: Remote download returned HTTP ${statusCode}.`
          ));
          return;
        }

        const contentLength = Number(response.headers['content-length']);
        if (Number.isFinite(contentLength) && contentLength > policy.maxBytes) {
          response.destroy();
          rejectPromise(new SafeRemoteDownloadError(
            'REMOTE_TOO_LARGE',
            `REMOTE_TOO_LARGE: Remote file exceeds ${policy.maxBytes} bytes.`
          ));
          return;
        }

        const chunks: Buffer[] = [];
        let total = 0;
        response.on('data', (chunk: Buffer) => {
          total += chunk.length;
          if (total > policy.maxBytes) {
            response.destroy(new SafeRemoteDownloadError(
              'REMOTE_TOO_LARGE',
              `REMOTE_TOO_LARGE: Remote file exceeds ${policy.maxBytes} bytes.`
            ));
            return;
          }
          chunks.push(chunk);
        });
        response.on('end', () => resolvePromise(Buffer.concat(chunks, total)));
        response.on('error', rejectPromise);
      }
    );
    request.setTimeout(policy.timeoutMs, () => {
      request.destroy(new SafeRemoteDownloadError(
        'REMOTE_TIMEOUT',
        `REMOTE_TIMEOUT: Remote download exceeded ${policy.timeoutMs}ms.`
      ));
    });
    request.on('error', rejectPromise);
    request.end();
  });
}
