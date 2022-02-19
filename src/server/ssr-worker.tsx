import { parentPort } from "node:worker_threads";
import React, { StrictMode } from "react";
import ReactDOMServer from "react-dom/server.js";

if (!parentPort) {
  throw new Error("this file should be evaluated in a worker thread");
}

parentPort.on("message", onMessage);

async function onMessage(message: unknown) {
  if (message === "render-app") {
    const { App } = await import("../client/app.js");
    const renderedApp = ReactDOMServer.renderToString(
      <StrictMode>
        <App renderType="server-side" />
      </StrictMode>
    );
    parentPort!.postMessage(renderedApp);
  }
  if (message === "close") {
    parentPort!.off("message", onMessage);
  }
}
