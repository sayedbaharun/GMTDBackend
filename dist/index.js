"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const compression_1 = __importDefault(require("compression"));
const express_session_1 = __importDefault(require("express-session"));
const client_1 = require("@prisma/client");
const routes_1 = __importDefault(require("./routes"));
const error_1 = require("./middleware/error");
const logger_1 = require("./utils/logger");
const public_1 = require("./public");
const config_1 = require("./config");
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';
app.set('trust proxy', 1);
// Security middleware
app.use((0, helmet_1.default)({
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
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const authLimiter = (0, express_rate_limit_1.default)({
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
app.use((0, compression_1.default)({
    filter: (req, res) => {
        return compression_1.default.filter(req, res);
    },
    threshold: 0
}));
// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
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
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use((0, cors_1.default)(corsOptions));
// Session configuration for general session management
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'fallback-secret-for-dev',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
}));
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
app.use('/api/webhooks', require('./routes/webhooks').default);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((req, res, next) => {
    console.log(`--> ${req.method} ${req.originalUrl}`);
    next();
});
app.use('/api', routes_1.default);
app.get('/', (req, res) => {
    res.send((0, public_1.renderHtml)());
});
app.use(error_1.errorHandler);
app.use((req, res) => {
    res.status(404).json({ message: 'Not found' });
});
// Run startup validation before starting server
(0, config_1.startupValidation)();
const server = app.listen(Number(PORT), HOST, () => {
    logger_1.logger.info(`Server started on ${HOST}:${PORT}`);
});
process.on('unhandledRejection', (err) => {
    logger_1.logger.error(err);
    logger_1.logger.error('Stack trace:', err.stack || 'No stack trace available');
});
process.on('uncaughtException', (err) => {
    logger_1.logger.error(err);
    logger_1.logger.error('Stack trace:', err.stack || 'No stack trace available');
    process.exit(1);
});
exports.default = server;
//# sourceMappingURL=index.js.map