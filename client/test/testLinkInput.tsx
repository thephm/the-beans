import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import LinkInput, { getFieldLink } from '../src/components/LinkInput'

async function render(props: React.ComponentProps<typeof LinkInput>, language = 'en') {
  const i18n = createInstance()
  const translations = JSON.parse(readFileSync(resolve(`public/locales/${language}/common.json`), 'utf8'))
  await i18n.init({
    lng: language,
    resources: { [language]: { translation: translations } },
    initImmediate: false,
    interpolation: { escapeValue: false },
  })
  return renderToStaticMarkup(<I18nextProvider i18n={i18n}><LinkInput onChange={() => {}} {...props} /></I18nextProvider>)
}

test('URL actions preserve paths, query parameters and fragments without changing the input', async () => {
  const value = ' https://example.com/some/path?id=123#contact '
  assert.equal(getFieldLink(value, 'url'), value.trim())
  assert.equal(getFieldLink('example.com/path?id=1', 'url'), 'https://example.com/path?id=1')
  assert.equal(getFieldLink('http://localhost:5000/path', 'url'), 'http://localhost:5000/path')
  const markup = await render({ type: 'url', value, name: 'website', required: true, className: 'px-3' })
  assert.ok(markup.includes(`value="${value}"`))
  assert.ok(markup.includes(`href="${value.trim()}"`))
  assert.match(markup, /target="_blank"/)
  assert.match(markup, /rel="noopener noreferrer"/)
  assert.match(markup, /name="website"/)
  assert.match(markup, /required=""/)
  assert.match(markup, /!pr-12/)
  assert.match(markup, /m216-160-56-56 464-464H360v-80h400v400h-80v-264L216-160Z/)
  assert.ok(!markup.includes('<button'))
})

test('email actions use the provided envelope and encode mailto recipients safely', async () => {
  assert.equal(getFieldLink(' info@example.com ', 'email'), 'mailto:info@example.com')
  assert.equal(getFieldLink('info+coffee@example.com', 'email'), 'mailto:info%2Bcoffee@example.com')
  assert.equal(getFieldLink('info?subject=bad@example.com', 'email'), 'mailto:info%3Fsubject%3Dbad@example.com')
  const markup = await render({ type: 'email', value: 'info@example.com' })
  assert.match(markup, /href="mailto:info@example.com"/)
  assert.match(markup, /aria-label="Send email to info@example.com"/)
  assert.match(markup, /M160-160q-33 0-56.5-23.5T80-240/)
  assert.ok(!markup.includes('target='))
})

test('empty, invalid and unsafe values never produce navigable links', async () => {
  for (const value of ['', ' ', 'https://', 'javascript:alert(1)', 'data:text/html,test', 'file:///tmp/test', 'https://exa mple.com']) {
    assert.equal(getFieldLink(value, 'url'), null)
    const markup = await render({ value })
    assert.ok(!markup.includes('<a '))
    if (value.trim()) assert.match(markup, /aria-disabled="true"/)
  }
  for (const value of ['', 'no-email', 'info@', 'info@example.com\n?subject=bad']) {
    assert.equal(getFieldLink(value, 'email'), null)
    assert.ok(!(await render({ type: 'email', value })).includes('<a '))
  }
})

test('links track new unsaved values and have English and French accessible labels', async () => {
  const before = await render({ value: 'https://old.example.com' })
  const after = await render({ value: 'https://new.example.com', readOnly: true })
  assert.match(before, /href="https:\/\/old.example.com\/"/)
  assert.match(after, /href="https:\/\/new.example.com\/"/)
  assert.match(after, /readonly=""/)
  const frenchUrl = await render({ value: 'https://example.com' }, 'fr')
  const frenchEmail = await render({ type: 'email', value: 'info@example.com' }, 'fr')
  assert.match(frenchUrl, /aria-label="Ouvrir https:\/\/example.com dans un nouvel onglet"/)
  assert.match(frenchEmail, /aria-label="Envoyer un e-mail à info@example.com"/)
  assert.match(frenchUrl, /aria-hidden="true"/)
})
