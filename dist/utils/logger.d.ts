/**
 * Simple logger utility for consistent logging format
 * In a production environment, you would typically use a more robust logging solution
 */
export declare const logger: {
    info: (message: string, ...meta: any[]) => void;
    error: (message: string | Error, ...meta: any[]) => void;
    warn: (message: string, ...meta: any[]) => void;
    debug: (message: string, ...meta: any[]) => void;
};
