import axios, {AxiosRequestConfig} from "axios";
import {Bundle, FhirResource, OperationOutcome, Resource} from "fhir/r4";

import {ApiResponseError} from "../errors";

type QueryParamType = { [k: string]: string | string[] };

export class FHIRWorksAPI {
  private readonly token: string;
  private readonly apiKey: string;
  private readonly tenantId?: string;
  private readonly baseUrl: string;
  private readonly corsConfig?: { urlPrefix: string };

  constructor(baseUrl: string, token: string, apiKey: string, tenantId?: string | undefined, corsConfig?: { urlPrefix: string }) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.apiKey = apiKey;
    this.tenantId = tenantId;
    this.corsConfig = corsConfig;
  }

  getApiUrl(path: string, queryParams?: QueryParamType): string {
    const url = new URL(this.baseUrl);

    let pathTrimmed = path;
    while (pathTrimmed.startsWith('/'))
      pathTrimmed = pathTrimmed.substring(1);

    // are we in multi-tenant mode?
    if (this.tenantId)
      url.pathname = '/tenant/' + this.tenantId + '/' + pathTrimmed;
    else
      url.pathname = '/' + pathTrimmed;

    // do we have query params?
    if (queryParams) {
      for (let key in queryParams) {
        // Some params have multiple values
        // single value
        if (!Array.isArray(queryParams[key])) {
          url.searchParams.append(key, queryParams[key] as string);
          continue;
        }

        // multi-value
        (queryParams[key] as string[]).forEach(v => url.searchParams.append(key, v));
      }
    }

    // is cors proxy enabled?
    if (this.corsConfig)
      return this.corsConfig.urlPrefix + url.href;

    return url.href;
  }

  private getRequestConfig(): AxiosRequestConfig {
    const headers: any = {
      'Content-Type': 'application/json'
    }

    if (this.token)
      headers['Authorization'] = `Bearer ${this.token}`
    if (this.apiKey)
      headers['X-API-Key'] = this.apiKey;

    return {
      headers,
      // validateStatus => true disables validation (because result is always true)
      validateStatus: () => true
    }
  }

  async pingApi(): Promise<boolean> {
    return axios.get(this.getApiUrl('/any-old-url'))
      .then(() => true)
      .catch(e => {
        if (e.response) {
          // all is good, we don't care about the response, just that it exists
          return true;
        }
        console.error(e.message);
        // We're likely seeing a failure to connect
        return false;
      });
  }

  async listResourceByType<T extends FhirResource>(typeName: string): Promise<Bundle> {
    const url = this.getApiUrl(`/${typeName}`);
    const config = this.getRequestConfig();

    const response = await axios.get(url, config);
    if (response.status !== 200)
      throw ApiResponseError.fromResponse(response);

    const bundle = response.data as Bundle;
    return bundle;
  }

  async getResourceById<T extends FhirResource>(typeName: string, id: string): Promise<T | OperationOutcome> {
    const url = this.getApiUrl(`/${typeName}/${id}`);
    const config = this.getRequestConfig();

    const response = await axios.get(url, config);

    if (response.status === 404)
      return response.data as OperationOutcome;

    if (response.status !== 200)
      throw ApiResponseError.fromResponse(response);

    const resource = response.data as T;
    return resource;
  }

  async searchByName(typeName: string, name: string): Promise<Bundle> {
    const url = this.getApiUrl(`/${typeName}`, {name: encodeURIComponent(name)});
    const config = this.getRequestConfig();

    const response = await axios.get(url, config);

    if (response.status !== 200)
      throw new Error(`Response ${response.status}: ${response.statusText}`)

    // parse response to Bundle object
    const bundle = response.data as Bundle;
    return bundle;
  }

  async searchByIdentifier(typeName: string, identifier: string, identifierSystem?: string): Promise<Bundle> {
    return await this.searchByField(typeName, identifier, identifierSystem, 'identifier');
  }

  async searchByField(typeName: string, identifier: string, identifierSystem?: string, fieldName: string = 'identifier', includes?: string[]): Promise<Bundle> {
    const query = identifierSystem
      ? `${identifierSystem}|${identifier}`
      : identifier;

    const params: QueryParamType = {};

    // add the search field name
    params[fieldName] = query;//encodeURIComponent(query);

    // add the includes
    if (includes && includes.length > 0)
      params['_include'] = includes

    const url = this.getApiUrl(`/${typeName}`, params);
    const config = this.getRequestConfig();

    const response = await axios.get(url, config);

    if (response.status !== 200)
      throw new Error(`Response ${response.status}: ${response.statusText}`)

    // parse response to Bundle object
    const bundle = response.data as Bundle;
    return bundle;
  }

  async getFirstByIdentifier<T extends FhirResource>(typeName: string, identifier: string, identifierSystem?: string): Promise<T | undefined> {
    const bundle = await this.searchByIdentifier(typeName, identifier, identifierSystem);

    if (!bundle || bundle.total === 0)
      return undefined;

    const resource = bundle.entry![0].resource as T;

    return resource;
  }

  async post<T extends Resource>(payload: T, typeName: string): Promise<T> {
    const url = this.getApiUrl(`/${typeName}`);
    const config = this.getRequestConfig();

    const response = await axios.post(url, payload, config)

    if (response.status !== 201)
      throw ApiResponseError.fromResponse(response);

    const r = response.data as T;
    return r;
  }

}
