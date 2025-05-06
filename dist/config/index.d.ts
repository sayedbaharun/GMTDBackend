export declare const config: {
    supabase: {
        url: string;
        serviceRoleKey: string;
    };
    stripe: {
        secretKey: string;
        publishableKey: string;
        webhookSecret: string;
        priceId: string;
    };
    appUrl: string;
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
