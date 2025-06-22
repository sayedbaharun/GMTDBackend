import express from 'express';
import * as dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import session from 'express-session';
import { PrismaClient } from '@prisma/client';
import routes from './routes';
import { errorHandler } from './middleware/error';
import { logger } from './utils/logger';
import { renderHtml } from './public';
import { startupValidation } from './config';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://api.openai.com"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  skipSuccessfulRequests: true,
});

app.use(limiter);
app.use('/api/auth', authLimiter);

// Compression
app.use(compression({
  filter: (req, res) => {
    return compression.filter(req, res);
  },
  threshold: 0
}));

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [
          process.env.CLIENT_URL,
          process.env.FRONTEND_URL,
          'https://vercel.app',
          'https://netlify.app'
        ].filter(Boolean)
      : [
          'http://localhost:3000', 
          'http://localhost:3001', 
          'http://localhost:3002', 
          'http://localhost:8080',
          'http://localhost:8081', // Expo web alternate port
          'http://localhost:19006', // Expo web
          'http://localhost:19007' // Expo web alternate
        ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Session configuration for general session management
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-for-dev',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  })
);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/webhooks', require('./routes/webhooks').default);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`--> ${req.method} ${req.originalUrl}`); 
  next();
});

app.use('/api', routes);

app.get('/', (req, res) => {
  res.send(renderHtml());
});

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Run startup validation before starting server
startupValidation();

const server = app.listen(Number(PORT), HOST, () => {
  logger.info(`Server started on ${HOST}:${PORT}`);
});

process.on('unhandledRejection', (err: Error) => {
  logger.error(err);
  logger.error('Stack trace:', err.stack || 'No stack trace available');
});

process.on('uncaughtException', (err: Error) => {
  logger.error(err);
  logger.error('Stack trace:', err.stack || 'No stack trace available');
  process.exit(1);
});

export default server;
