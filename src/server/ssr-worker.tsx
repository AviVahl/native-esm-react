import { parentPort } from "node:worker_threads";
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";

if (!parentPort) {
  throw new Error("this file should be evaluated in a worker thread");
}

parentPort.on("message", onMessage);

async function onMessage(message: unknown) {
  if (message === "render-app") {
    const { App } = await import("../client/app.js");
    const html = renderToString(
      <StrictMode>
        <App />
      </StrictMode>
    );
    parentPort!.postMessage(html);
  }
  if (message === "close") {
    parentPort!.off("message", onMessage);
  }
}
