"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRouteHandler = exports.asyncHandler = exports.createError = void 0;
const types_1 = require("../types");
/**
 * Create a custom API error with status code
 * @param message - Error message
 * @param statusCode - HTTP status code
 */
const createError = (message, statusCode = 500) => {
    return new types_1.ApiError(message, statusCode);
};
exports.createError = createError;
/**
 * Handle async function errors
 * Wrap async functions to catch errors and pass them to the error handler
 * @param fn - Async function to wrap
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
/**
 * Creates an Express-compatible route handler from a controller function
 * This wrapper ensures the controller's return value is properly handled
 * @param fn Controller function that may return a response
 */
const createRouteHandler = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        }
        catch (error) {
            next(error);
        }
    };
};
exports.createRouteHandler = createRouteHandler;
//# sourceMappingURL=errorHandler.js.map