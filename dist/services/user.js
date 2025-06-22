"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.userService = {
    /**
     * Update user profile
     */
    async updateUserProfile(userId, profileData) {
        try {
            // Filter out undefined and null values
            const cleanData = Object.entries(profileData).reduce((acc, [key, value]) => {
                if (value !== undefined && value !== null) {
                    acc[key] = value;
                }
                return acc;
            }, {});
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    ...cleanData,
                    updatedAt: new Date(),
                },
            });
            return {
                success: true,
                data: updatedUser,
            };
        }
        catch (error) {
            console.error('User service updateUserProfile error:', error);
            return {
                success: false,
                error: error.message || 'Failed to update user profile',
                statusCode: 500,
            };
        }
    },
    /**
     * Get user by ID
     */
    async getUserById(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    profile: true,
                },
            });
            if (!user) {
                return {
                    success: false,
                    error: 'User not found',
                    statusCode: 404,
                };
            }
            return {
                success: true,
                data: user,
            };
        }
        catch (error) {
            console.error('User service getUserById error:', error);
            return {
                success: false,
                error: error.message || 'Failed to get user',
                statusCode: 500,
            };
        }
    },
};
//# sourceMappingURL=user.js.map