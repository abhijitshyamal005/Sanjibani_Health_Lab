import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import adminRoutes from './routes/adminRoutes.js';
import collectorRoutes from './routes/collectorRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { bookingRouter, couponRouter, reviewRouter } from './routes/bookingRoutes.js';
import partnerRoutes from './routes/partnerRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import publicRoutes from './routes/publicRoutes.js';

const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://sanjibani-health-lab.vercel.app',
];

export function createApp() {
  const app = express();
  const env = process.env.NODE_ENV || 'development';
  const origins = process.env.CLIENT_ORIGINS
    ? process.env.CLIENT_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : DEFAULT_ORIGINS;

  // Render / Vercel sit behind a proxy — trust it so rate limits see real client IPs.
  if (env === 'production') app.set('trust proxy', 1);

  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());
  app.use(cors({ origin: origins, credentials: true, exposedHeaders: ['Content-Disposition'] }));
  if (env !== 'test') app.use(morgan(env === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '1mb' }));

  app.get('/', (_req, res) => res.json({ name: 'Patholy API', status: 'ok' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env === 'production' ? 30 : 1000,
    skip: () => env === 'test',
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many attempts. Please wait a few minutes and try again.' },
  });
  app.use(['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password'], authLimiter);

  app.use('/api/auth', authRoutes);
  app.use('/api', publicRoutes);
  app.use('/api/bookings', bookingRouter);
  app.use('/api/reviews', reviewRouter);
  app.use('/api/coupons', couponRouter);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/partner', partnerRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/collector', collectorRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
