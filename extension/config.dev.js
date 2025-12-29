// API Configuration - DEV ENVIRONMENT
const CONFIG = {
  api: {
    baseUrl: 'https://dev.shorturl.life',
    endpoints: {
      signup: '/auth/signup',
      login: '/auth/login',
      refreshToken: '/auth/refresh-token',
      shorten: '/shorten',
      meLinks: '/me/links'
    }
  },
  website: {
    url: 'https://dev.shorturl.life',
    dashboardUrl: 'https://dev.shorturl.life/dashboard'
  },
  tokenExpiryBuffer: 30000, // 30 seconds before actual expiry
  maxHistoryItems: 10
};
