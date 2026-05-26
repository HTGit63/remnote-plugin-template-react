const SECRET_KEYS = /token|secret|code|authorization|pairing/i;

export function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, inner]) => [
      key,
      SECRET_KEYS.test(key) ? '[REDACTED]' : redactSecrets(inner),
    ])
  );
}

export function safeLog(event: string, details: Record<string, unknown> = {}): void {
  console.info(event, redactSecrets(details));
}

