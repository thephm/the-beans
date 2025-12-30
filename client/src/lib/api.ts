import { CreateRoasterFromSuggestionResponse } from '../types';


// Determine API base URL with fallback for production
const getApiBaseUrl = () => {
  // Determine base URL with precedence: env var -> production -> defaults
  let url: string;

  if (process.env.NEXT_PUBLIC_API_URL) {
    url = process.env.NEXT_PUBLIC_API_URL;
    // If running SSR inside Docker and env var points to localhost,
    // rewrite to the backend service hostname so container-to-container
    // networking works.
    if (typeof window === 'undefined' && url.includes('localhost')) {
      return url.replace('localhost', 'server');
    }
    return url;
  }

  if (process.env.NODE_ENV === 'production') {
    url = 'https://the-beans-api.onrender.com';
    return url;
  }

  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    url = 'https://the-beans-api.onrender.com';
    return url;
  }

  // Default to localhost for development, but when executing server-side
  // (Next SSR in Docker), localhost refers to the container itself —
  // rewrite to the backend service host so server-side requests reach
  // the backend container.
  url = 'http://localhost:5000';
  if (typeof window === 'undefined' && url.includes('localhost')) {
    return url.replace('localhost', 'server');
  }
  return url;
};

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  // Analytics event tracking

  async trackEvent(eventType: string, eventData?: any) {
    let sessionId = '';
    if (typeof window !== 'undefined') {
      sessionId = sessionStorage.getItem('analyticsSessionId') || '';
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        sessionStorage.setItem('analyticsSessionId', sessionId);
      }
    }
    // Fire-and-forget analytics to avoid crashing the UI when backend is down.
    try {
      const url = `${this.baseURL}/api/analytics`;
      const payload = JSON.stringify({ eventType, eventData, sessionId });
      // Prefer sendBeacon for reliability, fall back to fetch without awaiting
      if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
        try {
          navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
          return;
        } catch (_) {
          /* ignore and fall back to fetch */
        }
      }
      // Fire-and-forget fetch; intentionally not awaited and errors are swallowed
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}) },
        body: payload,
      }).catch(() => {});
    } catch (_) {
      // Swallow any client-side errors to keep UI stable
    }
    return;
  }

  // ...existing code...

  async updateRoaster(id: string, roasterData: any) {
    return this.request(`/roasters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roasterData),
    });
  }

  // People (contacts/CRM)
  async getPeople(params?: Record<string, any>) {
    const searchParams = params ? new URLSearchParams(params).toString() : '';
    const endpoint = searchParams ? `/people?${searchParams}` : '/people';
    return this.request(endpoint);
  }

  async getPeopleForRoaster(roasterId: string) {
    return this.request(`/people/roaster/${roasterId}`);
  }

  async getPerson(id: string) {
    return this.request(`/people/${id}`);
  }

  async getPeopleByEmail(email: string) {
    return this.request(`/people/email/${encodeURIComponent(email)}`);
  }

  async createPerson(personData: any) {
    return this.request('/people', {
      method: 'POST',
      body: JSON.stringify(personData),
    });
  }

  async updatePerson(id: string, personData: any) {
    return this.request(`/people/${id}`, {
      method: 'PUT',
      body: JSON.stringify(personData),
    });
  }

  async deletePerson(id: string) {
    return this.request(`/people/${id}`, {
      method: 'DELETE',
    });
  }
  // ...existing code...

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Only prefix /api if endpoint does not already start with /api
    const url = endpoint.startsWith('/api')
      ? `${this.baseURL}${endpoint}`
      : `${this.baseURL}/api${endpoint}`;
    
    // Always get fresh token from localStorage
    const currentToken = typeof window !== 'undefined' ? localStorage.getItem('token') : this.token;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (currentToken) {
      headers.Authorization = `Bearer ${currentToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
      // Unauthorized: clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      throw new Error('HTTP 401: Unauthorized');
    }

    if (response.status === 403) {
      // Forbidden: Access denied
      throw new Error('HTTP 403: Forbidden');
    }

    // Handle other error status codes
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'An error occurred' }));
      const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }
      return response.json();
    } catch (err: any) {
      // Log helpful debugging info for both browser and SSR (server-side)
      // eslint-disable-next-line no-console
      console.error('ApiClient fetch error:', { url, options, err });

      const message = err?.message || String(err);

      // If this error is the server-provided message (thrown above when response.ok === false),
      // preserve it so UI can show the exact server validation text (e.g. duplicate name).
      // Only treat as a network failure for low-level fetch/network problems.
      if (message && !message.includes('Failed to fetch') && !message.includes('NetworkError')) {
        throw new Error(message);
      }

      throw new Error(`Network error contacting ${url}: ${message}`);
    }

  }
  // Authentication
  
  async register(userData: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: { email: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async updateProfile(profileData: { email?: string; username?: string }) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // User settings
  async getUserSettings() {
    return this.request('/users/settings');
  }

  async updateUserSettings(settings: any) {
    return this.request('/users/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async updateUserLanguage(language: string) {
    // Use the auth profile endpoint to update the authenticated user's language
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ language }),
    });
  }

  // Roasters
  async getRoasters(params?: Record<string, any>) {
    const searchParams = new URLSearchParams(params).toString();
    const endpoint = searchParams ? `/roasters?${searchParams}` : '/roasters';
    return this.request(endpoint);
  }

  async checkRoasterDomain(domain: string) {
    const params = new URLSearchParams({ domain }).toString();
    return this.request(`/roasters/domain-exists?${params}`);
  }

  async getRoaster(id: string) {
    return this.request(`/roasters/${id}`);
  }

  async getRoasterImages(id: string) {
    return this.request(`/roasters/${id}/images`);
  }

  async createRoaster(roasterData: any) {
    return this.request('/roasters', {
      method: 'POST',
      body: JSON.stringify(roasterData),
    });
  }

  // Admin roaster methods
  async getUnverifiedRoasters(params?: Record<string, any>) {
    const searchParams = new URLSearchParams(params).toString();
    const endpoint = searchParams ? `/roasters/admin/unverified?${searchParams}` : '/roasters/admin/unverified';
    return this.request(endpoint);
  }

  async verifyRoaster(id: string, postToReddit?: boolean) {
    const options: any = { method: 'PATCH' };
    if (postToReddit) {
      options.body = JSON.stringify({ postToReddit: true });
    }
    return this.request(`/roasters/${id}/verify`, options);
  }

  async postRoasterToReddit(id: string) {
    return this.request(`/roasters/${id}/post-to-reddit`, {
      method: 'POST',
    });
  }

  // Search
  async search(params: Record<string, any>) {
    const searchParams = new URLSearchParams(params).toString();
    return this.request(`/search?${searchParams}`);
  }

  async getPopularSearches(limit?: number) {
    const params = limit ? `?limit=${limit}` : '';
    return this.request(`/search/popular${params}`);
  }

  async searchRoasters(params: Record<string, any>) {
    const searchParams = new URLSearchParams(params).toString();
    return this.request(`/search/roasters?${searchParams}`);
  }

  // Reviews
  async getReviews(params?: Record<string, any>) {
    const searchParams = new URLSearchParams(params).toString();
    const endpoint = searchParams ? `/reviews?${searchParams}` : '/reviews';
    return this.request(endpoint);
  }

  async createReview(reviewData: any) {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  // Admin audit logs methods
  async getAuditLogs(params?: Record<string, any>) {
    const searchParams = params ? new URLSearchParams(params).toString() : '';
    const endpoint = searchParams ? `/admin/audit-logs?${searchParams}` : '/admin/audit-logs';
    return this.request(endpoint);
  }

  async getAuditLogStats() {
    return this.request('/admin/audit-logs/stats');
  }

  async getAuditLogById(id: string) {
    return this.request(`/admin/audit-logs/${id}`);
  }

  // Admin analytics
  async getAdminAnalyticsStats(params?: Record<string, any>) {
    const sp = new URLSearchParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null) continue;
        if (Array.isArray(v)) {
          v.forEach((item) => sp.append(k, String(item)));
        } else {
          sp.append(k, String(v));
        }
      }
    }
    const searchParams = sp.toString() ? `?${sp.toString()}` : '';
    return this.request(`/admin/analytics/stats${searchParams}`);
  }

  // Favorites methods
  async getFavorites() {
    return this.request('/favorites');
  }

  async addFavorite(roasterId: string) {
    return this.request(`/favorites/${roasterId}`, {
      method: 'POST',
    });
  }

  async removeFavorite(roasterId: string) {
    return this.request(`/favorites/${roasterId}`, {
      method: 'DELETE',
    });
  }

  // Suggestions methods
  async getSuggestions(status?: string) {
    const endpoint = status ? `/suggestions?status=${status}` : '/suggestions';
    return this.request(endpoint);
  }

  async updateSuggestion(id: string, data: { 
    status: string; 
    adminNotes?: string;
    roasterName?: string;
    city?: string;
    state?: string;
    country?: string;
    website?: string;
    submitterFirstName?: string;
    submitterLastName?: string;
    submitterEmail?: string;
    submitterRole?: string;
  }) {
    return this.request(`/suggestions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async createRoasterFromSuggestion(id: string): Promise<CreateRoasterFromSuggestionResponse> {
    return this.request(`/suggestions/${id}/create-roaster`, {
      method: 'POST',
    }) as Promise<CreateRoasterFromSuggestionResponse>;
  }
}

export const apiClient = new ApiClient();
export { getApiBaseUrl };
