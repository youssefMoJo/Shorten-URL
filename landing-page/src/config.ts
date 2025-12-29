export const config = {
  cognito: {
    userPoolId: 'ca-central-1_FHqEoPqvA',
    clientId: '367rnle23g4cmjaaiq35anhjuj',
    region: 'ca-central-1'
  },
  api: {
    baseUrl: 'https://shorturl.life',
    endpoints: {
      signup: '/auth/signup',
      login: '/auth/login',
      refreshToken: '/auth/refresh-token',
      forgotPassword: '/auth/forgot-password',
      resetPassword: '/auth/reset-password',
      shorten: '/shorten',
      expand: '/expand',
      meLinks: '/me/links'
    }
  }
}
