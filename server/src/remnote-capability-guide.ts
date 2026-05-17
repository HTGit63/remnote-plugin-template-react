export type RemnoteCapabilityGuideSection =
  | 'all'
  | 'core_model'
  | 'documents_folders'
  | 'references_tags_portals'
  | 'formatting_design'
  | 'flashcards'
  | 'bridge_workflow';

export interface RemnoteCapabilityGuideSource {
  title: string;
  url: string;
}

export interface RemnoteCapabilityGuideBlock {
  section: Exclude<RemnoteCapabilityGuideSection, 'all'>;
  title: string;
  facts: string[];
  bridgeUse: string[];
}

export const REMNOTE_CAPABILITY_GUIDE_VERSION = '2026-05-17.1';

export const REMNOTE_CAPABILITY_GUIDE_SOURCES: RemnoteCapabilityGuideSource[] = [
  {
    title: 'Rems',
    url: 'https://help.remnote.com/en/articles/8017859-rems',
  },
  {
    title: 'Documents and Folders',
    url: 'https://help.remnote.com/en/articles/6030703-documents-and-folders',
  },
  {
    title: "What's the difference between a document, a folder, and a top-level Rem?",
    url: 'https://help.remnote.com/en/articles/8032170-what-s-the-difference-between-a-document-a-folder-and-a-top-level-rem',
  },
  {
    title: 'Outlines and Terminology',
    url: 'https://help.remnote.com/en/articles/8196578-outlines-and-terminology',
  },
  {
    title: "What's the difference between References, Tags, and Portals?",
    url: 'https://help.remnote.com/en/articles/6634227-what-s-the-difference-between-references-tags-and-portals',
  },
  {
    title: 'Formatting Your Notes',
    url: 'https://help.remnote.com/en/articles/6030579-formatting-your-notes',
  },
  {
    title: 'Writing Equations with LaTeX',
    url: 'https://help.remnote.com/en/articles/6565191-writing-equations-with-latex',
  },
  {
    title: 'Hiding Bullets',
    url: 'https://help.remnote.com/en/articles/10113772-hiding-bullets',
  },
  {
    title: 'Keyboard Shortcuts',
    url: 'https://help.remnote.com/en/articles/7893440-keyboard-shortcuts',
  },
  {
    title: 'RemNote Plugin API: RichTextNamespace',
    url: 'https://plugins.remnote.com/api/classes/RichTextNamespace',
  },
  {
    title: 'RemNote Plugin API: RemNamespace',
    url: 'https://plugins.remnote.com/api/classes/RemNamespace',
  },
  {
    title: 'Creating Flashcards',
    url: 'https://help.remnote.com/en/articles/6025481-creating-flashcards',
  },
  {
    title: 'Creating Concept/Descriptor Flashcards',
    url: 'https://help.remnote.com/en/articles/6751778-creating-concept-descriptor-flashcards',
  },
  {
    title: 'RemNote forum: How to set font color?',
    url: 'https://forum.remnote.io/t/how-to-set-font-color/3147',
  },
];

