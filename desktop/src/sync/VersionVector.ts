/** Simple version vector for conflict detection. */

export class VersionVector {
  private versions: Map<string, number>;

  constructor(initial?: Record<string, number>) {
    this.versions = new Map(Object.entries(initial || {}));
  }

  get(clientId: string): number {
    return this.versions.get(clientId) || 0;
  }

  increment(clientId: string) {
    this.versions.set(clientId, this.get(clientId) + 1);
  }

  toJSON(): Record<string, number> {
    return Object.fromEntries(this.versions);
  }

  static merge(a: VersionVector, b: VersionVector): VersionVector {
    const merged = new VersionVector();
    for (const key of new Set([...a.versions.keys(), ...b.versions.keys()])) {
      merged.versions.set(key, Math.max(a.get(key), b.get(key)));
    }
    return merged;
  }
}
