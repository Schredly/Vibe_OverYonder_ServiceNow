// POST /api/chat/turn — conversational consultant endpoint.
//
// Stateless w.r.t. the UI. Frontend sends the full conversation history +
// current spec on every turn; backend calls the LLM with the SDK-aware
// system prompt and returns {message, specPatch?, readyToBuild?}.

import type { FastifyInstance } from 'fastify';
import {
  runChatTurn,
  streamChatTurn,
  type ChatTurnRequest,
  type ChatTurnResponse,
} from '../lib/chatTurn.js';
import { upsertProject } from '../lib/projects.js';

interface ErrorReply {
  error: string;
}

interface ChatTurnBody extends ChatTurnRequest {
  /** Frontend project id (localStorage). Backend upserts a row so usage
   *  records FK correctly. */
  projectId?: string;
  versionId?: string;
}

export async function registerChatRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: ChatTurnBody; Reply: ChatTurnResponse | ErrorReply }>(
    '/api/chat/turn',
    async (req, reply) => {
      const body = req.body;
      if (!body?.messages?.length) {
        return reply.code(400).send({ error: 'messages array is required' });
      }
      if (!body.spec?.title) {
        return reply.code(400).send({ error: 'spec.title is required' });
      }
      // Upsert the project row before the LLM call so the usage tracker can
      // FK to a real id. Frontend sends the localStorage id verbatim.
      if (body.projectId) {
        upsertProject({
          id: body.projectId,
          name: body.spec.title,
          description: body.spec.description,
        });
      }
      try {
        const result = await runChatTurn(body, {
          projectId: body.projectId,
          versionId: body.versionId,
        });
        return reply.send(result);
      } catch (err) {
        const e = err as Error & { status?: number; code?: string; type?: string };
        const msg = e.message ?? 'unknown error';
        req.log.error(
          {
            err: e,
            status: e.status,
            code: e.code,
            type: e.type,
            messageCount: body.messages.length,
          },
          'chat turn failed',
        );
        const isMissingKey = /OPENAI_API_KEY|key configured/i.test(msg);
        const isConnection =
          /APIConnectionError|ECONNRESET|ETIMEDOUT|ENOTFOUND|fetch failed|socket hang up/i.test(
            msg,
          );
        const userMsg = isConnection
          ? 'Lost connection to OpenAI. Try the message again — the network blipped or the provider was slow.'
          : msg;
        return reply
          .code(isMissingKey ? 503 : 500)
          .send({ error: `Chat turn failed: ${userMsg}` });
      }
    },
  );

  // Streaming variant — emits Server-Sent Events so the consultant's
  // `message` field renders token-by-token in the UI rather than the
  // user staring at a spinner for the full structured-output payload.
  // Frame format:
  //   data: {"type":"message-delta","text":"Hello"}\n\n
  //   data: {"type":"done","response":{...full ChatTurnResponse}}\n\n
  //   data: {"type":"error","message":"..."}\n\n
  // SSE handler — return sync (void-via-hijack) and run the streaming
  // body in a fire-and-forget IIFE. Fastify's async-handler path waits
  // for the handler to resolve before flushing the response, which
  // deadlocks when the body is the very stream we're awaiting; the
  // sync-with-hijack pattern matches /api/runs/:id/stream which is
  // known-good.
  app.post<{ Body: ChatTurnBody }>('/api/chat/turn/stream', (req, reply) => {
    const body = req.body;
    if (!body?.messages?.length) {
      return reply.code(400).send({ error: 'messages array is required' });
    }
    if (!body.spec?.title) {
      return reply.code(400).send({ error: 'spec.title is required' });
    }
    if (body.projectId) {
      upsertProject({
        id: body.projectId,
        name: body.spec.title,
        description: body.spec.description,
      });
    }

    reply.hijack();
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Disable proxy buffering so the first byte reaches the client
      // immediately (relevant if anything sits in front of Fastify).
      'X-Accel-Buffering': 'no',
    });
    // Force the headers out before the (potentially slow) first chunk.
    if (typeof reply.raw.flushHeaders === 'function') {
      reply.raw.flushHeaders();
    }

    const send = (event: unknown): void => {
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    // Heartbeat every 15s so idle proxies don't drop the connection
    // before the first delta. 15s is well under the typical 30s
    // proxy-idle window and well over a typical TTFT.
    const heartbeat = setInterval(() => {
      try {
        reply.raw.write(`: ping\n\n`);
      } catch {
        clearInterval(heartbeat);
      }
    }, 15_000);

    // Use the response's writable state to detect a real disconnect.
    // (Listening for `req.raw.on('close')` would fire as soon as the
    // request body finishes streaming in, which is right after we
    // start responding — that's not a disconnect, it's a normal
    // half-close.)
    const isClosed = () =>
      reply.raw.writableEnded || reply.raw.destroyed || reply.raw.closed;

    void (async () => {
      const gen = streamChatTurn(body, {
        projectId: body.projectId,
        versionId: body.versionId,
      });
      try {
        // Manual drain via gen.next() — `for await` doesn't iterate this
        // generator reliably under the hijacked-reply context. The
        // manual drain is functionally identical and works.
        while (!isClosed()) {
          const r = await gen.next();
          if (r.done) break;
          send(r.value);
          if (r.value.type === 'error' || r.value.type === 'done') break;
        }
      } catch (err) {
        const e = err as Error;
        req.log.error({ err: e }, 'chat stream failed');
        if (!isClosed()) {
          try {
            send({ type: 'error', message: e.message ?? 'stream failed' });
          } catch {
            /* connection already torn down */
          }
        }
      } finally {
        clearInterval(heartbeat);
        try {
          reply.raw.end();
        } catch {
          /* ignore */
        }
      }
    })();
  });
}
