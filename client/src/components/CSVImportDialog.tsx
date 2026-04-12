"use client";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Link from 'next/link';
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface CSVImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CSVImportFieldChange {
  field: string;
  from: string;
  to: string;
}

interface CSVImportCreatedItem {
  row: number;
  id: string;
  name: string;
}

interface CSVImportUpdatedItem {
  row: number;
  id: string;
  name: string;
  changes: CSVImportFieldChange[];
}

interface CSVImportSkippedItem {
  row: number;
  id?: string;
  name: string;
  reason: string;
}

interface CSVImportResults {
  total: number;
  created: number;
  updated?: number;
  skipped: number;
  createdItems?: CSVImportCreatedItem[];
  updatedItems?: CSVImportUpdatedItem[];
  skippedItems?: CSVImportSkippedItem[];
  warnings?: string[];
  errors?: string[];
}

const escapeMarkdownText = (value: string) => value.replace(/[[\]\\]/g, '\\$&');

const escapeHtmlText = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const buildEditPath = (id: string) => `/admin/roasters/edit/${id}`;

const buildMarkdownRoasterLink = (name: string, id: string) => `[${escapeMarkdownText(name)}](${buildEditPath(id)})`;

const formatQuotedValue = (value: string) => `"${value}"`;

const formatChangeText = (change: CSVImportFieldChange) => {
  return `changed ${change.field} from ${formatQuotedValue(change.from)} to ${formatQuotedValue(change.to)}`;
};

const parseImportMessage = (message: string) => {
  const roasterMatch = message.match(/^Row (\d+): Roaster "([^"]+)" (.+)$/);
  if (roasterMatch) {
    return {
      row: Number(roasterMatch[1]),
      roasterName: roasterMatch[2],
      detail: roasterMatch[3],
    };
  }

  const rowMatch = message.match(/^Row (\d+): (.+)$/);
  if (rowMatch) {
    return {
      row: Number(rowMatch[1]),
      roasterName: null,
      detail: rowMatch[2],
    };
  }

  return {
    row: null,
    roasterName: null,
    detail: message,
  };
};

