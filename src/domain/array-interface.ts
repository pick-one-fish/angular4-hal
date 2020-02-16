import { Resource } from './resource';
import { Sort } from './sort';

export interface ArrayInterface<T extends Resource> {

  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  sortInfo: Sort[];
  self_uri: string;
  next_uri: string;
  prev_uri: string;
  first_uri: string;
  last_uri: string;

  push(el: T);
  length(): number;
}
