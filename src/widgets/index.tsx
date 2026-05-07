import { declareIndexPlugin, type ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../index.css';

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

  await plugin.app.registerWidget('bridge-status', WidgetLocation.RightSidebar, {
    dimensions: { height: 'auto', width: '100%' },
    widgetTabTitle: 'Bridge',
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
