// API index route - provides information about available endpoints
import { NextApiRequest, NextApiResponse } from 'next';

interface ApiEndpoint {
  path: string;
  method: string;
  description: string;
  service: 'client' | 'server';
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const clientEndpoints: ApiEndpoint[] = [
    {
      path: '/api/admin/users',
      method: 'GET, PUT, DELETE',
      description: 'Admin user management endpoints',
      service: 'client'
    },
    {
      path: '/api/admin/users/[id]',
      method: 'GET, PUT, DELETE',
      description: 'Individual user management',
      service: 'client'
    }
  ];

  const serverEndpoints: ApiEndpoint[] = [
    {
      path: 'http://localhost:5000/api/roasters',
      method: 'GET, POST',
      description: 'Coffee roaster management',
      service: 'server'
    },
    {
      path: 'http://localhost:5000/api/auth',
      method: 'POST',
      description: 'Authentication endpoints',
      service: 'server'
    },
    {
      path: 'http://localhost:5000/api/users',
      method: 'GET, POST, PUT, DELETE',
      description: 'User management',
      service: 'server'
    },
    {
      path: 'http://localhost:5000/api/reviews',
      method: 'GET, POST',
      description: 'Review management',
      service: 'server'
    },
    {
      path: 'http://localhost:5000/api/search',
      method: 'GET',
      description: 'Search functionality',
      service: 'server'
    }
  ];

  return res.status(200).json({
    message: 'The Beans API',
    version: '1.0.0',
    services: {
      client: {
        description: 'Next.js API routes (port 3000)',
        baseUrl: 'http://localhost:3000/api',
        endpoints: clientEndpoints
      },
      server: {
        description: 'Express.js API server (port 5000)',
        baseUrl: 'http://localhost:5000/api',
        endpoints: serverEndpoints,
        documentation: 'http://localhost:5000/api-docs'
      }
    },
    health: {
      client: 'http://localhost:3000/api',
      server: 'http://localhost:5000/health'
    }
  });
}