const buildResultsHtml = (results: CSVImportResults, appOrigin: string) => {
  const createdItems = results.createdItems || [];
  const updatedItems = results.updatedItems || [];
  const skippedItems = results.skippedItems || [];
  const messages = [...(results.errors || []), ...(results.warnings || [])];

  const renderSection = (title: string, body: string, background: string, text: string) => {
    if (!body) {
      return '';
    }

    return `<section style="margin-top:16px;padding:12px 14px;border-radius:10px;background:${background};color:${text};"><h2 style="margin:0 0 8px 0;font-size:16px;">${title}</h2><ul style="margin:0;padding-left:20px;">${body}</ul></section>`;
  };

  const buildAbsoluteEditPath = (id: string) => `${appOrigin}${buildEditPath(id)}`;

  const createdHtml = createdItems.map((item) => {
    return `<li style="margin:4px 0;"><a href="${buildAbsoluteEditPath(item.id)}" target="_blank" rel="noopener noreferrer" style="font-weight:600;color:#1d4ed8;text-decoration:none;">${escapeHtmlText(item.name)}</a> <span style="color:#6b7280;">(row ${item.row})</span></li>`;
  }).join('');

  const updatedHtml = updatedItems.map((item) => {
    const changeSummary = item.changes.map(formatChangeText).map(escapeHtmlText).join('; ');
    return `<li style="margin:4px 0;"><a href="${buildAbsoluteEditPath(item.id)}" target="_blank" rel="noopener noreferrer" style="font-weight:600;color:#047857;text-decoration:none;">${escapeHtmlText(item.name)}</a> <span style="color:#047857;">(row ${item.row})</span>: ${changeSummary}</li>`;
  }).join('');

  const skippedHtml = skippedItems.map((item) => {
    const roasterName = item.id
      ? `<a href="${buildAbsoluteEditPath(item.id)}" target="_blank" rel="noopener noreferrer" style="font-weight:600;color:#0369a1;text-decoration:none;">${escapeHtmlText(item.name)}</a>`
      : `<span style="font-weight:600;">${escapeHtmlText(item.name)}</span>`;

    return `<li style="margin:4px 0;">${roasterName} <span style="color:#0369a1;">(row ${item.row})</span>: ${escapeHtmlText(item.reason)}</li>`;
  }).join('');

  const messagesHtml = messages.map((message) => {
    const parsedMessage = parseImportMessage(message);

    if (parsedMessage.roasterName && parsedMessage.row !== null) {
      return `<li style="margin:4px 0;"><span style="font-weight:600;">${escapeHtmlText(parsedMessage.roasterName)}</span> <span style="color:#a16207;">(row ${parsedMessage.row})</span>: ${escapeHtmlText(parsedMessage.detail)}</li>`;
    }

    if (parsedMessage.row !== null) {
      return `<li style="margin:4px 0;"><span style="color:#a16207;">(row ${parsedMessage.row})</span>: ${escapeHtmlText(parsedMessage.detail)}</li>`;
    }

    return `<li style="margin:4px 0;">${escapeHtmlText(parsedMessage.detail)}</li>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Import Results</title>
  </head>
  <body style="margin:0;padding:24px;background:#f8fafc;color:#111827;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <main style="max-width:960px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:24px;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
        <div>
          <h1 style="margin:0 0 12px 0;font-size:28px;">Import Results</h1>
          <p style="margin:0 0 6px 0;">Total Rows: ${results.total}</p>
          <p style="margin:0 0 6px 0;">Successfully Created: ${results.created}</p>
          ${typeof results.updated === 'number' ? `<p style="margin:0 0 6px 0;">Updated (unverified): ${results.updated}</p>` : ''}
          <p style="margin:0;">Skipped: ${results.skipped}</p>
        </div>
      </div>
      ${renderSection('Created', createdHtml, '#ffffff', '#111827')}
      ${renderSection('Updated', updatedHtml, '#ecfdf5', '#065f46')}
      ${renderSection('Skipped', skippedHtml, '#f0f9ff', '#0c4a6e')}
      ${renderSection('Errors/Warnings', messagesHtml, '#fefce8', '#713f12')}
    </main>
  </body>
</html>`;
};

const CSVImportDialog: React.FC<CSVImportDialogProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<CSVImportResults | null>(null);
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
      
      if (data.results.created > 0 || data.results.updated > 0) {
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
      'Import Results',
      `Total Rows: ${results.total}`,
      `Successfully Created: ${results.created}`,
    ];

    const createdItems = results.createdItems || [];
    const updatedItems = results.updatedItems || [];
    const skippedItems = results.skippedItems || [];

    if (typeof results.updated === 'number') {
      lines.push(`Updated (unverified): ${results.updated}`);
    }

    lines.push(`Skipped: ${results.skipped}`);

    if (createdItems.length > 0) {
      lines.push('', 'Created:');
      createdItems.forEach((item) => {
        lines.push(`- ${buildMarkdownRoasterLink(item.name, item.id)} (row ${item.row})`);
      });
    }

    if (updatedItems.length > 0) {
      lines.push('', 'Updated:');
      updatedItems.forEach((item) => {
        const changeSummary = item.changes.map(formatChangeText).join('; ');
        lines.push(`- ${buildMarkdownRoasterLink(item.name, item.id)} (row ${item.row}): ${changeSummary}`);
      });
    }

    if (skippedItems.length > 0) {
      lines.push('', 'Skipped:');
      skippedItems.forEach((item) => {
        const label = item.id ? buildMarkdownRoasterLink(item.name, item.id) : item.name;
        lines.push(`- ${label} (row ${item.row}): ${item.reason}`);
      });
    }

    if (results.errors && results.errors.length > 0) {
      lines.push('', 'Errors/Warnings:');
      results.errors.forEach((err: string) => lines.push(`- ${err}`));
    }

    if (results.warnings && results.warnings.length > 0) {
      if (!results.errors || results.errors.length === 0) {
        lines.push('', 'Errors/Warnings:');
      }
      results.warnings.forEach((warning: string) => lines.push(`- ${warning}`));
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

  const handleOpenResultsInNewTab = () => {
    if (!results) return;

    const html = buildResultsHtml(results, window.location.origin);
    const blob = new Blob([html], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    const newWindow = window.open(blobUrl, '_blank');

    if (!newWindow) {
      URL.revokeObjectURL(blobUrl);
      setError('Failed to open results in a new tab');
      return;
    }

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 60000);
  };

  if (!isOpen) return null;

  const createdItems = results?.createdItems || [];
  const updatedItems = results?.updatedItems || [];
  const skippedItems = results?.skippedItems || [];
  const messages = [...(results?.errors || []), ...(results?.warnings || [])];

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
                  onClick={handleOpenResultsInNewTab}
                  className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                  title="Open results in new tab"
                >
                  <OpenInNewIcon sx={{ fontSize: 16 }} />
                  <span>Open</span>
                </button>
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

                {createdItems.length > 0 && (
                  <div className="mt-3 p-3 rounded bg-lime-50 dark:bg-lime-900/20 text-lime-900 dark:text-lime-100">
                    <p className="font-semibold mb-1">Created:</p>
                    <ul className="list-disc list-inside ml-2 max-h-40 overflow-y-auto space-y-0.5 text-xs">
                      {createdItems.map((item) => (
                        <li key={`created-${item.row}-${item.id}`}>
                          <Link
                            href={buildEditPath(item.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-lime-700 hover:text-lime-800 hover:underline dark:text-lime-200 dark:hover:text-lime-50"
                          >
                            {item.name}
                          </Link>{' '}
                          <span className="text-lime-700 dark:text-lime-200">(row {item.row})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {updatedItems.length > 0 && (
                  <div className="mt-3 p-3 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100">
                    <p className="font-semibold mb-1">Updated:</p>
                    <ul className="list-disc list-inside ml-2 max-h-40 overflow-y-auto space-y-0.5 text-xs">
                      {updatedItems.map((item) => (
                        <li key={`updated-${item.row}-${item.id}`}>
                          <Link
                            href={buildEditPath(item.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline dark:text-emerald-200 dark:hover:text-emerald-50"
                          >
                            {item.name}
                          </Link>{' '}
                          <span className="text-emerald-700 dark:text-emerald-200">(row {item.row})</span>
                          <span>: {item.changes.map(formatChangeText).join('; ')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {skippedItems.length > 0 && (
                  <div className="mt-3 p-3 rounded bg-sky-50 dark:bg-sky-900/20 text-sky-900 dark:text-sky-100">
                    <p className="font-semibold mb-1">Skipped:</p>
                    <ul className="list-disc list-inside ml-2 max-h-40 overflow-y-auto space-y-0.5 text-xs">
                      {skippedItems.map((item, idx) => (
                        <li key={`skipped-${item.row}-${idx}`}>
                          {item.id ? (
                            <Link
                              href={buildEditPath(item.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-sky-700 hover:text-sky-800 hover:underline dark:text-sky-200 dark:hover:text-sky-50"
                            >
                              {item.name}
                            </Link>
                          ) : (
                            <span className="font-medium">{item.name}</span>
                          )}{' '}
                          <span className="text-sky-700 dark:text-sky-200">(row {item.row})</span>
                          <span>: {item.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {messages.length > 0 && (
                  <div className="mt-3 p-3 rounded bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-100">
                    <p className="font-semibold mb-1">Errors/Warnings:</p>
                    <ul className="list-disc list-inside ml-2 max-h-40 overflow-y-auto space-y-0.5 text-xs">
                      {messages.map((err: string, idx: number) => (
                        <li key={idx}>
                          {(() => {
                            const parsedMessage = parseImportMessage(err);

                            if (parsedMessage.roasterName && parsedMessage.row !== null) {
                              return (
                                <>
                                  <span className="font-medium">{parsedMessage.roasterName}</span>{' '}
                                  <span className="text-yellow-700 dark:text-yellow-200">(row {parsedMessage.row})</span>
                                  <span>: {parsedMessage.detail}</span>
                                </>
                              );
                            }

                            if (parsedMessage.row !== null) {
                              return (
                                <>
                                  <span className="text-yellow-700 dark:text-yellow-200">(row {parsedMessage.row})</span>
                                  <span>: {parsedMessage.detail}</span>
                                </>
                              );
                            }

                            return <span>{parsedMessage.detail}</span>;
                          })()}
                        </li>
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
