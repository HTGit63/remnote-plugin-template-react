import type { PluginRem as Rem, RNPlugin } from '@remnote/plugin-sdk';
import { getRemPlainString } from './remnoteSdkHelpers';
import { RemnoteWriteError, runSdkOperation } from './writeErrors';

export interface StyleMutationSnapshot {
  childIds: string[];
  childOrder: string[];
  plainText: string;
}

export async function captureStyleMutationSnapshot(
  plugin: RNPlugin,
  rem: Rem
): Promise<StyleMutationSnapshot> {
  const childIds = (await runSdkOperation('rem.getChildrenRem', () => rem.getChildrenRem())).map(
    (child) => child._id
  );
  return {
    childIds,
    childOrder: [...childIds],
    plainText: await getRemPlainString(plugin, rem),
  };
}

export function verifyStyleOnlyMutation(
  remId: string,
  status: string,
  before: StyleMutationSnapshot,
  after: StyleMutationSnapshot
): Record<string, unknown> {
  const createdChildIds = after.childIds.filter((id) => !before.childIds.includes(id));
  if (createdChildIds.length > 0) {
    throw new RemnoteWriteError('PARTIAL_FAILURE', 'Style-only operation created unexpected child Rems.', {
      remId,
      status,
      beforeChildIds: [...before.childIds],
      afterChildIds: [...after.childIds],
      beforeChildOrder: [...before.childOrder],
      afterChildOrder: [...after.childOrder],
      beforePlainText: before.plainText,
      afterPlainText: after.plainText,
      createdChildRemIds: createdChildIds,
      partialExecution: {
        createdRemIds: createdChildIds,
        failedStage: 'style_child_pollution_check',
        rollbackStatus: 'not_attempted',
      },
    });
  }

  const childOrderUnchanged =
    before.childOrder.length === after.childOrder.length &&
    before.childOrder.every((id, index) => after.childOrder[index] === id);
  if (!childOrderUnchanged) {
    throw new RemnoteWriteError('PARTIAL_FAILURE', 'Style-only operation changed child order.', {
      remId,
      status,
      beforeChildIds: [...before.childIds],
      afterChildIds: [...after.childIds],
      beforeChildOrder: [...before.childOrder],
      afterChildOrder: [...after.childOrder],
      beforePlainText: before.plainText,
      afterPlainText: after.plainText,
      partialExecution: {
        createdRemIds: [],
        failedStage: 'style_child_order_check',
        rollbackStatus: 'not_attempted',
      },
    });
  }

  if (before.plainText !== after.plainText) {
    throw new RemnoteWriteError('PARTIAL_FAILURE', 'Style-only operation changed plain text.', {
      remId,
      status,
      beforeChildIds: [...before.childIds],
      afterChildIds: [...after.childIds],
      beforeChildOrder: [...before.childOrder],
      afterChildOrder: [...after.childOrder],
      beforePlainText: before.plainText,
      afterPlainText: after.plainText,
      partialExecution: {
        createdRemIds: [],
        failedStage: 'style_plain_text_check',
        rollbackStatus: 'not_attempted',
      },
    });
  }

  return {
    beforeChildIds: [...before.childIds],
    afterChildIds: [...after.childIds],
    beforeChildOrder: [...before.childOrder],
    afterChildOrder: [...after.childOrder],
    childIdsBefore: [...before.childIds],
    childIdsAfter: [...after.childIds],
    childCountBefore: before.childIds.length,
    childCountAfter: after.childIds.length,
    beforePlainText: before.plainText,
    afterPlainText: after.plainText,
    childOrderUnchanged,
    plainTextUnchanged: true,
    noChildrenCreated: true,
    onlyExpectedStyleChanged: true,
  };
}

export function withStyleMutationProof<
  S extends string,
  T extends { remId: string; status: S; verification?: Record<string, unknown> },
>(result: T, before: StyleMutationSnapshot, after: StyleMutationSnapshot): T {
  return {
    ...result,
    verification: {
      ...(result.verification ?? {}),
      ...verifyStyleOnlyMutation(result.remId, result.status, before, after),
    },
  };
}
