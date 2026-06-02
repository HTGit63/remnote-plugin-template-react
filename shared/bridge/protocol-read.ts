import type { PermissionMode, PermissionScope } from './protocol-core';
import type {
  RemColorName,
  RemHeadingLevel,
  RemTypeName,
  RichTextSpanInput,
} from './protocol-write-args';

export interface SerializedRem {
  remId: string;
  frontText: string;
  backText: string;
  plainText: string;
  breadcrumbs: string[];
  hasChildren: boolean;
  children?: SerializedRem[];
  truncated?: boolean;
}

export type RemStructureType = 'rem' | 'document' | 'folder' | 'unknown';

export interface RemChildSummary {
  remId: string;
  title: string;
  frontText: string;
  plainText: string;
  breadcrumbs: string[];
  index: number;
  hasChildren: boolean;
  type: RemStructureType;
}

export interface RemBreadcrumbSummary {
  remId: string;
  title: string;
  text: string;
}

export interface PingArgs {
  message?: string;
}

export interface PingResult {
  message: string;
}

export interface GetStatusArgs {}

export interface BridgePluginStatus {
  connected: true;
  permissionMode: PermissionMode;
  permissionScope: PermissionScope;
  approvedRootRemId: string | null;
  focusedRem?: {
    found: boolean;
    remId?: string;
    label: string;
    hasChildren?: boolean;
  };
}

export interface GetFocusedRemArgs {}

export interface GetRemArgs {
  remId: string;
}

export interface GetRemTreeArgs {
  remId: string;
  depth?: number;
}

export interface GetRemRichArgs {
  remId: string;
}

export interface DebugGetRawRichTextArgs {
  remId: string;
}

export interface GetCurrentSelectionArgs {}

export interface GetChildrenArgs {
  parentRemId: string;
  maxChildren?: number;
}

export interface GetRemBreadcrumbsArgs {
  remId: string;
}

export interface SearchRemsArgs {
  query: string;
  contextRemId?: string | null;
  maxResults?: number;
  scope?: PermissionScope | 'current_permission_scope';
}

export interface GetDocumentOrFolderTreeArgs {
  rootRemId?: string | null;
  depth?: number;
  maxChildren?: number;
}


export type DetectedContentType =
  | 'plain_text'
  | 'inline_math'
  | 'math_block'
  | 'descriptor'
  | 'concept';

export interface GetRemRichResult {
  remId: string;
  frontText: string;
  backText: string;
  plainText: string;
  remStyle?: {
    headingLevel: RemHeadingLevel;
    hideBullet: boolean;
    highlightColor?: RemColorName;
    remType: RemTypeName | 'unknown';
  };
  richText?: RichTextSpanInput[];
  backRichText?: RichTextSpanInput[];
  children?: RemChildSummary[];
  card?: {
    hasCards: boolean;
    cards: Array<{
      id?: string;
      type?: unknown;
    }>;
  };
  rich: {
    front: unknown[];
    back: unknown[];
  };
  richSupported: boolean;
  reason?: string;
  detectedContentTypes: DetectedContentType[];
}

export interface DebugGetRawRichTextResult {
  remId: string;
  rawText: unknown;
  rawBackText?: unknown;
  richLength?: number;
  backRichLength?: number;
  json: string;
  interpretation: {
    fontColorField: string;
    textHighlightField: string;
    wholeRemHighlightSource: string;
  };
}

export interface GetCurrentSelectionResult {
  focusedRemId: string | null;
  selectedRemIds: string[];
  selectionSupported: boolean;
  reason?: string;
}

export interface GetChildrenResult {
  parentRemId: string;
  remId: string;
  children: RemChildSummary[];
  childCount: number;
  truncated: boolean;
}

export interface GetRemBreadcrumbsResult {
  remId: string;
  breadcrumbs: RemBreadcrumbSummary[];
}

export interface SearchRemsResult {
  query: string;
  contextRemId: string | null;
  results: RemChildSummary[];
  truncated: boolean;
  searchSupported: boolean;
  scopeMetadata?: {
    scopeRequested: string;
    scopeEnforcement: 'post_filter_ancestor_chain' | 'none';
    rawResultCount: number;
    filteredResultCount: number;
    filteredOutCount: number;
  };
}

export interface GetDocumentOrFolderTreeResult {
  rootRemId: string;
  rootType: RemStructureType;
  source: 'requested_root' | 'focused_portal' | 'focused_rem';
  tree: SerializedRem;
  truncated: boolean;
}
