import { User } from '@prisma/client';
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        username?: string;
      };
      userId?: string;
      auditData?: any;
    }
  }
}

export {};
/// <reference types="node" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET: string;
      DATABASE_URL: string;
      PORT?: string;
      NODE_ENV?: 'development' | 'production' | 'test';
    }
  }
}

export {};