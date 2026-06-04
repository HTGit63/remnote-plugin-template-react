import type { RNPlugin } from '@remnote/plugin-sdk';
import type { ApplyStructuredNoteBatchResult } from '../../../shared/bridge/protocol';
import { findRequiredRem, getRemPlainString } from '../write/remnoteSdkHelpers';

export async function verifyCreatedRems(
  plugin: RNPlugin,
  createdRemIds: string[],
  rootCreatedRemId?: string
): Promise<ApplyStructuredNoteBatchResult['verification']> {
  const checkedRemIds: string[] = [];
  const missingRemIds: string[] = [];
  let rootPlainText: string | undefined;

  for (const remId of createdRemIds) {
    const rem = await plugin.rem.findOne(remId);
    if (!rem) {
      missingRemIds.push(remId);
      continue;
    }

    checkedRemIds.push(remId);
    if (rootCreatedRemId && remId === rootCreatedRemId) {
      rootPlainText = await getRemPlainString(plugin, rem);
    }
  }

  return {
    ok: missingRemIds.length === 0,
    checkedRemIds,
    missingRemIds,
    ...(rootPlainText !== undefined ? { rootPlainText } : {}),
  };
}

export async function verifyStagedReplacement(
  plugin: RNPlugin,
  stagedRootIds: readonly string[]
): Promise<{ ok: boolean; checkedRemIds: string[]; missingRemIds: string[] }> {
  const verification = await verifyCreatedRems(plugin, [...stagedRootIds]);
  return {
    ok: Boolean(verification?.ok),
    checkedRemIds: verification?.checkedRemIds ?? [],
    missingRemIds: verification?.missingRemIds ?? [],
  };
}

export async function snapshotDirectChildIds(plugin: RNPlugin, remId: string): Promise<string[]> {
  const rem = await findRequiredRem(plugin, remId, 'Target');
  const children = await rem.getChildrenRem();
  return children.map((child) => child._id);
}
