import { basename } from 'node:path';
import type { AuthenticatedPrincipal } from '../auth/types.js';
import {
  downloadSafeRemoteBytes,
  SafeRemoteDownloadError,
} from '../security/safe-remote-download.js';

export type ChatGptImageFileReference = {
  download_url: string;
  file_id: string;
  mime_type?: string;
  file_name?: string;
};

export type HostedImageFile = {
  bytes: Buffer;
  contentType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
  fileName: string;
  fileId: string;
};

export type HostedImageFilePolicy = {
  maxBytes: number;
  remoteTimeoutMs: number;
};

export type HostedImageFileLoader = (
  reference: ChatGptImageFileReference,
  options: {
    principal?: AuthenticatedPrincipal;
    policy: HostedImageFilePolicy;
    signal?: AbortSignal;
  }
) => Promise<HostedImageFile>;

export class HostedImageFileError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(`${code}: ${message}`);
    this.name = 'HostedImageFileError';
  }
}

function imageError(code: string, message: string): never {
  throw new HostedImageFileError(code, message);
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function validateReference(value: ChatGptImageFileReference): Required<Pick<ChatGptImageFileReference, 'download_url' | 'file_id'>> & Pick<ChatGptImageFileReference, 'mime_type' | 'file_name'> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    imageError('HOSTED_IMAGE_INVALID_REFERENCE', 'imageFile must be a ChatGPT file object.');
  }
  const downloadUrl = nonEmptyString(value.download_url);
  const fileId = nonEmptyString(value.file_id);
  if (!downloadUrl || !fileId) {
    imageError(
      'HOSTED_IMAGE_INVALID_REFERENCE',
      'ChatGPT image files require download_url and file_id.'
    );
  }
  return {
    download_url: downloadUrl,
    file_id: fileId,
    mime_type: nonEmptyString(value.mime_type),
    file_name: nonEmptyString(value.file_name),
  };
}

function detectedContentType(bytes: Buffer): HostedImageFile['contentType'] | undefined {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp';
  }
  if (bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6))) {
    return 'image/gif';
  }
  return undefined;
}

function safeFileName(value: string | undefined, fileId: string, contentType: HostedImageFile['contentType']): string {
  const extension: Record<HostedImageFile['contentType'], string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };
  const raw = basename(value ?? '').replace(/[^a-zA-Z0-9._ -]/g, '_').trim().slice(0, 120);
  return raw || `${fileId.slice(0, 96)}${extension[contentType]}`;
}

export function createHostedImageFileLoader(
  dependencies: {
    downloadRemoteBytes?: (
      url: string,
      policy: HostedImageFilePolicy,
      signal?: AbortSignal
    ) => Promise<Buffer>;
  } = {}
): HostedImageFileLoader {
  const downloader = dependencies.downloadRemoteBytes ?? (
    (url, policy, signal) => downloadSafeRemoteBytes(url, {
      maxBytes: policy.maxBytes,
      timeoutMs: policy.remoteTimeoutMs,
      accept: 'image/png, image/jpeg, image/webp, image/gif, application/octet-stream;q=0.5',
      maxRedirects: 3,
    }, signal)
  );

  return async (rawReference, options) => {
    const principal = options.principal;
    if (!principal || principal.authMode !== 'hosted_oauth' || !principal.scopeGrants.includes('bridge:read')) {
      imageError(
        'HOSTED_IMAGE_AUTH_REQUIRED',
        'ChatGPT image file ingestion requires authenticated hosted OAuth access.'
      );
    }
    const reference = validateReference(rawReference);
    let bytes: Buffer;
    try {
      bytes = await downloader(reference.download_url, options.policy, options.signal);
    } catch (error) {
      if (error instanceof HostedImageFileError) throw error;
      if (error instanceof SafeRemoteDownloadError) {
        imageError(`HOSTED_IMAGE_${error.code}`, error.message);
      }
      throw error;
    }
    const contentType = detectedContentType(bytes);
    if (!contentType) {
      imageError(
        'HOSTED_IMAGE_UNSUPPORTED_FORMAT',
        'Downloaded bytes must be a PNG, JPEG, WebP, or GIF image.'
      );
    }
    return {
      bytes,
      contentType,
      fileName: safeFileName(reference.file_name, reference.file_id, contentType),
      fileId: reference.file_id,
    };
  };
}

export const loadHostedImageFile = createHostedImageFileLoader();
