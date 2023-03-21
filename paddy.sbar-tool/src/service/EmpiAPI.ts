import axios, {AxiosRequestConfig} from "axios";
import {Bundle, OperationOutcome, Parameters, Patient} from "fhir/r4";

import {ApiResponseError} from "../errors";

export class EmpiAPI {
  private readonly token: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(baseUrl: string, token: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.apiKey = apiKey;
  }

  getApiUrl(path: string, queryParams?: { [k: string]: string }): string {
    const url = new URL(this.baseUrl);
    url.pathname = path;
    if (queryParams)
      for (let key in queryParams) {
        url.searchParams.set(key, queryParams[key]);
      }

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

  async getPatientByChi(chi: string): Promise<Patient | OperationOutcome> {
    const url = this.getApiUrl(`/Patient/${chi}`);
    const config = this.getRequestConfig();

    const response = await axios.get(url, config);

    if (response.status === 404) {
      if (!('resourceType' in response.data) || response.data['resourceType'] !== 'OperationOutcome')
        response.data['resourceType'] = 'OperationOutcome';
      return response.data as OperationOutcome;
    }

    if (response.status !== 200)
      throw ApiResponseError.fromResponse(response);

    if (!('resourceType' in response.data) || response.data['resourceType'] !== 'Patient')
      response.data['resourceType'] = 'Patient';
    const r = response.data as Patient;
    return r;
  }

  async searchPatientByDemographics(params: Parameters): Promise<Bundle> {
    const url = this.getApiUrl(`/Patient/$match`);
    const config = this.getRequestConfig();

    const response = await axios.post(url, params, config);

    if (response.status !== 200)
      throw ApiResponseError.fromResponse(response);

    const r = response.data as Bundle;
    return r;
  }

  async searchPatientByGender(gender: 'male' | 'female'): Promise<Bundle> {
    const url = this.getApiUrl(`/Patient/$match`);
    const config = this.getRequestConfig();

    const params = {
      resourceType: "Parameters",
      parameter: [
        {
          name: "resource",
          resource: {
            resourceType: "Patient",
            gender: gender,
          }
        }
      ]
    };

    const response = await axios.post(url, params, config);

    if (response.status !== 200)
      throw ApiResponseError.fromResponse(response);

    const r = response.data as Bundle;
    return r;
  }

}
