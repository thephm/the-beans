const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

  // Search
  async search(params: Record<string, any>) {
    const searchParams = new URLSearchParams(params).toString();
    return this.request(`/search?${searchParams}`);
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
