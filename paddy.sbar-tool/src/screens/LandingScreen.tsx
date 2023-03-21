import React, {useEffect, useState} from "react";
import {Alert, Button, Container} from "react-bootstrap";
import {useLocation} from "react-router-dom";
import {Composition, Patient, Practitioner} from "fhir/r4";

import config from "../config";
import {FHIRWorksAPI} from "../service/FHIRWorksAPI";
import {useAuth} from "../service/Auth";
import {fhirIdentifierSystem} from "../constants";

import {getFriendlyErrorMessage} from "../helpers";
import {getDefaultNameForPerson, getSbarComponents} from "../fhirHelpers";

import AddSbarModal from "../components/modals/AddSbarModal";

function SbarListItem(props: { composition: Composition, patient?: Patient, practitioner?: Practitioner }) {
  return <li>
    <i className="fa fa-file-text-o"></i> {props.patient ? getDefaultNameForPerson(props.patient) : '(unknown patient)'}
  </li>;
}

export default function LandingScreen(): JSX.Element {

  // const location = useLocation();
  const {user, signIn, signOut, idToken, handleLoginCallback, decodeCallbackParams} = useAuth();

  const [sbarList, setSbarList] = useState<[Composition, Patient, Practitioner][]>([]);
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


  async function loadSbarList() {
    loadAPIs();

    if (!fhirWorksApi) return;

    try {
      const bundle = await fhirWorksApi.searchByField(
        'Composition',
        'sbar',
        fhirIdentifierSystem.documentType,
        'type',
        ['Composition:subject', 'Composition:author']
      );

      if (!bundle.entry || bundle.entry.length === 0) {
        setSbarList([]);
        return;
      }

      const compositions = bundle.entry
        .filter(e => e.resource?.resourceType === 'Composition')
        .map(e => e.resource as Composition);

      const sbarList = compositions.map(c => getSbarComponents(bundle, c.id!))
        .filter(pack => pack !== undefined);
      // @ts-ignore - we have filtered out the undefined elements
      setSbarList(sbarList);

    } catch (e) {
      setSbarList([]);
      setError(getFriendlyErrorMessage(e));
    }
  }

  async function handleSbarSubmit(data: Composition) {
    loadAPIs();
    if (!fhirWorksApi) return;

    try {
      const response = await fhirWorksApi.post<Composition>(data, 'Composition');

      loadSbarList();

      setAddSbarVisible(false);
    } catch (e) {
      setError(getFriendlyErrorMessage(e));
    }
  }

  return <>
    <Container>
      <h1>Landing!</h1>

      <Alert variant="danger">
        <h2>To do</h2>
        <ul className="list-unstyled">
          <li><i className="fa fa-check text-success"></i> Navbar</li>
          <li><i className="fa fa-check text-success"></i> Accept API key in an input field</li>
          <li><i className="fa fa-check text-success"></i> Accept Cognito client ID in an input field</li>
          <li><i className="fa fa-check text-success"></i> Getting started instructions</li>
          <li><i className="fa fa-check text-success"></i> Loading spinner for SBARs</li>
          <li><i className="fa fa-check text-success"></i> Delay reloading SBARs on add</li>
          <li><i className="fa fa-check text-success"></i> Display SBARs as table</li>
          <li><i className="fa fa-check text-success"></i> Display SBARs contents ('open' SBAR)</li>
          <li><i className="fa fa-check text-success"></i> Add self as Practitioner</li>
        </ul>
      </Alert>

      {user && <>
        <h2>Welcome {user.username}</h2>
        <Button onClick={() => signOut()}>Sign out</Button>

      </>}

      {!user && <>
        <Button onClick={() => signIn()}>Login</Button>
      </>}

      {error && <Alert title="Error"
                       variant="danger">{error}</Alert>}

      <h2>List patients</h2>
      <p><Button variant="link"
                 onClick={() => loadSbarList()}>Load SBARs</Button></p>
      {sbarList && <>
        <ul className="list-unstyled">
          {sbarList.map(([c, pat, pr]) =>
            <SbarListItem composition={c} patient={pat} practitioner={pr}/>)}
        </ul>
      </>}

      <Button variant="primary"
              onClick={() => setAddSbarVisible(true)}>
        Add SBAR
      </Button>
    </Container>

    <AddSbarModal show={addSbarVisible}
                  onHide={() => setAddSbarVisible(false)}
                  onSubmit={handleSbarSubmit}/>
  </>;
}
