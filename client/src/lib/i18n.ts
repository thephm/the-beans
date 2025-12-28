
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Preload locale JSON so pages don't render before resources are available.
// Importing from `public/locales` so the JSON is bundled during dev/build.
import enCommon from '../../public/locales/en/common.json';
import frCommon from '../../public/locales/fr/common.json';
// Initialize i18n
if (!i18n.isInitialized) {
  i18n
    .use(HttpBackend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        // Preloaded resources — ensures translations exist immediately
        resources: {
          en: { common: enCommon },
          fr: { common: frCommon },
        },
      lng: 'en', // default language
      fallbackLng: 'en',
      debug: false, // Disable debug to reduce console noise
      ns: ['common'],
      defaultNS: 'common',
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage', 'sessionStorage'],
      },
      react: {
        useSuspense: false,
        bindI18n: 'languageChanged loaded',
        bindI18nStore: 'added removed',
        transEmptyNodeValue: '',
        transSupportBasicHtmlNodes: true,
        transKeepBasicHtmlNodesFor: ['br', 'strong', 'i'],
      },
      backend: {
        loadPath: (typeof window !== 'undefined' ? window.location.origin : '') + '/locales/{{lng}}/{{ns}}.json',
        allowMultiLoading: false,
        crossDomain: false,
        requestOptions: {
          mode: 'cors',
          credentials: 'same-origin',
          cache: 'default',
        },
      },
    });
}

export default i18n

// Expose i18n on window in development to aid debugging in the browser console
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.__i18n = i18n;
}

// Ensure preloaded bundles are registered even if i18n was initialized elsewhere
if (typeof window !== 'undefined') {
  try {
    if (!i18n.hasResourceBundle('en', 'common')) {
      i18n.addResourceBundle('en', 'common', (enCommon as any), true, true);
    }
    if (!i18n.hasResourceBundle('fr', 'common')) {
      i18n.addResourceBundle('fr', 'common', (frCommon as any), true, true);
    }
  } catch (e) {
    // swallow errors in case addResourceBundle isn't available in some environments
    // eslint-disable-next-line no-console
    console.warn('Failed to add preloaded i18n bundles:', e);
  }
}
