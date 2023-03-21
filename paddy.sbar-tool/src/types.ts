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
