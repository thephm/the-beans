"use client";
import { useEffect, useState, useMemo } from 'react';
import Select, { components } from 'react-select';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import enCommon from '../../../../public/locales/en/common.json';
import frCommon from '../../../../public/locales/fr/common.json';

export default function AnalyticsDashboard() {
	const { user, token } = useAuth();
	const { t, i18n } = useTranslation();
	const lookupBundled = (key: string, lang: string) => {
		const parts = key.split('.');
		const root = lang === 'fr' ? frCommon : enCommon;
		let cur: any = root;
		for (const p of parts) {
			if (!cur) return undefined;
			cur = cur[p];
		}
		return cur;
	};

	const tr = (key: string, fallback: string) => {
		try {
			const translated = t(key, fallback);
			const exists = i18n.exists(key, { ns: 'common' });
			if (exists && translated && translated !== fallback) return translated;
			const lang = i18n?.language || 'en';
			const fromBundle = lookupBundled(key, lang);
			return fromBundle || translated || fallback;
		} catch (e) {
			return fallback;
		}
	};

	const eventTypeLabels: Record<string, string> = useMemo(() => ({
		page_view: tr('admin.analytics.eventTypes.page_view', 'Page View'),
		signup: tr('admin.analytics.eventTypes.signup', 'Signup'),
		login: tr('admin.analytics.eventTypes.login', 'Login'),
		favorite: tr('admin.analytics.eventTypes.favorite', 'Favorite'),
		review: tr('admin.analytics.eventTypes.review', 'Review'),
		unknown: tr('admin.analytics.eventTypes.unknown', 'Unknown Event'),
	}), [i18n.language, t]);

	const [stats, setStats] = useState([] as any[]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [translationsReady, setTranslationsReady] = useState(false);
	const [pageFilter, setPageFilter] = useState('');

	// Full list of site pages (includes admin pages so they can be selected)
	const pagesList = [
		'/',
		'/discover',
		'/about',
		'/favorites',
		'/suggest',
		'/profile',
		'/roasters',
		'/settings',
		'/login',
		'/signup',
		'/contact',
		'/cookies',
		'/privacy',
		'/terms',
		'/admin/analytics',
		'/admin/audit-logs',
		'/admin/backup',
		'/admin/people',
		'/admin/roasters',
		'/admin/specialties',
		'/admin/suggestions',
		'/admin/users',
	];
	const adminOptions = pagesList.map(p => ({ value: p, label: p }));
	const [selectedPages, setSelectedPages] = useState([] as string[]);
	const [startDateFilter, setStartDateFilter] = useState('');
	const [endDateFilter, setEndDateFilter] = useState('');
	const [searchFilter, setSearchFilter] = useState('');
	const [filtersCollapsed, setFiltersCollapsed] = useState(false);
	const [eventType, setEventType] = useState('page_view');
	const [exportScope, setExportScope] = useState('all' as 'all' | 'page');
	const [currentPage, setCurrentPage] = useState(1);
	const [limit] = useState(20);
	const [totalPages, setTotalPages] = useState(1);
	const [displayRows, setDisplayRows] = useState([] as any[]);

	useEffect(() => {
		let mounted = true;
		async function ensureTranslations() {
			try {
				const lang = i18n?.language || 'en';
				await i18n.loadNamespaces('common');
				await i18n.reloadResources(lang, 'common');
				try {
					const url = (typeof window !== 'undefined' ? window.location.origin : '') + `/locales/${lang}/common.json`;
					await fetch(url, { cache: 'no-store' }).catch(() => null);
				} catch (fetchErr) {}
				if (mounted) setTranslationsReady(true);
			} catch (err) {
				if (mounted) setTranslationsReady(true);
			}
		}
		ensureTranslations();
		return () => { mounted = false; };
	}, [i18n?.language]);

	const fetchStats = async (overrideParams?: Record<string, string>) => {
		if (!user || user.role !== 'admin') return;
		setLoading(true);
		try {
			const params: Record<string, string> = overrideParams || {};
			if (!overrideParams) {
				params.eventType = eventType;
				if (startDateFilter) params.from = startDateFilter;
				if (endDateFilter) params.to = endDateFilter;
			}
			const requestParams: any = { ...params };
			if (selectedPages && selectedPages.length > 0) requestParams.page = selectedPages;
			const res = await apiClient.getAdminAnalyticsStats(requestParams);
			const rows = res as any[];
			setStats(rows);
			applyClientFilters(rows, 1);
		} catch (e) {
			console.error('Failed to load analytics', e);
			setError(t('admin.analytics.loadFailed', 'Failed to load analytics'));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { fetchStats(); }, [user, token, eventType, startDateFilter, endDateFilter]);
	useEffect(() => { applyClientFilters(undefined, 1); }, [selectedPages, searchFilter, stats]);

	const applyClientFilters = (rowsParam?: any[], page = 1) => {
		const rows = rowsParam || stats || [];
		let filtered = rows.slice();
		if (selectedPages && selectedPages.length > 0) {
			filtered = filtered.filter((r: any) => {
				const rp = (r.page || '').toString();
				return selectedPages.some(sp => rp === sp || rp.startsWith(sp + '/') || rp.startsWith(sp));
			});
		} else {
			// By default, exclude admin pages from results unless specific pages are selected
			filtered = filtered.filter((r: any) => {
				const rp = (r.page || '').toString();
				return !rp.startsWith('/admin');
			});
		}
		if (searchFilter) {
			const q = searchFilter.toLowerCase();
			filtered = filtered.filter((r: any) => JSON.stringify(r).toLowerCase().includes(q));
		}
		const tp = Math.max(1, Math.ceil(filtered.length / limit));
		setTotalPages(tp);
		const p = Math.max(1, Math.min(page, tp));
		setCurrentPage(p);
		const start = (p - 1) * limit;
		setDisplayRows(filtered.slice(start, start + limit));
	};

	const exportFilteredCSV = (currentPageOnly = false) => {
		let rowsToExport: any[] = [];
		if (currentPageOnly) rowsToExport = displayRows.slice();
		else {
			let filtered = (stats || []).slice();
			if (selectedPages && selectedPages.length > 0) {
				filtered = filtered.filter((r: any) => {
					const rp = (r.page || '').toString();
					return selectedPages.some(sp => rp === sp || rp.startsWith(sp + '/') || rp.startsWith(sp));
				});
			} else {
				// Default export should also exclude admin pages
				filtered = filtered.filter((r: any) => {
					const rp = (r.page || '').toString();
					return !rp.startsWith('/admin');
				});
			}
			if (searchFilter) {
				const q = searchFilter.toLowerCase();
				filtered = filtered.filter((r: any) => JSON.stringify(r).toLowerCase().includes(q));
			}
			rowsToExport = filtered;
		}
		const header = ['period', 'period_iso', 'event_type', 'page', 'count'];
		const rows = rowsToExport.map((r: any) => {
			let iso = '';
			if (r.period) {
				const p = String(r.period).trim();
				if (/^\d{4}-\d{2}-\d{2}$/.test(p)) iso = `${p}T00:00:00Z`;
				else if (/^\d{4}-\d{2}-\d{2} \d{2}$/.test(p)) iso = p.replace(' ', 'T') + ':00:00Z';
				else iso = p;
			}
			return [r.period, iso, r.event_type, r.page || '', String(r.count || '')];
		});
		const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		const scopeTag = currentPageOnly ? 'page' : 'all';
		a.download = `analytics_${eventType}_${scopeTag}_${new Date().toISOString().slice(0,10)}.csv`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	};

	if (!user || user.role !== 'admin') return <div>{tr('admin.analytics.adminRequired', 'Admin access required.')}</div>;
	if (loading) return <div>{tr('admin.analytics.loading', 'Loading analytics...')}</div>;
	if (error) return <div>{error}</div>;
	if (!stats || stats.length === 0) {
		return (
			<div className="container mx-auto pt-20 sm:pt-28 px-4 sm:px-8 lg:px-32">
				<div className="mb-6">
					<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">{tr('admin.analytics.title', 'Analytics')}</h1>
				</div>
				<div className="text-gray-600 dark:text-gray-400 mb-4">
					{tr('admin.analytics.noRows', 'No analytics rows returned. Count: {{count}}').replace('{{count}}', String(stats ? stats.length : 0))}
				</div>
			</div>
		);
	}

	const hasPage = true;

	const getEventLabel = (eventTypeRaw: any) => {
		if (!eventTypeRaw) return eventTypeLabels.unknown || '';
		const s = String(eventTypeRaw).trim();
		const key = s
			.toLowerCase()
			.replace(/[^a-z0-9\\s_]/g, '')
			.replace(/\\s+/g, '_')
			.replace(/-+/g, '_');
		return eventTypeLabels[key] || eventTypeLabels.unknown || s;
	};

	return (
		<div className="container mx-auto pt-20 sm:pt-28 px-4 sm:px-8 lg:px-32">
			<div className="mb-6">
				<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">{tr('admin.analytics.title', 'Analytics')}</h1>
			</div>
			<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6 border border-gray-200 dark:border-blue-500">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{tr('admin.analytics.filters.title', 'Filters')}</h2>
					<div className="flex items-center space-x-3">
						<button aria-expanded={!filtersCollapsed} onClick={() => setFiltersCollapsed(!filtersCollapsed)} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
							{filtersCollapsed ? tr('admin.analytics.filters.show', 'Show filters') : tr('admin.analytics.filters.hide', 'Hide filters')}
						</button>
					</div>
				</div>
				{!filtersCollapsed && (
					<div className="grid grid-cols-1 md:grid-cols-12 gap-4">
						<div className="md:col-span-2">
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tr('admin.analytics.filters.eventType', 'Event Type')}</label>
							<select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
								<option value="page_view">{tr('admin.analytics.eventTypes.page_view', 'Page View')}</option>
								<option value="signup">{tr('admin.analytics.eventTypes.signup', 'Signup')}</option>
								<option value="login">{tr('admin.analytics.eventTypes.login', 'Login')}</option>
								<option value="favorite">{tr('admin.analytics.eventTypes.favorite', 'Favorite')}</option>
								<option value="review">{tr('admin.analytics.eventTypes.review', 'Review')}</option>
							</select>
						</div>
						{eventType === 'page_view' && (
							<div className="md:col-span-3">
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tr('admin.analytics.filters.page', 'Page')}</label>
								<div className="mt-1">
									<div className="flex items-center space-x-2 mb-2">
										<label className="inline-flex items-center text-sm text-gray-700 dark:text-gray-200">
											<input type="checkbox" className="mr-2" checked={selectedPages.length === pagesList.length} onChange={(e) => {
												if (e.target.checked) setSelectedPages(pagesList.slice());
												else setSelectedPages([]);
											}} />
											{tr('admin.analytics.filters.selectAll', 'Select all pages')}
										</label>
									</div>
									<div className="mt-1">
										<Select
											components={{
												ValueContainer: ({ children, ...props }: any) => {
													const maxVisible = 3;
													const values = props.getValue ? props.getValue() : [];
													const visible = (values || []).slice(0, maxVisible);
													const rest = Math.max(0, (values || []).length - visible.length);
													const input = children && Array.isArray(children) ? children.find((c: any) => c && c.props && String(c.props.className).includes('input')) || children[children.length - 1] : null;
													return (
														<components.ValueContainer {...props}>
															{visible.map((v: any, i: number) => (
																<div key={v.value || v.label || i} className="react-select__multi-value bg-gray-700 text-gray-100 px-2 py-0.5 rounded mr-2 text-sm inline-flex items-center">
																	<div className="react-select__multi-value__label">{v.label}</div>
																</div>
															))}
															{rest > 0 && <div className="ml-2 text-sm text-gray-400">{tr('admin.analytics.filters.more', '+{{count}} more').replace('{{count}}', String(rest))}</div>}
															{input}
														</components.ValueContainer>
													);
												}
											}}
											isMulti
											options={adminOptions}
											value={selectedPages.map(p => ({ value: p, label: p }))}
											onChange={(vals: any) => {
												const v = vals || [];
												setSelectedPages(v.map((it: any) => it.value));
											}}
                                            			placeholder={tr('admin.analytics.filters.selectPagesPlaceholder', 'Select pages...')}
											className="react-select-container"
											classNamePrefix="react-select"
											styles={{
												control: (base, state) => ({
													...base,
													background: state.isFocused ? '#1f2937' : '#1f2937',
													borderColor: state.isFocused ? '#3b82f6' : '#4b5563',
													boxShadow: state.isFocused ? '0 0 0 2px rgba(59,130,246,0.2)' : 'none',
													color: '#f9fafb',
													minHeight: '40px',
												}),
												menu: (base) => ({ ...base, background: '#0f172a', color: '#f9fafb' }),
												option: (base, state) => ({
													...base,
													background: state.isFocused ? '#1f2937' : 'transparent',
													color: '#f9fafb',
												}),
												multiValue: (base) => ({ ...base, background: '#374151', color: '#f9fafb' }),
												placeholder: (base) => ({ ...base, color: '#9ca3af' }),
												singleValue: (base) => ({ ...base, color: '#f9fafb' }),
											}}
										/>
									</div>
								</div>
							</div>
						)}
						<div className="md:col-span-2">
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tr('admin.analytics.filters.startDate', 'Start Date')}</label>
							<input type="date" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 [color-scheme:light] dark:[color-scheme:dark]" />
						</div>
						<div className="md:col-span-2">
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tr('admin.analytics.filters.endDate', 'End Date')}</label>
							<input type="date" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 [color-scheme:light] dark:[color-scheme:dark]" />
						</div>
						<div className="md:col-span-3">
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tr('admin.analytics.filters.search', 'Search')}</label>
							<input value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} placeholder={tr('admin.analytics.filters.searchPlaceholder', 'search term...')} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
						</div>
						<div className="md:col-span-12 lg:col-span-3 flex flex-col md:flex-row items-end md:items-center justify-end space-y-2 md:space-y-0 md:space-x-2">
							<div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0">
								<button onClick={() => fetchStats()} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">{tr('admin.analytics.filters.apply', 'Apply')}</button>
								<button onClick={() => { setPageFilter(''); setSelectedPages([]); setStartDateFilter(''); setEndDateFilter(''); setSearchFilter(''); setEventType('page_view'); fetchStats(); }} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500">{tr('admin.analytics.filters.clear', 'Clear')}</button>
							</div>
							<div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0">
								<select value={exportScope} onChange={(e) => setExportScope(e.target.value as 'all' | 'page')} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
									<option value="all">{tr('admin.analytics.exportAll', 'Export All')}</option>
									<option value="page">{tr('admin.analytics.exportPage', 'Export Current Page')}</option>
								</select>
								<button onClick={() => { exportFilteredCSV(exportScope === 'page'); }} className="px-3 py-2 bg-green-600 text-white rounded-md">{tr('admin.analytics.exportCSV', 'Export CSV')}</button>
							</div>
							<div className="mt-2 md:mt-0 ml-0 md:ml-4 text-sm text-gray-600 dark:text-gray-300">{tr('admin.analytics.rowsCount', 'Rows: {{count}}').replace('{{count}}', String(stats.length))}</div>
						</div>
					</div>
				)}
			</div>
			<div className="overflow-x-auto">
				<table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
					<thead className="bg-gray-50 dark:bg-gray-900">
						<tr>
							<th className="py-3 px-4 border-b border-gray-200 dark:border-gray-700 text-left font-medium text-gray-900 dark:text-gray-100">{tr('admin.analytics.period', 'Period')}</th>
							<th className="py-3 px-4 border-b border-gray-200 dark:border-gray-700 text-left font-medium text-gray-900 dark:text-gray-100">{tr('admin.analytics.eventType', 'Event Type')}</th>
							<th className="py-3 px-4 border-b border-gray-200 dark:border-gray-700 text-left font-medium text-gray-900 dark:text-gray-100">{tr('admin.analytics.page', 'Page')}</th>
							<th className="py-3 px-4 border-b border-gray-200 dark:border-gray-700 text-left font-medium text-gray-900 dark:text-gray-100">{tr('admin.analytics.count', 'Count')}</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
						{displayRows.map((row, i) => (
							<tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
								<td className="py-3 px-4 text-left text-gray-900 dark:text-gray-100">{row.period}</td>
								<td className="py-3 px-4 text-left text-gray-900 dark:text-gray-100">{getEventLabel(row.event_type)}</td>
								<td className="py-3 px-4 text-left text-gray-900 dark:text-gray-100">{row.page || ''}</td>
								<td className="py-3 px-4 text-left text-gray-900 dark:text-gray-100">{row.count}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className="mt-4 flex items-center justify-between">
				<div className="text-sm text-gray-700 dark:text-gray-300">{tr('admin.analytics.page', 'Page')} <span className="font-medium">{currentPage}</span> {tr('admin.analytics.of', 'of')} <span className="font-medium">{totalPages}</span></div>
				<div className="inline-flex items-center space-x-1">
					<button onClick={() => { if (currentPage > 1) applyClientFilters(undefined, currentPage - 1); }} disabled={currentPage <= 1} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700">{tr('common.previous', 'Prev')}</button>
					{Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
						const base = Math.max(1, Math.min(currentPage - 2, Math.max(1, totalPages - 4)));
						const p = base + idx;
						if (p > totalPages) return null;
						return (
							<button key={p} onClick={() => applyClientFilters(undefined, p)} className={`px-3 py-1 rounded ${p === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{p}</button>
						);
					})}
					<button onClick={() => { if (currentPage < totalPages) applyClientFilters(undefined, currentPage + 1); }} disabled={currentPage >= totalPages} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700">{tr('common.next', 'Next')}</button>
				</div>
			</div>
		</div>
	);
}
