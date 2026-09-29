// The privacy claim, claims.md row 28: "No account. Your answers stay in this
// browser and are never sent anywhere." A marker is typed into every text field
// and picked in every option; the test fails if the marker appears in any
// request, or if any request goes anywhere but this page's own files and the
// analytics host. See skills/stack-check-privacy in the Jura Labs brain.
const { test, expect } = require("@playwright/test");
const { fresh, step } = require("./helpers");

const MARKER = "SC-MARKER-7f3a";
const ANALYTICS = "analytics.juralabs.org";

test("nothing typed or chosen is sent anywhere", async ({ page, baseURL }) => {
  const requests = [];
  page.on("request", (r) => requests.push({ url: r.url(), headers: JSON.stringify(r.headers()), body: r.postData() || "" }));
  page.on("websocket", (ws) => requests.push({ url: ws.url(), headers: "", body: "websocket" }));

  await fresh(page);
  await page.click("#startOwn");
  await step(page, 1);

  // A custom tool named with the marker, plus library tools.
  await page.fill("#newName", MARKER + " tool");
  await page.fill("#newJob", MARKER + " job");
  await page.click("#addTool");
  const chips = page.locator("button.chip[data-lib]");
  for (let i = 0; i < 4; i++) await chips.nth(i).click();
  await page.fill("#findTool", MARKER).catch(() => {});

  // Step 2: every text field on every tool, and one option in every group.
  await step(page, 2);
  const n = await page.evaluate(() => state.tools.length);
  for (let i = 0; i < n; i++) {
    for (const input of await page.locator('#view input[type="text"], #view input:not([type]), #view textarea').all()) {
      if (await input.isVisible() && await input.isEditable()) await input.fill(MARKER + " " + i);
    }
    for (const input of await page.locator('#view input[type="number"]').all()) {
      if (await input.isVisible() && await input.isEditable()) await input.fill("7");
    }
    const groups = await page.$$eval('#view input[type="radio"]', (els) => [...new Set(els.map((e) => e.name))]);
    for (const g of groups) await page.locator(`#view input[type="radio"][name="${g}"]`).first().check({ force: true }).catch(() => {});
    await page.click("#nextT");
  }

  // Steps 3 and 4: every text field there too.
  for (const s of [3, 4]) {
    await step(page, s);
    for (const input of await page.locator('#view input[type="text"], #view textarea').all()) {
      if (await input.isVisible() && await input.isEditable()) await input.fill(MARKER + " step" + s);
    }
  }
  await step(page, 3);

  // The marker was really entered: it is in this browser's storage...
  const stored = await page.evaluate(() => JSON.stringify(localStorage));
  expect(stored).toContain(MARKER);
  // ...and never in the address bar, which analytics would record.
  expect(page.url()).not.toContain(MARKER);

  const origin = new URL(baseURL).host;
  const offsite = requests.filter((r) => { const h = new URL(r.url).host; return h !== origin && h !== ANALYTICS; });
  expect(offsite, "requests to other hosts").toEqual([]);
  const leaks = requests.filter((r) => (r.url + r.headers + r.body).includes(MARKER));
  expect(leaks, "requests carrying what the user entered").toEqual([]);
  const analytics = requests.filter((r) => new URL(r.url).host === ANALYTICS);
  for (const r of analytics) expect(new URL(r.url).search + new URL(r.url).hash).toBe("");
});
