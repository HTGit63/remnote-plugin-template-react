import { declareIndexPlugin, type ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../index.css';

const BRIDGE_TAB_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%23252337'/%3E%3Cpath d='M8 4v5M16 4v5M7 9h10v3a5 5 0 0 1-4 4.9V20h-2v-3.1A5 5 0 0 1 7 12V9Z' fill='none' stroke='%23f4f3ff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M9 4v5M15 4v5' stroke='%238b7cf6' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E";

async function onActivate(plugin: ReactRNPlugin) {
  const openBridgeStatus = async () => {
    await plugin.window.openWidgetInRightSidebar('bridge-status');
  };

  await plugin.settings.registerStringSetting({
    id: 'bridge-server-url',
    title: 'Bridge Server URL',
    description: 'Local WebSocket bridge endpoint. Keep this on localhost unless you understand the risk.',
    defaultValue: 'ws://localhost:47391/remnote-bridge',
  });

  await plugin.settings.registerStringSetting({
    id: 'bridge-token',
    title: 'Bridge Token',
    description: 'Optional shared token. Must match REMNOTE_BRIDGE_TOKEN when the companion server requires one.',
    defaultValue: '',
  });

  await plugin.settings.registerDropdownSetting({
    id: 'bridge-permission-mode',
    title: 'Bridge Permission Mode',
    description: 'Controls whether incoming bridge requests can read, write with approval, or use trusted writes.',
    defaultValue: 'confirm_writes',
    options: [
      { key: 'read_only', label: 'Read Only', value: 'read_only' },
      { key: 'confirm_writes', label: 'Confirm Writes', value: 'confirm_writes' },
      { key: 'trusted_writes', label: 'Trusted Writes', value: 'trusted_writes' },
      { key: 'danger_zone', label: 'Danger Zone', value: 'danger_zone' },
    ],
  });

  await plugin.settings.registerDropdownSetting({
    id: 'bridge-permission-scope',
    title: 'Bridge Permission Scope',
    description: 'Limits which Rems ChatGPT can read or change through the local bridge.',
    defaultValue: 'focused_rem_only',
    options: [
      { key: 'focused_rem_only', label: 'Focused Rem Only', value: 'focused_rem_only' },
      { key: 'selected_rem_only', label: 'Selected Rem Only', value: 'selected_rem_only' },
      { key: 'descendants_of_selected_rem', label: 'Selected Rem Descendants', value: 'descendants_of_selected_rem' },
      { key: 'approved_document_or_folder', label: 'Approved Document or Folder', value: 'approved_document_or_folder' },
      { key: 'workspace_allowed', label: 'Workspace Allowed', value: 'workspace_allowed' },
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
    widgetTabTitle: 'Bridge',
    widgetTabIcon: BRIDGE_TAB_ICON,
    dontOpenByDefaultInTabLocation: false,
  });

  await plugin.app.registerCommand({
    id: 'remnote-chatgpt-bridge.open-status',
    name: 'Open RemNote ChatGPT Bridge',
    description: 'Open the RemNote bridge status widget in the right sidebar.',
    keywords: 'chatgpt bridge sidebar remnote',
    action: openBridgeStatus,
  });

  try {
    await openBridgeStatus();
  } catch (error) {
    console.error('Failed to auto-open bridge status widget:', error);
  }
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
