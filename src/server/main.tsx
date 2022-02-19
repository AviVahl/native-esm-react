import { createReadStream, PathLike, Stats } from "node:fs";
import { lstat, readFile } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { createServer, ServerResponse, STATUS_CODES } from "node:http";
import { extname, join } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { once } from "node:events";
import { Worker } from "node:worker_threads";
import { WebSocketServer } from "ws";
import mime from "mime";

const { define: defineMimeType, getType: getMimeType } = mime;

// .ts defaults to "video/mp2t" (media container) and .tsx is not defined
defineMimeType({ "text/plain": ["ts", "tsx", "md"] }, true);

const args = process.argv.slice(2);
const live = args.includes("--live");
const baseURL = new URL("../..", import.meta.url).href;
const basePath = fileURLToPath(baseURL);
const indexPath = join(basePath, "index.html");
const indexContentType = getContentType(indexPath);
const PORT = 3000;
const LOCAL_ADDRESS = `http://localhost:${PORT}/`;

let ssrWorker: Worker | undefined;
const httpServer = createServer(async ({ url: requestUrl = "" }, response) => {
  try {
    // ignore searchParams and hash, and then decode escaped characters (e.g. %20 -> space)
    const requestPath = decodeURI(new URL(requestUrl, LOCAL_ADDRESS).pathname);

    if (requestPath === "/") {
      await respondWithSSR(response);
    } else {
      const fsPath = join(basePath, requestPath);
      const fsStats = await lstatSafe(fsPath);
      if (fsStats?.isFile()) {
        await respondWithFile(response, fsPath, fsStats);
      } else {
        response.statusCode = 404;
        response.statusMessage = STATUS_CODES[404]!;
        response.end();
      }
    }
  } catch (e: unknown) {
    respondWithError(response, e);
  }
});

const wss = new WebSocketServer({ server: httpServer });
await once(httpServer.listen(PORT), "listening");
printAddress();

process.on("message", onMessage);

async function respondWithFile(
  response: ServerResponse,
  fsPath: string,
  fsStats: Stats
) {
  response.statusCode = 200;
  response.statusMessage = STATUS_CODES[200]!;
  response.setHeader("Content-Type", getContentType(fsPath));
  const fileExtension = extname(fsPath);
  if (live && (fileExtension === ".html" || fileExtension === ".htm")) {
    const htmlFileContent = await readFile(fsPath, "utf8");
    response.end(injectLiveClient(htmlFileContent));
  } else {
    response.setHeader("Content-Length", fsStats.size);
    await pipeline(createReadStream(fsPath), response);
  }
}

async function respondWithSSR(response: ServerResponse) {
  const indexHTML = await readFile(indexPath, "utf8");
  if (!ssrWorker) {
    ssrWorker = new Worker(new URL("./ssr-worker.js", import.meta.url));
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
  const finalHTML = live
    ? injectLiveClient(htmlWithRenderedApp)
    : htmlWithRenderedApp;
  response.statusCode = 200;
  response.statusMessage = STATUS_CODES[200]!;
  response.setHeader("Content-Type", indexContentType);
  response.end(finalHTML);
}

function respondWithError(response: ServerResponse, e: unknown) {
  response.statusCode = 500;
  response.statusMessage = STATUS_CODES[500]!;
  response.setHeader("Content-Type", indexContentType);
  const errorMessage = (e as Error)?.stack ?? String(e);
  console.error(errorMessage);
  const errorPage = generateErrorPage(errorMessage);
  const finalHTML = live ? injectLiveClient(errorPage) : errorPage;
  response.end(finalHTML);
}

function onMessage(data: unknown) {
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
function printAddress() {
  console.log(`Listening on: ${LOCAL_ADDRESS}`);
}

function getContentType(path: string): string {
  const contentType = getMimeType(path) ?? "text/plain";

  const isTextFile =
    contentType.startsWith("text/") ||
    contentType === "application/json" ||
    contentType === "application/javascript";

  return isTextFile ? `${contentType}; charset=UTF-8` : contentType;
}

async function lstatSafe(path: PathLike) {
  try {
    return await lstat(path);
  } catch {
    return undefined;
  }
}

function injectLiveClient(html: string) {
  const bodyCloseIdx = html.lastIndexOf("</body>");
  return bodyCloseIdx === -1
    ? html
    : html.slice(0, bodyCloseIdx) +
        `  <script>
      const wsURL = new URL(window.location.href);
      wsURL.protocol = "ws";
      const ws = new WebSocket(wsURL);
      ws.addEventListener("message", ({ data }) => {
        if (data === "reload") {
          window.location.reload();
        }
      });
  </script>\n  ` +
        html.slice(bodyCloseIdx);
}
function generateErrorPage(message: string) {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>500 Server Error</title>
      <style>
        body {
          color: white;
          background-color: rgb(37, 37, 38);
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }
      </style>
    </head>
    <body>
      <pre>${message}</pre>
    </body>
  </html>
  `;
}
