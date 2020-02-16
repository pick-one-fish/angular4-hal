import { InjectionToken } from "@angular/core";
import { TokenConfig } from "../domain/token-config";

export const TokenConfigService = new InjectionToken<TokenConfig>("TokenConfig");
