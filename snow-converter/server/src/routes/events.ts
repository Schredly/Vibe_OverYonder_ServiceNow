import { Router, type Response } from 'express';

export const eventsRouter = Router();

// Map of analysisId -> Set of SSE response objects
export const sseClients = new Map<string, Set<Response>>();

export function sendSSE(analysisId: string, event: string, data: unknown) {
  const clients = sseClients.get(analysisId);
  if (!clients) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    res.write(payload);
  }
}

// SSE endpoint for live analysis progress
eventsRouter.get('/:id/events', (req, res) => {
  const { id } = req.params;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  res.write(`event: connected\ndata: {"analysisId":"${id}"}\n\n`);

  if (!sseClients.has(id)) {
    sseClients.set(id, new Set());
  }
  sseClients.get(id)!.add(res);

  req.on('close', () => {
    sseClients.get(id)?.delete(res);
    if (sseClients.get(id)?.size === 0) {
      sseClients.delete(id);
    }
  });
});
