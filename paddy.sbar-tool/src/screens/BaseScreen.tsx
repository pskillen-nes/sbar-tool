import React from "react";
import {Container} from "react-bootstrap";

import MainNavBar from "../components/Navbar";
import PageHeader from "../components/PageHeader";

export type BaseScreenProps = React.PropsWithChildren<{
  pageTitle: string;
  pageSubtitle?: string;
}>;

export default function BaseScreen(props: BaseScreenProps): JSX.Element {

  return <>
    <MainNavBar/>

    <Container id="pageHeader">
      {(props.pageTitle) &&
        <PageHeader title={props.pageTitle}
                    subtitle={props.pageSubtitle}/>}
    </Container>

    <Container id="mainContent">
      {props.children}
    </Container>

    <Container id="pageFooter">

    </Container>
  </>;
}
