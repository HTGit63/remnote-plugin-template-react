import { declareIndexPlugin, type ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../index.css';
import {
  BRIDGE_COMMAND_INTENT_STORAGE_KEY,
  createBridgeCommandIntent,
  type BridgeCommandIntentKind,
} from './bridge-panel/command-intents';
import { DEFAULT_BRIDGE_SERVER_URL } from '../bridge/status';
import { copyTextToClipboard } from './bridge-panel/runtime-actions';
import { REMNOTE_MCP_LOGO_URL } from './bridge-panel/brand';
import { startPluginBridgeRuntime, stopPluginBridgeRuntime } from '../bridge/plugin-runtime';

function companionMcpUrl(serverUrl: string): string {
  const url = new URL(serverUrl);
  url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
  if (url.port === '47391') {
    url.port = '47392';
  }
  url.pathname = '/mcp';
  url.search = '';
  url.hash = '';
  return url.toString();
}

async function onActivate(plugin: ReactRNPlugin) {
  const bridgeTabIcon = REMNOTE_MCP_LOGO_URL;
  const openBridgeStatus = async () => {
    await plugin.window.openWidgetInRightSidebar('bridge-status');
  };

  const sendPanelIntent = async (kind: BridgeCommandIntentKind) => {
    await plugin.storage.setSession(BRIDGE_COMMAND_INTENT_STORAGE_KEY, createBridgeCommandIntent(kind));
    await openBridgeStatus();
  };

  const copyMcpUrl = async () => {
    const configuredUrl = await plugin.settings.getSetting<string>('bridge-server-url');
    const mcpUrl = companionMcpUrl(configuredUrl?.trim() || DEFAULT_BRIDGE_SERVER_URL);
    await copyTextToClipboard(mcpUrl);
    await plugin.app.toast('RemnoteMCP URL copied.');
  };

  await plugin.settings.registerStringSetting({
    id: 'bridge-server-url',
    title: 'Bridge Server URL',
    description: 'Bridge WebSocket endpoint. Use localhost for local mode or the hosted WSS URL after pairing.',
    defaultValue: 'ws://localhost:47391/remnote-bridge',
  });

  await plugin.settings.registerStringSetting({
    id: 'bridge-token',
    title: 'SENSITIVE LOCAL AUTH — Bridge Token',
    description: 'Local developer mode only. Never paste this token into ChatGPT or diagnostics. Hosted OAuth pairing does not use it.',
    defaultValue: '',
  });

  await plugin.settings.registerDropdownSetting({
    id: 'bridge-permission-mode',
    title: 'Bridge Writing Access',
    description: 'Normal modes are listed first. Elevated/delete modes are explicitly marked and should be changed in the widget Danger Zone.',
    defaultValue: 'read_create_modify',
    options: [
      { key: 'read_only', label: 'Read Only', value: 'read_only' },
      { key: 'read_create', label: 'Read + Create', value: 'read_create' },
      { key: 'read_create_modify', label: 'Read + Create + Modify', value: 'read_create_modify' },
      { key: 'full_control_delete_approval', label: 'ELEVATED — Full Control With Delete Approval', value: 'full_control_delete_approval' },
      { key: 'danger_zone', label: 'DANGER — Destructive Mode', value: 'danger_zone' },
    ],
  });

  await plugin.settings.registerDropdownSetting({
    id: 'bridge-permission-scope',
    title: 'Bridge Permission Scope',
    description: 'Limits which Rems ChatGPT can read or change through the local bridge.',
    defaultValue: 'focused_rem_and_descendants',
    options: [
      { key: 'focused_rem_only', label: 'Focused Rem Only', value: 'focused_rem_only' },
      {
        key: 'focused_rem_and_descendants',
        label: 'Focused Rem + Descendants',
        value: 'focused_rem_and_descendants',
      },
      { key: 'selected_rem_only', label: 'Selected Rem Only', value: 'selected_rem_only' },
      {
        key: 'selected_rem_and_descendants',
        label: 'Selected Rem + Descendants',
        value: 'selected_rem_and_descendants',
      },
      { key: 'approved_document_or_folder', label: 'Approved Document or Folder', value: 'approved_document_or_folder' },
      { key: 'workspace_allowed', label: 'Workspace Allowed', value: 'workspace_allowed' },
    ],
  });

  await plugin.settings.registerDropdownSetting({
    id: 'bridge-tool-access-tier',
    title: 'Bridge Tool Access Tier',
    description: 'Controls visible ChatGPT tools. Danger is destructive and is isolated behind confirmation in the widget.',
    defaultValue: 'note_writer',
    options: [
      { key: 'basic', label: 'Basic', value: 'basic' },
      { key: 'note_writer', label: 'Note Writer', value: 'note_writer' },
      { key: 'power_user', label: 'Power User', value: 'power_user' },
      { key: 'developer', label: 'Developer', value: 'developer' },
      { key: 'danger', label: 'DANGER — Destructive Tools', value: 'danger' },
    ],
  });

  await plugin.settings.registerStringSetting({
    id: 'bridge-approved-root-rem-id',
    title: 'Approved Root Rem ID',
    description: 'Required for Approved Document or Folder scope. Use a sandbox document/folder Rem ID.',
    defaultValue: '',
  });

  await plugin.app.registerWidget('bridge-status', WidgetLocation.RightSidebar, {
    dimensions: { height: 'auto', width: '100%' },
    widgetTabTitle: 'RemnoteMCP',
    widgetTabIcon: bridgeTabIcon,
    dontOpenByDefaultInTabLocation: false,
  });

  await startPluginBridgeRuntime(plugin, openBridgeStatus);

  await plugin.app.registerCommand({
    id: 'remnotemcp.open',
    name: 'Open RemnoteMCP',
    description: 'Open RemnoteMCP connection, writing access, and design controls.',
    keywords: 'remnotemcp mcp chatgpt vivy bridge notes',
    icon: bridgeTabIcon,
    action: openBridgeStatus,
  });

  await plugin.app.registerCommand({
    id: 'remnotemcp.health',
    name: 'Run RemnoteMCP Health Check',
    description: 'Open RemnoteMCP and run a quick bridge health check.',
    keywords: 'remnotemcp health check diagnostics',
    icon: bridgeTabIcon,
    action: () => sendPanelIntent('run_health_check'),
  });

  await plugin.app.registerCommand({
    id: 'remnotemcp.save-focused-template',
    name: 'Save Focused Note as Design Template',
    description: 'Analyze the focused Rem and save its visible note style as a reusable local template.',
    keywords: 'remnotemcp template design save focused note style',
    icon: bridgeTabIcon,
    action: () => sendPanelIntent('save_focused_template'),
  });

  await plugin.app.registerCommand({
    id: 'remnotemcp.use-focused-approved-root',
    name: 'Use Focused Rem as Approved Root',
    description: 'Set the focused Rem as the approved root for scoped note writing.',
    keywords: 'remnotemcp approved root focused scope',
    icon: bridgeTabIcon,
    action: () => sendPanelIntent('use_focused_as_approved_root'),
  });

  await plugin.app.registerCommand({
    id: 'remnotemcp.copy-mcp-url',
    name: 'Copy MCP URL',
    description: 'Copy the companion MCP endpoint for ChatGPT connector setup.',
    keywords: 'remnotemcp copy mcp url endpoint chatgpt',
    icon: bridgeTabIcon,
    action: async () => {
      try {
        await copyMcpUrl();
      } catch {
        await sendPanelIntent('copy_mcp_url');
      }
    },
  });

  await plugin.app.registerCommand({
    id: 'remnotemcp.copy-diagnostics',
    name: 'Copy Diagnostics',
    description: 'Copy a redacted RemnoteMCP diagnostic bundle.',
    keywords: 'remnotemcp copy diagnostics debug bundle',
    icon: bridgeTabIcon,
    action: () => sendPanelIntent('copy_diagnostics'),
  });

  await plugin.app.registerCommand({
    id: 'remnotemcp.open-settings',
    name: 'Open RemnoteMCP Settings',
    description: 'Open RemnoteMCP and show access/settings controls.',
    keywords: 'remnotemcp settings access scope writing mode',
    icon: bridgeTabIcon,
    action: () => sendPanelIntent('open_settings'),
  });

  try {
    await openBridgeStatus();
  } catch (error) {
    console.error('Failed to auto-open bridge status widget:', error);
  }
}

async function onDeactivate(_: ReactRNPlugin) {
  stopPluginBridgeRuntime();
}

declareIndexPlugin(onActivate, onDeactivate);
