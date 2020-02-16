import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Resource } from './domain/resource';
import { HalOptions } from './domain/hal-options';
import { Observable, throwError as observableThrowError } from 'rxjs';
import { ResourceArray } from './domain/resource-array';
import { SubTypeBuilder } from './utils/sub-type-builder';
import { Sort } from './domain/sort';
import { ResourceHelper } from './utils/resource-helper';
import { catchError, map } from 'rxjs/operators';
import * as url from 'url';
import { ExternalService } from './external.service';

@Injectable({
  providedIn: 'root',
})
export class ResourceService {

  constructor(private http: HttpClient, private externalService: ExternalService) {
  }

  public getAll<T extends Resource>
  (type: { new(): T }, resource: string, _embedded: string, options?: HalOptions): Observable<ResourceArray<T>> {
    const uri = this.getResourceUrl(resource);
    const params = ResourceHelper.optionParams(new HttpParams(), options);
    const result: ResourceArray<T> = ResourceHelper.createEmptyResult<T>(_embedded);

    result.proxyUrl = this.externalService.getProxyUri();
    result.rootUrl = this.externalService.getRootUri();
    result.sortInfo = options ? options.sort : undefined;
    const observable = this.http.get(uri, {
      headers: new HttpHeaders(),
      params: params,
    });
    return observable.pipe(
      map(response => ResourceHelper.instantiateResourceCollection(type, response, result)),
      catchError(error => observableThrowError(error)),
    );
  }

  public get<T extends Resource>(type: { new(): T }, resource: string, id: any): Observable<T> {
    const uri = this.getResourceUrl(resource).concat('/', id);
    const result: T = new type();

    result.proxyUrl = this.externalService.getProxyUri();
    result.rootUrl = this.externalService.getRootUri();
    const observable = this.http.get(uri, {headers: new HttpHeaders()});
    return observable.pipe(
      map(data => ResourceHelper.instantiateResource(result, data)),
      catchError(error => observableThrowError(error)),
    );
  }

  public getBySelfLink<T extends Resource>(type: { new(): T }, resourceLink: string): Observable<T> {
    const result: T = new type();

    result.proxyUrl = this.externalService.getProxyUri();
    result.rootUrl = this.externalService.getRootUri();
    const observable = this.http.get(resourceLink, {headers: new HttpHeaders()});
    return observable.pipe(
      map(data => ResourceHelper.instantiateResource(result, data)),
      catchError(error => observableThrowError(error)),
    );
  }

  public search<T extends Resource>
  (type: { new(): T }, query: string, resource: string, _embedded: string, options?: HalOptions)
    : Observable<ResourceArray<T>> {
    const uri = this.getResourceUrl(resource).concat('/search/', query);
    const params = ResourceHelper.optionParams(new HttpParams(), options);
    const result: ResourceArray<T> = ResourceHelper.createEmptyResult<T>(_embedded);

    result.proxyUrl = this.externalService.getProxyUri();
    result.rootUrl = this.externalService.getRootUri();
    const observable = this.http.get(uri, {
      headers: new HttpHeaders(),
      params: params,
    });
    return observable.pipe(
      map(response => ResourceHelper.instantiateResourceCollection(type, response, result)),
      catchError(error => observableThrowError(error)),
    );
  }

  public searchSingle<T extends Resource>(
    type: { new(): T }, query: string, resource: string, options?: HalOptions): Observable<T> {
    const uri = this.getResourceUrl(resource).concat('/search/', query);
    const params = ResourceHelper.optionParams(new HttpParams(), options);
    const result: T = new type();

    result.proxyUrl = this.externalService.getProxyUri();
    result.rootUrl = this.externalService.getRootUri();
    const observable = this.http.get(uri, {
      headers: new HttpHeaders(),
      params: params,
    });
    return observable.pipe(
      map(response => ResourceHelper.instantiateResource(result, response)),
      catchError(error => observableThrowError(error)),
    );
  }

