import { RemType, SetRemType } from '@remnote/plugin-sdk';
import type { Rem, RichTextFormatName, RichTextInterface, RNPlugin } from '@remnote/plugin-sdk';
import type {
  ApplyRemnoteCommandArgs,
  ApplyRemnoteCommandResult,
  ApplyStylePlanArgs,
  ApplyStylePlanResult,
  ApplyStructuredNoteBatchArgs,
  ApplyStructuredNoteBatchResult,
  AppendToRemArgs,
  AppendToRemResult,
  BridgeErrorCode,
  ClearRemFormattingArgs,
  CreateDocumentArgs,
  CreateDocumentResult,
  CreateFlashcardArgs,
  CreateFlashcardResult,
  CreateFolderArgs,
  CreateFolderResult,
  CreateListAnswerCardArgs,
  CreateMultipleChoiceCardArgs,
  CreateOrReplaceNoteFromMarkdownArgs,
  CreateOrReplaceNoteFromMarkdownResult,
  CreatePolishedNoteTreeArgs,
  CreatePolishedNoteTreeResult,
  CreateRemTreeArgs,
  CreateRemTreeNode,
  CreateRemTreeResult,
  CreateRemArgs,
  CreateRemResult,
  CreateClozeCardArgs,
  CreateStyledRemTreeArgs,
  CreateStyledRemTreeResult,
  DeletePreview,
  DeleteRemByIdArgs,
  DeleteRemByIdResult,
  DeleteRemByIdTarget,
  ExpectedStyleMapEntry,
  FormatRemResult,
  MoveRemArgs,
  MoveRemResult,
  PracticeDirection,
  ReplaceRemArgs,
  ReplaceRemResult,
  ReorderChildrenArgs,
  ReorderChildrenResult,
  RemColorName,
  RemnoteCommandName,
  RemHeadingLevel,
  RemStyleInput,
  RemTypeName,
  RichTextSpanInput,
  SetHideBulletArgs,
  SetRemHeadingLevelArgs,
  SetRemHighlightColorArgs,
  SetRemTextColorArgs,
  SetRemTypeArgs,
  SetTextSpanColorArgs,
  SetTextSpanHighlightArgs,
  StyledRemTreeNode,
  StyledRemTreeNodeType,
  UpdateRemArgs,
  UpdateRemRichArgs,
  UpdateRemResult,
  VerifyNoteDesignArgs,
  VerifyNoteDesignResult,
} from '../../../shared/bridge/protocol';
import { RICH_TEXT_FONT_COLOR_FIELD, RICH_TEXT_HIGHLIGHT_FIELD } from '../richTextFormatting';
import { getRemPlainString } from './remnoteSdkHelpers';

const RICH_TEXT_COLOR_NUMBERS: Record<string, number> = {
  red: 1,
  orange: 2,
  yellow: 3,
  green: 4,
  purple: 5,
  blue: 6,
};

export function richTextHasSpanField(
  richText: RichTextInterface | undefined,
  text: string | undefined,
  color: string,
  field: typeof RICH_TEXT_FONT_COLOR_FIELD | typeof RICH_TEXT_HIGHLIGHT_FIELD
): boolean {
  if (!richText || !text) {
    return false;
  }

  const expectedColor = RICH_TEXT_COLOR_NUMBERS[color.trim().toLowerCase()];
  if (!expectedColor) {
    return false;
  }

  return richText.some((item) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return false;
    }

    const record = item as Record<string, unknown>;
    return typeof record.text === 'string' && record.text.includes(text) && record[field] === expectedColor;
  });
}

export function fixSuggestionForMismatch(type: string): string {
  switch (type) {
    case 'headingLevel':
      return 'Use apply_style_plan with a heading operation.';
    case 'wholeRemHighlight':
      return 'Use apply_style_plan with a whole_rem_highlight operation.';
    case 'textColorSpan':
      return 'Use apply_style_plan with a text_color_span operation.';
    case 'textHighlightSpan':
      return 'Use apply_style_plan with a text_highlight_span operation.';
    case 'childOrder':
      return 'Use reorder_children with the full ordered child ID list.';
    case 'hideBullet':
      return 'Use apply_remnote_command with hide_bullet/show_bullet or set_hide_bullet.';
    case 'remType':
      return 'Use set_rem_type or apply_remnote_command with make_concept/make_descriptor.';
    case 'plainText':
      return 'Use update_rem or replace_rem with expectedPlainText guard.';
    default:
      return 'Inspect the Rem and rerun the relevant specialized tool.';
  }
}

export function remTypeNameFromRem(rem: Rem): RemTypeName {
  if (rem.type === RemType.CONCEPT) {
    return 'concept';
  }
  if (rem.type === RemType.DESCRIPTOR) {
    return 'descriptor';
  }
  return 'normal';
}

