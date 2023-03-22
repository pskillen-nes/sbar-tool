import * as React from 'react';
import {createRoot} from "react-dom/client";
import {HashRouter, Route, Routes} from "react-router-dom";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";

import {AuthProvider} from "./service/Auth";
import config from "./config";

import './overrides.css';

import LandingScreen from "./screens/LandingScreen";
import UserInfoScreen from "./screens/user/UserInfoScreen";
import ListSBARsScreen from "./screens/ListSBARsScreen";
import AddSBARScreen from "./screens/AddSBARScreen";
import ViewSBARScreen from "./screens/ViewSBARScreen";


dayjs.extend(utc);
dayjs.extend(customParseFormat);


function App(): JSX.Element {

  return <HashRouter basename={'/'}>
    <AuthProvider>
      <Routes>

        <Route path="/user" element={<UserInfoScreen/>}/>
        <Route path="/sbar" element={<ListSBARsScreen/>}/>
        <Route path="/sbar/add" element={<AddSBARScreen/>}/>
        <Route path="/sbar/:id" element={<ViewSBARScreen/>}/>

        <Route path="/" element={<LandingScreen/>}/>
        <Route path="*" element={<LandingScreen/>}/>

      </Routes>
    </AuthProvider>
  </HashRouter>;
}

const container = document.getElementById('root');
const root = createRoot(container!); // createRoot(container!) if you use TypeScript
root.render(<App/>);
