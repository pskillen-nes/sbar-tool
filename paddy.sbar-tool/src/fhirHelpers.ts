import {Bundle, Composition, Patient, Practitioner} from "fhir/r4";
import dayjs from "dayjs";

import {SbarBundle, SbarComponents} from "./types";
import {fhirIdentifierSystem} from "./constants";
import {EmpiAPI} from "./service/EmpiAPI";
import {FHIRWorksAPI} from "./service/FHIRWorksAPI";

export function getDefaultNameForPerson(p?: Patient | Practitioner, order: 'first-last' | 'last-first' = 'first-last'): string {
  if (!p)
    return '';
  if (!p.name || p.name.length === 0)
    return '(unnamed)';

  const firstHumanName = p.name[0];

  if (order === 'first-last')
    return `${firstHumanName.prefix || ''} ${firstHumanName.given?.join(' ') || ''} ${firstHumanName.family || ''} ${firstHumanName.suffix || ''}`;

  return `${firstHumanName.family ? firstHumanName.family + ', ' : ''}${firstHumanName.prefix || ''} ${firstHumanName.given?.join(' ') || ''} ${firstHumanName.suffix || ''}`;
}

export function getChiForPatient(p?: Patient): string {
  if (!p)
    return '';
  if (!p.identifier || p.identifier.length === 0)
    return '(unknown)';

  const chiIdentifiers = p.identifier.filter(ident => ident.system === fhirIdentifierSystem.chiNumber);

  if (!chiIdentifiers || chiIdentifiers.length === 0)
    return '';

  return chiIdentifiers[0].value || '';
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

export function extractSbarResources(bundle: Bundle, compositionId: string): SbarBundle | undefined {

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

export async function loadSbarResources(pack: SbarBundle, empiApi: EmpiAPI, fhirWorksApi: FHIRWorksAPI): Promise<SbarBundle> {
  const [composition] = pack;
  const [patient, practitioner] = await Promise.all([
    loadSbarPatient(pack, empiApi, fhirWorksApi),
    loadSbarPractitioner(pack, fhirWorksApi),
  ]);

  return [composition, patient, practitioner];
}

export async function loadSbarPatient([comp, patient, practitioner]: SbarBundle, empiApi: EmpiAPI, fhirWorksApi: FHIRWorksAPI): Promise<Patient | undefined> {
  if (patient)
    return patient;

  const patientId = comp.subject?.reference?.replace('Patient/', '');
  if (!patientId)
    return undefined;

  // Lookup by CHI
  if (patientId.match(/\d{10}/)) {
    const result = await empiApi.getPatientByChi(patientId);
    if (result.resourceType === 'Patient')
      return result as Patient;
  } else {
    const result = await fhirWorksApi.getResourceById<Patient>('Patient', patientId);
    if (result.resourceType === 'Patient')
      return result as Patient;
  }

  return undefined;
}

export async function loadSbarPractitioner([comp, patient, practitioner]: SbarBundle, fhirWorksApi: FHIRWorksAPI): Promise<Practitioner | undefined> {
  if (practitioner)
    return practitioner;

  const practitionerId = comp.author?.[0]?.reference?.replace('Practitioner/', '');
  if (!practitionerId)
    return undefined;

  const result = await fhirWorksApi.getResourceById<Practitioner>('Practitioner', practitionerId);
  if (result.resourceType === 'Practitioner')
    return result as Practitioner;

  return undefined;
}

export function extractSbarComponents(composition?: Composition): SbarComponents {
  function getSectionTextByName(composition: Composition, sectionName: string): string | undefined {
    const sections = composition.section?.filter(s => s.title === sectionName);

    if (!sections || sections.length === 0)
      return undefined;

    return sections[0].text?.div;
  }

  if (!composition)
    return {situation: "", background: "", assessment: "", recommendation: ""};

  return {
    situation: getSectionTextByName(composition, 'Situation') || '',
    background: getSectionTextByName(composition, 'Background') || '',
    assessment: getSectionTextByName(composition, 'Assessment') || '',
    recommendation: getSectionTextByName(composition, 'Recommendation') || '',
  };
}
