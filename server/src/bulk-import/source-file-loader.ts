import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  lstatSync,
  openSync,
  readSync,
  realpathSync,
  statSync,
} from 'node:fs';
import { request as httpsRequest } from 'node:https';
import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';
import { basename, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AuthenticatedPrincipal } from '../auth/types.js';

export type BulkImportSourceFileArgs = {
  sourceFilePath?: unknown;
  filePath?: unknown;
  path?: unknown;
  sourceFileUri?: unknown;
  sourceFile?: unknown;
};

export type BulkImportSourceFilePolicy = {
  allowedRoots: readonly string[];
  maxBytes: number;
  remoteTimeoutMs: number;
};

export type BulkImportLoadedSourceFile = {
  sourceText: string;
  sourceName: string;
  byteLength: number;
  sourceReference:
    | {
        kind: 'local_file';
        path: string;
      }
    | {
        kind: 'chatgpt_file';
        fileId: string;
        fileName?: string;
        mimeType?: string;
      };
};

export type BulkImportSourceFileLoader = (
  args: BulkImportSourceFileArgs,
  options: {
    principal?: AuthenticatedPrincipal;
    policy: BulkImportSourceFilePolicy;
    signal?: AbortSignal;
  }
) => Promise<BulkImportLoadedSourceFile>;

type ChatGptFileReference = {
  downloadUrl: string;
  fileId: string;
  fileName?: string;
  mimeType?: string;
};

type ParsedSourceReference =
  | { kind: 'local_file'; value: string }
  | { kind: 'chatgpt_file'; value: ChatGptFileReference };

export class BulkImportSourceFileError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'BulkImportSourceFileError';
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
  ['::1', 128],
  ['2001:db8::', 32],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  blockedNetworks.addSubnet(network, prefix, 'ipv6');
}

function sourceError(code: string, message: string): never {
  throw new BulkImportSourceFileError(code, `${code}: ${message}`);
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function parseObjectReference(value: Record<string, unknown>): ParsedSourceReference {
  const downloadUrl = nonEmptyString(value.download_url);
  const fileId = nonEmptyString(value.file_id);
  const localValues = ['path', 'filePath', 'sourceFilePath', 'uri', 'url', 'href']
    .map((key) => nonEmptyString(value[key]))
    .filter((candidate): candidate is string => Boolean(candidate));

  if (downloadUrl || fileId) {
    if (!downloadUrl || !fileId || localValues.length > 0) {
      sourceError(
        'SOURCE_FILE_INVALID_REFERENCE',
        'ChatGPT file references require download_url and file_id and cannot include local path aliases.'
      );
    }
    return {
      kind: 'chatgpt_file',
      value: {
        downloadUrl,
        fileId,
        fileName: nonEmptyString(value.file_name) ?? nonEmptyString(value.name),
        mimeType: nonEmptyString(value.mime_type),
      },
    };
  }

  const uniqueLocalValues = [...new Set(localValues)];
  if (uniqueLocalValues.length !== 1) {
    sourceError(
      uniqueLocalValues.length > 1 ? 'SOURCE_FILE_REFERENCE_CONFLICT' : 'SOURCE_FILE_INVALID_REFERENCE',
      uniqueLocalValues.length > 1
        ? 'Provide one unambiguous local path in the file object.'
        : 'File object must contain a local path alias or an official ChatGPT file reference.'
    );
  }
  return { kind: 'local_file', value: uniqueLocalValues[0] };
}

export function parseBulkImportSourceReference(args: BulkImportSourceFileArgs): ParsedSourceReference {
  const references: ParsedSourceReference[] = [];
  for (const candidate of [args.sourceFilePath, args.filePath, args.path, args.sourceFileUri, args.sourceFile]) {
    const stringValue = nonEmptyString(candidate);
    if (stringValue) {
      references.push({ kind: 'local_file', value: stringValue });
      continue;
    }
    if (typeof candidate === 'object' && candidate !== null && !Array.isArray(candidate)) {
      references.push(parseObjectReference(candidate as Record<string, unknown>));
    }
  }

  if (references.length === 0) {
    sourceError(
      'SOURCE_FILE_REFERENCE_REQUIRED',
      'Provide sourceFilePath, filePath, path, sourceFileUri, or sourceFile.'
    );
  }
  if (references.length > 1) {
    sourceError('SOURCE_FILE_REFERENCE_CONFLICT', 'Provide exactly one source-file argument alias.');
  }
  return references[0];
}

function decodePath(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    sourceError('SOURCE_FILE_INVALID_URI', 'Source path contains invalid percent encoding.');
  }
}

