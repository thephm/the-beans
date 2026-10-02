import isoCountries from 'i18n-iso-countries'
import englishCountries from 'i18n-iso-countries/langs/en.json'

isoCountries.registerLocale(englishCountries)

interface CountryFlagProps {
  country?: string | null
  className?: string
}

export default function CountryFlag({ country, className = '' }: CountryFlagProps) {
  const value = country?.trim() || ''
  const isHawaii = value.toUpperCase() === 'HI' || value.toLowerCase() === 'hawaii'
  const code = isoCountries.getAlpha2Code(value, 'en')
    || isoCountries.alpha3ToAlpha2(value.toUpperCase())
    || (value.length === 2 && isoCountries.isValid(value.toUpperCase()) ? value.toUpperCase() : undefined)

  if (!isHawaii && !code) return null

  return (
    <span
      role="img"
      aria-label={`${value} flag`}
      title={value}
      className={`fi ${isHawaii ? '' : `fi-${code?.toLowerCase()}`} shrink-0 rounded-sm ${className}`}
      style={{ width: 16, height: 12, ...(isHawaii ? { backgroundImage: 'url(/images/hawaii.svg)' } : {}) }}
    />
  )
}