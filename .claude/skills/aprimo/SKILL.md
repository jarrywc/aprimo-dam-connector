---
name: aprimo
description: Reference for the @jarrywc/aprimo-dam-connector SDK. Use when writing code that interacts with the Aprimo DAM API — creating clients, managing records, querying metadata, uploading files, or handling authentication.
argument-hint: [topic]
---

# @jarrywc/aprimo-dam-connector SDK Reference

Complete API reference for the Aprimo DAM connector. Use this to write correct code against the SDK.

## Installation

```bash
npm install @jarrywc/aprimo-dam-connector
```

Requires `.npmrc` with GitHub Packages configured:

```
@jarrywc:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

---

## Client Setup

```typescript
import { AprimoClient } from '@jarrywc/aprimo-dam-connector';
```

### Constructor Options

```typescript
interface AprimoClientOptions {
  tenant: string;                    // Aprimo tenant name
  auth: AuthStrategy;                // See Auth Strategies below
  fetchImpl?: typeof fetch;          // Custom fetch for non-standard runtimes
  userAgent?: string;                // Custom User-Agent header
  maxRetries?: number;               // Retry count for failed requests
  onTokenChange?: (token: TokenResponse) => void | Promise<void>;   // Token persistence callback
  getStoredToken?: () => TokenResponse | null | Promise<TokenResponse | null>; // Retrieve stored token
}
```

### Auth Strategies

```typescript
type AuthStrategy =
  | { type: 'client_credentials'; clientId: string; clientSecret: string }
  | { type: 'pkce'; tokenProvider: () => Promise<string> }
  | { type: 'custom'; tokenProvider: () => Promise<string> };
```

**Client Credentials (server-side):**

```typescript
const client = new AprimoClient({
  tenant: 'your-tenant',
  auth: {
    type: 'client_credentials',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  },
});
```

**PKCE (browser / Adobe plugin):**

```typescript
import {
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthorizeUrl,
  exchangeCodeForToken,
  AprimoClient,
} from '@jarrywc/aprimo-dam-connector';

const verifier = await generateCodeVerifier();
const challenge = await generateCodeChallenge(verifier);

const authorizeUrl = buildAuthorizeUrl({
  tenant: 'your-tenant',
  clientId: 'your-client-id',
  redirectUri: 'https://your-app/callback',
  codeChallenge: challenge,
  scope: 'optional-scope',   // optional
  state: 'optional-state',   // optional
});
// Redirect user to authorizeUrl...

// After redirect callback:
const tokenResponse = await exchangeCodeForToken({
  tenant: 'your-tenant',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  code: 'code-from-callback',
  codeVerifier: verifier,
  redirectUri: 'https://your-app/callback',
  fetchImpl: customFetch,    // optional
});

// Refresh an expired token:
import { refreshAccessToken } from '@jarrywc/aprimo-dam-connector';
const newToken = await refreshAccessToken({
  tenant: 'your-tenant',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  refreshToken: tokenResponse.refresh_token,
  fetchImpl: customFetch,    // optional
});

const client = new AprimoClient({
  tenant: 'your-tenant',
  auth: { type: 'pkce', tokenProvider: async () => tokenResponse.access_token },
});
```

**Custom Token Provider:**

```typescript
const client = new AprimoClient({
  tenant: 'your-tenant',
  auth: {
    type: 'custom',
    tokenProvider: async () => 'your-access-token',
  },
});
```

### TokenManager (advanced)

For manual token lifecycle management:

```typescript
import { TokenManager, createClientCredentialsProvider } from '@jarrywc/aprimo-dam-connector';

const fetchToken = createClientCredentialsProvider({
  tenant: 'your-tenant',
  clientId: 'id',
  clientSecret: 'secret',
  fetchImpl: customFetch,  // optional
});

const manager = new TokenManager({
  fetchToken,
  onTokenChange: async (token) => { /* persist */ },
  getStoredToken: async () => { /* retrieve */ return null; },
  refreshBufferSeconds: 60,  // default: 60
});

