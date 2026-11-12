// npm run update: get the newest Black Swan from GitHub and start it.
// Steps: check nothing is half-edited, pull main, install new libraries, open the Mac app.
// Use `npm run update -- --browser` to open it in the browser instead,
// or `npm run update -- --no-start` to only update.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const args = process.argv.slice(2);
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(cmd, cmdArgs, { quiet = false } = {}) {
  const r = spawnSync(cmd, cmdArgs, { stdio: quiet ? 'pipe' : 'inherit', encoding: 'utf8' });
  return { ok: r.status === 0, out: (r.stdout || '').trim() };
}

function stop(message) {
  console.error(`\nUpdate stopped: ${message}\n`);
  process.exit(1);
}

function say(message) {
  console.log(`\n== ${message}`);
}

const changes = run('git', ['status', '--porcelain', '--untracked-files=no'], { quiet: true });
if (!changes.ok) stop('this folder is not a git repository. Run the command inside the black-swan folder.');
if (changes.out) {
  stop(
    'you have edited files that are not saved to git:\n' +
      changes.out +
      '\nKeep them with `git stash`, or throw them away with `git checkout .`, then run the update again.',
  );
}

const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { quiet: true }).out;
if (branch !== 'main') {
  say(`Switching from "${branch}" to main`);
  if (!run('git', ['checkout', 'main']).ok) stop('could not switch to the main branch.');
}

const before = run('git', ['rev-parse', 'HEAD'], { quiet: true }).out;
say('Getting the newest version from GitHub');
if (!run('git', ['pull', '--ff-only', 'origin', 'main']).ok) {
  stop('could not pull from GitHub. Check your internet connection and try again.');
}
const after = run('git', ['rev-parse', 'HEAD'], { quiet: true }).out;

if (before === after) {
  say('Already up to date');
} else {
  say('What is new');
  run('git', ['log', '--oneline', '--no-merges', `${before}..${after}`]);
}

// `npm ci` installs exactly what package-lock.json lists and never edits that file,
// so the next update does not trip over a changed lock file.
const lockChanged =
  before !== after && run('git', ['diff', '--quiet', before, after, '--', 'package-lock.json'], { quiet: true }).ok === false;
if (lockChanged || !existsSync('node_modules')) {
  say('Installing libraries');
  if (!run(npm, ['ci', '--no-fund', '--no-audit']).ok) stop('installing libraries failed. The message above says why.');
} else {
  say('Libraries are unchanged');
}

if (args.includes('--no-start')) {
  say('Done. Start the game with `npm run app` or `npm run dev`.');
} else if (args.includes('--browser')) {
  say('Starting Black Swan in the browser');
  run(npm, ['run', 'dev']);
} else {
  say('Starting the Black Swan app (close its window to stop)');
  run(npm, ['run', 'app']);
}
