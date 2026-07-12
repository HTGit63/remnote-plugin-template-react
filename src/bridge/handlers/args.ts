import type {
  BridgeToolArgs,
  BridgeToolName,
  AppendMarkdownAsRemTreeArgs,
  CreateDesignedNoteTreeArgs,
  CreateFlashcardsFromMarkdownArgs,
  CreateNoteFromMarkdownTreeArgs,
  CreateOrReplaceNoteFromMarkdownArgs,
  PreviewNoteDesignPlanArgs,
  PreviewMarkdownNoteTreeArgs,
  UpdateNoteWithDesignArgs,
  VerifyNoteAgainstDesignArgs,
  VerifyNoteDesignArgs,
} from '../../../shared/bridge/protocol';

import {
  isPlainObject,
  getStringField,
  requiredRemId,
  requiredRemIdFromFields,
  requiredMarkdown,
  requiredMarkdownText,
  requiredTextField,
  optionalParentId,
  requiredParentId,
  optionalRemId,
  getTreeDepth,
  optionalBoundedNumber,
  requiredSearchQuery,
  optionalAppendPosition,
  requiredIndex,
  requiredOrderedChildRemIds,
  requiredTree,
  requiredStyledTree,
  optionalStructuredBatchRoot,
  optionalStructuredBatchTarget,
  optionalStructuredBatchOperation,
  optionalStructuredBatchNote,
  requiredCommandTarget,
  requiredRemnoteCommand,
  optionalCommandArgs,
  optionalBoolean,
  optionalIdempotencyKey,
  requiredRichText,
  requiredColor,
  requiredHeadingLevel,
  requiredRemType,
  optionalPracticeDirection,
  requiredBoolean,
  optionalRangeInput,
  requiredStyleOperations,
  optionalStylingPlan,
  requiredExpectedStyleMap,
  requiredStringArray,
  optionalScope,
} from './validation';

