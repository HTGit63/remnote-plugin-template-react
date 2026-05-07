import type { Rem, RNPlugin } from '@remnote/plugin-sdk';
import type { GetRemArgs, GetRemTreeArgs, SerializedRem } from '../bridge/protocol';
import { serializeRem } from './serialize';

export interface FocusedRemStatus {
  found: boolean;
  remId?: string;
  label: string;
  hasChildren?: boolean;
}

export async function refreshRem(plugin: RNPlugin, rem: Rem | undefined): Promise<Rem | undefined> {
  if (!rem?._id) {
    return undefined;
  }

  return (await plugin.rem.findOne(rem._id)) ?? rem;
}

export async function readFocusedRem(plugin: RNPlugin): Promise<SerializedRem | undefined> {
  const focusedRem = await plugin.focus.getFocusedRem();
  const rem = await refreshRem(plugin, focusedRem);

  if (!rem) {
    return undefined;
  }

  return serializeRem(plugin, rem);
}

export async function readRem(plugin: RNPlugin, args: GetRemArgs): Promise<SerializedRem | undefined> {
  const rem = await plugin.rem.findOne(args.remId);

  if (!rem) {
    return undefined;
  }

  return serializeRem(plugin, rem);
}

export async function readRemTree(plugin: RNPlugin, args: GetRemTreeArgs): Promise<SerializedRem | undefined> {
  const rem = await plugin.rem.findOne(args.remId);

  if (!rem) {
    return undefined;
  }

  return serializeRem(plugin, rem, { depth: args.depth });
}

export async function getFocusedRemStatus(plugin: RNPlugin): Promise<FocusedRemStatus> {
  const focusedRem = await plugin.focus.getFocusedRem();
  const rem = await refreshRem(plugin, focusedRem);

  if (!rem) {
    return {
      found: false,
      label: 'No focused Rem',
    };
  }

  const serialized = await serializeRem(plugin, rem);

  return {
    found: true,
    remId: serialized.remId,
    label: serialized.frontText || serialized.remId,
    hasChildren: serialized.hasChildren,
  };
}

