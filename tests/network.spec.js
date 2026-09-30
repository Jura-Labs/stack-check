// The privacy claim, claims.md row 28: "No account. Your answers stay in this
// browser and are never sent anywhere." A marker is typed into every text field
// and picked in every option; the test fails if the marker appears in any
// request, or if any request goes anywhere but this page's own files and the
// analytics host. See skills/stack-check-privacy in the Jura Labs brain.
const { test, expect } = require("@playwright/test");
const { fresh, step } = require("./helpers");

const MARKER = "SC-MARKER-7f3a";
const ANALYTICS = "analytics.juralabs.org";
// The only analytics events, with every value they can carry (Paul, 30 Sep 2026).
const EVENTS = ["start-own", "register-download", "guide-visit"];
const EVENT_DATA = { place: ["start", "start-new-list", "example-banner", "footer", "card"], format: ["xlsx", "ods"] };

test("nothing typed or chosen is sent anywhere", async ({ page, baseURL }) => {
  const requests = [];
  page.on("request", (r) => requests.push({ url: r.url(), headers: JSON.stringify(r.headers()), body: r.postData() || "" }));
  page.on("websocket", (ws) => requests.push({ url: ws.url(), headers: "", body: "websocket" }));

  // Let the real Umami script count this test host too, so what it would send
  // on check.juralabs.org is sent here, captured, and checked below.
  await page.route("**/index.html", async (route) => {
    const res = await route.fetch();
    const html = (await res.text()).replace('data-domains="check.juralabs.org"', 'data-domains="check.juralabs.org,127.0.0.1"');
    await route.fulfill({ response: res, body: html });
  });
  await fresh(page);
  await page.waitForFunction(() => !!window.umami);
  await page.click("#startNew");
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
    // Choose in the page, not by a forced click at the radio's position: a hidden radio has no
    // position, and a forced click there can land on a header link and leave the page.
    for (const g of groups) await page.locator(`#view input[type="radio"][name="${g}"]`).first().evaluate((e) => e.click());
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

  // What Umami actually sent: page views only, the path only, never the marker.
  expect(page.analyticsSent.length, "Umami counted the visit").toBeGreaterThan(0);
  for (const sent of page.analyticsSent) {
    expect(sent.body).not.toContain(MARKER);
    const payload = JSON.parse(sent.body).payload;
    const sentUrl = new URL(payload.url, "https://check.juralabs.org");
    expect(sentUrl.search + sentUrl.hash, "no query or hash in the counted address").toBe("");
    expect(JSON.parse(sent.body).type).toBe("event");
    // Named events (decision 2026-09-30-stack-check-analytics-events) carry fixed names and values only.
    if (payload.name !== undefined) {
      expect(EVENTS, "a known event").toContain(payload.name);
      for (const [k, v] of Object.entries(payload.data || {})) expect(EVENT_DATA[k] || [], `event data ${k}`).toContain(v);
    }
  }
  // Clicking "Start your own" was counted as a named event, and nothing else was.
  expect(page.analyticsSent.map((x) => JSON.parse(x.body).payload.name).filter(Boolean)).toContain("start-own");
  // Every element with an analytics event uses a known name and fixed values.
  for (const s of [1, 2, 3, 4]) {
    await step(page, s);
    const attrs = await page.locator("[data-umami-event]").evaluateAll((els) => els.map((e) => Object.fromEntries([...e.attributes].filter((a) => a.name.startsWith("data-umami-event")).map((a) => [a.name, a.value]))));
    for (const a of attrs) {
      expect(EVENTS).toContain(a["data-umami-event"]);
      for (const [k, v] of Object.entries(a)) if (k !== "data-umami-event") expect(EVENT_DATA[k.replace("data-umami-event-", "")] || []).toContain(v);
    }
  }
});

test("template downloads and guide links are counted with fixed names and values only", async ({ page }) => {
  await page.route("**/index.html", async (route) => {
    const res = await route.fetch();
    const html = (await res.text()).replace('data-domains="check.juralabs.org"', 'data-domains="check.juralabs.org,127.0.0.1"');
    await route.fulfill({ response: res, body: html });
  });
  await page.route("https://juralabs.org/**", (r) => r.abort());
  await fresh(page);
  await page.waitForFunction(() => !!window.umami);
  const events = () => page.analyticsSent.map((x) => JSON.parse(x.body).payload).filter((p) => p.name);
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click('footer a[href$=".xlsx"]')]);
  await dl.cancel();
  await expect.poll(() => events().length).toBeGreaterThan(0);
  expect(events()[0]).toMatchObject({ name: "register-download", data: { format: "xlsx", place: "footer" } });
  const before = events().length;
  await page.click('footer a[data-umami-event="guide-visit"]', { modifiers: ["ControlOrMeta"] }).catch(() => {});
  await expect.poll(() => events().length).toBeGreaterThan(before);
  expect(events().at(-1)).toMatchObject({ name: "guide-visit", data: { place: "footer" } });
});
