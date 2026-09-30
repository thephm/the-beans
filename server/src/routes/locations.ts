import { createReadStream } from 'fs';
import path from 'path';
import { Router } from 'express';
import { parse } from 'csv-parse';
import { requireAuth } from '../middleware/requireAuth';

interface CityRecord {
  city: string;
  province: string;
  country: string;
}

const router = Router();
let cityRecordsPromise: Promise<CityRecord[]> | undefined;

const loadCityRecords = () => {
  if (!cityRecordsPromise) {
    cityRecordsPromise = new Promise<CityRecord[]>((resolve, reject) => {
      const records: CityRecord[] = [];
      const parser = parse({ columns: true, skip_empty_lines: true, trim: true, bom: true });

      parser.on('data', (record: Record<string, string>) => {
        const city = record.city?.trim();
        const province = record.province?.trim() || '';
        const country = record.country?.trim();
        if (city && country) records.push({ city, province, country });
      });
      parser.on('error', (error) => {
        cityRecordsPromise = undefined;
        reject(error);
      });
      parser.on('end', () => {
        const uniqueRecords = new Map<string, CityRecord>();
        for (const record of records) {
          const baseCity = record.city.split('|', 1)[0].replace(/^,\s*/, '').trim();
          const key = `${baseCity.toLocaleLowerCase()}|${record.province.toLocaleLowerCase()}|${record.country.toLocaleLowerCase()}`;
          const existing = uniqueRecords.get(key);
          if (!existing || (!existing.city.includes('|') && record.city.includes('|'))) {
            uniqueRecords.set(key, record);
          }
        }
        resolve([...uniqueRecords.values()]);
      });
      createReadStream(path.resolve(__dirname, '../../data/cities.csv')).pipe(parser);
    });
  }

  return cityRecordsPromise;
};

router.get('/cities', requireAuth, async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLocaleLowerCase() : '';
  const country = typeof req.query.country === 'string' ? req.query.country.trim().toLocaleLowerCase() : '';
  if (search.length < 2) return res.json({ cities: [] });

  try {
    const records = await loadCityRecords();
    const seen = new Set<string>();
    const cities: CityRecord[] = [];

    for (const record of records) {
      if (country && record.country.toLocaleLowerCase() !== country) continue;
      if (!record.city.toLocaleLowerCase().includes(search)) continue;
      const key = `${record.city.toLocaleLowerCase()}|${record.province.toLocaleLowerCase()}|${record.country.toLocaleLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      cities.push(record);
      if (cities.length === 50) break;
    }

    res.json({ cities });
  } catch (error) {
    console.error('Error searching city dataset:', error);
    res.status(500).json({ error: 'Could not search cities' });
  }
});

export default router;