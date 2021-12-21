import { createReadStream, PathLike } from "node:fs";
import { lstat, readFile } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { createServer, STATUS_CODES } from "node:http";
import { join } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { once } from "node:events";
import { renderAppToString } from "./render.js";
import mime from "mime";

const { define: defineMimeType, getType: getMimeType } = mime;

// .ts defaults to "video/mp2t" (media container) and .tsx is not defined
defineMimeType({ "text/plain": ["ts", "tsx", "md"] }, true);

const basePath = fileURLToPath(new URL("../..", import.meta.url));
const indexPath = join(basePath, "index.html");
const indexContentType = getContentType(indexPath);
const PORT = 3000;
const LOCAL_ADDRESS = `http://localhost:${PORT}/`;

const indexHTML = await readFile(indexPath, "utf8");
const renderedApp = renderAppToString(LOCAL_ADDRESS);
const finalHTML = indexHTML.replace(
  `<div id="SITE_MAIN"></div>`,
  `<div id="SITE_MAIN" data-ssr>${renderedApp}</div>`
);

const httpServer = createServer(async ({ url: requestUrl = "" }, response) => {
  // ignore searchParams and hash, and then decode escaped characters (e.g. %20 -> space)
  const requestPath = decodeURI(new URL(requestUrl, LOCAL_ADDRESS).pathname);

  if (requestPath === "/") {
    response.statusCode = 200;
    response.statusMessage = STATUS_CODES[200]!;
    response.setHeader("Content-Type", indexContentType);
    response.end(finalHTML);
  } else {
    const fsPath = join(basePath, requestPath);
    const fsStats = await lstatSafe(fsPath);
    if (fsStats?.isFile()) {
      response.statusCode = 200;
      response.statusMessage = STATUS_CODES[200]!;
      response.setHeader("Content-Type", getContentType(fsPath));
      response.setHeader("Content-Length", fsStats.size);
      await pipeline(createReadStream(fsPath), response);
    } else {
      response.statusCode = 404;
      response.statusMessage = STATUS_CODES[404]!;
      response.end();
    }
  }
});
httpServer.listen(PORT);
await once(httpServer, "listening");

console.log(`Listening on: ${LOCAL_ADDRESS}`);

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
