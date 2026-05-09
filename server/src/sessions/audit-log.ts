import type { AuditEvent, AuditLogger } from './types.js';

function withoutUndefined<T extends Record<string, unknown>>(value: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

export class ConsoleAuditLogger implements AuditLogger {
  record(event: AuditEvent): void {
    console.info(
      'RemNote bridge audit',
      withoutUndefined({
        type: event.type,
        timestamp: event.timestamp,
        actorSubject: event.actor?.subject,
        authMode: event.actor?.authMode,
        method: event.method,
        path: event.path,
        remoteAddress: event.remoteAddress,
        statusCode: event.statusCode,
        reason: event.reason,
      })
    );
  }
}
