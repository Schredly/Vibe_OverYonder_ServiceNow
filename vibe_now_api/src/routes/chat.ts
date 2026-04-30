// POST /api/chat/turn — conversational consultant endpoint.
//
// Stateless w.r.t. the UI. Frontend sends the full conversation history +
// current spec on every turn; backend calls the LLM with the SDK-aware
// system prompt and returns {message, specPatch?, readyToBuild?}.

import type { FastifyInstance } from 'fastify';
import { runChatTurn, type ChatTurnRequest, type ChatTurnResponse } from '../lib/chatTurn.js';
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
}
