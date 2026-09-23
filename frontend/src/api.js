const API_BASE = '/api';

export const api = {
  getAuthToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('cp_token');
  },
  setAuthToken: (token) => {
    if (typeof window !== 'undefined') localStorage.setItem('cp_token', token);
  },
  removeAuthToken: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('cp_token');
  },

  getCurrentUser: () => {
    if (typeof window === 'undefined') return null;
    try {
      const u = localStorage.getItem('cp_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setCurrentUser: (user) => {
    if (typeof window !== 'undefined') localStorage.setItem('cp_user', JSON.stringify(user));
  },
  removeCurrentUser: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('cp_user');
  },

  async request(endpoint, options = {}) {
    const headers = { ...options.headers };
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      let errorMsg = 'Произошла ошибка при обращении к серверу';
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || errorMsg;
      } catch {
        // ignore
      }
      throw new Error(errorMsg);
    }

    return response.json();
  },

  // Auth
  async register(data) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res.access_token) {
      this.setAuthToken(res.access_token);
      this.setCurrentUser(res.user);
    }
    return res;
  },

  async login(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.access_token) {
      this.setAuthToken(res.access_token);
      this.setCurrentUser(res.user);
    }
    return res;
  },

  async getMe() {
    const user = await this.request('/auth/me');
    this.setCurrentUser(user);
    return user;
  },

  async updateProfile(profileData) {
    const user = await this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    this.setCurrentUser(user);
    return user;
  },

  logout() {
    this.removeAuthToken();
    this.removeCurrentUser();
  },

  // Products
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'Все') query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.min_price) query.append('min_price', params.min_price);
    if (params.max_price) query.append('max_price', params.max_price);
    if (params.seller_id) query.append('seller_id', params.seller_id);
    if (params.verified_only) query.append('verified_only', 'true');
    if (params.status_filter) query.append('status_filter', params.status_filter);

    return this.request(`/products?${query.toString()}`);
  },

  async getProduct(id) {
    return this.request(`/products/${id}`);
  },

  async createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  async updateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  },

  async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE'
    });
  },

  async uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/products/upload', {
      method: 'POST',
      body: formData
    });
  },

  // Favorites
  async getFavorites() {
    return this.request('/favorites');
  },

  async toggleFavorite(productId) {
    return this.request(`/favorites/${productId}`, {
      method: 'POST'
    });
  }
};
