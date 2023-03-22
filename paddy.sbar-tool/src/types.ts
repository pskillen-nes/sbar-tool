import {Composition, Patient, Practitioner} from "fhir/r4";

export type CognitoOauthToken = {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export type User = {
  username: string;
  sandboxId: string;
  fhirTenantId: string;
}

export type SbarBundle = [Composition, Patient | undefined, Practitioner | undefined];

export type SbarComponents = {
  situation: string;
  background: string;
  recommendation: string;
  assessment: string;
}
