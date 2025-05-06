"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
/**
 * Simple logger utility for consistent logging format
 * In a production environment, you would typically use a more robust logging solution
 */
exports.logger = {
    info: (message, ...meta) => {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...meta);
    },
    error: (message, ...meta) => {
        const errorMessage = message instanceof Error ? message.message : message;
        console.error(`[ERROR] ${new Date().toISOString()} - ${errorMessage}`, ...meta);
    },
    warn: (message, ...meta) => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...meta);
    },
    debug: (message, ...meta) => {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...meta);
        }
    }
};
//# sourceMappingURL=logger.js.map