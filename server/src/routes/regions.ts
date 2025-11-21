import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();
// Use shared Prisma client

/**
 * @swagger
 * components:
 *   schemas:
 *     Region:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         countries:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Country'
 *     Country:
 *       type: object
 *       required:
 *         - name
 *         - code
 *         - regionId
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         flagSvg:
 *           type: string
 *         regionId:
 *           type: string
 *         region:
 *           $ref: '#/components/schemas/Region'
 */

/**
 * @swagger
 * /api/regions:
 *   get:
 *     summary: Get all coffee regions
 *     tags: [Regions]
 *     responses:
 *       200:
 *         description: List of all regions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Region'
 */
router.get('/', async (req, res) => {
  try {
    const regions = await prisma.region.findMany({
      include: {
        countries: {
          orderBy: {
            name: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json(regions);
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/regions/{id}:
 *   get:
 *     summary: Get a specific region by ID
 *     tags: [Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Region details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Region'
 *       404:
 *         description: Region not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const region = await prisma.region.findUnique({
      where: { id },
      include: {
        countries: {
          orderBy: {
            name: 'asc'
          }
        }
      }
    });

    if (!region) {
      return res.status(404).json({ error: 'Region not found' });
    }

    res.json(region);
  } catch (error) {
    console.error('Error fetching region:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;