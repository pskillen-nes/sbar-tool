import {Bundle, Composition, Patient, Practitioner} from "fhir/r4";
import dayjs from "dayjs";

import {fhirIdentifierSystem} from "./constants";

export function getDefaultNameForPerson(p: Patient | Practitioner, order: 'first-last' | 'last-first' = 'first-last'): string {
  if (!p.name || p.name.length === 0)
    return '(unnamed)';

  const firstHumanName = p.name[0];

  if (order === 'first-last')
    return `${firstHumanName.prefix || ''} ${firstHumanName.given?.join(' ') || ''} ${firstHumanName.family || ''} ${firstHumanName.suffix || ''}`;

  return `${firstHumanName.family ? firstHumanName.family + ', ' : ''}${firstHumanName.prefix || ''} ${firstHumanName.given?.join(' ') || ''} ${firstHumanName.suffix || ''}`;
}

export function getChiForPatient(p: Patient): string | undefined {
  if (!p.identifier || p.identifier.length === 0)
    return undefined;

  const chiIdentifiers = p.identifier.filter(ident => ident.system === fhirIdentifierSystem.chiNumber);

  if (!chiIdentifiers || chiIdentifiers.length === 0)
    return undefined;

  return chiIdentifiers[0].value;
}

export function buildSBAR(patientId: string,
                          practitionerId: string,
                          situation: string,
                          background: string,
                          assessment: string,
                          recommendation: string,
): Composition {

  const sbar: Composition = {
    resourceType: "Composition",
    status: 'final',
    type: {
      coding: [{
        code: 'sbar',
        system: fhirIdentifierSystem.documentType,
      }]
    },
    subject: {reference: `Patient/${patientId}`},
    date: dayjs.utc().toISOString(),
    author: [{reference: `Practitioner/${practitionerId}`}],
    title: "SBAR report",
    section: [
      {title: "Situation", text: {div: situation, status: 'generated'}},
      {title: "Background", text: {div: background, status: 'generated'}},
      {title: "Assessment", text: {div: assessment, status: 'generated'}},
      {title: "Recommendation", text: {div: recommendation, status: 'generated'}},
    ],
  };

  return sbar;
}

export function getSbarComponents(bundle: Bundle, compositionId: string): [Composition, (Patient | undefined), (Practitioner | undefined)] | undefined {

  if (!bundle.entry || bundle.entry.length === 0)
    return undefined;

  const compositions = bundle.entry.filter(e => e.resource?.id === compositionId && e.resource?.resourceType === 'Composition');

  if (!compositions || compositions.length === 0)
    return undefined;

  const composition = compositions[0].resource as Composition;

  const patientId = composition.subject?.reference?.replace('Patient/', '');
  const patients = bundle.entry.filter(e => e.resource?.id === patientId && e.resource?.resourceType === 'Patient');
  const patient = patients.length > 0 ? patients[0].resource as Patient : undefined;

  const practitionerId = composition.author[0].reference?.replace('Practitioner/', '');
  const practitioners = bundle.entry.filter(e => e.resource?.id === practitionerId && e.resource?.resourceType === 'Practitioner');
  const practitioner = practitioners.length > 0 ? practitioners[0].resource as Practitioner : undefined;

  return [composition, patient, practitioner];
}
