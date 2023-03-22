import React, {useEffect, useState} from "react";
import {Alert, Button, Form, Modal} from "react-bootstrap";
import {Patient} from "fhir/r4";
import {EmpiAPI} from "../../service/EmpiAPI";
import config from "../../config";
import {useAuth} from "../../service/Auth";
import {getFriendlyErrorMessage} from "../../helpers";
import {getChiForPatient, getDefaultNameForPerson} from "../../fhirHelpers";
import {FHIRWorksAPI} from "../../service/FHIRWorksAPI";
import {fhirIdentifierSystem} from "../../constants";


export default function ChoosePatientModal(props: {
  show: boolean,
  onHide: () => void,
  onSubmit: (data: Patient) => void,
}): JSX.Element {

  const {idToken, user} = useAuth();

  const [searchChi, setSearchChi] = useState<string>('');
  const [formValidated, setFormValidated] = useState(false);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [selectedPatient, setSelectedPatient] = useState<Patient>();


  // const [matchName, setMatchName] = useState<string>();
  // const [matchAddress, setMatchAddress] = useState<string>();
  // const [matchGender, setMatchGender] = useState<string>();
  // const [matchDob, setMatchDob] = useState<string>();
  // const [searchDemographicsValidated, setSearchDemographicsValidated] = useState(false);


  let empiApi: EmpiAPI | undefined = undefined;
  let fhirWorksApi: FHIRWorksAPI | undefined = undefined;

  function loadAPIs() {
    if (!idToken || !user) {
      empiApi = undefined;
      fhirWorksApi = undefined;
      return;
    }

    if (fhirWorksApi === undefined)
      fhirWorksApi = new FHIRWorksAPI(config.fhir.baseUrl, idToken, config.fhir.apiKey, user.fhirTenantId!, config.fhir.corsAnywhere);
    if (empiApi === undefined)
      empiApi = new EmpiAPI(config.empi.baseUrl, idToken, config.empi.apiKey);
  }

  useEffect(() => {
    fhirWorksApi = undefined;
    empiApi = undefined;
    loadAPIs();
  }, [idToken, user]);

  async function handleSearchSubmit(event: any) {
    loadAPIs();
    event.preventDefault();
    event.stopPropagation();

    setError(undefined);
    setNotFound(false);
    setSelectedPatient(undefined);

    const form = event.currentTarget;

    // Failure path
    if (form.checkValidity() === false) {
      setFormValidated(true);
      return;
    }

    // Success path
    setFormValidated(false);

    if (!empiApi || !fhirWorksApi) {
      setError('EMPI API or FHIR API not configured');
      return;
    }

    try {
      const empiPatient = await empiApi.getPatientByChi(searchChi);

      if (empiPatient.resourceType !== 'Patient') {
        setNotFound(true);
        return;
      }

      // Sandbox HACK: EMPI returns Patient.id == CHI, but we actually need the ID field
      const fhirPatients = await fhirWorksApi.searchByIdentifier('Patient', empiPatient.id!, fhirIdentifierSystem.chiNumber);

      if (!fhirPatients || !fhirPatients.entry || fhirPatients.entry.length === 0) {
        setNotFound(true);
        return;
      }

      const patient = fhirPatients.entry[0].resource as Patient;

      setSelectedPatient(patient);
    } catch (e) {
      setError(getFriendlyErrorMessage(e));
    }
  }

  function handleAccept() {
    if (!selectedPatient) return;
    props.onSubmit(selectedPatient);
    props.onHide();
  }

  return <Modal onHide={props.onHide}
                show={props.show}>

    <Modal.Header closeButton>
      <Modal.Title>Search for patient</Modal.Title>
    </Modal.Header>

    <Modal.Body>
      <h3>Search by CHI</h3>

      {error && <Alert title="Error"
                       variant="danger">{error}</Alert>}

      <Form noValidate
            validated={formValidated}
            onSubmit={handleSearchSubmit}>
        <p>Required fields are marked with an asterisk <span className="requiredFieldMarkerNotice">*</span></p>

        <Form.Group className="form-group mb-3">
          <Form.Label>CHI <span className="requiredFieldMarkerNotice">*</span></Form.Label>
          <Form.Control type="text"
                        className="form-control-sm"
                        minLength={10}
                        maxLength={10}
                        pattern="[0-9]{10}"
                        required={true}
                        value={searchChi}
                        onChange={e => setSearchChi(e.target.value)}
          />
          <Form.Control.Feedback type="invalid">
            Please provide a valid CHI (10 numeric digits).
          </Form.Control.Feedback>
          {notFound && <Form.Text className="text-danger">
            <i className="fa-solid fa-close"></i> Patient not found with this CHI
          </Form.Text>}
        </Form.Group>

        <Button type="submit">Search</Button>
      </Form>

      {selectedPatient && <>
        <h3>Selected patient</h3>
        <p>{getDefaultNameForPerson(selectedPatient, "last-first")} [{getChiForPatient(selectedPatient)}]</p>
      </>}
    </Modal.Body>

    <Modal.Footer>
      <Button variant="secondary" onClick={props.onHide}>
        Close
      </Button>
      <Button variant="primary" type="submit" onClick={handleAccept} disabled={selectedPatient === undefined}>
        Use patient
      </Button>
    </Modal.Footer>
  </Modal>;
}
