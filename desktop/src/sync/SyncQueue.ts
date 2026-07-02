/** Queue for pending sync operations when offline. */

interface SyncOp {
  type: "write" | "delete";
  workspaceId: string;
  path: string;
  content?: string;
  timestamp: number;
}

class SyncQueueManager {
  private key = "createlab_sync_queue";

  getQueue(): SyncOp[] {
    try {
      return JSON.parse(localStorage.getItem(this.key) || "[]");
    } catch {
      return [];
    }
  }

  enqueue(op: Omit<SyncOp, "timestamp">) {
    const queue = this.getQueue();
    queue.push({ ...op, timestamp: Date.now() });
    localStorage.setItem(this.key, JSON.stringify(queue));
  }

  dequeue(): SyncOp | null {
    const queue = this.getQueue();
    if (queue.length === 0) return null;
    const op = queue.shift()!;
    localStorage.setItem(this.key, JSON.stringify(queue));
    return op;
  }

  clear() {
    localStorage.removeItem(this.key);
  }
}

export const syncQueue = new SyncQueueManager();
