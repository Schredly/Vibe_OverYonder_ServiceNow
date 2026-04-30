// In-memory pub/sub for build + deploy log streams. One topic per runId.
// Subscribers replay the buffered lines on connect so short-lived runs
// don't race the SSE subscription.

export interface RunEvent {
  type: 'log' | 'status' | 'result';
  payload: unknown;
}

interface Topic {
  events: RunEvent[];
  subscribers: Set<(evt: RunEvent) => void>;
  done: boolean;
}

const topics = new Map<string, Topic>();

function topic(runId: string): Topic {
  let t = topics.get(runId);
  if (!t) {
    t = { events: [], subscribers: new Set(), done: false };
    topics.set(runId, t);
  }
  return t;
}

export function publish(runId: string, evt: RunEvent): void {
  const t = topic(runId);
  t.events.push(evt);
  for (const sub of t.subscribers) sub(evt);
  if (evt.type === 'result') {
    t.done = true;
    // Flush subscribers after a short delay so late readers still get the
    // final event. Topic is GC'd after 5 minutes.
    setTimeout(() => topics.delete(runId), 5 * 60 * 1000);
  }
}

export function subscribe(
  runId: string,
  cb: (evt: RunEvent) => void,
): { replayed: RunEvent[]; unsubscribe: () => void } {
  const t = topic(runId);
  const replayed = [...t.events];
  t.subscribers.add(cb);
  return {
    replayed,
    unsubscribe: () => t.subscribers.delete(cb),
  };
}

export function isDone(runId: string): boolean {
  return topics.get(runId)?.done ?? false;
}