const accessToken = await manager.getToken();
```

### Token Persistence

```typescript
const client = new AprimoClient({
  tenant: 'your-tenant',
  auth: { type: 'client_credentials', clientId: '...', clientSecret: '...' },
  onTokenChange: async (token) => {
    await myStore.set('aprimo-token', JSON.stringify(token));
  },
  getStoredToken: async () => {
    const stored = await myStore.get('aprimo-token');
    return stored ? JSON.parse(stored) : null;
  },
});
```

---

## Records Module — `client.records`

### Methods

| Method | Signature | Returns |
|--------|-----------|---------|
| `list` | `(params?: ListRecordsParams)` | `Promise<ApiResult<PagedResponse<AprimoRecord>>>` |
| `get` | `(id: string, options?: GetRecordOptions)` | `Promise<ApiResult<AprimoRecord>>` |
| `search` | `(query: string, params?: SearchRecordsParams)` | `Promise<ApiResult<PagedResponse<AprimoRecord>>>` |
| `create` | `(request: CreateRecordRequest)` | `Promise<ApiResult<AprimoRecord>>` |
| `update` | `(id: string, request: UpdateRecordRequest)` | `Promise<ApiResult<AprimoRecord>>` |
| `delete` | `(id: string)` | `Promise<ApiResult<void>>` |
| `listPaged` | `(params?: ListRecordsParams)` | `AsyncGenerator<AprimoRecord[], void, unknown>` |

### Types

```typescript
interface AprimoRecord {
  id: string;
  title?: string;
  status?: string;
  contentType?: string;
  createdOn?: string;
  modifiedOn?: string;
  fields?: Record<string, FieldValue>;
  _links?: Record<string, HalLink>;
  _embedded?: Record<string, unknown>;
}

interface FieldValue {
  dataType?: string;
  localizedValues?: LocalizedValue[];
  values?: string[];
  value?: string;
}

interface LocalizedValue {
  languageId: string;
  value: string;
}

interface ListRecordsParams {
  page?: number;
  pageSize?: number;
  filter?: string;
  orderBy?: string;
  fields?: string[];      // select-record header
  languages?: string[];   // select-languages header
}

interface GetRecordOptions {
  fields?: string[];
  languages?: string[];
}

interface SearchRecordsParams {
  page?: number;
  pageSize?: number;
  fields?: string[];
  languages?: string[];
}

interface CreateRecordRequest {
  fields?: Record<string, FieldValue>;
  contentType?: string;
  classifications?: string[];
  fileToken?: string;        // from uploads.upload()
}

interface UpdateRecordRequest {
  fields?: Record<string, FieldValue>;
  classifications?: string[];
  fileToken?: string;
}
```

### Examples

```typescript
// List with pagination
const page = await client.records.list({ page: 1, pageSize: 50 });

// Search
const results = await client.records.search('landscape photo');

// Get with field selection
const record = await client.records.get('record-id', {
  fields: ['title', 'status'],
  languages: ['en-US'],
});

// Auto-paginate
for await (const batch of client.records.listPaged({ pageSize: 100 })) {
  for (const record of batch) {
    console.log(record.id, record.title);
  }
}

// Create
const created = await client.records.create({
  fields: { title: { value: 'My Asset' } },
  contentType: 'image',
  classifications: ['class-id'],
  fileToken: 'token-from-upload',
});

// Update
await client.records.update('record-id', {
  fields: { title: { value: 'Updated Title' } },
});

