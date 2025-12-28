import express, { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';

const router = express.Router();
// Use shared Prisma client

// Get current user's favorites
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as import('../types').AuthenticatedRequest;

  try {
    const userId = authReq.user?.id;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        roaster: {
          include: {
            roasterImages: {
              orderBy: [
                { isPrimary: 'desc' },
                { uploadedAt: 'desc' }
              ],
              take: 1
            },
            roasterSpecialties: {
              include: {
                specialty: {
                  include: {
                    translations: {
                      where: {
                        language: (req as any).language || 'en'
                      }
                    }
                  }
                }
              }
            },
            _count: {
              select: {
                reviews: true,
                favorites: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the response to match the expected format
    const roastersWithImageUrl = favorites.map(fav => {
      const roaster = fav.roaster;
      
      // Get primary image URL
      let imageUrl = null;
      if (roaster.roasterImages && roaster.roasterImages.length > 0) {
        imageUrl = roaster.roasterImages[0].url;
      } else if (roaster.images && roaster.images.length > 0) {
        imageUrl = roaster.images[0];
      }

      // Transform specialties
      const specialties = roaster.roasterSpecialties?.map((rs: any) => ({
        id: rs.specialty.id,
        name: rs.specialty.translations[0]?.name || 'Unknown',
        deprecated: rs.specialty.deprecated
      })) || [];

      return {
        ...roaster,
        imageUrl,
        specialties,
        isFavorited: true
      };
    });

    res.json(roastersWithImageUrl);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a roaster to favorites
router.post('/:roasterId', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as import('../types').AuthenticatedRequest;

  try {
    const userId = authReq.user?.id;
    const { roasterId } = authReq.params;
    if (!userId || !roasterId) {
      return res.status(400).json({ error: 'Missing userId or roasterId' });
    }
    // Check if roaster exists
    const roaster = await prisma.roaster.findUnique({
      where: { id: roasterId }
    });
    if (!roaster) {
      return res.status(404).json({ error: 'Roaster not found' });
    }
    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_roasterId: {
          userId,
          roasterId
        }
      }
    });
    if (existing) {
      return res.status(400).json({ error: 'Already favorited' });
    }
    // Create favorite
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        roasterId
      }
    });
    res.status(201).json({ message: 'Added to favorites', favorite });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove a roaster from favorites
router.delete('/:roasterId', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as import('../types').AuthenticatedRequest;

  try {
    const userId = authReq.user?.id;
    const { roasterId } = authReq.params;
    if (!userId || !roasterId) {
      return res.status(400).json({ error: 'Missing userId or roasterId' });
    }
    // Check if favorite exists
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_roasterId: {
          userId,
          roasterId
        }
      }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Favorite not found' });
    }
    // Delete favorite
    await prisma.favorite.delete({
      where: {
        userId_roasterId: {
          userId,
          roasterId
        }
      }
    });
    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
