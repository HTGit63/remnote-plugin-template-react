import type {
  CreateOrReplaceNoteFromMarkdownArgs,
  MarkdownImportHeadingMapping,
  MarkdownImportRemnoteLayout,
  NoteStylePreset,
  NoteStylePresetFields,
  RemHeadingLevel,
  StyledRemTreeNode,
} from './protocol-write-args.js';

export const CLEAN_ACADEMIC_STYLE_PRESET = 'clean_academic' as const;
export const EXAM_READY_STYLE_PRESET = 'exam_ready' as const;
export const COLORFUL_STUDY_STYLE_PRESET = 'colorful_study' as const;
export const MINIMAL_STYLE_PRESET = 'minimal' as const;
export const FORMULA_HEAVY_STYLE_PRESET = 'formula_heavy' as const;
export const NUCLEAR_PHYSICS_STYLE_PRESET = 'nuclear_physics_h1_h3_spacer_math' as const;
export const DEFAULT_NOTE_STYLE_PRESET = CLEAN_ACADEMIC_STYLE_PRESET;
export const NUCLEAR_PHYSICS_SPACER_TEXT = '\u200b';
export const DEFAULT_NUCLEAR_PHYSICS_COURSE = 'Nuclear Physics I';

export const NOTE_STYLE_PRESETS: readonly NoteStylePreset[] = [
  CLEAN_ACADEMIC_STYLE_PRESET,
  EXAM_READY_STYLE_PRESET,
  COLORFUL_STUDY_STYLE_PRESET,
  MINIMAL_STYLE_PRESET,
  FORMULA_HEAVY_STYLE_PRESET,
  NUCLEAR_PHYSICS_STYLE_PRESET,
];

export interface NormalizedNoteStylePreset {
  stylePreset: NoteStylePreset;
  course: string;
  rootHeadingLevel: 'H1';
  sectionHeadingLevel: 'H3';
  insertSiblingSpacers: boolean;
  spacerText: string;
  majorFormulaMode: 'mathBlockRem';
  verifyAfterWrite: boolean;
  emphasis: 'quiet' | 'exam' | 'colorful' | 'minimal' | 'formula';
}

export function isNoteStylePreset(value: unknown): value is NoteStylePreset {
  return typeof value === 'string' && (NOTE_STYLE_PRESETS as readonly string[]).includes(value);
}

export function normalizeNuclearPhysicsPresetFields(
  fields: NoteStylePresetFields = {}
): NormalizedNoteStylePreset {
  return normalizeStylePresetFields({
    ...fields,
    stylePreset: NUCLEAR_PHYSICS_STYLE_PRESET,
  }) as NormalizedNoteStylePreset;
}

export function normalizeStylePresetFields(
  fields: NoteStylePresetFields = {}
): NormalizedNoteStylePreset | null {
  if (fields.stylePreset && !isNoteStylePreset(fields.stylePreset)) {
    return null;
  }
  const stylePreset = fields.stylePreset ?? DEFAULT_NOTE_STYLE_PRESET;
  const minimal = stylePreset === MINIMAL_STYLE_PRESET;
  const formulaFocused = stylePreset === FORMULA_HEAVY_STYLE_PRESET || stylePreset === NUCLEAR_PHYSICS_STYLE_PRESET;
  const examFocused = stylePreset === EXAM_READY_STYLE_PRESET;
  const colorful = stylePreset === COLORFUL_STUDY_STYLE_PRESET;
  return {
    stylePreset,
    course: fields.course?.trim() || DEFAULT_NUCLEAR_PHYSICS_COURSE,
    rootHeadingLevel: 'H1',
    sectionHeadingLevel: 'H3',
    insertSiblingSpacers: fields.insertSiblingSpacers ?? !minimal,
    spacerText: fields.spacerText ?? NUCLEAR_PHYSICS_SPACER_TEXT,
    majorFormulaMode: 'mathBlockRem',
    verifyAfterWrite: fields.verifyAfterWrite ?? true,
    emphasis: minimal
      ? 'minimal'
      : formulaFocused
        ? 'formula'
        : examFocused
          ? 'exam'
          : colorful
            ? 'colorful'
            : 'quiet',
  };
}

function isMathOrCardNode(node: StyledRemTreeNode): boolean {
  const type = node.type ?? 'rem';
  return type === 'mathBlock' || type === 'inlineMath' || type.endsWith('Card');
}

function nodeText(node: StyledRemTreeNode): string {
  return node.text ?? node.title ?? node.latex ?? '';
}

