// Determine API base URL with fallback for production
const getApiBaseUrl = () => {
  console.log('🔧 API Client Configuration:');
  console.log('  NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  console.log('  NODE_ENV:', process.env.NODE_ENV);
  console.log('  window exists:', typeof window !== 'undefined');
  if (typeof window !== 'undefined') {
    console.log('  hostname:', window.location.hostname);
  }
  
  // First, check for explicitly set environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    console.log('  ✅ Using NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Check if we're in production environment
  if (process.env.NODE_ENV === 'production') {
    console.log('  ✅ Using production URL: https://the-beans-api.onrender.com');
    return 'https://the-beans-api.onrender.com';
  }
  
  // If in production and no env var set, use the Render backend URL
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    console.log('  ✅ Using Render URL based on hostname: https://the-beans-api.onrender.com');
    return 'https://the-beans-api.onrender.com';
  }
  
  // Default to localhost for development
  console.log('  ✅ Using localhost for development: http://localhost:5000');
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();
console.log('🚀 Final API_BASE_URL:', API_BASE_URL);

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
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
}

export const apiClient = new ApiClient();
export { getApiBaseUrl };
