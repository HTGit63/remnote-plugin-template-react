import type { RNPlugin } from '@remnote/plugin-sdk';
import { runSdkOperation } from '../write/writeErrors';

export async function rollbackCreatedRems(plugin: RNPlugin, createdRemIds: readonly string[]) {
  const removedRemIds: string[] = [];
  const failedRemIds: string[] = [];

  for (const remId of [...createdRemIds].reverse()) {
    const rem = await plugin.rem.findOne(remId);
    if (!rem) {
      continue;
    }

    try {
      await runSdkOperation('rem.remove', () => rem.remove());
      removedRemIds.push(remId);
    } catch {
      failedRemIds.push(remId);
    }
  }

  return {
    status: failedRemIds.length ? ('failed' as const) : ('completed' as const),
    removedRemIds,
    failedRemIds,
  };
}
