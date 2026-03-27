import type { AuthStrategy } from '../auth/types.js';
import type { TokenResponse } from '../auth/types.js';

export interface AprimoClientOptions {
  tenant: string;
  auth: AuthStrategy;
  fetchImpl?: typeof fetch;
  userAgent?: string;
  maxRetries?: number;
  onTokenChange?: (token: TokenResponse) => void | Promise<void>;
  getStoredToken?: () => TokenResponse | null | Promise<TokenResponse | null>;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
  body?: unknown;
}