  public customQuery<T extends Resource>
  (type: { new(): T }, query: string, resource: string, _embedded: string, options?: HalOptions)
    : Observable<ResourceArray<T>> {
    const uri = this.getResourceUrl(resource + query);
    const params = ResourceHelper.optionParams(new HttpParams(), options);
    const result: ResourceArray<T> = ResourceHelper.createEmptyResult<T>(_embedded);

    result.proxyUrl = this.externalService.getProxyUri();
    result.rootUrl = this.externalService.getRootUri();
    const observable = this.http.get(uri, {
      headers: new HttpHeaders(),
      params: params,
    });
    return observable.pipe(
      map(response => ResourceHelper.instantiateResourceCollection(type, response, result)),
      catchError(error => observableThrowError(error)),
    );
  }

  public getByRelation<T extends Resource>(type: { new(): T }, resourceLink: string): Observable<T> {
    const result: T = new type();

    result.proxyUrl = this.externalService.getProxyUri();
    result.rootUrl = this.externalService.getRootUri();
    const observable = this.http.get(resourceLink, {headers: new HttpHeaders()});
    return observable.pipe(
      map(data => ResourceHelper.instantiateResource(result, data)),
      catchError(error => observableThrowError(error)),
    );
  }

  public getByRelationArray<T extends Resource>
  (type: { new(): T }, resourceLink: string, _embedded: string, builder?: SubTypeBuilder)
    : Observable<ResourceArray<T>> {
    const result: ResourceArray<T> = ResourceHelper.createEmptyResult<T>(_embedded);

    result.proxyUrl = this.externalService.getProxyUri();
    result.rootUrl = this.externalService.getRootUri();
    const observable = this.http.get(resourceLink, {headers: new HttpHeaders()});
    return observable.pipe(
      map(response => ResourceHelper.instantiateResourceCollection(type, response, result, builder)),
      catchError(error => observableThrowError(error)),
    );
  }

  public count(resource: string): Observable<number> {
    const uri = this.getResourceUrl(resource).concat('/search/countAll');

    return this.http.get(uri, {
      headers: new HttpHeaders(),
      observe: 'body',
    }).pipe(
      map((response: Response) => Number(response.body)),
      catchError(error => observableThrowError(error)),
    );
  }

  public create<T extends Resource>(selfResource: string, entity: T) {
    const uri = ResourceHelper.getURL() + selfResource;
    const payload = ResourceHelper.resolveRelations(entity);

    entity.proxyUrl = this.externalService.getProxyUri();
    entity.rootUrl = this.externalService.getRootUri();
    const observable = this.http.post(uri, payload, {
      headers: new HttpHeaders(),
      observe: 'response',
    });
    return observable.pipe(
      map((response: HttpResponse<string>) => {
        if (response.status >= 200 && response.status <= 207) {
          return ResourceHelper.instantiateResource(entity, response.body);
        } else if (response.status === 500) {
          const body: any = response.body;
          return observableThrowError(body.error);
        }
      }),
      catchError(error => observableThrowError(error)),
    );
  }

  public update<T extends Resource>(entity: T) {
    const uri = ResourceHelper.getProxy(entity._links.self.href);
    const payload = ResourceHelper.resolveRelations(entity);

    entity.proxyUrl = this.externalService.getProxyUri();
    entity.rootUrl = this.externalService.getRootUri();
    const observable = this.http.put(uri, payload, {
      headers: new HttpHeaders(),
      observe: 'response',
    });
    return observable.pipe(map((response: HttpResponse<string>) => {
      if (response.status >= 200 && response.status <= 207) {
        return ResourceHelper.instantiateResource(entity, response.body);
      } else if (response.status === 500) {
        const body: any = response.body;
        return observableThrowError(body.error);
      }
    }), catchError(error => observableThrowError(error)));
  }

