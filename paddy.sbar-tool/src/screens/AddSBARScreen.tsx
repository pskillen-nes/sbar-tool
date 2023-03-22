import React, {useEffect, useState} from "react";

import BaseScreen from "./BaseScreen";
import {Composition, Patient, Practitioner} from "fhir/r4";
import {buildSBAR, getDefaultNameForPerson} from "../fhirHelpers";
import {Alert, Button, Col, Form, InputGroup, Row, Spinner} from "react-bootstrap";
import ChoosePatientModal from "../components/modals/ChoosePatientModal";
import ChoosePractitionerModal from "../components/modals/ChoosePractitionerModal";
import {getFriendlyErrorMessage} from "../helpers";
import {useAuth} from "../service/Auth";
import {FHIRWorksAPI} from "../service/FHIRWorksAPI";
import config from "../config";
import {useNavigate} from "react-router-dom";


export default function AddSBARScreen(): JSX.Element {

  const {user, idToken} = useAuth();
  const navigate = useNavigate();

  const [formValidated, setFormValidated] = useState<boolean>(false);

  const [selectPatientVisible, setSelectPatientVisible] = useState<boolean>(false);
  const [selectPractitionerVisible, setSelectPractitionerVisible] = useState<boolean>(false);

  const [patient, setPatient] = useState<Patient>();
  const [practitioner, setPractitioner] = useState<Practitioner>();
  const [situation, setSituation] = useState<string>('');
  const [background, setBackground] = useState<string>('');
  const [assessment, setAssessment] = useState<string>('');
  const [recommendation, setRecommendation] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);

  const [error, setError] = useState<string | undefined>(undefined);

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

  async function handleSubmit(event: any) {
    event.preventDefault();
    event.stopPropagation();
    setLoading(true);

    const form = event.currentTarget;

    // Failure path
    if (form.checkValidity() === false || !patient || !practitioner) {
      setFormValidated(true);
      return;
    }

    // Success path
    setFormValidated(false);

    try {
      // TODO: Use patient CHI as ID
      const data: Composition = buildSBAR(
        patient.id!,
        practitioner.id!,
        situation,
        background,
        assessment,
        recommendation,
      );

      loadAPIs();
      if (!fhirWorksApi) return;

      const response = await fhirWorksApi.post<Composition>(data, 'Composition');
      const id = response.id;
      navigate(`/sbar/${id}`);

    } catch (e) {
      setError(getFriendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }


  return <BaseScreen pageTitle="Add SBAR"
                     pageSubtitle="">

    <Form onSubmit={handleSubmit}
          noValidate
          validated={formValidated}>

      <h3>SBAR details</h3>
      <Form.Group className="form-group mb-3">

        <Form.Label>Patient</Form.Label>
        <InputGroup hasValidation>
          <Form.Control value={patient && getDefaultNameForPerson(patient, 'first-last')}
                        isInvalid={formValidated && !patient}
                        readOnly
          />
          <Button onClick={() => setSelectPatientVisible(true)}>
            <i className="fa-solid fa-search"></i>
          </Button>
          <Form.Control.Feedback type="invalid">Please select a patient</Form.Control.Feedback>
        </InputGroup>
      </Form.Group>
      <Form.Group className="form-group mb-3">

        <Form.Label>Practitioner</Form.Label>
        <InputGroup hasValidation>
          <Form.Control value={practitioner && getDefaultNameForPerson(practitioner, 'first-last')}
                        isInvalid={formValidated && !practitioner}
                        readOnly/>
          <Button onClick={() => setSelectPractitionerVisible(true)}>
            <i className="fa-solid fa-search"></i>
          </Button>
          <Form.Control.Feedback type="invalid">Please select a practitioner</Form.Control.Feedback>
        </InputGroup>
      </Form.Group>

      <h3 className="mt-3">Your assessment</h3>
      <Row>
        <Col sm={12} md={6}>
          <Form.Group className="form-group mb-3">

            <Form.Label>Situation</Form.Label>
            <Form.Control as="textarea"
                          rows={3}
                          value={situation}
                          onChange={(e) => setSituation(e.target.value)}

            />
          </Form.Group>
        </Col>
        <Col sm={12} md={6}>
          <Form.Group className="form-group mb-3">

            <Form.Label>Background</Form.Label>
            <Form.Control as="textarea"
                          rows={3}
                          value={background}
                          onChange={(e) => setBackground(e.target.value)}

            />
          </Form.Group>
        </Col>

        <Col sm={12} md={6}>
          <Form.Group className="form-group mb-3">

            <Form.Label>Assessment</Form.Label>
            <Form.Control as="textarea"
                          rows={3}
                          value={assessment}
                          onChange={(e) => setAssessment(e.target.value)}

            />
          </Form.Group>
        </Col>
        <Col sm={12} md={6}>
          <Form.Group className="form-group mb-3">

            <Form.Label>Recommendation</Form.Label>
            <Form.Control as="textarea"
                          rows={3}
                          value={recommendation}
                          onChange={(e) => setRecommendation(e.target.value)}

            />
          </Form.Group>
        </Col>
      </Row>

      {error && <Alert title="Error"
                       variant="danger">{error}</Alert>}

      <Button variant="primary" type="submit"
              disabled={loading}>
        Submit SBAR
      </Button>
      {loading && <div>
        <Spinner variant="info" className="mt-3"/>
      </div>}

    </Form>

    <ChoosePatientModal show={selectPatientVisible}
                        onHide={() => setSelectPatientVisible(false)}
                        onSubmit={(p) => setPatient(p)}/>
    <ChoosePractitionerModal show={selectPractitionerVisible}
                             onHide={() => setSelectPractitionerVisible(false)}
                             onSubmit={(p) => setPractitioner(p)}/>
  </BaseScreen>
}
