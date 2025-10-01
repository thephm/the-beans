import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

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