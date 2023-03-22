import React, {useEffect, useState} from "react";
import {Alert, Button} from "react-bootstrap";
import {Composition} from "fhir/r4";

import config from "../config";
import {FHIRWorksAPI} from "../service/FHIRWorksAPI";
import {useAuth} from "../service/Auth";

import {getFriendlyErrorMessage} from "../helpers";

import AddSbarModal from "../components/modals/AddSbarModal";
import BaseScreen from "./BaseScreen";


export default function LandingScreen(): JSX.Element {

  const {user, idToken, handleLoginCallback, decodeCallbackParams} = useAuth();

  const [error, setError] = useState<string | undefined>(undefined);

  const [addSbarVisible, setAddSbarVisible] = useState<boolean>(false);

  let fhirWorksApi: FHIRWorksAPI | undefined = undefined;

  function loadAPIs() {
    if (!idToken || !user) {
      fhirWorksApi = undefined;
      return;
    }

    if (fhirWorksApi === undefined)
      fhirWorksApi = new FHIRWorksAPI(config.fhir.baseUrl, idToken, config.fhir.apiKey, user.fhirTenantId!, config.fhir.corsAnywhere);
  }

  useEffect(() => {
    fhirWorksApi = undefined;
    loadAPIs();
  }, [idToken, user]);


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

  async function handleSbarSubmit(data: Composition) {
    loadAPIs();
    if (!fhirWorksApi) return;

    try {
      const response = await fhirWorksApi.post<Composition>(data, 'Composition');

      // loadSbarList();

      setAddSbarVisible(false);
    } catch (e) {
      setError(getFriendlyErrorMessage(e));
    }
  }

  return <BaseScreen pageTitle="Welcome"
                     pageSubtitle="This tool demonstrates some of the capabilities of the NDP Sandbox environment">

    <Alert variant="danger">
      <h2>To do</h2>
      <ul className="list-unstyled">
        <li><i className="fa-solid fa-check text-success"></i> Navbar</li>
        <li><i className="fa-solid fa-check text-success"></i> Accept API key in an input field</li>
        <li><i className="fa-solid fa-check text-success"></i> Accept Cognito client ID in an input field</li>
        <li><i className="fa-solid fa-check text-success"></i> Getting started instructions</li>
        <li><i className="fa-solid fa-check text-success"></i> Loading spinner for SBARs</li>
        <li><i className="fa-solid fa-check text-success"></i> Delay reloading SBARs on add</li>
        <li><i className="fa-solid fa-check text-success"></i> Display SBARs as table</li>
        <li><i className="fa-solid fa-check text-success"></i> Display SBARs contents ('open' SBAR)</li>
        <li><i className="fa-solid fa-check text-success"></i> Add self as Practitioner</li>
      </ul>
    </Alert>

    {error && <Alert title="Error"
                     variant="danger">{error}</Alert>}


      <Button variant="primary"
              onClick={() => setAddSbarVisible(true)}>
        Add SBAR
      </Button>
    </Container>

    <AddSbarModal show={addSbarVisible}
                  onHide={() => setAddSbarVisible(false)}
                  onSubmit={handleSbarSubmit}/>
  </BaseScreen>;
}
