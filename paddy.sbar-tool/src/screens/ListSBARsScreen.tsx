import React, {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {Alert, Table} from "react-bootstrap";

import {Composition} from "fhir/r4";

import dayjs from "dayjs";

import {SbarBundle} from "../types";
import {fhirIdentifierSystem} from "../constants";
import config from "../config";
import {getFriendlyErrorMessage} from "../helpers";
import {getChiForPatient, getDefaultNameForPerson, extractSbarResources, loadSbarResources} from "../fhirHelpers";

import {useAuth} from "../service/Auth";
import {FHIRWorksAPI} from "../service/FHIRWorksAPI";
import {EmpiAPI} from "../service/EmpiAPI";

import BaseScreen from "./BaseScreen";
import BlockLoadingSpinner from "../components/LoadingSpinner";


export default function ListSBARsScreen(): JSX.Element {

  const {user, idToken} = useAuth();

  const [sbarList, setSbarList] = useState<SbarBundle[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [notFound, setNotFound] = useState<boolean>(false);

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

  async function loadSbarList() {
    try {
      setLoading(true);
      setSbarList([]);
      setNotFound(false);

      loadAPIs();
      if (!fhirWorksApi || !empiApi)
        return;

      const bundle = await fhirWorksApi.searchByField(
        'Composition',
        'sbar',
        fhirIdentifierSystem.documentType,
        'type',
        ['Composition:author']
      );

      if (!bundle.entry || bundle.entry.length === 0) {
        setNotFound(true);
        return;
      }

      const compositions = bundle.entry
        .filter(e => e.resource?.resourceType === 'Composition')
        .map(e => e.resource as Composition);

      let sbarList = compositions.map(c => extractSbarResources(bundle, c.id!))
        .filter(pack => pack !== undefined) as SbarBundle[];

      // populate patient from EMPI, if we don't already have them
      sbarList = await Promise.all(
        sbarList.map(pack => loadSbarResources(pack, empiApi!, fhirWorksApi!))
      );

      setSbarList(sbarList);

    } catch (e) {
      setSbarList([]);
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
    loadSbarList();
  }, [idToken, user]);


  return <BaseScreen pageTitle="Search and display SBARs"
                     pageSubtitle="">

    {error && <Alert title="Error"
                     variant="danger">{error}</Alert>}

    {loading && <BlockLoadingSpinner/>}

    <Table striped bordered hover>
      <thead>
      <tr>
        <th>Date</th>
        <th>Patient</th>
        <th>Practitioner</th>
        <th>Options</th>
      </tr>
      </thead>

      <tbody>
      {sbarList && sbarList.length > 0 && sbarList.map(([comp, pat, pract]) =>
        <tr key={comp.id}>
          <td>{dayjs(comp.date).format(config.formats.shortDateTimeFormat)}</td>

          {pat ? <td>{getDefaultNameForPerson(pat)} [{getChiForPatient(pat)}]</td>
            : <td>(Patient not found)</td>}

          {pract ? <td>{getDefaultNameForPerson(pract)}</td>
            : <td>(Practitioner not found)</td>}

          <td><Link className="btn btn-secondary"
                    to={`/sbar/${comp.id}`}>
            <i className="fa-regular fa-folder-open"></i>
          </Link></td>
        </tr>)}

      </tbody>
    </Table>

    {notFound && <Alert title="Not found"
                        variant="warning">No SBARs were found in the system. Click <Link to="/sbar/add">here</Link> to
      add one.</Alert>}

  </BaseScreen>
}
