import type { HttpClient } from '../http.js';
import type { ApiResult } from '../types/common.js';
import type { UploadOptions, UploadResult } from './types.js';

export async function uploadSmall(
  http: HttpClient,
  file: Blob | ArrayBuffer,
  filename: string,
  options?: UploadOptions,
): Promise<ApiResult<UploadResult>> {
  const blob = file instanceof Blob ? file : new Blob([file]);
  const formData = new FormData();
  formData.append('file', blob, filename);

  return http.post<UploadResult>('/api/core/uploads', {
    body: formData,
    signal: options?.signal,
  });
}
