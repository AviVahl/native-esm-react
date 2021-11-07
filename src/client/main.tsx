import React, { StrictMode } from "react";
import ReactDOM from "react-dom";
import { App } from "./app.js";

const container = document.body.appendChild(document.createElement("div"));
ReactDOM.render(
  <StrictMode>
    <App />
  </StrictMode>,
  container
);
