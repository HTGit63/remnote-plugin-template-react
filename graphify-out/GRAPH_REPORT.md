# Graph Report - /mnt/01DBAB8A7D80C830/Users/hunde/Documents/WebDEV/web.dev.projects/Remnote/remnote-plugin-template-react  (2026-07-09)

## Corpus Check
- 183 files · ~175,895 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2559 nodes · 8059 edges · 132 communities (119 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 87 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b4b3553b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- protocol-messages.ts
- remnoteSdkHelpers.ts
- structuredBatch.ts
- formattingWrites.ts
- schemas.ts
- markdown-importer.ts
- agents-staged-repair-simulation.test.ts
- notePlan.ts
- StorageProvider
- scripts
- create-http-server.ts
- validation.ts
- smoke.ts
- mass-note-audit-report.ts
- scripts
- designTemplates.ts
- session-router.ts
- bridge-status.tsx
- read.ts
- richTextFormatting.ts
- area1-smoke.ts
- tool-registry.ts
- startCompanionApp
- chatgpt-pairing-routes.ts
- bridge-hub.ts
- tool-context.ts
- routing-smoke.ts
- tool-policy.ts
- dashboard-routes.ts
- BridgeHub
- designedNoteTools.ts
- health-check.ts
- live-tool-smoke.ts
- handlers.ts
- area3-certification.ts
- codex-pairing-routes.ts
- BridgeResponse
- mcp-server.ts
- register-bulk-import-tools.ts
- bulk-import.ts
- style-presets.ts
- destructiveHint
- config.ts
- destructive_justification
- FakeRem
- Final Audit Gates
- types.ts
- hashToken
- pairing.ts
- performance-benchmark.ts
- client.ts
- devDependencies
- manifest.json
- MemoryStorageProvider
- PostgresStorageProvider
- BulkImportJobStore
- tool-permissions.ts
- protocol.ts
- bulk-import.test.ts
- audit-payload-safety.ts
- live-tool-regression.ts
- compilerOptions
- register-diagnostic-tools.ts
- tool-reference-generator.ts
- PermissionScope
- enforceScope
- register-design-tools.ts
- BrowserBridgeClient
- applyStylePlan
- RequestLedger
- planNoteImport
- Session
- compilerOptions
- openWorldHint
- open_world_justification
- pairing-routes.ts
- tools
- boundary-smoke.ts
- chatgpt-app-submission.json
- unified-stage-gateway.test.ts
- status.ts
- approval.ts
- package.json
- markdown-pipeline-benchmark.ts
- tool-health-history.ts
- NormalizedMarkdownImportArgs
- bulk-import-tools.test.ts
- codex-pairing-smoke.ts
- CodexClientLink
- buildMassNoteManifest
- index.tsx
- package.json
- classifyToolResult
- IdempotencyRecord
- PairingChallenge
- design-template-sync.ts
- webpack.config.js
- AuthenticatedPrincipal
- markdownInlineToRichText
- dependencies
- devDependencies
- HostedAuthProvider
- SessionStore
- parseLatexSpansFromText
- annotations
- annotations
- annotations
- annotations
- annotations
- annotations
- annotations
- annotations
- annotations
- annotations
- annotations
- annotations
- annotations
- annotations
- annotations
- annotations
- annotations
- annotations
- annotations
- annotations
- annotations
- annotations
- package.json
- package.json

## God Nodes (most connected - your core abstractions)
1. `structuredBatch.ts` - 144 edges
2. `protocol-messages.ts` - 138 edges
3. `remnoteSdkHelpers.ts` - 136 edges
4. `formattingWrites.ts` - 129 edges
5. `treeWrites.ts` - 123 edges
6. `basicWrites.ts` - 121 edges
7. `markdownImportExecutor.ts` - 121 edges
8. `handlers.ts` - 115 edges
9. `cardWrites.ts` - 106 edges
10. `protocol-write-args.ts` - 101 edges
11. `writeCaches.ts` - 101 edges
12. `markdown-importer.ts` - 88 edges
13. `deleteWrites.ts` - 86 edges
14. `designedNoteTools.ts` - 86 edges
15. `verification.ts` - 83 edges
16. `writeValidation.ts` - 81 edges
17. `schemas.ts` - 80 edges
18. `handleBridgeRequest()` - 79 edges
19. `create-http-server.ts` - 77 edges
20. `protocol-write-results.ts` - 74 edges

## Surprising Connections (you probably didn't know these)
- `startCompanionApp()` --indirect_call--> `.reject()`  [INFERRED 0.80]
  server/src/app.ts → server/src/bridge/request-ledger.ts  _Document-level semantic edge added during AGENTS evidence mapping._
- `area1-smoke.ts` --indirect_call--> `checkAdvanced()`  [INFERRED]
  server/src/area1-smoke.ts → server/src/area1-smoke.ts  _Document-level semantic edge added during AGENTS evidence mapping._
- `area1-smoke.ts` --indirect_call--> `checkCore()`  [INFERRED]
  server/src/area1-smoke.ts → server/src/area1-smoke.ts  _Document-level semantic edge added during AGENTS evidence mapping._
- `area1-smoke.ts` --indirect_call--> `checkDiagnostics()`  [INFERRED]
  server/src/area1-smoke.ts → server/src/area1-smoke.ts  _Document-level semantic edge added during AGENTS evidence mapping._
- `area1-smoke.ts` --indirect_call--> `checkDirectWriteTrustedModeRegression()`  [INFERRED]
  server/src/area1-smoke.ts → server/src/area1-smoke.ts  _Document-level semantic edge added during AGENTS evidence mapping._
- `area1-smoke.ts` --indirect_call--> `checkFullAndMetadata()`  [INFERRED]
  server/src/area1-smoke.ts → server/src/area1-smoke.ts  _Document-level semantic edge added during AGENTS evidence mapping._
- `area1-smoke.ts` --indirect_call--> `checkHostedDiagnostics()`  [INFERRED]
  server/src/area1-smoke.ts → server/src/area1-smoke.ts  _Document-level semantic edge added during AGENTS evidence mapping._
- `area1-smoke.ts` --indirect_call--> `checkIdempotency()`  [INFERRED]
  server/src/area1-smoke.ts → server/src/area1-smoke.ts  _Document-level semantic edge added during AGENTS evidence mapping._
- `area1-smoke.ts` --indirect_call--> `checkMarkdownImporter()`  [INFERRED]
  server/src/area1-smoke.ts → server/src/area1-smoke.ts  _Document-level semantic edge added during AGENTS evidence mapping._
- `area1-smoke.ts` --indirect_call--> `checkMassNoteWriter()`  [INFERRED]
  server/src/area1-smoke.ts → server/src/area1-smoke.ts  _Document-level semantic edge added during AGENTS evidence mapping._
- `area1-smoke.ts` --indirect_call--> `checkNuclearPhysicsStylePreset()`  [INFERRED]
  server/src/area1-smoke.ts → server/src/area1-smoke.ts  _Document-level semantic edge added during AGENTS evidence mapping._
- `area1-smoke.ts` --indirect_call--> `checkPerformance()`  [INFERRED]
  server/src/area1-smoke.ts → server/src/area1-smoke.ts  _Document-level semantic edge added during AGENTS evidence mapping._

## Import Cycles
- 2-file cycle: `src/bridge/handlers.ts -> src/bridge/handlers/scope.ts -> src/bridge/handlers.ts`
- 2-file cycle: `src/bridge/handlers.ts -> src/bridge/handlers/approval.ts -> src/bridge/handlers.ts`

## Hyperedges (group relationships)
- **Remaining RemNote MCP Completion Work** — concept_partial_live_proof_only, concept_tool_registry_profiles, concept_bulk_import_source_fidelity, concept_markdown_formula_cards, concept_chatgpt_codex_auth, concept_pairing_session_routing, concept_scope_write_permissions, concept_ui_connection_status, concept_final_audit_gates, concept_security_threat_model, concept_mass_note_workflows, concept_performance_soak [INFERRED 0.85]

## Communities (132 total, 13 thin omitted)

### Community 0 - "protocol-messages.ts"
Cohesion: 0.05
Nodes (96): WritePerformanceReport, BridgeServerMessage, BridgeToolArgs, BridgeToolResults, DebugGetRawRichTextArgs, DebugGetRawRichTextResult, DetectedContentType, GetChildrenArgs (+88 more)

### Community 1 - "remnoteSdkHelpers.ts"
Cohesion: 0.14
Nodes (82): BridgeErrorCode, AppendToRemArgs, ApplyRemnoteCommandArgs, ApplyStructuredNoteBatchArgs, ApplyStylePlanArgs, ClearRemFormattingArgs, CreateClozeCardArgs, CreateDocumentArgs (+74 more)

### Community 2 - "structuredBatch.ts"
Cohesion: 0.06
Nodes (72): bottleneckForPhase(), buildWritePerformanceReport(), DEFAULT_WRITE_PERFORMANCE_BUDGET_MS, WritePerformanceBottleneckLayer, WritePerformanceBudgetMs, WritePerformancePhaseDurationsMs, WriteEngineExecution, WriteOperationPlan (+64 more)

### Community 3 - "formattingWrites.ts"
Cohesion: 0.09
Nodes (58): resolveRangeFromPlainText(), collectDesignRecords(), moveRem(), getDeleteTarget(), directChildHeadingOperations(), snapshotDirectChildIds(), verifyCreatedRems(), verifyStagedReplacement() (+50 more)

### Community 4 - "schemas.ts"
Cohesion: 0.10
Nodes (51): registerFormattingTools(), registerHighLevelWriteTools(), COLOR_SCHEMA, CONNECTOR_SAFE_EXPECTED_STYLE_SCHEMA, CONNECTOR_SAFE_NOTE_STYLE_PRESET_FIELDS_SCHEMA, DELETE_CONFIRM_SCHEMA, DRY_RUN_SCHEMA, EXPECTED_STYLE_MAP_ENTRY_SCHEMA (+43 more)

### Community 5 - "markdown-importer.ts"
Cohesion: 0.07
Nodes (51): addInlineSourceSnippets(), addNodeSourceSnippets(), addSnippet(), analyzeTree(), assertPlanLimits(), blockquoteMatch(), bulletMatch(), clampLimit() (+43 more)

### Community 6 - "agents-staged-repair-simulation.test.ts"
Cohesion: 0.07
Nodes (45): appendMarkdownToRem(), createDocumentFromMarkdown(), createRemFromMarkdown(), createRemFromMarkdownSafely(), findSameTitleChild(), normalizeMarkdownTextForComparison(), normalizePlainTextForComparison(), reorderChildren() (+37 more)

### Community 7 - "notePlan.ts"
Cohesion: 0.06
Nodes (29): collectOutline(), countFlashcardMarkers(), countMathNodes(), countNodes(), countTableNodes(), createNotePlanSummary(), maxDepth(), nodeText() (+21 more)

### Community 8 - "StorageProvider"
Cohesion: 0.07
Nodes (25): ChatGptPairingRouteDeps, CodexPairingRouteDeps, DashboardRouterDeps, CHATGPT_REDIRECT_HOSTS, createLocalDashboardSessionForTests(), DEFAULT_CHATGPT_SCOPES, displayNameFromAuthorize(), ensureDefaultClient() (+17 more)

### Community 9 - "scripts"
Cohesion: 0.04
Nodes (51): scripts, bridge:live-test, bridge:live-tool-regression, bridge:live-tool-smoke, build, check-types, dev, mcp:live-test (+43 more)

### Community 10 - "create-http-server.ts"
Cohesion: 0.08
Nodes (37): authorizeLocalMcpRequest(), LOCAL_BRIDGE_SCOPE_GRANTS, buildOauthChallenge(), getExpectedMcpResource(), getRequestBaseUrl(), Bucket, buckets, rateLimitRequest() (+29 more)

### Community 11 - "validation.ts"
Cohesion: 0.17
Nodes (44): normalizeArgs(), getStringField(), getTreeDepth(), isPlainObject(), normalizeStyleOperations(), optionalAppendPosition(), optionalBoolean(), optionalBoundedNumber() (+36 more)

### Community 12 - "smoke.ts"
Cohesion: 0.08
Nodes (35): cleanupCurrentSessionRoot(), failedTools, findRegressionRoot(), getStructuredResult(), isToolErrorResponse(), LiveTestMode, mcp, mode (+27 more)

### Community 13 - "mass-note-audit-report.ts"
Cohesion: 0.06
Nodes (38): AuditRow, AuditRowInput, bulkImportSource, bulkJobStoreSource, bulkToolSource, cardSource, EvidenceMode, forbiddenDefaultTools (+30 more)

### Community 14 - "scripts"
Cohesion: 0.05
Nodes (41): scripts, build, dev, generate-tool-reference, live-test, live-tool-regression, live-tool-smoke, mass-note-audit (+33 more)

### Community 15 - "designTemplates.ts"
Cohesion: 0.12
Nodes (35): NoteDesignTemplate, NoteDesignTemplateSummary, ExportNoteDesignTemplateResult, ImportNoteDesignTemplateResult, ListNoteDesignTemplatesResult, SaveNoteDesignTemplateResult, analyzeNoteDesign(), assertSafeRules() (+27 more)

### Community 16 - "session-router.ts"
Cohesion: 0.07
Nodes (13): validatePluginSessionToken(), PluginConnection, PluginConnectionInfo, HostedPluginHello, LegacyPluginHello, PluginHelloMessage, PluginRegisterMessage, PluginRegistrationMessage (+5 more)

### Community 17 - "bridge-status.tsx"
Cohesion: 0.11
Nodes (29): clearHostedPairingSession(), loadHostedPairingSession(), getBridgeNextAction(), getBridgeStatusLabel(), getPermissionModeLabel(), getPermissionScopeLabel(), normalizePermissionMode(), normalizePermissionScope() (+21 more)

### Community 18 - "read.ts"
Cohesion: 0.12
Nodes (32): clampLimit(), detectRichTypes(), FocusedRemStatus, getFocusedRemStatus(), getRemAncestorIds(), getRemStructureType(), getRemTitle(), normalizeRichArray() (+24 more)

### Community 19 - "richTextFormatting.ts"
Cohesion: 0.11
Nodes (32): applyClozeToRange(), applyFormatsToRichTextRange(), applyTextColorToAllText(), applyTextColorToRange(), applyTextHighlightToRange(), baseFormatsFromElement(), BuilderTextFormat, cloneRichText() (+24 more)

### Community 20 - "area1-smoke.ts"
Cohesion: 0.13
Nodes (32): assert(), assertNoRemovedTools(), checkAdvanced(), checkCore(), checkDiagnostics(), checkDirectWriteTrustedModeRegression(), checkHostedDiagnostics(), checkIdempotency() (+24 more)

### Community 21 - "tool-registry.ts"
Cohesion: 0.12
Nodes (31): checkFullAndMetadata(), checkPerformance(), getProfileHiddenTools(), getToolMetadata(), getToolPolicyEntry(), groupToolsByPolicy(), requiredOperationTierForTool(), TOOL_METADATA_BY_NAME (+23 more)

### Community 22 - "startCompanionApp"
Cohesion: 0.11
Nodes (22): RunningCompanionApp, startCompanionApp(), enabledHostedConfig, legacyHostedConfig, mcpRequest(), mcpToolCall(), postJson(), HOSTED_MODE_NOT_IMPLEMENTED_MESSAGE (+14 more)

### Community 23 - "chatgpt-pairing-routes.ts"
Cohesion: 0.11
Nodes (23): approveRateLimited(), buildRedirectUrl(), clientIp(), escapeHtml(), expireIfNeeded(), failedApproveAttempts, handleChatGptPairingRoute(), normalizeAccessScope() (+15 more)

### Community 24 - "bridge-hub.ts"
Cohesion: 0.17
Nodes (26): getIdempotencyKey(), hasAnyLifecyclePhase(), hasIdempotencyKey(), isDeleteTool(), isDryRunBridgeRequest(), isHighLevelIdempotentWrite(), isRealDeleteAttempt(), isTransientFailure() (+18 more)

### Community 25 - "tool-context.ts"
Cohesion: 0.13
Nodes (30): DEFAULT_TIMEOUT_BUDGETS, publicMcpToolNameForBridgeTool(), getToolPerformanceBudgetMs(), asRecord(), CallPluginFunction, clampTimeout(), defaultTimeoutForTool(), estimateChars() (+22 more)

### Community 26 - "routing-smoke.ts"
Cohesion: 0.09
Nodes (24): bridgeResponse(), connectMockPlugin(), fakeRem, bridgeResponse(), connectHostedMockPlugin(), createApprovedPluginRegistration(), mcpToolCall(), postJson() (+16 more)

### Community 27 - "tool-policy.ts"
Cohesion: 0.11
Nodes (30): BASIC_SET, BASIC_TIER_TOOLS, DANGER_SET, DANGER_TIER_TOOLS, defaultPerformanceBudgetMs(), defaultScopeRequirement(), defaultSdkCapability(), DEVELOPER_SET (+22 more)

### Community 28 - "dashboard-routes.ts"
Cohesion: 0.16
Nodes (25): cleanExpiredStates(), exchangeOAuthCode(), handleDashboardRoute(), OAuthTokenResult, pendingOAuthStates, redirect(), safeReturnTo(), writeHtml() (+17 more)

### Community 29 - "BridgeHub"
Cohesion: 0.17
Nodes (4): createLifecycleEvent(), PendingRequest, BridgeHub, BridgeClientMessage

### Community 30 - "designedNoteTools.ts"
Cohesion: 0.15
Nodes (27): cardTypeFromBackText(), cardWorkflowResult(), clampCardDepth(), clampCardLimit(), clampCardNodeLimit(), clampCardVerifierTimeout(), collectCardSourceRecords(), contentToMarkdown() (+19 more)

### Community 31 - "health-check.ts"
Cohesion: 0.16
Nodes (25): createdRemIdFromResponse(), DESTRUCTIVE_TOOLS, DIRECT_SERVER_TOOLS, directPass(), durationFrom(), EXISTING_REM_MUTATION_TOOLS, healthCheckArgsFor(), modeIncludesExistingMutations() (+17 more)

### Community 32 - "live-tool-smoke.ts"
Cohesion: 0.08
Nodes (22): callTool(), cases, __dirname, JsonRecord, markdownReport(), matrix, mcpUrl, postRpc() (+14 more)

### Community 33 - "handlers.ts"
Cohesion: 0.14
Nodes (26): createBridgeSuccess(), isBridgeToolName(), shouldForceApproval(), withApprovalTimeout(), attachLifecycle(), effectiveDocumentOrFolderTreeArgs(), effectiveSearchArgs(), effectiveStructuredBatchArgs() (+18 more)

### Community 34 - "area3-certification.ts"
Cohesion: 0.16
Nodes (25): assert(), assertIdempotencyAndDryRun(), assertMatrixShape(), assertSchemaQuality(), assertToolResult(), assertToolsList(), bridgeResponse(), bulkImportSampleFilePath (+17 more)

### Community 35 - "codex-pairing-routes.ts"
Cohesion: 0.17
Nodes (20): approvedPluginSession(), browserUrlForCode(), escapeHtml(), expireCodexPairingIfNeeded(), handleCodexPairingRoute(), pageShell(), pairingFromBodyOrUrl(), pluginSessionSecret() (+12 more)

### Community 36 - "BridgeResponse"
Cohesion: 0.16
Nodes (15): extractCreatedRemIds(), extractPartialExecution(), getExecutionEvidence(), getUpdatedDeletedEvidence(), BridgeHubDiagnostics, BridgeHubRequestOutcome, BridgeHubRequestSnapshot, BridgeHubStatus (+7 more)

### Community 37 - "mcp-server.ts"
Cohesion: 0.24
Nodes (22): BridgeRuntimeInfo, BridgeTimeoutBudgets, createMcpServer(), CreateMcpServerOptions, requiredOAuthScopesForTool(), ToolProfile, registerCardTools(), registerDeleteTools() (+14 more)

### Community 38 - "register-bulk-import-tools.ts"
Cohesion: 0.12
Nodes (21): BULK_IMPORT_OPTIONS_SCHEMA, childTitle(), chunkSummary(), configuredSourceRoots(), findChildByTitle(), isPathUnderRoot(), PLAN_IMPORT_FROM_FILE_INPUT_SCHEMA, PLAN_IMPORT_INPUT_SCHEMA (+13 more)

### Community 39 - "bulk-import.ts"
Cohesion: 0.15
Nodes (25): BulkImportFinalVerificationReport, BulkImportPlannerOptions, BulkImportSection, BulkImportSourceMetadata, BulkImportSourceNormalization, BulkImportVerificationResult, BulkImportVerificationStatus, clampInt() (+17 more)

### Community 40 - "style-presets.ts"
Cohesion: 0.15
Nodes (23): NoteStylePreset, applyNuclearPhysicsStylePresetToTree(), applyStylePresetToMarkdownArgs(), applyStylePresetToTree(), CLEAN_ACADEMIC_STYLE_PRESET, COLORFUL_STUDY_STYLE_PRESET, DEFAULT_NOTE_STYLE_PRESET, EXAM_READY_STYLE_PRESET (+15 more)

### Community 41 - "destructiveHint"
Cohesion: 0.11
Nodes (24): destructiveHint, readOnlyHint, annotations, annotations, annotations, annotations, justifications, annotations (+16 more)

### Community 42 - "config.ts"
Cohesion: 0.16
Nodes (21): boolFromEnv(), boundedNumberFromEnv(), BridgeDeploymentMode, defaultHostedAllowedOrigins(), deploymentModeFromEnv(), endpointHost(), getAuthModesSupported(), getExpectedPairingBehavior() (+13 more)

### Community 43 - "destructive_justification"
Cohesion: 0.12
Nodes (23): justifications, justifications, justifications, annotations, justifications, destructive_justification, read_only_justification, annotations (+15 more)

### Community 45 - "Final Audit Gates"
Cohesion: 0.19
Nodes (21): Bulk Import Source Fidelity, ChatGPT And Codex Auth Lanes, Final Audit Gates, Markdown Formula And Card Fidelity, Mass Note Workflows, Pairing Session Routing, Partial Live Proof Only, Performance And Soak Testing (+13 more)

### Community 46 - "types.ts"
Cohesion: 0.15
Nodes (6): ChatGptPairingStatus, ChatGptToolTier, McpAuthorizationCode, McpClient, StoredAuditEvent, normalizeToolProfile()

### Community 48 - "pairing.ts"
Cohesion: 0.22
Nodes (20): BridgeToolProfile, accessScopeForPermissionScope(), approveChatGptPairing(), ChatGptPairingPreview, companionHttpBaseUrl(), denyChatGptPairing(), disconnectChatGptPairing(), fetchHostedPluginDiagnostics() (+12 more)

### Community 49 - "performance-benchmark.ts"
Cohesion: 0.13
Nodes (12): checkSourceFidelity(), BenchmarkCase, cases, chunkCountFor(), medium, results, runCase(), markdownPreviewToolResult() (+4 more)

### Community 50 - "client.ts"
Cohesion: 0.19
Nodes (16): BridgeCancelRequest, BridgePluginHello, BridgePluginRegister, BridgeServerHello, BridgePluginRuntimeInfo, RemnoteInitialSyncStatus, RemnoteSdkCapabilityDetail, RemnoteSdkCapabilityName (+8 more)

### Community 51 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, autoprefixer, bestzip, copy-webpack-plugin, css-loader, esbuild-loader, html-webpack-plugin, mini-css-extract-plugin (+11 more)

### Community 52 - "manifest.json"
Cohesion: 0.11
Nodes (18): author, changelogUrl, description, enableOnMobile, id, manifestVersion, name, projectUrl (+10 more)

### Community 53 - "MemoryStorageProvider"
Cohesion: 0.16
Nodes (3): DashboardSessionContext, MemoryStorageProvider, User

### Community 55 - "BulkImportJobStore"
Cohesion: 0.29
Nodes (3): BulkImportJobStore, BulkImportCheckpoint, BulkImportJob

### Community 56 - "tool-permissions.ts"
Cohesion: 0.18
Nodes (16): buildMatrix(), BRIDGE_TOOL_NAME_SET, bridgeToolNameForPublicMcpTool(), ChatGptAccessScope, DirectWriteLayer, DirectWritePolicy, getDirectWritePolicySnapshot(), permissionModeForPrincipal() (+8 more)

### Community 57 - "protocol.ts"
Cohesion: 0.19
Nodes (12): assertDryRunDetector(), isDryRunRequest(), record(), safetyOptions(), ApprovalRiskLevel, BridgeLifecycleEvent, DangerousBridgeToolName, ReadOnlyBridgeToolName (+4 more)

### Community 58 - "bulk-import.test.ts"
Cohesion: 0.19
Nodes (16): countOccurrences(), duplicateValues(), expectedBulkImportReadbackText(), flattenBulkImportReadbackText(), normalizedUnits(), normalizeForSourceFidelity(), PlanNoteImportInput, previewAround() (+8 more)

### Community 59 - "audit-payload-safety.ts"
Cohesion: 0.23
Nodes (15): asNonEmptyString(), AuditPayloadClassification, AuditWriteOperation, classifyDisposableAuditPayload(), classifyTitleBody(), compactBodyIsStageSummary(), EXACT_SAFE_TITLES, flattenTreeTitles() (+7 more)

### Community 60 - "live-tool-regression.ts"
Cohesion: 0.13
Nodes (14): acceptanceGate(), __dirname, gate, isRecord(), JsonRecord, regressionJsonPath, regressionMarkdownPath, regressionReport (+6 more)

### Community 61 - "compilerOptions"
Cohesion: 0.13
Nodes (15): compilerOptions, allowJs, esModuleInterop, isolatedModules, jsx, module, moduleResolution, noEmit (+7 more)

### Community 62 - "register-diagnostic-tools.ts"
Cohesion: 0.23
Nodes (12): buildPublicUserDiagnosticSummary(), REDACT_KEY_PATTERNS, redactDiagnosticValue(), shouldRedactKey(), getRemnoteCapabilityGuide(), GUIDE_BLOCKS, REMNOTE_CAPABILITY_GUIDE_SOURCES, RemnoteCapabilityGuideBlock (+4 more)

### Community 63 - "tool-reference-generator.ts"
Cohesion: 0.24
Nodes (11): cell(), generateDeveloperDiagnosticsReferenceMarkdown(), generateToolReferenceMarkdown(), generateToolTierSummaryMarkdown(), table(), writeGeneratedToolDocs(), listToolPerformanceBudgets(), ToolPerformanceBudget (+3 more)

### Community 64 - "PermissionScope"
Cohesion: 0.25
Nodes (14): TrustedWriteDecision, ApprovalResolution, PermissionMode, PermissionScope, PendingApprovalRequest, BridgePluginStatus, BrowserBridgeClientOptions, BridgeHandlerContext (+6 more)

### Community 65 - "enforceScope"
Cohesion: 0.22
Nodes (15): assertTargetsInsideRoots(), enforceScope(), getCommandStaticScopeTargetIds(), getFocusedRemId(), getImplicitScopedRootRemId(), getSelectedRemIds(), getSingleSelectedRemId(), getStaticScopeTargetIds() (+7 more)

### Community 66 - "register-design-tools.ts"
Cohesion: 0.25
Nodes (13): CARD_LIMIT_SCHEMA, registerDesignedNoteTools(), registerDesignTemplateTools(), TEMPLATE_DESCRIPTION_SCHEMA, TEMPLATE_ID_SCHEMA, TEMPLATE_JSON_SCHEMA, TEMPLATE_NAME_SCHEMA, CARD_REPAIR_CARD_SCHEMA (+5 more)

### Community 68 - "applyStylePlan"
Cohesion: 0.18
Nodes (14): getNoteDesignTemplate(), buildExpectedStyleMap(), repairNoteDesign(), resolveTemplate(), updateNoteWithDesign(), verifyNoteAgainstDesign(), applyStylePlan(), rememberStylePlanResult() (+6 more)

### Community 69 - "RequestLedger"
Cohesion: 0.19
Nodes (3): readFormBody(), LedgerEntry, RequestLedger

### Community 70 - "planNoteImport"
Cohesion: 0.24
Nodes (9): ChunkPatch, bulkChapterIdempotencyKey(), bulkChunkId(), bulkChunkIdempotencyKey(), BulkImportJobStatus, BulkImportPlan, bulkImportRootIdempotencyKey(), planNoteImport() (+1 more)

### Community 72 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, esModuleInterop, module, moduleResolution, outDir, resolveJsonModule, rootDir, skipLibCheck (+4 more)

### Community 73 - "openWorldHint"
Cohesion: 0.17
Nodes (12): openWorldHint, annotations, justifications, annotations, annotations, justifications, annotations, justifications (+4 more)

### Community 74 - "open_world_justification"
Cohesion: 0.17
Nodes (12): justifications, annotations, justifications, annotations, justifications, open_world_justification, annotations, justifications (+4 more)

### Community 75 - "pairing-routes.ts"
Cohesion: 0.23
Nodes (9): generateSessionToken(), cleanExpiredPairings(), handlePairingRoute(), PendingPairing, pendingPairings, PluginPairingSession, pluginSessions, revokePluginSession() (+1 more)

### Community 76 - "tools"
Cohesion: 0.18
Nodes (11): annotations, justifications, annotations, justifications, annotations, justifications, tools, apply_remnote_command (+3 more)

### Community 77 - "boundary-smoke.ts"
Cohesion: 0.36
Nodes (9): distViolations(), importSpecifiers(), localEsmImportViolations(), read(), rel(), remnotePluginSdkSpec, repoRoot, sourceImportViolations() (+1 more)

### Community 78 - "chatgpt-app-submission.json"
Cohesion: 0.20
Nodes (9): app_info, category, description, display_name, subtitle, negative_test_cases, $schema, schema_version (+1 more)

### Community 79 - "unified-stage-gateway.test.ts"
Cohesion: 0.20
Nodes (4): GET_DOCUMENT_OR_FOLDER_TREE_INPUT_SCHEMA, McpToolResult, Handler, registerBasicHandlers()

### Community 80 - "status.ts"
Cohesion: 0.24
Nodes (7): BridgeToolPolicy, BridgeConnectionState, BridgeStatusSnapshot, INITIAL_BRIDGE_STATUS, BridgeTaskBanner(), BridgeWidgetHeader(), ToolProfileSummary()

### Community 81 - "approval.ts"
Cohesion: 0.33
Nodes (8): approvalSummary(), buildApprovalRequest(), getRequestPreviewMarkdown(), getRequestTargetRemId(), buildDeletePreview(), getInsertIndex(), getRemApprovalContext(), getRemChildCount()

### Community 82 - "package.json"
Cohesion: 0.22
Nodes (8): dependencies, react, react-dom, @remnote/plugin-sdk, license, name, private, version

### Community 83 - "markdown-pipeline-benchmark.ts"
Cohesion: 0.22
Nodes (3): BenchmarkCase, cases, reports

### Community 84 - "tool-health-history.ts"
Cohesion: 0.28
Nodes (8): emptyEntry(), getToolHistoryEntry(), getToolHistorySnapshot(), history, recentEvents, ToolHistoryEntry, ToolHistoryEvent, ToolHistoryEventKind

### Community 85 - "NormalizedMarkdownImportArgs"
Cohesion: 0.44
Nodes (9): MarkdownImportParseOptions, MarkdownImportPlan, NormalizedMarkdownImportArgs, MarkdownImportFidelityOptions, MarkdownImportHeadingMapping, MarkdownImportLimits, MarkdownImportRemnoteLayout, MarkdownImportSafetyOptions (+1 more)

### Community 86 - "bulk-import-tools.test.ts"
Cohesion: 0.28
Nodes (6): chapter, exportedChapter, failure(), Handler, makeHarness(), success()

### Community 87 - "codex-pairing-smoke.ts"
Cohesion: 0.36
Nodes (6): bridgeResponse(), connectHostedMockPlugin(), createApprovedPluginRegistration(), mcpToolCall(), postJson(), sockets

### Community 89 - "buildMassNoteManifest"
Cohesion: 0.32
Nodes (8): buildMassNoteManifest(), chunkMaxDepth(), chunkTopLevelChildren(), countTreeDepth(), countTreeNodes(), estimateTreeChars(), estimateWriteRisk(), markdownFallbackForPlan()

### Community 90 - "index.tsx"
Cohesion: 0.39
Nodes (5): BridgeCommandIntent, BridgeCommandIntentKind, createBridgeCommandIntent(), companionMcpUrl(), onActivate()

### Community 91 - "package.json"
Cohesion: 0.29
Nodes (6): engines, node, name, private, type, version

### Community 92 - "classifyToolResult"
Cohesion: 0.57
Nodes (7): classifyToolResult(), collectIds(), getStructured(), getToolError(), isRecord(), lifecycleReachedPlugin(), textField()

### Community 95 - "design-template-sync.ts"
Cohesion: 0.33
Nodes (6): HOSTED_NOTE_DESIGN_TEMPLATE_SYNC_PLAN, HostedNoteDesignTemplateOwner, HostedNoteDesignTemplateRecord, HostedNoteDesignTemplateSyncCursor, HostedNoteDesignTemplateSyncPlan, NoteDesignConflictBehavior

### Community 96 - "webpack.config.js"
Cohesion: 0.29
Nodes (6): config, CopyPlugin, HtmlWebpackPlugin, MiniCssExtractPlugin, { ProvidePlugin, BannerPlugin }, { resolve }

### Community 98 - "markdownInlineToRichText"
Cohesion: 0.73
Nodes (6): findUnescapedMarkdownDelimiter(), findUnescapedSingleDollar(), inlineMathRanges(), markdownCharEscaped(), markdownInlineToRichText(), validateMarkdownMathDelimiters()

### Community 99 - "dependencies"
Cohesion: 0.40
Nodes (5): dependencies, @modelcontextprotocol/sdk, pg, ws, zod

### Community 100 - "devDependencies"
Cohesion: 0.40
Nodes (5): devDependencies, tsx, @types/node, @types/ws, typescript

### Community 103 - "parseLatexSpansFromText"
Cohesion: 0.83
Nodes (4): findClosingDollar(), findUnescapedDelimiter(), isEscaped(), parseLatexSpansFromText()

### Community 104 - "annotations"
Cohesion: 0.67
Nodes (3): annotations, justifications, apply_style_plan

### Community 105 - "annotations"
Cohesion: 0.67
Nodes (3): annotations, justifications, clear_rem_formatting

### Community 106 - "annotations"
Cohesion: 0.67
Nodes (3): annotations, justifications, create_descriptor_card

### Community 107 - "annotations"
Cohesion: 0.67
Nodes (3): annotations, justifications, create_folder

### Community 108 - "annotations"
Cohesion: 0.67
Nodes (3): annotations, justifications, create_list_answer_card

### Community 109 - "annotations"
Cohesion: 0.67
Nodes (3): annotations, justifications, create_polished_note_tree

### Community 110 - "annotations"
Cohesion: 0.67
Nodes (3): annotations, justifications, create_rem_tree

### Community 111 - "annotations"
Cohesion: 0.67
Nodes (3): annotations, justifications, create_styled_rem_tree

### Community 112 - "annotations"
Cohesion: 0.67
Nodes (3): annotations, justifications, debug_get_raw_rich_text

### Community 113 - "annotations"
Cohesion: 0.67
Nodes (3): annotations, justifications, get_bridge_status

### Community 114 - "annotations"
Cohesion: 0.67
Nodes (3): annotations, justifications, get_children

### Community 115 - "annotations"
Cohesion: 0.67
Nodes (3): annotations, justifications, get_current_selection

### Community 116 - "annotations"
Cohesion: 0.67
Nodes (3): annotations, justifications, get_document_or_folder_tree

### Community 117 - "annotations"
Cohesion: 0.67
Nodes (3): annotations, justifications, get_focused_rem

### Community 118 - "annotations"
Cohesion: 0.67
Nodes (3): annotations, justifications, get_rem_rich

### Community 119 - "annotations"
Cohesion: 0.67
Nodes (3): annotations, justifications, get_rem_tree

### Community 120 - "annotations"
Cohesion: 0.67
Nodes (3): annotations, justifications, move_rem

### Community 121 - "annotations"
Cohesion: 0.67
Nodes (3): annotations, justifications, set_rem_type

### Community 122 - "annotations"
Cohesion: 0.67
Nodes (3): annotations, justifications, set_text_span_highlight

### Community 123 - "annotations"
Cohesion: 0.67
Nodes (3): update_rem, annotations, justifications

### Community 124 - "annotations"
Cohesion: 0.67
Nodes (3): update_rem_rich, annotations, justifications

### Community 125 - "annotations"
Cohesion: 0.67
Nodes (3): verify_note_design, annotations, justifications

## Knowledge Gaps
- **484 isolated node(s):** `$schema`, `schema_version`, `display_name`, `subtitle`, `description` (+479 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.