import {
  DEFAULT_TOOL_PROFILE,
  filterToolsForProfile,
  getProfileHiddenTools,
  getToolPolicyEntry,
  getToolMetadata,
  groupToolsByPolicy,
  getToolTierSummary,
  TOOL_METADATA,
  TOOL_SCHEMA_VERSION,
  type ToolProfile,
} from './tool-policy.js';
import { getToolHistoryEntry, getToolHistorySnapshot } from './tool-health-history.js';

export const TOOL_REGISTRY_VERSION = '2026-07-21.hosted-media-file-schemas-v2';
export const MCP_DISCOVERY_VERSION = `mcp-discovery-${TOOL_REGISTRY_VERSION}`;
export const BRIDGE_PLUGIN_PROTOCOL_VERSION = 1;
export const PACKAGE_VERSION = process.env.npm_package_version ?? '0.0.1';
export const SERVER_VERSION = PACKAGE_VERSION;
export const STATIC_SDK_UNSUPPORTED_TOOLS = ['create_folder'] as const;
export const SERVER_LOCAL_MCP_TOOLS = [
  'get_bridge_status',
  'get_bridge_diagnostics',
  'run_bridge_health_check',
  'get_remnote_capability_guide',
  'plan_note_import',
  'plan_note_import_from_file',
  'start_note_import_job',
  'start_note_import_from_file',
  'run_note_import_job_step',
  'get_note_import_job_status',
  'resume_note_import_job',
  'reconcile_note_import_job_chunk',
  'verify_note_import_job',
  'cancel_note_import_job',
  'preview_markdown_note_tree',
] as const;

const TOOL_PROFILE_RANK: Record<ToolProfile, number> = {
  basic: 0,
  mass_note_writer: 1,
  note_writer: 2,
  power_user: 3,
  developer: 4,
  danger: 5,
};

function embeddedBuildTime(): string {
  return process.env.REMNOTE_BRIDGE_BUILD_TIME?.trim() || process.env.BUILD_TIME?.trim() || 'dev_runtime_not_embedded';
}

export type McpToolExposure = 'public' | 'gated';

export interface McpToolRegistryEntry {
  name: string;
  exposure: McpToolExposure;
  hiddenReason?: string;
}

export interface ToolStateModelEntry {
  name: string;
  description: string;
  category: string;
  userFacingName: string;
  declared: boolean;
  registered: boolean;
  listed: boolean;
  callable: boolean;
  liveVerified: boolean;
  sdkUnsupported: boolean;
  hidden: boolean;
  isPublic: boolean;
  isDebug: boolean;
  isDangerous: boolean;
  liveVerificationRequired: boolean;
  performanceBudgetMs: number;
  blockedByTier: boolean;
  blockedByScope: boolean;
  gatewayBlocked: boolean;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastErrorCode: string | null;
  riskLevel: string;
  operationTier: string;
  toolAccessTier: string;
  scopeRequirement: string;
  sdkCapability: string | null;
}

export interface ToolCorrectnessMatrixEntry {
  toolName: string;
  category: string;
  policy: string;
  profileExposure: string;
  schemaStatus: string;
  localTestStatus: string;
  serverLocalStatus: string;
  liveStatus: string;
  idempotencyStatus: string;
  scopeStatus: string;
  errorQualityStatus: string;
  chatGptStatus: string;
  codexStatus: string;
  knownFailures: string[];
  nextTest: string;
  declared: boolean;
  public: boolean;
  listed: boolean;
  registered: boolean;
  callable: boolean;
  hidden: boolean;
  unsupported: boolean;
}

export const MCP_TOOL_REGISTRY = TOOL_METADATA.filter((tool) => tool.isPublic && tool.sdkSupported).map(
  (tool): McpToolRegistryEntry => ({
    name: tool.name,
    exposure: tool.name === 'delete_rem_by_id' ? 'gated' : 'public',
    hiddenReason: tool.hiddenReason,
  })
) satisfies readonly McpToolRegistryEntry[];

export type RegisteredMcpToolName = (typeof MCP_TOOL_REGISTRY)[number]['name'];

const allPublicToolCache = new Map<string, string[]>();
const publicToolProfileCache = new Map<string, string[]>();

