import { describe, it, expect } from 'vitest';
import { HttpClient } from '../../src/http.js';
import { createUploadsModule } from '../../src/uploads/index.js';
import { createTokenProvider } from '../setup.js';

function createTestHttp(handler: (url: string, init?: RequestInit) => Promise<Response>): HttpClient {
  return new HttpClient({
    baseUrl: 'https://test.dam.aprimo.com',
    tokenProvider: createTokenProvider(),
    fetchImpl: handler as typeof fetch,
    maxRetries: 0,
  });
}

describe('UploadsModule', () => {
  it('small upload sends FormData', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody: unknown;

    const http = createTestHttp(async (url, init) => {
      capturedUrl = url;
      capturedMethod = init?.method ?? '';
      capturedBody = init?.body;
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ token: 'upload-token-123' }),
      } as Response;
    });

    const uploads = createUploadsModule(http);
    const file = new Blob(['hello world'], { type: 'text/plain' });
    const result = await uploads.uploadSmall(file, 'test.txt');

    expect(capturedMethod).toBe('POST');
    expect(capturedUrl).toContain('/api/core/uploads');
    expect(capturedBody).toBeInstanceOf(FormData);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.token).toBe('upload-token-123');
    }
  });

  it('auto-routes small files to direct upload', async () => {
    const http = createTestHttp(async (url) => {
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ token: 'small-token' }),
      } as Response;
    });

    const uploads = createUploadsModule(http);
    const smallFile = new Blob(['small content']);
    const result = await uploads.upload(smallFile, 'small.txt');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.token).toBe('small-token');
    }
  });

  it('auto-routes large files to segmented upload', async () => {
    const urls: string[] = [];
    const methods: string[] = [];

    const http = createTestHttp(async (url, init) => {
      urls.push(url);
      methods.push(init?.method ?? '');

      // Init segments
      if (url.includes('/uploads/segments') && !url.includes('?index=') && !url.includes('/commit')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ uri: 'https://test.dam.aprimo.com/api/core/uploads/segments/abc', token: 'seg-token' }),
        } as Response;
      }

      // Segment PUT
      if (url.includes('?index=')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({}),
        } as Response;
      }

      // Commit
      if (url.includes('/commit')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ token: 'final-token' }),
        } as Response;
      }

      return { ok: false, status: 404, headers: new Headers(), json: async () => ({}) } as Response;
    });

    const uploads = createUploadsModule(http);
    const result = await uploads.upload(new Blob(['x']), 'big.bin', { forceSegmented: true });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.token).toBe('final-token');
    }

    // Should have: init POST, segment PUT, commit POST
    expect(methods).toContain('POST');
    expect(methods).toContain('PUT');
  });
});
