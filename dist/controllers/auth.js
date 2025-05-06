"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.logout = exports.login = exports.register = void 0;
const auth_1 = require("../services/auth");
const logger_1 = require("../utils/logger");
/**
 * Register a new user
 * @route POST /api/auth/register
 */
const register = async (req, res) => {
    try {
        const { email, password, fullName } = req.body;
        const result = await auth_1.authService.registerUser(email, password, fullName);
        if (!result.success) {
            return res.status(result.statusCode || 400).json({
                message: result.error
            });
        }
        return res.status(201).json({
            message: 'User registered successfully',
            user: result.data
        });
    }
    catch (error) {
        logger_1.logger.error('Registration error:', error);
        return res.status(500).json({
            message: 'Failed to register user'
        });
    }
};
exports.register = register;
/**
 * Login an existing user
 * @route POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await auth_1.authService.loginUser(email, password);
        if (!result.success) {
            return res.status(result.statusCode || 400).json({
                message: result.error
            });
        }
        return res.status(200).json({
            message: 'Login successful',
            session: result.data
        });
    }
    catch (error) {
        logger_1.logger.error('Login error:', error);
        return res.status(500).json({
            message: 'Failed to login'
        });
    }
};
exports.login = login;
/**
 * Logout the current user
 * @route POST /api/auth/logout
 */
const logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(400).json({
                message: 'No token provided'
            });
        }
        const result = await auth_1.authService.logoutUser(token);
        if (!result.success) {
            return res.status(result.statusCode || 400).json({
                message: result.error
            });
        }
        return res.status(200).json({
            message: 'Logout successful'
        });
    }
    catch (error) {
        logger_1.logger.error('Logout error:', error);
        return res.status(500).json({
            message: 'Failed to logout'
        });
    }
};
exports.logout = logout;
/**
 * Request a password reset
 * @route POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await auth_1.authService.resetPassword(email);
        if (!result.success) {
            return res.status(result.statusCode || 400).json({
                message: result.error
            });
        }
        return res.status(200).json({
            message: 'Password reset email sent'
        });
    }
    catch (error) {
        logger_1.logger.error('Password reset error:', error);
        return res.status(500).json({
            message: 'Failed to send password reset email'
        });
    }
};
exports.resetPassword = resetPassword;
//# sourceMappingURL=auth.js.map