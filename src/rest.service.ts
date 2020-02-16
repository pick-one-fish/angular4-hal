import { Injector } from '@angular/core';
import { isNullOrUndefined } from 'util';
import { ResourceService } from './resource.service';
import { ResourceArray } from './domain/resource-array';
import { Resource } from './domain/resource';
import { HalOptions } from './domain/hal-options';
import { Observable, of as observableOf, throwError as observableThrowError } from 'rxjs';
import { SubTypeBuilder } from './utils/sub-type-builder';
import { map, mergeMap } from 'rxjs/operators';

export class RestService<T extends Resource> {

  protected resourceArray: ResourceArray<T>;

  readonly type: any;
  readonly resource: string;
  private readonly _embedded: string = '_embedded';
  private resourceService: ResourceService;

  constructor(type: { new(): T }, resource: string, injector: Injector, _embedded?: string) {
    this.type = type;
    this.resource = resource;
    this.resourceService = injector.get(ResourceService);
    if (!isNullOrUndefined(_embedded)) {
      this._embedded = _embedded;
    }
  }

  public getAll(options?: HalOptions): Observable<T[]> {
    const observable: Observable<ResourceArray<Resource>> =
      this.resourceService.getAll(this.type, this.resource, this._embedded, options);
    return observable.pipe(
      mergeMap((resourceArray: ResourceArray<T>) => {
        if (isNullOrUndefined(resourceArray)) {
          this.resourceArray = null;
          return observableOf([]);
        }

        // check the resource not has page
        if (options && options.notPaged
          && !isNullOrUndefined(resourceArray)
          && !isNullOrUndefined(resourceArray.first_uri)) {
          options.notPaged = false;
          options.size = resourceArray.totalElements;
          return this.getAll(options);
        }
        this.resourceArray = resourceArray;
        return observableOf(resourceArray.result);
      }),
    );
  }

  public get(id: any): Observable<T> {
    return this.resourceService.get(this.type, this.resource, id);
  }

  public getBySelfLink(selfLink: string): Observable<T> {
    return this.resourceService.getBySelfLink(this.type, selfLink);
  }

  public search(query: string, options?: HalOptions): Observable<T[]> {
    const observable: Observable<ResourceArray<Resource>> =
      this.resourceService.search(this.type, query, this.resource, this._embedded, options);
    return observable.pipe(
      mergeMap((resourceArray: ResourceArray<T>) => {
        if (isNullOrUndefined(resourceArray)) {
          this.resourceArray = null;
          return observableOf([]);
        }

        // check the resource not has page
        if (options && options.notPaged && !isNullOrUndefined(resourceArray.first_uri)) {
          options.notPaged = false;
          options.size = resourceArray.totalElements;
          return this.search(query, options);
        }
        this.resourceArray = resourceArray;
        return observableOf(resourceArray.result);
      }),
    );
  }

  public searchSingle(query: string, options?: HalOptions): Observable<T> {
    return this.resourceService.searchSingle(this.type, query, this.resource, options);
  }

  public customQuery(query: string, options?: HalOptions): Observable<T[]> {
    const observable: Observable<ResourceArray<Resource>> =
      this.resourceService.customQuery(this.type, query, this.resource, this._embedded, options);
    return observable.pipe(
      mergeMap((resourceArray: ResourceArray<T>) => {
        if (isNullOrUndefined(resourceArray)) {
          this.resourceArray = null;
          return observableOf([]);
        }

        // check the resource not has page
        if (options && options.notPaged && !isNullOrUndefined(resourceArray.first_uri)) {
          options.notPaged = false;
          options.size = resourceArray.totalElements;
          return this.customQuery(query, options);
        }
        this.resourceArray = resourceArray;
        return observableOf(resourceArray.result);
      }),
    );
  }

  protected getByRelationArray(relation: string, builder?: SubTypeBuilder): Observable<T[]> {
    const observable: Observable<ResourceArray<Resource>> =
      this.resourceService.getByRelationArray(this.type, relation, this._embedded, builder);
    return observable.pipe(
      map((resourceArray: ResourceArray<T>) => {
        if (resourceArray === undefined) {
          this.resourceArray = null;
          return;
        }
        this.resourceArray = resourceArray;
        return resourceArray.result;
      }),
    );
  }

  protected getByRelation(relation: string): Observable<T> {
    return this.resourceService.getByRelation(this.type, relation);
  }

  public count(): Observable<number> {
    return this.resourceService.count(this.resource);
  }

  public create(entity: T) {
    return this.resourceService.create(this.resource, entity);
  }

  public update(entity: T) {
    return this.resourceService.update(entity);
  }

  public save(entity: T) {
    if (entity['id'] !== null && entity['id'] !== undefined) {
      return this.update(entity);
    } else {
      return this.create(entity);
    }
  }

  public patch(entity: T) {
    return this.resourceService.patch(entity);
  }

  public delete(entity: T) {
    return this.resourceService.delete(entity);
  }

  public totalElement(): number {
    return isNullOrUndefined(this.resourceArray) ? 0 : this.resourceArray.totalElements;
  }

  public hasFirst(): boolean {
    if (this.resourceArray) {
      return this.resourceService.hasFirst(this.resourceArray);
    }
    return false;
  }

  public hasNext(): boolean {
    if (this.resourceArray) {
      return this.resourceService.hasNext(this.resourceArray);
    }
    return false;
  }

  public hasPrev(): boolean {
    if (this.resourceArray) {
      return this.resourceService.hasPrev(this.resourceArray);
    }
    return false;
  }

  public hasLast(): boolean {
    if (this.resourceArray) {
      return this.resourceService.hasLast(this.resourceArray);
    }
    return false;
  }

  public next(): Observable<T[]> {
    if (this.resourceArray) {
      return this.resourceService.next(this.resourceArray, this.type).pipe(
        map((resourceArray: ResourceArray<T>) => {
          this.resourceArray = resourceArray;
          return resourceArray.result;
        }),
      );
    } else {
      observableThrowError('no resourceArray found');
    }
  }

  public prev(): Observable<T[]> {
    if (this.resourceArray) {
      return this.resourceService.prev(this.resourceArray, this.type).pipe(
        map((resourceArray: ResourceArray<T>) => {
          this.resourceArray = resourceArray;
          return resourceArray.result;
        }),
      );
    } else {
      observableThrowError('no resourceArray found');
    }
  }

  public first(): Observable<T[]> {
    if (this.resourceArray) {
      return this.resourceService.first(this.resourceArray, this.type)
      .pipe(
        map((resourceArray: ResourceArray<T>) => {
          this.resourceArray = resourceArray;
          return resourceArray.result;
        }),
      );
    } else {
      observableThrowError('no resourceArray found');
    }
  }

  public last(): Observable<T[]> {
    if (this.resourceArray) {
      return this.resourceService.last(this.resourceArray, this.type)
      .pipe(
        map((resourceArray: ResourceArray<T>) => {
          this.resourceArray = resourceArray;
          return resourceArray.result;
        }),
      );
    } else {
      observableThrowError('no resourceArray found');
    }
  }

  public page(pageNumber: number): Observable<T[]> {
    if (this.resourceArray) {
      return this.resourceService.page(this.resourceArray, this.type, pageNumber).pipe(
        map((resourceArray: ResourceArray<T>) => {
          this.resourceArray = resourceArray;
          return resourceArray.result;
        }),
      );
    } else {
      observableThrowError('no resourceArray found');
    }
  }
}
