// npm run set-version -- 1.0.1
// Puts a new version number in every file that holds one, so they never disagree:
// package.json, package-lock.json, src-tauri/Cargo.toml and src-tauri/Cargo.lock.
// (The Mac app takes its version from package.json; see src-tauri/tauri.conf.json.)
// With no number it prints the version each file holds.
//
// Releasing a new version: run this, add a "## 1.0.1: ..." section at the top of CHANGELOG.md,
// and merge to main. GitHub then builds the Mac app and every installed copy offers the update.
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (f) => readFileSync(new URL(f, root), 'utf8');
const write = (f, s) => writeFileSync(new URL(f, root), s);

/** The version each file holds now. */
export function versions() {
  const pkg = JSON.parse(read('package.json')).version;
  const lockJson = JSON.parse(read('package-lock.json'));
  const cargo = /^\[package\][^[]*?^version = "([^"]+)"/m.exec(read('src-tauri/Cargo.toml'))?.[1];
  const cargoLock = /\[\[package\]\]\nname = "black-swan"\nversion = "([^"]+)"/.exec(read('src-tauri/Cargo.lock'))?.[1];
  return { 'package.json': pkg, 'package-lock.json': lockJson.version, 'package-lock.json (root)': lockJson.packages?.['']?.version, 'src-tauri/Cargo.toml': cargo, 'src-tauri/Cargo.lock': cargoLock };
}

function setVersion(v) {
  if (!/^\d+\.\d+\.\d+$/.test(v)) throw new Error(`"${v}" is not a version like 1.0.1`);
  const pkg = read('package.json');
  write('package.json', pkg.replace(/("version":\s*")[^"]+(")/, `$1${v}$2`));
  const lock = JSON.parse(read('package-lock.json'));
  lock.version = v;
  if (lock.packages?.['']) lock.packages[''].version = v;
  write('package-lock.json', JSON.stringify(lock, null, 2) + '\n');
  write('src-tauri/Cargo.toml', read('src-tauri/Cargo.toml').replace(/^(\[package\][^[]*?^version = ")[^"]+(")/m, `$1${v}$2`));
  write('src-tauri/Cargo.lock', read('src-tauri/Cargo.lock').replace(/(\[\[package\]\]\nname = "black-swan"\nversion = ")[^"]+(")/, `$1${v}$2`));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const v = process.argv[2];
  if (v) {
    setVersion(v);
    console.log(`Version set to ${v}. Now add a "## ${v}: ..." section at the top of CHANGELOG.md.`);
  }
  for (const [file, ver] of Object.entries(versions())) console.log(`${ver ?? '(missing)'}\t${file}`);
}
