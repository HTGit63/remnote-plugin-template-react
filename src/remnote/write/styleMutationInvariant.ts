import type { PluginRem as Rem, RNPlugin } from '@remnote/plugin-sdk';
import { getRemPlainString } from './remnoteSdkHelpers';
import { RemnoteWriteError, runSdkOperation } from './writeErrors';

export interface StyleMutationSnapshot {
  childIds: string[];
  childOrder: string[];
  plainText: string;
  parentId?: string | null;
  siblingOrder?: string[];
}

export async function captureStyleMutationSnapshot(
  plugin: RNPlugin,
  rem: Rem
): Promise<StyleMutationSnapshot> {
  const childIds = (await runSdkOperation('rem.getChildrenRem', () => rem.getChildrenRem())).map(
    (child) => child._id
  );
  const parentId = typeof rem.parent === 'string' ? rem.parent : null;
  const parent = parentId ? await plugin.rem.findOne(parentId) : null;
  const siblingOrder = parent
    ? (await runSdkOperation('parent.getChildrenRem', () => parent.getChildrenRem())).map((child) => child._id)
    : [];
  return {
    childIds,
    childOrder: [...childIds],
    plainText: await getRemPlainString(plugin, rem),
    parentId,
    siblingOrder,
  };
}

function verifyStructuralMutation(
  remId: string,
  status: string,
  before: StyleMutationSnapshot,
  after: StyleMutationSnapshot
): Record<string, unknown> {
  const beforeParentId = before.parentId ?? null;
  const afterParentId = after.parentId ?? null;
  const beforeSiblingOrder = before.siblingOrder ?? [];
  const afterSiblingOrder = after.siblingOrder ?? [];
  if (beforeParentId !== afterParentId) {
    throw new RemnoteWriteError('PARTIAL_FAILURE', 'Operation changed target parent.', {
      remId,
      status,
      beforeParentId,
      afterParentId,
      failedStage: 'target_parent_check',
    });
  }
  const siblingOrderUnchanged =
    beforeSiblingOrder.length === afterSiblingOrder.length &&
    beforeSiblingOrder.every((id, index) => afterSiblingOrder[index] === id);
  if (!siblingOrderUnchanged) {
    throw new RemnoteWriteError('PARTIAL_FAILURE', 'Operation changed sibling order.', {
      remId,
      status,
      beforeSiblingOrder,
      afterSiblingOrder,
      failedStage: 'target_sibling_order_check',
    });
  }
  return {
    beforeParentId,
    afterParentId,
    parentUnchanged: true,
    beforeSiblingOrder: [...beforeSiblingOrder],
    afterSiblingOrder: [...afterSiblingOrder],
    siblingOrderUnchanged: true,
  };
}

export function verifyStyleOnlyMutation(
  remId: string,
  status: string,
  before: StyleMutationSnapshot,
  after: StyleMutationSnapshot
): Record<string, unknown> {
  const structuralProof = verifyStructuralMutation(remId, status, before, after);
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
    ...structuralProof,
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
    operationInvariant: 'style_only',
  };
}

export function verifyRichReplacementMutation(
  remId: string,
  status: string,
  before: StyleMutationSnapshot,
  after: StyleMutationSnapshot,
  expectedPlainText: string,
  richTextMatchesRequested: boolean
): Record<string, unknown> {
  const structuralProof = verifyStructuralMutation(remId, status, before, after);
  const createdChildIds = after.childIds.filter((id) => !before.childIds.includes(id));
  const childOrderUnchanged =
    before.childOrder.length === after.childOrder.length &&
    before.childOrder.every((id, index) => after.childOrder[index] === id);
  const plainTextMatchesRequested = after.plainText === expectedPlainText;
  if (createdChildIds.length || !childOrderUnchanged || !plainTextMatchesRequested || !richTextMatchesRequested) {
    throw new RemnoteWriteError('PARTIAL_FAILURE', 'Rich replacement readback did not match requested content or preserved structure.', {
      remId,
      status,
      beforeChildIds: before.childIds,
      afterChildIds: after.childIds,
      beforeChildOrder: before.childOrder,
      afterChildOrder: after.childOrder,
      expectedPlainText,
      actualPlainText: after.plainText,
      richTextMatchesRequested,
      createdChildRemIds: createdChildIds,
      failedStage: 'rich_replacement_readback',
    });
  }
  return {
    ...structuralProof,
    beforeChildIds: [...before.childIds],
    afterChildIds: [...after.childIds],
    beforeChildOrder: [...before.childOrder],
    afterChildOrder: [...after.childOrder],
    childOrderUnchanged,
    noChildrenCreated: true,
    beforePlainText: before.plainText,
    afterPlainText: after.plainText,
    expectedPlainText,
    plainTextMatchesRequested,
    richTextMatchesRequested,
    operationInvariant: 'rich_replacement',
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

export function withRichReplacementProof<
  S extends string,
  T extends { remId: string; status: S; verification?: Record<string, unknown> },
>(
  result: T,
  before: StyleMutationSnapshot,
  after: StyleMutationSnapshot,
  expectedPlainText: string,
  richTextMatchesRequested: boolean
): T {
  return {
    ...result,
    verification: {
      ...(result.verification ?? {}),
      ...verifyRichReplacementMutation(
        result.remId,
        result.status,
        before,
        after,
        expectedPlainText,
        richTextMatchesRequested
      ),
    },
  };
}
