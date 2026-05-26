import type { CompanionServerConfig } from '../config.js';
import type { StorageProvider } from './types.js';
import { MemoryStorageProvider } from './memory-store.js';
import { PostgresStorageProvider } from './postgres-store.js';

export * from './types.js';
export * from './crypto-utils.js';

export function createStorageProvider(config: CompanionServerConfig): StorageProvider {
  if (config.storageMode === 'postgres') {
    return new PostgresStorageProvider(config.databaseUrl);
  }
  return new MemoryStorageProvider();
}
