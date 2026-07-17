import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';

const ROOT = new URL('..', import.meta.url);

async function source(path: string): Promise<string> {
  return readFile(new URL(path, ROOT), 'utf8');
}

describe('RemnoteMCP sidebar experience', () => {
  test('ships the supplied logo as an inline build asset for native and sandbox widgets', async () => {
    const [webpack, brand, pieces, index] = await Promise.all([
      source('webpack.config.js'),
      source('src/widgets/bridge-panel/brand.ts'),
      source('src/widgets/components/BridgeWidgetPieces.tsx'),
      source('src/widgets/index.tsx'),
    ]);

    expect(webpack).toMatch(/test:\s*\/\\\.svg\$\//);
    expect(webpack).toContain("type: 'asset/inline'");
    expect(brand).toContain("public/logo.svg");
    expect(pieces).toContain('REMNOTE_MCP_LOGO_URL');
    expect(index).toContain('REMNOTE_MCP_LOGO_URL');
    expect(pieces).not.toContain('src="logo.svg"');
    expect(index).not.toContain("new URL('logo.svg'");
  });

  test('keeps the default screen focused on the three user decisions', async () => {
    const [widget, styles] = await Promise.all([
      source('src/widgets/bridge-status.tsx'),
      source('src/index.css'),
    ]);

    expect(widget).toContain('Ready for your notes');
    expect(widget).toContain('bridge-primary-actions');
    expect(widget).toContain('title="Connection"');
    expect(widget).toContain('title="Writing access"');
    expect(widget).toContain('title="Design style"');
    expect(widget).toContain('Open ChatGPT');
    expect(widget).toContain('Advanced settings');
    expect(widget).toContain('const [connectionOpen, setConnectionOpen] = useState(false)');
    expect(widget).toContain('const [accessOpen, setAccessOpen] = useState(false)');
    expect(widget).toContain('const [designOpen, setDesignOpen] = useState(false)');
    expect(widget).toContain('<strong>ChatGPT Remote</strong>');
    expect(widget).toContain('aria-label="ChatGPT Remote connection controls"');
    expect(widget).toContain('>Ping</button>');
    expect(widget).toContain('>Connect</button>');
    expect(widget).toContain('>Disconnect</button>');
    expect(widget).toContain('requestBridgeRuntimeReconnect');
    expect(widget).toContain('disabled={chatGptPairingConnected || Boolean(activeOperation)}');
    expect(widget.indexOf('aria-label="ChatGPT Remote connection controls"')).toBeLessThan(
      widget.indexOf('bridge-advanced-shell')
    );
    expect(styles).toContain('scrollbar-gutter: stable');
    expect(styles).toContain('overflow-anchor: none');
    expect(styles).toContain('.bridge-remote-controls');
    expect(widget).not.toContain('Pair this RemNote device from the dashboard');
    expect(widget.indexOf('bridge-primary-actions')).toBeLessThan(widget.indexOf('bridge-advanced-shell'));
    expect(widget.indexOf('bridge-advanced-shell')).toBeLessThan(widget.indexOf('Run Quick Health Check'));
  });
});
