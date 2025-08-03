import { Router } from 'express';

const router = Router();

// Placeholder routes - these would be implemented similar to roasters.ts
router.get('/', async (req: any, res: any) => {
  res.json({ message: 'Reviews endpoint - coming soon!' });
});

export default router;