// Delete
await client.records.delete('record-id');
```

---

## Metadata Module — `client.metadata`

### Methods

| Method | Signature | Returns |
|--------|-----------|---------|
| `getFieldDefinitions` | `(params?: ListMetadataParams)` | `Promise<ApiResult<PagedResponse<FieldDefinition>>>` |
| `getFieldDefinition` | `(id: string)` | `Promise<ApiResult<FieldDefinition>>` |
| `getFieldDefinitionsPaged` | `(params?: ListMetadataParams)` | `AsyncGenerator<FieldDefinition[], void, unknown>` |
| `getContentTypes` | `(params?: ListMetadataParams)` | `Promise<ApiResult<PagedResponse<ContentType>>>` |
| `getContentType` | `(id: string)` | `Promise<ApiResult<ContentType>>` |
| `getClassifications` | `(params?: ListMetadataParams)` | `Promise<ApiResult<PagedResponse<Classification>>>` |
| `getClassification` | `(id: string)` | `Promise<ApiResult<Classification>>` |
| `getClassificationsPaged` | `(params?: ListMetadataParams)` | `AsyncGenerator<Classification[], void, unknown>` |

### Types

```typescript
interface FieldDefinition {
  id: string;
  name: string;
  label?: string;
  dataType: string;
  fieldType?: string;
  isRequired?: boolean;
  isReadOnly?: boolean;
  isSearchable?: boolean;
  options?: FieldOption[];
  defaultValue?: string;
  _links?: Record<string, HalLink>;
}

interface FieldOption {
  id: string;
  name: string;
  label?: string;
  sortIndex?: number;
}

interface ContentType {
  id: string;
  name: string;
  label?: string;
  description?: string;
  fieldDefinitions?: string[];
  _links?: Record<string, HalLink>;
}

interface Classification {
  id: string;
  name: string;
  label?: string;
  parentId?: string;
  hasChildren?: boolean;
  path?: string;
  children?: Classification[];
  _links?: Record<string, HalLink>;
}

interface ListMetadataParams {
  page?: number;
  pageSize?: number;
  filter?: string;
}
```

### Examples

```typescript
// List all field definitions
const fields = await client.metadata.getFieldDefinitions();

// Get a single field definition
const field = await client.metadata.getFieldDefinition('field-id');

// Auto-paginate field definitions
for await (const batch of client.metadata.getFieldDefinitionsPaged()) {
  for (const field of batch) {
    console.log(field.name, field.dataType);
  }
}

// List content types
const types = await client.metadata.getContentTypes();

// Get a single content type
const type = await client.metadata.getContentType('type-id');

// List classifications with filter
const classifications = await client.metadata.getClassifications({ filter: 'name eq "Photos"' });

// Get a single classification
const classification = await client.metadata.getClassification('class-id');

// Auto-paginate classifications
for await (const batch of client.metadata.getClassificationsPaged()) {
  for (const cls of batch) {
    console.log(cls.name, cls.path);
  }
}
```

---

## Uploads Module — `client.uploads`

Files under 20 MB upload directly. Larger files are automatically split into segments.

### Methods

| Method | Signature | Returns |
|--------|-----------|---------|
| `upload` | `(file: Blob \| ArrayBuffer, filename: string, options?: SegmentedUploadOptions & { forceSegmented?: boolean })` | `Promise<ApiResult<UploadResult>>` |
| `uploadSmall` | `(file: Blob \| ArrayBuffer, filename: string, options?: SegmentedUploadOptions)` | `Promise<ApiResult<UploadResult>>` |
| `uploadSegmented` | `(file: Blob \| ArrayBuffer, filename: string, options?: SegmentedUploadOptions)` | `Promise<ApiResult<UploadResult>>` |

### Types

```typescript
interface UploadResult {
  token: string;
  uri?: string;
}

interface UploadOptions {
  signal?: AbortSignal;
}

interface SegmentedUploadOptions extends UploadOptions {
  segmentSize?: number;       // default: 20 MB
  parallelLimit?: number;     // concurrent segment uploads
  onProgress?: (uploaded: number, total: number) => void;
}
```

### Examples

```typescript
// Auto-routes based on size (< 20 MB = direct, >= 20 MB = segmented)
const upload = await client.uploads.upload(fileBlob, 'photo.jpg');

// Force segmented with progress
const upload = await client.uploads.upload(largeFile, 'video.mp4', {
  forceSegmented: true,
  parallelLimit: 3,
  onProgress: (uploaded, total) => {
    console.log(`${Math.round((uploaded / total) * 100)}%`);
  },
});

// Explicitly use small upload
const upload = await client.uploads.uploadSmall(smallFile, 'icon.png');

