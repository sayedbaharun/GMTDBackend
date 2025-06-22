import { User as PrismaUser } from '@prisma/client';

declare global {
  namespace Express {
    // Augment the Express.User interface
    // This will be the type for req.user when using Passport
    export interface User extends PrismaUser {}
  }
} 