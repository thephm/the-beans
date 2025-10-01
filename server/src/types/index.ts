import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

export type AuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

export interface Roaster {
  id: string;
  name: string;
  location: string;
  imageUrl?: string;
}