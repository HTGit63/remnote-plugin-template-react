export interface ClipboardRuntime {
  clipboardWrite?: (text: string) => Promise<void>;
  legacyCopy?: (text: string) => boolean;
}

function defaultClipboardWrite(text: string): Promise<void> {
  if (!globalThis.navigator?.clipboard?.writeText) {
    return Promise.reject(new Error('Clipboard API unavailable.'));
  }
  return globalThis.navigator.clipboard.writeText(text);
}

function defaultLegacyCopy(text: string): boolean {
  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') {
    return false;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return document.execCommand('copy');
  } finally {
    textarea.remove();
  }
}

export async function copyTextToClipboard(
  text: string,
  runtime: ClipboardRuntime = {}
): Promise<'clipboard' | 'legacy'> {
  const clipboardWrite = runtime.clipboardWrite ?? defaultClipboardWrite;
  const legacyCopy = runtime.legacyCopy ?? defaultLegacyCopy;
  try {
    await clipboardWrite(text);
    return 'clipboard';
  } catch {
    if (legacyCopy(text)) {
      return 'legacy';
    }
  }
  throw new Error('Clipboard copy is unavailable on this RemNote surface.');
}

export interface BridgePanelHealthResult {
  ok: boolean;
  health: Record<string, unknown>;
  diagnostics: Record<string, unknown> | null;
  warnings: string[];
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function disconnectBridgeRuntimeSafely(options: {
  disableLocal: () => Promise<void>;
  revokeRemote: () => Promise<void>;
  clearLocal: () => Promise<void>;
}): Promise<{ remoteRevocationConfirmed: boolean; warning: string | null }> {
  await options.disableLocal();
  let warning: string | null = null;
  try {
    await options.revokeRemote();
  } catch (error: unknown) {
    warning = errorMessage(error);
  }
  await options.clearLocal();
  return {
    remoteRevocationConfirmed: warning === null,
    warning,
  };
}

export async function collectBridgePanelHealth(options: {
  loadPublicHealth: () => Promise<Record<string, unknown>>;
  loadDiagnostics: () => Promise<Record<string, unknown>>;
}): Promise<BridgePanelHealthResult> {
  const [healthResult, diagnosticsResult] = await Promise.allSettled([
    options.loadPublicHealth(),
    options.loadDiagnostics(),
  ]);
  const warnings: string[] = [];
  const health = healthResult.status === 'fulfilled'
    ? healthResult.value
    : { ok: false, error: errorMessage(healthResult.reason) };
  const diagnostics = diagnosticsResult.status === 'fulfilled' ? diagnosticsResult.value : null;
  if (healthResult.status === 'rejected') warnings.push(errorMessage(healthResult.reason));
  if (healthResult.status === 'fulfilled' && healthResult.value.ok === false) {
    warnings.push(String(healthResult.value.error ?? 'Public bridge health reported a failure.'));
  }
  if (diagnosticsResult.status === 'rejected') warnings.push(errorMessage(diagnosticsResult.reason));
  if (diagnosticsResult.status === 'fulfilled' && diagnosticsResult.value.ok === false) {
    warnings.push(String(diagnosticsResult.value.error ?? 'Authenticated bridge diagnostics reported a failure.'));
  }
  const publicHealthOk = healthResult.status === 'fulfilled' && healthResult.value.ok !== false;
  const diagnosticsOk = diagnosticsResult.status === 'fulfilled' && diagnosticsResult.value.ok !== false;
  return {
    ok: publicHealthOk || diagnosticsOk,
    health,
    diagnostics,
    warnings,
  };
}
