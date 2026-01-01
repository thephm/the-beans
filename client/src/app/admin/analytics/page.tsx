"use client";
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Select, { components } from 'react-select';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
		       favourite: tr('admin.analytics.eventTypes.favourite', 'Favourite'),
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
		'/favourites',
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
	const adminOptions = pagesList.map(p => ({ value: p, label: p === '/' ? 'home' : (p && String(p).startsWith('/') ? String(p).slice(1) : p) }));
	const [selectedPages, setSelectedPages] = useState([] as string[]);
	const [startDateFilter, setStartDateFilter] = useState('');
	const [endDateFilter, setEndDateFilter] = useState('');
	const [searchFilter, setSearchFilter] = useState('');
	const [filtersCollapsed, setFiltersCollapsed] = useState(false);
	const [isDarkMode, setIsDarkMode] = useState(false);
	const [eventType, setEventType] = useState('page_view');
	const [exportScope, setExportScope] = useState('all' as 'all' | 'page');
	const [currentPage, setCurrentPage] = useState(1);
	const [limit] = useState(20);
	const [totalPages, setTotalPages] = useState(1);
	const [filteredCount, setFilteredCount] = useState(0);
	const [displayRows, setDisplayRows] = useState([] as any[]);
	const [totals, setTotals] = useState({ totalPageViews: 0, discover: 0, about: 0, roasters: 0 });
	const [topPages, setTopPages] = useState([] as Array<{ label: string; page: string; count: number }>);
	const [topPagesDays, setTopPagesDays] = useState(30);

	useEffect(() => {
		// detect light/dark mode on client and keep a simple state for react-select styles
		// Also observe changes to the <html> class so toggling theme updates the state
		let mounted = true;
		try {
			const el = typeof document !== 'undefined' ? document.documentElement : null;
			if (el && mounted) setIsDarkMode(el.classList.contains('dark'));
			if (el) {
				const mo = new MutationObserver(() => {
					if (!mounted) return;
					setIsDarkMode(el.classList.contains('dark'));
				});
				mo.observe(el, { attributes: true, attributeFilter: ['class'] });
				// ensure we disconnect on cleanup
				const disconnect = () => mo.disconnect();
				// attach to closure cleanup below
				// store on element so cleanup can find it if needed (defensive)
				// @ts-ignore
				el.__analyticsThemeObserverDisconnect = disconnect;
			}
		} catch (e) {}

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
		return () => {
			mounted = false;
			try {
				const el = typeof document !== 'undefined' ? document.documentElement : null;
				if (el) {
					// @ts-ignore
					if (el.__analyticsThemeObserverDisconnect) el.__analyticsThemeObserverDisconnect();
				}
			} catch (e) {}
		};
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
	useEffect(() => { applyClientFilters(undefined, 1); }, [selectedPages, searchFilter, stats, topPagesDays]);

	const applyClientFilters = (rowsParam?: any[], page = 1) => {
		const rows = rowsParam || stats || [];
		let filtered = rows.slice();
		if (selectedPages && selectedPages.length > 0) {
			filtered = filtered.filter((r: any) => {
				const rp = (r.page || '').toString();
				return selectedPages.some(sp => {
					if (sp === '/') return rp === '/' || rp === '';
					return rp === sp || rp.startsWith(sp + '/') || rp.startsWith(sp);
				});
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
		setFilteredCount(filtered.length);

		// compute totals from the filtered set (before pagination)
		try {
			const totalPageViews = filtered.filter((r: any) => String(r.event_type) === 'page_view').reduce((acc: number, r: any) => acc + (Number(r.count) || 0), 0);
			const discover = filtered.filter((r: any) => (r.page || '').toString() === '/discover' && String(r.event_type) === 'page_view').reduce((acc: number, r: any) => acc + (Number(r.count) || 0), 0);
			const about = filtered.filter((r: any) => (r.page || '').toString() === '/about' && String(r.event_type) === 'page_view').reduce((acc: number, r: any) => acc + (Number(r.count) || 0), 0);
			const roasters = filtered.filter((r: any) => { const p = (r.page || '').toString(); return (p === '/roasters' || p.startsWith('/roasters/')) && String(r.event_type) === 'page_view'; }).reduce((acc: number, r: any) => acc + (Number(r.count) || 0), 0);
				setTotals({ totalPageViews, discover, about, roasters });

				// compute top pages
				try {
					const pageCounts: Record<string, number> = {};
					const cutoff = new Date();
					cutoff.setUTCDate(cutoff.getUTCDate() - Math.max(0, Number(topPagesDays || 0)));
					filtered.filter((r: any) => String(r.event_type) === 'page_view').forEach((r: any) => {
						// each row has a `period` like 'YYYY-MM-DD' or 'YYYY-MM-DD HH'
						const periodRaw = String(r.period || '').split(' ')[0];
						if (!periodRaw) return;
						const rowDate = new Date(periodRaw + 'T00:00:00Z');
						if (isNaN(rowDate.getTime())) return;
						if (rowDate < cutoff) return; // skip rows outside timeframe
						const p = (r.page || '').toString() || '/';
						// Only count roaster pages for Top Roasters
						if (!p.startsWith('/roasters')) return;
						pageCounts[p] = (pageCounts[p] || 0) + (Number(r.count) || 0);
					});
					const pagesArr = Object.keys(pageCounts).map(p => ({ page: p, count: pageCounts[p] }));
					pagesArr.sort((a, b) => b.count - a.count);
					const top3 = pagesArr.slice(0, 3); // only top 3 roaster pages
					// Resolve roaster names for these top 3
					(async () => {
						const resolved: Array<{ label: string; page: string; count: number }> = [];
						for (const it of top3) {
							let label = it.page === '/' ? 'home' : (it.page.startsWith('/') ? it.page.slice(1) : it.page);
							const m = String(it.page).match(/^\/roasters\/([^\/\?]+)/);
							if (m && m[1]) {
								const id = m[1];
								try {
									const r: any = await apiClient.getRoaster(id);
									if (r && (r.name || r.roasterName || r.roaster_name)) label = r.name || r.roasterName || r.roaster_name;
								} catch (e) {
									// leave label as path fallback
								}
							}
							resolved.push({ label, page: it.page, count: it.count });
						}
						setTopPages(resolved);
					})();
				} catch (e) {
					setTopPages([]);
				}
		} catch (e) {
			setTotals({ totalPageViews: 0, discover: 0, about: 0, roasters: 0 });
		}
		setTotalPages(tp);
		const p = Math.max(1, Math.min(page, tp));
		setCurrentPage(p);
		const start = (p - 1) * limit;
		setDisplayRows(filtered.slice(start, start + limit));
	};

	const resetFilters = () => {
		setPageFilter('');
		setSelectedPages([]);
		setStartDateFilter('');
		setEndDateFilter('');
		setSearchFilter('');
		setEventType('page_view');
		fetchStats();
	};

	const exportFilteredCSV = (currentPageOnly = false) => {
		let rowsToExport: any[] = [];
		if (currentPageOnly) rowsToExport = displayRows.slice();
		else {
			let filtered = (stats || []).slice();
			if (selectedPages && selectedPages.length > 0) {
				filtered = filtered.filter((r: any) => {
					const rp = (r.page || '').toString();
					return selectedPages.some(sp => {
						if (sp === '/') return rp === '/' || rp === '';
						return rp === sp || rp.startsWith(sp + '/') || rp.startsWith(sp);
					});
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

	// react-select colors depending on theme
	const rsColors = isDarkMode ? {
		controlBg: '#1f2937',
		controlBgFocused: '#111827',
		border: '#4b5563',
		focusRing: 'rgba(59,130,246,0.2)',
		text: '#f9fafb',
		menuBg: '#0f172a',
		optionHover: '#1f2937',
		multiBg: '#374151',
		placeholder: '#9ca3af'
	} : {
		controlBg: '#ffffff',
		controlBgFocused: '#ffffff',
		border: '#d1d5db',
		focusRing: 'rgba(59,130,246,0.15)',
		text: '#0f172a',
		menuBg: '#ffffff',
		optionHover: '#f3f4f6',
		multiBg: '#eef2f7',
		placeholder: '#6b7280'
	};

	return (
		<div className="container mx-auto pt-20 sm:pt-28 px-4 sm:px-8 lg:px-32">
			<div className="mb-6">
				<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">{tr('admin.analytics.title', 'Analytics')}</h1>
			</div>
			{/* Totals summary similar to audit logs */}
			{!loading && (
				<div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-6 mb-6">
					<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-blue-500 md:col-span-1 flex flex-col items-center justify-center text-center">
					<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{tr('admin.analytics.totals.totalPageViews', 'Total Views')}</h3>
						<p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{(totals.totalPageViews || 0).toLocaleString()}</p>
					</div>
					<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-blue-500 md:col-span-1 flex flex-col items-center justify-center text-center">
					<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{tr('admin.analytics.totals.discover', 'discover')}</h3>
						<p className="text-3xl font-bold text-green-600 dark:text-green-400">{(totals.discover || 0).toLocaleString()}</p>
					</div>
					<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-blue-500 md:col-span-1 flex flex-col items-center justify-center text-center">
					<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{tr('admin.analytics.totals.about', 'about')}</h3>
						<p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{(totals.about || 0).toLocaleString()}</p>
					</div>
					<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-blue-500 md:col-span-1 flex flex-col items-center justify-center text-center">
					<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{tr('admin.analytics.totals.roasters', 'roaster')}</h3>
						<p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{(totals.roasters || 0).toLocaleString()}</p>
					</div>
				<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-blue-500 col-span-full md:col-span-2">
					<div className="flex items-start justify-between">
						<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Top Roasters</h3>
						<select value={String(topPagesDays)} onChange={(e) => setTopPagesDays(Number(e.target.value))} className="ml-4 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
							<option value="7">7d</option>
							<option value="30">30d</option>
							<option value="90">90d</option>
							<option value="365">365d</option>
						</select>
					</div>
					<div className="space-y-2">
						{topPages.length === 0 && <div className="text-sm text-gray-500 dark:text-gray-400">No data</div>}
						{topPages.slice(0,3).map((p) => (
							<div key={p.page} className="flex items-center justify-between">
								<Link href={p.page} className="truncate text-sm text-gray-800 dark:text-gray-200 mr-4 hover:underline">{p.label}</Link>
								<span className="font-semibold text-sm text-gray-700 dark:text-gray-300">{p.count.toLocaleString()}</span>
							</div>
						))}
					</div>
				</div>
				</div>
			)}
			{loading && <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">{tr('admin.analytics.loading', 'Loading analytics...')}</div>}
			{error && <div className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</div>}
			<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6 border border-gray-200 dark:border-blue-500">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{tr('admin.analytics.filters.title', 'Filters')}</h2>
					<div className="flex items-center space-x-3">
						<Tooltip title={filtersCollapsed ? tr('admin.analytics.filters.show', 'Show') : tr('admin.analytics.filters.hide', 'Hide')}>
							<IconButton aria-expanded={!filtersCollapsed} onClick={() => setFiltersCollapsed(!filtersCollapsed)} size="small" className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
								{filtersCollapsed ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
							</IconButton>
						</Tooltip>
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
								   <option value="favourite">{tr('admin.analytics.eventTypes.favourite', 'Favourite')}</option>
								<option value="review">{tr('admin.analytics.eventTypes.review', 'Review')}</option>
							</select>
						</div>
						{eventType === 'page_view' && (
							<div className="md:col-span-3">
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tr('admin.analytics.filters.page', 'Page')}</label>
								<div className="mt-1">
									<div className="flex items-center space-x-2">
										<div className="flex-1 min-w-0">
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
																	<div key={v.value || v.label || i} className={`react-select__multi-value px-2 py-0.5 rounded mr-2 text-sm inline-flex items-center ${isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
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
												formatOptionLabel={(opt: any) => (opt && opt.label !== undefined && opt.label !== null && opt.label !== '' ? opt.label : (opt && opt.value ? (String(opt.value).startsWith('/') ? String(opt.value).slice(1) : opt.value) : ''))}
												options={adminOptions}
												value={selectedPages.map(p => ({ value: p, label: p === '/' ? 'home' : (p && String(p).startsWith('/') ? String(p).slice(1) : p) }))}
												onChange={(vals: any) => {
													const v = vals || [];
													setSelectedPages(v.map((it: any) => it.value));
												}}
												placeholder={tr('admin.analytics.filters.selectPagesPlaceholder', 'Select pages...')}
												className="react-select-container"
												classNamePrefix="react-select"
												styles={{
													control: (base: any, state: any) => ({
														...base,
														background: state.isFocused ? rsColors.controlBgFocused : rsColors.controlBg,
														borderColor: state.isFocused ? '#3b82f6' : rsColors.border,
														boxShadow: state.isFocused ? `0 0 0 2px ${rsColors.focusRing}` : 'none',
														color: rsColors.text,
														minHeight: '40px',
														minWidth: '200px',
														width: '100%'
													}),
													menu: (base: any) => ({ ...base, background: rsColors.menuBg, color: rsColors.text, minWidth: '220px', zIndex: 9999 }),
													menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
													option: (base: any, state: any) => ({
														...base,
														background: state.isFocused ? rsColors.optionHover : 'transparent',
														color: rsColors.text,
													}),
													multiValue: (base: any) => ({ ...base, background: rsColors.multiBg, color: rsColors.text }),
													placeholder: (base: any) => ({ ...base, color: rsColors.placeholder }),
													singleValue: (base: any) => ({ ...base, color: rsColors.text }),
												}
												}
												menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
												menuPosition="fixed" />
										</div>
										<label className="inline-flex items-center text-sm text-gray-700 dark:text-gray-200">
											<input type="checkbox" className="ml-2" checked={selectedPages.length === pagesList.length} onChange={(e) => {
												if (e.target.checked) setSelectedPages(pagesList.slice());
												else setSelectedPages([]);
											}} />
											<span className="ml-2">{tr('admin.analytics.filters.selectAll', 'all')}</span>
										</label>
									</div>
								</div>
							</div>
						)}
						<div className="md:col-span-4 grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tr('admin.analytics.filters.startDate', 'Start Date')}</label>
								<input type="date" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 [color-scheme:light] dark:[color-scheme:dark]" />
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tr('admin.analytics.filters.endDate', 'End Date')}</label>
								<input type="date" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 [color-scheme:light] dark:[color-scheme:dark]" />
							</div>
						</div>
						<div className="md:col-span-2">
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tr('admin.analytics.filters.search', 'Search')}</label>
							<div className="flex items-center">
								<input value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} placeholder={tr('admin.analytics.filters.searchPlaceholder', 'search term...')} className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
									<Tooltip title={tr('admin.analytics.filters.resetTooltip', 'Reset filters to defaults')}>
										<IconButton type="button" onClick={resetFilters} size="small" aria-label={tr('admin.analytics.filters.reset', 'Reset')} className="ml-3 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500">
											<RefreshIcon fontSize="small" />
										</IconButton>
									</Tooltip>
							</div>
						</div>
						<div className="md:col-span-12 flex flex-col md:flex-row items-end md:items-center justify-end space-y-2 md:space-y-0 md:space-x-2">
							{/* Export controls moved to table header row */}
							{/* rows count moved below filter pane so it updates with client-side filters */}
						</div>
					</div>
				)}
			</div>
			<div className="flex items-center justify-between mb-4">
				<div className="text-sm text-gray-600 dark:text-gray-300">{tr('admin.analytics.rowsCount', 'Rows: {{count}}').replace('{{count}}', String(filteredCount))}</div>
				<div className="flex items-center space-x-2">
					<select value={exportScope} onChange={(e) => setExportScope(e.target.value as 'all' | 'page')} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
						<option value="all">{tr('admin.analytics.exportAll', 'Export All')}</option>
						<option value="page">{tr('admin.analytics.exportPage', 'Export Current Page')}</option>
					</select>
					<button onClick={() => { exportFilteredCSV(exportScope === 'page'); }} className="px-3 py-2 bg-green-600 text-white rounded-md">{tr('admin.analytics.exportCSV', 'Export')}</button>
				</div>
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
								<td className="py-3 px-4 text-left text-gray-900 dark:text-gray-100 max-w-[14rem] sm:max-w-none break-words whitespace-normal">{(() => { const raw = (row.page || '').toString(); return raw === '' || raw === '/' ? 'home' : raw.replace(/^\//, ''); })()}</td>
								<td className="py-3 px-4 text-left text-gray-900 dark:text-gray-100">{row.count}</td>
							</tr>
						))}
						{displayRows.length === 0 && (
							<tr>
								<td className="py-3 px-4 text-left text-gray-900 dark:text-gray-100" colSpan={4}>{tr('admin.analytics.noResults', 'No results found')}</td>
							</tr>
						)}
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
