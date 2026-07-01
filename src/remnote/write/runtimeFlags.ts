function readRuntimeEnv(name: string): string | undefined {
  const maybeProcess = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };
  return maybeProcess.process?.env?.[name];
}

function boolFromRuntimeEnv(name: string): boolean | undefined {
  const raw = readRuntimeEnv(name);
  if (raw === undefined) {
    return undefined;
  }
  const normalized = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }
  return undefined;
}

export function sdkTransactionsDisabledByRuntimeFlag(): boolean {
  return boolFromRuntimeEnv('REMNOTE_BRIDGE_DISABLE_SDK_TRANSACTIONS') ?? true;
}

export function markdownTreeFastPathEnabled(): boolean {
  return boolFromRuntimeEnv('REMNOTE_BRIDGE_ENABLE_MARKDOWN_TREE_FAST_PATH') ?? false;
}

export function nativeRemHighlightEnabled(): boolean {
  return boolFromRuntimeEnv('REMNOTE_BRIDGE_ENABLE_NATIVE_REM_HIGHLIGHT') ?? false;
}

export function existingRemHeadingStyleEnabled(): boolean {
  return boolFromRuntimeEnv('REMNOTE_BRIDGE_ENABLE_EXISTING_REM_HEADING_STYLE') ?? false;
}

export function singleMarkdownFastPathEnabled(): boolean {
  return boolFromRuntimeEnv('REMNOTE_BRIDGE_ENABLE_SINGLE_MARKDOWN_FAST_PATH') ?? false;
}
