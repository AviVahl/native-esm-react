import { once } from "node:events";
import { lstat } from "node:fs/promises";
import { STATUS_CODES, createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { URL, fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";
import { WebSocketServer } from "ws";
import { respondWithError, respondWithFile } from "./http.js";
import { injectLiveClient } from "./live-client.js";

const baseURL = new URL("../..", import.meta.url).href;

export interface StartHttpServerOptions {
  port?: number;
  live?: boolean;
}

export async function createAppServer({ port, live = false }: StartHttpServerOptions = {}) {
  const basePath = fileURLToPath(baseURL);

  let ssrWorker: Worker | undefined;

  const httpServer = createServer(httpRequestHandler);

  const wss = new WebSocketServer({ server: httpServer });
  await once(httpServer.listen(port), "listening");
  const { port: actualPort } = httpServer.address() as AddressInfo;
  const localAddress = `http://localhost:${actualPort}/`;

  return {
    localAddress,
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

  async function httpRequestHandler(request: IncomingMessage, response: ServerResponse): Promise<void> {
    try {
      // ignore searchParams and hash, and then decode escaped characters (e.g. %20 -> space)
      const requestPath = decodeURI(new URL(request.url ?? "", localAddress).pathname);

      if (requestPath === "/") {
        await respondWithSSR(response);
      } else {
        const fsPath = join(basePath, requestPath);
        const fsStats = await safePromise(lstat(fsPath));
        if (fsStats?.isFile()) {
          await respondWithFile(response, fsPath, fsStats, live);
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
    if (!ssrWorker) {
      ssrWorker = new Worker(new URL("./ssr-worker.js", import.meta.url), {
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
    const htmlWithAssets = renderedApp.replaceAll(baseURL, localAddress);
    const htmlWithLiveClient = live ? injectLiveClient(htmlWithAssets) : htmlWithAssets;
    const finalHTML = `<!DOCTYPE html>${htmlWithLiveClient}`;
    response.statusCode = 200;
    response.statusMessage = STATUS_CODES[200]!;
    response.setHeader("Content-Type", "text/html");
    response.end(finalHTML);
  }
}

const returnUndefined = () => undefined;
async function safePromise<T>(promise: Promise<T>): Promise<T | undefined> {
  return promise.catch(returnUndefined);
}
