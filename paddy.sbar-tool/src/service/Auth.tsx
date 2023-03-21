import React, {createContext, ReactElement, useContext, useEffect, useState} from "react";
import {Navigate, Route, RouteProps, useLocation} from "react-router-dom";
import {Location} from "history";
import axios, {AxiosRequestConfig} from "axios";
import {useLocalStorage} from "usehooks-ts";

import cryptoRandomString from "crypto-random-string";
import {Buffer} from "buffer";
import queryString from "query-string";
import jwt_decode from "jwt-decode";

import {localStorageKeys} from "../constants";
import {CognitoOauthToken, User} from "../types";
import config from "../config";

export type LoginCallbackParams = {
  returnUrl?: string;
  nonce: string;
  code?: string;
}

export const useAuth = () => {

  const [nonce, setNonce] = useLocalStorage<string>(localStorageKeys.nonce, '');
  // TODO: Ths is bad practise per OWASP
  //https://stackoverflow.com/questions/48983708/where-to-store-access-token-in-react-js
  const [token, setToken] = useLocalStorage<CognitoOauthToken | undefined>(localStorageKeys.token, undefined);
  const [user, setUser] = useLocalStorage<User | undefined>(localStorageKeys.signedInUser, undefined);
  const [idToken, setIdToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!token) {
      setIdToken(undefined);
      return
    }

    setIdToken(token.id_token);
  }, [token])

  function decodeCallbackParams(location: Location): LoginCallbackParams | undefined {
    if (!location.search || location.search.length === 0)
      return undefined;

    const parsed = queryString.parse(location.search);

    const stateBase64 = parsed.state as string;
    const stateString = Buffer.from(stateBase64, 'base64').toString();
    const stateJson = JSON.parse(stateString);

    if (!('nonce' in stateJson))
      return;

    const state = stateJson as LoginCallbackParams;
    state.code = parsed.code as string;

    return state;
  }

  function generateNonce(): string {
    return cryptoRandomString({length: 16, type: 'base64'});
  }

  function authUri(returnUrl?: string): string {
    // Generate a new nonce and state var
    const newNonce = generateNonce()
    setNonce(newNonce);
    const state: LoginCallbackParams = {
      returnUrl: returnUrl,
      nonce: newNonce,
    };
    const stateBase64 = Buffer.from(JSON.stringify(state)).toString('base64');

    // Build the login URL
    const url = new URL(config.auth.auth.tokenHost);
    url.pathname = config.auth.auth.loginPath;
    url.searchParams.set('client_id', config.auth.client.id);
    url.searchParams.set('redirect_uri', config.auth.auth.redirectUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('state', stateBase64);
    url.searchParams.set('scope', config.auth.auth.scopes);

    return url.href;
  }

  function signIn(returnUrl?: string) {
    const url = authUri(returnUrl);
    window.location.href = url;
  }

  async function handleLoginCallback(location: Location) {
    const callbackParams = decodeCallbackParams(location);

    if (!callbackParams)
      throw new Error('Invalid callback params');
    if (callbackParams?.nonce !== nonce)
      throw new Error('Invalid nonce');


    const url = new URL(config.auth.auth.tokenHost);
    url.pathname = config.auth.auth.tokenPath;

    const requestConfig: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },

    }

    // HACK: I think this is a bug (or 'feature') in axios - you cannot change content type if body=FormData
    // const requestBody = new FormData();
    const requestBody = new URLSearchParams();
    requestBody.append('grant_type', 'authorization_code');
    requestBody.append('client_id', config.auth.client.id);
    requestBody.append('scope', config.auth.auth.scopes);
    requestBody.append('redirect_uri', encodeURI(config.auth.auth.redirectUrl));
    requestBody.append('code', callbackParams.code || '');

    try {
      const response = await axios.post(url.href, requestBody, requestConfig);

      const tokenData = response.data as CognitoOauthToken;
      setToken(tokenData);

      if (!tokenData.id_token)
        throw new Error('id_token missing from token data');

      // decode access token, store user data
      const decoded = jwt_decode(tokenData.id_token) as { [k: string]: string };

      const sandboxId = decoded['custom:sandbox-team-id'];
      const fhirTenantId = decoded['custom:tenantId'];
      const username = decoded['cognito:username'];
      setUser({sandboxId, fhirTenantId, username,});

    } catch (error) {
      console.log('Access Token Error', error);
      throw error;
    }

    if (callbackParams.returnUrl) {
      window.location.href = callbackParams.returnUrl;
      return;
    }

    window.location.href = '/';
  }

  async function signUp() {
    throw new Error('not implemented');
    // try {
    //   let authResult = await axios.post('/api/auth/signup', data);
    //   let userObj = {...authResult.data?.createdUser};
    //   userObj.token = authResult.data?.encodedToken;
    //   setUser(userObj);
    //   // toastSuccess("Sign up success")
    // } catch (err) {
    //   console.error(err);
    //   // toastError("An error occurred")
    // }
  }

  function signOut() {
    setUser(undefined);
    setToken(undefined);
  }

  function getAuthToken(): string {
    return token?.id_token || '';
  }

  return {user, signIn, signUp, signOut, handleLoginCallback, decodeCallbackParams, idToken};
};

// export async function awsCallTokenEndpoint(grantType: string, accessToken: string) {
//   const data = {
//     grant_type: grantType,
//     client_id: config.auth.client.id,
//     code: accessToken,
//     scope: 'profile',
//     redirect_uri: config.auth.auth.redirectUrl,
//   };
//
//   const p = {
//     method: 'post',
//     url: config.auth.auth.tokenHost + config.auth.auth.tokenPath,
//     data: JSON.stringify(data),
//
//     auth: {
//       username: config.auth.client.id,
//       password: config.auth.client.secret,
//     },
//   };
//   // debug(`AWS oauth2/token request parameters: ${JSON.stringify(p)}`);
//   const awsResponse = await axios(p);
//   // debug(`AWS oauth2/token response : ${JSON.stringify(awsResponse.data)}`);
//
//   return awsResponse;
// }

const AuthContext = createContext<{ user: any }>({user: undefined});
export const useAuthContext = () => useContext(AuthContext);

export function AuthProvider(props: { children: ReactElement<any, any> }) {
  const auth = useAuth()

  return <AuthContext.Provider value={auth}>
    {props.children}
  </AuthContext.Provider>
}

/*
export function RequireAuth(props: { children: ReactElement<any, any> }) {
  const location = useLocation();
  const auth = useAuthContext();
  if (!auth.user) {
    return <Navigate to='/login' state={{from: location.pathname}}/>
  }
  return props.children
}
*/

export function AuthenticatedRoute(props: RouteProps & {}): JSX.Element {
  const location = useLocation();
  const auth = useAuthContext();
  if (!auth.user) {
    return <Route {...props}
                  element={<Navigate to='/login' state={{from: location.pathname}}/>}/>;
  }
  return <Route {...props}/>
}
