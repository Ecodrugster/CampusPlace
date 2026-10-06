const API_BASE = '/api';

const AUTH_SKIP_REFRESH = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
];

function parseErrorPayload(errorData) {
  let errorMsg = 'Произошла ошибка при обращении к серверу';
  if (typeof errorData === 'string') {
    errorMsg = errorData;
  } else if (errorData?.detail) {
    errorMsg = Array.isArray(errorData.detail) ? errorData.detail[0] : errorData.detail;
  } else if (Array.isArray(errorData?.non_field_errors) && errorData.non_field_errors.length) {
    errorMsg = errorData.non_field_errors[0];
  } else if (errorData && typeof errorData === 'object') {
    const first = Object.values(errorData).flat().find(Boolean);
    if (first) errorMsg = typeof first === 'string' ? first : String(first);
  }
  return errorMsg;
}

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

  getRefreshToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('cp_refresh');
  },
  setRefreshToken: (token) => {
    if (typeof window !== 'undefined') localStorage.setItem('cp_refresh', token);
  },
  removeRefreshToken: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('cp_refresh');
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

  _storeSession(res) {
    if (res.access_token) this.setAuthToken(res.access_token);
    if (res.refresh_token) this.setRefreshToken(res.refresh_token);
    if (res.user) this.setCurrentUser(res.user);
  },

  async tryRefresh() {
    const refresh = this.getRefreshToken();
    if (!refresh) return false;
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (!response.ok) return false;
      const data = await response.json();
      if (!data.access) return false;
      this.setAuthToken(data.access);
      if (data.refresh) this.setRefreshToken(data.refresh);
      return true;
    } catch {
      return false;
    }
  },

  async request(endpoint, options = {}, retried = false) {
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
      const canRefresh =
        response.status === 401 &&
        !retried &&
        !AUTH_SKIP_REFRESH.some((path) => endpoint.startsWith(path));

      if (canRefresh) {
        const refreshed = await this.tryRefresh();
        if (refreshed) {
          return this.request(endpoint, options, true);
        }
        this.clearSession();
      } else if (response.status === 401) {
        this.clearSession();
      }

      let errorMsg = 'Произошла ошибка при обращении к серверу';
      try {
        const errorData = await response.json();
        errorMsg = parseErrorPayload(errorData);
      } catch {
        // ignore
      }
      throw new Error(errorMsg);
    }

    if (response.status === 204) return null;
    return response.json();
  },

  clearSession() {
    this.removeAuthToken();
    this.removeRefreshToken();
    this.removeCurrentUser();
  },

  // Auth
  async register(data) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    this._storeSession(res);
    return res;
  },

  async login(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this._storeSession(res);
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

  async logout() {
    const refresh = this.getRefreshToken();
    if (refresh) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        });
      } catch {
        // ignore network errors on logout
      }
    }
    this.clearSession();
  },

  // Chat
  async getConversations() {
    return this.request('/conversations');
  },

  async getUnreadTotal() {
    return this.request('/conversations/unread-total');
  },

  async startConversation(productId) {
    return this.request('/conversations', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId })
    });
  },

  async getMessages(conversationId) {
    return this.request(`/conversations/${conversationId}/messages`);
  },

  async updateDealStatus(conversationId, status) {
    return this.request(`/conversations/${conversationId}/deal-status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  },

  async getSeller(sellerId) {
    return this.request(`/sellers/${sellerId}`);
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
    if (params.university) query.append('university', params.university);
    if (params.dormitory) query.append('dormitory', params.dormitory);
    if (params.sort) query.append('sort', params.sort);
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);

    return this.request(`/products?${query.toString()}`);
  },

  async getCampusMeta() {
    return this.request('/meta/campuses');
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
  },

  // Reviews & Ratings
  async getSellerReviews(sellerId) {
    return this.request(`/sellers/${sellerId}/reviews`);
  },

  async createReview({ productId, rating, comment }) {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        product: productId,
        rating,
        comment
      })
    });
  },

  // Reports & Moderation
  async createReport({ productId, reason, comment }) {
    return this.request('/reports', {
      method: 'POST',
      body: JSON.stringify({
        product: productId,
        reason,
        comment: comment || ''
      })
    });
  },

  async getModerationReports(status = 'pending') {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '?status=all';
    return this.request(`/moderation/reports${query}`);
  },

  async resolveModerationReport(reportId, action) {
    return this.request(`/moderation/reports/${reportId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ action })
    });
  },

  // Email verification
  async sendVerificationCode() {
    return this.request('/auth/verify/send', { method: 'POST' });
  },

  async confirmVerificationCode(code) {
    const res = await this.request('/auth/verify/confirm', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
    if (res.user) this.setCurrentUser(res.user);
    return res;
  }
};