export function normalizeArgs<TTool extends BridgeToolName>(
  tool: TTool,
  args: unknown
): BridgeToolArgs[TTool] {
  switch (tool) {
    case 'ping':
      return {
        message: getStringField(args, 'message')?.slice(0, 200),
      } as BridgeToolArgs[TTool];
    case 'get_status':
    case 'get_focused_rem':
      return {} as BridgeToolArgs[TTool];
    case 'get_rem':
      return {
        remId: requiredRemId(args),
      } as BridgeToolArgs[TTool];
    case 'get_rem_tree':
      return {
        remId: requiredRemId(args),
        depth: getTreeDepth(args),
      } as BridgeToolArgs[TTool];
    case 'get_rem_rich':
    case 'debug_get_raw_rich_text':
      return {
        remId: requiredRemId(args),
      } as BridgeToolArgs[TTool];
    case 'get_current_selection':
      return {} as BridgeToolArgs[TTool];
    case 'get_children':
      return {
        parentRemId: requiredRemIdFromFields(args, ['parentRemId', 'remId']),
        maxChildren: optionalBoundedNumber(args, 'maxChildren') ?? optionalBoundedNumber(args, 'limit'),
      } as BridgeToolArgs[TTool];
    case 'get_rem_breadcrumbs':
      return {
        remId: requiredRemId(args),
      } as BridgeToolArgs[TTool];
    case 'search_rems':
      return {
        query: requiredSearchQuery(args),
        contextRemId: optionalRemId(args, 'contextRemId'),
        maxResults: optionalBoundedNumber(args, 'maxResults') ?? optionalBoundedNumber(args, 'limit'),
        scope: optionalScope(args),
      } as BridgeToolArgs[TTool];
    case 'get_document_or_folder_tree':
      return {
        rootRemId: optionalRemId(args, 'rootRemId'),
        depth: getTreeDepth(args),
        maxChildren: optionalBoundedNumber(args, 'maxChildren'),
      } as BridgeToolArgs[TTool];
    case 'create_rem':
      return {
        parentId: optionalParentId(args),
        markdown: requiredMarkdown(args),
        idempotencyKey: optionalIdempotencyKey(args),
      } as BridgeToolArgs[TTool];
    case 'append_to_rem':
      return {
        remId: requiredRemId(args),
        markdown: requiredMarkdown(args),
        position: optionalAppendPosition(args),
        idempotencyKey: optionalIdempotencyKey(args),
      } as BridgeToolArgs[TTool];
    case 'create_document':
    case 'create_folder':
      return {
        parentId: optionalParentId(args),
        markdown: requiredMarkdown(args),
        idempotencyKey: optionalIdempotencyKey(args),
      } as BridgeToolArgs[TTool];
    case 'update_rem':
      return {
        remId: requiredRemId(args),
        markdown: requiredMarkdown(args),
        dryRun: optionalBoolean(args, 'dryRun'),
        idempotencyKey: optionalIdempotencyKey(args),
        expectedPlainText: getStringField(args, 'expectedPlainText')?.trim(),
      } as BridgeToolArgs[TTool];
    case 'move_rem':
      return {
        remId: requiredRemId(args),
        newParentId: requiredRemId(args, 'newParentId'),
        index: requiredIndex(args),
        dryRun: optionalBoolean(args, 'dryRun'),
        idempotencyKey: optionalIdempotencyKey(args),
        expectedParentId: optionalRemId(args, 'expectedParentId') ?? undefined,
        expectedAncestorId: optionalRemId(args, 'expectedAncestorId') ?? undefined,
      } as BridgeToolArgs[TTool];
    case 'reorder_children':
      return {
        parentRemId: requiredRemIdFromFields(args, ['parentRemId', 'parentId']),
        orderedChildRemIds: requiredOrderedChildRemIds(args),
        dryRun: optionalBoolean(args, 'dryRun'),
        idempotencyKey: optionalIdempotencyKey(args),
        allowPartial: optionalBoolean(args, 'allowPartial'),
      } as BridgeToolArgs[TTool];
    case 'create_rem_tree':
      return {
        parentId: requiredParentId(args),
        position: optionalAppendPosition(args),
        tree: requiredTree(args),
        idempotencyKey: optionalIdempotencyKey(args),
      } as BridgeToolArgs[TTool];
    case 'update_rem_rich':
      return {
        remId: requiredRemId(args),
        richText: requiredRichText(args),
        idempotencyKey: optionalIdempotencyKey(args),
      } as BridgeToolArgs[TTool];
    case 'set_rem_heading_level':
      return {
        remId: requiredRemId(args),
        level: requiredHeadingLevel(args),
      } as BridgeToolArgs[TTool];
    case 'set_rem_text_color':
      return {
        remId: requiredRemId(args),
        color: requiredColor(args),
      } as BridgeToolArgs[TTool];
    case 'set_rem_highlight_color':
      return {
        remId: requiredRemId(args),
        color: requiredColor(args),
      } as BridgeToolArgs[TTool];
    case 'set_text_span_color':
      return {
        remId: requiredRemId(args),
        color: requiredColor(args),
        ...optionalRangeInput(args),
      } as BridgeToolArgs[TTool];
    case 'set_text_span_highlight':
      return {
        remId: requiredRemId(args),
        color: requiredColor(args),
        ...optionalRangeInput(args),
      } as BridgeToolArgs[TTool];
    case 'set_rem_type':
      return {
        remId: requiredRemId(args),
        type: requiredRemType(args),
      } as BridgeToolArgs[TTool];
    case 'set_hide_bullet':
      return {
        remId: requiredRemId(args),
        hideBullet: requiredBoolean(args, 'hideBullet'),
      } as BridgeToolArgs[TTool];
    case 'clear_rem_formatting':
      return {
        remId: requiredRemId(args),
      } as BridgeToolArgs[TTool];
    case 'create_styled_rem_tree':
      return {
        parentId: requiredParentId(args),
        position: optionalAppendPosition(args),
        tree: requiredStyledTree(args),
        dryRun: optionalBoolean(args, 'dryRun'),
        idempotencyKey: optionalIdempotencyKey(args),
        maxDepth: optionalBoundedNumber(args, 'maxDepth'),
        maxNodeCount: optionalBoundedNumber(args, 'maxNodeCount'),
      } as BridgeToolArgs[TTool];
    case 'apply_remnote_command':
      return {
        target: requiredCommandTarget(args),
        command: requiredRemnoteCommand(args),
        args: optionalCommandArgs(args),
        dryRun: optionalBoolean(args, 'dryRun'),
        idempotencyKey: optionalIdempotencyKey(args),
      } as BridgeToolArgs[TTool];
    case 'apply_structured_note_batch':
    {
      const target = optionalStructuredBatchTarget(args);
      const parentId = optionalParentId(args);
      if (!target && !parentId) {
        throw new Error('Provide target or parentId.');
      }
      const root = optionalStructuredBatchRoot(args);
      const note = optionalStructuredBatchNote(args);
      if (!root && !note?.root && !note?.children?.length) {
        throw new Error('Provide root, note.root, or note.children.');
      }
      return {
        ...(target ? { target } : {}),
        ...(parentId ? { parentId } : {}),
        position: optionalAppendPosition(args),
        ...(root ? { root } : {}),
        ...(note ? { note } : {}),
        operation: optionalStructuredBatchOperation(args),
        dryRun: optionalBoolean(args, 'dryRun'),
        idempotencyKey: optionalIdempotencyKey(args),
        rollbackOnFailure: optionalBoolean(args, 'rollbackOnFailure', true),
        verifyAfterWrite: optionalBoolean(args, 'verifyAfterWrite'),
        maxDepth: optionalBoundedNumber(args, 'maxDepth'),
        maxNodeCount: optionalBoundedNumber(args, 'maxNodeCount'),
      } as BridgeToolArgs[TTool];
    }
    case 'create_polished_note_tree':
      return {
        parentId: requiredParentId(args),
        tree: requiredStyledTree(args),
        stylingPlan: optionalStylingPlan(args),
        dryRun: optionalBoolean(args, 'dryRun'),
        verifyAfterWrite: optionalBoolean(args, 'verifyAfterWrite'),
        idempotencyKey: optionalIdempotencyKey(args),
        maxDepth: optionalBoundedNumber(args, 'maxDepth'),
        maxNodeCount: optionalBoundedNumber(args, 'maxNodeCount'),
      } as BridgeToolArgs[TTool];
    case 'preview_markdown_note_tree':
    {
      const raw = isPlainObject(args) ? args : {};
      return {
        markdownText: requiredMarkdownText(args),
        headingMapping: isPlainObject(raw.headingMapping)
          ? (raw.headingMapping as PreviewMarkdownNoteTreeArgs['headingMapping'])
          : undefined,
        remnoteLayout: isPlainObject(raw.remnoteLayout)
          ? (raw.remnoteLayout as PreviewMarkdownNoteTreeArgs['remnoteLayout'])
          : undefined,
        mathOptions: isPlainObject(raw.mathOptions)
          ? (raw.mathOptions as PreviewMarkdownNoteTreeArgs['mathOptions'])
          : undefined,
        fidelityOptions: isPlainObject(raw.fidelityOptions)
          ? (raw.fidelityOptions as PreviewMarkdownNoteTreeArgs['fidelityOptions'])
          : undefined,
        flashcardOptions: isPlainObject(raw.flashcardOptions)
          ? (raw.flashcardOptions as PreviewMarkdownNoteTreeArgs['flashcardOptions'])
          : undefined,
        limits: isPlainObject(raw.limits)
          ? (raw.limits as PreviewMarkdownNoteTreeArgs['limits'])
          : undefined,
        stylePreset: getStringField(args, 'stylePreset') as PreviewMarkdownNoteTreeArgs['stylePreset'],
        course: getStringField(args, 'course'),
        rootHeadingLevel: getStringField(args, 'rootHeadingLevel') as PreviewMarkdownNoteTreeArgs['rootHeadingLevel'],
        sectionHeadingLevel: getStringField(args, 'sectionHeadingLevel') as PreviewMarkdownNoteTreeArgs['sectionHeadingLevel'],
        insertSiblingSpacers: optionalBoolean(args, 'insertSiblingSpacers'),
        spacerText: getStringField(args, 'spacerText'),
        majorFormulaMode: getStringField(args, 'majorFormulaMode') as PreviewMarkdownNoteTreeArgs['majorFormulaMode'],
        verifyAfterWrite: optionalBoolean(args, 'verifyAfterWrite'),
      } as BridgeToolArgs[TTool];
    }
    case 'create_note_from_markdown_tree':
    {
      const raw = isPlainObject(args) ? args : {};
      return {
        parentRemId: requiredRemId(args, 'parentRemId'),
        markdownText: requiredMarkdownText(args),
        duplicatePolicy: getStringField(args, 'duplicatePolicy') as CreateNoteFromMarkdownTreeArgs['duplicatePolicy'],
        headingMapping: isPlainObject(raw.headingMapping)
          ? (raw.headingMapping as CreateNoteFromMarkdownTreeArgs['headingMapping'])
          : undefined,
        remnoteLayout: isPlainObject(raw.remnoteLayout)
          ? (raw.remnoteLayout as CreateNoteFromMarkdownTreeArgs['remnoteLayout'])
          : undefined,
        mathOptions: isPlainObject(raw.mathOptions)
          ? (raw.mathOptions as CreateNoteFromMarkdownTreeArgs['mathOptions'])
          : undefined,
        fidelityOptions: isPlainObject(raw.fidelityOptions)
          ? (raw.fidelityOptions as CreateNoteFromMarkdownTreeArgs['fidelityOptions'])
          : undefined,
        flashcardOptions: isPlainObject(raw.flashcardOptions)
          ? (raw.flashcardOptions as CreateNoteFromMarkdownTreeArgs['flashcardOptions'])
          : undefined,
        safetyOptions: isPlainObject(raw.safetyOptions)
          ? (raw.safetyOptions as CreateNoteFromMarkdownTreeArgs['safetyOptions'])
          : undefined,
        limits: isPlainObject(raw.limits)
          ? (raw.limits as CreateNoteFromMarkdownTreeArgs['limits'])
          : undefined,
        stylePreset: getStringField(args, 'stylePreset') as CreateNoteFromMarkdownTreeArgs['stylePreset'],
        course: getStringField(args, 'course'),
        rootHeadingLevel: getStringField(args, 'rootHeadingLevel') as CreateNoteFromMarkdownTreeArgs['rootHeadingLevel'],
        sectionHeadingLevel: getStringField(args, 'sectionHeadingLevel') as CreateNoteFromMarkdownTreeArgs['sectionHeadingLevel'],
        insertSiblingSpacers: optionalBoolean(args, 'insertSiblingSpacers'),
        spacerText: getStringField(args, 'spacerText'),
        majorFormulaMode: getStringField(args, 'majorFormulaMode') as CreateNoteFromMarkdownTreeArgs['majorFormulaMode'],
        verifyAfterWrite: optionalBoolean(args, 'verifyAfterWrite'),
      } as BridgeToolArgs[TTool];
    }
    case 'append_markdown_as_rem_tree':
    {
      const raw = isPlainObject(args) ? args : {};
      return {
        targetRemId: requiredRemId(args, 'targetRemId'),
        markdownText: requiredMarkdownText(args),
        headingMapping: isPlainObject(raw.headingMapping)
          ? (raw.headingMapping as AppendMarkdownAsRemTreeArgs['headingMapping'])
          : undefined,
        remnoteLayout: isPlainObject(raw.remnoteLayout)
          ? (raw.remnoteLayout as AppendMarkdownAsRemTreeArgs['remnoteLayout'])
          : undefined,
        mathOptions: isPlainObject(raw.mathOptions)
          ? (raw.mathOptions as AppendMarkdownAsRemTreeArgs['mathOptions'])
          : undefined,
        fidelityOptions: isPlainObject(raw.fidelityOptions)
          ? (raw.fidelityOptions as AppendMarkdownAsRemTreeArgs['fidelityOptions'])
          : undefined,
        flashcardOptions: isPlainObject(raw.flashcardOptions)
          ? (raw.flashcardOptions as AppendMarkdownAsRemTreeArgs['flashcardOptions'])
          : undefined,
        safetyOptions: isPlainObject(raw.safetyOptions)
          ? (raw.safetyOptions as AppendMarkdownAsRemTreeArgs['safetyOptions'])
          : undefined,
        limits: isPlainObject(raw.limits)
          ? (raw.limits as AppendMarkdownAsRemTreeArgs['limits'])
          : undefined,
        stylePreset: getStringField(args, 'stylePreset') as AppendMarkdownAsRemTreeArgs['stylePreset'],
        course: getStringField(args, 'course'),
        rootHeadingLevel: getStringField(args, 'rootHeadingLevel') as AppendMarkdownAsRemTreeArgs['rootHeadingLevel'],
        sectionHeadingLevel: getStringField(args, 'sectionHeadingLevel') as AppendMarkdownAsRemTreeArgs['sectionHeadingLevel'],
        insertSiblingSpacers: optionalBoolean(args, 'insertSiblingSpacers'),
        spacerText: getStringField(args, 'spacerText'),
        majorFormulaMode: getStringField(args, 'majorFormulaMode') as AppendMarkdownAsRemTreeArgs['majorFormulaMode'],
        verifyAfterWrite: optionalBoolean(args, 'verifyAfterWrite'),
      } as BridgeToolArgs[TTool];
    }
    case 'create_or_replace_note_from_markdown':
    {
      const raw = isPlainObject(args) ? args : {};
      return {
        parentRemId: optionalRemId(args, 'parentRemId') ?? undefined,
        targetRemId: optionalRemId(args, 'targetRemId') ?? undefined,
        markdownText: requiredMarkdownText(args),
        mode: getStringField(args, 'mode') as CreateOrReplaceNoteFromMarkdownArgs['mode'],
        duplicatePolicy: getStringField(args, 'duplicatePolicy') as CreateOrReplaceNoteFromMarkdownArgs['duplicatePolicy'],
        headingMapping: isPlainObject(raw.headingMapping)
          ? (raw.headingMapping as CreateOrReplaceNoteFromMarkdownArgs['headingMapping'])
          : undefined,
        remnoteLayout: isPlainObject(raw.remnoteLayout)
          ? (raw.remnoteLayout as CreateOrReplaceNoteFromMarkdownArgs['remnoteLayout'])
          : undefined,
        mathOptions: isPlainObject(raw.mathOptions)
          ? (raw.mathOptions as CreateOrReplaceNoteFromMarkdownArgs['mathOptions'])
          : undefined,
        fidelityOptions: isPlainObject(raw.fidelityOptions)
          ? (raw.fidelityOptions as CreateOrReplaceNoteFromMarkdownArgs['fidelityOptions'])
          : undefined,
        flashcardOptions: isPlainObject(raw.flashcardOptions)
          ? (raw.flashcardOptions as CreateOrReplaceNoteFromMarkdownArgs['flashcardOptions'])
          : undefined,
        safetyOptions: isPlainObject(raw.safetyOptions)
          ? (raw.safetyOptions as CreateOrReplaceNoteFromMarkdownArgs['safetyOptions'])
          : undefined,
        limits: isPlainObject(raw.limits)
          ? (raw.limits as CreateOrReplaceNoteFromMarkdownArgs['limits'])
          : undefined,
        stylePreset: getStringField(args, 'stylePreset') as CreateOrReplaceNoteFromMarkdownArgs['stylePreset'],
        course: getStringField(args, 'course'),
        rootHeadingLevel: getStringField(args, 'rootHeadingLevel') as CreateOrReplaceNoteFromMarkdownArgs['rootHeadingLevel'],
        sectionHeadingLevel: getStringField(args, 'sectionHeadingLevel') as CreateOrReplaceNoteFromMarkdownArgs['sectionHeadingLevel'],
        insertSiblingSpacers: optionalBoolean(args, 'insertSiblingSpacers'),
        spacerText: getStringField(args, 'spacerText'),
        majorFormulaMode: getStringField(args, 'majorFormulaMode') as CreateOrReplaceNoteFromMarkdownArgs['majorFormulaMode'],
        verifyAfterWrite: optionalBoolean(args, 'verifyAfterWrite'),
      } as BridgeToolArgs[TTool];
    }
    case 'apply_style_plan':
      return {
        operations: requiredStyleOperations(args),
        continueOnError: optionalBoolean(args, 'continueOnError', true),
        verifyAfterWrite: optionalBoolean(args, 'verifyAfterWrite'),
        dryRun: optionalBoolean(args, 'dryRun'),
        idempotencyKey: optionalIdempotencyKey(args),
      } as BridgeToolArgs[TTool];
    case 'verify_note_design':
      return {
        rootRemId: requiredRemId(args, 'rootRemId'),
        expectedStyleMap: requiredExpectedStyleMap(args),
        expectations: isPlainObject(args) && Array.isArray(args.expectations) ? (args.expectations as VerifyNoteDesignArgs['expectations']) : undefined,
        expectedStyles: isPlainObject(args) && Array.isArray(args.expectedStyles) ? (args.expectedStyles as VerifyNoteDesignArgs['expectedStyles']) : undefined,
        expected: isPlainObject(args) && isPlainObject(args.expected) ? (args.expected as VerifyNoteDesignArgs['expected']) : undefined,
        stylePreset: getStringField(args, 'stylePreset') as VerifyNoteDesignArgs['stylePreset'],
        course: getStringField(args, 'course'),
        rootHeadingLevel: getStringField(args, 'rootHeadingLevel') as VerifyNoteDesignArgs['rootHeadingLevel'],
        sectionHeadingLevel: getStringField(args, 'sectionHeadingLevel') as VerifyNoteDesignArgs['sectionHeadingLevel'],
        insertSiblingSpacers: optionalBoolean(args, 'insertSiblingSpacers'),
        spacerText: getStringField(args, 'spacerText'),
        majorFormulaMode: getStringField(args, 'majorFormulaMode') as VerifyNoteDesignArgs['majorFormulaMode'],
        verifyAfterWrite: optionalBoolean(args, 'verifyAfterWrite'),
      } as VerifyNoteDesignArgs as BridgeToolArgs[TTool];
    case 'analyze_note_design':
      return {
        rootRemId: optionalRemId(args, 'rootRemId') ?? undefined,
        sampleRemId: optionalRemId(args, 'sampleRemId') ?? undefined,
        maxDepth: optionalBoundedNumber(args, 'maxDepth'),
        maxNodes: optionalBoundedNumber(args, 'maxNodes'),
      } as BridgeToolArgs[TTool];
    case 'save_note_design_template':
    {
      const raw = isPlainObject(args) ? args : {};
      return {
        templateId: getStringField(args, 'templateId')?.trim() || undefined,
        name: requiredTextField(args, 'name'),
        description: getStringField(args, 'description')?.trim() || undefined,
        sourceRemId: optionalRemId(args, 'sourceRemId') ?? undefined,
        rootRemId: optionalRemId(args, 'rootRemId') ?? undefined,
        rules: isPlainObject(raw.rules) ? (raw.rules as unknown as BridgeToolArgs['save_note_design_template']['rules']) : undefined,
        overwrite: optionalBoolean(args, 'overwrite'),
      } as BridgeToolArgs[TTool];
    }
    case 'list_note_design_templates':
      return {
        includeRules: optionalBoolean(args, 'includeRules'),
      } as BridgeToolArgs[TTool];
    case 'preview_note_design_plan':
    {
      const raw = isPlainObject(args) ? args : {};
      return {
        templateId: getStringField(args, 'templateId')?.trim() || undefined,
        templateJson: getStringField(args, 'templateJson'),
        targetRemId: optionalRemId(args, 'targetRemId') ?? undefined,
        parentId: optionalParentId(args) ?? undefined,
        title: getStringField(args, 'title')?.trim() || undefined,
        content: getStringField(args, 'content'),
        mode: getStringField(args, 'mode') as PreviewNoteDesignPlanArgs['mode'],
        rules: isPlainObject(raw.rules) ? (raw.rules as unknown as PreviewNoteDesignPlanArgs['rules']) : undefined,
        stylePreset: getStringField(args, 'stylePreset') as PreviewNoteDesignPlanArgs['stylePreset'],
      } as BridgeToolArgs[TTool];
    }
    case 'export_note_design_template':
      return {
        templateId: requiredTextField(args, 'templateId'),
      } as BridgeToolArgs[TTool];
    case 'import_note_design_template':
      return {
        templateJson: requiredTextField(args, 'templateJson'),
        overwrite: optionalBoolean(args, 'overwrite'),
      } as BridgeToolArgs[TTool];
    case 'create_designed_note_tree':
    {
      const raw = isPlainObject(args) ? args : {};
      const rawContent = raw.content;
      return {
        parentId: requiredParentId(args),
        title: requiredTextField(args, 'title'),
        content: typeof rawContent === 'string' || isPlainObject(rawContent)
          ? rawContent as CreateDesignedNoteTreeArgs['content']
          : requiredTextField(args, 'content'),
        templateId: getStringField(args, 'templateId')?.trim() || undefined,
        writingMode: getStringField(args, 'writingMode') as CreateDesignedNoteTreeArgs['writingMode'],
        dryRun: optionalBoolean(args, 'dryRun'),
        verifyAfterWrite: optionalBoolean(args, 'verifyAfterWrite'),
        performanceTargetMs: optionalBoundedNumber(args, 'performanceTargetMs'),
        idempotencyKey: optionalIdempotencyKey(args),
        maxDepth: optionalBoundedNumber(args, 'maxDepth'),
        maxNodeCount: optionalBoundedNumber(args, 'maxNodeCount'),
      } as BridgeToolArgs[TTool];
    }
    case 'update_note_with_design':
    {
      const raw = isPlainObject(args) ? args : {};
      const rawContent = raw.content;
      return {
        targetRemId: requiredRemId(args, 'targetRemId'),
        mode: requiredTextField(args, 'mode') as UpdateNoteWithDesignArgs['mode'],
        templateId: getStringField(args, 'templateId')?.trim() || undefined,
        content: typeof rawContent === 'string' || isPlainObject(rawContent)
          ? rawContent as UpdateNoteWithDesignArgs['content']
          : undefined,
        markdownText: getStringField(args, 'markdownText'),
        styleOperations: Array.isArray(raw.styleOperations)
          ? raw.styleOperations as UpdateNoteWithDesignArgs['styleOperations']
          : undefined,
        dryRun: optionalBoolean(args, 'dryRun'),
        approved: optionalBoolean(args, 'approved'),
        verifyAfterWrite: optionalBoolean(args, 'verifyAfterWrite'),
        idempotencyKey: optionalIdempotencyKey(args),
      } as BridgeToolArgs[TTool];
    }
    case 'verify_note_against_design':
    {
      const raw = isPlainObject(args) ? args : {};
      return {
        rootRemId: requiredRemId(args, 'rootRemId'),
        templateId: getStringField(args, 'templateId')?.trim() || undefined,
        rules: isPlainObject(raw.rules) ? (raw.rules as unknown as VerifyNoteAgainstDesignArgs['rules']) : undefined,
        expectedStyleMap: isPlainObject(raw.expectedStyleMap)
          ? (raw.expectedStyleMap as VerifyNoteAgainstDesignArgs['expectedStyleMap'])
          : undefined,
      } as BridgeToolArgs[TTool];
    }
    case 'repair_note_design':
    {
      const raw = isPlainObject(args) ? args : {};
      return {
        rootRemId: requiredRemId(args, 'rootRemId'),
        templateId: getStringField(args, 'templateId')?.trim() || undefined,
        operations: Array.isArray(raw.operations) ? raw.operations as BridgeToolArgs['repair_note_design']['operations'] : undefined,
        dryRun: optionalBoolean(args, 'dryRun', true),
        approved: optionalBoolean(args, 'approved'),
        verifyAfterWrite: optionalBoolean(args, 'verifyAfterWrite'),
        idempotencyKey: optionalIdempotencyKey(args),
      } as BridgeToolArgs[TTool];
    }
    case 'create_card_set_from_note':
      return {
        rootRemId: requiredRemId(args, 'rootRemId'),
        parentId: optionalParentId(args) ?? undefined,
        maxCards: optionalBoundedNumber(args, 'maxCards'),
        dryRun: optionalBoolean(args, 'dryRun'),
        direction: optionalPracticeDirection(args),
        idempotencyKey: optionalIdempotencyKey(args),
      } as BridgeToolArgs[TTool];
    case 'create_flashcards_from_markdown':
      return {
        parentId: requiredParentId(args),
        markdownText: requiredMarkdownText(args),
        marker: getStringField(args, 'marker') as CreateFlashcardsFromMarkdownArgs['marker'],
        maxCards: optionalBoundedNumber(args, 'maxCards'),
        dryRun: optionalBoolean(args, 'dryRun'),
        direction: optionalPracticeDirection(args),
        idempotencyKey: optionalIdempotencyKey(args),
      } as BridgeToolArgs[TTool];
    case 'create_cloze_cards_from_note':
      return {
        rootRemId: requiredRemId(args, 'rootRemId'),
        parentId: optionalParentId(args) ?? undefined,
        maxCards: optionalBoundedNumber(args, 'maxCards'),
        dryRun: optionalBoolean(args, 'dryRun'),
        direction: optionalPracticeDirection(args),
        idempotencyKey: optionalIdempotencyKey(args),
      } as BridgeToolArgs[TTool];
    case 'verify_card_set':
    {
      const raw = isPlainObject(args) ? args : {};
      return {
        rootRemId: requiredRemId(args, 'rootRemId'),
        expectedCards: Array.isArray(raw.expectedCards)
          ? raw.expectedCards as BridgeToolArgs['verify_card_set']['expectedCards']
          : undefined,
        maxCards: optionalBoundedNumber(args, 'maxCards'),
        maxNodes: optionalBoundedNumber(args, 'maxNodes'),
        maxDepth: optionalBoundedNumber(args, 'maxDepth'),
        timeoutMs: optionalBoundedNumber(args, 'timeoutMs'),
      } as BridgeToolArgs[TTool];
    }
    case 'repair_card_set':
    {
      const raw = isPlainObject(args) ? args : {};
      return {
        rootRemId: requiredRemId(args, 'rootRemId'),
        cards: Array.isArray(raw.cards) ? raw.cards as BridgeToolArgs['repair_card_set']['cards'] : undefined,
        dryRun: optionalBoolean(args, 'dryRun', true),
        approved: optionalBoolean(args, 'approved'),
        direction: optionalPracticeDirection(args),
        idempotencyKey: optionalIdempotencyKey(args),
      } as BridgeToolArgs[TTool];
    }
    case 'create_basic_flashcard':
    case 'create_concept_card':
    case 'create_descriptor_card':
      return {
        parentId: requiredParentId(args),
        front: requiredTextField(args, 'front'),
        back: requiredTextField(args, 'back'),
        direction: optionalPracticeDirection(args),
        idempotencyKey: optionalIdempotencyKey(args),
        verifyAfterWrite: optionalBoolean(args, 'verifyAfterWrite', true),
      } as BridgeToolArgs[TTool];
    case 'create_cloze_card':
      return {
        parentId: requiredParentId(args),
        text: requiredTextField(args, 'text'),
        clozeText: getStringField(args, 'clozeText')?.trim() || undefined,
        direction: optionalPracticeDirection(args),
        idempotencyKey: optionalIdempotencyKey(args),
        verifyAfterWrite: optionalBoolean(args, 'verifyAfterWrite', true),
      } as BridgeToolArgs[TTool];
    case 'create_multiple_choice_card':
      return {
        parentId: requiredParentId(args),
        question: requiredTextField(args, 'question'),
        choices: requiredStringArray(args, 'choices', 20),
        correctChoice: requiredTextField(args, 'correctChoice'),
        direction: optionalPracticeDirection(args),
        idempotencyKey: optionalIdempotencyKey(args),
        verifyAfterWrite: optionalBoolean(args, 'verifyAfterWrite', true),
      } as BridgeToolArgs[TTool];
    case 'create_list_answer_card':
      return {
        parentId: requiredParentId(args),
        prompt: requiredTextField(args, 'prompt'),
        items: requiredStringArray(args, 'items', 50),
        direction: optionalPracticeDirection(args),
        idempotencyKey: optionalIdempotencyKey(args),
        verifyAfterWrite: optionalBoolean(args, 'verifyAfterWrite', true),
      } as BridgeToolArgs[TTool];
    case 'replace_rem':
      return {
        remId: requiredRemId(args),
        markdown: requiredMarkdown(args),
        dryRun: optionalBoolean(args, 'dryRun'),
        idempotencyKey: optionalIdempotencyKey(args),
        expectedPlainText: getStringField(args, 'expectedPlainText')?.trim(),
      } as BridgeToolArgs[TTool];
    case 'delete_rem_by_id':
      return {
        remId: requiredRemId(args),
        expectedParentId: optionalRemId(args, 'expectedParentId') ?? undefined,
        expectedAncestorId: optionalRemId(args, 'expectedAncestorId') ?? undefined,
        confirmTitle: getStringField(args, 'confirmTitle')?.trim(),
        dryRun: optionalBoolean(args, 'dryRun', true),
        idempotencyKey: optionalIdempotencyKey(args),
      } as BridgeToolArgs[TTool];
    default:
      throw new Error('Unknown tool.');
  }
}
