import type { TokenResponse } from './types.js';

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function generateCodeVerifier(): Promise<string> {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return base64UrlEncode(buffer.buffer);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(hash);
}

export interface BuildAuthorizeUrlOptions {
  tenant: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  scope?: string;
  state?: string;
}

export function buildAuthorizeUrl(options: BuildAuthorizeUrlOptions): string {
  const url = new URL(`https://${options.tenant}.aprimo.com/login/connect/authorize`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', options.clientId);
  url.searchParams.set('redirect_uri', options.redirectUri);
  url.searchParams.set('code_challenge', options.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('scope', options.scope ?? 'api offline_access');
  if (options.state) {
    url.searchParams.set('state', options.state);
  }
  return url.toString();
}

export interface ExchangeCodeOptions {
  tenant: string;
  clientId: string;
  clientSecret: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
  fetchImpl?: typeof fetch;
}

export async function exchangeCodeForToken(
  options: ExchangeCodeOptions,
): Promise<TokenResponse> {
  const fetchFn = options.fetchImpl ?? globalThis.fetch;
  const tokenUrl = `https://${options.tenant}.aprimo.com/login/connect/token`;

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: options.clientId,
    client_secret: options.clientSecret,
    code: options.code,
    code_verifier: options.codeVerifier,
    redirect_uri: options.redirectUri,
  });

  const response = await fetchFn(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Token exchange failed (${response.status}): ${text}`);
  }

  return response.json() as Promise<TokenResponse>;
}

export interface RefreshTokenOptions {
  tenant: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  fetchImpl?: typeof fetch;
}

export async function refreshAccessToken(
  options: RefreshTokenOptions,
): Promise<TokenResponse> {
  const fetchFn = options.fetchImpl ?? globalThis.fetch;
  const tokenUrl = `https://${options.tenant}.aprimo.com/login/connect/token`;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: options.clientId,
    client_secret: options.clientSecret,
    refresh_token: options.refreshToken,
  });

  const response = await fetchFn(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Token refresh failed (${response.status}): ${text}`);
  }

  return response.json() as Promise<TokenResponse>;
}
