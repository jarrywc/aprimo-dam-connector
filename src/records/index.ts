import type { HttpClient } from '../http.js';
import type { ApiResult, PagedResponse } from '../types/common.js';
import { paginate } from '../pagination.js';
import type {
  AprimoRecord,
  ListRecordsParams,
  GetRecordOptions,
  SearchRecordsParams,
  CreateRecordRequest,
  UpdateRecordRequest,
} from './types.js';

export interface RecordsModule {
  list(params?: ListRecordsParams): Promise<ApiResult<PagedResponse<AprimoRecord>>>;
  get(id: string, options?: GetRecordOptions): Promise<ApiResult<AprimoRecord>>;
  search(query: string, params?: SearchRecordsParams): Promise<ApiResult<PagedResponse<AprimoRecord>>>;
  create(request: CreateRecordRequest): Promise<ApiResult<AprimoRecord>>;
  update(id: string, request: UpdateRecordRequest): Promise<ApiResult<AprimoRecord>>;
  delete(id: string): Promise<ApiResult<void>>;
  listPaged(params?: ListRecordsParams): AsyncGenerator<AprimoRecord[], void, unknown>;
}

export function createRecordsModule(http: HttpClient): RecordsModule {
  function buildSelectHeaders(
    fields?: string[],
    languages?: string[],
  ): Record<string, string> {
    const headers: Record<string, string> = {};
    if (fields?.length) {
      headers['select-record'] = fields.join(',');
    }
    if (languages?.length) {
      headers['select-languages'] = languages.join(',');
    }
    return headers;
  }

  return {
    async list(params?: ListRecordsParams) {
      const queryParams: Record<string, string | number | undefined> = {
        page: params?.page,
        pageSize: params?.pageSize,
        filter: params?.filter,
        orderBy: params?.orderBy,
      };
      return http.get<PagedResponse<AprimoRecord>>('/api/core/records', {
        params: queryParams,
        headers: buildSelectHeaders(params?.fields, params?.languages),
      });
    },

    async get(id: string, options?: GetRecordOptions) {
      return http.get<AprimoRecord>(`/api/core/records/${encodeURIComponent(id)}`, {
        headers: buildSelectHeaders(options?.fields, options?.languages),
      });
    },

    async search(query: string, params?: SearchRecordsParams) {
      const queryParams: Record<string, string | number | undefined> = {
        search: query,
        page: params?.page,
        pageSize: params?.pageSize,
      };
      return http.get<PagedResponse<AprimoRecord>>('/api/core/records', {
        params: queryParams,
        headers: buildSelectHeaders(params?.fields, params?.languages),
      });
    },

    async create(request: CreateRecordRequest) {
      return http.post<AprimoRecord>('/api/core/records', { body: request });
    },

    async update(id: string, request: UpdateRecordRequest) {
      return http.put<AprimoRecord>(`/api/core/records/${encodeURIComponent(id)}`, {
        body: request,
      });
    },

    async delete(id: string) {
      return http.delete<void>(`/api/core/records/${encodeURIComponent(id)}`);
    },

    listPaged(params?: ListRecordsParams) {
      const queryParams: Record<string, string | number | undefined> = {
        page: params?.page,
        pageSize: params?.pageSize,
        filter: params?.filter,
        orderBy: params?.orderBy,
      };
      return paginate<AprimoRecord>(http, '/api/core/records', queryParams);
    },
  };
}

export type {
  AprimoRecord,
  ListRecordsParams,
  GetRecordOptions,
  SearchRecordsParams,
  CreateRecordRequest,
  UpdateRecordRequest,
} from './types.js';
