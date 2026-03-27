import { describe, it, expect } from 'vitest';
import { HttpClient } from '../../src/http.js';
import { createRecordsModule } from '../../src/records/index.js';
import { createTokenProvider } from '../setup.js';

function createTestHttp(handler: (url: string, init?: RequestInit) => Promise<Response>): HttpClient {
  return new HttpClient({
    baseUrl: 'https://test.dam.aprimo.com',
    tokenProvider: createTokenProvider(),
    fetchImpl: handler as typeof fetch,
    maxRetries: 0,
  });
}

describe('RecordsModule', () => {
  it('list sends correct request', async () => {
    let capturedUrl = '';
    let capturedHeaders: Record<string, string> = {};

    const http = createTestHttp(async (url, init) => {
      capturedUrl = url;
      capturedHeaders = init?.headers as Record<string, string>;
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          items: [{ id: '1' }, { id: '2' }],
          page: 1,
          pageSize: 50,
          totalCount: 2,
          _links: { self: { href: '/api/core/records' } },
        }),
      } as Response;
    });

    const records = createRecordsModule(http);
    const result = await records.list({ pageSize: 50, fields: ['title', 'status'] });

    expect(result.ok).toBe(true);
    expect(capturedUrl).toContain('/api/core/records');
    expect(capturedUrl).toContain('pageSize=50');
    expect(capturedHeaders['select-record']).toBe('title,status');
    if (result.ok) {
      expect(result.data.items).toHaveLength(2);
    }
  });

  it('get sends correct request', async () => {
    let capturedUrl = '';

    const http = createTestHttp(async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ id: '123', title: 'Test Record' }),
      } as Response;
    });

    const records = createRecordsModule(http);
    const result = await records.get('123');

    expect(capturedUrl).toContain('/api/core/records/123');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBe('123');
    }
  });

  it('search includes query param', async () => {
    let capturedUrl = '';

    const http = createTestHttp(async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          items: [],
          page: 1,
          pageSize: 50,
          totalCount: 0,
          _links: { self: { href: '/api/core/records' } },
        }),
      } as Response;
    });

    const records = createRecordsModule(http);
    await records.search('landscape');

    expect(capturedUrl).toContain('search=landscape');
  });

  it('create sends POST with body', async () => {
    let capturedMethod = '';
    let capturedBody = '';

    const http = createTestHttp(async (_, init) => {
      capturedMethod = init?.method ?? '';
      capturedBody = init?.body as string;
      return {
        ok: true,
        status: 201,
        headers: new Headers(),
        json: async () => ({ id: 'new-1' }),
      } as Response;
    });

    const records = createRecordsModule(http);
    const result = await records.create({
      fields: { title: { value: 'New Asset' } },
    });

    expect(capturedMethod).toBe('POST');
    expect(JSON.parse(capturedBody).fields.title.value).toBe('New Asset');
    expect(result.ok).toBe(true);
  });

  it('delete sends DELETE', async () => {
    let capturedMethod = '';
    let capturedUrl = '';

    const http = createTestHttp(async (url, init) => {
      capturedMethod = init?.method ?? '';
      capturedUrl = url;
      return {
        ok: true,
        status: 204,
        headers: new Headers(),
        json: async () => null,
      } as Response;
    });

    const records = createRecordsModule(http);
    const result = await records.delete('123');

    expect(capturedMethod).toBe('DELETE');
    expect(capturedUrl).toContain('/api/core/records/123');
    expect(result.ok).toBe(true);
  });
});
