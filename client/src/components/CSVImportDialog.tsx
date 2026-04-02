"use client";
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api';

interface CSVImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CSVImportDialog: React.FC<CSVImportDialogProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please select a valid CSV file');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResults(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setImporting(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${apiUrl}/api/roasters/import/csv`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResults(data.results);
      
      if (data.results.created > 0) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import CSV');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResults(null);
    setError(null);
    setCopied(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const buildResultsText = () => {
    if (!results) return '';
    const lines = [
      `Total Rows: ${results.total}`,
      `Successfully Created: ${results.created}`,
    ];

    if (typeof results.updated === 'number') {
      lines.push(`Updated (unverified): ${results.updated}`);
    }

    lines.push(`Skipped: ${results.skipped}`);

    if (results.errors && results.errors.length > 0) {
      lines.push('Errors/Warnings:');
      results.errors.forEach((err: string) => lines.push(`- ${err}`));
    }

    return lines.join('\n');
  };

  const handleCopyResults = async () => {
    if (!results) return;
    try {
      await navigator.clipboard.writeText(buildResultsText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy results');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t('admin.roasters.importCSV', 'Import Roasters from CSV')}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* CSV Template */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                {t('admin.roasters.csvTemplateHint', 'Download the CSV template with a sample row, then fill it in.')}
              </div>
              <a
                href="/roasters-import-template.csv"
                download
                className="inline-flex items-center justify-center px-3 py-2 text-sm font-semibold text-blue-700 dark:text-blue-200 bg-white/80 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded hover:bg-white dark:hover:bg-blue-900/60"
              >
                {t('admin.roasters.downloadTemplate', 'Download template')}
              </a>
            </div>
          </div>

          {/* File Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('admin.roasters.selectCSVFile', 'Select CSV File')}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-900 dark:text-gray-100
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                dark:file:bg-blue-900/30 dark:file:text-blue-300
                cursor-pointer"
              disabled={importing}
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="mb-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {t('admin.roasters.importResults', 'Import Results')}
                </h3>
                <button
                  type="button"
                  onClick={handleCopyResults}
                  className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                  title="Copy results"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                <p>Total Rows: {results.total}</p>
                <p>Successfully Created: {results.created}</p>
                {typeof results.updated === 'number' && (
                  <p>Updated (unverified): {results.updated}</p>
                )}
                <p>Skipped: {results.skipped}</p>
                
                {results.errors && results.errors.length > 0 && (
                  <div className="mt-3 p-3 rounded bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-100">
                    <p className="font-semibold mb-1">Errors/Warnings:</p>
                    <ul className="list-disc list-inside ml-2 max-h-40 overflow-y-auto space-y-0.5 text-xs">
                      {results.errors.map((err: string, idx: number) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClose}
              disabled={importing}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              {results ? t('common.close', 'Close') : t('common.cancel', 'Cancel')}
            </button>
            {!results && (
              <button
                onClick={handleImport}
                disabled={!file || importing}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {importing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('admin.roasters.importing', 'Importing...')}
                  </>
                ) : (
                  t('admin.roasters.import', 'Import')
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVImportDialog;
