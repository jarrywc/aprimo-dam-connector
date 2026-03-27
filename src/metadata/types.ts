import type { HalLink } from '../types/common.js';

export interface FieldDefinition {
  id: string;
  name: string;
  label?: string;
  dataType: string;
  fieldType?: string;
  isRequired?: boolean;
  isReadOnly?: boolean;
  isSearchable?: boolean;
  options?: FieldOption[];
  defaultValue?: string;
  _links?: Record<string, HalLink>;
}

export interface FieldOption {
  id: string;
  name: string;
  label?: string;
  sortIndex?: number;
}

export interface ContentType {
  id: string;
  name: string;
  label?: string;
  description?: string;
  fieldDefinitions?: string[];
  _links?: Record<string, HalLink>;
}

export interface Classification {
  id: string;
  name: string;
  label?: string;
  parentId?: string;
  hasChildren?: boolean;
  path?: string;
  children?: Classification[];
  _links?: Record<string, HalLink>;
}

export interface ListMetadataParams {
  page?: number;
  pageSize?: number;
  filter?: string;
}
