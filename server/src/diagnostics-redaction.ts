const REDACT_KEY_PATTERNS = [
  /authorization/i,
  /cookie/i,
  /token/i,
  /secret/i,
  /sessionSecret/i,
  /pluginSessionToken/i,
  /body/i,
  /markdown/i,
  /plainText/i,
  /frontText/i,
  /backText/i,
  /rawText/i,
  /richText/i,
  /backRichText/i,
  /^args$/i,
  /^content$/i,
];

function shouldRedactKey(key: string): boolean {
  return REDACT_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

export function redactDiagnosticValue(value: unknown, depth = 0): unknown {
  if (depth > 8) {
    return '[REDACTED_DEPTH_LIMIT]';
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactDiagnosticValue(item, depth + 1));
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  const output: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    output[key] = shouldRedactKey(key) ? '[REDACTED]' : redactDiagnosticValue(nested, depth + 1);
  }
  return output;
}

export function buildPublicUserDiagnosticSummary(input: {
  connected: boolean;
  pendingRequests: number;
  publicToolCount: number;
  actualCallableToolCount: number;
  runtimeUnverifiedToolCount: number;
  sdkUnsupportedToolCount: number;
  lastErrorCode?: string | null;
  deleteToolExposed: boolean;
  registryMismatchCount: number;
}) {
  const issues: string[] = [];
  if (!input.connected) {
    issues.push('RemNote plugin is not connected.');
  }
  if (input.pendingRequests > 0) {
    issues.push(`${input.pendingRequests} request(s) still pending.`);
  }
  if (input.runtimeUnverifiedToolCount > 0) {
    issues.push(`${input.runtimeUnverifiedToolCount} listed tool(s) need live verification.`);
  }
  if (input.sdkUnsupportedToolCount > 0) {
    issues.push(`${input.sdkUnsupportedToolCount} SDK-limited tool(s) are unsupported.`);
  }
  if (input.registryMismatchCount > 0) {
    issues.push('Tool registry and MCP listing mismatch detected.');
  }
  if (input.lastErrorCode) {
    issues.push(`Last tool error: ${input.lastErrorCode}.`);
  }

  return {
    status: issues.length ? 'needs_attention' : 'ok',
    message: issues[0] ?? 'Bridge looks healthy from recent diagnostics.',
    issues,
    listedTools: input.publicToolCount,
    actualCallableTools: input.actualCallableToolCount,
    deleteTool: input.deleteToolExposed ? 'danger_zone_enabled' : 'hidden_by_default',
  };
}