function declaredToolNames(): string[] {
  return Array.from(new Set(TOOL_METADATA.map((tool) => tool.name))).sort();
}

function toolDescription(name: string): string {
  const metadata = getToolMetadata(name);
  const policy = getToolPolicyEntry(name);
  if (policy.preferredFor?.length) {
    return `${metadata.category} tool; preferred for ${policy.preferredFor.join(', ')}.`;
  }
  if (policy.avoidWhen?.length) {
    return `${metadata.category} tool; avoid when ${policy.avoidWhen.join(', ')}.`;
  }
  if (policy.replacement) {
    return `${metadata.category} tool; fallback or gated path, replacement: ${policy.replacement}.`;
  }
  return `${metadata.category} tool in ${metadata.tier} tier.`;
}

function buildToolStateEntry(
  name: string,
  registeredTools: readonly string[],
  publicTools: readonly string[],
  allPublicTools: readonly string[],
  serverLocalVerifiedTools: readonly string[],
  sdkUnsupportedTools: readonly string[]
): ToolStateModelEntry {
  const metadata = getToolMetadata(name);
  const policy = getToolPolicyEntry(name);
  const history = getToolHistoryEntry(name);
  const listed = publicTools.includes(name);
  const registered = registeredTools.includes(name);
  const liveVerified = Boolean(history.lastSuccessAt);
  const serverLocalVerified =
    serverLocalVerifiedTools.includes(name) ||
    (SERVER_LOCAL_MCP_TOOLS as readonly string[]).includes(name);
  const sdkUnsupported =
    sdkUnsupportedTools.includes(name) ||
    !metadata.sdkSupported ||
    history.sdkUnsupportedCount > 0;
  const blockedByTier = allPublicTools.includes(name) && !listed;
  const hidden = !listed;
  return {
    name,
    description: toolDescription(name),
    category: metadata.category,
    userFacingName: metadata.userFacingName,
    declared: declaredToolNames().includes(name),
    registered,
    listed,
    callable: registered && !sdkUnsupported && (liveVerified || serverLocalVerified),
    liveVerified,
    sdkUnsupported,
    hidden,
    isPublic: metadata.isPublic,
    isDebug: metadata.isDebug,
    isDangerous: metadata.isDangerous,
    liveVerificationRequired: metadata.liveVerificationRequired,
    performanceBudgetMs: metadata.performanceBudgetMs,
    blockedByTier,
    blockedByScope: history.scopeBlockCount > 0,
    gatewayBlocked: history.gatewayBlockCount > 0,
    lastSuccessAt: history.lastSuccessAt,
    lastFailureAt: history.lastFailureAt,
    lastErrorCode: history.lastErrorCode,
    riskLevel: metadata.riskLevel,
    operationTier: metadata.operationTier,
    toolAccessTier: String(metadata.toolAccessTier),
    scopeRequirement: metadata.scopeRequirement,
    sdkCapability: metadata.sdkCapability,
  };
}

function profileExposureStatus(input: {
  name: string;
  listed: boolean;
  allPublic: boolean;
  metadataPublic: boolean;
  hiddenReason?: string;
}): string {
  if (!input.metadataPublic || input.hiddenReason) return 'hidden_or_gated';
  if (input.listed) return 'active_profile';
  if (input.allPublic) return 'profile_hidden';
  return 'not_public';
}

function schemaStatus(metadata: ReturnType<typeof getToolMetadata>, sdkUnsupported: boolean): string {
  if (sdkUnsupported || !metadata.sdkSupported) return 'sdk_unsupported';
  if (!metadata.isPublic || metadata.exposedNormally === false) return 'hidden_schema_present';
  return 'schema_ok';
}

function localTestStatus(input: {
  listed: boolean;
  sdkUnsupported: boolean;
  serverLocalVerified: boolean;
  historySuccess: boolean;
}): string {
  if (input.sdkUnsupported) return 'unsupported';
  if (!input.listed) return 'not_listed_in_active_profile';
  if (input.serverLocalVerified) return 'server_local_verified';
  if (input.historySuccess) return 'recent_plugin_call_recorded';
  return 'local_runtime_required';
}

