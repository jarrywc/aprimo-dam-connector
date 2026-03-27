import { describe, it, expect } from 'vitest';
import { HttpClient } from '../src/http.js';
import { paginate, collectAll } from '../src/pagination.js';
import { createTokenProvider } from './setup.js';

describe('Pagination', () => {
  it('follows next links', async () => {
    let callCount = 0;

    const mockFetch = async (url: string | URL) => {
      callCount++;
      const urlStr = typeof url === 'string' ? url : url.toString();

      if (urlStr.includes('page2')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            items: [{ id: '3' }],
            page: 2,
            pageSize: 2,
            totalCount: 3,
            _links: { self: { href: '/api/core/records?page=2' } },
          }),
        } as Response;
      }

      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          items: [{ id: '1' }, { id: '2' }],
          page: 1,
          pageSize: 2,
          totalCount: 3,
          _links: {
            self: { href: '/api/core/records' },
            next: { href: '/api/core/records?page2' },
          },
        }),
      } as Response;
    };

    const http = new HttpClient({
      baseUrl: 'https://test.dam.aprimo.com',
      tokenProvider: createTokenProvider(),
      fetchImpl: mockFetch as typeof fetch,
      maxRetries: 0,
    });

    const allItems = await collectAll(paginate<{ id: string }>(http, '/api/core/records'));

    expect(allItems).toHaveLength(3);
    expect(allItems[0].id).toBe('1');
    expect(allItems[2].id).toBe('3');
    expect(callCount).toBe(2);
  });

  it('stops when no next link', async () => {
    const mockFetch = async () =>
      ({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          items: [{ id: '1' }],
          page: 1,
          pageSize: 50,
          totalCount: 1,
          _links: { self: { href: '/api/core/records' } },
        }),
      }) as Response;

    const http = new HttpClient({
      baseUrl: 'https://test.dam.aprimo.com',
      tokenProvider: createTokenProvider(),
      fetchImpl: mockFetch as typeof fetch,
      maxRetries: 0,
    });

    const items = await collectAll(paginate<{ id: string }>(http, '/api/core/records'));
    expect(items).toHaveLength(1);
  });

  it('respects maxItems limit', async () => {
    const mockFetch = async () =>
      ({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          items: Array.from({ length: 100 }, (_, i) => ({ id: String(i) })),
          page: 1,
          pageSize: 100,
          totalCount: 100,
          _links: {
            self: { href: '/api/core/records' },
            next: { href: '/api/core/records?page=2' },
          },
        }),
      }) as Response;

    const http = new HttpClient({
      baseUrl: 'https://test.dam.aprimo.com',
      tokenProvider: createTokenProvider(),
      fetchImpl: mockFetch as typeof fetch,
      maxRetries: 0,
    });

    const items = await collectAll(paginate<{ id: string }>(http, '/api/core/records'), 50);
    expect(items).toHaveLength(50);
  });
});
