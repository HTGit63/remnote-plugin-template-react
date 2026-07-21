import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

function readRepoFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('final judge documentation contract', () => {
  test.each(['README.md', 'judges/README.md'])(
    '%s uses the localhost development workflow without recommending an archive',
    (path) => {
      const readme = readRepoFile(path);

      expect(readme).toContain(
        'git clone https://github.com/HTGit63/remnote-plugin-template-react.git',
      );
      expect(readme).toContain('http://localhost:8080');
      expect(readme).toMatch(/\nnpm run dev\n/);
      expect(readme).not.toMatch(/PluginZip\.zip|release-artifacts|Upload plugin/i);
    },
  );

  test('benchmark records current connected uploaded-audio and uploaded-video proof', () => {
    const benchmarks = readRepoFile('judges/BENCHMARKS.md');

    expect(benchmarks).toContain('C4AUcbO4uXbJkAMZp');
    expect(benchmarks).toContain('QyPyn0Ch6C6NdStoO');
    expect(benchmarks).toContain('`onlyAudio: true`');
    expect(benchmarks).toContain('`onlyAudio: false`');
    expect(benchmarks).not.toMatch(/BLOCKED BY CLIENT DISCOVERY|CURRENT CLIENT BLOCKED/i);
  });

  test('engineering audit closes the obsolete MP3 and MP4 follow-up', () => {
    const audit = readRepoFile('judges/BUILD_WEEK_ENGINEERING_AUDIT.md');

    expect(audit).toContain('C4AUcbO4uXbJkAMZp');
    expect(audit).toContain('QyPyn0Ch6C6NdStoO');
    expect(audit).not.toMatch(/still need a fresh-chat connected acceptance run/i);
    expect(audit).not.toMatch(/The next live test must use a real MP4/i);
  });
});
