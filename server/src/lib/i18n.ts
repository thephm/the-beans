import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface TranslatableField {
  en: string
  fr?: string
  [key: string]: string | undefined
}

/**
 * Helper function to get the translated value for a field based on the user's language
 * @param translations - Object containing translations for different languages
 * @param language - Target language code (e.g., 'en', 'fr')
 * @param fallbackLanguage - Fallback language code (default: 'en')
 * @returns Translated string
 */
export function getTranslation(
  translations: TranslatableField | string | null,
  language: string = 'en',
  fallbackLanguage: string = 'en'
): string {
  // If translations is null or undefined, return empty string
  if (!translations) {
    return ''
  }

  // If translations is already a string, return it as-is
  if (typeof translations === 'string') {
    return translations
  }

  // Try to get the translation for the requested language
  if (translations[language]) {
    return translations[language]!
  }

  // Fallback to the fallback language
  if (translations[fallbackLanguage]) {
    return translations[fallbackLanguage]!
  }

  // If nothing is found, return the first available translation
  const firstKey = Object.keys(translations)[0]
  return firstKey ? translations[firstKey]! : ''
}

/**
 * Middleware to add translation helper to request object
 */
export function addTranslationHelper(req: any, res: any, next: any) {
  // Get user's language from token or use default
  const userLanguage = req.user?.language || 'en'
  
  // Add translation helper to request
  req.t = (translations: TranslatableField | string | null) => 
    getTranslation(translations, userLanguage)
  
  next()
}

/**
 * Transform database results to include only the translated fields
 * @param results - Array of database results
 * @param language - Target language
 * @param translatableFields - Array of field names that should be translated
 */
export function localizeResults<T extends Record<string, any>>(
  results: T[],
  language: string = 'en',
  translatableFields: string[] = []
): T[] {
  return results.map(result => {
    const localizedResult = { ...result } as any
    
    translatableFields.forEach(field => {
      if (result[field]) {
        localizedResult[field] = getTranslation(result[field], language)
      }
    })
    
    return localizedResult as T
  })
}

/**
 * Get user's language from the authorization token
 */
export async function getUserLanguage(authHeader?: string): Promise<string> {
  if (!authHeader) return 'en'
  
  try {
    const token = authHeader.replace('Bearer ', '')
    if (!token) return 'en'
    
    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { language: true }
    })
    
    return user?.language || 'en'
  } catch (error) {
    console.error('Error getting user language:', error)
    return 'en'
  }
}