// Explicitly use segmented upload
const upload = await client.uploads.uploadSegmented(hugeFile, 'archive.zip', {
  segmentSize: 10 * 1024 * 1024,  // 10 MB segments
  parallelLimit: 5,
});

// Use upload token to create a record
if (upload.ok) {
  await client.records.create({
    fileToken: upload.data.token,
    fields: { title: { value: 'My Video' } },
  });
}
```

---

## Common Types

```typescript
// All API methods return this — no exceptions thrown for API errors
type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: ApiError };

interface ApiError {
  type: string;
  message: string;
  raw: unknown;
}

interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  _links: {
    self: HalLink;
    first?: HalLink;
    prev?: HalLink;
    next?: HalLink;
    last?: HalLink;
  };
}

interface HalLink {
  href: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}
```

---

## Error Classes

```typescript
import { AprimoError, AprimoApiError } from '@jarrywc/aprimo-dam-connector';

// Base error
class AprimoError extends Error {
  constructor(message: string, code?: string);
}

// API-specific error (includes status, type, raw response)
class AprimoApiError extends AprimoError {
  readonly status: number;
  readonly type: string;
  readonly raw: unknown;
  constructor(message: string, status: number, type: string, raw: unknown);
}
```

---

## Pagination Utilities

```typescript
import { paginate, collectAll } from '@jarrywc/aprimo-dam-connector';

// paginate: yields pages following HAL _links.next
async function* paginate<T>(
  http: HttpClient,
  initialPath: string,
  params?: Record<string, string | number | undefined>,
): AsyncGenerator<T[], void, unknown>;

// collectAll: flattens async generator into array (max 10,000 items by default)
async function collectAll<T>(
  generator: AsyncGenerator<T[], void, unknown>,
  maxItems?: number,  // default: 10000
): Promise<T[]>;

// Example: collect all field definitions
const allFields = await collectAll(client.metadata.getFieldDefinitionsPaged());
```

---

## Error Handling Pattern

```typescript
const result = await client.records.get('id');

if (result.ok) {
  console.log(result.data);        // typed as AprimoRecord
} else {
  console.error(result.status);     // HTTP status code
  console.error(result.error.message);
  console.error(result.error.type);
  console.error(result.error.raw);  // raw API response
}
```

---

## Runtime Compatibility

Works in Node.js 18+, Bun, Cloudflare Workers, Adobe CEP, and Adobe UXP. Uses only Web APIs (`fetch`, `crypto.subtle`, `URL`, `FormData`, `Blob`).

---

## All Exports

```typescript
// Client
export { AprimoClient } from './client.js';
export type { AprimoClientOptions, RequestOptions } from './types/api.js';

// Auth
export type { AuthStrategy, TokenResponse } from './auth/types.js';
export { generateCodeVerifier, generateCodeChallenge, buildAuthorizeUrl, exchangeCodeForToken, refreshAccessToken } from './auth/pkce.js';
export type { BuildAuthorizeUrlOptions, ExchangeCodeOptions, RefreshTokenOptions } from './auth/pkce.js';
export { createClientCredentialsProvider } from './auth/client-credentials.js';
export type { ClientCredentialsOptions } from './auth/client-credentials.js';
export { TokenManager } from './auth/token-manager.js';
export type { TokenManagerOptions } from './auth/token-manager.js';

// Records
export type { RecordsModule } from './records/index.js';
export type { AprimoRecord, ListRecordsParams, GetRecordOptions, SearchRecordsParams, CreateRecordRequest, UpdateRecordRequest } from './records/types.js';

// Metadata
export type { MetadataModule } from './metadata/index.js';
export type { FieldDefinition, ContentType, Classification, ListMetadataParams } from './metadata/types.js';

// Uploads
export type { UploadsModule } from './uploads/index.js';
export type { UploadResult, UploadOptions, SegmentedUploadOptions } from './uploads/types.js';

// Common
export type { ApiResult, ApiError, PagedResponse, HalLink } from './types/common.js';
export { AprimoError, AprimoApiError } from './errors.js';
export { paginate, collectAll } from './pagination.js';
```
