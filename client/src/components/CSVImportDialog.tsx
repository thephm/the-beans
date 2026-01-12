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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

          {/* CSV Format Instructions */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              {t('admin.roasters.csvFormat', 'CSV Format Requirements')}
            </h3>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p><strong>Required Column:</strong> Roaster Name</p>
              <p><strong>Optional Columns:</strong></p>
              <ul className="list-disc list-inside ml-2 space-y-0.5">
                <li>Description, Web URL, Email, Phone, Founded</li>
                <li>Address, City, Province, Country, Postal Code</li>
                <li>Source Countries (semicolon-separated, in quotes)</li>
                <li>Specialties (semicolon-separated, in quotes)</li>
                <li>Social URLs: Instagram URL, TikTok URL, Facebook URL, LinkedIn URL, YouTube URL, Threads URL, Pinterest URL, BlueSky URL, X URL, Reddit URL</li>
                <li>Person Details: First Name, Last Name, Title, Mobile, LinkedIn URL, Instagram URL, Bio</li>
                <li>Role (semicolon-separated, in quotes): Owner, Employee, Roaster, Admin, Marketing, Scout, Customer</li>
                <li>Primary: Yes or No</li>
                <li>Online Only: Yes or No (or blank)</li>
              </ul>
              <p className="mt-2"><strong>Note:</strong> All imported roasters are set to unverified status by default.</p>
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
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                {t('admin.roasters.importResults', 'Import Results')}
              </h3>
              <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <p>Total Rows: {results.total}</p>
                <p>Successfully Created: {results.created}</p>
                <p>Skipped: {results.skipped}</p>
                
                {results.errors && results.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="font-semibold mb-1">Errors/Warnings:</p>
                    <ul className="list-disc list-inside ml-2 max-h-40 overflow-y-auto space-y-0.5">
                      {results.errors.map((err: string, idx: number) => (
                        <li key={idx} className="text-xs">{err}</li>
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
