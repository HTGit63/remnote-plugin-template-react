/**
 * Dashboard login & authenticated page templates — Phase 4.
 *
 * Renders premium dark-mode login and authenticated dashboard pages.
 */

import type { CompanionServerConfig } from '../config.js';

const COMMON_HEAD = `
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', 'Outfit', sans-serif;
      background: #0a0e1a;
      color: #e0e6f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: rgba(15, 20, 40, 0.85);
      border: 1px solid rgba(100, 120, 255, 0.15);
      border-radius: 20px;
      padding: 48px 40px;
      max-width: 440px;
      width: 100%;
      backdrop-filter: blur(20px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 60px rgba(100, 120, 255, 0.06);
    }
    .card h1 {
      font-family: 'Outfit', sans-serif;
      font-weight: 600;
      font-size: 1.5rem;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #8b9cf7, #6ee7b7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .card p {
      color: #8892b0;
      font-size: 0.9rem;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 14px 24px;
      border: none;
      border-radius: 12px;
      font-family: 'Outfit', sans-serif;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.25s ease;
      text-decoration: none;
    }
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(102, 126, 234, 0.35);
    }
    .btn-danger {
      background: rgba(220, 50, 80, 0.15);
      border: 1px solid rgba(220, 50, 80, 0.3);
      color: #f87171;
      margin-top: 12px;
    }
    .btn-danger:hover {
      background: rgba(220, 50, 80, 0.25);
    }
    .logo-icon {
      font-size: 2rem;
      margin-bottom: 16px;
    }
    .user-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(100, 120, 255, 0.1);
      border: 1px solid rgba(100, 120, 255, 0.2);
      border-radius: 10px;
      padding: 10px 16px;
      margin-bottom: 20px;
      font-size: 0.85rem;
      color: #a3b8ef;
    }
    .status-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 20px 0;
    }
    .status-item {
      background: rgba(20, 25, 50, 0.6);
      border: 1px solid rgba(100, 120, 255, 0.08);
      border-radius: 10px;
      padding: 14px;
    }
    .status-item .label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #5a6a8e;
      margin-bottom: 4px;
    }
    .status-item .value {
      font-weight: 600;
      font-size: 0.9rem;
    }
    .connected { color: #6ee7b7; }
    .disconnected { color: #f87171; }
  </style>
`;

export function renderLoginPage(config: CompanionServerConfig, returnTo = '/dashboard'): string {
  const providerName = config.oauthProvider === 'google' ? 'Google' : config.oauthProvider || 'Identity Provider';
  const isLocal = config.deploymentMode === 'local';
  const loginParams = new URLSearchParams({ returnTo });
  if (isLocal) {
    loginParams.set('provider', 'local');
  }
  const loginUrl = `/auth/start?${loginParams.toString()}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Sign In — RemNote Companion</title>
  ${COMMON_HEAD}
</head>
<body>
  <div class="card">
    <div class="logo-icon">🔐</div>
    <h1>Sign In to Companion</h1>
    <p>Authenticate to access your RemNote Companion dashboard, pair devices, and manage plugin sessions.</p>
    <a href="${escapeHtml(loginUrl)}" class="btn btn-primary" id="login-btn">
      <span>Sign in with ${isLocal ? 'Local Emulator' : providerName}</span>
      <span>→</span>
    </a>
  </div>
</body>
</html>`;
}

export interface AuthenticatedDashboardData {
  config: CompanionServerConfig;
  userEmail: string;
  userId: string;
  bridgeConnected: boolean;
  publicToolCount: number;
  toolRegistryVersion: string;
  uptimeSeconds: number;
  csrfToken: string;
}