export function isNuclearPhysicsSpacerNode(node: StyledRemTreeNode): boolean {
  const text = nodeText(node);
  return (
    (text === NUCLEAR_PHYSICS_SPACER_TEXT || text.trim().length === 0) &&
    !isMathOrCardNode(node) &&
    !(node.children?.length)
  );
}

function spacerNode(index: number, spacerText: string): StyledRemTreeNode {
  return {
    clientNodeId: `nuclear-spacer-${index}`,
    type: 'rem',
    text: spacerText,
  };
}

function withHeading(node: StyledRemTreeNode, headingLevel: RemHeadingLevel): StyledRemTreeNode {
  return {
    ...node,
    style: {
      ...(node.style ?? {}),
      headingLevel,
    },
  };
}

function normalizeNestedNode(node: StyledRemTreeNode): StyledRemTreeNode {
  return {
    ...node,
    children: node.children?.map(normalizeNestedNode),
  };
}

function normalizeRootChildren(
  children: readonly StyledRemTreeNode[],
  preset: NormalizedNoteStylePreset
): StyledRemTreeNode[] {
  const output: StyledRemTreeNode[] = [];
  let sectionCount = 0;
  let spacerCount = 0;

  for (const child of children) {
    if (isNuclearPhysicsSpacerNode(child)) {
      if (sectionCount > 0 && output.length > 0 && !isNuclearPhysicsSpacerNode(output[output.length - 1])) {
        output.push({
          ...child,
          text: preset.spacerText,
          title: undefined,
          children: undefined,
        });
      }
      continue;
    }

    const normalizedChild = normalizeNestedNode(child);
    const isSection = !isMathOrCardNode(normalizedChild);
    if (isSection) {
      if (
        preset.insertSiblingSpacers &&
        sectionCount > 0 &&
        output.length > 0 &&
        !isNuclearPhysicsSpacerNode(output[output.length - 1])
      ) {
        output.push(spacerNode((spacerCount += 1), preset.spacerText));
      }
      output.push(withHeading(normalizedChild, preset.sectionHeadingLevel));
      sectionCount += 1;
      continue;
    }

    output.push(normalizedChild);
  }

  return output;
}

export function applyNuclearPhysicsStylePresetToTree(
  tree: StyledRemTreeNode,
  fields: NoteStylePresetFields = {}
): StyledRemTreeNode {
  const preset = normalizeNuclearPhysicsPresetFields(fields);
  return withHeading(
    {
      ...tree,
      children: normalizeRootChildren(tree.children ?? [], preset),
    },
    preset.rootHeadingLevel
  );
}

export function applyStylePresetToTree(
  tree: StyledRemTreeNode,
  fields: NoteStylePresetFields = {}
): StyledRemTreeNode {
  const preset = normalizeStylePresetFields(fields);
  if (!preset || !fields.stylePreset) {
    return tree;
  }

  return withHeading(
    {
      ...tree,
      children: normalizeRootChildren(tree.children ?? [], preset),
    },
    preset.rootHeadingLevel
  );
}

export function applyStylePresetToMarkdownArgs<T extends CreateOrReplaceNoteFromMarkdownArgs>(
  args: T
): T {
  if (!args.stylePreset) {
    return args;
  }

  const preset = normalizeStylePresetFields(args);
  if (!preset) {
    return args;
  }
  const headingMapping: MarkdownImportHeadingMapping = {
    ...(args.headingMapping ?? {}),
    rootHeadingLevel: preset.rootHeadingLevel,
    sectionHeadingLevel: preset.sectionHeadingLevel,
    subsectionHeadingLevel: preset.sectionHeadingLevel,
  };
  const remnoteLayout: MarkdownImportRemnoteLayout = {
    ...(args.remnoteLayout ?? {}),
    insertSpacerBetweenSections: preset.insertSiblingSpacers,
    spacerText: preset.spacerText,
  };

  return {
    ...args,
    course: preset.course,
    rootHeadingLevel: preset.rootHeadingLevel,
    sectionHeadingLevel: preset.sectionHeadingLevel,
    insertSiblingSpacers: preset.insertSiblingSpacers,
    spacerText: preset.spacerText,
    majorFormulaMode: preset.majorFormulaMode,
    verifyAfterWrite: preset.verifyAfterWrite,
    headingMapping,
    remnoteLayout,
    safetyOptions: {
      ...(args.safetyOptions ?? {}),
      verifyAfterWrite: args.safetyOptions?.verifyAfterWrite ?? preset.verifyAfterWrite,
    },
  };
}
