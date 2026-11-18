/** Turning release notes (a section of CHANGELOG.md) into plain text for the update card. */

export interface NoteLine {
  kind: 'p' | 'li';
  text: string;
}

/** Markdown marks the card does not draw: bold, code, links. */
function plain(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Paragraphs and bullet points; a bullet's wrapped lines are joined back together. */
export function plainNotes(md: string): NoteLine[] {
  const out: NoteLine[] = [];
  let open: NoteLine | null = null;
  for (const raw of md.replace(/\r/g, '').split('\n')) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      open = null;
      continue;
    }
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      open = { kind: 'li', text: plain(bullet[1]) };
      out.push(open);
    } else if (open) {
      open.text = plain(`${open.text} ${line}`);
    } else {
      open = { kind: 'p', text: plain(line.replace(/^#+\s*/, '')) };
      out.push(open);
    }
  }
  return out.filter((l) => l.text);
}

/** True when version `a` is newer than `b` (both like 1.2.3). */
export function isNewer(a: string, b: string): boolean {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d > 0;
  }
  return false;
}
