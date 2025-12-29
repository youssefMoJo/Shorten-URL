// API Configuration - PRODUCTION ENVIRONMENT
const CONFIG = {
  api: {
    baseUrl: 'https://shorturl.life',
    endpoints: {
      signup: '/auth/signup',
      login: '/auth/login',
      refreshToken: '/auth/refresh-token',
      shorten: '/shorten',
      meLinks: '/me/links'
    }
  },
  website: {
    url: 'https://shorturl.life',
    dashboardUrl: 'https://shorturl.life/dashboard'
  },
  tokenExpiryBuffer: 30000, // 30 seconds before actual expiry
  maxHistoryItems: 10
};
