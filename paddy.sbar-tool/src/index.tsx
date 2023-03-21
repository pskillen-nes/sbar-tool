import * as React from 'react';
import {createRoot} from "react-dom/client";
import {HashRouter, Navigate, Route, Routes, useLocation} from "react-router-dom";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";

import {AuthProvider, useAuthContext} from "./service/Auth";
import config from "./config";

// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'jquery/dist/jquery.min';
// import 'bootstrap/dist/js/bootstrap.min';
import './overrides.css';

import LandingScreen from "./screens/LandingScreen";
import UserInfoScreen from "./screens/user/UserInfoScreen";


dayjs.extend(utc);
dayjs.extend(customParseFormat);

function RedirectToLoginRoute() {
  return <Navigate to={'https://' + config.auth.auth.tokenHost + config.auth.auth.loginPath}/>;
}

function RedirectToOriginalRoute() {
  const location = useLocation();
  const pathName = location.state?.from || '/'

  return <Navigate to={pathName}/>;
}


function App(): JSX.Element {
  const {user} = useAuthContext()

  return <HashRouter>
    <AuthProvider>
      <Routes>

        {user && <>
          {/* This route doubles as a callback after login */}
          <Route path='/login' element={<RedirectToOriginalRoute/>}/>

          {/* TODO Logout page */}
          {/*<Route path="/logout" element={<LogoutScreen/>}/>*/}

          <Route path="/user" element={<UserInfoScreen/>}/>
        </>}

        {!user && <>
        </>}

        <Route path="/" element={<LandingScreen/>}/>
        <Route path="*" element={<LandingScreen/>}/>


      </Routes>
    </AuthProvider>
  </HashRouter>;
}

const container = document.getElementById('root');
const root = createRoot(container!); // createRoot(container!) if you use TypeScript
root.render(<App/>);
