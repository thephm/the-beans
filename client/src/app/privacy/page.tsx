'use client';

import { useTranslation } from 'react-i18next';

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 dark:bg-none py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            {t('privacy.title', 'Privacy Policy')}
          </h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-gray-600 mb-6">
              {t('privacy.lastUpdated', 'Last updated: October 2025')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('privacy.intro.title', '1. Introduction')}
              </h2>
              <p className="text-gray-700 mb-4">
                {t('privacy.intro.description', 'The Beans ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our coffee roaster discovery platform.')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('privacy.dataCollection.title', '2. Information We Collect')}
              </h2>
              <div className="text-gray-700">
                <h3 className="text-xl font-semibold mb-3">
                  {t('privacy.dataCollection.personal.title', 'Personal Information')}
                </h3>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>{t('privacy.dataCollection.personal.email', 'Email address (for account creation and communication)')}</li>
                  <li>{t('privacy.dataCollection.personal.username', 'Username (for public profile identification)')}</li>
                  <li>{t('privacy.dataCollection.personal.profile', 'Profile information you choose to provide')}</li>
                  <li>{t('privacy.dataCollection.personal.location', 'Location data when you search for nearby roasters')}</li>
                </ul>
                
                <h3 className="text-xl font-semibold mb-3">
                  {t('privacy.dataCollection.usage.title', 'Usage Information')}
                </h3>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>{t('privacy.dataCollection.usage.reviews', 'Reviews, ratings, and photos you submit')}</li>
                  <li>{t('privacy.dataCollection.usage.favorites', 'Roasters you favorite or bookmark')}</li>
                  <li>{t('privacy.dataCollection.usage.interactions', 'Your interactions with roasters and other users')}</li>
                  <li>{t('privacy.dataCollection.usage.preferences', 'Language and other preferences')}</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">
                  {t('privacy.dataCollection.technical.title', 'Technical Information')}
                </h3>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>{t('privacy.dataCollection.technical.device', 'Device information and browser type')}</li>
                  <li>{t('privacy.dataCollection.technical.ip', 'IP address and general location')}</li>
                  <li>{t('privacy.dataCollection.technical.cookies', 'Cookies and similar tracking technologies')}</li>
                  <li>{t('privacy.dataCollection.technical.logs', 'Log data and usage analytics')}</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('privacy.dataUsage.title', '3. How We Use Your Information')}
              </h2>
              <div className="text-gray-700">
                <p className="mb-3">{t('privacy.dataUsage.intro', 'We use your information to:')}</p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>{t('privacy.dataUsage.provide', 'Provide and maintain our roaster discovery service')}</li>
                  <li>{t('privacy.dataUsage.personalize', 'Personalize your experience and recommendations')}</li>
                  <li>{t('privacy.dataUsage.communicate', 'Communicate with you about your account and our services')}</li>
                  <li>{t('privacy.dataUsage.improve', 'Improve our platform and develop new features')}</li>
                  <li>{t('privacy.dataUsage.security', 'Protect against fraud and ensure platform security')}</li>
                  <li>{t('privacy.dataUsage.legal', 'Comply with legal obligations and resolve disputes')}</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('privacy.dataSharing.title', '4. Information Sharing and Disclosure')}
              </h2>
              <div className="text-gray-700">
                <p className="mb-4">
                  {t('privacy.dataSharing.intro', 'We do not sell your personal information. We may share information in the following circumstances:')}
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>{t('privacy.dataSharing.public', 'Public information like reviews and ratings are visible to other users')}</li>
                  <li>{t('privacy.dataSharing.consent', 'With your explicit consent for specific purposes')}</li>
                  <li>{t('privacy.dataSharing.legal', 'When required by law or to protect our legal rights')}</li>
                  <li>{t('privacy.dataSharing.business', 'In connection with a business transfer or acquisition')}</li>
                  <li>{t('privacy.dataSharing.aggregated', 'Aggregated, anonymized data for analytics and research')}</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('privacy.cookies.title', '5. Cookies and Tracking')}
              </h2>
              <div className="text-gray-700">
                <p className="mb-4">
                  {t('privacy.cookies.description', 'We use cookies and similar technologies to enhance your experience:')}
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>{t('privacy.cookies.essential', 'Essential cookies for login and security')}</li>
                  <li>{t('privacy.cookies.preferences', 'Preference cookies to remember your settings')}</li>
                  <li>{t('privacy.cookies.analytics', 'Analytics cookies to understand usage patterns')}</li>
                </ul>
                <p className="mt-4">
                  {t('privacy.cookies.control', 'You can control cookies through your browser settings, though some features may not work without certain cookies.')}
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('privacy.security.title', '6. Data Security')}
              </h2>
              <p className="text-gray-700 mb-4">
                {t('privacy.security.description', 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('privacy.retention.title', '7. Data Retention')}
              </h2>
              <p className="text-gray-700 mb-4">
                {t('privacy.retention.description', 'We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. You may delete your account at any time, after which we will remove or anonymize your personal data within 30 days.')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('privacy.rights.title', '8. Your Rights and Choices')}
              </h2>
              <div className="text-gray-700">
                <p className="mb-3">{t('privacy.rights.intro', 'You have the following rights regarding your personal information:')}</p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>{t('privacy.rights.access', 'Access and review your personal data')}</li>
                  <li>{t('privacy.rights.correct', 'Correct inaccurate or incomplete information')}</li>
                  <li>{t('privacy.rights.delete', 'Request deletion of your personal data')}</li>
                  <li>{t('privacy.rights.export', 'Export your data in a portable format')}</li>
                  <li>{t('privacy.rights.restrict', 'Restrict processing of your information')}</li>
                  <li>{t('privacy.rights.withdraw', 'Withdraw consent where processing is based on consent')}</li>
                </ul>
                <p className="mt-4">
                  {t('privacy.rights.contact', 'To exercise these rights, please contact us through your account settings or email us directly.')}
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('privacy.international.title', '9. International Users')}
              </h2>
              <p className="text-gray-700 mb-4">
                {t('privacy.international.description', 'The Beans is based in Canada. If you are accessing our service from outside Canada, please be aware that your information may be transferred to, stored, and processed in Canada where our servers are located and our central database is operated.')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('privacy.children.title', '10. Children\'s Privacy')}
              </h2>
              <p className="text-gray-700 mb-4">
                {t('privacy.children.description', 'Our service is not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13. If we learn we have collected such information, we will delete it immediately.')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('privacy.changes.title', '11. Changes to This Policy')}
              </h2>
              <p className="text-gray-700 mb-4">
                {t('privacy.changes.description', 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('privacy.contact.title', '12. Contact Us')}
              </h2>
              <div className="text-gray-700">
                <p className="mb-4">
                  {t('privacy.contact.description', 'If you have any questions about this Privacy Policy or our privacy practices, please contact us:')}
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>{t('privacy.contact.email', 'Email: privacy@thebeans.ca')}</li>
                  <li>{t('privacy.contact.platform', 'Through our platform\'s contact form')}</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}