export function renderAuthenticatedDashboard(data: AuthenticatedDashboardData): string {
  const connClass = data.bridgeConnected ? 'connected' : 'disconnected';
  const connText = data.bridgeConnected ? '● Connected' : '○ Disconnected';
  const uptime = Math.floor(data.uptimeSeconds);
  const hours = Math.floor(uptime / 3600);
  const mins = Math.floor((uptime % 3600) / 60);
  const secs = uptime % 60;
  const uptimeStr = `${hours}h ${mins}m ${secs}s`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Dashboard — RemNote Companion</title>
  ${COMMON_HEAD}
  <meta name="csrf-token" content="${data.csrfToken}">
</head>
<body>
  <div class="card" style="max-width: 520px;">
    <div class="logo-icon">🎛️</div>
    <h1>Companion Dashboard</h1>

    <div class="user-badge">
      <span>👤</span>
      <span>${escapeHtml(data.userEmail)}</span>
    </div>

    <div class="status-grid">
      <div class="status-item">
        <div class="label">Plugin Bridge</div>
        <div class="value ${connClass}">${connText}</div>
      </div>
      <div class="status-item">
        <div class="label">Uptime</div>
        <div class="value">${uptimeStr}</div>
      </div>
      <div class="status-item">
        <div class="label">Public Tools</div>
        <div class="value">${data.publicToolCount}</div>
      </div>
      <div class="status-item">
        <div class="label">Registry</div>
        <div class="value" style="font-size:0.75rem;">${escapeHtml(data.toolRegistryVersion)}</div>
      </div>
    </div>

    <a href="/pair/panel" class="btn btn-primary" id="pair-device-btn" style="margin-bottom:8px;">
      <span>🔗</span>
      <span>Pair RemNote Plugin</span>
    </a>

    <form method="POST" action="/logout" id="logout-form">
      <input type="hidden" name="_csrf" value="${data.csrfToken}">
      <button type="submit" class="btn btn-danger" id="logout-btn">Sign Out</button>
    </form>
  </div>

  <script>
    // Attach CSRF token to all fetch/XHR requests
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    if (csrfMeta) {
      const csrf = csrfMeta.getAttribute('content');
      const origFetch = window.fetch;
      window.fetch = function(url, opts) {
        opts = opts || {};
        opts.headers = opts.headers || {};
        if (opts.method && opts.method.toUpperCase() !== 'GET') {
          opts.headers['X-CSRF-Token'] = csrf;
        }
        return origFetch.call(this, url, opts);
      };

      // For the logout form, inject the CSRF header via fetch
      const logoutForm = document.getElementById('logout-form');
      if (logoutForm) {
        logoutForm.addEventListener('submit', function(e) {
          e.preventDefault();
          fetch('/logout', {
            method: 'POST',
            headers: { 'X-CSRF-Token': csrf },
            credentials: 'same-origin',
          }).then(() => window.location.href = '/login');
        });
      }
    }
  </script>
</body>
</html>`;
}

export function renderPairingPanel(csrfToken: string, userEmail: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Pair Device — RemNote Companion</title>
  ${COMMON_HEAD}
  <meta name="csrf-token" content="${csrfToken}">
</head>
<body>
  <div class="card" style="max-width: 480px;">
    <div class="logo-icon">🔗</div>
    <h1>Pair RemNote Plugin</h1>
    <p>Enter the 6-digit pairing code shown in your RemNote plugin to link your device to <strong>${escapeHtml(userEmail)}</strong>.</p>

    <div id="pair-input-area">
      <input type="text" id="pairing-code" placeholder="Enter pairing code" maxlength="6" pattern="[0-9]{6}"
        style="width:100%; padding:14px 18px; border-radius:12px; border:1px solid rgba(100,120,255,0.2);
        background:rgba(20,25,50,0.8); color:#e0e6f0; font-size:1.4rem; font-family:'Outfit',sans-serif;
        text-align:center; letter-spacing:8px; outline:none; margin-bottom:16px;">
      <button class="btn btn-primary" id="confirm-pair-btn" onclick="confirmPairing()">
        <span>✓</span>
        <span>Confirm Pairing</span>
      </button>
    </div>

    <div id="pair-result" style="display:none; margin-top:16px; padding:16px; border-radius:12px;
      background:rgba(110,231,183,0.1); border:1px solid rgba(110,231,183,0.2); color:#6ee7b7; text-align:center;">
    </div>

    <a href="/dashboard" class="btn btn-danger" style="margin-top:16px;">← Back to Dashboard</a>
  </div>

  <script>
    const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    async function confirmPairing() {
      const code = document.getElementById('pairing-code').value.trim();
      if (code.length !== 6) { alert('Enter a 6-digit code.'); return; }
      const res = await fetch('/api/pair/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'same-origin',
        body: JSON.stringify({ pairingCode: code }),
      });
      const data = await res.json();
      const result = document.getElementById('pair-result');
      result.style.display = 'block';
      if (data.ok) {
        result.style.background = 'rgba(110,231,183,0.1)';
        result.style.borderColor = 'rgba(110,231,183,0.2)';
        result.style.color = '#6ee7b7';
        result.textContent = '✓ Device paired successfully!';
      } else {
        result.style.background = 'rgba(248,113,113,0.1)';
        result.style.borderColor = 'rgba(248,113,113,0.2)';
        result.style.color = '#f87171';
        result.textContent = data.error || 'Pairing failed.';
      }
    }
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
