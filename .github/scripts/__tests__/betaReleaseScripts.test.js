/**
 * @jest-environment node
 */
/* eslint-disable */
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const scriptsDir = path.resolve(__dirname, '..');

let tmpDir;
let binDir;
let logFile;

const writeStub = (name, body) => {
  const file = path.join(binDir, name);
  fs.writeFileSync(file, `#!/bin/sh\n${body}\n`);
  fs.chmodSync(file, 0o755);
};

const run = (script, args) => spawnSync(path.join(scriptsDir, script), args, {
  cwd: tmpDir,
  encoding: 'utf8',
  env: { ...process.env, PATH: `${binDir}:${process.env.PATH}`, STUB_LOG: logFile },
});

const loggedCalls = () => (fs.existsSync(logFile)
  ? fs.readFileSync(logFile, 'utf8').trim().split('\n').filter(Boolean)
  : []);

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'beta-scripts-'));
  binDir = path.join(tmpDir, 'bin');
  fs.mkdirSync(binDir);
  logFile = path.join(tmpDir, 'calls.log');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('getBetaVersion.sh', () => {
  beforeEach(() => {
    writeStub('npx', `
      [ "$1 $2" = "changie next" ] || exit 2
      case "$3" in
        auto) echo 3.3.0 ;;
        patch) echo 3.2.2 ;;
        *) exit 2 ;;
      esac`);
  });

  it('uses the next patch version when there are no unreleased fragments', () => {
    const result = run('getBetaVersion.sh', ['412', '7']);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('3.2.2-beta.412.7');
  });

  it('uses the next auto version when unreleased fragments exist', () => {
    fs.mkdirSync(path.join(tmpDir, '.changes', 'unreleased'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, '.changes', 'unreleased', 'feature.yaml'), 'kind: Feature (minor)\n');
    const result = run('getBetaVersion.sh', ['412', '10']);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('3.3.0-beta.412.10');
  });

  it.each([
    [[]],
    [['412']],
    [['0', '1']],
    [['012', '1']],
    [['412', '01']],
    [['412', 'abc']],
    [['412;rm', '1']],
  ])('rejects invalid arguments %j', (args) => {
    const result = run('getBetaVersion.sh', args);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toMatch(/^Usage:/);
  });

  it('fails when changie cannot compute the next version', () => {
    writeStub('npx', 'echo "changie error" >&2; exit 1');
    const result = run('getBetaVersion.sh', ['412', '7']);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toMatch(/Unable to compute the next patch version/);
  });
});

describe('deleteBetaReleases.sh', () => {
  const tags = [
    'v3.2.1',
    'v3.2.2-beta.412.7',
    'v3.2.2-beta.412.12',
    'v3.3.0-beta.412.3',
    'v3.2.2-beta.4120.1',
    'v3.2.2-beta.41.2',
    'v3.2.2-beta.412',
    'v3.2.2-beta.412.1x',
    'v3.2.2-alpha.412.1',
    'v3.3.0-1921AF.0',
  ];
  // v3.2.2-beta.412.12 has a tag but no release.
  const releases = tags.filter((tag) => tag !== 'v3.2.2-beta.412.12');

  beforeEach(() => {
    const refs = tags.map((tag) => `refs/tags/${tag}`).join('\n');
    writeStub('gh', `
      echo "$*" >> "$STUB_LOG"
      if [ "$1 $2" = "api --paginate" ]; then
        printf '%s\\n' "${refs}"
        exit 0
      fi
      if [ "$1 $2" = "release view" ]; then
        case " ${releases.join(' ')} " in
          *" $3 "*) exit 0 ;;
          *) exit 1 ;;
        esac
      fi
      exit 0`);
  });

  const deletions = () => loggedCalls().filter((call) => !call.startsWith('api --paginate') && !call.startsWith('release view'));

  it("deletes only the PR's beta releases and tags", () => {
    const result = run('deleteBetaReleases.sh', ['412']);
    expect(result.status).toBe(0);
    expect(deletions()).toEqual([
      'release delete v3.2.2-beta.412.7 --cleanup-tag --yes',
      'api --method DELETE repos/{owner}/{repo}/git/refs/tags/v3.2.2-beta.412.12',
      'release delete v3.3.0-beta.412.3 --cleanup-tag --yes',
    ]);
  });

  it('keeps the tag passed as the beta to keep', () => {
    const result = run('deleteBetaReleases.sh', ['412', 'v3.3.0-beta.412.3']);
    expect(result.status).toBe(0);
    expect(deletions()).toEqual([
      'release delete v3.2.2-beta.412.7 --cleanup-tag --yes',
      'api --method DELETE repos/{owner}/{repo}/git/refs/tags/v3.2.2-beta.412.12',
    ]);
  });

  it('does nothing when the PR has no betas', () => {
    const result = run('deleteBetaReleases.sh', ['999']);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/No earlier beta releases found for PR #999/);
    expect(deletions()).toEqual([]);
  });

  it.each([[[]], [['0']], [['012']], [['41.2']], [['412|.*']]])('rejects invalid PR numbers %j', (args) => {
    const result = run('deleteBetaReleases.sh', args);
    expect(result.status).toBe(1);
    expect(loggedCalls()).toEqual([]);
  });
});
