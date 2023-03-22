import React, {useEffect, useState} from "react";
import {Alert, Button, Form, Modal} from "react-bootstrap";
import {Practitioner} from "fhir/r4";

import config from "../../config";
import {FHIRWorksAPI} from "../../service/FHIRWorksAPI";
import {useAuth} from "../../service/Auth";

import {getFriendlyErrorMessage} from "../../helpers";
import {getDefaultNameForPerson} from "../../fhirHelpers";


export default function ChoosePractitionerModal(props: {
  show: boolean,
  onHide: () => void,
  onSubmit: (data: Practitioner) => void,
}): JSX.Element {

  const {user, idToken} = useAuth();

  const [searchName, setSearchName] = useState<string>('');
  const [formValidated, setFormValidated] = useState(false);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [foundPractitioners, setFoundPractitioners] = useState<Practitioner[]>([]);
  const [selectedPractitioner, setSelectedPractitioner] = useState<Practitioner>();

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

  async function handleSearchSubmit(event: any) {
    loadAPIs();
    event.preventDefault();
    event.stopPropagation();

    setError(undefined);
    setNotFound(false);
    setSelectedPractitioner(undefined);
    setFoundPractitioners([]);

    const form = event.currentTarget;

    // Failure path
    if (form.checkValidity() === false) {
      setFormValidated(true);
      return;
    }

    // Success path
    setFormValidated(false);

    if (!fhirWorksApi) {
      setError('FHIR API not configured');
      return;
    }

    try {
      const bundle = await fhirWorksApi.searchByName('Practitioner', searchName);

      if (!bundle.entry || bundle.entry.length === 0) {
        setNotFound(true);
        return;
      }

      const practitioners = bundle.entry.map(e => e.resource as Practitioner);
      setFoundPractitioners(practitioners);

    } catch (e) {
      setError(getFriendlyErrorMessage(e));
    }
  }

  function handleAccept() {
    if (!selectedPractitioner) return;
    props.onSubmit(selectedPractitioner);
    props.onHide();
  }

  return <Modal onHide={props.onHide}
                show={props.show}>

    <Modal.Header closeButton>
      <Modal.Title>Search for practitioner</Modal.Title>
    </Modal.Header>

    <Modal.Body>
      <h3>Search by name</h3>

      {error && <Alert title="Error"
                       variant="danger">{error}</Alert>}

      <Form noValidate
            validated={formValidated}
            onSubmit={handleSearchSubmit}>
        <p>Required fields are marked with an asterisk <span className="requiredFieldMarkerNotice">*</span></p>

        <Form.Group className="form-group mb-3">
          <Form.Label>Name <span className="requiredFieldMarkerNotice">*</span></Form.Label>
          <Form.Control type="text"
                        className="form-control-sm"
                        required={true}
                        minLength={2}
                        value={searchName}
                        onChange={e => setSearchName(e.target.value)}
          />
          <Form.Control.Feedback type="invalid">
            Please provide a first, last, or both names.
          </Form.Control.Feedback>
          {notFound && <Form.Text className="text-danger">
            <i className="fa-solid fa-close"></i> No practitioner found with this name.
          </Form.Text>}
        </Form.Group>

        <Button type="submit">Search</Button>
      </Form>

      {foundPractitioners && foundPractitioners.length > 0 && <>
        <h3>Matching practitioners</h3>
        <ul className="list-unstyled">
          {foundPractitioners.map(p => <li key={p.id}>
            <div>
              <i className="fa-solid fa-user-circle"></i>{' '}
              {getDefaultNameForPerson(p, 'last-first')}
              <Button variant="outline-secondary" className="pt-0 pb-0"
                      onClick={() => setSelectedPractitioner(p)}>Select</Button>
            </div>
          </li>)}
        </ul>

      </>}

      {selectedPractitioner && <>
        <h3>Selected practitioner</h3>
        <p>{getDefaultNameForPerson(selectedPractitioner)}</p>
      </>}
    </Modal.Body>

    <Modal.Footer>
      <Button variant="secondary" onClick={props.onHide}>
        Close
      </Button>
      <Button variant="primary" type="submit" onClick={handleAccept} disabled={selectedPractitioner === undefined}>
        Use practitioner
      </Button>
    </Modal.Footer>
  </Modal>;
}
