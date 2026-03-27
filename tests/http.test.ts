import { describe, it, expect } from 'vitest';
import { HttpClient } from '../src/http.js';
import { createMockFetch, createTokenProvider } from './setup.js';

describe('HttpClient', () => {
  it('sends correct headers', async () => {
    let capturedHeaders: Record<string, string> = {};

    const mockFetch = async (input: string | URL, init?: RequestInit) => {
      capturedHeaders = init?.headers as Record<string, string>;
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ id: '1' }),
      } as Response;
    };

    const client = new HttpClient({
      baseUrl: 'https://test.dam.aprimo.com',
      tokenProvider: createTokenProvider(),
      fetchImpl: mockFetch,
    });

    await client.get('/api/core/records');

    expect(capturedHeaders['API-VERSION']).toBe('1');
    expect(capturedHeaders['Accept']).toBe('application/hal+json');
    expect(capturedHeaders['Authorization']).toBe('Bearer test-token');
    expect(capturedHeaders['User-Agent']).toBe('aprimo-dam-connector');
  });

  it('returns ok result for successful requests', async () => {
    const mockFetch = createMockFetch([
      { method: 'GET', url: '/api/core/records/123', status: 200, body: { id: '123', title: 'Test' } },
    ]);

    const client = new HttpClient({
      baseUrl: 'https://test.dam.aprimo.com',
      tokenProvider: createTokenProvider(),
      fetchImpl: mockFetch,
    });

    const result = await client.get<{ id: string; title: string }>('/api/core/records/123');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBe('123');
      expect(result.data.title).toBe('Test');
    }
  });

  it('returns error result for 4xx responses', async () => {
    const mockFetch = createMockFetch([
      {
        method: 'GET',
        url: '/api/core/records/999',
        status: 404,
        body: { message: 'Record not found', type: 'not_found' },
      },
    ]);

    const client = new HttpClient({
      baseUrl: 'https://test.dam.aprimo.com',
      tokenProvider: createTokenProvider(),
      fetchImpl: mockFetch,
      maxRetries: 0,
    });

    const result = await client.get('/api/core/records/999');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(404);
      expect(result.error.message).toBe('Record not found');
    }
  });

  it('handles 204 No Content', async () => {
    const mockFetch = async () =>
      ({
        ok: true,
        status: 204,
        headers: new Headers(),
        json: async () => null,
      }) as Response;

    const client = new HttpClient({
      baseUrl: 'https://test.dam.aprimo.com',
      tokenProvider: createTokenProvider(),
      fetchImpl: mockFetch,
    });

    const result = await client.delete('/api/core/records/123');
    expect(result.ok).toBe(true);
    expect(result.status).toBe(204);
  });

  it('builds query params', async () => {
    let capturedUrl = '';

    const mockFetch = async (input: string | URL) => {
      capturedUrl = typeof input === 'string' ? input : input.toString();
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ items: [] }),
      } as Response;
    };

    const client = new HttpClient({
      baseUrl: 'https://test.dam.aprimo.com',
      tokenProvider: createTokenProvider(),
      fetchImpl: mockFetch,
    });

    await client.get('/api/core/records', {
      params: { page: 1, pageSize: 50, filter: undefined },
    });

    expect(capturedUrl).toContain('page=1');
    expect(capturedUrl).toContain('pageSize=50');
    expect(capturedUrl).not.toContain('filter');
  });

  it('sends JSON body for POST', async () => {
    let capturedBody = '';

    const mockFetch = async (_: string | URL, init?: RequestInit) => {
      capturedBody = init?.body as string;
      return {
        ok: true,
        status: 201,
        headers: new Headers(),
        json: async () => ({ id: 'new' }),
      } as Response;
    };

    const client = new HttpClient({
      baseUrl: 'https://test.dam.aprimo.com',
      tokenProvider: createTokenProvider(),
      fetchImpl: mockFetch,
    });

    await client.post('/api/core/records', {
      body: { fields: { title: { value: 'Test' } } },
    });

    const parsed = JSON.parse(capturedBody);
    expect(parsed.fields.title.value).toBe('Test');
  });
});
