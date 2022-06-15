import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import Markdown from "marked-react";

const readmeURL = new URL("../../README.md", import.meta.url);
const md = await (await fetch(readmeURL.href)).text();

const rootContainerId = "SITE_MAIN";

const container =
  document.getElementById(rootContainerId) ?? createContainer(document.body);

const isSSR = container.hasAttribute("data-ssr");
const appElement = (
  <StrictMode>
    <Markdown value={md} />
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
