import React, {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {Alert, Card, Col, Row} from "react-bootstrap";

import {Composition, Patient, Practitioner} from "fhir/r4";

import {SbarBundle, SbarComponents} from "../types";
import config from "../config";
import {getFriendlyErrorMessage} from "../helpers";
import {extractSbarComponents, getChiForPatient, getDefaultNameForPerson, loadSbarResources} from "../fhirHelpers";

import {useAuth} from "../service/Auth";
import {FHIRWorksAPI} from "../service/FHIRWorksAPI";
import {EmpiAPI} from "../service/EmpiAPI";

import BaseScreen from "./BaseScreen";
import BlockLoadingSpinner from "../components/LoadingSpinner";


export default function ViewSBARScreen(): JSX.Element {

  let {id} = useParams();

  const {user, idToken} = useAuth();

  const [sbarBundle, setSbarBundle] = useState<SbarBundle | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [notFound, setNotFound] = useState<boolean>(false);

  const [sbar, setSbar] = useState<SbarComponents | undefined>(undefined);
  const [patient, setPatient] = useState<Patient | undefined>(undefined);
  const [practitioner, setPractitioner] = useState<Practitioner | undefined>(undefined);

  let fhirWorksApi: FHIRWorksAPI | undefined = undefined;
  let empiApi: EmpiAPI | undefined = undefined;

  function loadAPIs() {
    if (!idToken || !user) {
      fhirWorksApi = undefined;
      empiApi = undefined;
      return;
    }

    if (fhirWorksApi === undefined)
      fhirWorksApi = new FHIRWorksAPI(config.fhir.baseUrl, idToken, config.fhir.apiKey, user.fhirTenantId!, config.fhir.corsAnywhere);
    if (empiApi === undefined)
      empiApi = new EmpiAPI(config.empi.baseUrl, idToken, config.empi.apiKey);
  }

  async function loadSbar() {
    try {
      setLoading(true);
      setSbarBundle(undefined);
      setNotFound(false);

      loadAPIs();
      if (!fhirWorksApi || !empiApi)
        return;

      const response = await fhirWorksApi.getResourceById<Composition>('Composition', id!);

      if (response.resourceType !== 'Composition') {
        setNotFound(true);
        return;
      }

      const sbarPack = await loadSbarResources([response, undefined, undefined], empiApi, fhirWorksApi);

      setSbarBundle(sbarPack);

    } catch (e) {
      setSbarBundle(undefined);
      setError(getFriendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // reset the APIs
    fhirWorksApi = undefined;
    empiApi = undefined;
    loadAPIs();
    loadSbar();
  }, [idToken, user]);

  useEffect(() => {
    if (!sbarBundle) {
      setSbar(undefined);
      setPatient(undefined);
      setPractitioner(undefined);
      return;
    }

    const [composition, patient, practitioner] = sbarBundle;
    setSbar(extractSbarComponents(composition));
    setPatient(patient);
    setPractitioner(practitioner);

  }, [sbarBundle]);


  return <BaseScreen pageTitle="View SBAR"
                     pageSubtitle="">

    {error && <Alert title="Error"
                     variant="danger">{error}</Alert>}

    {notFound && <Alert title="Not found"
                        variant="warning">The SBAR with this ID (<code>{id}</code>) was not found.</Alert>}

    {loading && <BlockLoadingSpinner/>}

    {sbarBundle && <>
      <Row>
        <Col sm={12} md={6}>
          <Card className="mt-2">
            <Card.Header>
              <Card.Title>Patient</Card.Title>
            </Card.Header>
            <Card.Body>
              {patient && <>
                <p>{getDefaultNameForPerson(patient, "last-first")} [{getChiForPatient(patient)}]</p>
              </>}
            </Card.Body>
          </Card>
        </Col>

        <Col sm={12} md={6}>
          <Card className="mt-2">
            <Card.Header>
              <Card.Title>Practitioner</Card.Title>
            </Card.Header>
            <Card.Body>
              {practitioner && <>
                <p>{getDefaultNameForPerson(practitioner, "last-first")}</p>
              </>}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {sbar &&
        <>
          <Card className="mt-2">
            <Card.Header>
              <Card.Title>SBAR</Card.Title>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col sm={12} md={6}>
                  <h3>Situation</h3>
                  {sbar.situation}
                </Col>

                <Col sm={12} md={6}>
                  <h3>Background</h3>
                  {sbar.background}
                </Col>
              </Row>

              <Row>
                <Col sm={12} md={6}>
                  <h3>Assessment</h3>
                  {sbar.assessment}
                </Col>

                <Col sm={12} md={6}>
                  <h3>Recommendation</h3>
                  {sbar.recommendation}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </>}
    </>}

  </BaseScreen>
}