function idempotencyStatus(metadata: ReturnType<typeof getToolMetadata>): string {
  if (metadata.supportsIdempotency) return 'idempotency_supported';
  if (metadata.supportsDryRun) return 'dry_run_supported_no_idempotency';
  if (!metadata.requiresWrite) return 'not_applicable_read_only';
  return 'no_idempotency_support';
}

function errorQualityStatus(input: {
  metadata: ReturnType<typeof getToolMetadata>;
  hiddenReason?: string;
  sdkUnsupported: boolean;
}): string {
  if (input.sdkUnsupported) return 'hidden_with_reason';
  if (input.hiddenReason || input.metadata.hiddenReason) return 'hidden_or_gated_reason_present';
  return 'standard_bridge_envelope';
}

function chatGptStatus(input: {
  listed: boolean;
  allPublic: boolean;
  hiddenReason?: string;
  sdkUnsupported: boolean;
}): string {
  if (input.sdkUnsupported || input.hiddenReason) return 'hidden_or_gated';
  if (input.listed) return 'default_profile_available';
  if (input.allPublic) return 'requires_profile_switch';
  return 'not_discoverable';
}

function codexStatus(input: {
  listed: boolean;
  allPublic: boolean;
  hiddenReason?: string;
  sdkUnsupported: boolean;
}): string {
  if (input.sdkUnsupported || input.hiddenReason) return 'hidden_or_gated';
  if (input.listed || input.allPublic) return 'same_registry_auth_and_scope_boundary';
  return 'not_discoverable';
}

function nextTestForTool(metadata: ReturnType<typeof getToolMetadata>, status: {
  hidden: boolean;
  sdkUnsupported: boolean;
  serverLocalVerified: boolean;
}): string {
  if (status.sdkUnsupported) {
    return 'Add SDK-backed implementation, then run server:test:tool-schemas and targeted smoke.';
  }
  if (status.hidden) {
    return metadata.isDangerous
      ? 'Enable danger profile only for dry-run plus guarded disposable delete smoke.'
      : 'Expose only after registry, schema, and live-proof gate are updated.';
  }
  if (metadata.category === 'debug') return 'npm run server:test:tools-diagnostics';
  if (status.serverLocalVerified) return 'npm run server:test:tools-diagnostics or server-local smoke';
  if (!metadata.requiresWrite) return 'npm run server:test:tools-core with connected plugin readback';
  return 'npm run server:test:tools-advanced plus targeted Vitest/readback';
}

function buildKnownFailures(input: {
  metadata: ReturnType<typeof getToolMetadata>;
  policy: ReturnType<typeof getToolPolicyEntry>;
  hiddenReason?: string;
  listed: boolean;
  sdkUnsupported: boolean;
  liveVerified: boolean;
  serverLocalVerified: boolean;
}): string[] {
  const failures: string[] = [];
  if (input.hiddenReason) failures.push(input.hiddenReason);
  if (input.sdkUnsupported) failures.push('SDK path unsupported or not exposed.');
  if (!input.listed && input.metadata.isPublic && !input.hiddenReason) failures.push('Hidden by active tool profile.');
  if (input.policy.replacement) failures.push(`Prefer ${input.policy.replacement}.`);
  if (input.metadata.liveVerificationRequired && !input.liveVerified && !input.serverLocalVerified) {
    failures.push('No recent live/plugin success recorded.');
  }
  if (input.metadata.isDangerous) failures.push('Danger tool requires explicit dry-run and approval guards.');
  return failures;
}

