import type {
  CreateOrReplaceNoteFromMarkdownArgs,
  MarkdownImportHeadingMapping,
  MarkdownImportRemnoteLayout,
  NoteStylePreset,
  NoteStylePresetFields,
  RemHeadingLevel,
  StyledRemTreeNode,
} from './protocol-write-args.js';

export const NUCLEAR_PHYSICS_STYLE_PRESET = 'nuclear_physics_h1_h3_spacer_math' as const;
export const NUCLEAR_PHYSICS_SPACER_TEXT = '\u200b';
export const DEFAULT_NUCLEAR_PHYSICS_COURSE = 'Nuclear Physics I';

export const NOTE_STYLE_PRESETS: readonly NoteStylePreset[] = [NUCLEAR_PHYSICS_STYLE_PRESET];

export interface NormalizedNuclearPhysicsPreset {
  stylePreset: typeof NUCLEAR_PHYSICS_STYLE_PRESET;
  course: string;
  rootHeadingLevel: 'H1';
  sectionHeadingLevel: 'H3';
  insertSiblingSpacers: boolean;
  spacerText: string;
  majorFormulaMode: 'mathBlockRem';
  verifyAfterWrite: boolean;
}

export function isNoteStylePreset(value: unknown): value is NoteStylePreset {
  return value === NUCLEAR_PHYSICS_STYLE_PRESET;
}

export function normalizeNuclearPhysicsPresetFields(
  fields: NoteStylePresetFields = {}
): NormalizedNuclearPhysicsPreset {
  return {
    stylePreset: NUCLEAR_PHYSICS_STYLE_PRESET,
    course: fields.course?.trim() || DEFAULT_NUCLEAR_PHYSICS_COURSE,
    rootHeadingLevel: 'H1',
    sectionHeadingLevel: 'H3',
    insertSiblingSpacers: fields.insertSiblingSpacers ?? true,
    spacerText: fields.spacerText ?? NUCLEAR_PHYSICS_SPACER_TEXT,
    majorFormulaMode: 'mathBlockRem',
    verifyAfterWrite: fields.verifyAfterWrite ?? true,
  };
}

export function normalizeStylePresetFields(
  fields: NoteStylePresetFields = {}
): NormalizedNuclearPhysicsPreset | null {
  if (fields.stylePreset !== NUCLEAR_PHYSICS_STYLE_PRESET) {
    return null;
  }

  return normalizeNuclearPhysicsPresetFields(fields);
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
  preset: NormalizedNuclearPhysicsPreset
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
  if (fields.stylePreset === NUCLEAR_PHYSICS_STYLE_PRESET) {
    return applyNuclearPhysicsStylePresetToTree(tree, fields);
  }

  return tree;
}

export function applyStylePresetToMarkdownArgs<T extends CreateOrReplaceNoteFromMarkdownArgs>(
  args: T
): T {
  if (args.stylePreset !== NUCLEAR_PHYSICS_STYLE_PRESET) {
    return args;
  }

  const preset = normalizeNuclearPhysicsPresetFields(args);
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
