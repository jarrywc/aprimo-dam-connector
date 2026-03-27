import type { HttpClient } from '../http.js';
import type { ApiResult } from '../types/common.js';
import type { SegmentedUploadOptions, UploadResult } from './types.js';
import { DEFAULT_SEGMENT_SIZE } from './types.js';

interface SegmentInitResponse {
  uri: string;
  token: string;
}

export async function uploadSegmented(
  http: HttpClient,
  file: Blob | ArrayBuffer,
  filename: string,
  options?: SegmentedUploadOptions,
): Promise<ApiResult<UploadResult>> {
  const segmentSize = options?.segmentSize ?? DEFAULT_SEGMENT_SIZE;
  const parallelLimit = options?.parallelLimit ?? 1;
  const totalSize = file instanceof Blob ? file.size : file.byteLength;
  const segmentCount = Math.ceil(totalSize / segmentSize);

  // Step 1: Initiate segmented upload
  const initResult = await http.post<SegmentInitResponse>('/api/core/uploads/segments', {
    body: { filename },
    signal: options?.signal,
  });

  if (!initResult.ok) {
    return initResult as ApiResult<UploadResult>;
  }

  const { uri: uploadUri } = initResult.data;

  // Step 2: Upload segments
  let uploaded = 0;

  const uploadSegment = async (index: number): Promise<void> => {
    const start = index * segmentSize;
    const end = Math.min(start + segmentSize, totalSize);

    let segmentData: Blob;
    if (file instanceof Blob) {
      segmentData = file.slice(start, end);
    } else {
      segmentData = new Blob([file.slice(start, end)]);
    }

    const segmentUrl = `${uploadUri}?index=${index}`;
    const response = await http.rawRequest('PUT', segmentUrl, {
      headers: { 'Content-Type': 'application/octet-stream' },
      body: segmentData,
      signal: options?.signal,
    });

    if (!response.ok) {
      throw new Error(`Segment upload failed at index ${index}: HTTP ${response.status}`);
    }

    uploaded += end - start;
    options?.onProgress?.(uploaded, totalSize);
  };

  // Upload with concurrency control
  if (parallelLimit <= 1) {
    for (let i = 0; i < segmentCount; i++) {
      await uploadSegment(i);
    }
  } else {
    const indices = Array.from({ length: segmentCount }, (_, i) => i);
    await runWithConcurrency(indices, uploadSegment, parallelLimit);
  }

  // Step 3: Commit
  const commitUrl = `${uploadUri}/commit`;
  const commitResponse = await http.rawRequest('POST', commitUrl, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, segmentCount }),
    signal: options?.signal,
  });

  if (!commitResponse.ok) {
    const text = await commitResponse.text().catch(() => '');
    return {
      ok: false,
      status: commitResponse.status,
      error: {
        type: 'upload_commit_failed',
        message: `Segment commit failed: HTTP ${commitResponse.status}`,
        raw: text,
      },
    };
  }

  const commitData = await commitResponse.json() as UploadResult;
  return { ok: true, status: commitResponse.status, data: commitData };
}

async function runWithConcurrency<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  limit: number,
): Promise<void> {
  const executing = new Set<Promise<void>>();

  for (const item of items) {
    const p = fn(item).then(() => {
      executing.delete(p);
    });
    executing.add(p);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
}
