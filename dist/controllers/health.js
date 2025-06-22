"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLivenessStatus = exports.getReadinessStatus = exports.getHealthStatus = void 0;
const stripe_1 = __importDefault(require("stripe"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
const os_1 = __importDefault(require("os"));
/**
 * Get system health status
 * @route GET /api/health
 */
const getHealthStatus = async (req, res) => {
    const startTime = Date.now();
    const healthChecks = {
        server: {
            status: 'ok',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            nodeVersion: process.version,
            environment: process.env.NODE_ENV || 'development'
        },
        database: { status: 'unknown', responseTime: 0 },
        stripe: { status: 'unknown', responseTime: 0 },
        system: {
            loadAverage: os_1.default.loadavg(),
            freeMemory: os_1.default.freemem(),
            totalMemory: os_1.default.totalmem(),
            cpus: os_1.default.cpus().length
        }
    };
    // Check database connection with Prisma
    if (config_1.config.enableDatabase !== false) {
        const prisma = new client_1.PrismaClient();
        const dbStartTime = Date.now();
        try {
            await prisma.$queryRaw `SELECT 1`;
            healthChecks.database.status = 'ok';
            healthChecks.database.responseTime = Date.now() - dbStartTime;
        }
        catch (error) {
            logger_1.logger.error('Database health check failed:', error);
            healthChecks.database.status = 'error';
            healthChecks.database.responseTime = Date.now() - dbStartTime;
        }
        finally {
            await prisma.$disconnect();
        }
    }
    else {
        healthChecks.database.status = 'disabled';
    }
    // Check Stripe connection
    if (config_1.config.stripe?.secretKey) {
        const stripeStartTime = Date.now();
        try {
            const stripe = new stripe_1.default(config_1.config.stripe.secretKey, {
                apiVersion: '2025-04-30.basil',
            });
            const balance = await stripe.balance.retrieve();
            if (balance) {
                healthChecks.stripe.status = 'ok';
                healthChecks.stripe.responseTime = Date.now() - stripeStartTime;
            }
        }
        catch (error) {
            logger_1.logger.error('Stripe health check failed:', error);
            healthChecks.stripe.status = 'error';
            healthChecks.stripe.responseTime = Date.now() - stripeStartTime;
        }
    }
    else {
        healthChecks.stripe.status = 'disabled';
    }
    // Return overall status
    const hasErrors = Object.values(healthChecks).some(check => typeof check === 'object' && 'status' in check && check.status === 'error');
    const overallStatus = hasErrors ? 500 : 200;
    return res.status(overallStatus).json({
        status: overallStatus === 200 ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        version: process.env.npm_package_version || '1.0.0',
        checks: healthChecks
    });
};
exports.getHealthStatus = getHealthStatus;
/**
 * Simple readiness probe
 * @route GET /api/health/ready
 */
const getReadinessStatus = async (req, res) => {
    try {
        // Quick check that server can respond to requests
        res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
    }
    catch (error) {
        res.status(503).json({ status: 'not ready', error: error instanceof Error ? error.message : 'Unknown error' });
    }
};
exports.getReadinessStatus = getReadinessStatus;
/**
 * Simple liveness probe
 * @route GET /api/health/live
 */
const getLivenessStatus = async (req, res) => {
    res.status(200).json({
        status: 'alive',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
};
exports.getLivenessStatus = getLivenessStatus;
//# sourceMappingURL=health.js.map