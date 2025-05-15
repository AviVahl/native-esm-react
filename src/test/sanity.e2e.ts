import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chromium, firefox } from "playwright";
import { createAppServer } from "../server/app-server.js";

const browsers = [chromium, firefox];
const headless = true;

describe("sanity e2e", () => {
  for (const browserType of browsers) {
    it(`loads in ${browserType.name()}`, async () => {
      await using appServer = await createAppServer();
      await using browser = await browserType.launch({ headless });

      const page = await browser.newPage();
      await page.goto(appServer.localAddress);

      assert.ok(await page.locator("text=Native ESM React Example").isVisible());
    });
  }
});
