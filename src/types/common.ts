export interface HalLink {
  href: string;
}

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: ApiError };

export interface ApiError {
  type: string;
  message: string;
  raw: unknown;
}

export interface PagedResponse<T> {
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
