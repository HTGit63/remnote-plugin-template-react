import type { PermissionMode, PermissionScope } from './protocol-core.js';
import type {
  RemColorName,
  RemHeadingLevel,
  RemTypeName,
  RichTextSpanInput,
} from './protocol-write-args.js';

export interface SerializedRem {
  remId: string;
  frontText: string;
  backText: string;
  plainText: string;
  breadcrumbs: string[];
  hasChildren: boolean;
  children?: SerializedRem[];
  truncated?: boolean;
  readCoverage?: TreeReadCoverage;
}

export type TreeTruncationReason =
  | 'depth_limit'
  | 'child_limit'
  | 'node_limit'
  | 'text_limit';

export interface ReadContinuation {
  tool: 'get_children' | 'get_rem_rich';
  args: {
    parentRemId?: string;
    remId?: string;
    maxChildren?: number;
    startIndex?: number;
  };
}

export interface TreeReadCoverage {
  appliedLimits: {
    depth: number;
    maxChildrenPerNode: number;
    maxNodes: number;
    maxChars: number;
  };
  truncationReasons: TreeTruncationReason[];
  continuation?: ReadContinuation;
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

export type RemnoteSdkCapabilityName =
  | 'plugin.app.transaction'
  | 'plugin.app.waitForInitialSync'
  | 'plugin.rem.createSingleRemWithMarkdown'
  | 'plugin.rem.createTreeWithMarkdown'
  | 'plugin.rem.createTable'
  | 'plugin.reader.addHighlight'
  | 'plugin.queue.getCurrentCard'
  | 'plugin.queue.getNumRemainingCards'
  | 'plugin.queue.getCurrentStreak'
  | 'plugin.queue.inLookbackMode';

export interface RemnoteSdkCapabilityDetail {
  supported: boolean;
  namespace: 'app' | 'rem' | 'reader' | 'queue';
  api: string;
}

export interface RemnoteSdkCapabilityReport {
  sdkVersion: string;
  supportedSdkCapabilities: RemnoteSdkCapabilityName[];
  unsupportedSdkCapabilities: RemnoteSdkCapabilityName[];
  sdkCapabilityDetails: Record<RemnoteSdkCapabilityName, RemnoteSdkCapabilityDetail>;
}

export interface RemnoteInitialSyncStatus {
  initialSyncSupported: boolean;
  initialSyncComplete: boolean;
  initialSyncTimedOut: boolean;
  initialSyncDurationMs: number;
  initialSyncCompletedAt?: string;
  initialSyncWarning?: string;
}

export interface BridgePluginRuntimeInfo extends RemnoteSdkCapabilityReport, RemnoteInitialSyncStatus {}

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
  pluginRuntime?: BridgePluginRuntimeInfo;
  sdkVersion?: string;
  supportedSdkCapabilities?: RemnoteSdkCapabilityName[];
  unsupportedSdkCapabilities?: RemnoteSdkCapabilityName[];
  initialSyncComplete?: boolean;
  initialSyncTimedOut?: boolean;
  initialSyncWarning?: string;
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
  startIndex?: number;
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
  remId?: string | null;
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
  returnedRange: {
    startIndex: number;
    endIndexExclusive: number;
  };
  appliedLimits: {
    maxChildren: number;
  };
  continuation?: {
    tool: 'get_children';
    args: {
      parentRemId: string;
      maxChildren: number;
      startIndex: number;
    };
  };
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
  coverage: {
    kind: 'bounded_sdk_search';
    exhaustive: false;
    matchState: 'matches_returned' | 'no_match_in_bounded_search';
    maxResults: number;
    exactTitleVerificationRequired: true;
    fallback: {
      tool: 'get_rem';
      requiresKnownRemId: true;
    };
  };
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
