import React, {useState} from "react";
import {Button, Container, Form, InputGroup, Modal} from "react-bootstrap";
import {Composition, Patient, Practitioner} from "fhir/r4";

import {buildSBAR, getDefaultNameForPerson} from "../../fhirHelpers";
import ChoosePatientModal from "./ChoosePatientModal";
import ChoosePractitionerModal from "./ChoosePractitionerModal";


export default function AddSbarModal(props: {
  show: boolean,
  onHide: () => void,
  onSubmit: (data: Composition) => void,
}): JSX.Element {

  const [formValidated, setFormValidated] = useState<boolean>(false);

  const [selectPatientVisible, setSelectPatientVisible] = useState<boolean>(false);
  const [selectPractitionerVisible, setSelectPractitionerVisible] = useState<boolean>(false);

  const [patient, setPatient] = useState<Patient>();
  const [practitioner, setPractitioner] = useState<Practitioner>();
  const [situation, setSituation] = useState<string>('');
  const [background, setBackground] = useState<string>('');
  const [assessment, setAssessment] = useState<string>('');
  const [recommendation, setRecommendation] = useState<string>('');

  function handleSubmit(event: any) {
    event.preventDefault();
    event.stopPropagation();

    const form = event.currentTarget;

    // Failure path
    if (form.checkValidity() === false) {
      setFormValidated(true);
      return;
    }

    // Success path
    setFormValidated(false);

    const data: Composition = buildSBAR(
      patient!.id!,
      practitioner!.id!,
      situation,
      background,
      assessment,
      recommendation,
    );

    props.onSubmit(data);
  }

  return <>
    <Modal onHide={props.onHide}
           show={props.show}
           dialogClassName={`modal-90w ${(selectPatientVisible || selectPractitionerVisible) && 'blur-strong'}`}>

      <Form onSubmit={handleSubmit}
            noValidate
            validated={formValidated}>

        <Modal.Header closeButton>
          <Modal.Title>Add SBAR</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <h3>SBAR details</h3>
          <Container>
            <Form.Group className="form-group mb-3">

              <Form.Label>Patient</Form.Label>
              <InputGroup>
                <Form.Control value={patient && getDefaultNameForPerson(patient, 'first-last')}
                              readOnly={true}/>
                <Button onClick={() => setSelectPatientVisible(true)}>
                  <i className="fa-solid fa-search"></i>
                </Button>
              </InputGroup>
            </Form.Group>
            <Form.Group className="form-group mb-3">

              <Form.Label>Practitioner</Form.Label>
              <InputGroup>
                <Form.Control value={practitioner && getDefaultNameForPerson(practitioner, 'first-last')}
                              readOnly={true}/>
                <Button onClick={() => setSelectPractitionerVisible(true)}>
                  <i className="fa-solid fa-search"></i>
                </Button>
              </InputGroup>
            </Form.Group>
          </Container>

          <h3 className="mt-3">Your assessment</h3>
          <Container style={{
            overflowY: 'auto',
            maxHeight: '20rem',
          }}>
            <Form.Group className="form-group mb-3">

              <Form.Label>Situation</Form.Label>
              <Form.Control as="textarea"
                            rows={3}
                            value={situation}
                            onChange={(e) => setSituation(e.target.value)}

              />
            </Form.Group>
            <Form.Group className="form-group mb-3">

              <Form.Label>Background</Form.Label>
              <Form.Control as="textarea"
                            rows={3}
                            value={background}
                            onChange={(e) => setBackground(e.target.value)}

              />
            </Form.Group>
            <Form.Group className="form-group mb-3">

              <Form.Label>Assessment</Form.Label>
              <Form.Control as="textarea"
                            rows={3}
                            value={assessment}
                            onChange={(e) => setAssessment(e.target.value)}

              />
            </Form.Group>
            <Form.Group className="form-group mb-3">

              <Form.Label>Recommendation</Form.Label>
              <Form.Control as="textarea"
                            rows={3}
                            value={recommendation}
                            onChange={(e) => setRecommendation(e.target.value)}

              />
            </Form.Group>
          </Container>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={props.onHide}>
            Close
          </Button>
          <Button variant="primary" type="submit">
            Submit SBAR
          </Button>
        </Modal.Footer>

      </Form>
    </Modal>

    <ChoosePatientModal show={selectPatientVisible}
                        onHide={() => setSelectPatientVisible(false)}
                        onSubmit={(p) => setPatient(p)}/>
    <ChoosePractitionerModal show={selectPractitionerVisible}
                             onHide={() => setSelectPractitionerVisible(false)}
                             onSubmit={(p) => setPractitioner(p)}/>
  </>
}
