import React, {useEffect, useState} from "react";
import {Alert} from "react-bootstrap";
import {useAuth} from "../service/Auth";

import {getFriendlyErrorMessage} from "../helpers";
import BaseScreen from "./BaseScreen";


export default function LandingScreen(): JSX.Element {

  const {handleLoginCallback, decodeCallbackParams} = useAuth();

  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const state = decodeCallbackParams(window.location);
    if (!state) {
      return;
    }

    if (state.code) {
      handleLoginCallback(window.location)
        .then(() => {
        })
        .catch(e => {
          setError(getFriendlyErrorMessage(e));
        });

      return;
    }
  }, []);

  return <BaseScreen pageTitle="Welcome"
                     pageSubtitle="This tool demonstrates some of the capabilities of the NDP Sandbox environment">

    <Alert variant="danger">
      <h2>To do</h2>
      <ul className="list-unstyled">
        <li><i className="fa-solid fa-check text-success"></i> Accept API key in an input field</li>
        <li><i className="fa-solid fa-check text-success"></i> Accept Cognito client ID in an input field</li>
        <li><i className="fa-solid fa-check text-success"></i> Getting started instructions</li>
        <li><i className="fa-solid fa-check text-success"></i> Delay reloading SBARs on add</li>
        <li><i className="fa-solid fa-check text-success"></i> Add self as Practitioner</li>
      </ul>
    </Alert>

    {error && <Alert title="Error"
                     variant="danger">{error}</Alert>}

  </BaseScreen>;
}
