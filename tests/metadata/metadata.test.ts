import { describe, it, expect } from 'vitest';
import { HttpClient } from '../../src/http.js';
import { createMetadataModule } from '../../src/metadata/index.js';
import { createTokenProvider } from '../setup.js';

function createTestHttp(handler: (url: string, init?: RequestInit) => Promise<Response>): HttpClient {
  return new HttpClient({
    baseUrl: 'https://test.dam.aprimo.com',
    tokenProvider: createTokenProvider(),
    fetchImpl: handler as typeof fetch,
    maxRetries: 0,
  });
}

describe('MetadataModule', () => {
  it('getFieldDefinitions sends correct request', async () => {
    let capturedUrl = '';

    const http = createTestHttp(async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          items: [{ id: '1', name: 'title', dataType: 'string' }],
          page: 1,
          pageSize: 50,
          totalCount: 1,
          _links: { self: { href: '/api/core/fielddefinitions' } },
        }),
      } as Response;
    });

    const metadata = createMetadataModule(http);
    const result = await metadata.getFieldDefinitions({ pageSize: 50 });

    expect(capturedUrl).toContain('/api/core/fielddefinitions');
    expect(capturedUrl).toContain('pageSize=50');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.items[0].name).toBe('title');
    }
  });

  it('getFieldDefinition fetches by id', async () => {
    let capturedUrl = '';

    const http = createTestHttp(async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ id: 'field-1', name: 'title', dataType: 'string' }),
      } as Response;
    });

    const metadata = createMetadataModule(http);
    const result = await metadata.getFieldDefinition('field-1');

    expect(capturedUrl).toContain('/api/core/fielddefinitions/field-1');
    expect(result.ok).toBe(true);
  });

  it('getContentTypes sends correct request', async () => {
    let capturedUrl = '';

    const http = createTestHttp(async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          items: [{ id: '1', name: 'Image' }],
          page: 1,
          pageSize: 50,
          totalCount: 1,
          _links: { self: { href: '/api/core/contenttypes' } },
        }),
      } as Response;
    });

    const metadata = createMetadataModule(http);
    const result = await metadata.getContentTypes();

    expect(capturedUrl).toContain('/api/core/contenttypes');
    expect(result.ok).toBe(true);
  });

  it('getClassifications sends correct request', async () => {
    let capturedUrl = '';

    const http = createTestHttp(async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          items: [{ id: '1', name: 'Brand Assets' }],
          page: 1,
          pageSize: 50,
          totalCount: 1,
          _links: { self: { href: '/api/core/classifications' } },
        }),
      } as Response;
    });

    const metadata = createMetadataModule(http);
    const result = await metadata.getClassifications();

    expect(capturedUrl).toContain('/api/core/classifications');
    expect(result.ok).toBe(true);
  });
});
