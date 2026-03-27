export type AuthStrategy =
  | { type: 'client_credentials'; clientId: string; clientSecret: string }
  | { type: 'pkce'; tokenProvider: () => Promise<string> }
  | { type: 'custom'; tokenProvider: () => Promise<string> };

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}
