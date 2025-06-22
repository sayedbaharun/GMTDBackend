export declare const config: {
    stripe: {
        secretKey: string;
        publishableKey: string;
        webhookSecret: string;
        priceId: string;
    };
    appUrl: string;
    enableDatabase: boolean;
    demoMode: boolean;
    featureFlags: {
        useMockData: boolean;
        testMode: boolean;
        stripeTestMode: boolean;
    };
    rateLimit: {
        windowMs: number;
        max: number;
    };
};
export declare const startupValidation: () => void;
