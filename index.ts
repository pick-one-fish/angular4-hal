import { ModuleWithProviders, NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { RestService } from './src/rest.service';
import { ExternalService } from './src/external.service';
import { ResourceService } from './src/resource.service';

import 'rxjs';
import { AuthInterceptor } from "./src/interceptor/auth-interceptor";
import { TokenConfig } from "./src/domain/token-config";
import { TokenConfigService } from "./src/interceptor/token-config.service";

export { ExternalService } from './src/external.service';
export { RestService } from './src/rest.service';
export { CacheHelper } from './src/cache/cache.helper';
export { EvictStrategy } from './src/cache/cache.helper';
export { ResourceExpire } from './src/cache/cache.helper';

@NgModule({
    imports: [HttpClientModule],
    declarations: [],
    exports: [HttpClientModule],
    providers: [
        ExternalService,
        HttpClient,
        {
            provide: ResourceService,
            useClass: ResourceService,
            deps: [ExternalService]
        }]
})
export class AngularHalModule {
    static forRoot(tokenConfig?: TokenConfig): ModuleWithProviders {
        return {
            ngModule: AngularHalModule,
            providers: [
                ExternalService,
                HttpClient,
                {
                    provide: HTTP_INTERCEPTORS,
                    useClass: AuthInterceptor,
                    multi: true,
                    deps: [TokenConfigService]
                },
                {
                    provide: TokenConfigService,
                    useValue: tokenConfig == null ? '' : tokenConfig
                },
                {
                    provide: ResourceService,
                    useClass: ResourceService,
                    deps: [ExternalService]
                }
            ]
        };
    }
}
