import { AprimoApiError } from './errors.js';
import type { ApiResult } from './types/common.js';
import type { RequestOptions } from './types/api.js';

export interface HttpClientOptions {
  baseUrl: string;
  tokenProvider: () => Promise<string>;
  fetchImpl?: typeof fetch;
  userAgent?: string;
  maxRetries?: number;
  retryDelayMs?: number;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly tokenProvider: () => Promise<string>;
  private readonly fetchImpl: typeof fetch;
  private readonly userAgent: string;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.tokenProvider = options.tokenProvider;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
    this.userAgent = options.userAgent ?? 'aprimo-dam-connector';
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelayMs = options.retryDelayMs ?? 500;
  }

  async get<T>(path: string, options?: RequestOptions): Promise<ApiResult<T>> {
    return this.request<T>('GET', path, options);
  }

  async post<T>(path: string, options?: RequestOptions): Promise<ApiResult<T>> {
    return this.request<T>('POST', path, options);
  }

  async put<T>(path: string, options?: RequestOptions): Promise<ApiResult<T>> {
    return this.request<T>('PUT', path, options);
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<ApiResult<T>> {
    return this.request<T>('DELETE', path, options);
  }

  async request<T>(
    method: string,
    path: string,
    options?: RequestOptions,
  ): Promise<ApiResult<T>> {
    const url = this.buildUrl(path, options?.params);
    const token = await this.tokenProvider();

    const headers: Record<string, string> = {
      'API-VERSION': '1',
      'Accept': 'application/hal+json',
      'Authorization': `Bearer ${token}`,
      'User-Agent': this.userAgent,
      ...options?.headers,
    };

    let body: BodyInit | undefined;
    if (options?.body !== undefined) {
      if (options.body instanceof FormData) {
        body = options.body;
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(options.body);
      }
    }

    let lastRetryAfter: string | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = this.getRetryDelay(attempt, lastRetryAfter);
        await this.sleep(delay);
      }

      try {
        const response = await this.fetchImpl(url, {
          method,
          headers,
          body,
          signal: options?.signal,
        });

        if (response.ok) {
          if (response.status === 204) {
            return { ok: true, status: response.status, data: undefined as T };
          }
          const data = await response.json() as T;
          return { ok: true, status: response.status, data };
        }

        if (this.isRetryable(response.status) && attempt < this.maxRetries) {
          lastRetryAfter = response.headers.get('Retry-After');
          continue;
        }

        return this.parseErrorResponse(response);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw err;
        }
        if (attempt < this.maxRetries) {
          lastRetryAfter = null;
          continue;
        }
        throw err;
      }
    }

    throw new Error('Max retries exceeded');
  }

  /** Make a raw fetch request with auth headers but no JSON parsing. */
  async rawRequest(
    method: string,
    url: string,
    options?: {
      headers?: Record<string, string>;
      body?: BodyInit;
      signal?: AbortSignal;
    },
  ): Promise<Response> {
    const token = await this.tokenProvider();
    const headers: Record<string, string> = {
      'API-VERSION': '1',
      'Authorization': `Bearer ${token}`,
      'User-Agent': this.userAgent,
      ...options?.headers,
    };
    return this.fetchImpl(url, {
      method,
      headers,
      body: options?.body,
      signal: options?.signal,
    });
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private buildUrl(
    path: string,
    params?: Record<string, string | number | undefined>,
  ): string {
    const url = new URL(path.startsWith('/') ? path : `/${path}`, this.baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private isRetryable(status: number): boolean {
    return status === 429 || (status >= 500 && status < 600);
  }

  private getRetryDelay(attempt: number, retryAfter: string | null): number {
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds)) return seconds * 1000;
    }
    return this.retryDelayMs * Math.pow(2, attempt - 1);
  }

  private async parseErrorResponse<T>(response: Response): Promise<ApiResult<T>> {
    let raw: unknown;
    let message = `HTTP ${response.status}`;
    let type = 'http_error';

    try {
      raw = await response.json();
      if (raw && typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;
        if (typeof obj.message === 'string') message = obj.message;
        if (typeof obj.exceptionMessage === 'string') message = obj.exceptionMessage;
        if (typeof obj.type === 'string') type = obj.type;
      }
    } catch {
      raw = await response.text().catch(() => null);
    }

    return {
      ok: false,
      status: response.status,
      error: { type, message, raw },
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