const GUIDE_BLOCKS: RemnoteCapabilityGuideBlock[] = [
  {
    section: 'core_model',
    title: 'Rems and hierarchy',
    facts: [
      'A Rem is the atomic unit of information in RemNote. Most Rems appear as bullet points, but documents, folders, tags, table rows, uploaded files, and properties are also Rems.',
      'A Rem can have one parent and any number of children. Indentation is parent/child structure, not only visual styling.',
      'Ancestors are above a Rem in the hierarchy; descendants are below it. A top-level Rem has no parent.',
      'Flashcards are generated from Rems. The card is not a separate Rem; editing or deleting the source Rem changes its associated flashcards.',
    ],
    bridgeUse: [
      'Use tree tools when the user asks for outline notes. Each nested child in the tool payload becomes an indented child Rem.',
      'When reading or writing children, preserve order and return explicit Rem IDs so later tools can verify or update exact targets.',
      'Do not treat headings or hidden bullets as hierarchy. Parent IDs and child IDs are the real structure.',
    ],
  },
  {
    section: 'documents_folders',
    title: 'Documents, folders, and top-level Rems',
    facts: [
      'A document is a Rem marked as a page-like zoom point for working with that Rem and its children.',
      'A folder is also a Rem, but its role is to organize documents and folders. Folders should contain documents or folders, not ordinary note Rems.',
      'A top-level Rem has no parent. It may be a document, folder, normal concept Rem, or none of those.',
      'Any Rem can be marked as a document. Folder creation is UI-supported in RemNote, but this bridge keeps `create_folder` as SDK_UNSUPPORTED until the installed SDK exposes a safe creation API.',
    ],
    bridgeUse: [
      'Use `create_document` for page-like notes. Use ordinary Rem trees inside documents for content.',
      'Never fake folders by creating a normal Rem and calling it a folder. Return SDK_UNSUPPORTED when the SDK cannot create a real folder.',
      'When the user wants a complete note inside an existing document/folder, target that existing Rem as `parentId` and use `create_polished_note_tree` or `apply_structured_note_batch`.',
    ],
  },
  {
    section: 'references_tags_portals',
    title: 'References, tags, and portals',
    facts: [
      'A reference is a link to another Rem and creates a backlink.',
      'A tag says the current Rem is a type of another Rem, and also creates backlinks plus access to tag-defined properties/templates.',
      'A portal displays another Rem and optional descendants inside the current context; editing the portal content edits the original Rem.',
    ],
    bridgeUse: [
      'Prefer plain text unless the tool schema explicitly supports references, tags, or portals.',
      'When a user asks to move content into multiple places, do not duplicate silently. Explain whether they want a copy or a portal-style relation; portal creation is not exposed by the current bridge tools.',
      'Use search and breadcrumbs before updating referenced concepts so the target Rem is unambiguous.',
    ],
  },
  {
    section: 'formatting_design',
    title: 'Formatting and note design',
    facts: [
      'RemNote supports inline formatting such as bold, italic, underline, inline code, text color/highlight, LaTeX, links, references, and tags.',
      'Whole Rem formatting includes headings, whole-Rem highlights, list-item mode, quote-like display, and hidden bullets.',
      '`set_rem_highlight_color` applies whole-Rem background highlight. `set_text_span_highlight` applies selected-text background highlight only.',
      '`set_text_span_color` applies selected text font color. `set_rem_text_color` applies font color to every text segment in a Rem. Font color uses raw rich-text field `tc`; text highlight uses raw field `h`.',
      'Hidden bullets can improve document appearance, but visual heading behavior is not always the same as true indentation hierarchy.',
      'Installed SDK `plugin.richText.text(text, ["Blue"])` writes rich-text field `h`, which is highlight/background. The bridge does not use that path for font color.',
      'The installed SDK color enum supports Red, Orange, Yellow, Green, Blue, and Purple. Gray, Brown, and Pink return SDK_UNSUPPORTED.',
    ],
    bridgeUse: [
      'For polished notes, prefer `create_polished_note_tree` or `apply_structured_note_batch`, then verify with `verify_note_design` or `get_rem_rich`.',
      'For formatting existing Rems, prefer `apply_style_plan`, then verify with `get_rem_rich`.',
      'Use `richText` spans or LaTeX spans for math; `$...$`, `\\(...\\)`, `$$...$$`, and `\\[...\\]` are parsed by the structured writer. Rich math block uses plugin.richText.latex(text, true).',
      'Use colors sparingly for semantic emphasis. If Pink, Gray, Brown, or normal type reset is requested but unsupported by installed SDK, return SDK_UNSUPPORTED instead of guessing.',
    ],
  },
  {
    section: 'flashcards',
    title: 'Flashcards and Concept/Descriptor structure',
    facts: [
      'Basic cards use front/back content. Cloze cards hide selected text within a source Rem.',
      'Concepts represent things or ideas and are shown in bold. Descriptors represent properties/questions about a concept and should be indented under it.',
      'Concept cards and descriptor cards have different learning behavior; descriptors are forward-only by default in RemNote UI conventions.',
      'Multiple-choice cards are best for exam-practice contexts, not as the only learning format.',
    ],
    bridgeUse: [
      'Only create cards when the user asks for memorization, active recall, or exam practice.',
      'Prefer Concept/Descriptor structure for durable study notes. Use cloze cards only where exact wording matters.',
      'For a complete study note, create explanatory Rems first, then add explicit card nodes only for high-value facts.',
    ],
  },
  {
    section: 'bridge_workflow',
    title: 'Bridge tool workflow for ChatGPT/Vivy',
    facts: [
      'Read-only tools are safe for context gathering and should not require RemNote approval.',
      'Creating under an existing Rem, updating an existing Rem, moving/reordering existing Rems, replacing text, and deleting Rems require explicit RemNote approval.',
      'Creating a top-level Rem/document is allowed only inside the configured permission scope. Workspace-level create requires workspace_allowed scope.',
      'Preferred delete tool is `delete_rem_by_id`. It defaults to dryRun, requires ID-based guards for real deletion, and verifies the Rem cannot be read afterward.',
      '`delete_focused_rem` and `delete_selected_rem` are deprecated/private because UI focus or selection can point at the wrong Rem. Do not use them.',
      'Preferred high-level note writers are `create_polished_note_tree` and `apply_structured_note_batch`; they support idempotency, verification, styled nested nodes, flashcards, and math.',
      '`create_styled_rem_tree` is a fallback/developer tool for direct styled tree creation. Do not use it as the normal full-note path.',
    ],
    bridgeUse: [
      'For prepared notes, first read context, then call `create_polished_note_tree` or `apply_structured_note_batch` once with the whole designed tree.',
      'For safer execution, dry-run supported batch flows, then apply with an `idempotencyKey`, `rollbackOnFailure: true` where available, and `verifyAfterWrite: true`.',
      'For styling existing Rems, use `apply_style_plan`. For checking design after a write, use `verify_note_design`.',
      'For deletion, call `delete_rem_by_id` with `dryRun: true`, inspect breadcrumbs/childCount, then retry with `dryRun: false` plus expectedParentId or expectedAncestorId.',
      'Use `debug_get_raw_rich_text` only when raw RemNote rich-text fields such as `tc` and `h` need inspection.',
      'Use low-level tools for repair and inspection, not as the default path for full note generation.',
    ],
  },
];

export function getRemnoteCapabilityGuide(section: RemnoteCapabilityGuideSection = 'all') {
  const blocks = section === 'all'
    ? GUIDE_BLOCKS
    : GUIDE_BLOCKS.filter((block) => block.section === section);

  return {
    version: REMNOTE_CAPABILITY_GUIDE_VERSION,
    section,
    blocks,
    sources: REMNOTE_CAPABILITY_GUIDE_SOURCES,
    recommendedStructuredNoteTool: 'create_polished_note_tree',
    recommendedAtomicBatchTool: 'apply_structured_note_batch',
    recommendedStyleTool: 'apply_style_plan',
    recommendedVerificationTool: 'verify_note_design',
    preferredDeleteTool: 'delete_rem_by_id',
    fallbackDeveloperTools: ['create_styled_rem_tree'],
    deprecatedPrivateTools: ['delete_focused_rem', 'delete_selected_rem', 'delete_rem'],
    installedSdkTextColorFormats: ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple'],
    installedSdkUnsupported: ['create_folder', 'Gray text color', 'Brown text color', 'Pink text color'],
  };
}
