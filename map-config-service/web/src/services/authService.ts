import type { AuthToken } from '../types/save';

export interface AuthServiceConfig {
  baseUrl: string;
  tokenStorageKey?: string;
  refreshTokenKey?: string;
  tokenRefreshThreshold?: number; // minutes before expiry to refresh
}

export class AuthService {
  private static instance: AuthService;
  private config: AuthServiceConfig;
  private refreshTimer: NodeJS.Timeout | null = null;

  private constructor(config: AuthServiceConfig) {
    this.config = {
      tokenStorageKey: 'mapconfig_auth_token',
      refreshTokenKey: 'mapconfig_refresh_token',
      tokenRefreshThreshold: 5,
      ...config
    };

    // Auto-refresh tokens on service creation
    this.scheduleTokenRefresh();
  }

  public static getInstance(config?: AuthServiceConfig): AuthService {
    if (!AuthService.instance) {
      const defaultConfig = {
        baseUrl: import.meta.env.VITE_API_BASE_URL || window.location.origin
      };
      AuthService.instance = new AuthService(config || defaultConfig);
    }
    return AuthService.instance;
  }

  /**
   * Authenticate with email and password
   */
  async login(email: string, password: string): Promise<AuthToken> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Authentication failed');
      }

      const authData = await response.json();
      const token: AuthToken = {
        token: authData.token,
        refreshToken: authData.refreshToken,
        expiresAt: authData.expiresAt || (Date.now() + (3600 * 1000)), // Default 1 hour
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: authData.user.name,
          role: authData.user.role || 'user'
        }
      };

      // Store tokens securely
      this.storeToken(token);
      this.scheduleTokenRefresh();

      return token;
    } catch (error) {
      console.error('Login error:', error);
      throw error instanceof Error ? error : new Error('Login failed');
    }
  }

  /**
   * Register a new user account
   */
  async register(userData: {
    email: string;
    password: string;
    name?: string;
  }): Promise<AuthToken> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Registration failed');
      }

      const authData = await response.json();
      const token: AuthToken = {
        token: authData.token,
        refreshToken: authData.refreshToken,
        expiresAt: authData.expiresAt || (Date.now() + (3600 * 1000)),
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: authData.user.name,
          role: authData.user.role || 'user'
        }
      };

      this.storeToken(token);
      this.scheduleTokenRefresh();

      return token;
    } catch (error) {
      console.error('Registration error:', error);
      throw error instanceof Error ? error : new Error('Registration failed');
    }
  }

  /**
   * Logout and clear stored tokens
   */
  async logout(): Promise<void> {
    const token = this.getStoredToken();
    
    if (token) {
      try {
        // Notify server of logout
        await fetch(`${this.config.baseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.warn('Logout request failed:', error);
      }
    }

    this.clearStoredTokens();
    this.clearRefreshTimer();
  }

  /**
   * Get current authentication token
   */
  getToken(): string | null {
    const storedToken = this.getStoredToken();
    if (!storedToken) return null;

    // Check if token is expired
    if (Date.now() >= storedToken.expiresAt) {
      console.warn('Token is expired');
      this.clearStoredTokens();
      return null;
    }

    return storedToken.token;
  }

  /**
   * Get current user information
   */
  getCurrentUser(): AuthToken['user'] | null {
    const storedToken = this.getStoredToken();
    if (!storedToken || Date.now() >= storedToken.expiresAt) {
      return null;
    }
    return storedToken.user;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Refresh the authentication token
   */
  async refreshToken(): Promise<AuthToken | null> {
    const storedToken = this.getStoredToken();
    if (!storedToken?.refreshToken) {
      console.warn('No refresh token available');
      return null;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: storedToken.refreshToken
        })
      });

      if (!response.ok) {
        console.warn('Token refresh failed');
        this.clearStoredTokens();
        return null;
      }

      const authData = await response.json();
      const newToken: AuthToken = {
        token: authData.token,
        refreshToken: authData.refreshToken || storedToken.refreshToken,
        expiresAt: authData.expiresAt || (Date.now() + (3600 * 1000)),
        user: authData.user || storedToken.user
      };

      this.storeToken(newToken);
      this.scheduleTokenRefresh();

      return newToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearStoredTokens();
      return null;
    }
  }

  /**
   * Store authentication token securely
   */
  private storeToken(token: AuthToken): void {
    try {
      // Store in sessionStorage for security (cleared on tab close)
      sessionStorage.setItem(this.config.tokenStorageKey!, JSON.stringify(token));
      
      // Also store in localStorage as fallback (with shorter expiry)
      const fallbackToken = {
        ...token,
        expiresAt: Math.min(token.expiresAt, Date.now() + (30 * 60 * 1000)) // Max 30 minutes
      };
      localStorage.setItem(this.config.tokenStorageKey!, JSON.stringify(fallbackToken));
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  }

  /**
   * Retrieve stored authentication token
   */
  private getStoredToken(): AuthToken | null {
    try {
      // Try sessionStorage first
      let tokenStr = sessionStorage.getItem(this.config.tokenStorageKey!);
      
      // Fallback to localStorage
      if (!tokenStr) {
        tokenStr = localStorage.getItem(this.config.tokenStorageKey!);
      }

      if (!tokenStr) return null;

      const token = JSON.parse(tokenStr) as AuthToken;
      
      // Validate token structure
      if (!token.token || !token.user) {
        console.warn('Invalid stored token structure');
        this.clearStoredTokens();
        return null;
      }

      return token;
    } catch (error) {
      console.error('Failed to retrieve stored token:', error);
      this.clearStoredTokens();
      return null;
    }
  }

  /**
   * Clear all stored tokens
   */
  private clearStoredTokens(): void {
    try {
      sessionStorage.removeItem(this.config.tokenStorageKey!);
      localStorage.removeItem(this.config.tokenStorageKey!);
      localStorage.removeItem(this.config.refreshTokenKey!);
    } catch (error) {
      console.error('Failed to clear stored tokens:', error);
    }
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleTokenRefresh(): void {
    this.clearRefreshTimer();

    const token = this.getStoredToken();
    if (!token || !token.refreshToken) return;

    const timeUntilExpiry = token.expiresAt - Date.now();
    const refreshTime = timeUntilExpiry - (this.config.tokenRefreshThreshold! * 60 * 1000);

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(async () => {
        try {
          await this.refreshToken();
        } catch (error) {
          console.error('Automatic token refresh failed:', error);
        }
      }, refreshTime);
    }
  }

  /**
   * Clear the refresh timer
   */
  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Verify token with server
   */
  async verifyToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${this.config.baseUrl}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        this.clearStoredTokens();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }
}

/**
 * Convenience function to get the auth service instance
 */
export function useAuthService(): AuthService {
  return AuthService.getInstance();
}