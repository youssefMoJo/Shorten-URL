// Authentication Module for Extension

class Auth {
  constructor() {
    // Check if chrome.storage is available (extension context)
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      this.storage = chrome.storage.local;
    } else {
      console.error('Chrome storage API not available. Make sure this is running as a Chrome extension.');
      this.storage = null;
    }
  }

  // Get authentication state
  async getAuthState() {
    if (!this.storage) {
      return {
        isAuthenticated: false,
        user: null,
        idToken: null,
        refreshToken: null,
        tokenExpiryTime: null
      };
    }

    return new Promise((resolve) => {
      this.storage.get(['user', 'idToken', 'refreshToken', 'tokenExpiryTime'], (data) => {
        const isAuthenticated = !!(data.user && data.idToken && data.refreshToken);
        resolve({
          isAuthenticated,
          user: data.user || null,
          idToken: data.idToken || null,
          refreshToken: data.refreshToken || null,
          tokenExpiryTime: data.tokenExpiryTime || null
        });
      });
    });
  }

  // Check if token is about to expire
  async isTokenExpiring() {
    const { tokenExpiryTime } = await this.getAuthState();
    if (!tokenExpiryTime) return true;

    const currentTime = Date.now();
    const timeRemaining = tokenExpiryTime - currentTime;

    // Token expires in less than 30 seconds
    return timeRemaining < CONFIG.tokenExpiryBuffer;
  }

  // Refresh access token
  async refreshAccessToken() {
    const { refreshToken } = await this.getAuthState();

    if (!refreshToken) {
      await this.logout();
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${CONFIG.api.baseUrl}${CONFIG.api.endpoints.refreshToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        await this.logout();
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      // Calculate new expiry time
      const expiryTime = Date.now() + (data.tokens.expiresIn * 1000);

      // Update tokens in storage
      await this.updateTokens({
        idToken: data.tokens.idToken,
        accessToken: data.tokens.accessToken,
        tokenExpiryTime: expiryTime
      });

      return data.tokens.idToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      await this.logout();
      throw error;
    }
  }

  // Get valid ID token (auto-refresh if needed)
  async getIdToken() {
    const { idToken } = await this.getAuthState();

    if (!idToken) {
      return null;
    }

    // Check if token is expiring soon
    if (await this.isTokenExpiring()) {
      console.log('Token expiring soon, refreshing...');
      try {
        return await this.refreshAccessToken();
      } catch (error) {
        console.error('Failed to refresh token:', error);
        return null;
      }
    }

    return idToken;
  }

  // Login user
  async login(email, password) {
    try {
      const response = await fetch(`${CONFIG.api.baseUrl}${CONFIG.api.endpoints.login}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Login failed');
      }

      const data = await response.json();

      // Calculate token expiry time
      const expiryTime = Date.now() + (data.tokens.expiresIn * 1000);

      // Store auth data
      await this.storage.set({
        user: {
          userId: data.userId,
          email: data.email
        },
        idToken: data.tokens.idToken,
        accessToken: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken,
        tokenExpiryTime: expiryTime
      });

      return {
        success: true,
        user: {
          userId: data.userId,
          email: data.email
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Signup user
  async signup(email, password) {
    try {
      const response = await fetch(`${CONFIG.api.baseUrl}${CONFIG.api.endpoints.signup}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Signup failed');
      }

      const data = await response.json();

      return {
        success: true,
        requiresVerification: true,
        email: data.email
      };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  // Update tokens in storage
  async updateTokens(tokens) {
    if (!this.storage) {
      console.warn('Storage not available');
      return;
    }
    return new Promise((resolve) => {
      this.storage.set(tokens, resolve);
    });
  }

  // Logout user
  async logout() {
    if (!this.storage) {
      console.warn('Storage not available');
      return;
    }
    return new Promise((resolve) => {
      this.storage.remove(['user', 'idToken', 'accessToken', 'refreshToken', 'tokenExpiryTime'], resolve);
    });
  }
}

// Create singleton instance
const auth = new Auth();
