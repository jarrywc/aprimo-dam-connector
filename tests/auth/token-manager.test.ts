import { describe, it, expect, vi } from 'vitest';
import { TokenManager } from '../../src/auth/token-manager.js';

describe('TokenManager', () => {
  it('fetches and caches token', async () => {
    const fetchToken = vi.fn().mockResolvedValue({
      access_token: 'token-1',
      token_type: 'Bearer',
      expires_in: 3600,
    });

    const manager = new TokenManager({ fetchToken });

    const token1 = await manager.getToken();
    const token2 = await manager.getToken();

    expect(token1).toBe('token-1');
    expect(token2).toBe('token-1');
    expect(fetchToken).toHaveBeenCalledTimes(1);
  });

  it('refreshes expired token', async () => {
    let callCount = 0;
    const fetchToken = vi.fn().mockImplementation(async () => {
      callCount++;
      return {
        access_token: `token-${callCount}`,
        token_type: 'Bearer',
        expires_in: 0, // expires immediately
      };
    });

    const manager = new TokenManager({ fetchToken, refreshBufferSeconds: 0 });

    const token1 = await manager.getToken();
    expect(token1).toBe('token-1');

    // Token is expired (expires_in: 0), should fetch again
    const token2 = await manager.getToken();
    expect(token2).toBe('token-2');
    expect(fetchToken).toHaveBeenCalledTimes(2);
  });

  it('calls onTokenChange callback', async () => {
    const onTokenChange = vi.fn();
    const fetchToken = vi.fn().mockResolvedValue({
      access_token: 'token-1',
      token_type: 'Bearer',
      expires_in: 3600,
    });

    const manager = new TokenManager({ fetchToken, onTokenChange });

    await manager.getToken();

    expect(onTokenChange).toHaveBeenCalledWith({
      access_token: 'token-1',
      token_type: 'Bearer',
      expires_in: 3600,
    });
  });

  it('loads from stored token on first call', async () => {
    const fetchToken = vi.fn().mockResolvedValue({
      access_token: 'fresh-token',
      token_type: 'Bearer',
      expires_in: 3600,
    });

    const getStoredToken = vi.fn().mockResolvedValue({
      access_token: 'stored-token',
      token_type: 'Bearer',
      expires_in: 3600,
    });

    const manager = new TokenManager({ fetchToken, getStoredToken });

    const token = await manager.getToken();
    expect(token).toBe('stored-token');
    expect(fetchToken).not.toHaveBeenCalled();
  });

  it('deduplicates concurrent refresh calls', async () => {
    let resolveToken: (value: unknown) => void;
    const fetchToken = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveToken = resolve;
        }),
    );

    const manager = new TokenManager({ fetchToken });

    const p1 = manager.getToken();
    const p2 = manager.getToken();

    resolveToken!({
      access_token: 'token-1',
      token_type: 'Bearer',
      expires_in: 3600,
    });

    const [t1, t2] = await Promise.all([p1, p2]);
    expect(t1).toBe('token-1');
    expect(t2).toBe('token-1');
    expect(fetchToken).toHaveBeenCalledTimes(1);
  });
});
