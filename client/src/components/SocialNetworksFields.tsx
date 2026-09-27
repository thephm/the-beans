'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { stripToRootUrl } from '@/lib/url'
import {
  PRIMARY_SOCIAL_NETWORKS,
  SECONDARY_SOCIAL_NETWORKS,
  SOCIAL_NETWORK_META,
  SocialNetworkKey,
} from '@/lib/socials'

interface SocialNetworksFieldsProps {
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
  idPrefix?: string
}

export default function SocialNetworksFields({ values, onChange, idPrefix = 'social' }: SocialNetworksFieldsProps) {
  const { t } = useTranslation()
  const [showAll, setShowAll] = useState(false)

  const setValue = (key: SocialNetworkKey, value: string) => onChange({ ...values, [key]: value })

  const renderField = (key: SocialNetworkKey) => {
    const meta = SOCIAL_NETWORK_META[key]
    return (
      <div key={key}>
        <label
          htmlFor={`${idPrefix}-${key}`}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {t(meta.translationKey, meta.label)}
        </label>
        <input
          id={`${idPrefix}-${key}`}
          type="url"
          name={key}
          value={values[key] || ''}
          onChange={(event) => setValue(key, event.target.value)}
          onPaste={(event) => {
            event.preventDefault()
            setValue(key, stripToRootUrl(event.clipboardData.getData('text')))
          }}
          placeholder={meta.placeholder}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {PRIMARY_SOCIAL_NETWORKS.map(renderField)}
      {SECONDARY_SOCIAL_NETWORKS.map((key) => (
        <div key={key} className={`${showAll ? 'block' : 'hidden'} md:block`}>
          {renderField(key)}
        </div>
      ))}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline"
        >
          {showAll
            ? t('adminForms.roasters.showLessSocials', 'Show less')
            : t('adminForms.roasters.showMoreSocials', 'Show more')}
        </button>
      </div>
    </div>
  )
}
