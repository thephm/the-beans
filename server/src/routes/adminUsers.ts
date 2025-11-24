import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';

const router = Router();

// Admin-only endpoint to perform partial cascade cleanup for a user
router.post('/:id/cascade-delete', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const me = await prisma.user.findUnique({ where: { id: req.user?.id }, select: { role: true } });
    if (!me || me.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }

    const userId = req.params.id;

    await prisma.$transaction([
      prisma.favorite.deleteMany({ where: { userId } }),
      prisma.notification.deleteMany({ where: { userId } }),
      prisma.comment.deleteMany({ where: { userId } }),
      prisma.review.deleteMany({ where: { userId } }),
      prisma.roasterImage.deleteMany({ where: { uploadedById: userId } }),
      prisma.roasterPerson.updateMany({ where: { userId }, data: { userId: null } }),
      prisma.bean.updateMany({ where: { createdById: userId }, data: { createdById: null } }),
      prisma.bean.updateMany({ where: { updatedById: userId }, data: { updatedById: null } }),
      prisma.roaster.updateMany({ where: { createdById: userId }, data: { createdById: null } }),
      prisma.roaster.updateMany({ where: { updatedById: userId }, data: { updatedById: null } }),
    ]);

    return res.json({ message: 'Cascade cleanup completed for user (partial).' });
  } catch (error) {
    console.error('Error performing admin cascade cleanup for user:', error);
    return res.status(500).json({ error: 'Failed to perform cascade cleanup' });
  }
});

export default router;
