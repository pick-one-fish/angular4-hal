import { HttpClient } from '@angular/common/http';
import { ExternalConfiguration } from "../ExternalConfiguration";

export interface ExternalConfigurationHandler {
    deserialize();

    serialize();

    getProxyUri(): string;

    getRootUri(): string;

    getHttp(): HttpClient;


    getExternalConfiguration(): ExternalConfiguration;

    setExternalConfiguration(externalConfiguration: ExternalConfiguration);
}
