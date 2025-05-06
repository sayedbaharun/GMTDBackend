import * as express from 'express';
/**
 * Middleware to validate request data
 * @param validations - Array of validation chains from express-validator
 * @returns Middleware function that runs validations and checks results
 */
export declare const validate: (validations: any[]) => (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>;
export declare const authValidation: {
    register: import("express-validator").ValidationChain[];
    login: import("express-validator").ValidationChain[];
    resetPassword: import("express-validator").ValidationChain[];
};
export declare const userProfileValidation: {
    update: import("express-validator").ValidationChain[];
};
export declare const onboardingValidation: {
    userInfo: import("express-validator").ValidationChain[];
    additionalDetails: import("express-validator").ValidationChain[];
    getOnboardingStatus: never[];
    paymentProcess: import("express-validator").ValidationChain[];
};
export declare const subscriptionValidation: {
    create: import("express-validator").ValidationChain[];
};
export declare const paymentValidation: {
    createPaymentIntent: import("express-validator").ValidationChain[];
};
