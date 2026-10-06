'use client'

import React, { forwardRef, InputHTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'

type LinkKind = 'url' | 'email'

interface LinkInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value'> {
  value: string
  linkKind?: LinkKind
  wrapperClassName?: string
}

export function getFieldLink(value: string, kind: LinkKind): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (kind === 'email') {
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(trimmed)) return null
    return `mailto:${encodeURIComponent(trimmed).replace(/%40/g, '@')}`
  }

  if (/\s/.test(trimmed)) return null
  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
  try {
    const url = new URL(hasScheme ? trimmed : `https://${trimmed}`)
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) return null
    return url.href
  } catch (error) {
    if (error instanceof TypeError) return null
    throw error
  }
}

const LinkInput = forwardRef<HTMLInputElement, LinkInputProps>(function LinkInput(
  { value, type, linkKind = type === 'email' ? 'email' : 'url', className = '', wrapperClassName = '', disabled, ...props },
  ref,
) {
  const { t } = useTranslation()
  const href = getFieldLink(value, linkKind)
  const label = linkKind === 'email'
    ? t('common.sendEmailTo', { defaultValue: 'Send email to {{value}}', value: value.trim() })
    : t('common.openUrl', { defaultValue: 'Open {{value}} in a new tab', value: value.trim() })
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor" aria-hidden="true" focusable="false">
      <path d={linkKind === 'email'
        ? 'M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z'
        : 'm216-160-56-56 464-464H360v-80h400v400h-80v-264L216-160Z'} />
    </svg>
  )

  return (
    <span className={`relative block w-full min-w-0 ${wrapperClassName}`}>
      <input {...props} ref={ref} type={type} value={value} disabled={disabled} className={`w-full ${className} !pr-12`} />
      {value.trim() && (href ? (
        <a
          href={href}
          target={linkKind === 'url' ? '_blank' : undefined}
          rel={linkKind === 'url' ? 'noopener noreferrer' : undefined}
          aria-label={label}
          title={label}
          className="absolute inset-y-0 right-2 my-auto flex h-8 max-h-full w-8 items-center justify-center rounded text-[#1f1f1f] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100 dark:hover:bg-gray-600"
        >
          {icon}
        </a>
      ) : (
        <span
          aria-disabled="true"
          aria-label={t('common.invalidLink', 'Enter a valid URL or email address to use this link')}
          title={t('common.invalidLink', 'Enter a valid URL or email address to use this link')}
          className="absolute inset-y-0 right-2 my-auto flex h-8 max-h-full w-8 items-center justify-center text-gray-400"
        >
          {icon}
        </span>
      ))}
    </span>
  )
})

export default LinkInput
