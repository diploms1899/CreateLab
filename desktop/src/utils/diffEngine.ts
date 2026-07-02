/** Simple line-based diff engine for previewing AI changes. */

export interface DiffLine {
  type: "same" | "added" | "removed";
  text: string;
}

export function computeDiff(original: string, proposed: string): DiffLine[] {
  const orig = original.split("\n");
  const prop = proposed.split("\n");
  const maxLen = Math.max(orig.length, prop.length);
  const lines: DiffLine[] = [];

  for (let i = 0; i < maxLen; i++) {
    const o = orig[i] ?? null;
    const p = prop[i] ?? null;
    if (o === p) {
      if (o !== null) lines.push({ type: "same", text: o });
    } else {
      if (o !== null) lines.push({ type: "removed", text: o });
      if (p !== null) lines.push({ type: "added", text: p });
    }
  }
  return lines;
}

export function applyDiff(original: string, proposed: string): string {
  return proposed;
}
