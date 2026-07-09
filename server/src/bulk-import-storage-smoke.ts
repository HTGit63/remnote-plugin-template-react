import { planNoteImport } from '../../shared/bridge/bulk-import.js';
import { BulkImportJobStore } from './bulk-import/job-store.js';
import { MemoryStorageProvider } from './storage/memory-store.js';
import { PostgresStorageProvider } from './storage/postgres-store.js';

type SmokeResult = {
  status: 'PASS' | 'BLOCKED' | 'FAIL';
  memory: Record<string, unknown>;
  postgres: Record<string, unknown>;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function buildPlan() {
  return planNoteImport({
    sourceName: 'bulk-storage-smoke.md',
    sourceText: [
      '# Bulk Storage Smoke',
      '',
      '## 1.1 Durable chunk',
      '',
      'Storage smoke source text.',
    ].join('\n'),
    targetRootId: 'bulk-storage-smoke-root',
    options: { maxCharsPerChunk: 1000 },
  });
}

async function proveMemoryStorage() {
  const storage = new MemoryStorageProvider();
  await storage.initialize();
  const store = new BulkImportJobStore({ storageDurability: storage.bulkImportStorageDurability() });
  const plan = store.savePlan(buildPlan());
  await storage.saveBulkImportPlan(plan);
  const job = store.createJob(plan.planId, `bulk-job:storage-smoke:memory:${Date.now()}`);
  await storage.saveBulkImportJob(job);
  const storedJob = await storage.getBulkImportJob(job.jobId);
  assert(storedJob?.storageDurability === 'memory_only', 'Memory storage must label bulk jobs memory_only.');
  assert(storedJob.chunks.length === job.chunks.length, 'Memory storage did not round-trip chunks.');

  const freshStorage = new MemoryStorageProvider();
  await freshStorage.initialize();
  const lostAfterNewProvider = (await freshStorage.getBulkImportJob(job.jobId)) === null;
  await freshStorage.close();
  await storage.close();
  return {
    status: 'PASS',
    storageDurability: storedJob.storageDurability,
    chunks: storedJob.chunks.length,
    lostAfterNewProvider,
  };
}

async function provePostgresStorage(databaseUrl: string | undefined) {
  if (!databaseUrl?.trim()) {
    return {
      status: 'BLOCKED',
      reason: 'DATABASE_URL is not configured; persistent bulk import storage proof not run.',
    };
  }

  const jobId = `bulk-job:storage-smoke:postgres:${Date.now()}`;
  const first = new PostgresStorageProvider(databaseUrl);
  await first.initialize();
  const firstStore = new BulkImportJobStore({ storageDurability: first.bulkImportStorageDurability() });
  const plan = firstStore.savePlan(buildPlan());
  await first.saveBulkImportPlan(plan);
  const job = firstStore.createJob(plan.planId, jobId);
  await first.saveBulkImportJob(job);
  await first.close();

  const second = new PostgresStorageProvider(databaseUrl);
  await second.initialize();
  const storedPlan = await second.getBulkImportPlan(plan.planId);
  const storedJob = await second.getBulkImportJob(jobId);
  await second.close();

  assert(storedPlan?.sourceHash === plan.sourceHash, 'Postgres storage did not persist bulk plan sourceHash.');
  assert(storedJob?.jobId === jobId, 'Postgres storage did not persist bulk job.');
  assert(storedJob.storageDurability === 'persistent', 'Postgres storage must label bulk jobs persistent.');
  assert(storedJob.chunks.length === job.chunks.length, 'Postgres storage did not round-trip chunks.');

  return {
    status: 'PASS',
    storageDurability: storedJob.storageDurability,
    chunks: storedJob.chunks.length,
    reloadedAfterProviderRestart: true,
  };
}

async function main() {
  const result: SmokeResult = {
    status: 'PASS',
    memory: await proveMemoryStorage(),
    postgres: {},
  };

  try {
    result.postgres = await provePostgresStorage(process.env.DATABASE_URL);
    if ((result.postgres as { status?: string }).status === 'BLOCKED') {
      result.status = 'BLOCKED';
    }
  } catch (error: unknown) {
    result.status = 'FAIL';
    result.postgres = {
      status: 'FAIL',
      error: error instanceof Error ? error.message : String(error),
    };
  }

  console.log(JSON.stringify(result, null, 2));
  if (result.status === 'FAIL') {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
