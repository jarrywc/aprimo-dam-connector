import { HttpClient } from './http.js';
import type { AprimoClientOptions } from './types/api.js';
import type { AuthStrategy } from './auth/types.js';
import { TokenManager } from './auth/token-manager.js';
import { createClientCredentialsProvider } from './auth/client-credentials.js';
import { createRecordsModule, type RecordsModule } from './records/index.js';
import { createMetadataModule, type MetadataModule } from './metadata/index.js';
import { createUploadsModule, type UploadsModule } from './uploads/index.js';

export class AprimoClient {
  readonly records: RecordsModule;
  readonly metadata: MetadataModule;
  readonly uploads: UploadsModule;

  private readonly http: HttpClient;

  constructor(options: AprimoClientOptions) {
    const tokenProvider = this.resolveTokenProvider(options);

    this.http = new HttpClient({
      baseUrl: `https://${options.tenant}.dam.aprimo.com`,
      tokenProvider,
      fetchImpl: options.fetchImpl,
      userAgent: options.userAgent,
      maxRetries: options.maxRetries,
    });

    this.records = createRecordsModule(this.http);
    this.metadata = createMetadataModule(this.http);
    this.uploads = createUploadsModule(this.http);
  }

  private resolveTokenProvider(options: AprimoClientOptions): () => Promise<string> {
    const auth = options.auth;

    if (auth.type === 'custom' || auth.type === 'pkce') {
      return auth.tokenProvider;
    }

    if (auth.type === 'client_credentials') {
      const fetchToken = createClientCredentialsProvider({
        tenant: options.tenant,
        clientId: auth.clientId,
        clientSecret: auth.clientSecret,
        fetchImpl: options.fetchImpl,
      });

      const tokenManager = new TokenManager({
        fetchToken,
        onTokenChange: options.onTokenChange,
        getStoredToken: options.getStoredToken,
      });

      return () => tokenManager.getToken();
    }

    throw new Error(`Unknown auth strategy type: ${(auth as AuthStrategy).type}`);
  }
}
