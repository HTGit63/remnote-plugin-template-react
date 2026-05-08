export type PermissionMode = 'read_only' | 'confirm_writes' | 'trusted_writes' | 'danger_zone';

export const WRITE_APPROVAL_TIMEOUT_MS = 30000;

export type BridgeToolName =
  | 'ping'
  | 'get_status'
  | 'get_focused_rem'
  | 'get_rem'
  | 'get_rem_tree'
  | 'get_rem_rich'
  | 'get_current_selection'
  | 'create_rem'
  | 'append_to_rem'
  | 'update_rem'
  | 'move_rem'
  | 'create_rem_tree'
  | 'replace_rem'
  | 'delete_rem';

export type ReadOnlyBridgeToolName =
  | 'get_focused_rem'
  | 'get_rem'
  | 'get_rem_tree'
  | 'get_rem_rich'
  | 'get_current_selection';
export type SafeWriteBridgeToolName =
  | 'create_rem'
  | 'append_to_rem'
  | 'update_rem'
  | 'move_rem'
  | 'create_rem_tree';
export type DangerousBridgeToolName = 'replace_rem' | 'delete_rem';

export type BridgeErrorCode =
  | 'NO_FOCUSED_REM'
  | 'REM_NOT_FOUND'
  | 'PARENT_NOT_FOUND'
  | 'PLUGIN_NOT_CONNECTED'
  | 'INVALID_ARGS'
  | 'PERMISSION_DENIED'
  | 'APPROVAL_REJECTED'
  | 'APPROVAL_TIMEOUT'
  | 'SDK_UNSUPPORTED'
  | 'SDK_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN_TOOL'
  | 'APPROVAL_PENDING'
  | 'INTERNAL_ERROR';

export type ApprovalResolution = 'APPROVED' | 'APPROVAL_REJECTED' | 'APPROVAL_TIMEOUT';
export type ApprovalRiskLevel = 'safe_write' | 'destructive';

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

export interface GetCurrentSelectionArgs {}

export interface CreateRemArgs {
  parentId?: string | null;
  markdown: string;
}

export interface AppendToRemArgs {
  remId: string;
  markdown: string;
  position?: 'start' | 'end';
}

export interface UpdateRemArgs {
  remId: string;
  markdown: string;
}

export interface MoveRemArgs {
  remId: string;
  newParentId: string;
  index: number;
}

export interface CreateRemTreeNode {
  title: string;
  children?: CreateRemTreeNode[];
}

export interface CreateRemTreeArgs {
  parentId: string;
  tree: CreateRemTreeNode;
}

export interface ReplaceRemArgs {
  remId: string;
  markdown: string;
}

export interface DeleteRemArgs {
  remId: string;
  recursive?: boolean;
  confirmText: string;
}

export interface CreateRemResult {
  createdRemId: string;
  parentId: string | null;
  status: 'created';
}

export interface AppendToRemResult {
  targetRemId: string;
  createdRemId: string;
  status: 'appended';
}

export interface UpdateRemResult {
  updatedRemId: string;
  status: 'updated';
}

export interface MoveRemResult {
  movedRemId: string;
  newParentId: string;
  index: number;
  status: 'moved';
}

export interface CreateRemTreeResult {
  rootCreatedRemId: string;
  createdNodeCount: number;
  createdRemIds: string[];
  status: 'created_tree';
}

export interface ReplaceRemResult {
  remId: string;
}

export interface DeleteRemResult {
  deletedRemId: string;
  recursive: boolean;
  status: 'deleted';
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
  rich: {
    front: unknown[];
    back: unknown[];
  };
  richSupported: boolean;
  detectedContentTypes: DetectedContentType[];
}

export interface GetCurrentSelectionResult {
  focusedRemId: string | null;
  selectedRemIds: string[];
  selectionSupported: boolean;
}

export interface BridgeToolArgs {
  ping: PingArgs;
  get_status: GetStatusArgs;
  get_focused_rem: GetFocusedRemArgs;
  get_rem: GetRemArgs;
  get_rem_tree: GetRemTreeArgs;
  get_rem_rich: GetRemRichArgs;
  get_current_selection: GetCurrentSelectionArgs;
  create_rem: CreateRemArgs;
  append_to_rem: AppendToRemArgs;
  update_rem: UpdateRemArgs;
  move_rem: MoveRemArgs;
  create_rem_tree: CreateRemTreeArgs;
  replace_rem: ReplaceRemArgs;
  delete_rem: DeleteRemArgs;
}

