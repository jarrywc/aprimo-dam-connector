import type { HttpClient } from '../http.js';
import type { ApiResult } from '../types/common.js';
import type { UploadResult, SegmentedUploadOptions } from './types.js';
import { SEGMENTED_THRESHOLD } from './types.js';
import { uploadSmall } from './small-upload.js';
import { uploadSegmented } from './segmented-upload.js';

export interface UploadsModule {
  upload(
    file: Blob | ArrayBuffer,
    filename: string,
    options?: SegmentedUploadOptions & { forceSegmented?: boolean },
  ): Promise<ApiResult<UploadResult>>;
  uploadSmall(
    file: Blob | ArrayBuffer,
    filename: string,
    options?: SegmentedUploadOptions,
  ): Promise<ApiResult<UploadResult>>;
  uploadSegmented(
    file: Blob | ArrayBuffer,
    filename: string,
    options?: SegmentedUploadOptions,
  ): Promise<ApiResult<UploadResult>>;
}

export function createUploadsModule(http: HttpClient): UploadsModule {
  return {
    async upload(file, filename, options) {
      const size = file instanceof Blob ? file.size : file.byteLength;
      if (options?.forceSegmented || size > SEGMENTED_THRESHOLD) {
        return uploadSegmented(http, file, filename, options);
      }
      return uploadSmall(http, file, filename, options);
    },

    uploadSmall: (file, filename, options) => uploadSmall(http, file, filename, options),
    uploadSegmented: (file, filename, options) => uploadSegmented(http, file, filename, options),
  };
}

export type { UploadResult, UploadOptions, SegmentedUploadOptions } from './types.js';
