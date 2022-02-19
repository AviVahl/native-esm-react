import React, { StrictMode } from "react";
import ReactDOM from "react-dom";
import { App } from "./app.js";

const rootContainerId = "SITE_MAIN";

const container =
  document.getElementById(rootContainerId) ?? createContainer(document.body);

if (container.hasAttribute("data-ssr")) {
  ReactDOM.hydrate(
    <StrictMode>
      <App renderType="server-side" />
    </StrictMode>,
    container
  );
} else {
  ReactDOM.render(
    <StrictMode>
      <App renderType="client-side" />
    </StrictMode>,
    container
  );
}

function createContainer(targetParent: Element) {
  const newContainer = document.createElement("div");
  newContainer.id = rootContainerId;
  return targetParent.appendChild(newContainer);
}
