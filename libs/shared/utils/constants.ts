export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout'
  },
  TENANTS: {
    GET_BY_SLUG: (slug: string) => `/tenants/${slug}`,
    LIST: '/tenants',
    CREATE: '/tenants'
  },
  CLAIMS: {
    LIST: '/claims',
    CREATE: '/claims',
    GET: (id: number) => `/claims/${id}`,
    UPDATE: (id: number) => `/claims/${id}`
  }
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  TENANT_CACHE: 'tenant_cache_v1',
  USER_PREFERENCES: 'user_prefs'
};
