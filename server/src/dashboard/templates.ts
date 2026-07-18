import type { CompanionServerConfig } from '../config.js';

export interface DashboardViewData {
  config: CompanionServerConfig;
  bridgeConnected: boolean;
  toolRegistryVersion: string;
  publicToolCount: number;
  startedAt: string;
  uptimeSeconds: number;
  pid: number;
  cwd: string;
  activeClientName?: string;
  lastHeartbeatAt?: string;
  mismatchCount: number;
  toolCallAuthMode?: string;
  activeToolTier?: string;
  toolCountsByTier?: Record<string, number>;
  verifiedToolCount?: number;
  runtimeUnverifiedToolCount?: number;
  lastSuccessfulTool?: string;
  lastFailedTool?: string;
  averageLatencyMs?: number | null;
  chatGptPairingStatus?: string;
  sessionStale?: boolean;
}

export function renderDashboard(data: DashboardViewData): string {
  const {
    config,
    bridgeConnected,
    toolRegistryVersion,
    publicToolCount,
    startedAt,
    uptimeSeconds,
    pid,
    cwd,
    activeClientName = 'None',
    lastHeartbeatAt = 'N/A',
    mismatchCount,
    toolCallAuthMode,
    activeToolTier = config.toolProfile,
    toolCountsByTier = {},
    verifiedToolCount = 0,
    runtimeUnverifiedToolCount = 0,
    lastSuccessfulTool = 'None',
    lastFailedTool = 'None',
    averageLatencyMs = null,
    chatGptPairingStatus = 'none',
    sessionStale = false,
  } = data;

  const uptimeFormatted = formatUptime(uptimeSeconds);
  const statusColor = bridgeConnected ? '#10B981' : '#EF4444';
  const statusText = bridgeConnected ? 'CONNECTED' : 'DISCONNECTED';
  const modeLabel = config.deploymentMode.toUpperCase().replace(/_/g, ' ');

  // Dynamic values depending on mode
  const authModeDesc = toolCallAuthMode
    ? toolCallAuthMode.toUpperCase().replace(/_/g, ' ')
    : config.bridgeToken
      ? 'LOCAL SECURE BEARER TOKEN'
      : 'UNAUTHENTICATED DEVELOPMENT';
  const tierCountsText = ['basic', 'note_writer', 'power_user', 'developer', 'danger']
    .map((tier) => `${tier}: ${toolCountsByTier[tier] ?? 0}`)
    .join(' / ');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Companion Server Dashboard — RemNote Bridge</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #0B0F19;
      --bg-card: rgba(17, 24, 39, 0.7);
      --bg-card-hover: rgba(31, 41, 55, 0.8);
      --border-color: rgba(255, 255, 255, 0.08);
      --text-main: #F3F4F6;
      --text-muted: #9CA3AF;
      --primary: #3B82F6;
      --primary-glow: rgba(59, 130, 246, 0.15);
      --success: #10B981;
      --success-glow: rgba(16, 185, 129, 0.2);
      --error: #EF4444;
      --error-glow: rgba(239, 68, 68, 0.2);
      --accent-purple: #8B5CF6;
      --accent-pink: #EC4899;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg-dark);
      background-image: 
        radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.1) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(139, 92, 246, 0.08) 0px, transparent 50%),
        radial-gradient(at 50% 100%, rgba(236, 72, 153, 0.05) 0px, transparent 50%);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      line-height: 1.5;
    }

    header {
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      padding: 1.25rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .brand-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-glow {
      width: 10px;
      height: 10px;
      background: var(--primary);
      border-radius: 50%;
      box-shadow: 0 0 15px 4px var(--primary);
      animation: pulse 2s infinite alternate;
    }

    header h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    header h1 span {
      background: linear-gradient(135deg, var(--primary), var(--accent-purple));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .header-badge {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-muted);
      letter-spacing: 0.05em;
    }

    main {
      flex: 1;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
      padding: 2.5rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .hero {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: radial-gradient(circle at 100% 100%, rgba(59, 130, 246, 0.06), transparent 60%), var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 2rem;
      backdrop-filter: blur(8px);
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
    }

    .hero-info h2 {
      font-family: 'Outfit', sans-serif;
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      letter-spacing: -0.03em;
    }

    .hero-info p {
      color: var(--text-muted);
      font-size: 0.95rem;
    }

    .status-panel {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      background: rgba(255, 255, 255, 0.03);
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 0.05em;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: ${statusColor};
      box-shadow: 0 0 10px 2px ${statusColor};
      animation: pulse 1.5s infinite alternate;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 1.5rem;
    }

    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.5rem;
      backdrop-filter: blur(8px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: transparent;
      transition: all 0.3s ease;
    }

    .card:hover {
      transform: translateY(-4px);
      border-color: rgba(255, 255, 255, 0.15);
      background: var(--bg-card-hover);
      box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.4);
    }

    .card.primary-border:hover::before {
      background: linear-gradient(90deg, var(--primary), var(--accent-purple));
    }

    .card.accent-border:hover::before {
      background: linear-gradient(90deg, var(--accent-purple), var(--accent-pink));
    }

    .card-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-main);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 0.5rem;
    }

    .card-title svg {
      width: 20px;
      height: 20px;
      color: var(--primary);
    }

    .data-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.85rem;
      font-size: 0.88rem;
    }

    .data-row:last-child {
      margin-bottom: 0;
    }

    .data-label {
      color: var(--text-muted);
      font-weight: 500;
    }

    .data-val {
      font-weight: 600;
      color: var(--text-main);
    }

    .data-val.mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.8rem;
      background: rgba(255, 255, 255, 0.04);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .data-val.tag {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .tag-blue {
      background: rgba(59, 130, 246, 0.15);
      color: #93C5FD;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }

    .tag-purple {
      background: rgba(139, 92, 246, 0.15);
      color: #C7D2FE;
      border: 1px solid rgba(139, 92, 246, 0.2);
    }

    .tag-green {
      background: rgba(16, 185, 129, 0.15);
      color: #A7F3D0;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .placeholders-section {
      margin-top: 1.5rem;
    }

    .section-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: var(--text-muted);
      letter-spacing: 0.02em;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.25rem;
    }

    .action-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px dashed rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      transition: all 0.25s ease;
      cursor: not-allowed;
    }

    .action-card.available {
      border-style: solid;
      cursor: pointer;
      background: var(--bg-card);
    }

    .action-card.available:hover {
      border-color: var(--primary);
      transform: translateY(-2px);
    }

    .action-name {
      font-size: 0.95rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .action-desc {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .action-status {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: auto;
      align-self: flex-start;
      padding: 0.15rem 0.35rem;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-muted);
    }

    .action-card.available .action-status {
      background: rgba(59, 130, 246, 0.1);
      color: var(--primary);
    }

    footer {
      border-top: 1px solid var(--border-color);
      padding: 1.5rem;
      text-align: center;
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-top: auto;
    }

    @keyframes pulse {
      0% {
        transform: scale(0.95);
        opacity: 0.8;
      }
      100% {
        transform: scale(1.05);
        opacity: 1;
      }
    }

    @media (max-width: 768px) {
      header {
        flex-direction: column;
        gap: 0.75rem;
        text-align: center;
      }
      .hero {
        flex-direction: column;
        gap: 1.25rem;
        text-align: center;
      }
      .status-panel {
        width: 100%;
        justify-content: center;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="brand-container">
      <div class="logo-glow"></div>
      <h1>RemNote MCP <span>Companion</span></h1>
    </div>
    <div class="header-badge">STABLE v0.1.0</div>
  </header>

  <main>
    <div class="hero">
      <div class="hero-info">
        <h2>Companion Server Status</h2>
        <p>Orchestrator dashboard for secure RemNote Plugin WebSocket connections & MCP request routing.</p>
      </div>
      <div class="status-panel">
        <div class="status-indicator">
          <div class="status-dot"></div>
          <span>${statusText}</span>
        </div>
      </div>
    </div>

    <div class="grid">
      <!-- Server Context Card -->
      <div class="card primary-border">
        <div class="card-title">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
          </svg>
          Runtime Context
        </div>
        <div class="data-row">
          <div class="data-label">Deployment Mode</div>
          <div class="data-val tag tag-purple">${modeLabel}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Process ID</div>
          <div class="data-val mono">${pid}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Companion Port</div>
          <div class="data-val mono">${config.port}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Server Uptime</div>
          <div class="data-val">${uptimeFormatted}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Auth Mode</div>
          <div class="data-val mono">${authModeDesc}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Session Stale</div>
          <div class="data-val tag ${sessionStale ? 'tag-purple' : 'tag-green'}">${sessionStale ? 'YES' : 'NO'}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Working Dir</div>
          <div class="data-val mono" style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${cwd}">${cwd}</div>
        </div>
      </div>

      <!-- WebSocket Bridge Card -->
      <div class="card accent-border">
        <div class="card-title">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a9 9 0 0112.16 0M4.136 4.136L21 21"></path>
          </svg>
          WSS Plugin Connection
        </div>
        <div class="data-row">
          <div class="data-label">Connection Status</div>
          <div class="data-val tag ${bridgeConnected ? 'tag-green' : 'tag-blue'}">${bridgeConnected ? 'ONLINE' : 'OFFLINE'}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Active Client</div>
          <div class="data-val mono">${activeClientName}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Last Heartbeat</div>
          <div class="data-val mono">${lastHeartbeatAt}</div>
        </div>
        <div class="data-row">
          <div class="data-label">ChatGPT Pairing</div>
          <div class="data-val tag ${chatGptPairingStatus === 'connected' ? 'tag-green' : 'tag-blue'}">${chatGptPairingStatus.toUpperCase()}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Message Stream</div>
          <div class="data-val mono">${config.bridgePath}</div>
        </div>
      </div>

      <!-- MCP Endpoint Card -->
      <div class="card primary-border">
        <div class="card-title">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
          </svg>
          MCP Specifications
        </div>
        <div class="data-row">
          <div class="data-label">HTTP MCP Endpoint</div>
          <div class="data-val mono">${config.mcpPath}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Exposed MCP Tools</div>
          <div class="data-val tag tag-green">${publicToolCount} tools</div>
        </div>
        <div class="data-row">
          <div class="data-label">Active Profile</div>
          <div class="data-val mono">${activeToolTier}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Tool Counts By Tier</div>
          <div class="data-val mono">${tierCountsText}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Schema Version</div>
          <div class="data-val mono">${toolRegistryVersion}</div>
        </div>
      </div>

      <!-- Security / Access Control Card -->
      <div class="card accent-border">
        <div class="card-title">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
          Security & Access Control
        </div>
        <div class="data-row">
          <div class="data-label">Authorization Protocol</div>
          <div class="data-val" style="font-size: 0.82rem; font-weight: 600;">${authModeDesc}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Verified Tools</div>
          <div class="data-val tag tag-green">${verifiedToolCount}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Runtime Unverified</div>
          <div class="data-val tag ${runtimeUnverifiedToolCount ? 'tag-purple' : 'tag-green'}">${runtimeUnverifiedToolCount}</div>
        </div>
        <div class="data-row">
          <div class="data-label">CORS Strict Origins</div>
          <div class="data-val tag tag-blue">${config.allowCors ? 'ACTIVE' : 'DISABLED'}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Remote Request Bind</div>
          <div class="data-val tag tag-purple">${config.allowRemote ? 'REMOTE' : 'LOCALHOST ONLY'}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Delete Tool Allowed</div>
          <div class="data-val tag ${config.enableDeleteTool ? 'tag-green' : 'tag-purple'}">${config.enableDeleteTool ? 'YES' : 'NO'}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Last Successful Tool</div>
          <div class="data-val mono">${lastSuccessfulTool}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Last Failed Tool</div>
          <div class="data-val mono">${lastFailedTool}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Average Latency</div>
          <div class="data-val mono">${averageLatencyMs === null ? 'N/A' : `${averageLatencyMs} ms`}</div>
        </div>
      </div>
    </div>

    <!-- Future Capabilities & User Interface Placeholders -->
    <div class="placeholders-section">
      <h3 class="section-title">Dashboard Workflows & Public Integrations</h3>
      <div class="actions-grid">
        <!-- Google Sign-In (Unavailable in Local/Personal Mode) -->
        <div class="action-card">
          <div class="action-name">
            <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.743-.08-1.3-.176-1.859H12.24z"/>
            </svg>
            Google Identity Login
          </div>
          <div class="action-desc">Sign in with an established Google/OIDC account to load your cloud settings profile.</div>
          <div class="action-status">Locked (Local-Auth)</div>
        </div>

        <!-- RemNote Plugin Pairing Challenge -->
        <div class="action-card">
          <div class="action-name">
            <svg style="width:16px;height:16px" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
            </svg>
            Pair RemNote Device
          </div>
          <div class="action-desc">Create a short-lived pairing challenge to securely pair a remote client device.</div>
          <div class="action-status">Locked (Local-Auth)</div>
        </div>

        <!-- Session & Device Revocation -->
        <div class="action-card">
          <div class="action-name">
            <svg style="width:16px;height:16px" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Device Control & Revocation
          </div>
          <div class="action-desc">Examine connected sessions, list authorized credentials, and instantly revoke session access.</div>
          <div class="action-status">Locked (Local-Auth)</div>
        </div>

        <!-- Audit log display -->
        <div class="action-card">
          <div class="action-name">
            <svg style="width:16px;height:16px" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Structured Audit Logs
          </div>
          <div class="action-desc">Inspect recent metadata, diagnostics, tool execution times, and safety evidence logs.</div>
          <div class="action-status">Locked (Local-Auth)</div>
        </div>
      </div>
    </div>
  </main>

  <footer>
    <p>&copy; 2026 RemNote MCP. Built with &hearts; for maximum developer reliability and safety.</p>
  </footer>
</body>
</html>`;
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}
