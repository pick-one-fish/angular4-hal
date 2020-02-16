import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Resource } from '../domain/resource';
import { ResourceArray } from '../domain/resource-array';
import { SubTypeBuilder } from './sub-type-builder';
import * as url from 'url';
import { HalOptions } from "../domain/hal-options";
import { HalParam } from "../domain/hal-param";
import { isNullOrUndefined, isPrimitive } from "util";

export type ResourceExpire<T extends Resource> = { entity: any, expire: number };

export class ResourceHelper {

    private static _headers: HttpHeaders;
    private static proxy_uri: string;
    private static root_uri: string;
    private static http: HttpClient;

    public static get headers(): HttpHeaders {
        if (isNullOrUndefined(this._headers))
            this._headers = new HttpHeaders();
        return this._headers;
    }

    public static set headers(headers: HttpHeaders) {
        this._headers = headers;
    }

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

    static params(httpParams: HttpParams, params?: HalParam[]) {
        if (params) {
            for (const param of params) {
                httpParams = httpParams.append(param.key, param.value.toString());
            }
        }

        return httpParams;
    }

    static resolveRelations(resource: Resource): Object {
        const result: any = {};
        for (const key in resource) {
            if (!isNullOrUndefined(resource[key])) {
                if (ResourceHelper.className(resource[key])
                    .find((className: string) => className === 'Resource') || resource[key]['_links']) {
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

    static instantiateResourceFromResponse<T extends Resource>(entity: T, response: HttpResponse<any>): T {
        if (response.status >= 200 && response.status <= 207) {
            return ResourceHelper.instantiateResource(entity, response.body);
        } else if (response.status == 404) {
            return null;
        }
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

    static instantiateResource<T extends Resource>(entity: T, payload: Object): T {
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

    static setProxyUri(proxy_uri: string) {
        ResourceHelper.proxy_uri = proxy_uri;
    }

    static setRootUri(root_uri: string) {
        ResourceHelper.root_uri = root_uri;
    }

    public static getURL(): string {
        return ResourceHelper.proxy_uri && ResourceHelper.proxy_uri != '' ?
            ResourceHelper.addSlash(ResourceHelper.proxy_uri) :
            ResourceHelper.addSlash(ResourceHelper.root_uri);
    }

    private static addSlash(uri: string): string {
        const uriParsed = url.parse(uri);
        return (isNullOrUndefined(uriParsed.search) && uri && uri[uri.length] !== '/') ? uri + '/' : uri;
    }


    public static getProxy(_url: string): string {
        return (!ResourceHelper.proxy_uri || ResourceHelper.proxy_uri === '') ? _url :
            ResourceHelper.addSlash(_url.replace(ResourceHelper.proxy_uri, ResourceHelper.proxy_uri));
    }

    public static setHttp(http: HttpClient) {
        this.http = http;
    }

    public static getHttp(): HttpClient {
        return this.http;
    }

    public static getRootUri() {
        return this.root_uri;
    }


    public static replaceOrAdd(query: string, field: string, value: string): string {
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
