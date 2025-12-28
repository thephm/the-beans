import { Request, Response, NextFunction } from 'express';

function convertBigIntValues(value: any): any {
  if (typeof value === 'bigint') {
    try {
      // If within safe integer range, convert to number
      const num = Number(value);
      if (Number.isSafeInteger(num)) return num;
      // Otherwise return string to preserve precision
      return value.toString();
    } catch {
      return value.toString();
    }
  }
  if (Array.isArray(value)) {
    return value.map(convertBigIntValues);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const k of Object.keys(value)) {
      out[k] = convertBigIntValues((value as any)[k]);
    }
    return out;
  }
  return value;
}

export default function bigintSerializer(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);
  res.json = (body?: any) => {
    try {
      const sanitized = convertBigIntValues(body);
      return originalJson(sanitized);
    } catch (err) {
      // In case of unexpected errors, log and fallback to original
      // eslint-disable-next-line no-console
      console.error('bigintSerializer error:', err);
      return originalJson(body);
    }
  };
  next();
}
