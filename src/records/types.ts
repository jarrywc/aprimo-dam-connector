import type { HalLink } from '../types/common.js';

export interface LocalizedValue {
  languageId: string;
  value: string;
}

export interface FieldValue {
  dataType?: string;
  localizedValues?: LocalizedValue[];
  values?: string[];
  value?: string;
}

export interface AprimoRecord {
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

export interface ListRecordsParams {
  page?: number;
  pageSize?: number;
  filter?: string;
  orderBy?: string;
  fields?: string[];
  languages?: string[];
}

export interface GetRecordOptions {
  fields?: string[];
  languages?: string[];
}

export interface SearchRecordsParams {
  page?: number;
  pageSize?: number;
  fields?: string[];
  languages?: string[];
}

export interface CreateRecordRequest {
  fields?: Record<string, FieldValue>;
  contentType?: string;
  classifications?: string[];
  fileToken?: string;
}

export interface UpdateRecordRequest {
  fields?: Record<string, FieldValue>;
  classifications?: string[];
  fileToken?: string;
}
