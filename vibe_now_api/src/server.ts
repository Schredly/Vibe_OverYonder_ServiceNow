import 'dotenv/config';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import Fastify from 'fastify';
import { getDb } from './db.js';
import { seedPricingPlans } from './lib/pricing.js';
import { registerAliasRoutes } from './routes/aliases.js';
import { registerBuildRoutes } from './routes/build.js';
import { registerChatRoutes } from './routes/chat.js';
import { registerDeployRoutes } from './routes/deploy.js';
import { registerFigmaRoutes } from './routes/figma.js';
import { registerLlmCredentialRoutes } from './routes/llmCredentials.js';
import { registerPackageRoutes } from './routes/packages.js';
import { registerProjectRoutes } from './routes/projects.js';
import { registerRunRoutes } from './routes/runs.js';
import { registerSpecExtractRoutes } from './routes/specExtract.js';
import { registerUsageRoutes } from './routes/usage.js';
import { registerVersionRoutes } from './routes/versions.js';

async function main(): Promise<void> {
  // Touch the crypto module early so we fail fast on a missing master key.
  if (!process.env.VIBE_MASTER_KEY) {
    console.error(
      '✗ VIBE_MASTER_KEY is not set. Copy .env.example → .env and fill it in.',
    );
    process.exit(1);
  }

  // Ensure schema exists before routes bind, then seed the pricing table
  // (idempotent on provider+model+effective_at).
  getDb();
  seedPricingPlans();

  const app = Fastify({
    logger: { level: 'info' },
    bodyLimit: 10 * 1024 * 1024,
  });

  await app.register(cors, {
    origin: (process.env.VIBE_WEB_ORIGIN ?? 'http://localhost:5174').split(','),
    credentials: false,
  });

  // Multipart is shared by figma upload + spec-from-doc routes. Registered
  // once at the server level so encapsulation contexts don't double-register.
  // Limit covers the largest practical doc upload (a 25MB PDF).
  await app.register(multipart, {
    limits: {
      fileSize: 25 * 1024 * 1024,
      files: 4,
    },
  });

  app.get('/api/health', async () => ({
    ok: true,
    version: '0.1.0',
    time: new Date().toISOString(),
  }));

  await registerAliasRoutes(app);
  await registerBuildRoutes(app);
  await registerChatRoutes(app);
  await registerDeployRoutes(app);
  await registerFigmaRoutes(app);
  await registerLlmCredentialRoutes(app);
  await registerPackageRoutes(app);
  await registerProjectRoutes(app);
  await registerRunRoutes(app);
  await registerSpecExtractRoutes(app);
  await registerUsageRoutes(app);
  await registerVersionRoutes(app);

  const port = Number(process.env.PORT ?? 5275);
  await app.listen({ port, host: '127.0.0.1' });

  // Graceful shutdown. Without this, tsx-watch / Ctrl+C leave the server
  // half-alive holding port 5275, and the next restart hits EADDRINUSE —
  // which is exactly what silently broke the 20:45 deploy run.
  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'shutting down');
    try {
      await app.close();
      process.exit(0);
    } catch (err) {
      app.log.error({ err }, 'shutdown failed');
      process.exit(1);
    }
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
