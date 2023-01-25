import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { chromium, firefox } from "playwright";
import { createAppServer } from "../server/app-server.js";

const browsers = [chromium, firefox];
const headless = true;

describe("sanity e2e", () => {
  const disposables: Array<() => Promise<void>> = [];
  afterEach(async () => {
    for (const dispose of disposables.reverse()) {
      await dispose();
    }
    disposables.length = 0;
  });

  for (const browserType of browsers) {
    it(`loads in ${browserType.name()}`, async () => {
      const appServer = await createAppServer();
      disposables.push(() => appServer.close());

      const browser = await browserType.launch({ headless });
      disposables.push(() => browser.close());

      const page = await browser.newPage();
      await page.goto(appServer.localAddress);

      assert.ok(await page.locator("text=server-side").isVisible());
    });
  }
});
