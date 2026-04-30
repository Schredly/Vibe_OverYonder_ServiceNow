// POST /api/spec/extract-from-doc
//
// Multipart upload of a single document (.md, .txt, .pdf, .docx). The route
// extracts plain text from the file, hands it to the OpenAI structured
// extractor, and returns the spec for the frontend to seed a new project
// with. No persistence here — the project record is created client-side
// from the response.
//
// Errors flow:
//   400 — file missing, unsupported extension, or empty text
//   413 — file too large (caught by the global multipart limit)
//   503 — OPENAI_API_KEY missing or OpenAI call failed

import type { FastifyInstance } from 'fastify';
import { extensionFor, extractDocText, SUPPORTED_DOC_EXTENSIONS } from '../lib/docText.js';
import { extractSpecFromText, type ExtractedSpec } from '../lib/specExtractor.js';

interface ErrorReply {
  error: string;
}

export async function registerSpecExtractRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Reply: ExtractedSpec | ErrorReply }>(
    '/api/spec/extract-from-doc',
    async (req, reply) => {
      const file = await req.file();
      if (!file) {
        return reply.code(400).send({ error: 'No file uploaded.' });
      }

      const ext = extensionFor(file.filename);
      if (!ext) {
        return reply.code(400).send({
          error: `Unsupported file type. Allowed: ${SUPPORTED_DOC_EXTENSIONS.join(', ')}`,
        });
      }

      let buf: Buffer;
      try {
        buf = await file.toBuffer();
      } catch (err) {
        // file.toBuffer throws when the underlying stream exceeds the
        // multipart limit registered in server.ts.
        return reply.code(413).send({
          error: `File too large. Limit is 25 MB. (${(err as Error).message})`,
        });
      }

      let extracted;
      try {
        extracted = await extractDocText(buf, ext);
      } catch (err) {
        return reply.code(400).send({
          error: `Could not read ${ext.toUpperCase()}: ${(err as Error).message}`,
        });
      }

      if (extracted.charCount < 40) {
        return reply.code(400).send({
          error: `Document had only ${extracted.charCount} characters of text — likely scanned or empty.`,
        });
      }

      try {
        const spec = await extractSpecFromText(extracted.text);
        return reply.send(spec);
      } catch (err) {
        const e = err as Error & { status?: number; code?: string; type?: string };
        const msg = e.message ?? 'unknown error';
        // Log to the server console so we can diagnose user-reported failures.
        // OpenAI SDK errors carry status/code/type — pull them through.
        req.log.error(
          {
            err: e,
            status: e.status,
            code: e.code,
            type: e.type,
            docCharCount: extracted.charCount,
          },
          'spec extraction failed',
        );
        const isMissingKey = /OPENAI_API_KEY|key configured/i.test(msg);
        const isConnection =
          /APIConnectionError|ECONNRESET|ETIMEDOUT|ENOTFOUND|fetch failed|socket hang up/i.test(
            msg,
          );
        const userMsg = isConnection
          ? 'Lost connection to OpenAI. The provider was slow or unreachable — try again. (Server logs have the full error.)'
          : msg;
        return reply
          .code(isMissingKey ? 503 : 500)
          .send({ error: `Spec extraction failed: ${userMsg}` });
      }
    },
  );
}
