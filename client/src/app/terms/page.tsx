'use client';

import { useTranslation } from 'react-i18next';

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            {t('terms.title', 'Terms of Service')}
          </h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-gray-600 mb-6">
              {t('terms.lastUpdated', 'Last updated: October 2025')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('terms.welcome.title', '1. Welcome to The Beans')}
              </h2>
              <p className="text-gray-700 mb-4">
                {t('terms.welcome.description', 'The Beans is a platform that helps coffee lovers discover local roasters and share their experiences. By using our service, you agree to these terms.')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('terms.acceptance.title', '2. Accepting These Terms')}
              </h2>
              <p className="text-gray-700 mb-4">
                {t('terms.acceptance.description', 'By creating an account or using The Beans, you confirm you are at least 13 years old and agree to follow these rules.')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('terms.userConduct.title', '3. How to Use The Beans')}
              </h2>
              <div className="text-gray-700">
                <p className="mb-3">{t('terms.userConduct.intro', 'You can:')}</p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>{t('terms.userConduct.allowed.discover', 'Discover and review coffee roasters')}</li>
                  <li>{t('terms.userConduct.allowed.share', 'Share honest reviews and photos')}</li>
                  <li>{t('terms.userConduct.allowed.connect', 'Connect with other coffee lovers')}</li>
                  <li>{t('terms.userConduct.allowed.favorite', 'Save your favorite roasters')}</li>
                </ul>
                <p className="mb-3">{t('terms.userConduct.prohibited', 'Please don\'t:')}</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>{t('terms.userConduct.forbidden.spam', 'Post spam or fake reviews')}</li>
                  <li>{t('terms.userConduct.forbidden.harmful', 'Share harmful or inappropriate content')}</li>
                  <li>{t('terms.userConduct.forbidden.impersonate', 'Pretend to be someone else')}</li>
                  <li>{t('terms.userConduct.forbidden.violate', 'Violate any laws or regulations')}</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('terms.content.title', '4. Your Content')}
              </h2>
              <p className="text-gray-700 mb-4">
                {t('terms.content.description', 'You own the reviews and photos you post. By sharing them on The Beans, you give us permission to display them to help other users discover great coffee. You can delete your content anytime.')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('terms.privacy.title', '5. Your Privacy')}
              </h2>
              <p className="text-gray-700 mb-4">
                {t('terms.privacy.description', 'We respect your privacy and only use your information to improve your experience on The Beans. We don\'t sell your personal data to third parties.')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('terms.service.title', '6. Our Service')}
              </h2>
              <p className="text-gray-700 mb-4">
                {t('terms.service.description', 'We work hard to keep The Beans running smoothly, but we can\'t guarantee it will always be perfect. We may need to update or temporarily pause the service for maintenance.')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('terms.changes.title', '7. Changes to These Terms')}
              </h2>
              <p className="text-gray-700 mb-4">
                {t('terms.changes.description', 'We may update these terms occasionally. If we make significant changes, we\'ll let you know. Continuing to use The Beans means you accept the new terms.')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('terms.contact.title', '8. Questions?')}
              </h2>
              <p className="text-gray-700">
                {t('terms.contact.description', 'If you have questions about these terms, please contact us at support@thebeans.ca')}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}