export async function verifyNoteDesign(
  plugin: RNPlugin,
  args: VerifyNoteDesignArgs
): Promise<VerifyNoteDesignResult> {
  const checkedRemIds: string[] = [];
  const mismatches: VerifyNoteDesignResult['mismatches'] = [];
  const unsupportedChecks: VerifyNoteDesignResult['unsupportedChecks'] = [];
  const entries = Object.entries(args.expectedStyleMap) as Array<[string, ExpectedStyleMapEntry]>;
  const idsToCheck: Array<[string, ExpectedStyleMapEntry]> = entries.length
    ? entries
    : [[args.rootRemId, args.expectedStyleMap[args.rootRemId] ?? {}]];

  for (const [remId, expected] of idsToCheck) {
    const rem = await plugin.rem.findOne(remId);
    if (!rem) {
      mismatches.push({
        remId,
        type: 'missing_rem',
        expected: remId,
        actual: null,
        message: 'Expected Rem is missing.',
        fixSuggestion: fixSuggestionForMismatch('missing_rem'),
      });
      continue;
    }

    checkedRemIds.push(remId);
    const plainText = await getRemPlainString(plugin, rem);
    if (expected.plainText !== undefined && plainText !== expected.plainText) {
      mismatches.push({
        remId,
        type: 'plainText',
        expected: expected.plainText,
        actual: plainText,
        message: 'Plain text mismatch.',
        fixSuggestion: fixSuggestionForMismatch('plainText'),
      });
    }

    if (expected.headingLevel) {
      const actual = (await rem.getFontSize().catch(() => undefined)) ?? 'normal';
      if (actual !== expected.headingLevel) {
        mismatches.push({
          remId,
          type: 'headingLevel',
          expected: expected.headingLevel,
          actual,
          message: 'Heading level mismatch.',
          fixSuggestion: fixSuggestionForMismatch('headingLevel'),
        });
      }
    }

    if (expected.hideBullet !== undefined) {
      const actual = !(await rem.isListItem().catch(() => true));
      if (actual !== expected.hideBullet) {
        mismatches.push({
          remId,
          type: 'hideBullet',
          expected: expected.hideBullet,
          actual,
          message: 'Hidden bullet state mismatch.',
          fixSuggestion: fixSuggestionForMismatch('hideBullet'),
        });
      }
    }

    if (expected.remType) {
      const actual = remTypeNameFromRem(rem);
      if (actual !== expected.remType) {
        mismatches.push({
          remId,
          type: 'remType',
          expected: expected.remType,
          actual,
          message: 'Rem type mismatch.',
          fixSuggestion: fixSuggestionForMismatch('remType'),
        });
      }
    }

    if (expected.wholeRemHighlight) {
      const actual = String(await rem.getHighlightColor().catch(() => 'default')).toLowerCase();
      if (actual !== expected.wholeRemHighlight.toLowerCase()) {
        mismatches.push({
          remId,
          type: 'wholeRemHighlight',
          expected: expected.wholeRemHighlight,
          actual,
          message: 'Whole-Rem highlight mismatch.',
          fixSuggestion: fixSuggestionForMismatch('wholeRemHighlight'),
        });
      }
    }

    for (const span of expected.textColorSpans ?? []) {
      if (!richTextHasSpanField(rem.text, span.text, span.color, RICH_TEXT_FONT_COLOR_FIELD)) {
        mismatches.push({
          remId,
          type: 'textColorSpan',
          expected: span,
          message: 'Expected colored text span was not found in readable rich text fields.',
          fixSuggestion: fixSuggestionForMismatch('textColorSpan'),
        });
      }
    }

    for (const span of expected.textHighlightSpans ?? []) {
      if (!richTextHasSpanField(rem.text, span.text, span.color, RICH_TEXT_HIGHLIGHT_FIELD)) {
        mismatches.push({
          remId,
          type: 'textHighlightSpan',
          expected: span,
          message: 'Expected highlighted text span was not found in raw rich text highlight field.',
          fixSuggestion: fixSuggestionForMismatch('textHighlightSpan'),
        });
      }
    }

    if (expected.childOrder) {
      const children = await rem.getChildrenRem();
      const actual = children.map((child) => child._id);
      if (JSON.stringify(actual) !== JSON.stringify(expected.childOrder)) {
        mismatches.push({
          remId,
          type: 'childOrder',
          expected: expected.childOrder,
          actual,
          message: 'Child order mismatch.',
          fixSuggestion: fixSuggestionForMismatch('childOrder'),
        });
      }
    }
  }

  return {
    rootRemId: args.rootRemId,
    ok: mismatches.length === 0,
    checkedRemIds,
    mismatches,
    unsupportedChecks,
  };
}

