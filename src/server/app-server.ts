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

const baseURL = new URL("../..", import.meta.url).href;
const DEFAULT_PORT = 3000;

export interface StartHttpServerOptions {
  port?: number;
  production?: boolean;
  live?: boolean;
}

export async function createAppServer({
  port = DEFAULT_PORT,
  production = false,
  live = false,
}: StartHttpServerOptions = {}) {
  const basePath = fileURLToPath(baseURL);
  const indexPath = join(basePath, "index.html");
  const localAddress = `http://localhost:${port}/`;
  const indexContentType = getContentType(indexPath);

  let ssrWorker: Worker | undefined;

  const httpServer = createServer(httpRequestHandler);

  const wss = new WebSocketServer({ server: httpServer });
  await once(httpServer.listen(port), "listening");

  return {
    localAddress: localAddress,
    close,
    reload,
  };

  async function close() {
    wss.close();
    await once(wss, "close");
    httpServer.close();
    await once(httpServer, "close");
    if (ssrWorker) {
      ssrWorker.postMessage("close");
      ssrWorker = undefined;
    }
  }

  function reload() {
    if (ssrWorker) {
      ssrWorker.postMessage("close");
      ssrWorker = undefined;
    }
    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) {
        client.send("reload");
      }
    }
  }

  async function httpRequestHandler(
    request: IncomingMessage,
    response: ServerResponse
  ): Promise<void> {
    try {
      // ignore searchParams and hash, and then decode escaped characters (e.g. %20 -> space)
      const requestPath = decodeURI(
        new URL(request.url ?? "", localAddress).pathname
      );

      if (requestPath === "/") {
        await respondWithSSR(response);
      } else {
        const fsPath = join(basePath, requestPath);
        const fsStats = await safePromise(lstat(fsPath));
        if (fsStats?.isFile()) {
          await respondWithFile(
            request,
            response,
            fsPath,
            fsStats,
            live,
            production
          );
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
        execArgv: process.execArgv,
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
      localAddress
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
}

const returnUndefined = () => undefined;
async function safePromise<T>(promise: Promise<T>): Promise<T | undefined> {
  return promise.catch(returnUndefined);
}
