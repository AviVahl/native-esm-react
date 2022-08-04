import assert from "node:assert/strict";
import { chromium, firefox } from "playwright";
import { createAppServer } from "../server/app-server.js";

const headless = true;
const firefoxUserPrefs = { "dom.importMaps.enabled": true };
const appServer = await createAppServer();

for (const browserType of [chromium, firefox]) {
  const browserName = browserType.name();
  const browser = await browserType.launch({ headless, firefoxUserPrefs });

  console.log(`checking ${browserName} ${browser.version()}`);

  const page = await browser.newPage();
  await page.goto(appServer.localAddress);

  assert.ok(await page.locator("text=server-side").isVisible());

  await browser.close();
  console.log(`${browserName} OK`);
}

await appServer.close();
