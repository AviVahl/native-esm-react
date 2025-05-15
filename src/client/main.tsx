import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { App } from "./app.js";

hydrateRoot(
  document,
  <StrictMode>
    <App />
  </StrictMode>,
);
