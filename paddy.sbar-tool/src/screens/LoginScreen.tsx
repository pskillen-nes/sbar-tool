import React, {useEffect, useState} from "react";
import {Alert, Button, Form} from "react-bootstrap";
import {useLocation} from "react-router-dom";

import {useAuth} from "../service/Auth";
import {getFriendlyErrorMessage} from "../helpers";

export default function LoginScreen(): JSX.Element {
  const location = useLocation();

  const {signIn, handleLoginCallback, decodeCallbackParams} = useAuth();

  const [error, setError] = useState<string>();
  type LoginState = 'not-ready' | 'ready-to-login' | 'handling-login' | 'logged-in' | 'error';
  const [loginState, setLoginState] = useState<LoginState>('not-ready');

  function redirectToLogin() {
    signIn();
    /* const url = authUri();

     // Store the nonce
     // setNonce(newNonce);

     // Redirect to login service
     window.location.href = url;*/
  }

  useEffect(() => {
    const state = decodeCallbackParams(location);
    if (!state) {
      setLoginState('ready-to-login');
      return;
    }

    if (state.code) {
      setLoginState('handling-login');
      handleLoginCallback(location)
        .then(() => {
          setLoginState('logged-in');
        })
        .catch(e => {
          setLoginState('error');
          setError(getFriendlyErrorMessage(e));
        });

      return;
    }

  }, []);

  return <>
    <h1>Login!</h1>

    {error && <Alert title="Error"
                     variant="danger">
      {error}
    </Alert>}

    {loginState === 'ready-to-login' && <Form>
      <Button onClick={redirectToLogin}>Login</Button>
    </Form>}
  </>
}
