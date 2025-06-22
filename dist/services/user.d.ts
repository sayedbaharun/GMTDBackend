interface UserProfileData {
    fullName?: string;
    phone?: string;
    companyName?: string;
    industry?: string;
    companySize?: string;
    role?: string;
    goals?: string[];
    [key: string]: any;
}
interface ServiceResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    statusCode?: number;
}
export declare const userService: {
    /**
     * Update user profile
     */
    updateUserProfile(userId: string, profileData: UserProfileData): Promise<ServiceResult>;
    /**
     * Get user by ID
     */
    getUserById(userId: string): Promise<ServiceResult>;
};
export {};
