// API route for admin user management (scaffold)
// TODO: Connect to your database and implement real logic with authentication/authorization.

import { NextApiRequest, NextApiResponse } from 'next';

const users = [
  { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin', language: 'en', status: 'active' },
  { id: '2', name: 'Bob', email: 'bob@example.com', role: 'user', language: 'fr', status: 'active' },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: Add admin authentication/authorization check
  if (req.method === 'GET') {
    return res.status(200).json(users);
  }
  if (req.method === 'PUT') {
    const { id } = req.query;
    const update = req.body;
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    users[idx] = { ...users[idx], ...update };
    return res.status(200).json(users[idx]);
  }
  if (req.method === 'DELETE') {
    const { id } = req.query;
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    users.splice(idx, 1);
    return res.status(200).json({ message: 'User deleted' });
  }
  return res.status(405).json({ message: 'Method not allowed' });
}
