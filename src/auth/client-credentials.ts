import type { TokenResponse } from './types.js';

export interface ClientCredentialsOptions {
  tenant: string;
  clientId: string;
  clientSecret: string;
  fetchImpl?: typeof fetch;
}

export function createClientCredentialsProvider(
  options: ClientCredentialsOptions,
): () => Promise<TokenResponse> {
  const fetchFn = options.fetchImpl ?? globalThis.fetch;
  const tokenUrl = `https://${options.tenant}.aprimo.com/login/connect/token`;

  return async (): Promise<TokenResponse> => {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: options.clientId,
      client_secret: options.clientSecret,
      scope: 'api',
    });

    const response = await fetchFn(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Client credentials token request failed (${response.status}): ${text}`);
    }

    return response.json() as Promise<TokenResponse>;
  };
}
