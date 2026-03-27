export interface MockRoute {
  method: string;
  url: string | RegExp;
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
}

export function createMockFetch(routes: MockRoute[]): typeof fetch {
  return async (input: string | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method ?? 'GET';

    const route = routes.find((r) => {
      if (r.method !== method) return false;
      if (typeof r.url === 'string') return url.includes(r.url);
      return r.url.test(url);
    });

    if (!route) {
      throw new Error(`No mock route for ${method} ${url}`);
    }

    const responseHeaders = new Headers(route.headers);

    return {
      ok: route.status >= 200 && route.status < 300,
      status: route.status,
      headers: responseHeaders,
      json: async () => route.body,
      text: async () => JSON.stringify(route.body),
    } as Response;
  };
}

export function createTokenProvider(token = 'test-token'): () => Promise<string> {
  return async () => token;
}
