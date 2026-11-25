function runtimeEnvAvailable(): boolean {
  const maybeProcess = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };
  return Boolean(maybeProcess.process?.env);
}

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
  return boolFromRuntimeEnv('REMNOTE_BRIDGE_ENABLE_NATIVE_REM_HIGHLIGHT') ?? true;
}

export function existingRemHeadingStyleEnabled(): boolean {
  const configured = boolFromRuntimeEnv('REMNOTE_BRIDGE_ENABLE_EXISTING_REM_HEADING_STYLE');
  if (configured !== undefined) {
    return configured;
  }

  // The RemNote extension runs in a browser-like runtime where process.env is not
  // available. On this live-validation branch, allow the guarded heading path so
  // native SDK readback and child-pollution checks can determine whether the
  // installed RemNote runtime is safe. Node/test environments remain opt-in.
  return !runtimeEnvAvailable();
}

export function singleMarkdownFastPathEnabled(): boolean {
  return boolFromRuntimeEnv('REMNOTE_BRIDGE_ENABLE_SINGLE_MARKDOWN_FAST_PATH') ?? false;
}
