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

export type HostedMediaKind = 'image' | 'audio' | 'video';
export type ChatGptMediaFileReference = ChatGptImageFileReference;
export type HostedMediaContentType =
  | HostedImageFile['contentType']
  | 'audio/mpeg'
  | 'video/mp4';

export type HostedMediaFile = {
  mediaKind: HostedMediaKind;
  bytes: Buffer;
  contentType: HostedMediaContentType;
  fileName: string;
  fileId: string;
};

export type HostedImageFile = {
  bytes: Buffer;
  contentType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
  fileName: string;
  fileId: string;
};

export type HostedMediaFilePolicy = {
  maxBytes: number;
  remoteTimeoutMs: number;
};
export type HostedImageFilePolicy = HostedMediaFilePolicy;

export type HostedImageFileLoader = (
  reference: ChatGptImageFileReference,
  options: {
    principal?: AuthenticatedPrincipal;
    policy: HostedMediaFilePolicy;
    signal?: AbortSignal;
  }
) => Promise<HostedImageFile>;

export type HostedMediaFileLoader = (
  mediaKind: HostedMediaKind,
  reference: ChatGptMediaFileReference,
  options: {
    principal?: AuthenticatedPrincipal;
    policy: HostedMediaFilePolicy;
    signal?: AbortSignal;
  }
) => Promise<HostedMediaFile>;

export class HostedImageFileError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(`${code}: ${message}`);
    this.name = 'HostedImageFileError';
  }
}

export class HostedMediaFileError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(`${code}: ${message}`);
    this.name = 'HostedMediaFileError';
  }
}