  public patch<T extends Resource>(entity: T) {
    const uri = ResourceHelper.getProxy(entity._links.self.href);
    const payload = ResourceHelper.resolveRelations(entity);

    entity.proxyUrl = this.externalService.getProxyUri();
    entity.rootUrl = this.externalService.getRootUri();
    const observable = this.http.patch(uri, payload, {
      headers: new HttpHeaders(),
      observe: 'response',
    });
    return observable.pipe(
      map((response: HttpResponse<string>) => {
        if (response.status >= 200 && response.status <= 207) {
          return ResourceHelper.instantiateResource(entity, response.body);
        } else if (response.status === 500) {
          const body: any = response.body;
          return observableThrowError(body.error);
        }
      }),
      catchError(error => observableThrowError(error)),
    );
  }

  public delete<T extends Resource>(entity: T): Observable<Object> {
    const uri = ResourceHelper.getProxy(entity._links.self.href);
    return this.http.delete(uri, {headers: new HttpHeaders()}).pipe(
      catchError(error => observableThrowError(error)),
    );
  }

  public hasNext<T extends Resource>(resourceArray: ResourceArray<T>): boolean {
    return resourceArray.next_uri !== undefined;
  }

  public hasPrev<T extends Resource>(resourceArray: ResourceArray<T>): boolean {
    return resourceArray.prev_uri !== undefined;
  }

  public hasFirst<T extends Resource>(resourceArray: ResourceArray<T>): boolean {
    return resourceArray.first_uri !== undefined;
  }

  public hasLast<T extends Resource>(resourceArray: ResourceArray<T>): boolean {
    return resourceArray.last_uri !== undefined;
  }

  public next<T extends Resource>(resourceArray: ResourceArray<T>, type: { new(): T }): Observable<ResourceArray<T>> {
    if (resourceArray.next_uri) {
      return this.http.get(ResourceHelper.getProxy(resourceArray.next_uri), {
        headers: new HttpHeaders(),
      }).pipe(
        map(response => {
          const result: ResourceArray<T> = ResourceHelper.createEmptyResult<T>(resourceArray._embedded);
          result.sortInfo = resourceArray.sortInfo;
          ResourceHelper.instantiateResourceCollection(type, response, result);
          return result;
        }),
        catchError(error => observableThrowError(error)),
      );
    }
    return observableThrowError('no next defined');
  }

  public prev<T extends Resource>(resourceArray: ResourceArray<T>, type: { new(): T }): Observable<ResourceArray<T>> {
    if (resourceArray.prev_uri) {
      return this.http.get(ResourceHelper.getProxy(resourceArray.prev_uri), {
        headers: new HttpHeaders(),
      }).pipe(
        map(response => {
          const result: ResourceArray<T> = ResourceHelper.createEmptyResult<T>(resourceArray._embedded);
          result.sortInfo = resourceArray.sortInfo;
          ResourceHelper.instantiateResourceCollection(type, response, result);
          return result;
        }),
        catchError(error => observableThrowError(error)),
      );
    }
  }

  public first<T extends Resource>(resourceArray: ResourceArray<T>, type: { new(): T }): Observable<ResourceArray<T>> {
    if (resourceArray.first_uri) {
      return this.http.get(ResourceHelper.getProxy(resourceArray.first_uri), {
        headers: new HttpHeaders(),
      }).pipe(
        map(response => {
          const result: ResourceArray<T> = ResourceHelper.createEmptyResult<T>(resourceArray._embedded);
          result.sortInfo = resourceArray.sortInfo;
          ResourceHelper.instantiateResourceCollection(type, response, result);
          return result;
        }),
        catchError(error => observableThrowError(error)),
      );
    }
  }

  public last<T extends Resource>(resourceArray: ResourceArray<T>, type: { new(): T }): Observable<ResourceArray<T>> {
    if (resourceArray.last_uri) {
      return this.http.get(ResourceHelper.getProxy(resourceArray.last_uri), {
        headers: new HttpHeaders(),
      }).pipe(
        map(response => {
          const result: ResourceArray<T> = ResourceHelper.createEmptyResult<T>(resourceArray._embedded);
          result.sortInfo = resourceArray.sortInfo;
          ResourceHelper.instantiateResourceCollection(type, response, result);
          return result;
        }),
        catchError(error => observableThrowError(error)),
      );
    }
  }