function buildToolCorrectnessMatrixEntry(
  name: string,
  registeredTools: readonly string[],
  publicTools: readonly string[],
  allPublicTools: readonly string[],
  serverLocalVerifiedTools: readonly string[],
  sdkUnsupportedTools: readonly string[],
  hiddenReasons: Record<string, string>
): ToolCorrectnessMatrixEntry {
  const metadata = getToolMetadata(name);
  const policy = getToolPolicyEntry(name);
  const history = getToolHistoryEntry(name);
  const listed = publicTools.includes(name);
  const allPublic = allPublicTools.includes(name);
  const registered = registeredTools.includes(name);
  const serverLocalVerified =
    serverLocalVerifiedTools.includes(name) ||
    (SERVER_LOCAL_MCP_TOOLS as readonly string[]).includes(name);
  const liveVerified = Boolean(history.lastSuccessAt);
  const hiddenReason = hiddenReasons[name] ?? metadata.hiddenReason;
  const sdkUnsupported =
    sdkUnsupportedTools.includes(name) ||
    !metadata.sdkSupported ||
    history.sdkUnsupportedCount > 0;
  const hidden = !listed || Boolean(hiddenReason) || !metadata.isPublic || metadata.exposedNormally === false;
  return {
    toolName: name,
    category: metadata.category,
    policy: policy.policy,
    profileExposure: profileExposureStatus({
      name,
      listed,
      allPublic,
      metadataPublic: metadata.isPublic,
      hiddenReason,
    }),
    schemaStatus: schemaStatus(metadata, sdkUnsupported),
    localTestStatus: localTestStatus({
      listed,
      sdkUnsupported,
      serverLocalVerified,
      historySuccess: liveVerified,
    }),
    serverLocalStatus: serverLocalVerified ? 'server_local_verified' : 'not_server_local',
    liveStatus: liveVerified ? 'recent_plugin_call' : 'live_not_run',
    idempotencyStatus: idempotencyStatus(metadata),
    scopeStatus: metadata.scopeRequirement,
    errorQualityStatus: errorQualityStatus({ metadata, hiddenReason, sdkUnsupported }),
    chatGptStatus: chatGptStatus({ listed, allPublic, hiddenReason, sdkUnsupported }),
    codexStatus: codexStatus({ listed, allPublic, hiddenReason, sdkUnsupported }),
    knownFailures: buildKnownFailures({
      metadata,
      policy,
      hiddenReason,
      listed,
      sdkUnsupported,
      liveVerified,
      serverLocalVerified,
    }),
    nextTest: nextTestForTool(metadata, { hidden, sdkUnsupported, serverLocalVerified }),
    declared: declaredToolNames().includes(name),
    public: metadata.isPublic,
    listed,
    registered,
    callable: registered && !sdkUnsupported && (serverLocalVerified || liveVerified),
    hidden,
    unsupported: sdkUnsupported,
  };
}

export function getAllPublicMcpToolNames(exposeDeleteTool = false): string[] {
  const cacheKey = `${TOOL_REGISTRY_VERSION}:${TOOL_SCHEMA_VERSION}:all-public:${exposeDeleteTool ? 'delete-on' : 'delete-off'}`;
  const cached = allPublicToolCache.get(cacheKey);
  if (cached) {
    return [...cached];
  }
  const names = MCP_TOOL_REGISTRY.filter((tool) => {
    if (tool.exposure === 'public') return true;
    if (tool.name === 'replace_rem') return false;
    return exposeDeleteTool && tool.name === 'delete_rem_by_id';
  }).map((tool) => tool.name);
  allPublicToolCache.set(cacheKey, names);
  return [...names];
}

export function getPublicMcpToolNames(
  exposeDeleteTool = false,
  profile: ToolProfile = DEFAULT_TOOL_PROFILE
): string[] {
  const cacheKey = `${TOOL_REGISTRY_VERSION}:${TOOL_SCHEMA_VERSION}:${profile}:${exposeDeleteTool ? 'delete-on' : 'delete-off'}`;
  const cached = publicToolProfileCache.get(cacheKey);
  if (cached) {
    return [...cached];
  }
  const names = filterToolsForProfile(getAllPublicMcpToolNames(exposeDeleteTool), profile);
  publicToolProfileCache.set(cacheKey, names);
  return [...names];
}

export function isPublicMcpToolName(
  name: string,
  exposeDeleteTool = false,
  profile: ToolProfile = DEFAULT_TOOL_PROFILE
): boolean {
  return getPublicMcpToolNames(exposeDeleteTool, profile).includes(name);
}

export function getHiddenMcpTools(exposeDeleteTool = false): Array<{ name: string; reason: string }> {
  const hidden: Array<{ name: string; reason: string }> = [];
  for (const tool of TOOL_METADATA) {
    if (tool.name === 'delete_rem_by_id' && !exposeDeleteTool) {
      hidden.push({
        name: tool.name,
        reason: tool.hiddenReason ?? 'Tool is gated by server configuration.',
      });
      continue;
    }
    if (!tool.isPublic || !tool.exposedNormally || !tool.sdkSupported) {
      hidden.push({
        name: tool.name,
        reason:
          tool.hiddenReason ??
          (!tool.sdkSupported
            ? 'Tool is hidden until the modern RemNote SDK path is live-verified.'
            : 'Tool is hidden from the public MCP surface.'),
      });
    }
  }
  return Array.from(new Map(hidden.map((tool) => [tool.name, tool])).values());
}

