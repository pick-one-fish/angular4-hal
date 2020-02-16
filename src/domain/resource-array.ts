import { ArrayInterface } from './array-interface';
import { Resource } from './resource';
import { Sort } from './sort';

export class ResourceArray<T extends Resource> implements ArrayInterface<T> {

  public proxyUrl: string;
  public rootUrl: string;

  public self_uri: string;
  public first_uri: string;
  public prev_uri: string;
  public next_uri: string;
  public last_uri: string;

  public _embedded;
  public sortInfo: Sort[];
  public totalElements: number;
  public totalPages: number;
  public pageNumber: number;
  public pageSize: number;
  public result: T[] = [];

  push = (el: T) => {
    this.result.push(el);
  };

  length = (): number => {
    return this.result.length;
  };
}
