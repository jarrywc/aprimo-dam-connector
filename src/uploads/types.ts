export interface UploadResult {
  token: string;
  uri?: string;
}

export interface UploadOptions {
  signal?: AbortSignal;
}

export interface SegmentedUploadOptions extends UploadOptions {
  segmentSize?: number;
  parallelLimit?: number;
  onProgress?: (uploaded: number, total: number) => void;
}

/** Default segment size: 20 MB */
export const DEFAULT_SEGMENT_SIZE = 20 * 1024 * 1024;

/** Threshold for auto-routing to segmented upload */
export const SEGMENTED_THRESHOLD = DEFAULT_SEGMENT_SIZE;