export function getRegistryMismatch(
  exposeDeleteTool: boolean,
  registeredToolNames: readonly string[],
  profile: ToolProfile = DEFAULT_TOOL_PROFILE
) {
  const expected = getPublicMcpToolNames(exposeDeleteTool, profile);
  const registered = [...registeredToolNames];
  return {
    missing: expected.filter((tool) => !registered.includes(tool)),
    unexpected: registered.filter((tool) => !expected.includes(tool)),
  };
}

export function assertRegisteredToolsMatchRegistry(
  exposeDeleteTool: boolean,
  registeredToolNames: readonly string[],
  profile: ToolProfile = DEFAULT_TOOL_PROFILE
) {
  const mismatch = getRegistryMismatch(exposeDeleteTool, registeredToolNames, profile);
  if (mismatch.missing.length || mismatch.unexpected.length) {
    throw new Error(
      `MCP tool registry mismatch. Missing: ${mismatch.missing.join(', ') || 'none'}; unexpected: ${
        mismatch.unexpected.join(', ') || 'none'
      }.`
    );
  }
}

export function getToolRegistrySummary(
  exposeDeleteTool = false,
  profile: ToolProfile = DEFAULT_TOOL_PROFILE,
  registeredToolNames?: readonly string[],
  auth?: {
    discoveryAuthMode?: 'no_auth_required' | 'local_bearer_required' | 'hosted_oauth_required';
    toolCallAuthMode?: 'no_auth_allowed' | 'local_bearer_required' | 'connector_compat_no_auth_tools' | 'hosted_oauth_required';
  }
) {
  const allPublicTools = getAllPublicMcpToolNames(exposeDeleteTool);
  const publicTools = getPublicMcpToolNames(exposeDeleteTool, profile);
  const registeredTools = registeredToolNames ? [...registeredToolNames] : [...publicTools];
  const hiddenTools = getHiddenMcpTools(exposeDeleteTool);
  const hiddenReasons = Object.fromEntries(hiddenTools.map((tool) => [tool.name, tool.reason]));
  const profileHiddenTools = getProfileHiddenTools(allPublicTools, profile);
  const policyGroups = groupToolsByPolicy(allPublicTools);
  const activePolicyGroups = groupToolsByPolicy(publicTools);
  const mismatch = getRegistryMismatch(exposeDeleteTool, registeredTools, profile);
  const sdkUnsupportedTools = publicTools.filter((tool) =>
    (STATIC_SDK_UNSUPPORTED_TOOLS as readonly string[]).includes(tool)
  );
  const serverLocalVerifiedTools = publicTools.filter((tool) =>
    (SERVER_LOCAL_MCP_TOOLS as readonly string[]).includes(tool)
  );
  const liveVerifiedTools = publicTools.filter((tool) => Boolean(getToolHistoryEntry(tool).lastSuccessAt));
  const actualMcpCallableTools = Array.from(new Set([...serverLocalVerifiedTools, ...liveVerifiedTools]));
  const runtimeUnverifiedTools = publicTools.filter(
    (tool) => !sdkUnsupportedTools.includes(tool) && !actualMcpCallableTools.includes(tool)
  );
  const sourceRegistryTools = declaredToolNames();
  const toolStates = sourceRegistryTools.map((tool) =>
    buildToolStateEntry(tool, registeredTools, publicTools, allPublicTools, serverLocalVerifiedTools, sdkUnsupportedTools)
  );
  const toolCorrectnessMatrix = sourceRegistryTools.map((tool) =>
    buildToolCorrectnessMatrixEntry(
      tool,
      registeredTools,
      publicTools,
      allPublicTools,
      serverLocalVerifiedTools,
      sdkUnsupportedTools,
      hiddenReasons
    )
  );
  const registryToMcpListMismatch = {
    hiddenFromList: sourceRegistryTools.filter((tool) => !publicTools.includes(tool)),
    listedButNotDeclared: publicTools.filter((tool) => !sourceRegistryTools.includes(tool)),
  };
  const mcpListToCallableMismatch = {
    listedButNotCallable: publicTools.filter((tool) => !actualMcpCallableTools.includes(tool) && !sdkUnsupportedTools.includes(tool)),
    callableButNotListed: actualMcpCallableTools.filter((tool) => !publicTools.includes(tool)),
  };
  const toolHistorySnapshot = getToolHistorySnapshot();

  return {
    serverVersion: SERVER_VERSION,
    packageVersion: PACKAGE_VERSION,
    pluginVersion: 'reported-by-plugin-status',
    gitSha:
      process.env.RENDER_GIT_COMMIT?.trim() ||
      process.env.RENDER_COMMIT?.trim() ||
      process.env.GIT_COMMIT?.trim() ||
      process.env.COMMIT_SHA?.trim() ||
      process.env.SOURCE_VERSION?.trim() ||
      'unknown',
    branchName:
      process.env.RENDER_GIT_BRANCH?.trim() ||
      process.env.RENDER_BRANCH?.trim() ||
      process.env.GIT_BRANCH?.trim() ||
      process.env.BRANCH?.trim() ||
      'unknown',
    buildTime: embeddedBuildTime(),
    deploymentEnvironment: process.env.RENDER ? 'render' : process.env.NODE_ENV || 'development',
    toolProfile: profile,
    toolTier: profile,
    activeToolTier: profile,
    activeToolProfile: profile,
    defaultToolTier: DEFAULT_TOOL_PROFILE,
    defaultToolProfile: DEFAULT_TOOL_PROFILE,
    effectivePublicToolNames: [...publicTools],
    activeProfileExceedsDefault: TOOL_PROFILE_RANK[profile] > TOOL_PROFILE_RANK[DEFAULT_TOOL_PROFILE],
    activeProfileReason:
      profile === 'danger'
        ? 'danger exposes the broadest non-hidden tool profile for explicit diagnostics/testing only.'
        : profile === DEFAULT_TOOL_PROFILE
          ? 'active profile matches default mass_note_writer.'
          : `active profile ${profile} selected by config, request metadata, header, query, or pairing session.`,
    profileSwitchHint:
      'Set REMNOTE_MCP_TOOL_PROFILE=mass_note_writer or REMNOTE_BRIDGE_TOOL_PROFILE=mass_note_writer, then refresh the connector/tool list.',
    permissionMode: 'request_principal_or_bridge_runtime',
    permissionScope: 'request_principal_or_bridge_runtime',
    operationPermissionTiers: [
      'Read Only',
      'Read + Create',
      'Read + Create + Modify',
      'Full Control With Delete Approval',
      'Danger Zone',
    ],
    scopeTiers: [
      'Focused Rem',
      'Focused Rem + Descendants',
      'Selected Rem',
      'Selected Rem + Descendants',
      'Approved Root',
      'Workspace',
    ],
    toolAccessTiers: [
      'Basic',
      'Mass Note Writer',
      'Note Writer',
      'Power User',
      'Developer',
      'Danger',
    ],
    remNoteManifestPermissionMapping: {
      operationTiers: {
        'Read Only': 'Read',
        'Read + Create': 'ReadCreate',
        'Read + Create + Modify': 'ReadCreateModify',
        'Full Control With Delete Approval': 'ReadCreateModifyDelete with bridge approval',
        'Danger Zone': 'ReadCreateModifyDelete with explicit Danger Zone user action',
      },
      scopeTiers: {
        'Focused Rem': 'DescendantsOfId focused Rem only',
        'Focused Rem + Descendants': 'DescendantsOfId focused Rem and descendants',
        'Selected Rem': 'DescendantsOfId selected Rem only',
        'Selected Rem + Descendants': 'DescendantsOfId selected Rem and descendants',
        'Approved Root': 'DescendantsOfId approved root',
        Workspace: 'All',
      },
      broadAllScopeJustification:
        'Workspace mode maps to RemNote All scope only for explicit broad search/create workflows; normal onboarding recommends Focused Rem + Descendants.',
      dynamicDescendantsOfIdStatus:
        'Internal scope model is ready for dynamic DescendantsOfId grants; hosted/public flow still stores approved root/focus semantics and must not fake RemNote runtime grants.',
    },
    toolSchemaVersion: TOOL_SCHEMA_VERSION,
    toolRegistryVersion: TOOL_REGISTRY_VERSION,
    serverToolRegistryVersion: TOOL_REGISTRY_VERSION,
    mcpDiscoveryVersion: MCP_DISCOVERY_VERSION,
    lastDiscoveryRefreshAt: new Date().toISOString(),
    pluginProtocolVersion: BRIDGE_PLUGIN_PROTOCOL_VERSION,
    registeredTools,
    sourceRegistryTools,
    declaredToolNames: sourceRegistryTools,
    declaredToolCount: sourceRegistryTools.length,
    allPublicTools,
    allPublicToolCount: allPublicTools.length,
    publicToolCount: publicTools.length,
    publicTools,
    listedToolCount: publicTools.length,
    exposedTools: [...publicTools],
    registeredToolNames: [...registeredTools],
    registryDeclaredTools: sourceRegistryTools,
    mcpRegisteredTools: [...registeredTools],
    mcpListedToolNames: [...publicTools],
    mcpListedTools: [...publicTools],
    callabilitySource: 'runtime_matrix_not_live_execution' as const,
    callabilitySourceExplanation:
      'Registry lists discoverable tools. Runtime verification requires a recent successful server or plugin execution.',
    serverLocalVerifiedTools,
    serverLocalVerifiedToolCount: serverLocalVerifiedTools.length,
    callableTools: [...actualMcpCallableTools],
    discoverableTools: [...publicTools],
    unauthDiscoverableTools:
      auth?.discoveryAuthMode === 'no_auth_required' || !auth?.discoveryAuthMode ? [...publicTools] : [],
    actualMcpCallableTools: [...actualMcpCallableTools],
    unauthMcpCallableTools:
      auth?.toolCallAuthMode === 'no_auth_allowed' ||
      auth?.toolCallAuthMode === 'connector_compat_no_auth_tools' ||
      !auth?.toolCallAuthMode
        ? [...actualMcpCallableTools]
        : [],
    unauthToolCallAllowedTools:
      auth?.toolCallAuthMode === 'no_auth_allowed' ||
      auth?.toolCallAuthMode === 'connector_compat_no_auth_tools' ||
      !auth?.toolCallAuthMode
        ? [...publicTools]
        : [],
    realPluginVerifiedTools: [...liveVerifiedTools],
    runtimeVerifiedTools: [...actualMcpCallableTools],
    verifiedToolCount: actualMcpCallableTools.length,
    runtimeUnverifiedTools,
    runtimeUnverifiedToolCount: runtimeUnverifiedTools.length,
    sdkUnsupportedTools,
    staticSdkUnsupportedTools: [...STATIC_SDK_UNSUPPORTED_TOOLS],
    unsupportedToolsAvailableOnlyAsDiagnostics: [...STATIC_SDK_UNSUPPORTED_TOOLS],
    toolStateModelVersion: TOOL_REGISTRY_VERSION,
    toolStates,
    toolStateModel: Object.fromEntries(toolStates.map((tool) => [tool.name, tool])),
    toolCorrectnessMatrixVersion: TOOL_REGISTRY_VERSION,
    toolCorrectnessMatrix,
    toolCorrectnessMatrixByName: Object.fromEntries(toolCorrectnessMatrix.map((tool) => [tool.toolName, tool])),
    toolHistory: toolHistorySnapshot.toolHistory,
    recentToolEvents: toolHistorySnapshot.recentToolEvents,
    registryToMcpListMismatch,
    mcpListToCallableMismatch,
    toolMetadata: Object.fromEntries(publicTools.map((tool) => [tool, getToolMetadata(tool)])),
    allToolMetadata: Object.fromEntries(TOOL_METADATA.map((tool) => [tool.name, tool])),
    toolTierSummary: getToolTierSummary(profile, exposeDeleteTool),
    runtimeVerificationMatrix: publicTools.map((tool) => {
      const metadata = getToolMetadata(tool);
      const policy = getToolPolicyEntry(tool);
      const registered = registeredTools.includes(tool);
      const serverLocalVerified = serverLocalVerifiedTools.includes(tool);
      const sdkUnsupported = sdkUnsupportedTools.includes(tool);
      return {
        ...metadata,
        toolName: tool,
        description: toolDescription(tool),
        declared: sourceRegistryTools.includes(tool),
        listed: true,
        registered,
        callable: registered && !sdkUnsupported && (serverLocalVerified || Boolean(getToolHistoryEntry(tool).lastSuccessAt)),
        liveVerified: Boolean(getToolHistoryEntry(tool).lastSuccessAt),
        hidden: false,
        blockedByTier: false,
        blockedByScope: getToolHistoryEntry(tool).scopeBlockCount > 0,
        gatewayBlocked: getToolHistoryEntry(tool).gatewayBlockCount > 0,
        lastSuccessAt: getToolHistoryEntry(tool).lastSuccessAt,
        lastFailureAt: getToolHistoryEntry(tool).lastFailureAt,
        exposed: publicTools.includes(tool),
        runtimeVerified: serverLocalVerified || Boolean(getToolHistoryEntry(tool).lastSuccessAt) || Boolean(metadata.runtimeVerified),
        runtimeVerifiedSource: Boolean(getToolHistoryEntry(tool).lastSuccessAt)
          ? 'recent_plugin_call'
          : serverLocalVerified
            ? 'server_local'
            : metadata.runtimeVerifiedSource,
        lastSuccessTimestamp: getToolHistoryEntry(tool).lastSuccessAt,
        lastFailureTimestamp: getToolHistoryEntry(tool).lastFailureAt,
        lastErrorCode: getToolHistoryEntry(tool).lastErrorCode,
        averageLatencyMs: getToolHistoryEntry(tool).averageDurationMs,
        p95LatencyMs: null as number | null,
        serverLocalVerified,
        sdkUnsupported,
        operationTier: metadata.operationTier,
        toolAccessTier: String(metadata.toolAccessTier),
        scopeRequirement: metadata.scopeRequirement,
        sdkCapability: metadata.sdkCapability,
        agentWarning: metadata.agentWarning ?? null,
        partialFailureCount: getToolHistoryEntry(tool).partialFailureCount,
        gatewayBlockCount: getToolHistoryEntry(tool).gatewayBlockCount,
        tierBlockCount: getToolHistoryEntry(tool).tierBlockCount,
        scopeBlockCount: getToolHistoryEntry(tool).scopeBlockCount,
        sdkUnsupportedCount: getToolHistoryEntry(tool).sdkUnsupportedCount,
        lastBenchmarkRunAt: getToolHistoryEntry(tool).lastBenchmarkRunAt,
        recommendedFallback: policy.replacement ?? null,
        schemaWarningStatus: sdkUnsupported || !metadata.sdkSupported ? 'sdk_unsupported' : 'ok',
        schemaWarnings: sdkUnsupported || !metadata.sdkSupported
          ? ['Tool is not exposed until the RemNote SDK path is live-verified.']
          : [],
      };
    }),
    registryCache: {
      enabled: true,
      key: `${TOOL_REGISTRY_VERSION}:${TOOL_SCHEMA_VERSION}:${profile}`,
      dimensions: ['registryVersion', 'activeTier', 'deleteExposure', 'schemaVersion'],
    },
    preferredTools: activePolicyGroups.preferred,
    fallbackTools: activePolicyGroups.fallback,
    debugTools: activePolicyGroups.debug,
    readTools: activePolicyGroups.read,
    cardTools: activePolicyGroups.cards,
    dangerousTools: activePolicyGroups.dangerous,
    unsupportedTools: activePolicyGroups.unsupported,
    policyGroups,
    activePolicyGroups,
    profileHiddenTools,
    hiddenTools,
    hiddenToolCount: hiddenTools.length + profileHiddenTools.length,
    hiddenReasons,
    registryMismatch: mismatch,
    deleteToolExposed: publicTools.includes('delete_rem_by_id'),
    legacyDeleteToolsRemoved: true,
    requiresConnectorRefresh: false,
    discoveryAuthMode: auth?.discoveryAuthMode ?? 'no_auth_required',
    toolCallAuthMode: auth?.toolCallAuthMode ?? 'no_auth_allowed',
  };
}
