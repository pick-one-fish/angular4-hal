import { Inject, Injectable } from '@angular/core';
import { ExternalConfigurationHandler } from './utils/external-configuration.handler';
import { ResourceHelper } from './utils/resource-helper';

@Injectable({
  providedIn: 'root',
})
export class ExternalService {

  constructor(
    @Inject('ExternalConfigurationHandler') private externalConfigurationHandler: ExternalConfigurationHandler) {
    ResourceHelper.setProxyUri(externalConfigurationHandler.getProxyUri());
    ResourceHelper.setRootUri(externalConfigurationHandler.getRootUri());
  }

  public updateExternalConfigurationHandler(externalConfigurationHandler: ExternalConfigurationHandler) {
    this.externalConfigurationHandler = externalConfigurationHandler;

    ResourceHelper.setProxyUri(externalConfigurationHandler.getProxyUri());
    ResourceHelper.setRootUri(externalConfigurationHandler.getRootUri());
  }

  public getProxyUri(): string {
    return this.externalConfigurationHandler.getProxyUri();
  }

  public getRootUri(): string {
    return this.externalConfigurationHandler.getRootUri();
  }

}
