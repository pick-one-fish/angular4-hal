import { Sort } from './sort';
import { HalParam } from './hal-param';

export interface HalOptions {
  notPaged?: boolean,
  size?: number,
  sort?: Sort[],
  params?: HalParam[]
}
