"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const routes_1 = __importDefault(require("./routes"));
const error_1 = require("./middleware/error");
const logger_1 = require("./utils/logger");
const rateLimiter_1 = require("./middleware/rateLimiter");
const public_1 = require("./public");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // This ensures the server listens on all network interfaces
// Trust proxy - required for express-rate-limit to work properly behind a proxy
app.set('trust proxy', 1);
// Apply middlewares
// Note: JSON body parser should come after webhook routes to allow raw body processing
app.use((0, cors_1.default)({
    origin: '*', // Allow all origins for testing
    credentials: true,
}));
// Disable some helmet options for test/demo environment
const helmetOptions = {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
};
app.use((0, helmet_1.default)(helmetOptions));
app.use(rateLimiter_1.rateLimiter);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Webhook route needs raw body, so we add it first before body parsers
app.use('/api/webhooks', require('./routes/webhooks').default);
// Apply JSON and URL encoded body parsers for all other routes
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Register all routes
app.use('/api', routes_1.default);
// Serve the HTML directly from the renderHtml function for the root route
app.get('/', (req, res) => {
    res.send((0, public_1.renderHtml)());
});
// Global error handler
app.use(error_1.errorHandler);
// Handle 404 routes
app.use((req, res) => {
    res.status(404).json({ message: 'Not found' });
});
// Create and start the server
const server = app.listen(Number(PORT), HOST, () => {
    logger_1.logger.info(`Server started on ${HOST}:${PORT}`);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger_1.logger.error(err);
    logger_1.logger.error('Stack trace:', err.stack || 'No stack trace available');
});
// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger_1.logger.error(err);
    logger_1.logger.error('Stack trace:', err.stack || 'No stack trace available');
    process.exit(1);
});
exports.default = server;
//# sourceMappingURL=index.js.map