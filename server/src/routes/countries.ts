import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/countries:
 *   get:
 *     summary: Get all coffee origin countries
 *     tags: [Countries]
 *     parameters:
 *       - in: query
 *         name: regionId
 *         schema:
 *           type: string
 *         description: Filter countries by region ID
 *     responses:
 *       200:
 *         description: List of all countries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Country'
 */
router.get('/', async (req: any, res: any) => {
  try {
    const { regionId } = req.query;
    
    const whereClause = regionId ? { regionId } : {};
    
    const countries = await prisma.country.findMany({
      where: whereClause,
      include: {
        region: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json(countries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/countries/{id}:
 *   get:
 *     summary: Get a specific country by ID
 *     tags: [Countries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Country details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Country'
 *       404:
 *         description: Country not found
 */
router.get('/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    
    const country = await prisma.country.findUnique({
      where: { id },
      include: {
        region: true
      }
    });

    if (!country) {
      return res.status(404).json({ error: 'Country not found' });
    }

    res.json(country);
  } catch (error) {
    console.error('Error fetching country:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/countries/code/{code}:
 *   get:
 *     summary: Get a country by its ISO code
 *     tags: [Countries]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Country details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Country'
 *       404:
 *         description: Country not found
 */
router.get('/code/:code', async (req: any, res: any) => {
  try {
    const { code } = req.params;
    
    const country = await prisma.country.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        region: true
      }
    });

    if (!country) {
      return res.status(404).json({ error: 'Country not found' });
    }

    res.json(country);
  } catch (error) {
    console.error('Error fetching country:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;