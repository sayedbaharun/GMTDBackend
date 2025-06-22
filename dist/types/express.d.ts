import { Request } from 'express';
import { User as PrismaUser } from '@prisma/client';
export interface AuthenticatedRequest extends Request {
    auth?: {
        payload: {
            sub?: string;
            email?: string;
            name?: string;
            email_verified?: boolean;
            permissions?: string[];
            [key: string]: any;
        };
        header: any;
        token: string;
    };
    user?: PrismaUser;
}
export {};
