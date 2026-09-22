import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { authMiddleware } from './server/middleware/auth';
import { patientsRouter } from './server/routes/patients';
import { queueRouter } from './server/routes/queue';
import { consultationsRouter } from './server/routes/consultations';
import { referralsRouter } from './server/routes/referrals';
import { appointmentsRouter } from './server/routes/appointments';
import { diagnosticsRouter } from './server/routes/diagnostics';
import { medicinesRouter } from './server/routes/medicines';
import { followupsRouter } from './server/routes/followups';
import { notificationsRouter } from './server/routes/notifications';
import { analyticsRouter } from './server/routes/analytics';
import { aiRouter } from './server/routes/ai';
import { seedRouter } from './server/routes/seed';
import { checkFirestoreHealth } from './server/firebaseAdmin';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint conforming to specification
app.get('/api/health', async (req, res) => {
  try {
    const health = await checkFirestoreHealth();
    const isDegraded = health.database !== 'connected';
    
    res.status(isDegraded ? 200 : 200).json({
      status: isDegraded ? 'degraded' : 'ok',
      database: health.database,
      firebase: health.firebase,
      latencyMs: health.latencyMs,
      service: 'Saathi Care Core Public Health API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'degraded',
      database: 'disconnected',
      firebase: 'error',
      environment: process.env.NODE_ENV || 'production',
      timestamp: new Date().toISOString()
    });
  }
});

// Seed endpoint
app.use('/api/seed', seedRouter);

// AI copilot routes
app.use('/api/ai', aiRouter);

// Data routes with session & auth middleware
app.use('/api/patients', authMiddleware, patientsRouter);
app.use('/api/queue', authMiddleware, queueRouter);
app.use('/api/consultations', authMiddleware, consultationsRouter);
app.use('/api/referrals', authMiddleware, referralsRouter);
app.use('/api/appointments', authMiddleware, appointmentsRouter);
app.use('/api/diagnostics', authMiddleware, diagnosticsRouter);
app.use('/api/medicines', authMiddleware, medicinesRouter);
app.use('/api/followups', authMiddleware, followupsRouter);
app.use('/api/notifications', authMiddleware, notificationsRouter);
app.use('/api/analytics', authMiddleware, analyticsRouter);

// Configure Vite middleware or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Saathi Care Public Health Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
