/**
 * Request ledger — Phase 6.
 *
 * Tracks pending MCP requests sent to plugins, enabling asynchronous
 * reply correlation. Each entry records the request metadata, the
 * target user/device, and a resolve/reject callback for the promise.
 */

export interface LedgerEntry<T = unknown> {
  requestId: string;
  tool: string;
  userId: string;
  deviceId: string;
  startedAt: string;
  timeoutMs: number;
  resolve: (value: T) => void;
  reject: (reason: Error) => void;
  timeoutHandle: ReturnType<typeof setTimeout>;
}

export class RequestLedger<T = unknown> {
  private entries = new Map<string, LedgerEntry<T>>();

  get size(): number {
    return this.entries.size;
  }

  add(entry: LedgerEntry<T>): void {
    this.entries.set(entry.requestId, entry);
  }

  get(requestId: string): LedgerEntry<T> | undefined {
    return this.entries.get(requestId);
  }

  resolve(requestId: string, value: T): boolean {
    const entry = this.entries.get(requestId);
    if (!entry) return false;
    clearTimeout(entry.timeoutHandle);
    this.entries.delete(requestId);
    entry.resolve(value);
    return true;
  }

  reject(requestId: string, error: Error): boolean {
    const entry = this.entries.get(requestId);
    if (!entry) return false;
    clearTimeout(entry.timeoutHandle);
    this.entries.delete(requestId);
    entry.reject(error);
    return true;
  }

  rejectAll(error: Error): void {
    for (const [id, entry] of this.entries) {
      clearTimeout(entry.timeoutHandle);
      entry.reject(error);
    }
    this.entries.clear();
  }

  rejectForUser(userId: string, error: Error): void {
    for (const [id, entry] of this.entries) {
      if (entry.userId === userId) {
        clearTimeout(entry.timeoutHandle);
        entry.reject(error);
        this.entries.delete(id);
      }
    }
  }

  rejectForDevice(userId: string, deviceId: string, error: Error): void {
    for (const [id, entry] of this.entries) {
      if (entry.userId === userId && entry.deviceId === deviceId) {
        clearTimeout(entry.timeoutHandle);
        entry.reject(error);
        this.entries.delete(id);
      }
    }
  }

  getEntriesForUser(userId: string): LedgerEntry<T>[] {
    return Array.from(this.entries.values()).filter((e) => e.userId === userId);
  }

  getAllEntries(): LedgerEntry<T>[] {
    return Array.from(this.entries.values());
  }
}
