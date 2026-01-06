"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { SortArrow } from '@/components/SortArrow';
import { formatDateToYYYYMMDD } from '@/lib/dateUtils';

interface Post {
  id: string;
  roasterId: string;
  url: string;
  socialNetwork: string;
  postedAt: string;
  createdAt: string;
  updatedAt: string;
  roaster: {
    id: string;
    name: string;
    city: string;
    state?: string;
    country: string;
  };
}

interface Roaster {
  id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
}

const AdminPostsPage: React.FC = () => {
  const { t } = useTranslation();
  
  // Helper function to format date for datetime-local input in local timezone
  const formatLocalDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [socialNetworkFilter, setSocialNetworkFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState({
    roasterId: '',
    url: '',
    postedAt: formatLocalDateTime(new Date())
  });

  // Roaster search
  const [roasterSearchTerm, setRoasterSearchTerm] = useState('');
  const [roasterResults, setRoasterResults] = useState<Roaster[]>([]);
  const [showRoasterResults, setShowRoasterResults] = useState(false);
  const [selectedRoaster, setSelectedRoaster] = useState<Roaster | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      if (sortConfig) {
        params.append('sortBy', sortConfig.key);
        params.append('sortOrder', sortConfig.direction);
      }
      
      const res = await fetch(`${apiUrl}/api/posts?${params.toString()}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      
      if (data.posts && data.pagination) {
        setPosts(data.posts);
        setFilteredPosts(data.posts);
        setTotalPages(data.pagination.pages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Search roasters
  const searchRoasters = async (term: string) => {
    if (term.length < 2) {
      setRoasterResults([]);
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${apiUrl}/api/roasters?search=${encodeURIComponent(term)}&limit=10`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      if (!res.ok) throw new Error('Failed to search roasters');
      const data = await res.json();
      setRoasterResults(data.roasters || data || []);
      setShowRoasterResults(true);
    } catch (err) {
      console.error('Error searching roasters:', err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentPage, sortConfig]);

  useEffect(() => {
    let filtered = posts;
    
    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(post => 
        post.roaster.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.socialNetwork?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply social network filter
    if (socialNetworkFilter !== 'all') {
      filtered = filtered.filter(post => {
        const network = post.socialNetwork?.toLowerCase() || '';
        if (socialNetworkFilter === 'instagram') {
          return network === 'instagram';
        } else if (socialNetworkFilter === 'reddit') {
          return network === 'reddit';
        } else if (socialNetworkFilter === 'other') {
          return network !== 'instagram' && network !== 'reddit';
        }
        return true;
      });
    }
    
    setFilteredPosts(filtered);
  }, [searchTerm, socialNetworkFilter, posts]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (roasterSearchTerm) {
        searchRoasters(roasterSearchTerm);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [roasterSearchTerm]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.posts.confirmDelete', 'Are you sure you want to delete this post?'))) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${apiUrl}/api/posts/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error('Failed to delete post');
      
      fetchPosts();
    } catch (err: any) {
      alert(t('admin.posts.deleteError', 'Failed to delete post: ') + err.message);
    }
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setSelectedRoaster(post.roaster);
    setFormData({
      roasterId: post.roasterId,
      url: post.url,
      postedAt: formatLocalDateTime(new Date(post.postedAt))
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRoaster) {
      alert(t('admin.posts.selectRoaster', 'Please select a roaster'));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      const payload = {
        roasterId: selectedRoaster.id,
        url: formData.url,
        postedAt: formData.postedAt
      };

      const url = editingPost 
        ? `${apiUrl}/api/posts/${editingPost.id}`
        : `${apiUrl}/api/posts`;

      const res = await fetch(url, {
        method: editingPost ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save post');
      }

      // Reset form
      setShowForm(false);
      setEditingPost(null);
      setSelectedRoaster(null);
      setFormData({
        roasterId: '',
        url: '',
        postedAt: formatLocalDateTime(new Date())
      });
      setRoasterSearchTerm('');

      fetchPosts();
    } catch (err: any) {
      alert(t('admin.posts.saveError', 'Failed to save post: ') + err.message);
    }
  };

  const selectRoaster = (roaster: Roaster) => {
    setSelectedRoaster(roaster);
    setFormData({ ...formData, roasterId: roaster.id });
    setRoasterSearchTerm(roaster.name);
    setShowRoasterResults(false);
  };

  return (
    <div className="container mx-auto pt-20 sm:pt-28 px-4 sm:px-8 lg:px-16 xl:px-32 pb-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        {t('admin.posts.title', 'Social Posts')}
      </h1>

      {/* Form */}
      {showForm && (
        <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {editingPost ? t('admin.posts.editPost', 'Edit Post') : t('admin.posts.newPost', 'New Post')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_auto] gap-4 items-end">
            {/* Roaster Search */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('admin.posts.roaster', 'Roaster')} *
              </label>
              <input
                type="text"
                value={roasterSearchTerm}
                onChange={(e) => {
                  setRoasterSearchTerm(e.target.value);
                  if (!e.target.value) {
                    setSelectedRoaster(null);
                    setShowRoasterResults(false);
                  }
                }}
                onFocus={() => {
                  if (roasterResults.length > 0) {
                    setShowRoasterResults(true);
                  }
                }}
                placeholder={t('admin.posts.searchRoaster', 'Search for a roaster...')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
              {selectedRoaster && (
                <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                  ✓ {selectedRoaster.name} - {selectedRoaster.city}, {selectedRoaster.state || selectedRoaster.country}
                </div>
              )}
              {showRoasterResults && roasterResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {roasterResults.map((roaster) => (
                    <button
                      key={roaster.id}
                      type="button"
                      onClick={() => selectRoaster(roaster)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{roaster.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {roaster.city}, {roaster.state || roaster.country}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('admin.posts.url', 'URL')} *
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://instagram.com/p/..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>

            {/* Posted At */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('admin.posts.postedAt', 'Posted At')} *
              </label>
              <input
                type="datetime-local"
                value={formData.postedAt}
                onChange={(e) => setFormData({ ...formData, postedAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            
            {/* Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingPost(null);
                  setSelectedRoaster(null);
                  setFormData({
                    roasterId: '',
                    url: '',
                    postedAt: formatLocalDateTime(new Date())
                  });
                  setRoasterSearchTerm('');
                }}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
              >
                {t('admin.posts.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                {editingPost ? t('admin.posts.update', 'Update') : t('admin.posts.save', 'Save')}
              </button>
            </div>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="w-full sm:w-80">
            <input
              type="text"
              placeholder={t('admin.posts.search', 'Search posts...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSocialNetworkFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              socialNetworkFilter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('admin.posts.all', 'All')}
          </button>
          <button
            onClick={() => setSocialNetworkFilter('instagram')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              socialNetworkFilter === 'instagram'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('admin.posts.instagram', 'Instagram')}
          </button>
          <button
            onClick={() => setSocialNetworkFilter('reddit')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              socialNetworkFilter === 'reddit'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('admin.posts.reddit', 'Reddit')}
          </button>
          <button
            onClick={() => setSocialNetworkFilter('other')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              socialNetworkFilter === 'other'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('admin.posts.other', 'Other')}
          </button>
          </div>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditingPost(null);
              setSelectedRoaster(null);
              setFormData({
                roasterId: '',
                url: '',
                postedAt: formatLocalDateTime(new Date())
              });
              setRoasterSearchTerm('');
            }
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
        >
          {showForm ? t('admin.posts.cancel', 'Cancel') : t('common.add', 'Add')}
        </button>
      </div>

      {/* Loading/Error States */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-100 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th 
                    onClick={() => handleSort('roaster')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {t('admin.posts.roaster', 'Roaster')}
                    {sortConfig?.key === 'roaster' && <SortArrow direction={sortConfig.direction} />}
                  </th>
                  <th 
                    onClick={() => handleSort('socialNetwork')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {t('admin.posts.network', 'Network')}
                    {sortConfig?.key === 'socialNetwork' && <SortArrow direction={sortConfig.direction} />}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('admin.posts.url', 'URL')}
                  </th>
                  <th 
                    onClick={() => handleSort('postedAt')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {t('admin.posts.postedAt', 'Posted At')}
                    {sortConfig?.key === 'postedAt' && <SortArrow direction={sortConfig.direction} />}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('admin.posts.actions', 'Actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        href={`/admin/roasters/edit/${post.roaster.id}`}
                        className="text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        {post.roaster.name}
                      </Link>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {post.roaster.city}, {post.roaster.state || post.roaster.country}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        post.socialNetwork === 'Instagram' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' :
                        post.socialNetwork === 'Reddit' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        post.socialNetwork === 'Facebook' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        post.socialNetwork === 'Twitter' ? 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {post.socialNetwork}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a 
                        href={post.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary-600 dark:text-primary-400 hover:underline text-sm truncate max-w-xs block"
                      >
                        {post.url.length > 50 ? post.url.substring(0, 50) + '...' : post.url}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatDateToYYYYMMDD(post.postedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(post)}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 mr-4"
                      >
                        {t('admin.posts.edit', 'Edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      >
                        {t('admin.posts.delete', 'Delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {t('admin.posts.previous', 'Previous')}
              </button>
              <span className="px-4 py-2 text-gray-900 dark:text-white">
                {t('admin.posts.page', 'Page')} {currentPage} {t('admin.posts.of', 'of')} {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {t('admin.posts.next', 'Next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPostsPage;
