export abstract class Resource {

  public proxyUrl: string;
  public rootUrl: string;

  public _links: any;
  private _subtypes: Map<string, any>;

  protected constructor() {
  }

  public get subtypes(): Map<string, any> {
    return this._subtypes;
  }

  public set subtypes(value: Map<string, any>) {
    this._subtypes = value;
  }
}
