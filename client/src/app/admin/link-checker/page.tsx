'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

type LinkItem = { url: string; category: string; service: string; entityId: string; entityName: string; editPath: string; linkIndex?: number };
type Result = LinkItem & { id?: string; statusCode?: number; isBroken: boolean; error?: string; disposition?: string | null; currentUrl?: string | null };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function LinkCheckerPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [category, setCategory] = useState('all');
  const [service, setService] = useState('all');
  const [skipRecent, setSkipRecent] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [delay, setDelay] = useState(750);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [previousBroken, setPreviousBroken] = useState<Result[]>([]);
  const [running, setRunning] = useState(false);
  const [rechecking, setRechecking] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const loadLinks = useCallback(async () => {
    setError('');
    try {
      const data = await apiClient.getLinkCheckerLinks({
        ...(category !== 'all' ? { category } : {}),
        ...(service !== 'all' ? { service } : {}),
        skipRecentlyChecked: String(skipRecent),
      }) as { links?: LinkItem[]; brokenLinks?: Result[] };
      setLinks(data.links || []);
      setPreviousBroken(data.brokenLinks || []);
      setResults([]);
      setProgress(0);
    } catch {
      setError(t('admin.linkChecker.loadFailed', 'Could not load links.'));
    }
  }, [category, service, skipRecent, t]);

  useEffect(() => {
    if (user?.role === 'admin') void loadLinks();
  }, [loadLinks, user?.role]);

  const recheckPrevious = async () => {
    setRechecking(true);
    setError('');
    try {
      for (const item of previousBroken.filter((failedLink) => failedLink.isBroken)) await apiClient.recheckLink({ id: item.id });
      await loadLinks();
    } catch {
      setError(t('admin.linkChecker.recheckFailed', 'Could not re-check failed links.'));
    } finally {
      setRechecking(false);
    }
  };

  const run = async () => {
    setRunning(true);
    pausedRef.current = false;
    setPaused(false);
    setResults([]);
    setProgress(0);
    try {
      for (let index = 0; index < links.length; index += 1) {
        while (pausedRef.current) await wait(250);
        let result: Result;
        try {
          result = await apiClient.checkLink({ linkIndex: links[index].linkIndex }) as Result;
        } catch (checkError) {
          result = {
            ...links[index],
            isBroken: true,
            error: checkError instanceof Error ? checkError.message : String(checkError || 'Unknown error'),
          };
        }
        setResults((current) => [...current, result]);
        setProgress(index + 1);
        if (index < links.length - 1) await wait(Math.max(0, Math.min(5000, delay)));
      }
    } catch {
      setError(t('admin.linkChecker.checkFailed', 'A link check failed unexpectedly.'));
    } finally {
      setRunning(false);
      setPaused(false);
      pausedRef.current = false;
    }
  };

  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  };

  if (!user || user.role !== 'admin') return <main className="p-8 pt-28">{t('admin.linkChecker.adminRequired', 'Admin access required.')}</main>;

  const broken = results.filter((result) => result.isBroken);
  const visiblePreviousBroken = previousBroken.filter((item) => showResolved || !item.disposition);
  const renderBrokenLinks = (items: Result[]) => <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800"><table className="min-w-full text-left text-sm text-gray-900 dark:text-gray-100"><thead><tr className="border-b dark:border-gray-600"><th className="p-3">{t('admin.linkChecker.entity', 'Entity')}</th><th className="p-3">{t('admin.linkChecker.url', 'URL')}</th><th className="p-3">{t('admin.linkChecker.error', 'Error')}</th><th className="p-3">{t('admin.linkChecker.disposition', 'Disposition')}</th></tr></thead><tbody>{items.map((item) => <tr key={`${item.id}-${item.url}`} className="border-b dark:border-gray-600"><td className="p-3"><Link className="text-primary-600 underline dark:text-primary-400" href={item.editPath}>{item.entityName}</Link></td><td className="max-w-xs truncate p-3">{item.url}{item.currentUrl && item.currentUrl !== item.url && <><br /><span className="text-gray-500">{item.currentUrl}</span></>}</td><td className="p-3">{item.error || item.statusCode || ''}</td><td className="p-3">{item.disposition || ''}</td></tr>)}</tbody></table></div>;
  return (
    <main className="min-h-screen bg-gray-50 px-4 pb-16 pt-28 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{t('admin.linkChecker.title', 'Link checker')}</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-300">{t('admin.linkChecker.description', 'Check database links and find broken ones.')}</p>
        <div className="mb-6 grid gap-4 rounded-lg border border-black/90 bg-white p-5 shadow dark:border-purple-400/70 dark:bg-gray-800 sm:grid-cols-2 lg:grid-cols-6">
          <label className="text-sm text-gray-700 dark:text-gray-200">{t('admin.linkChecker.type', 'Type')}
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ maxWidth: '11rem' }} className="mt-1 block w-full rounded border p-2 dark:bg-gray-700">
              <option value="all">{t('admin.linkChecker.all', 'All')}</option><option value="people">{t('admin.linkChecker.people', 'People')}</option><option value="roasters">{t('admin.linkChecker.roasters', 'Roasters')}</option><option value="resources">{t('admin.linkChecker.resources', 'Resources')}</option>
            </select>
          </label>
          <label className="text-sm text-gray-700 dark:text-gray-200">{t('admin.linkChecker.services', 'Services')}
            <select value={service} onChange={(e) => setService(e.target.value)} style={{ maxWidth: '11rem' }} className="mt-1 block w-full rounded border p-2 dark:bg-gray-700">
              <option value="all">{t('admin.linkChecker.all', 'All')}</option><option value="web">{t('admin.linkChecker.web', 'Web')}</option><option value="socials">{t('admin.linkChecker.socials', 'Socials')}</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200"><input type="checkbox" checked={skipRecent} onChange={(e) => setSkipRecent(e.target.checked)} />{t('admin.linkChecker.skipRecent', 'Skip checked in last 30 days')}</label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200"><input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />{t('admin.linkChecker.showResolved', 'Show resolved')}</label>
          <label className="text-sm text-gray-700 dark:text-gray-200">{t('admin.linkChecker.delay', 'Delay (ms)')}
            <input type="number" min="0" max="5000" step="250" value={delay} onChange={(e) => setDelay(Number(e.target.value))} className="mt-1 block w-24 rounded border p-2 dark:bg-gray-700 dark:text-gray-100" />
          </label>
          <div className="flex items-end gap-2"><button onClick={run} disabled={running || !links.length} className="rounded bg-primary-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{t('admin.linkChecker.start', 'Start')}</button>{running && <button onClick={togglePause} className="rounded bg-amber-500 px-4 py-2 font-semibold text-white">{paused ? t('admin.linkChecker.continue', 'Continue') : t('admin.linkChecker.pause', 'Pause')}</button>}</div>
        </div>
        {error && <p className="mb-4 text-red-600 dark:text-red-400">{error}</p>}
        {(running || results.length > 0) && <p className="mb-4 text-gray-700 dark:text-gray-200">{t('admin.linkChecker.progress', 'Progress')}: {progress}/{links.length} · {t('admin.linkChecker.broken', 'Broken')}: {broken.length}</p>}
        {previousBroken.length > 0 && <section className="mb-6"><div className="mb-3 flex items-center justify-between gap-4"><h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('admin.linkChecker.previousBroken', 'Previously failed links')} ({visiblePreviousBroken.length})</h2><button onClick={recheckPrevious} disabled={rechecking || running} className="rounded bg-primary-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{t('admin.linkChecker.recheck', 'Re-check')}</button></div>{visiblePreviousBroken.length > 0 && renderBrokenLinks(visiblePreviousBroken)}</section>}
        {broken.length > 0 && <section><h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-gray-100">{t('admin.linkChecker.currentBroken', 'Failed links in this check')} ({broken.length})</h2>{renderBrokenLinks(broken)}</section>}
      </div>
    </main>
  );
}
