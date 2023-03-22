import React from "react";
import {Link, useNavigate} from "react-router-dom";
import {Button, Container, Nav, Navbar, NavDropdown} from "react-bootstrap";

import config from "../config";
import {useAuth} from "../service/Auth";


export default function MainNavBar(): JSX.Element {

  const navigate = useNavigate();
  const {user, signOut, signIn} = useAuth();

  return <Navbar bg="light" expand="lg" sticky="top">
    <Container>
      <Navbar.Brand href={config.site.urlRoot}><i className="fa-regular fa-file-text"></i> Paddy's SBAR
        tool</Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav"/>

      {user && <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="me-auto">
          <Nav.Link as={Link} to="/sbar"><i className="fa-solid fa-file-text"></i> View SBARs</Nav.Link>
          <Nav.Link as={Link} to="/sbar/add"><i className="fa-solid fa-plus"></i> Add SBAR</Nav.Link>
        </Nav>
      </Navbar.Collapse>}

      <Navbar.Collapse className="justify-content-end">
        <Nav className="">

          <NavDropdown title={<><i className="fa-solid fa-circle-info"> </i> Resources</>} id="basic-nav-dropdown">
            <NavDropdown.Item href="https://developer.dev.platform.ndp.scot" target="_blank">
              NDP Developer Portal <i className="fa-solid fa-external-link"></i>
            </NavDropdown.Item>

            <NavDropdown.Divider/>

            <NavDropdown.Item href="https://www.hl7.org/fhir/resourcelist.html" target="_blank">
              FHIR documentation <i className="fa-solid fa-external-link"></i>
            </NavDropdown.Item>

          </NavDropdown>

          {user && <>
            <Navbar.Text className="d-none d-lg-block">
              <i className="fa-solid fa-user"> </i> {user.username}
              <br/>
              <a href="#" onClick={(e) => {
                signOut();
                navigate("/");
                e.preventDefault();
              }}>Logout</a>
            </Navbar.Text>

            <Navbar.Text className="d-lg-none">
              <i className="fa-solid fa-user"> </i> {user.username}
            </Navbar.Text>
            <Nav.Link className="d-lg-none"
                      as={Link}
                      to="/"
                      onClick={(e) => {
                        signOut();
                        navigate("/");
                        e.preventDefault();
                      }}>Logout</Nav.Link>
          </>}

          {!user && <>
            <Button variant="primary"
                    onClick={() => signIn()}>
              <i className="fa-solid fa-sign-in"> </i> Sign in
            </Button>
          </>}
        </Nav>


      </Navbar.Collapse>
    </Container>
  </Navbar>;
}
