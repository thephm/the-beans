
// Determine API base URL with fallback for production
const getApiBaseUrl = () => {
  // First, check for explicitly set environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // Check if we're in production environment
  if (process.env.NODE_ENV === 'production') {
    return 'https://the-beans-api.onrender.com';
  }
  // If in production and no env var set, use the Render backend URL
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    return 'https://the-beans-api.onrender.com';
  }
  // Default to localhost for development
  return 'http://localhost:5000';
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

  // ...existing code...

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
    const url = `${this.baseURL}/api${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

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

    // Handle other error status codes
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'An error occurred' }));
      const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return response.json();
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
    return this.request('/users/language', {
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

  async verifyRoaster(id: string) {
    return this.request(`/roasters/${id}/verify`, {
      method: 'PATCH',
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
}

export const apiClient = new ApiClient();
export { getApiBaseUrl };
