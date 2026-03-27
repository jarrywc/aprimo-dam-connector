# aprimo-dam-connector

Cross-runtime TypeScript client for the [Aprimo DAM API](https://developers.aprimo.com/docs/rest-api/dam/dam-intro). Zero dependencies, works everywhere: Node.js, Bun, Cloudflare Workers, and Adobe plugins (CEP/UXP).

## Install

```bash
npm install aprimo-dam-connector
```

## Quick Start

### Client Credentials (server-side)

```typescript
import { AprimoClient } from 'aprimo-dam-connector';

const client = new AprimoClient({
  tenant: 'your-tenant',
  auth: {
    type: 'client_credentials',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  },
});

// List records
const result = await client.records.list({ pageSize: 10 });
if (result.ok) {
  console.log(result.data.items);
}

// Get a specific record
const record = await client.records.get('record-id', {
  fields: ['title', 'status'],
});

// Upload a file
const file = new Blob(['hello'], { type: 'text/plain' });
const upload = await client.uploads.upload(file, 'hello.txt');
```

### OAuth PKCE (browser / Adobe plugin)

The PKCE flow is browser-interactive. The SDK provides helper functions — your app handles the redirect.

```typescript
import {
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthorizeUrl,
  exchangeCodeForToken,
  AprimoClient,
} from 'aprimo-dam-connector';

// Step 1: Generate PKCE values and redirect user
const verifier = await generateCodeVerifier();
const challenge = await generateCodeChallenge(verifier);

const authorizeUrl = buildAuthorizeUrl({
  tenant: 'your-tenant',
  clientId: 'your-client-id',
  redirectUri: 'https://your-app/callback',
  codeChallenge: challenge,
});
// Redirect user to authorizeUrl...

// Step 2: After redirect, exchange code for token
const tokenResponse = await exchangeCodeForToken({
  tenant: 'your-tenant',
  clientId: 'your-client-id',
  code: 'code-from-callback',
  codeVerifier: verifier,
  redirectUri: 'https://your-app/callback',
});

// Step 3: Create client with token
const client = new AprimoClient({
  tenant: 'your-tenant',
  auth: {
    type: 'pkce',
    tokenProvider: async () => tokenResponse.access_token,
  },
});
```

### Custom Token Provider

For full control over token management:

```typescript
const client = new AprimoClient({
  tenant: 'your-tenant',
  auth: {
    type: 'custom',
    tokenProvider: async () => {
      // Fetch token from your own auth service, KV store, etc.
      return 'your-access-token';
    },
  },
});
```

## Records

```typescript
// List with pagination
const page = await client.records.list({ page: 1, pageSize: 50 });

// Search
const results = await client.records.search('landscape photo');

// Auto-paginate with async generator
for await (const batch of client.records.listPaged({ pageSize: 100 })) {
  for (const record of batch) {
    console.log(record.id, record.title);
  }
}

// Create
const created = await client.records.create({
  fields: {
    title: { value: 'My Asset' },
  },
});

// Update
await client.records.update('record-id', {
  fields: {
    title: { value: 'Updated Title' },
  },
});

// Delete
await client.records.delete('record-id');
```

## Metadata

Load field definitions, content types, and classifications to understand your DAM's record structure.

```typescript
// List all field definitions
const fields = await client.metadata.getFieldDefinitions();

// Get a specific field definition
const field = await client.metadata.getFieldDefinition('field-id');

// List content types
const types = await client.metadata.getContentTypes();

// Browse classifications
const classifications = await client.metadata.getClassifications();
const classification = await client.metadata.getClassification('class-id');

// Auto-paginate field definitions
for await (const batch of client.metadata.getFieldDefinitionsPaged()) {
  for (const field of batch) {
    console.log(field.name, field.dataType);
  }
}
```

## File Uploads

Files under 20 MB upload directly. Larger files are automatically split into segments.

```typescript
// Auto-routes based on file size
const upload = await client.uploads.upload(fileBlob, 'photo.jpg');

// Force segmented upload with progress tracking
const upload = await client.uploads.upload(largeFile, 'video.mp4', {
  forceSegmented: true,
  parallelLimit: 3,
  onProgress: (uploaded, total) => {
    console.log(`${Math.round((uploaded / total) * 100)}%`);
  },
});

// Use the upload token when creating a record
if (upload.ok) {
  await client.records.create({
    fileToken: upload.data.token,
    fields: { title: { value: 'My Video' } },
  });
}
```

## Token Persistence

Plug in your own storage for tokens:

```typescript
const client = new AprimoClient({
  tenant: 'your-tenant',
  auth: {
    type: 'client_credentials',
    clientId: '...',
    clientSecret: '...',
  },
  onTokenChange: async (token) => {
    // Persist to KV, localStorage, database, etc.
    await myStore.set('aprimo-token', JSON.stringify(token));
  },
  getStoredToken: async () => {
    const stored = await myStore.get('aprimo-token');
    return stored ? JSON.parse(stored) : null;
  },
});
```

## Custom Fetch

Pass your own `fetch` implementation for environments that need it:

```typescript
const client = new AprimoClient({
  tenant: 'your-tenant',
  auth: { type: 'custom', tokenProvider: async () => token },
  fetchImpl: myCustomFetch,
});
```

## Runtime Compatibility

| Runtime | Status |
|---------|--------|
| Node.js 18+ | Supported |
| Bun | Supported |
| Cloudflare Workers | Supported |
| Adobe CEP | Supported |
| Adobe UXP | Supported |

The package uses only Web APIs (`fetch`, `crypto.subtle`, `URL`, `FormData`, `Blob`) — no Node.js built-ins required.

## Error Handling

All methods return `ApiResult<T>` — no exceptions thrown for API errors:

```typescript
const result = await client.records.get('id');

if (result.ok) {
  console.log(result.data);
} else {
  console.error(result.status, result.error.message);
}
```

## License

MIT
