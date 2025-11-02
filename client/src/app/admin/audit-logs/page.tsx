'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { AuditLog, AuditLogFilters, AuditLogStats, User } from '../../../types';
import { apiClient } from '../../../lib/api';
import Link from 'next/link';
import { formatDateToYYYYMMDD, formatTimeToHHMM } from '../../../lib/dateUtils';

interface AuditLogResponse {
  auditLogs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function AuditLogsPage() {
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRefreshed, setUserRefreshed] = useState(false);
  
  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 20
  });

  // Filter form state
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Refresh user data on mount to ensure we have the latest role information
  useEffect(() => {
    const initializeUser = async () => {
      await refreshUser();
      setUserRefreshed(true);
    };
    initializeUser();
  }, []);

  useEffect(() => {
    // Don't run admin check until user data has been refreshed
    if (!userRefreshed) {
      return;
    }

    if (user?.role !== 'admin') {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }

    fetchAuditLogs();
    fetchStats();
  }, [user, filters, userRefreshed]);

  const fetchAuditLogs = async () => {
    try {
      const params: Record<string, string> = {};
      
      if (filters.page) params.page = filters.page.toString();
      if (filters.limit) params.limit = filters.limit.toString();
      if (filters.action) params.action = filters.action;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.userId) params.userId = filters.userId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const data = await apiClient.getAuditLogs(params) as AuditLogResponse;
      setAuditLogs(data.auditLogs);
      setCurrentPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError('Failed to load audit logs');
      console.error('Fetch audit logs error:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiClient.getAuditLogStats() as AuditLogStats;
      setStats(data);
    } catch (err) {
      console.error('Fetch stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      action: actionFilter ? (actionFilter as 'CREATE' | 'UPDATE' | 'DELETE') : undefined,
      entityType: entityTypeFilter || undefined,
      userId: userFilter || undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined
    });
  };

  const clearFilters = () => {
    setActionFilter('');
    setEntityTypeFilter('');
    setUserFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setFilters({ page: 1, limit: 20 });
  };

  const changePage = (page: number) => {
    setFilters({ ...filters, page });
  };

  const formatDate = (dateString: string) => {
    return formatDateToYYYYMMDD(dateString);
  };

  const formatTime = (dateString: string) => {
    return formatTimeToHHMM(dateString);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'text-green-600 bg-green-100';
      case 'UPDATE': return 'text-blue-600 bg-blue-100';
      case 'DELETE': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEntityLink = (log: AuditLog) => {
    switch (log.entityType) {
      case 'roaster':
        return `/roasters/${log.entityId}`;
      case 'user':
        return `/admin/users/${log.entityId}/edit`;
      case 'person':
        return `/admin/people/edit/${log.entityId}`;
      default:
        return '#';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading audit logs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('admin.auditLogs.title', 'Audit Logs')}
        </h1>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Logs</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalLogs.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Last 30 Days</h3>
            <p className="text-3xl font-bold text-green-600">{stats.recentLogs.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Actions</h3>
            <div className="space-y-1">
              {stats.actionStats.map((stat) => (
                <div key={stat.action} className="flex justify-between text-sm">
                  <span>{stat.action}</span>
                  <span className="font-semibold">{stat.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Entity Types</h3>
            <div className="space-y-1">
              {stats.entityTypeStats.slice(0, 3).map((stat) => (
                <div key={stat.entityType} className="flex justify-between text-sm">
                  <span className="capitalize">{stat.entityType}</span>
                  <span className="font-semibold">{stat.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Top Users</h3>
            <div className="space-y-1">
              {stats.topUsers.slice(0, 3).map((userStat) => (
                <div key={userStat.user.id} className="flex justify-between text-sm">
                  <span className="truncate">{userStat.user.username}</span>
                  <span className="font-semibold">{userStat.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
            <select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="roaster">Roaster</option>
              <option value="review">Review</option>
              <option value="bean">Bean</option>
              <option value="user">User</option>
              <option value="person">Person</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <input
              type="text"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              placeholder="User ID..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Apply
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs - Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Changes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(log.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {log.user ? (
                            <Link 
                              href={`/admin/users/${log.userId}/edit`} 
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {log.user.username}
                            </Link>
                          ) : (
                            <span className="text-gray-500 italic">Deleted User</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {log.user?.email || 'No email available'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {log.action === 'DELETE' ? (
                          <span>{log.entityType}</span>
                        ) : (
                          <Link 
                            href={getEntityLink(log)} 
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {log.entityType}
                          </Link>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {log.entityName || log.entityId}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      {log.city && log.country && log.city !== 'Unknown' && log.country !== 'Unknown' ? 
                        `${log.city}, ${log.country}` : 
                        (log.city && log.city !== 'Unknown') || (log.country && log.country !== 'Unknown') || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {log.changes && Object.keys(log.changes).length > 0 ? (
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View Changes ({Object.keys(log.changes).length})
                      </button>
                    ) : log.action === 'DELETE' ? (
                      <span className="text-sm text-gray-400">Deleted</span>
                    ) : (
                      <span className="text-sm text-gray-400">No changes</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs - Mobile Card View */}
      <div className="md:hidden space-y-4">
        {auditLogs.map((log) => (
          <div key={log.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                  <span>{formatDate(log.createdAt)}</span>
                  <span>•</span>
                  <span>{formatTime(log.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                  <span className="text-sm text-gray-600 capitalize">
                    {log.entityType}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500 font-medium">User:</span>
                {log.user ? (
                  <Link 
                    href={`/admin/users/${log.userId}/edit`} 
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {log.user.username}
                  </Link>
                ) : (
                  <span className="text-sm text-gray-500 italic">Deleted User</span>
                )}
              </div>
              
              <div className="flex justify-between">
                <span className="text-xs text-gray-500 font-medium">Entity:</span>
                {log.action === 'DELETE' ? (
                  <span className="text-sm text-gray-700 truncate max-w-[180px]">
                    {log.entityName || log.entityId}
                  </span>
                ) : (
                  <Link 
                    href={getEntityLink(log)} 
                    className="text-sm text-blue-600 hover:text-blue-800 truncate max-w-[180px]"
                  >
                    {log.entityName || log.entityId}
                  </Link>
                )}
              </div>
              
              <div className="flex justify-between">
                <span className="text-xs text-gray-500 font-medium">Location:</span>
                <span className="text-sm text-gray-700">
                  {log.city && log.country && log.city !== 'Unknown' && log.country !== 'Unknown' ? 
                    `${log.city}, ${log.country}` : 
                    (log.city && log.city !== 'Unknown') || (log.country && log.country !== 'Unknown') || 'Unknown'}
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500 font-medium">Changes:</span>
                {log.changes && Object.keys(log.changes).length > 0 ? (
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View ({Object.keys(log.changes).length})
                  </button>
                ) : log.action === 'DELETE' ? (
                  <span className="text-sm text-gray-400">Deleted</span>
                ) : (
                  <span className="text-sm text-gray-400">No changes</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => changePage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + Math.max(1, currentPage - 2);
                  if (page > totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => changePage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Changes Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white text-gray-900">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedLog.action} {selectedLog.entityType}
                </h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-gray-50 rounded">
                <div className="space-y-2 text-sm text-gray-900">
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="font-semibold">Date:</span> {formatDate(selectedLog.createdAt)}</div>
                    <div><span className="font-semibold">Time:</span> {formatTime(selectedLog.createdAt)}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                    <div><span className="font-semibold">User:</span> {selectedLog.user?.username || 'Deleted User'}</div>
                    <div><span className="font-semibold">IP Address:</span> {selectedLog.ipAddress || 'Unknown'}</div>
                  </div>
                </div>
              </div>

              {selectedLog.changes && (
                <div className="max-h-96 overflow-y-auto">
                  <h4 className="text-md font-semibold text-gray-800 mb-2">
                    {selectedLog.action === 'CREATE' ? 'Field values:' : 'Field Changes:'}
                  </h4>
                  <div className="space-y-4">
                    {Object.entries(selectedLog.changes).map(([field, change]) => {
                      // Check if the field contains long content (like URLs or images)
                      const oldStr = typeof change.old === 'object' ? JSON.stringify(change.old) : String(change.old || 'null');
                      const newStr = typeof change.new === 'object' ? JSON.stringify(change.new) : String(change.new || 'null');
                      
                      const hasLongContent = ['images', 'imageUrl', 'photos'].includes(field.toLowerCase()) || 
                        oldStr.length > 50 || 
                        newStr.length > 50 ||
                        (typeof change.old === 'object' && change.old !== null) ||
                        (typeof change.new === 'object' && change.new !== null);

                      return (
                        <div key={field} className="border rounded p-3">
                          <div className={`font-semibold text-sm mb-2 capitalize ${
                            selectedLog.action === 'CREATE' ? 'text-blue-600' : 'text-gray-700'
                          }`}>
                            {field.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          {selectedLog.action === 'CREATE' ? (
                            <div className="text-sm">
                              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-gray-900 break-all">
                                {typeof change.new === 'object' ? 
                                  JSON.stringify(change.new, null, 2) : 
                                  String(change.new || '')
                                }
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm">
                              {hasLongContent ? (
                                // Stack vertically for long content - always vertical
                                <div className="space-y-3">
                                  <div>
                                    <span className="text-red-600 font-medium block mb-1">Old Value:</span>
                                    <div className="p-2 bg-red-50 border border-red-200 rounded text-gray-900 break-all">
                                      {typeof change.old === 'object' ? 
                                        JSON.stringify(change.old, null, 2) : 
                                        String(change.old || 'null')
                                      }
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-green-600 font-medium block mb-1">New Value:</span>
                                    <div className="p-2 bg-green-50 border border-green-200 rounded text-gray-900 break-all">
                                      {typeof change.new === 'object' ? 
                                        JSON.stringify(change.new, null, 2) : 
                                        String(change.new || 'null')
                                      }
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                // Responsive layout for short content - side by side on all screen sizes for very short content
                                <div>
                                  <div className="grid grid-cols-2 gap-2 mb-1">
                                    <span className="text-red-600 font-medium">Old Value:</span>
                                    <span className="text-green-600 font-medium">New Value:</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="p-2 bg-red-50 border border-red-200 rounded text-gray-900 break-words">
                                      {typeof change.old === 'object' ? 
                                        JSON.stringify(change.old, null, 2) : 
                                        String(change.old || 'null')
                                      }
                                    </div>
                                    <div className="p-2 bg-green-50 border border-green-200 rounded text-gray-900 break-words">
                                      {typeof change.new === 'object' ? 
                                        JSON.stringify(change.new, null, 2) : 
                                        String(change.new || 'null')
                                      }
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}