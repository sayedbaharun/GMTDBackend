"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealthStatus = void 0;
const supabase_1 = require("../services/supabase");
const stripe_1 = __importDefault(require("stripe"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
/**
 * Get system health status
 * @route GET /api/health
 */
const getHealthStatus = async (req, res) => {
    const healthChecks = {
        server: { status: 'ok' },
        supabase: { status: 'unknown' },
        stripe: { status: 'unknown' }
    };
    // Check Supabase connection
    try {
        const { error } = await supabase_1.supabaseAdmin.from('profiles').select('count', { count: 'exact', head: true });
        if (error) {
            throw error;
        }
        healthChecks.supabase.status = 'ok';
    }
    catch (error) {
        logger_1.logger.error('Supabase health check failed:', error);
        healthChecks.supabase.status = 'error';
    }
    // Check Stripe connection
    try {
        const stripe = new stripe_1.default(config_1.config.stripe.secretKey, {
            apiVersion: '2025-04-30.basil',
        });
        const balance = await stripe.balance.retrieve();
        if (balance) {
            healthChecks.stripe.status = 'ok';
        }
    }
    catch (error) {
        logger_1.logger.error('Stripe health check failed:', error);
        healthChecks.stripe.status = 'error';
    }
    // Return overall status
    const overallStatus = Object.values(healthChecks).some(check => check.status === 'error') ? 500 : 200;
    return res.status(overallStatus).json({
        status: overallStatus === 200 ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
        checks: healthChecks
    });
};
exports.getHealthStatus = getHealthStatus;
//# sourceMappingURL=health.js.map