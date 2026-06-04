import type { PluginRem as Rem, RNPlugin } from '@remnote/plugin-sdk';

import { runSdkOperation } from './writeErrors';
import { createTableWithSdkApi, findRequiredRem } from './remnoteSdkHelpers';

export interface CreateRemnoteTableInternalArgs {
  existingTagId?: string;
  parentId?: string;
}

export interface CreateRemnoteTableInternalResult {
  tableRemId: string;
  parentId?: string;
  existingTagId?: string;
  isTable?: boolean;
  status: 'created_table';
  sdkCapability: 'plugin.rem.createTable';
}

export async function createRemnoteTableInternal(
  plugin: RNPlugin,
  args: CreateRemnoteTableInternalArgs = {}
): Promise<CreateRemnoteTableInternalResult> {
  const existingTag: Rem | undefined = args.existingTagId
    ? await findRequiredRem(plugin, args.existingTagId, 'Target', 'REM_NOT_FOUND')
    : undefined;
  const parent = args.parentId
    ? await findRequiredRem(plugin, args.parentId, 'Parent', 'PARENT_NOT_FOUND')
    : undefined;
  const tableRem = await createTableWithSdkApi(plugin, existingTag);

  if (parent) {
    await runSdkOperation('rem.setParent', () => tableRem.setParent(parent));
  }

  const maybeIsTable = (tableRem as unknown as { isTable?: () => Promise<boolean> }).isTable;
  const isTable = typeof maybeIsTable === 'function'
    ? await runSdkOperation('rem.isTable', () => maybeIsTable.call(tableRem))
    : undefined;

  return {
    tableRemId: tableRem._id,
    ...(parent ? { parentId: parent._id } : {}),
    ...(existingTag ? { existingTagId: existingTag._id } : {}),
    ...(isTable !== undefined ? { isTable } : {}),
    status: 'created_table',
    sdkCapability: 'plugin.rem.createTable',
  };
}

export async function createTableForPrivateLiveTest(
  plugin: RNPlugin,
  args: CreateRemnoteTableInternalArgs = {}
): Promise<CreateRemnoteTableInternalResult> {
  return createRemnoteTableInternal(plugin, args);
}
