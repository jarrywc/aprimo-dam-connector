// Client
export { AprimoClient } from './client.js';
export type { AprimoClientOptions, RequestOptions } from './types/api.js';

// Auth
export type { AuthStrategy, TokenResponse } from './auth/types.js';
export {
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthorizeUrl,
  exchangeCodeForToken,
  refreshAccessToken,
} from './auth/pkce.js';
export type { BuildAuthorizeUrlOptions, ExchangeCodeOptions, RefreshTokenOptions } from './auth/pkce.js';
export { createClientCredentialsProvider } from './auth/client-credentials.js';
export type { ClientCredentialsOptions } from './auth/client-credentials.js';
export { TokenManager } from './auth/token-manager.js';
export type { TokenManagerOptions } from './auth/token-manager.js';

// Records
export type {
  AprimoRecord,
  ListRecordsParams,
  GetRecordOptions,
  SearchRecordsParams,
  CreateRecordRequest,
  UpdateRecordRequest,
} from './records/types.js';
export type { RecordsModule } from './records/index.js';

// Metadata
export type {
  FieldDefinition,
  ContentType,
  Classification,
  ListMetadataParams,
} from './metadata/types.js';
export type { MetadataModule } from './metadata/index.js';

// Uploads
export type { UploadResult, UploadOptions, SegmentedUploadOptions } from './uploads/types.js';
export type { UploadsModule } from './uploads/index.js';

// Common types
export type { ApiResult, ApiError, PagedResponse, HalLink } from './types/common.js';

// Errors
export { AprimoError, AprimoApiError } from './errors.js';

// Pagination utilities
export { paginate, collectAll } from './pagination.js';
