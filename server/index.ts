import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { db } from './data/store';
import { authRouter } from './routes/auth';
import { subjectsRouter } from './routes/subjects';
import { studentsRouter } from './routes/students';
import { attendanceRouter } from './routes/attendance';
import { timetableRouter } from './routes/timetable';
import { notificationsRouter } from './routes/notifications';
import { profileRouter } from './routes/profile';

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';

// Configurable CORS for production deployment
const rawFrontendUrl = process.env.FRONTEND_URL || '';
const allowedOrigins = rawFrontendUrl
  ? rawFrontendUrl.split(',').map((u) => u.trim().replace(/\/$/, ''))
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'https://attendpulse.vercel.app'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (like mobile apps, curl, uptime probes, server-to-server)
    if (!origin) return callback(null, true);

    const isLocal = origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
    const isVercel = origin.endsWith('.vercel.app') || origin.includes('vercel.app');
    const isConfigured = allowedOrigins.includes(origin) || allowedOrigins.some((allowed) => allowed && origin.startsWith(allowed));

    if (
      process.env.NODE_ENV !== 'production' ||
      rawFrontendUrl === '*' ||
      isLocal ||
      isVercel ||
      isConfigured
    ) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Vercel serverless route normalization
app.use((req, _res, next) => {
  if (req.url.startsWith('/api/index')) {
    req.url = req.url.replace(/^\/api\/index/, '/api') || '/api';
  }
  next();
});

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
  });
}

// Health check endpoints (supports platform root /health and /api/health)
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.json({
    status: 'online',
    service: 'AttendPulse Academic Engine API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: db.getEngineType(),
    timestamp: new Date().toISOString(),
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// API Routes (supports both direct /api prefix and Vercel serverless rewritten paths)
app.use('/api/auth', authRouter);
app.use('/auth', authRouter);

app.use('/api/subjects', subjectsRouter);
app.use('/subjects', subjectsRouter);

app.use('/api/students', studentsRouter);
app.use('/students', studentsRouter);

app.use('/api/attendance', attendanceRouter);
app.use('/attendance', attendanceRouter);

app.use('/api/timetable', timetableRouter);
app.use('/timetable', timetableRouter);

app.use('/api/notifications', notificationsRouter);
app.use('/notifications', notificationsRouter);

app.use('/api/profile', profileRouter);
app.use('/profile', profileRouter);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: `Endpoint ${req.originalUrl} not found` });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err?.message || 'Unknown error' });
});

// Start standalone server only when not running as a Vercel serverless function
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, HOST, () => {
    console.log(`🚀 AttendPulse Backend Server running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`📡 Listening on http://${HOST}:${PORT}`);
    console.log(`📊 Health check ready at http://localhost:${PORT}/health and /api/health`);
    console.log(`💾 Database Engine: ${db.getEngineType()}`);
  });
}

export default app;