export function resolveBulkImportLocalPath(sourceFilePath: string): string {
  const trimmed = sourceFilePath.trim();
  if (!trimmed || trimmed.includes('\0')) {
    sourceError('SOURCE_FILE_INVALID_URI', 'Source path is empty or contains a NUL byte.');
  }

  if (trimmed.startsWith('file://')) {
    try {
      return resolve(fileURLToPath(new URL(trimmed)));
    } catch {
      sourceError('SOURCE_FILE_INVALID_URI', 'sourceFileUri must be a valid local file:// URI.');
    }
  }

  const sandboxMatch = trimmed.match(/^sandbox:(?:\/\/)?(.+)$/);
  if (sandboxMatch) {
    const pathPart = decodePath(sandboxMatch[1]);
    return resolve(pathPart.startsWith('/') ? pathPart : resolve('/mnt/data', pathPart));
  }

  const mountedFileMatch = trimmed.match(/^(?:connector|chatgpt|openai-file|mnt-data):(?:\/\/)?(.+)$/);
  if (mountedFileMatch) {
    const pathPart = decodePath(mountedFileMatch[1]);
    return resolve(pathPart.startsWith('/') ? pathPart : resolve('/mnt/data', pathPart.replace(/^mnt\/data\//, '')));
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    sourceError(
      'SOURCE_FILE_UNSUPPORTED_URI',
      'Only local paths, file://, sandbox:, connector:, chatgpt:, openai-file:, and mnt-data: aliases are accepted here.'
    );
  }

  return resolve(decodePath(trimmed.replace(/^\/?mnt\/data\//, '/mnt/data/')));
}

function pathIsInsideRoot(pathname: string, root: string): boolean {
  const relativePath = relative(root, pathname);
  return relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath));
}

function canonicalAllowedRoots(roots: readonly string[]): Array<{ configuredPath: string; realPath: string }> {
  return [...new Set(roots)]
    .filter((root) => isAbsolute(root) && existsSync(root))
    .filter((root) => statSync(root).isDirectory())
    .map((root) => ({
      configuredPath: resolve(root),
      realPath: realpathSync.native(root),
    }));
}

function decodeUtf8(buffer: Buffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    sourceError('SOURCE_FILE_INVALID_UTF8', 'Source file must contain valid UTF-8 text.');
  }
}

function readBoundedFile(pathname: string, maxBytes: number): Buffer {
  const fileDescriptor = openSync(pathname, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stats = fstatSync(fileDescriptor);
    if (!stats.isFile()) {
      sourceError('SOURCE_FILE_NOT_REGULAR', 'Source path must resolve to a regular file.');
    }
    if (stats.size > maxBytes) {
      sourceError('SOURCE_FILE_TOO_LARGE', `Source file exceeds ${maxBytes} bytes.`);
    }

    const chunks: Buffer[] = [];
    let total = 0;
    while (total <= maxBytes) {
      const chunk = Buffer.allocUnsafe(Math.min(64 * 1024, maxBytes + 1 - total));
      const bytesRead = readSync(fileDescriptor, chunk, 0, chunk.length, null);
      if (bytesRead === 0) {
        break;
      }
      total += bytesRead;
      if (total > maxBytes) {
        sourceError('SOURCE_FILE_TOO_LARGE', `Source file exceeds ${maxBytes} bytes.`);
      }
      chunks.push(chunk.subarray(0, bytesRead));
    }
    return Buffer.concat(chunks, total);
  } finally {
    closeSync(fileDescriptor);
  }
}

function readLocalSourceFile(
  sourceFilePath: string,
  policy: BulkImportSourceFilePolicy
): BulkImportLoadedSourceFile {
  const resolvedPath = resolveBulkImportLocalPath(sourceFilePath);
  const allowedRoots = canonicalAllowedRoots(policy.allowedRoots);
  if (allowedRoots.length === 0) {
    sourceError(
      'SOURCE_FILE_ALLOWED_ROOTS_UNAVAILABLE',
      'No configured source-file root exists. Configure REMNOTE_MCP_SOURCE_FILE_ALLOW_ROOTS.'
    );
  }
  if (!allowedRoots.some((root) => pathIsInsideRoot(resolvedPath, root.configuredPath))) {
    sourceError(
      'SOURCE_FILE_OUTSIDE_ALLOWED_ROOTS',
      'Source file resolves outside configured allowed roots.'
    );
  }
  if (!existsSync(resolvedPath)) {
    sourceError('SOURCE_FILE_NOT_FOUND', 'Source file does not exist under an allowed root.');
  }

  const realPath = realpathSync.native(resolvedPath);
  if (!allowedRoots.some((root) => pathIsInsideRoot(realPath, root.realPath))) {
    sourceError(
      'SOURCE_FILE_OUTSIDE_ALLOWED_ROOTS',
      'Source file resolves outside configured allowed roots.'
    );
  }
  if (lstatSync(resolvedPath).isSymbolicLink()) {
    sourceError('SOURCE_FILE_SYMLINK_NOT_ALLOWED', 'Symbolic-link source files are not accepted.');
  }

  const bytes = readBoundedFile(realPath, policy.maxBytes);
  return {
    sourceText: decodeUtf8(bytes),
    sourceName: basename(realPath),
    byteLength: bytes.byteLength,
    sourceReference: { kind: 'local_file', path: realPath },
  };
}

export function isPublicSourceAddress(address: string, family: 4 | 6): boolean {
  if (isIP(address) !== family) {
    return false;
  }
  if (family === 6 && address.toLowerCase().startsWith('::ffff:')) {
    return false;
  }
  return !blockedNetworks.check(address, family === 4 ? 'ipv4' : 'ipv6');
}

async function resolvePublicSourceAddress(hostname: string): Promise<{ address: string; family: 4 | 6 }> {
  let addresses: Array<{ address: string; family: 4 | 6 }>;
  try {
    const resolvedAddresses = await lookup(hostname, { all: true, verbatim: true });
    if (resolvedAddresses.some((entry) => entry.family !== 4 && entry.family !== 6)) {
      sourceError('SOURCE_FILE_REMOTE_DNS_FAILED', 'ChatGPT file download host returned an unsupported address family.');
    }
    addresses = resolvedAddresses.map((entry) => ({
      address: entry.address,
      family: entry.family === 6 ? 6 : 4,
    }));
  } catch {
    sourceError('SOURCE_FILE_REMOTE_DNS_FAILED', 'ChatGPT file download host could not be resolved.');
  }
  if (addresses.length === 0 || addresses.some((entry) => !isPublicSourceAddress(entry.address, entry.family))) {
    sourceError('SOURCE_FILE_REMOTE_HOST_BLOCKED', 'ChatGPT file download host resolves to a non-public address.');
  }
  return addresses[0];
}

export function createPinnedSourceLookup(pinnedAddress: { address: string; family: 4 | 6 }) {
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

function validatedRemoteUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    sourceError('SOURCE_FILE_INVALID_URI', 'ChatGPT download_url must be an absolute HTTPS URL.');
  }
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) {
    sourceError(
      'SOURCE_FILE_REMOTE_HOST_BLOCKED',
      'ChatGPT download_url must use HTTPS, default port 443, and no embedded credentials.'
    );
  }
  return url;
}

async function downloadRemoteBytes(
  value: string,
  policy: BulkImportSourceFilePolicy,
  signal: AbortSignal | undefined,
  redirectsRemaining = 3
): Promise<Buffer> {
  const url = validatedRemoteUrl(value);
  const hostname = url.hostname.replace(/^\[(.*)\]$/, '$1');
  const pinnedAddress = await resolvePublicSourceAddress(hostname);

  return await new Promise<Buffer>((resolvePromise, rejectPromise) => {
    const request = httpsRequest(
      url,
      {
        method: 'GET',
        headers: {
          accept: 'text/markdown, text/plain, application/octet-stream;q=0.8',
          'accept-encoding': 'identity',
        },
        lookup: createPinnedSourceLookup(pinnedAddress) as any,
        servername: isIP(hostname) ? undefined : hostname,
        signal,
      },
      (response) => {
        const statusCode = response.statusCode ?? 0;
        if ([301, 302, 303, 307, 308].includes(statusCode)) {
          const location = response.headers.location;
          response.resume();
          if (!location || redirectsRemaining <= 0) {
            rejectPromise(new BulkImportSourceFileError(
              'SOURCE_FILE_REMOTE_REDIRECT_BLOCKED',
              'SOURCE_FILE_REMOTE_REDIRECT_BLOCKED: ChatGPT file download exceeded safe redirect limits.'
            ));
            return;
          }
          resolvePromise(downloadRemoteBytes(new URL(location, url).toString(), policy, signal, redirectsRemaining - 1));
          return;
        }
        if (statusCode !== 200) {
          response.resume();
          rejectPromise(new BulkImportSourceFileError(
            'SOURCE_FILE_REMOTE_DOWNLOAD_FAILED',
            `SOURCE_FILE_REMOTE_DOWNLOAD_FAILED: ChatGPT file download returned HTTP ${statusCode}.`
          ));
          return;
        }

        const contentLength = Number(response.headers['content-length']);
        if (Number.isFinite(contentLength) && contentLength > policy.maxBytes) {
          response.destroy();
          rejectPromise(new BulkImportSourceFileError(
            'SOURCE_FILE_TOO_LARGE',
            `SOURCE_FILE_TOO_LARGE: Source file exceeds ${policy.maxBytes} bytes.`
          ));
          return;
        }

        const chunks: Buffer[] = [];
        let total = 0;
        response.on('data', (chunk: Buffer) => {
          total += chunk.length;
          if (total > policy.maxBytes) {
            response.destroy(new BulkImportSourceFileError(
              'SOURCE_FILE_TOO_LARGE',
              `SOURCE_FILE_TOO_LARGE: Source file exceeds ${policy.maxBytes} bytes.`
            ));
            return;
          }
          chunks.push(chunk);
        });
        response.on('end', () => resolvePromise(Buffer.concat(chunks, total)));
        response.on('error', rejectPromise);
      }
    );
    request.setTimeout(policy.remoteTimeoutMs, () => {
      request.destroy(new BulkImportSourceFileError(
        'SOURCE_FILE_REMOTE_TIMEOUT',
        `SOURCE_FILE_REMOTE_TIMEOUT: ChatGPT file download exceeded ${policy.remoteTimeoutMs}ms.`
      ));
    });
    request.on('error', rejectPromise);
    request.end();
  });
}

async function readChatGptSourceFile(
  reference: ChatGptFileReference,
  policy: BulkImportSourceFilePolicy,
  signal: AbortSignal | undefined,
  remoteDownloader: typeof downloadRemoteBytes
): Promise<BulkImportLoadedSourceFile> {
  const bytes = await remoteDownloader(reference.downloadUrl, policy, signal);
  return {
    sourceText: decodeUtf8(bytes),
    sourceName: reference.fileName ?? reference.fileId,
    byteLength: bytes.byteLength,
    sourceReference: {
      kind: 'chatgpt_file',
      fileId: reference.fileId,
      fileName: reference.fileName,
      mimeType: reference.mimeType,
    },
  };
}

export function createBulkImportSourceFileLoader(
  dependencies: {
    downloadRemoteBytes?: typeof downloadRemoteBytes;
  } = {}
): BulkImportSourceFileLoader {
  const remoteDownloader = dependencies.downloadRemoteBytes ?? downloadRemoteBytes;
  return async (args, options) => {
    const reference = parseBulkImportSourceReference(args);
    const principal = options.principal;
    if (!principal || principal.authMode === 'local_no_token' || principal.authMode === 'connector_compat_noauth') {
      sourceError(
        'SOURCE_FILE_AUTH_REQUIRED',
        'File-backed imports require authenticated local bridge or hosted OAuth access.'
      );
    }
    if (!principal.scopeGrants.includes('bridge:read')) {
      sourceError(
        'SOURCE_FILE_READ_SCOPE_REQUIRED',
        'File-backed imports require the bridge:read scope.'
      );
    }

    if (reference.kind === 'local_file') {
      if (principal.authMode !== 'local_bridge_token') {
        sourceError(
          'SOURCE_FILE_LOCAL_AUTH_REQUIRED',
          'Local paths are accepted only for authenticated local bridge calls.'
        );
      }
      return readLocalSourceFile(reference.value, options.policy);
    }

    if (principal.authMode !== 'hosted_oauth') {
      sourceError(
        'SOURCE_FILE_CHATGPT_AUTH_REQUIRED',
        'Plugin file references are accepted only on authenticated hosted OAuth calls.'
      );
    }
    return await readChatGptSourceFile(reference.value, options.policy, options.signal, remoteDownloader);
  };
}

export const loadBulkImportSourceFile = createBulkImportSourceFileLoader();
