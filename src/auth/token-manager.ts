import type { TokenResponse } from './types.js';

export interface TokenManagerOptions {
  fetchToken: () => Promise<TokenResponse>;
  onTokenChange?: (token: TokenResponse) => void | Promise<void>;
  getStoredToken?: () => TokenResponse | null | Promise<TokenResponse | null>;
  refreshBufferSeconds?: number;
}

export class TokenManager {
  private cachedToken: TokenResponse | null = null;
  private expiresAt = 0;
  private pendingRefresh: Promise<string> | null = null;

  private readonly fetchToken: () => Promise<TokenResponse>;
  private readonly onTokenChange?: (token: TokenResponse) => void | Promise<void>;
  private readonly getStoredToken?: () => TokenResponse | null | Promise<TokenResponse | null>;
  private readonly refreshBufferMs: number;

  constructor(options: TokenManagerOptions) {
    this.fetchToken = options.fetchToken;
    this.onTokenChange = options.onTokenChange;
    this.getStoredToken = options.getStoredToken;
    this.refreshBufferMs = (options.refreshBufferSeconds ?? 60) * 1000;
  }

  async getToken(): Promise<string> {
    // Deduplicate concurrent refresh requests
    if (this.pendingRefresh) {
      return this.pendingRefresh;
    }

    if (this.isValid()) {
      return this.cachedToken!.access_token;
    }

    this.pendingRefresh = this.refresh();
    try {
      return await this.pendingRefresh;
    } finally {
      this.pendingRefresh = null;
    }
  }

  private async refresh(): Promise<string> {
    // Try loading from external storage first
    if (this.getStoredToken && !this.cachedToken) {
      const stored = await this.getStoredToken();
      if (stored) {
        this.setToken(stored);
        if (this.isValid()) {
          return this.cachedToken!.access_token;
        }
      }
    }

    const token = await this.fetchToken();
    this.setToken(token);

    if (this.onTokenChange) {
      await this.onTokenChange(token);
    }

    return token.access_token;
  }

  private setToken(token: TokenResponse): void {
    this.cachedToken = token;
    this.expiresAt = Date.now() + token.expires_in * 1000;
  }

  private isValid(): boolean {
    return (
      this.cachedToken !== null &&
      Date.now() < this.expiresAt - this.refreshBufferMs
    );
  }
}
