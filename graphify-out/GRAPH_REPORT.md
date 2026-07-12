# Graph Report - remnote-plugin-template-react  (2026-07-12)

## Corpus Check
- 205 files · ~217,553 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2840 nodes · 8315 edges · 163 communities (134 shown, 29 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 54 edges (avg confidence: 0.63)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `41328563`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- protocol-messages.ts
- remnoteSdkHelpers.ts
- structuredBatch.ts
- formattingWrites.ts
- schemas.ts
- markdown-importer.ts
- basicWrites.ts
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
- serialize.ts
- richTextFormatting.ts
- area1-smoke.ts
- tool-registry.ts
- startCompanionApp
- chatgpt-pairing-routes.ts
- bridge-hub-retry.ts
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
- bridge-hub.ts
- mcp-server.ts
- register-bulk-import-tools.ts
- bulk-import.ts
- style-presets.ts
- StyledRemTreeNode
- config.ts
- source-file-loader.ts
- FakeRem
- Render Deployment Config
- types.ts
- PostgresStorageProvider
- pairing.ts
- performance-benchmark.ts
- client.ts
- devDependencies
- manifest.json
- MemoryStorageProvider
- CodexPairingSession
- BulkImportJob
- tool-permissions.ts
- isDryRunRequest
- verifyBulkImportFinalReadback
- unified-stage-gateway.test.ts
- live-tool-regression.ts
- compilerOptions
- register-diagnostic-tools.ts
- tool-reference-generator.ts
- PermissionScope
- scope.ts
- register-design-tools.ts
- BrowserBridgeClient
- countRichTextMathSpans
- RemNote MCP Repair And Testing
- bulk-import-storage-smoke.ts
- Session
- compilerOptions
- 19. Stage Plan
- 19.3 Authoritative Stage Goal Matrix
- RemNote MCP Agent Operating Guide
- RemNote MCP Engineering Guide
- boundary-smoke.ts
- status.ts
- RemNote ChatGPT Bridge Hosted-Auth Refinement — Progress Log
- BridgeWidgetPieces.tsx
- getPublicMcpToolNames
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
- CompanionServerConfig
- IdempotencyRecord
- hashToken
- design-template-sync.ts
- webpack.config.js
- AuthenticatedPrincipal
- markdownInlineToRichText
- dependencies
- devDependencies
- types.ts
- log.md
- parseLatexSpansFromText
- codex-bearer-smoke.ts
- New RemNote MCP Reports
- Old RemNote MCP Reports
- RemnoteMCP Live Tool Regression
- 2026-07-10 RemNote Stage 9 and 10
- permissions.ts
- 11. Workflow Compatibility Contract
- 5. Repository Map
- 9. Auth And Connection Model
- Stage 8 File Import Audit
- writeTypes.ts
- 13. Markdown, Formula, Card, And Style Fidelity
- 6. Current Evidence Snapshot
- Developer Diagnostics Reference
- Bulk Resume Durability Implementation Plan
- Q: Stage 9 Markdown, formula, and rich-text fidelity dependency map
- Q: Stage 10 card parser, idempotency, verifier, and live proof dependency map
- normalizeMarkdownImportArgs
- 12. Mass Note And Bulk Import Contract
- 15. Security Contract
- 2026-06-04 Goal 3 tool truth, exposure, and diagnostics
- 2026-06-04 Goal 5 Markdown-to-Rem hierarchy pipeline
- package.json
- package.json
- 2026-06-04 Goal 6 and Goal 7 correctness/performance pass
- Session 5: User Login for Render Dashboard (Phase 4)
- RemnoteMCP Mass Note Readiness Audit
- RemnoteMCP Mass Note Readiness Audit
- RemnoteMCP Live Tool Smoke Report
- 10. Tool Correctness Contract
- Tool Tier Summary
- Session 6: RemNote Plugin Pairing (Phase 5)
- Session 7: Multi-User Bridge Session Router (Phase 6)
- Session 10: Hosted Resilience, Routing, and Idempotency (Phase 9)
- Session 12: Dashboard and Plugin UX Finalization (Phase 11)
- Session 13: Phase 7-12 Recheck, Docs, and Release Gate (Phase 12)
- Session 8: ChatGPT OAuth and MCP Authorization (Phase 7)
- Session 9: Trusted Write Mode and Plugin Authority (Phase 8)
- Cross-Cutting Principles
- Tool Reference
- Plugin UI Connection Status
- Bulk Import Source Fidelity
- Final Audit Gates
- Markdown Formula And Card Fidelity
- Mass Note Workflows
- Partial Live Proof Only
- Performance And Soak Testing
- Scope And Write Permissions
- Tool Registry And Profiles
- Existing Agent Contract
- Engineering Guide
- Repair And Testing Guide
- Project Log
- New MCP Test Report
- Old MCP Test Report

## God Nodes (most connected - your core abstractions)
1. `handleBridgeRequest()` - 79 edges
2. `BridgeToolArgs` - 73 edges
3. `StorageProvider` - 69 edges
4. `runSdkOperation()` - 62 edges
5. `PostgresStorageProvider` - 59 edges
6. `BridgeHub` - 58 edges
7. `MemoryStorageProvider` - 54 edges
8. `scripts` - 52 edges
9. `findRequiredRem()` - 51 edges
10. `BridgeToolResults` - 49 edges

## Surprising Connections (you probably didn't know these)
- `Plugin Logo Asset` --references--> `Plugin UI Connection Status`  [INFERRED]
  public/logo.svg → Agents.md
- `parseMarkdownImportPlan()` --indirect_call--> `cell()`  [INFERRED]
  shared/bridge/markdown-importer.ts → server/src/diagnostics/tool-reference-generator.ts
- `tableToRemNode()` --indirect_call--> `cell()`  [INFERRED]
  shared/bridge/markdown-importer.ts → server/src/diagnostics/tool-reference-generator.ts
- `BenchmarkCase` --references--> `parseMarkdownImportPlan()`  [EXTRACTED]
  server/src/markdown-pipeline-benchmark.ts → shared/bridge/markdown-importer.ts
- `registeredMassNoteTools()` --calls--> `createMcpServer()`  [EXTRACTED]
  tests/chatgpt-app-contract.test.ts → server/src/mcp-server.ts

## Import Cycles
- None detected.

## Communities (163 total, 29 thin omitted)

### Community 0 - "protocol-messages.ts"
Cohesion: 0.07
Nodes (65): BridgeServerMessage, BridgeToolArgs, BridgeToolResults, DebugGetRawRichTextArgs, DebugGetRawRichTextResult, DetectedContentType, GetChildrenArgs, GetChildrenResult (+57 more)

### Community 1 - "remnoteSdkHelpers.ts"
Cohesion: 0.10
Nodes (105): WritePerformanceReport, AppendToRemArgs, ApplyRemnoteCommandArgs, ApplyRemnoteCommandTargetMode, ApplyStructuredNoteBatchArgs, ApplyStylePlanArgs, ClearRemFormattingArgs, CreateClozeCardArgs (+97 more)

### Community 2 - "structuredBatch.ts"
Cohesion: 0.10
Nodes (52): buildWritePerformanceReport(), executeWriteOperation(), finalizeWriteOperationPlan(), writeEngineExecutionFromPlan(), buildWriteOperationPlan(), snapshotDirectChildIds(), verifyCreatedRems(), verifyStagedReplacement() (+44 more)

### Community 3 - "formattingWrites.ts"
Cohesion: 0.09
Nodes (56): BridgeErrorCode, resolveRangeFromPlainText(), RichTextFormattingError, collectDesignRecords(), createFlashcardRem(), directChildHeadingOperations(), rollbackCreatedRems(), appendMathToRem() (+48 more)

### Community 4 - "schemas.ts"
Cohesion: 0.10
Nodes (47): registerFormattingTools(), registerHighLevelWriteTools(), CARD_REPAIR_CARD_SCHEMA, COLOR_SCHEMA, CONNECTOR_SAFE_EXPECTED_STYLE_SCHEMA, CONNECTOR_SAFE_NOTE_STYLE_PRESET_FIELDS_SCHEMA, DELETE_CONFIRM_SCHEMA, DRY_RUN_SCHEMA (+39 more)

### Community 5 - "markdown-importer.ts"
Cohesion: 0.08
Nodes (47): addInlineSourceSnippets(), addNodeSourceSnippets(), addSnippet(), analyzeTree(), assertPlanLimits(), blockquoteMatch(), bulletMatch(), cleanMarkdownTextSegment() (+39 more)

### Community 6 - "basicWrites.ts"
Cohesion: 0.10
Nodes (51): appendMarkdownToRem(), createDocumentFromMarkdown(), createRemFromMarkdown(), createRemFromMarkdownSafely(), findSameTitleChild(), moveRem(), normalizeMarkdownTextForComparison(), normalizePlainTextForComparison() (+43 more)

### Community 7 - "notePlan.ts"
Cohesion: 0.06
Nodes (29): collectOutline(), countFlashcardMarkers(), countMathNodes(), countNodes(), countTableNodes(), createNotePlanSummary(), maxDepth(), nodeText() (+21 more)

### Community 8 - "StorageProvider"
Cohesion: 0.08
Nodes (26): buildOauthChallenge(), CHATGPT_REDIRECT_HOSTS, createLocalDashboardSessionForTests(), DEFAULT_CHATGPT_SCOPES, displayNameFromAuthorize(), ensureDefaultClient(), getExpectedMcpResource(), getOrCreateLocalDevUser() (+18 more)

### Community 9 - "scripts"
Cohesion: 0.04
Nodes (52): scripts, bridge:live-test, bridge:live-tool-regression, bridge:live-tool-smoke, build, check-types, dev, mcp:live-test (+44 more)

### Community 10 - "create-http-server.ts"
Cohesion: 0.11
Nodes (29): authorizeLocalMcpRequest(), LOCAL_BRIDGE_SCOPE_GRANTS, cleanExpiredPairings(), handlePairingRoute(), PairingRouterDeps, PendingPairing, pendingPairings, PluginPairingSession (+21 more)

### Community 11 - "validation.ts"
Cohesion: 0.15
Nodes (46): isBridgeToolName(), normalizeArgs(), parseBridgeRequest(), getStringField(), getTreeDepth(), isPlainObject(), normalizeStyleOperations(), optionalAppendPosition() (+38 more)

### Community 12 - "smoke.ts"
Cohesion: 0.05
Nodes (39): readFormBody(), LedgerEntry, RequestLedger, cleanupCurrentSessionRoot(), failedTools, findRegressionRoot(), getStructuredResult(), isToolErrorResponse() (+31 more)

### Community 13 - "mass-note-audit-report.ts"
Cohesion: 0.05
Nodes (44): area3Source, AuditRow, AuditRowInput, bulkImportSource, bulkJobStoreSource, bulkStorageSmokeSource, bulkToolSource, cardSource (+36 more)

### Community 14 - "scripts"
Cohesion: 0.05
Nodes (42): scripts, build, dev, generate-tool-reference, live-test, live-tool-regression, live-tool-smoke, mass-note-audit (+34 more)

### Community 15 - "designTemplates.ts"
Cohesion: 0.10
Nodes (41): AnalyzeNoteDesignArgs, ExportNoteDesignTemplateArgs, ImportNoteDesignTemplateArgs, ListNoteDesignTemplatesArgs, NoteDesignTemplateSummary, PreviewNoteDesignPlanArgs, SaveNoteDesignTemplateArgs, analyzeNoteDesign() (+33 more)

### Community 16 - "session-router.ts"
Cohesion: 0.07
Nodes (13): validatePluginSessionToken(), PluginConnection, PluginConnectionInfo, HostedPluginHello, LegacyPluginHello, PluginHelloMessage, PluginRegisterMessage, PluginRegistrationMessage (+5 more)

### Community 17 - "bridge-status.tsx"
Cohesion: 0.10
Nodes (33): clearHostedPairingSession(), loadHostedPairingSession(), getBridgeNextAction(), getBridgeStatusLabel(), getPermissionModeLabel(), getPermissionScopeLabel(), normalizePermissionMode(), normalizePermissionScope() (+25 more)

### Community 18 - "serialize.ts"
Cohesion: 0.17
Nodes (16): detectRichTypes(), getRemStructureType(), getRemTitle(), normalizeRichSpans(), readRemRich(), remTypeName(), richTextColorName(), summarizeRem() (+8 more)

### Community 19 - "richTextFormatting.ts"
Cohesion: 0.12
Nodes (31): applyClozeToRange(), applyFormatsToRichTextRange(), applyTextColorToAllText(), applyTextColorToRange(), applyTextHighlightToRange(), baseFormatsFromElement(), BuilderTextFormat, cloneRichText() (+23 more)

### Community 20 - "area1-smoke.ts"
Cohesion: 0.13
Nodes (33): assert(), assertNoRemovedTools(), checkAdvanced(), checkCore(), checkDiagnostics(), checkDirectWriteTrustedModeRegression(), checkHostedDiagnostics(), checkIdempotency() (+25 more)

### Community 21 - "tool-registry.ts"
Cohesion: 0.15
Nodes (27): getProfileHiddenTools(), getToolMetadata(), getToolPolicyEntry(), groupToolsByPolicy(), allPublicToolCache, buildKnownFailures(), buildToolCorrectnessMatrixEntry(), buildToolStateEntry() (+19 more)

### Community 22 - "startCompanionApp"
Cohesion: 0.09
Nodes (21): RunningCompanionApp, startCompanionApp(), enabledHostedConfig, legacyHostedConfig, legacyModeAliases, HOSTED_MODE_NOT_IMPLEMENTED_MESSAGE, validateConfig(), runtimeInfo (+13 more)

### Community 23 - "chatgpt-pairing-routes.ts"
Cohesion: 0.13
Nodes (22): approveRateLimited(), buildRedirectUrl(), clientIp(), escapeHtml(), expireIfNeeded(), failedApproveAttempts, handleChatGptPairingRoute(), normalizeAccessScope() (+14 more)

### Community 24 - "bridge-hub-retry.ts"
Cohesion: 0.16
Nodes (21): getIdempotencyKey(), hasAnyLifecyclePhase(), hasIdempotencyKey(), isDeleteTool(), isDryRunBridgeRequest(), isHighLevelIdempotentWrite(), isRealDeleteAttempt(), isTransientFailure() (+13 more)

### Community 25 - "tool-context.ts"
Cohesion: 0.11
Nodes (32): getToolPerformanceBudgetMs(), GET_DOCUMENT_OR_FOLDER_TREE_INPUT_SCHEMA, asRecord(), CallPluginFunction, clampTimeout(), defaultTimeoutForTool(), estimateChars(), estimateNodes() (+24 more)

### Community 26 - "routing-smoke.ts"
Cohesion: 0.15
Nodes (16): bridgeResponse(), connectHostedMockPlugin(), createApprovedPluginRegistration(), mcpToolCall(), postJson(), sleep(), sockets, bridgeResponse() (+8 more)

### Community 27 - "tool-policy.ts"
Cohesion: 0.09
Nodes (33): BASIC_SET, BASIC_TIER_TOOLS, DANGER_SET, DANGER_TIER_TOOLS, defaultPerformanceBudgetMs(), defaultScopeRequirement(), defaultSdkCapability(), DEVELOPER_SET (+25 more)

### Community 28 - "dashboard-routes.ts"
Cohesion: 0.14
Nodes (25): cleanExpiredStates(), exchangeOAuthCode(), handleDashboardRoute(), OAuthTokenResult, pendingOAuthStates, redirect(), safeReturnTo(), writeHtml() (+17 more)

### Community 29 - "BridgeHub"
Cohesion: 0.14
Nodes (8): createLifecycleEvent(), PendingRequest, BridgeHub, publicMcpToolNameForBridgeTool(), recordToolHistoryEvent(), BridgeClientMessage, BridgeResponse, createBridgeFailure()

### Community 30 - "designedNoteTools.ts"
Cohesion: 0.08
Nodes (38): CardWorkflowCardPlan, previewNoteDesignPlan(), createBasicFlashcard(), createListAnswerCard(), createMultipleChoiceCard(), buildExpectedStyleMap(), cardTypeFromBackText(), cardWorkflowResult() (+30 more)

### Community 31 - "health-check.ts"
Cohesion: 0.15
Nodes (25): createdRemIdFromResponse(), DESTRUCTIVE_TOOLS, DIRECT_SERVER_TOOLS, directPass(), durationFrom(), EXISTING_REM_MUTATION_TOOLS, healthCheckArgsFor(), modeIncludesExistingMutations() (+17 more)

### Community 32 - "live-tool-smoke.ts"
Cohesion: 0.08
Nodes (33): callTool(), cases, classifyToolResult(), collectIds(), __dirname, getStructured(), getToolError(), isRecord() (+25 more)

### Community 33 - "handlers.ts"
Cohesion: 0.08
Nodes (46): createBridgeSuccess(), approvalSummary(), buildApprovalRequest(), getRequestPreviewMarkdown(), getRequestTargetRemId(), shouldForceApproval(), withApprovalTimeout(), attachLifecycle() (+38 more)

### Community 34 - "area3-certification.ts"
Cohesion: 0.13
Nodes (33): assert(), assertBulkResumeDurability(), assertIdempotencyAndDryRun(), assertMatrixShape(), assertSchemaQuality(), assertToolResult(), assertToolsList(), assertWorkflowCompatibility() (+25 more)

### Community 35 - "codex-pairing-routes.ts"
Cohesion: 0.17
Nodes (19): approvedPluginSession(), browserUrlForCode(), escapeHtml(), expireCodexPairingIfNeeded(), handleCodexPairingRoute(), pageShell(), pairingFromBodyOrUrl(), pluginSessionSecret() (+11 more)

### Community 36 - "bridge-hub.ts"
Cohesion: 0.16
Nodes (24): extractCreatedRemIds(), extractPartialExecution(), getExecutionEvidence(), getUpdatedDeletedEvidence(), targetRootFromArgs(), BridgeHubDiagnostics, BridgeHubRequestOutcome, BridgeHubRequestSnapshot (+16 more)

### Community 37 - "mcp-server.ts"
Cohesion: 0.22
Nodes (24): BulkImportSourceFilePolicy, BridgeRuntimeInfo, BridgeTimeoutBudgets, createMcpServer(), CreateMcpServerOptions, exposeOpenAiToolSecuritySchemes(), requiredOAuthScopesForTool(), ToolProfile (+16 more)

### Community 38 - "register-bulk-import-tools.ts"
Cohesion: 0.10
Nodes (25): BULK_IMPORT_OPTIONS_SCHEMA, bulkStepVerificationSummary(), childTitle(), chunkStepOutput(), chunkSummary(), DEFAULT_SOURCE_FILE_POLICY, FILE_BULK_TOOL_ANNOTATIONS, findChildByTitle() (+17 more)

### Community 39 - "bulk-import.ts"
Cohesion: 0.09
Nodes (44): BulkImportJobStoreOptions, ChunkPatch, bulkChapterIdempotencyKey(), bulkChunkId(), bulkChunkIdempotencyKey(), BulkImportChunk, bulkImportChunkHasVerifiedEvidence(), BulkImportChunkStatus (+36 more)

### Community 40 - "style-presets.ts"
Cohesion: 0.13
Nodes (23): NoteStylePreset, applyNuclearPhysicsStylePresetToTree(), applyStylePresetToMarkdownArgs(), applyStylePresetToTree(), CLEAN_ACADEMIC_STYLE_PRESET, COLORFUL_STUDY_STYLE_PRESET, DEFAULT_NOTE_STYLE_PRESET, EXAM_READY_STYLE_PRESET (+15 more)

### Community 41 - "StyledRemTreeNode"
Cohesion: 0.11
Nodes (22): bottleneckForPhase(), DEFAULT_WRITE_PERFORMANCE_BUDGET_MS, WritePerformanceBottleneckLayer, WritePerformanceBudgetMs, WritePerformancePhaseDurationsMs, StyledRemTreeNode, WriteEngineExecution, WriteOperationPlan (+14 more)

### Community 42 - "config.ts"
Cohesion: 0.17
Nodes (22): boolFromEnv(), boundedNumberFromEnv(), BridgeDeploymentMode, DEFAULT_TIMEOUT_BUDGETS, defaultHostedAllowedOrigins(), deploymentModeFromEnv(), endpointHost(), getAuthModesSupported() (+14 more)

### Community 43 - "source-file-loader.ts"
Cohesion: 0.15
Nodes (25): blockedNetworks, BulkImportLoadedSourceFile, BulkImportSourceFileArgs, BulkImportSourceFileError, canonicalAllowedRoots(), ChatGptFileReference, createBulkImportSourceFileLoader(), decodePath() (+17 more)

### Community 45 - "Render Deployment Config"
Cohesion: 0.50
Nodes (4): ChatGPT And Codex Auth Lanes, Pairing Session Routing, Security Threat Model, Render Deployment Config

### Community 46 - "types.ts"
Cohesion: 0.12
Nodes (7): DashboardSessionContext, ChatGptPairingStatus, ChatGptToolTier, ChatGptTrustedWriteMode, McpClient, StoredAuditEvent, User

### Community 48 - "pairing.ts"
Cohesion: 0.22
Nodes (20): BridgeToolProfile, accessScopeForPermissionScope(), approveChatGptPairing(), ChatGptPairingPreview, companionHttpBaseUrl(), denyChatGptPairing(), disconnectChatGptPairing(), fetchHostedPluginDiagnostics() (+12 more)

### Community 49 - "performance-benchmark.ts"
Cohesion: 0.12
Nodes (14): checkMarkdownImporter(), checkSourceFidelity(), BenchmarkCase, cases, chunkCountFor(), medium, results, runCase() (+6 more)

### Community 50 - "client.ts"
Cohesion: 0.10
Nodes (25): bridgeResponse(), connectMockPlugin(), fakeRem, bridgeResponse(), connectHostedMockPlugin(), createApprovedPluginRegistration(), postJson(), sockets (+17 more)

### Community 51 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, autoprefixer, bestzip, copy-webpack-plugin, css-loader, esbuild-loader, html-webpack-plugin, mini-css-extract-plugin (+11 more)

### Community 52 - "manifest.json"
Cohesion: 0.11
Nodes (18): author, changelogUrl, description, enableOnMobile, id, manifestVersion, name, projectUrl (+10 more)

### Community 55 - "BulkImportJob"
Cohesion: 0.21
Nodes (3): BulkImportJobStore, BulkImportCheckpoint, BulkImportJob

### Community 56 - "tool-permissions.ts"
Cohesion: 0.18
Nodes (15): buildMatrix(), BRIDGE_TOOL_NAME_SET, bridgeToolNameForPublicMcpTool(), ChatGptAccessScope, DirectWriteLayer, DirectWritePolicy, getDirectWritePolicySnapshot(), permissionModeForPrincipal() (+7 more)

### Community 57 - "isDryRunRequest"
Cohesion: 0.70
Nodes (4): assertDryRunDetector(), isDryRunRequest(), record(), safetyOptions()

### Community 58 - "verifyBulkImportFinalReadback"
Cohesion: 0.21
Nodes (16): countOccurrences(), descendantHasText(), directChildHasText(), directExpectedUnits(), duplicateValues(), expectedBulkImportReadbackText(), findReadbackNodeByText(), flattenBulkImportReadbackText() (+8 more)

### Community 59 - "unified-stage-gateway.test.ts"
Cohesion: 0.15
Nodes (16): asNonEmptyString(), AuditPayloadClassification, AuditWriteOperation, classifyDisposableAuditPayload(), classifyTitleBody(), compactBodyIsStageSummary(), EXACT_SAFE_TITLES, flattenTreeTitles() (+8 more)

### Community 60 - "live-tool-regression.ts"
Cohesion: 0.13
Nodes (14): acceptanceGate(), __dirname, gate, isRecord(), JsonRecord, regressionJsonPath, regressionMarkdownPath, regressionReport (+6 more)

### Community 61 - "compilerOptions"
Cohesion: 0.13
Nodes (15): compilerOptions, allowJs, esModuleInterop, isolatedModules, jsx, module, moduleResolution, noEmit (+7 more)

### Community 62 - "register-diagnostic-tools.ts"
Cohesion: 0.19
Nodes (14): buildPublicUserDiagnosticSummary(), REDACT_KEY_PATTERNS, redactDiagnosticValue(), shouldRedactKey(), getRemnoteCapabilityGuide(), GUIDE_BLOCKS, REMNOTE_CAPABILITY_GUIDE_SOURCES, RemnoteCapabilityGuideBlock (+6 more)

### Community 63 - "tool-reference-generator.ts"
Cohesion: 0.21
Nodes (12): cell(), generateDeveloperDiagnosticsReferenceMarkdown(), generateToolReferenceMarkdown(), generateToolTierSummaryMarkdown(), table(), writeGeneratedToolDocs(), listToolPerformanceBudgets(), ToolPerformanceBudget (+4 more)

### Community 64 - "PermissionScope"
Cohesion: 0.38
Nodes (10): ToolPermissionBlockDetails, TrustedWriteDecision, ApprovalResolution, ApprovalRiskLevel, PermissionMode, PermissionScope, PendingApprovalRequest, BridgePluginStatus (+2 more)

### Community 65 - "scope.ts"
Cohesion: 0.32
Nodes (15): assertTargetsInsideRoots(), enforceScope(), getCommandStaticScopeTargetIds(), getFocusedRemId(), getImplicitScopedRootRemId(), getSelectedRemIds(), getSingleSelectedRemId(), getStaticScopeTargetIds() (+7 more)

### Community 66 - "register-design-tools.ts"
Cohesion: 0.21
Nodes (16): CARD_LIMIT_SCHEMA, CARD_TYPE_SCHEMA, EXPECTED_CARD_SCHEMA, registerDesignedNoteTools(), registerDesignTemplateTools(), TEMPLATE_DESCRIPTION_SCHEMA, TEMPLATE_ID_SCHEMA, TEMPLATE_JSON_SCHEMA (+8 more)

### Community 68 - "countRichTextMathSpans"
Cohesion: 0.27
Nodes (6): collectMathStatsForRemIds(), countRichTextMathSpans(), isSpacerPlainText(), richTextLooksLikeMath(), richTextMathSpans(), verifyNuclearPhysicsPreset()

### Community 69 - "RemNote MCP Repair And Testing"
Cohesion: 0.08
Nodes (25): Cleanup Policy, Evidence Labels, Failure Taxonomy, P0 Repairs, P1 Repairs, P2 Repairs, P3 Repairs, P4 Repairs (+17 more)

### Community 70 - "bulk-import-storage-smoke.ts"
Cohesion: 0.13
Nodes (7): assert(), buildPlan(), main(), proveMemoryStorage(), provePostgresStorage(), SmokeResult, BulkImportPlan

### Community 72 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, esModuleInterop, module, moduleResolution, outDir, resolveJsonModule, rootDir, skipLibCheck (+4 more)

### Community 73 - "19. Stage Plan"
Cohesion: 0.09
Nodes (22): 19.1 Skill Paths And Duplicate Resolution, 19.2 Stage Execution Rules, 19. Stage Plan, Stage 0: Evidence Refresh And Graph Map, Stage 10: Card Tools, Stage 11: Style, Design, And UI-Facing Note Quality, Stage 12: ChatGPT End-To-End Workflow, Stage 13: Codex End-To-End Workflow (+14 more)

### Community 74 - "19.3 Authoritative Stage Goal Matrix"
Cohesion: 0.10
Nodes (20): 19.3 Authoritative Stage Goal Matrix, Stage 0: Evidence Refresh And Graph Map, Stage 10: Card Tools, Stage 11: Style, Design, And UI-Facing Note Quality, Stage 12: ChatGPT End-To-End Workflow, Stage 13: Codex End-To-End Workflow, Stage 14: Plugin UI Polish, Stage 15: Security Audit (+12 more)

### Community 75 - "RemNote MCP Agent Operating Guide"
Cohesion: 0.11
Nodes (17): 14. UI And Design Contract, 16. Performance And Reliability Contract, 17. Code Quality Contract, 18. Documentation Contract, 1. How To Use This File, 20. Live Testing Protocol, 21. Error Quality Requirements, 22. Deployment Requirements (+9 more)

### Community 76 - "RemNote MCP Engineering Guide"
Cohesion: 0.12
Nodes (15): Architecture, Codex Bearer Setup, Current Live Evidence — 2026-07-02, Development Workflow, File-Backed Imports, Import Rules, Keep Root Clean, Live Testing Protocol (+7 more)

### Community 77 - "boundary-smoke.ts"
Cohesion: 0.22
Nodes (14): distViolations(), importSpecifiers(), localEsmImportViolations(), mcpBody(), read(), rel(), remnotePluginSdkSpec, repoRoot (+6 more)

### Community 78 - "status.ts"
Cohesion: 0.21
Nodes (12): BridgeToolPolicy, BridgeConnectionState, getBridgeCloseState(), INITIAL_BRIDGE_STATUS, booleanFact(), BridgeActivity, BridgeActivityKind, BridgeUiConnectionInput (+4 more)

### Community 79 - "RemNote ChatGPT Bridge Hosted-Auth Refinement — Progress Log"
Cohesion: 0.15
Nodes (13): 2026-07-02 Markdown Compression Cleanup, RemNote ChatGPT Bridge Hosted-Auth Refinement — Progress Log, Session 11: Security Hardening (Phase 10), Session 1: Baseline Recording & Preparation (Phase 0), Session 2: Mode Boundaries and Configuration Refinement (Phase 1), Session 3: Render Dashboard Foundation (Phase 2), Session 4: Persistent Storage Layer (Phase 3), Validation (+5 more)

### Community 80 - "BridgeWidgetPieces.tsx"
Cohesion: 0.40
Nodes (3): BridgeTaskBanner(), BridgeWidgetHeader(), ToolProfileSummary()

### Community 81 - "getPublicMcpToolNames"
Cohesion: 0.17
Nodes (11): checkFullAndMetadata(), checkPerformance(), checkTierSwitching(), ToolMetadata, getPublicMcpToolNames(), getRegistryMismatch(), isPublicMcpToolName(), STATIC_SDK_UNSUPPORTED_TOOLS (+3 more)

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
Cohesion: 0.24
Nodes (8): BulkImportSourceFileLoader, chapter, exportedChapter, failure(), Handler, makeHarness(), principal(), success()

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

### Community 92 - "CompanionServerConfig"
Cohesion: 0.22
Nodes (9): ChatGptPairingRouteDeps, CodexPairingRouteDeps, DashboardRouterDeps, OAuthRouteDeps, CompanionServerConfig, AuthenticatedDashboardData, DashboardViewData, formatUptime() (+1 more)

### Community 94 - "hashToken"
Cohesion: 0.21
Nodes (3): hashToken(), McpAuthorizationCode, PairingChallenge

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

### Community 101 - "types.ts"
Cohesion: 0.09
Nodes (13): AuthMode, HostedAuthNotConfiguredError, HostedAuthProvider, HostedSessionToken, OAuthAccount, ScopeGrant, ConsoleAuditLogger, withoutUndefined() (+5 more)

### Community 102 - "log.md"
Cohesion: 0.20
Nodes (9): 2026-06-02 stabilization cleanup, 2026-06-04 Goal 2 modern SDK tool refactor, 2026-06-04 Goal 4 transactional write engine and safe replacement, Status, Status, Validation, Validation, What Changed (+1 more)

### Community 103 - "parseLatexSpansFromText"
Cohesion: 0.83
Nodes (4): findClosingDollar(), findUnescapedDelimiter(), isEscaped(), parseLatexSpansFromText()

### Community 104 - "codex-bearer-smoke.ts"
Cohesion: 0.28
Nodes (7): allowedSourceFile, allowedSourceRoot, deniedSourceFile, deniedSourceRoot, mcpRequest(), mcpToolCall(), postJson()

### Community 105 - "New RemNote MCP Reports"
Cohesion: 0.25
Nodes (7): Current Codex Live Retest Addendum — 2026-07-02, Final Readiness, Improvements Since Old Run, New RemNote MCP Reports, Summary, Test Matrix, Worse Or Still Bad

### Community 106 - "Old RemNote MCP Reports"
Cohesion: 0.25
Nodes (7): Main Bugs, Old RemNote MCP Reports, Repair Need, Summary, Test Matrix, Tools That Looked Usable, Tools With Failed Or Weak Proof

### Community 107 - "RemnoteMCP Live Tool Regression"
Cohesion: 0.29
Nodes (6): Acceptance Gate, RemnoteMCP Live Tool Regression, RemnoteMCP Live Tool Smoke Report, Static Execution Matrix, Tool Results, Underlying Smoke Report

### Community 108 - "2026-07-10 RemNote Stage 9 and 10"
Cohesion: 0.29
Nodes (6): 2026-07-10 RemNote Stage 9 and 10, 2026-07-11 RemNote Stage 14 UI validation, Observation 1: Check repository documentation policy before saving plans, Observation 2: Keep meta-skill state outside product worktrees, Observation 3: Host-injected widgets need host-aware visual proof, Skill Observation Log

### Community 109 - "permissions.ts"
Cohesion: 0.48
Nodes (6): CREATE_TOOLS, DANGEROUS_TOOLS, getPermissionDecision(), PermissionDecision, READ_TOOLS, SAFE_WRITE_TOOLS

### Community 110 - "11. Workflow Compatibility Contract"
Cohesion: 0.33
Nodes (6): 11.1 Read Before Write, 11.2 Retry After Failure, 11.3 Style After Write, 11.4 Cards After Note Creation, 11.5 ChatGPT And Codex Against Same Plugin, 11. Workflow Compatibility Contract

### Community 111 - "5. Repository Map"
Cohesion: 0.33
Nodes (6): 5.1 Plugin Runtime, 5.2 RemNote Read/Write Engine, 5.3 Shared Bridge Protocol, 5.4 Companion MCP Server, 5.5 Tests And Smoke Suites, 5. Repository Map

### Community 112 - "9. Auth And Connection Model"
Cohesion: 0.33
Nodes (6): 9.1 Local Mode, 9.2 Hosted Mode, 9.3 ChatGPT Lane, 9.4 Codex Lane, 9.5 Plugin Connection Persistence, 9. Auth And Connection Model

### Community 113 - "Stage 8 File Import Audit"
Cohesion: 0.33
Nodes (5): Implemented Boundaries, Official ChatGPT Contract, Proof Boundary, Size Alignment, Stage 8 File Import Audit

### Community 114 - "writeTypes.ts"
Cohesion: 0.33
Nodes (5): COLOR_FORMAT_NAMES, COLOR_FORMATS, ParentLookupCode, TreeValidationState, ValidatedTreeNode

### Community 115 - "13. Markdown, Formula, Card, And Style Fidelity"
Cohesion: 0.40
Nodes (5): 13.1 Markdown, 13.2 Formulas, 13.3 Cards, 13.4 Style And Design, 13. Markdown, Formula, Card, And Style Fidelity

### Community 116 - "6. Current Evidence Snapshot"
Cohesion: 0.40
Nodes (5): 6.1 Files Reviewed For This Guide, 6.2 What Improved Since The Older Report, 6.3 What Remains Broken Or Unproven, 6.4 Current Tool Registry Facts, 6. Current Evidence Snapshot

### Community 117 - "Developer Diagnostics Reference"
Cohesion: 0.40
Nodes (4): Developer Diagnostics Reference, Performance Budgets, Runtime Fields, Tool Correctness Matrix

### Community 118 - "Bulk Resume Durability Implementation Plan"
Cohesion: 0.40
Nodes (4): Bulk Resume Durability Implementation Plan, Task 1: State Machine Guards, Task 2: Durability Surface And Storage, Task 3: Resume, Cancel, Audit

### Community 119 - "Q: Stage 9 Markdown, formula, and rich-text fidelity dependency map"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Stage 9 Markdown, formula, and rich-text fidelity dependency map, Source Nodes

### Community 120 - "Q: Stage 10 card parser, idempotency, verifier, and live proof dependency map"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Stage 10 card parser, idempotency, verifier, and live proof dependency map, Source Nodes

### Community 121 - "normalizeMarkdownImportArgs"
Cohesion: 0.40
Nodes (5): clampLimit(), normalizeMarkdownImportArgs(), normalizeMarkdownImportDuplicatePolicy(), normalizeMarkdownImportMode(), normalizeOptions()

### Community 122 - "12. Mass Note And Bulk Import Contract"
Cohesion: 0.50
Nodes (4): 12.1 Source Fidelity, 12.2 Resume And Idempotency, 12.3 File-Backed Import, 12. Mass Note And Bulk Import Contract

### Community 123 - "15. Security Contract"
Cohesion: 0.50
Nodes (4): 15.1 Security-Sensitive Files, 15.2 Threat Model Areas, 15.3 Security Acceptance Rules, 15. Security Contract

### Community 124 - "2026-06-04 Goal 3 tool truth, exposure, and diagnostics"
Cohesion: 0.50
Nodes (4): 2026-06-04 Goal 3 tool truth, exposure, and diagnostics, Status, Validation, What Changed

### Community 125 - "2026-06-04 Goal 5 Markdown-to-Rem hierarchy pipeline"
Cohesion: 0.50
Nodes (4): 2026-06-04 Goal 5 Markdown-to-Rem hierarchy pipeline, Status, Validation, What Changed

### Community 132 - "2026-06-04 Goal 6 and Goal 7 correctness/performance pass"
Cohesion: 0.50
Nodes (4): 2026-06-04 Goal 6 and Goal 7 correctness/performance pass, Status, Validation, What Changed

### Community 133 - "Session 5: User Login for Render Dashboard (Phase 4)"
Cohesion: 0.50
Nodes (4): Files Created, Files Modified, Session 5: User Login for Render Dashboard (Phase 4), What Was Done

### Community 134 - "RemnoteMCP Mass Note Readiness Audit"
Cohesion: 0.50
Nodes (3): Local Gate Results, Readiness Rows, RemnoteMCP Mass Note Readiness Audit

### Community 135 - "RemnoteMCP Mass Note Readiness Audit"
Cohesion: 0.50
Nodes (3): Local Gate Results, Readiness Rows, RemnoteMCP Mass Note Readiness Audit

### Community 136 - "RemnoteMCP Live Tool Smoke Report"
Cohesion: 0.50
Nodes (3): RemnoteMCP Live Tool Smoke Report, Static Execution Matrix, Tool Results

### Community 137 - "10. Tool Correctness Contract"
Cohesion: 0.67
Nodes (3): 10.1 Tool Profile Intent, 10.2 Preferred Tool Workflows, 10. Tool Correctness Contract

### Community 139 - "Session 6: RemNote Plugin Pairing (Phase 5)"
Cohesion: 0.67
Nodes (3): Files Created, Session 6: RemNote Plugin Pairing (Phase 5), What Was Done

### Community 140 - "Session 7: Multi-User Bridge Session Router (Phase 6)"
Cohesion: 0.67
Nodes (3): Files Created, Session 7: Multi-User Bridge Session Router (Phase 6), What Was Done

### Community 141 - "Session 10: Hosted Resilience, Routing, and Idempotency (Phase 9)"
Cohesion: 0.67
Nodes (3): Session 10: Hosted Resilience, Routing, and Idempotency (Phase 9), Validation, What Was Done

### Community 142 - "Session 12: Dashboard and Plugin UX Finalization (Phase 11)"
Cohesion: 0.67
Nodes (3): Session 12: Dashboard and Plugin UX Finalization (Phase 11), Validation, What Was Done

### Community 143 - "Session 13: Phase 7-12 Recheck, Docs, and Release Gate (Phase 12)"
Cohesion: 0.67
Nodes (3): Session 13: Phase 7-12 Recheck, Docs, and Release Gate (Phase 12), Validation, What Was Done

### Community 144 - "Session 8: ChatGPT OAuth and MCP Authorization (Phase 7)"
Cohesion: 0.67
Nodes (3): Session 8: ChatGPT OAuth and MCP Authorization (Phase 7), Validation, What Was Done

### Community 145 - "Session 9: Trusted Write Mode and Plugin Authority (Phase 8)"
Cohesion: 0.67
Nodes (3): Session 9: Trusted Write Mode and Plugin Authority (Phase 8), Validation, What Was Done

## Knowledge Gaps
- **743 isolated node(s):** `private`, `name`, `version`, `license`, `test` (+738 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `StorageProvider` connect `StorageProvider` to `AuthenticatedPrincipal`, `codex-pairing-routes.ts`, `bridge-hub.ts`, `mcp-server.ts`, `bulk-import-storage-smoke.ts`, `create-http-server.ts`, `dashboard-routes.ts`, `types.ts`, `PostgresStorageProvider`, `session-router.ts`, `MemoryStorageProvider`, `BulkImportJob`, `chatgpt-pairing-routes.ts`, `tool-context.ts`, `CompanionServerConfig`, `BridgeHub`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `BridgeResponse` connect `BridgeHub` to `protocol-messages.ts`, `smoke.ts`, `bridge-status.tsx`, `startCompanionApp`, `bridge-hub-retry.ts`, `tool-context.ts`, `routing-smoke.ts`, `designedNoteTools.ts`, `health-check.ts`, `handlers.ts`, `area3-certification.ts`, `bridge-hub.ts`, `register-bulk-import-tools.ts`, `client.ts`, `unified-stage-gateway.test.ts`, `PermissionScope`, `scope.ts`, `BrowserBridgeClient`, `bulk-import-tools.test.ts`, `codex-pairing-smoke.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `scripts` connect `scripts` to `package.json`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `private`, `name`, `version` to the rest of the system?**
  _743 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `protocol-messages.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07155399473222125 - nodes in this community are weakly interconnected._
- **Should `remnoteSdkHelpers.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09575546863682458 - nodes in this community are weakly interconnected._
- **Should `structuredBatch.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09696969696969697 - nodes in this community are weakly interconnected._