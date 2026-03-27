import { describe, it, expect } from 'vitest';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthorizeUrl,
} from '../../src/auth/pkce.js';

describe('PKCE', () => {
  it('generates a code verifier of at least 43 characters', async () => {
    const verifier = await generateCodeVerifier();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    // Base64url characters only
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('generates different verifiers each time', async () => {
    const v1 = await generateCodeVerifier();
    const v2 = await generateCodeVerifier();
    expect(v1).not.toBe(v2);
  });

  it('generates a valid code challenge from verifier', async () => {
    const verifier = await generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    expect(challenge.length).toBeGreaterThan(0);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('generates different challenges for different verifiers', async () => {
    const v1 = await generateCodeVerifier();
    const v2 = await generateCodeVerifier();
    const c1 = await generateCodeChallenge(v1);
    const c2 = await generateCodeChallenge(v2);
    expect(c1).not.toBe(c2);
  });

  it('generates same challenge for same verifier', async () => {
    const verifier = 'test-verifier-string-that-is-long-enough-here';
    const c1 = await generateCodeChallenge(verifier);
    const c2 = await generateCodeChallenge(verifier);
    expect(c1).toBe(c2);
  });

  it('builds authorize URL with all params', () => {
    const url = buildAuthorizeUrl({
      tenant: 'mycompany',
      clientId: 'client-123',
      redirectUri: 'https://app.example.com/callback',
      codeChallenge: 'abc123',
      state: 'state-xyz',
    });

    expect(url).toContain('https://mycompany.aprimo.com/login/connect/authorize');
    expect(url).toContain('response_type=code');
    expect(url).toContain('client_id=client-123');
    expect(url).toContain('code_challenge=abc123');
    expect(url).toContain('code_challenge_method=S256');
    expect(url).toContain('state=state-xyz');
    expect(url).toContain(encodeURIComponent('https://app.example.com/callback'));
  });

  it('builds authorize URL with default scope', () => {
    const url = buildAuthorizeUrl({
      tenant: 'mycompany',
      clientId: 'client-123',
      redirectUri: 'https://app.example.com/callback',
      codeChallenge: 'abc123',
    });

    expect(url).toContain('scope=api+offline_access');
  });
});
