import { HttpParams } from '@angular/common/http';
import { HalOptions } from '../domain/hal-options';
import { Resource } from '../domain/resource';
import { ResourceArray } from '../domain/resource-array';
import { SubTypeBuilder } from './sub-type-builder';
import { isNullOrUndefined, isPrimitive } from 'util';
import * as url from 'url';

export class ResourceHelper {

  private static _proxyUri: string;
  private static _rootUri: string;

  static optionParams(params: HttpParams, options?: HalOptions): HttpParams {
    if (options) {
      if (options.params) {
        for (const param of options.params) {
          params = params.append(param.key, param.value.toString());
        }
      }
      if (options.size) {
        params = params.append('size', options.size.toString());
      }
      if (options.sort) {
        for (const _sort of options.sort) {
          let sortString = '';
          sortString = _sort.path ? sortString.concat(_sort.path) : sortString;
          sortString = _sort.order ? sortString.concat(',').concat(_sort.order) : sortString;
          params = params.append('sort', sortString);
        }
      }
    }
    return params;
  }

  static resolveRelations(resource: Resource): Object {
    const result: any = {};
    for (const key in resource) {
      if (!isNullOrUndefined(resource[key])) {
        if (ResourceHelper.className(resource[key])
        .find((className: string) => className === 'Resource')) {
          if (resource[key]['_links'])
            result[key] = resource[key]['_links']['self']['href'];
        } else if (Array.isArray(resource[key])) {
          const array: any[] = resource[key];
          if (array) {
            result[key] = [];
            array.forEach((element) => {
              if (isPrimitive(element)) {
                result[key].push(element);
              } else {
                result[key].push(this.resolveRelations(element));
              }
            });
          }
        } else {
          result[key] = resource[key];
        }
      }
    }
    return result as Object;
  }

  static createEmptyResult<T extends Resource>(_embedded: string): ResourceArray<T> {
    const resourceArray: ResourceArray<T> = new ResourceArray<T>();
    if (!isNullOrUndefined(_embedded)) {
      resourceArray._embedded = _embedded;
    }
    return resourceArray;
  }

  static getClassName(obj: any): string {
    const funcNameRegex = /function (.+?)\(/;
    const results = (funcNameRegex).exec(obj.constructor.toString());
    return (results && results.length > 1) ? results[1] : '';
  }

  static className(objProto: any): string[] {
    const classNames = [];
    let obj = Object.getPrototypeOf(objProto);
    let className: string;

    while ((className = ResourceHelper.getClassName(obj)) !== 'Object') {
      classNames.push(className);
      obj = Object.getPrototypeOf(obj);
    }
    return classNames;
  }

  static instantiateResourceCollection<T extends Resource>
  (type: { new(): T }, payload: any, result: ResourceArray<T>, builder?: SubTypeBuilder): ResourceArray<T> {
    if (isNullOrUndefined(result) || isNullOrUndefined(payload[result._embedded])) {
      return;
    }

    for (const embeddedClassName of Object.keys(payload[result._embedded])) {
      const embedded: any = payload[result._embedded];
      const items = embedded[embeddedClassName];
      for (const item of items) {
        let instance: T = new type();
        instance = this.searchSubtypes(builder, embeddedClassName, instance);
        instance = this.instantiateResource(instance, item);
        result.push(instance);
      }
    }

    result.totalElements = payload.page ? payload.page.totalElements : result.length();
    result.totalPages = payload.page ? payload.page.totalPages : 1;
    result.pageNumber = payload.page ? payload.page.number : 1;
    result.pageSize = payload.page ? payload.page.size : 20;

    result.self_uri = payload._links && payload._links.self ? payload._links.self.href : undefined;
    result.next_uri = payload._links && payload._links.next ? payload._links.next.href : undefined;
    result.prev_uri = payload._links && payload._links.prev ? payload._links.prev.href : undefined;
    result.first_uri = payload._links && payload._links.first ? payload._links.first.href : undefined;
    result.last_uri = payload._links && payload._links.last ? payload._links.last.href : undefined;
    return result;
  }

  static searchSubtypes<T extends Resource>(builder: SubTypeBuilder, embeddedClassName: string, instance: T) {
    if (builder && builder.subtypes) {
      const keys = builder.subtypes.keys();
      Array.from(keys).forEach((subtypesKey: string) => {
        if (embeddedClassName.toLocaleLowerCase().startsWith(subtypesKey.toLocaleLowerCase())) {
          const subtype: { new(): any } = builder.subtypes.get(subtypesKey);
          instance = new subtype();
        }
      });
    }
    return instance;
  }

  static instantiateResource<T extends Resource>(entity: T, payload: Object) {
    for (const p in payload) {
      // TODO: array init
      if (!isNullOrUndefined(entity[p]) && isNullOrUndefined(payload[p]) && entity[p].constructor === Array) {
        entity[p] = [];
      } else {
        entity[p] = payload[p];
      }
    }
    return entity;
  }

  static getProxy(_url: string): string {
    return (!ResourceHelper._proxyUri || ResourceHelper._proxyUri === '') ? _url :
      ResourceHelper.addSlash(_url.replace(ResourceHelper._rootUri, ResourceHelper._proxyUri));
  }

  static setProxyUri(proxyUri: string) {
    ResourceHelper._proxyUri = proxyUri
  }

  static getRootUri(): string {
    return this._rootUri;
  }

  static setRootUri(rootUri: string) {
    ResourceHelper._rootUri = rootUri
  }

  static addSlash(uri: string): string {
    const uriParsed = url.parse(uri);
    return (isNullOrUndefined(uriParsed.search) && uri && uri[uri.length] !== '/') ? uri + '/' : uri;
  }

  static getURL(): string {
    return ResourceHelper._proxyUri && ResourceHelper._proxyUri !== '' ?
      ResourceHelper.addSlash(ResourceHelper._proxyUri) :
      ResourceHelper.addSlash(ResourceHelper._rootUri);
  }

  static replaceOrAdd(query: string, field: string, value: string): string {
    if (query) {
      const idx: number = query.indexOf(field);
      const idxNextAmp: number = query.indexOf('&', idx) === -1 ? query.indexOf('/', idx) : query.indexOf('&', idx);

      if (idx !== -1) {
        const searchValue = query.substring(idx, idxNextAmp);
        query = query.replace(searchValue, field + '=' + value);
      } else {
        query = query.concat('&' + field + '=' + value);
      }
    } else {
      query = '?' + field + '=' + value;
    }
    return query;
  }
}
