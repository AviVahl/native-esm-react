import { createReadStream, Stats } from "node:fs";
import { readFile } from "node:fs/promises";
import { ServerResponse, STATUS_CODES } from "node:http";
import { extname } from "node:path";
import { pipeline } from "node:stream/promises";
import mime from "mime";
import { injectLiveClient } from "./live-client.js";

const { define: defineMimeType, getType: getMimeType } = mime;

// .ts defaults to "video/mp2t" (media container) and .tsx is not defined
defineMimeType({ "text/plain": ["ts", "tsx", "md"] }, true);

export function getContentType(path: string): string {
  const contentType = getMimeType(path) ?? "text/plain";

  const isTextFile =
    contentType.startsWith("text/") ||
    contentType === "application/json" ||
    contentType === "application/javascript";

  return isTextFile ? `${contentType}; charset=UTF-8` : contentType;
}

export async function respondWithFile(
  response: ServerResponse,
  fsPath: string,
  fsStats: Stats,
  injectLiveHtml: boolean,
  production: boolean
) {
  response.statusCode = 200;
  response.statusMessage = STATUS_CODES[200]!;
  response.setHeader("Content-Type", getContentType(fsPath));
  response.setHeader("Cache-Control", "no-cache");
  const fileExtension = extname(fsPath);
  const isHtmlFile = fileExtension === ".html" || fileExtension === ".htm";
  if (isHtmlFile && (injectLiveHtml || production)) {
    const htmlFileContent = await readFile(fsPath, "utf8");
    const liveHtml = injectLiveHtml
      ? injectLiveClient(htmlFileContent)
      : htmlFileContent;
    const modeAdjustedHtml = production
      ? liveHtml.replaceAll(".development.js", ".production.min.js")
      : liveHtml;
    response.end(modeAdjustedHtml);
  } else {
    response.setHeader("Content-Length", fsStats.size);
    await pipeline(createReadStream(fsPath), response);
  }
}

export function respondWithError(
  response: ServerResponse,
  e: unknown,
  injectLiveHtml: boolean
) {
  response.statusCode = 500;
  response.statusMessage = STATUS_CODES[500]!;
  if (!response.headersSent) {
    response.setHeader("Content-Type", "text/html");
    response.setHeader("Cache-Control", "no-cache");
  }
  const errorMessage = (e as Error)?.stack ?? String(e);
  console.error(errorMessage);
  const errorPage = generateErrorPage(errorMessage);
  response.end(injectLiveHtml ? injectLiveClient(errorPage) : errorPage);
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
</html>`;
}
