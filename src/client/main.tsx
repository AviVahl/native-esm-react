import React, { StrictMode } from "react";
import ReactDOM from "react-dom";
import { App } from "./app.jsx";

const rootContainerId = "SITE_MAIN";

const container =
  document.getElementById(rootContainerId) ?? createContainer(document.body);

const appReactElement = (
  <StrictMode>
    <App />
  </StrictMode>
);

if (container.hasAttribute("data-ssr")) {
  ReactDOM.hydrate(appReactElement, container);
} else {
  ReactDOM.render(appReactElement, container);
}

function createContainer(targetParent: Element) {
  const newContainer = document.createElement("div");
  newContainer.id = rootContainerId;
  return targetParent.appendChild(newContainer);
}
