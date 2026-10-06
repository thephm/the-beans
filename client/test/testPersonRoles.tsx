import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import resolveConfig from 'tailwindcss/resolveConfig'
import config from '../tailwind.config'
import PersonRolePill from '../src/components/PersonRolePill'
import PersonRoleButtons from '../src/components/PersonRoleButtons'
import { PersonRole, COMMON_PERSON_ROLES, RESOURCE_PERSON_ROLES } from '../src/types'
import { getPersonRoleLabel, getPersonRolePresentation, PERSON_ROLE_PRESENTATION } from '../src/lib/personRoles'

const english = JSON.parse(readFileSync(resolve('public/locales/en/common.json'), 'utf8'))
const french = JSON.parse(readFileSync(resolve('public/locales/fr/common.json'), 'utf8'))
const colors = resolveConfig(config).theme.colors

function classHex(className: string) {
  const match = /^(?:dark:)?(?:bg|text|border)-([a-z]+)-(\d+)(?:\/40)?$/.exec(className)
  assert.ok(match, `Unsupported color class: ${className}`)
  const palette = Object.entries(colors).find(([name]) => name === match[1])?.[1]
  assert.ok(typeof palette === 'object')
  const hex = Object.entries(palette).find(([shade]) => shade === match[2])?.[1]
  assert.ok(typeof hex === 'string')
  return hex
}

async function render(element: React.ReactElement, language = 'en') {
  const i18n = createInstance()
  await i18n.init({
    lng: language,
    resources: { en: { translation: english }, fr: { translation: french } },
    initImmediate: false,
  })
  return renderToStaticMarkup(<I18nextProvider i18n={i18n}>{element}</I18nextProvider>)
}

test('every selectable role has a distinct palette and translated labels', () => {
  const palettes = new Set<string>()
  for (const role of Object.values(PersonRole)) {
    const presentation = getPersonRolePresentation(role)
    assert.equal(english.admin.people[presentation.translationKey.split('.').pop()!], presentation.label)
    assert.ok(french.admin.people[presentation.translationKey.split('.').pop()!])
    palettes.add(presentation.colorClasses)
  }
  assert.equal(palettes.size, Object.values(PersonRole).length)
  assert.match(getPersonRolePresentation('founder').colorClasses, /bg-green-100/)
  assert.match(getPersonRolePresentation('owner').colorClasses, /bg-purple-100/)
})

test('display normalization and unknown-role fallback preserve readable labels', () => {
  for (const role of ['founder', ' FOUNDER ', 'Founder']) {
    assert.deepEqual(getPersonRolePresentation(role), getPersonRolePresentation('founder'))
  }
  for (const role of ['guest_editor', 'guest-editor', 'guestEditor', ' Guest Editor ']) {
    const presentation = getPersonRolePresentation(role)
    assert.equal(presentation.label, 'Guest Editor')
    assert.equal(presentation.translationKey, 'admin.people.roleGuestEditor')
    assert.equal(presentation.colorClasses, PERSON_ROLE_PRESENTATION.other.colorClasses)
  }
  assert.equal(getPersonRoleLabel('founder', (_key, options) => options.defaultValue), 'Founder')
  assert.equal(getPersonRolePresentation('rando').label, 'Anonymous')
})

test('read-only pills and selected buttons use identical labels and color classes in both languages', async () => {
  for (const language of ['en', 'fr']) {
    for (const role of RESOURCE_PERSON_ROLES) {
      const pill = await render(<PersonRolePill role={role} />, language)
      const button = await render(<PersonRoleButtons selectedRoles={[role]} roles={[role]} onRoleToggle={() => {}} />, language)
      const { translationKey, colorClasses } = getPersonRolePresentation(role)
      const locale = language === 'en' ? english : french
      const label = locale.admin.people[translationKey.split('.').pop()!]
      assert.ok(pill.includes(label))
      assert.ok(button.includes(label))
      for (const className of colorClasses.split(' ')) {
        assert.ok(pill.includes(className), `Pill missing ${className}`)
        assert.ok(button.includes(className), `Button missing ${className}`)
      }
      assert.match(pill, /rounded-full/)
      assert.match(button, /aria-pressed="true"/)
    }
  }
})

test('selectors preserve allowed roles, neutral unselected state, and disabled semantics', async () => {
  const defaultButtons = await render(<PersonRoleButtons selectedRoles={[]} onRoleToggle={() => {}} />)
  assert.equal((defaultButtons.match(/<button /g) || []).length, COMMON_PERSON_ROLES.length)
  assert.ok(!defaultButtons.includes('Creator'))
  const button = await render(<PersonRoleButtons selectedRoles={[]} roles={['founder']} disabled onRoleToggle={() => {}} />)
  assert.match(button, /aria-pressed="false"/)
  assert.match(button, /disabled=""/)
  assert.match(button, /bg-white/)
  assert.ok(!button.includes('bg-green-100'))
  assert.match(button, /focus-visible:ring-2/)
})

test('palette documentation stays synchronized with labels and exact configured color codes', () => {
  const documentation = readFileSync(resolve('../docs/admin/person-role-palette.md'), 'utf8')
  const rows = documentation.split('\n').filter((line) => /^\| [a-z]+ \|/.test(line))
  assert.equal(rows.length, Object.keys(PERSON_ROLE_PRESENTATION).length)
  for (const [role, definition] of Object.entries(PERSON_ROLE_PRESENTATION)) {
    const row = rows.find((line) => line.startsWith(`| ${role} |`))
    assert.ok(row, `Missing documented role: ${role}`)
    const cells = row.split('|').map((cell) => cell.trim()).slice(1, -1)
    const presentation = getPersonRolePresentation(role)
    assert.equal(cells[1], definition.label)
    assert.equal(cells[2], french.admin.people[presentation.translationKey.split('.').pop()!])
    const expectedColors = definition.colorClasses.split(' ').map(classHex)
    assert.deepEqual(cells.slice(4), expectedColors, `Documented colors differ for ${role}`)
  }
})

test('all role labels meet WCAG AA text contrast in light and dark cards', () => {
  const rgb = (hex: string) => [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
  const luminance = (channels: number[]) => channels
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0)
  const contrast = (text: number[], background: number[]) => {
    const values = [luminance(text), luminance(background)].sort((a, b) => b - a)
    return (values[0] + 0.05) / (values[1] + 0.05)
  }
  for (const [role, definition] of Object.entries(PERSON_ROLE_PRESENTATION)) {
    const [background, text, , darkBackground, darkText] = definition.colorClasses.split(' ').map(classHex)
    assert.ok(contrast(rgb(text), rgb(background)) >= 4.5, `${role}: insufficient light contrast`)
    for (const surface of ['bg-gray-800', 'bg-gray-950']) {
      const surfaceRgb = rgb(classHex(surface))
      const blended = rgb(darkBackground).map((channel, index) => channel * 0.4 + surfaceRgb[index] * 0.6)
      assert.ok(contrast(rgb(darkText), blended) >= 4.5, `${role}: insufficient dark contrast on ${surface}`)
    }
  }
})

test('Tailwind emits every shared role background, border, and text utility', async () => {
  const result = await postcss([tailwindcss(config)]).process('@tailwind utilities;', { from: undefined })
  for (const definition of Object.values(PERSON_ROLE_PRESENTATION)) {
    for (const className of definition.colorClasses.split(' ')) {
      const selector = `.${className.replace(/[:/]/g, '\\$&')}`
      assert.ok(result.css.includes(selector), `Generated CSS missing ${className}`)
    }
  }
})
