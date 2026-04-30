import express from 'express';
import cors from 'cors';
import { analysesRouter } from './routes/analyses.js';
import { recommendationsRouter } from './routes/recommendations.js';
import { exportRouter } from './routes/export.js';
import { settingsRouter } from './routes/settings.js';
import { eventsRouter } from './routes/events.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/analyses', analysesRouter);
app.use('/api/analyses', recommendationsRouter);
app.use('/api/analyses', eventsRouter);
app.use('/api/analyses', exportRouter);  // handles /:id/export
app.use('/api/exports', exportRouter);   // handles /:exportId/download
app.use('/api/settings', settingsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`SNow Converter server running on port ${PORT}`);
});

export default app;