  public page<T extends Resource>(resourceArray: ResourceArray<T>, type: { new(): T }, pageNumber: number):
    Observable<ResourceArray<T>> {
    resourceArray.self_uri = resourceArray.self_uri.replace('{?page,size,sort}', '');
    resourceArray.self_uri = resourceArray.self_uri.replace('{&sort}', '');
    const urlParsed = url.parse(ResourceHelper.getProxy(resourceArray.self_uri));
    let query: string = ResourceHelper.replaceOrAdd(urlParsed.query, 'size', resourceArray.pageSize.toString());
    query = ResourceHelper.replaceOrAdd(query, 'page', pageNumber.toString());

    let uri = urlParsed.query ?
      ResourceHelper.getProxy(resourceArray.self_uri).replace(urlParsed.query, query) :
      ResourceHelper.getProxy(resourceArray.self_uri).concat(query);
    if (resourceArray.sortInfo) {
      for (const item of resourceArray.sortInfo) {
        uri = uri.concat('&sort=', item.path, ',', item.order);
      }
    }
    return this.http.get(uri, {headers: new HttpHeaders()}).pipe(
      map(response => {
        const result: ResourceArray<T> = ResourceHelper.createEmptyResult<T>(resourceArray._embedded);
        result.sortInfo = resourceArray.sortInfo;
        ResourceHelper.instantiateResourceCollection(type, response, result);
        return result;
      }),
      catchError(error => observableThrowError(error)),
    );
  }

  public sortElements<T extends Resource>(resourceArray: ResourceArray<T>, type: { new(): T }, ...sort: Sort[]):
    Observable<ResourceArray<T>> {
    resourceArray.self_uri = resourceArray.self_uri.replace('{?page,size,sort}', '');
    resourceArray.self_uri = resourceArray.self_uri.replace('{&sort}', '');
    let uri = ResourceHelper.getProxy(resourceArray.self_uri)
    .concat('?', 'size=', resourceArray.pageSize.toString(), '&page=', resourceArray.pageNumber.toString());
    if (resourceArray.sortInfo) {
      for (const item of resourceArray.sortInfo) {
        uri = uri.concat('&sort=', item.path, ',', item.order);
      }
    }
    return this.http.get(uri, {headers: new HttpHeaders()}).pipe(
      map(response => {
        const result: ResourceArray<T> = ResourceHelper.createEmptyResult<T>(resourceArray._embedded);
        result.sortInfo = sort;
        ResourceHelper.instantiateResourceCollection(type, response, result);
        return result;
      }),
      catchError(error => observableThrowError(error)));
  }

  public size<T extends Resource>(resourceArray: ResourceArray<T>, type: { new(): T }, size: number):
    Observable<ResourceArray<T>> {
    let uri = ResourceHelper.getProxy(resourceArray.self_uri).concat('?', 'size=', size.toString());
    if (resourceArray.sortInfo) {
      for (const item of resourceArray.sortInfo) {
        uri = uri.concat('&sort=', item.path, ',', item.order);
      }
    }
    return this.http.get(uri, {headers: new HttpHeaders()}).pipe(
      map(response => {
        const result: ResourceArray<T> = ResourceHelper.createEmptyResult<T>(resourceArray._embedded);
        result.sortInfo = resourceArray.sortInfo;
        ResourceHelper.instantiateResourceCollection(type, response, result);
        return result;
      }),
      catchError(error => observableThrowError(error)));
  }

  private getResourceUrl(resource?: string): string {
    let _url = ResourceHelper.getURL();
    if (!_url.endsWith('/')) {
      _url = _url.concat('/');
    }
    if (resource) {
      _url = _url.concat(resource);
    }
    return _url;
  }
}
