import type { HttpClient } from '../http.js';
import type { ApiResult, PagedResponse } from '../types/common.js';
import { paginate } from '../pagination.js';
import type {
  FieldDefinition,
  ContentType,
  Classification,
  ListMetadataParams,
} from './types.js';

export interface MetadataModule {
  getFieldDefinitions(params?: ListMetadataParams): Promise<ApiResult<PagedResponse<FieldDefinition>>>;
  getFieldDefinition(id: string): Promise<ApiResult<FieldDefinition>>;
  getFieldDefinitionsPaged(params?: ListMetadataParams): AsyncGenerator<FieldDefinition[], void, unknown>;
  getContentTypes(params?: ListMetadataParams): Promise<ApiResult<PagedResponse<ContentType>>>;
  getContentType(id: string): Promise<ApiResult<ContentType>>;
  getClassifications(params?: ListMetadataParams): Promise<ApiResult<PagedResponse<Classification>>>;
  getClassification(id: string): Promise<ApiResult<Classification>>;
  getClassificationsPaged(params?: ListMetadataParams): AsyncGenerator<Classification[], void, unknown>;
}

export function createMetadataModule(http: HttpClient): MetadataModule {
  function buildParams(params?: ListMetadataParams): Record<string, string | number | undefined> {
    return {
      page: params?.page,
      pageSize: params?.pageSize,
      filter: params?.filter,
    };
  }

  return {
    async getFieldDefinitions(params?: ListMetadataParams) {
      return http.get<PagedResponse<FieldDefinition>>('/api/core/fielddefinitions', {
        params: buildParams(params),
      });
    },

    async getFieldDefinition(id: string) {
      return http.get<FieldDefinition>(`/api/core/fielddefinitions/${encodeURIComponent(id)}`);
    },

    getFieldDefinitionsPaged(params?: ListMetadataParams) {
      return paginate<FieldDefinition>(http, '/api/core/fielddefinitions', buildParams(params));
    },

    async getContentTypes(params?: ListMetadataParams) {
      return http.get<PagedResponse<ContentType>>('/api/core/contenttypes', {
        params: buildParams(params),
      });
    },

    async getContentType(id: string) {
      return http.get<ContentType>(`/api/core/contenttypes/${encodeURIComponent(id)}`);
    },

    async getClassifications(params?: ListMetadataParams) {
      return http.get<PagedResponse<Classification>>('/api/core/classifications', {
        params: buildParams(params),
      });
    },

    async getClassification(id: string) {
      return http.get<Classification>(`/api/core/classifications/${encodeURIComponent(id)}`);
    },

    getClassificationsPaged(params?: ListMetadataParams) {
      return paginate<Classification>(http, '/api/core/classifications', buildParams(params));
    },
  };
}

export type {
  FieldDefinition,
  ContentType,
  Classification,
  ListMetadataParams,
} from './types.js';
