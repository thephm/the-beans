'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface BackupStep {
  step: string;
  status: 'pending' | 'in-progress' | 'success' | 'error';
  message?: string;
}

interface BackupResult {
  success: boolean;
  steps: BackupStep[];
  filename?: string;
}

interface TestResult {
  success: boolean;
  message?: string;
  configMissing?: boolean;
}

export default function BackupPage() {
  const { t } = useTranslation();
  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const [backupResult, setBackupResult] = useState<BackupResult | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [configChecked, setConfigChecked] = useState(false);

  // Check WebDAV configuration on page load
  useEffect(() => {
    handleTestWebDAV();
  }, []);

  const handleBackup = async () => {
    setIsBackupRunning(true);
    setBackupResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/backup/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      // Ensure data has steps array
      if (!data.steps) {
        setBackupResult({
          success: false,
          steps: [
            {
              step: 'Error',
              status: 'error',
              message: data.error || data.message || 'Unknown error occurred',
            },
          ],
        });
      } else {
        setBackupResult(data);
      }
    } catch (error: any) {
      setBackupResult({
        success: false,
        steps: [
          {
            step: 'Connection',
            status: 'error',
            message: error.message || 'Failed to connect to server',
          },
        ],
      });
    } finally {
      setIsBackupRunning(false);
    }
  };

  const handleTestWebDAV = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/backup/test-webdav', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      // Store result with configMissing flag
      setTestResult({
        success: data.success || false,
        message: data.message || data.error || 'WebDAV test failed',
        configMissing: data.configMissing || false,
      });
      setConfigChecked(true);
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Failed to connect to server',
        configMissing: false,
      });
      setConfigChecked(true);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'in-progress':
        return '⏳';
      case 'pending':
        return '⏸️';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'in-progress':
        return 'text-blue-600 dark:text-blue-400';
      case 'pending':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
        {t('admin.backup.title', 'Database Backup')}
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          {t('admin.backup.description', 'Create Backup')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {t(
            'admin.backup.info',
            'This will create a PostgreSQL database dump and upload it to the configured WebDAV server with a timestamp.'
          )}
        </p>

        <div className="flex gap-4">
          <button
            onClick={handleBackup}
            disabled={isBackupRunning}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isBackupRunning
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {isBackupRunning
              ? t('admin.backup.running', 'Backup in Progress...')
              : t('admin.backup.start', 'Start Backup')}
          </button>

          <button
            onClick={handleTestWebDAV}
            disabled={isBackupRunning}
            className="px-6 py-3 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
          >
            {t('admin.backup.testWebdav', 'Test WebDAV Connection')}
          </button>
        </div>
      </div>

      {testResult && (
        <div
          className={`rounded-lg shadow-md p-6 mb-6 ${
            testResult.success
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}
        >
          <h3
            className={`text-lg font-semibold mb-2 ${
              testResult.success
                ? 'text-green-800 dark:text-green-300'
                : 'text-red-800 dark:text-red-300'
            }`}
          >
            {testResult.success ? '✅ WebDAV Connection Successful' : '❌ WebDAV Connection Failed'}
          </h3>
          {testResult.message && (
            <p
              className={
                testResult.success
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-red-700 dark:text-red-400'
              }
            >
              {testResult.message}
            </p>
          )}
        </div>
      )}

      {backupResult && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('admin.backup.progress', 'Backup Progress')}
            </h2>
            {backupResult.success && (
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                {t('admin.backup.success', 'Success')}
              </span>
            )}
            {!backupResult.success && (
              <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-sm font-medium">
                {t('admin.backup.failed', 'Failed')}
              </span>
            )}
          </div>

          {backupResult.filename && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-blue-800 dark:text-blue-300 font-medium">
                📁 {t('admin.backup.filename', 'Backup filename')}: {backupResult.filename}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {backupResult.steps && backupResult.steps.map((step, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  step.status === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : step.status === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : step.status === 'in-progress'
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getStatusIcon(step.status)}</span>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${getStatusColor(step.status)}`}>
                      {step.step}
                    </h3>
                    {step.message && (
                      <p className={`text-sm mt-1 ${getStatusColor(step.status)}`}>
                        {step.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Only show configuration warning if WebDAV credentials are missing */}
      {configChecked && testResult && !testResult.success && testResult.configMissing && !backupResult && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
            ⚠️ {t('admin.backup.configuration', 'Configuration Required')}
          </h3>
          <p className="text-yellow-700 dark:text-yellow-400 text-sm">
            {t(
              'admin.backup.configInfo',
              'Ensure the following environment variables are set in your server configuration:'
            )}
          </p>
          <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-400 text-sm mt-2 space-y-1">
            <li>
              <code className="bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded">
                WEBDAV_URL
              </code>{' '}
              - WebDAV server URL
            </li>
            <li>
              <code className="bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded">
                WEBDAV_USER
              </code>{' '}
              - WebDAV username
            </li>
            <li>
              <code className="bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded">
                WEBDAV_PASS
              </code>{' '}
              - WebDAV password
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
