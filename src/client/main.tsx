import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app.js";

const rootContainerId = "SITE_MAIN";

const container =
  document.getElementById(rootContainerId) ?? createContainer(document.body);

const isSSR = container.hasAttribute("data-ssr");
const appElement = (
  <StrictMode>
    <App renderType={isSSR ? "server-side" : "client-side"} />
  </StrictMode>
);

if (isSSR) {
  ReactDOM.hydrateRoot(container, appElement);
} else {
  ReactDOM.createRoot(container).render(appElement);
}

function createContainer(targetParent: Element) {
  const newContainer = document.createElement("div");
  newContainer.id = rootContainerId;
  return targetParent.appendChild(newContainer);
}
