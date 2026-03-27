import { describe, it, expect } from 'vitest';
import { createClientCredentialsProvider } from '../../src/auth/client-credentials.js';

describe('Client Credentials', () => {
  it('sends correct token request', async () => {
    let capturedUrl = '';
    let capturedBody = '';

    const mockFetch = async (input: string | URL, init?: RequestInit) => {
      capturedUrl = typeof input === 'string' ? input : input.toString();
      capturedBody = init?.body as string;
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          access_token: 'new-token',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
      } as Response;
    };

    const provider = createClientCredentialsProvider({
      tenant: 'mycompany',
      clientId: 'client-123',
      clientSecret: 'secret-456',
      fetchImpl: mockFetch,
    });

    const token = await provider();

    expect(capturedUrl).toBe('https://mycompany.aprimo.com/login/connect/token');
    expect(capturedBody).toContain('grant_type=client_credentials');
    expect(capturedBody).toContain('client_id=client-123');
    expect(capturedBody).toContain('client_secret=secret-456');
    expect(token.access_token).toBe('new-token');
    expect(token.expires_in).toBe(3600);
  });

  it('throws on failed token request', async () => {
    const mockFetch = async () =>
      ({
        ok: false,
        status: 401,
        headers: new Headers(),
        text: async () => 'Unauthorized',
      }) as Response;

    const provider = createClientCredentialsProvider({
      tenant: 'mycompany',
      clientId: 'bad-id',
      clientSecret: 'bad-secret',
      fetchImpl: mockFetch,
    });

    await expect(provider()).rejects.toThrow('Client credentials token request failed (401)');
  });
});