function imageError(code: string, message: string): never {
  throw new HostedImageFileError(code, message);
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function validateReference(
  value: ChatGptMediaFileReference,
  errorFamily: 'image' | 'media' = 'image'
): Required<Pick<ChatGptMediaFileReference, 'download_url' | 'file_id'>> & Pick<ChatGptMediaFileReference, 'mime_type' | 'file_name'> {
  const invalid = (message: string): never => {
    if (errorFamily === 'media') {
      throw new HostedMediaFileError('HOSTED_MEDIA_INVALID_REFERENCE', message);
    }
    imageError('HOSTED_IMAGE_INVALID_REFERENCE', message);
  };
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    invalid(`${errorFamily === 'image' ? 'imageFile' : 'media file'} must be a ChatGPT file object.`);
  }
  const downloadUrl = nonEmptyString(value.download_url);
  const fileId = nonEmptyString(value.file_id);
  if (!downloadUrl || !fileId) {
    return invalid(`ChatGPT ${errorFamily === 'image' ? 'image' : 'media'} files require download_url and file_id.`);
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

function hasMpegLayer3FrameHeader(bytes: Buffer, offset: number): boolean {
  if (offset < 0 || offset + 4 > bytes.length || bytes[offset] !== 0xff || (bytes[offset + 1] & 0xe0) !== 0xe0) {
    return false;
  }
  const version = (bytes[offset + 1] >> 3) & 0x03;
  const layer = (bytes[offset + 1] >> 1) & 0x03;
  const bitrate = (bytes[offset + 2] >> 4) & 0x0f;
  const sampleRate = (bytes[offset + 2] >> 2) & 0x03;
  return version !== 0x01 && layer === 0x01 && bitrate !== 0 && bitrate !== 0x0f && sampleRate !== 0x03;
}

function detectedMp3ContentType(bytes: Buffer): 'audio/mpeg' | undefined {
  let frameSearchStart = 0;
  if (bytes.length >= 10 && bytes.toString('ascii', 0, 3) === 'ID3') {
    if (bytes[3] === 0xff || !bytes.subarray(6, 10).every((value) => value < 0x80)) {
      return undefined;
    }
    const tagSize = (bytes[6] << 21) | (bytes[7] << 14) | (bytes[8] << 7) | bytes[9];
    frameSearchStart = 10 + tagSize + ((bytes[5] & 0x10) === 0x10 ? 10 : 0);
  }
  const frameSearchEnd = Math.min(bytes.length - 3, frameSearchStart + 4096);
  for (let offset = frameSearchStart; offset < frameSearchEnd; offset += 1) {
    if (hasMpegLayer3FrameHeader(bytes, offset)) return 'audio/mpeg';
  }
  return undefined;
}

function detectedMp4ContentType(bytes: Buffer): 'video/mp4' | undefined {
  if (bytes.length < 16 || bytes.toString('ascii', 4, 8) !== 'ftyp') {
    return undefined;
  }
  const boxSize = bytes.readUInt32BE(0);
  const headerSize = boxSize === 1 ? 16 : 8;
  const declaredSize = boxSize === 1
    ? Number(bytes.readBigUInt64BE(8))
    : boxSize;
  if (
    !Number.isSafeInteger(declaredSize)
    || declaredSize < headerSize + 8
    || declaredSize > bytes.length
  ) {
    return undefined;
  }
  const acceptedBrands = new Set([
    'isom', 'iso2', 'iso3', 'iso4', 'iso5', 'iso6',
    'avc1', 'dash', 'mp41', 'mp42', 'M4V ', 'MSNV',
  ]);
  for (let offset = headerSize; offset + 4 <= declaredSize; offset += 4) {
    if (offset === headerSize + 4) continue; // minor_version is not a brand.
    if (acceptedBrands.has(bytes.toString('ascii', offset, offset + 4))) {
      return 'video/mp4';
    }
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
      policy: HostedMediaFilePolicy,
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

export function createHostedMediaFileLoader(
  dependencies: {
    downloadRemoteBytes?: (
      url: string,
      policy: HostedMediaFilePolicy,
      signal?: AbortSignal
    ) => Promise<Buffer>;
  } = {}
): HostedMediaFileLoader {
  const downloader = dependencies.downloadRemoteBytes ?? (
    (url, policy, signal) => downloadSafeRemoteBytes(url, {
      maxBytes: policy.maxBytes,
      timeoutMs: policy.remoteTimeoutMs,
      accept: 'image/png, image/jpeg, image/webp, image/gif, audio/mpeg, video/mp4, application/octet-stream;q=0.5',
      maxRedirects: 3,
    }, signal)
  );

  return async (mediaKind, rawReference, options) => {
    const principal = options.principal;
    if (!principal || principal.authMode !== 'hosted_oauth' || !principal.scopeGrants.includes('bridge:read')) {
      throw new HostedMediaFileError(
        'HOSTED_MEDIA_AUTH_REQUIRED',
        'ChatGPT media file ingestion requires authenticated hosted OAuth access.'
      );
    }
    const reference = validateReference(rawReference, 'media');
    let bytes: Buffer;
    try {
      bytes = await downloader(reference.download_url, options.policy, options.signal);
    } catch (error) {
      if (error instanceof HostedMediaFileError) throw error;
      if (error instanceof SafeRemoteDownloadError) {
        throw new HostedMediaFileError(`HOSTED_MEDIA_${error.code}`, error.message);
      }
      throw error;
    }
    const contentType = mediaKind === 'image'
      ? detectedContentType(bytes)
      : mediaKind === 'audio'
        ? detectedMp3ContentType(bytes)
        : detectedMp4ContentType(bytes);
    if (!contentType) {
      throw new HostedMediaFileError(
        'HOSTED_MEDIA_UNSUPPORTED_FORMAT',
        `Downloaded bytes are not a supported ${mediaKind} format.`
      );
    }
    const extension: Record<HostedMediaContentType, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'audio/mpeg': '.mp3',
      'video/mp4': '.mp4',
    };
    const rawName = basename(reference.file_name ?? '')
      .replace(/[^a-zA-Z0-9._ -]/g, '_')
      .trim()
      .slice(0, 120);
    return {
      mediaKind,
      bytes,
      contentType,
      fileName: rawName || `${reference.file_id.slice(0, 96)}${extension[contentType]}`,
      fileId: reference.file_id,
    };
  };
}

export const loadHostedMediaFile = createHostedMediaFileLoader();
