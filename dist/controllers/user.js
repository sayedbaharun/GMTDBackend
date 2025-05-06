"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = void 0;
const user_1 = require("../services/user");
const logger_1 = require("../utils/logger");
/**
 * Get the current user's profile
 * @route GET /api/user/profile
 */
const getProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required'
            });
        }
        return res.status(200).json({
            profile: req.user
        });
    }
    catch (error) {
        logger_1.logger.error('Get profile error:', error);
        return res.status(500).json({
            message: 'Failed to get user profile'
        });
    }
};
exports.getProfile = getProfile;
/**
 * Update the current user's profile
 * @route PUT /api/user/profile
 */
const updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required'
            });
        }
        const profileData = req.body;
        const result = await user_1.userService.updateUserProfile(req.user.id, profileData);
        if (!result.success) {
            return res.status(result.statusCode || 400).json({
                message: result.error
            });
        }
        return res.status(200).json({
            message: 'Profile updated successfully',
            profile: result.data
        });
    }
    catch (error) {
        logger_1.logger.error('Update profile error:', error);
        return res.status(500).json({
            message: 'Failed to update user profile'
        });
    }
};
exports.updateProfile = updateProfile;
//# sourceMappingURL=user.js.map