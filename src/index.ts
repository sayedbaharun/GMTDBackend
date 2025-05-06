import express from 'express';
import * as dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import routes from './routes';
import { errorHandler } from './middleware/error';
import { logger } from './utils/logger';
import { config } from './config';
import { rateLimiter } from './middleware/rateLimiter';
import { renderHtml } from './public';

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // This ensures the server listens on all network interfaces

// Trust proxy - required for express-rate-limit to work properly behind a proxy
app.set('trust proxy', 1);

// Apply middlewares
// Note: JSON body parser should come after webhook routes to allow raw body processing
app.use(cors({
  origin: '*', // Allow all origins for testing
  credentials: true,
}));

// Disable some helmet options for test/demo environment
const helmetOptions = {
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
};
app.use(helmet(helmetOptions));
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Webhook route needs raw body, so we add it first before body parsers
app.use('/api/webhooks', require('./routes/webhooks').default);

// Apply JSON and URL encoded body parsers for all other routes
// Apply authentication middleware to all routes
import { authenticate } from './middleware/auth';
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', authenticate, routes);

// Serve the HTML directly from the renderHtml function for the root route
app.get('/', (req, res) => {
  res.send(renderHtml());
});

// Global error handler
app.use(errorHandler);

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Create and start the server
const server = app.listen(Number(PORT), HOST, () => {
  logger.info(`Server started on ${HOST}:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error(err);
  logger.error('Stack trace:', err.stack || 'No stack trace available');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error(err);
  logger.error('Stack trace:', err.stack || 'No stack trace available');
  process.exit(1);
});

export default server;
