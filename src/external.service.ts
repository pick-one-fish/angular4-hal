import { Inject, Injectable } from '@angular/core';
import { ResourceHelper } from './utils/resource-helper';
import { ExternalConfiguration } from "./external-configuration";
import { CacheHelper } from "./cache/cache.helper";
import { ExternalConfigurationHandler } from "./utils/external-configuration.handler";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root',
})
export class ExternalService {

  constructor(@Inject('ExternalConfigurationService') private externalConfigurationService: ExternalConfigurationHandler) {
    ResourceHelper.setProxyUri(externalConfigurationService.getProxyUri());
    ResourceHelper.setRootUri(externalConfigurationService.getRootUri());
    ResourceHelper.setHttp(externalConfigurationService.getHttp());
    CacheHelper.initClearCacheProcess()
  }

  public updateExternalConfigurationHandlerInterface(externalConfigurationService: ExternalConfigurationHandler) {
    this.externalConfigurationService = externalConfigurationService;

    ResourceHelper.setProxyUri(externalConfigurationService.getProxyUri());
    ResourceHelper.setRootUri(externalConfigurationService.getRootUri());
    ResourceHelper.setHttp(externalConfigurationService.getHttp());
  }

  public getExternalConfiguration(): ExternalConfiguration {
    return this.externalConfigurationService.getExternalConfiguration();
  }

  public getProxyUri(): string {
    return this.externalConfigurationService.getProxyUri();
  }

  public getRootUri(): string {
    return this.externalConfigurationService.getRootUri();
  }

  public getURL(): string {
    return ResourceHelper.getURL();
  }

  public getHttp(): HttpClient {
    return ResourceHelper.getHttp();
  }

}
