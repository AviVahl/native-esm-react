import React, { StrictMode } from "react";
import ReactDOMServer from "react-dom/server.js";
import { App } from "../client/app.js";

const rootURL = new URL("../..", import.meta.url).href;

export const renderAppToString = (publicURL: string) =>
  ReactDOMServer.renderToString(
    <StrictMode>
      <App />
    </StrictMode>
  ).replaceAll(rootURL, publicURL);
