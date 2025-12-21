export const config = {
  cognito: {
    userPoolId: 'ca-central-1_XTnOHGP3K',
    clientId: '22an9mv4k84jl5latoi3qkkgpp',
    region: 'ca-central-1'
  },
  api: {
    baseUrl: 'https://kb5qj23lyl.execute-api.ca-central-1.amazonaws.com/dev',
    endpoints: {
      signup: '/auth/signup',
      login: '/auth/login',
      shorten: '/shorten',
      expand: '/expand',
      meLinks: '/me/links'
    }
  }
}
