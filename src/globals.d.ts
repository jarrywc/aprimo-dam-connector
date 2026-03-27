// Web API type declarations for cross-runtime compatibility.
// These are available in Node 18+, Bun, Cloudflare Workers, and browsers
// without pulling in the full DOM lib.

declare function fetch(input: string | URL, init?: RequestInit): Promise<Response>;

declare class URL {
  constructor(url: string, base?: string);
  searchParams: URLSearchParams;
  toString(): string;
  href: string;
}

declare class URLSearchParams {
  constructor(init?: Record<string, string> | string);
  set(key: string, value: string): void;
  toString(): string;
}

declare class TextEncoder {
  encode(input: string): Uint8Array;
}

declare function btoa(data: string): string;

declare interface SubtleCrypto {
  digest(algorithm: string, data: ArrayBuffer | Uint8Array): Promise<ArrayBuffer>;
}

declare interface Crypto {
  subtle: SubtleCrypto;
  getRandomValues<T extends ArrayBufferView>(array: T): T;
}

declare var crypto: Crypto;

declare class Blob {
  constructor(parts?: BlobPart[], options?: BlobPropertyBag);
  readonly size: number;
  readonly type: string;
  slice(start?: number, end?: number, contentType?: string): Blob;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
}

type BlobPart = ArrayBuffer | ArrayBufferView | Blob | string;

interface BlobPropertyBag {
  type?: string;
}

declare class FormData {
  append(name: string, value: Blob | string, filename?: string): void;
}

declare class DOMException extends Error {
  constructor(message?: string, name?: string);
  readonly name: string;
}

interface AbortSignal {
  readonly aborted: boolean;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

type BodyInit = string | Blob | ArrayBuffer | FormData | URLSearchParams | ReadableStream;

interface RequestInit {
  method?: string;
  headers?: Record<string, string> | Headers;
  body?: BodyInit | null;
  signal?: AbortSignal | null;
}

interface Headers {
  get(name: string): string | null;
  set(name: string, value: string): void;
}

interface Response {
  readonly ok: boolean;
  readonly status: number;
  readonly headers: Headers;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

interface ReadableStream<R = unknown> {
  getReader(): ReadableStreamDefaultReader<R>;
}

interface ReadableStreamDefaultReader<R = unknown> {
  read(): Promise<{ done: boolean; value: R }>;
  releaseLock(): void;
}

declare function setTimeout(callback: () => void, ms: number): unknown;

declare var globalThis: typeof globalThis & {
  fetch: typeof fetch;
};
