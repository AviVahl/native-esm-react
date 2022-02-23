import type { PathLike } from "node:fs";
import { lstat, readFile } from "node:fs/promises";
import {
  createServer,
  IncomingMessage,
  ServerResponse,
  STATUS_CODES,
} from "node:http";
import { join } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { once } from "node:events";
import { Worker } from "node:worker_threads";
import { WebSocketServer } from "ws";
import { getContentType, respondWithError, respondWithFile } from "./http.js";
import { injectLiveClient } from "./live-client.js";

const args = process.argv.slice(2);
const live = args.includes("--live");
const production = args.includes("--production");
const baseURL = new URL("../..", import.meta.url).href;
const basePath = fileURLToPath(baseURL);
const indexPath = join(basePath, "index.html");
const indexContentType = getContentType(indexPath);
const PORT = 3000;
const LOCAL_ADDRESS = `http://localhost:${PORT}/`;

let ssrWorker: Worker | undefined;

const httpServer = createServer(httpRequestHandler);

const wss = new WebSocketServer({ server: httpServer });
await once(httpServer.listen(PORT), "listening");
printAddress();

process.on("message", onIPCMessage);

function printAddress() {
  console.log(`Listening on: ${LOCAL_ADDRESS}`);
}

async function httpRequestHandler(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    // ignore searchParams and hash, and then decode escaped characters (e.g. %20 -> space)
    const requestPath = decodeURI(
      new URL(request.url ?? "", LOCAL_ADDRESS).pathname
    );

    if (requestPath === "/") {
      await respondWithSSR(response);
    } else {
      const fsPath = join(basePath, requestPath);
      const fsStats = await lstatSafe(fsPath);
      if (fsStats?.isFile()) {
        await respondWithFile(response, fsPath, fsStats, live, production);
      } else {
        response.statusCode = 404;
        response.statusMessage = STATUS_CODES[404]!;
        response.end();
      }
    }
  } catch (e: unknown) {
    respondWithError(response, e, live);
  }
}

async function respondWithSSR(response: ServerResponse) {
  const indexHTML = await readFile(indexPath, "utf8");
  if (!ssrWorker) {
    const env = production
      ? { ...process.env, NODE_ENV: "production" }
      : process.env;
    ssrWorker = new Worker(new URL("./ssr-worker.js", import.meta.url), {
      env,
    });
    try {
      await once(ssrWorker, "online");
    } catch (e) {
      ssrWorker = undefined;
      throw e;
    }
  }
  ssrWorker.postMessage("render-app");
  const [renderedApp] = (await once(ssrWorker, "message")) as [string];
  const renderedAppWithHttpAssets = renderedApp.replaceAll(
    baseURL,
    LOCAL_ADDRESS
  );
  const htmlWithRenderedApp = indexHTML.replace(
    `<div id="SITE_MAIN"></div>`,
    `<div id="SITE_MAIN" data-ssr>${renderedAppWithHttpAssets}</div>`
  );
  const modeAdjustedHTML = production
    ? htmlWithRenderedApp.replaceAll(".development.js", ".production.min.js")
    : htmlWithRenderedApp;
  const finalHTML = live
    ? injectLiveClient(modeAdjustedHTML)
    : modeAdjustedHTML;
  response.statusCode = 200;
  response.statusMessage = STATUS_CODES[200]!;
  response.setHeader("Content-Type", indexContentType);
  response.end(finalHTML);
}

function onIPCMessage(data: unknown) {
  if (data === "reload") {
    if (ssrWorker) {
      ssrWorker.postMessage("close");
      ssrWorker = undefined;
    }
    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) {
        client.send("reload");
      }
    }
  } else if (data === "print-address") {
    printAddress();
  }
}

async function lstatSafe(path: PathLike) {
  try {
    return await lstat(path);
  } catch {
    return undefined;
  }
}
