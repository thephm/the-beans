// Dynamic API route for admin user management
// In-memory users array (shared for demo only)

import { NextApiRequest, NextApiResponse } from 'next';

const users = [
  { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin', language: 'en', status: 'active' },
  { id: '2', name: 'Bob', email: 'bob@example.com', role: 'user', language: 'fr', status: 'active' },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (req.method === 'GET') {
    const user = users.find(u => u.id === id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json(user);
  }
  if (req.method === 'PUT') {
    const update = req.body;
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    users[idx] = { ...users[idx], ...update };
    return res.status(200).json(users[idx]);
  }
  if (req.method === 'DELETE') {
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    users.splice(idx, 1);
    return res.status(200).json({ message: 'User deleted' });
  }
  return res.status(405).json({ message: 'Method not allowed' });
}