export interface BridgeToolResults {
  ping: PingResult;
  get_status: BridgePluginStatus;
  get_focused_rem: SerializedRem;
  get_rem: SerializedRem;
  get_rem_tree: SerializedRem;
  get_rem_rich: GetRemRichResult;
  get_current_selection: GetCurrentSelectionResult;
  create_rem: CreateRemResult;
  append_to_rem: AppendToRemResult;
  update_rem: UpdateRemResult;
  move_rem: MoveRemResult;
  create_rem_tree: CreateRemTreeResult;
  replace_rem: ReplaceRemResult;
  delete_rem: DeleteRemResult;
}

export type BridgeRequest<TTool extends BridgeToolName = BridgeToolName> = {
  [TName in TTool]: {
    id: string;
    tool: TName;
    args: BridgeToolArgs[TName];
    permissionMode?: PermissionMode;
    timeoutMs?: number;
  };
}[TTool];

export interface BridgeSuccess<TResult = unknown> {
  id: string;
  ok: true;
  result: TResult;
}

export interface BridgeFailure {
  id: string;
  ok: false;
  error: {
    code: BridgeErrorCode;
    message: string;
    details?: unknown;
  };
}

export type BridgeResponse<TResult = unknown> = BridgeSuccess<TResult> | BridgeFailure;

export interface PendingApprovalRequest<TTool extends BridgeToolName = BridgeToolName> {
  id: string;
  tool: TTool;
  args: BridgeToolArgs[TTool];
  permissionMode: PermissionMode;
  requestedAt: string;
  timeoutDeadline: string;
  targetRemId?: string;
  targetTitle?: string;
  hasChildren?: boolean;
  previewMarkdown?: string;
  riskLevel: ApprovalRiskLevel;
  summary: string;
  warning?: string;
  confirmTextRequired?: 'DELETE';
}

export interface BridgePluginHello {
  type: 'plugin_hello';
  protocolVersion: 1;
  clientName: 'remnote-plugin';
  token?: string;
}

export interface BridgeServerHello {
  type: 'server_hello';
  protocolVersion: 1;
  serverName: 'remnote-companion';
}

export type BridgeClientMessage = BridgePluginHello | BridgeResponse;
export type BridgeServerMessage = BridgeServerHello | BridgeRequest;

export interface BridgeToolAnnotations {
  readOnlyHint: boolean;
  openWorldHint: boolean;
  destructiveHint: boolean;
  idempotentHint?: boolean;
}

export const BRIDGE_TOOL_NAMES: readonly BridgeToolName[] = [
  'ping',
  'get_status',
  'get_focused_rem',
  'get_rem',
  'get_rem_tree',
  'get_rem_rich',
  'get_current_selection',
  'create_rem',
  'append_to_rem',
  'update_rem',
  'move_rem',
  'create_rem_tree',
  'replace_rem',
  'delete_rem',
] as const;

export const BRIDGE_TOOL_ANNOTATIONS: Record<BridgeToolName, BridgeToolAnnotations> = {
  ping: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  get_status: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  get_focused_rem: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  get_rem: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  get_rem_tree: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  get_rem_rich: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  get_current_selection: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  create_rem: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  append_to_rem: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  update_rem: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  move_rem: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  create_rem_tree: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  replace_rem: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: true,
  },
  delete_rem: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: true,
  },
};

export function isBridgeToolName(value: unknown): value is BridgeToolName {
  return typeof value === 'string' && (BRIDGE_TOOL_NAMES as readonly string[]).includes(value);
}

export function createBridgeSuccess<TTool extends BridgeToolName>(
  request: Pick<BridgeRequest<TTool>, 'id'>,
  result: BridgeToolResults[TTool]
): BridgeSuccess<BridgeToolResults[TTool]> {
  return {
    id: request.id,
    ok: true,
    result,
  };
}

export function createBridgeFailure(
  id: string,
  code: BridgeErrorCode,
  message: string,
  details?: unknown
): BridgeFailure {
  return {
    id,
    ok: false,
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  };
}
