// node scripts/release-notes.mjs 1.0.1
// Prints the CHANGELOG.md section for that version: the text under its "## 1.0.1: ..." heading,
// up to the next "## " heading. The release workflow puts it on the GitHub release, and the
// app shows it on the update card.
import { readFileSync } from 'node:fs';

/** The section of the changelog for `version`, without its heading, or '' if there is none. */
export function notesFor(changelog, version) {
  const lines = changelog.replace(/\r/g, '').split('\n');
  const esc = version.replace(/\./g, '\\.');
  const start = lines.findIndex((l) => new RegExp(`^## ${esc}(?![\\d.])`).test(l));
  if (start < 0) return '';
  let end = lines.findIndex((l, i) => i > start && l.startsWith('## '));
  if (end < 0) end = lines.length;
  return lines.slice(start + 1, end).join('\n').trim();
}

/** The heading of that section without "## " and the version, e.g. "The finished Mac app (2026-11-18)". */
export function titleFor(changelog, version) {
  const esc = version.replace(/\./g, '\\.');
  const m = new RegExp(`^## ${esc}(?![\\d.]):?\\s*(.*)$`, 'm').exec(changelog.replace(/\r/g, ''));
  return m ? m[1].trim() : '';
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const version = process.argv[2];
  const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
  const notes = notesFor(changelog, version);
  if (!notes) {
    console.error(`CHANGELOG.md has no "## ${version}: ..." section. Add one before releasing.`);
    process.exit(1);
  }
  console.log(notes);
}
