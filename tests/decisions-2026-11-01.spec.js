// Paul's decisions of 1 November 2026 (decisions/2026-11-01-stack-check-open-decisions.md, W44-15):
// 8a the nine reviewer-judgement tools are search-only; 11a one time statement that scales with the
// number of tools, and no "2-hour"; 5b "Free" whenever a free option exists; and the new
// not-for-profit tools in the main list.
const fs = require("node:fs");
const { test, expect } = require("@playwright/test");
const { fresh, step } = require("./helpers");

const NINE = {
  "mattermost-cloud": "mattermost", "openproject-cloud": "openproject", "fireflies-ai": "fireflies",
  "otter-ai": "otter", hubspot: "hubspot", "google-analytics-4": "google analytics",
  "plausible-analytics": "plausible", "umami-cloud": "umami", "matomo-cloud": "matomo",
};
const NEW = ["libreoffice", "google-forms", "microsoft-forms", "youtube-channel", "tiktok-account",
  "localgiving", "caf-donate", "charitylog", "lamplight", "conventus", "klubmodul"];

test("8a: the nine reviewer-judgement tools are hidden until searched, and a search finds each", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await step(page, 1);
  expect(await page.evaluate((ids) => ids.filter((id) => !BYID[id] || !SEARCH_ONLY[id]), Object.keys(NINE))).toEqual([]);
  for (const id of Object.keys(NINE)) await expect(page.locator(`button.chip[data-lib="${id}"]`)).toBeHidden();
  for (const [id, q] of Object.entries(NINE)) {
    await page.fill("#findTool", q);
    await expect(page.locator(`button.chip[data-lib="${id}"]`)).toBeVisible();
  }
  await page.fill("#findTool", "");
  for (const id of Object.keys(NINE)) await expect(page.locator(`button.chip[data-lib="${id}"]`)).toBeHidden();
  // Ticked from a search, a search-only tool stays in view.
  await page.fill("#findTool", "umami");
  await page.click('button.chip[data-lib="umami-cloud"]');
  await page.fill("#findTool", "");
  await expect(page.locator('button.chip[data-lib="umami-cloud"]')).toBeVisible();
});

test("the new not-for-profit tools are in the main list, with a checked date and a region", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await step(page, 1);
  for (const id of NEW) await expect(page.locator(`button.chip[data-lib="${id}"]`)).toBeVisible();
  const bad = await page.evaluate((ids) => ids.filter((id) => {
    const t = BYID[id];
    return !t || SEARCH_ONLY[id] || t.checked !== "2026-10-28" || ["UK", "DK", "EU", "Global"].indexOf(t.region) < 0 || !(t.src || []).length;
  }), NEW);
  expect(bad).toEqual([]);
  // Main list = every library entry less the search-only ones (README "88 common tools").
  expect(await page.evaluate(() => { let all = 0, main = 0; LIB.forEach((g) => g.items.forEach((t) => { all++; if (!SEARCH_ONLY[t.id]) main++; })); return [all, main]; })).toEqual([110, 88]);
  expect(fs.readFileSync("README.md", "utf8")).toContain("a list of 88 common tools");
});

test("5b: an entry with a free option a small charity can use says Free, and names it", async ({ page }) => {
  await fresh(page);
  const got = await page.evaluate(() => ["figma", "dinero", "enthuse", "libreoffice", "google-forms", "microsoft-forms", "tiktok-account"].map((id) => BYID[id].npk));
  expect(got).toEqual(Array(7).fill("Free"));
  expect(await page.evaluate(() => BYID["mattermost-cloud"].npk)).toBe("On request");
  expect(await page.evaluate(() => BYID["enthuse"].np)).toMatch(/^Mass Participation .* no monthly fee; other products do\./);
});

test("11a: no '2-hour' anywhere, and one time statement of about 3 minutes a tool", async ({ page }) => {
  for (const f of ["index.html", "404.html", "README.md", "assets/app.js"]) {
    expect(fs.readFileSync(f, "utf8")).not.toMatch(/2-hour|2 minutes/);
  }
  await fresh(page);
  await expect(page.locator("body")).not.toContainText("2-hour");
  await expect(page.locator("#view")).toContainText("The essentials take about 3 minutes a tool, so 9 tools take about 30 minutes.");
  await page.click("#startNew");
  await expect(page.locator("#view")).toContainText("It takes about 3 minutes a tool.");
});

test("11a: the estimate grows with the number of tools, in the one count that is announced", async ({ page }) => {
  await fresh(page);
  expect(await page.evaluate(() => [1, 2, 9, 12, 20, 21, 40].map(timeFor))).toEqual([
    "about 3 minutes", "about 6 minutes", "about 30 minutes", "about 40 minutes", "about 1 hour", "about 1 hour 5 minutes", "about 2 hours",
  ]);
  await page.click("#startNew");
  await step(page, 1);
  // Only #pickCount announces; the line by the Next button is not a live region.
  expect(await page.locator(".navrow .muted.small").evaluate((e) => e.hasAttribute("aria-live") || e.hasAttribute("role"))).toBe(false);
  await page.click('button.chip[data-lib="xero"]');
  await expect(page.locator("#pickCount")).toHaveText("Added Xero. 1 tool chosen: about 3 minutes.");
  await page.click('button.chip[data-lib="canva"]');
  await expect(page.locator("#pickCount")).toHaveText("Added Canva. 2 tools chosen: about 6 minutes.");
  await expect(page.locator(".navrow .muted.small")).toHaveText("2 tools listed, about 6 minutes");
  await page.click('button.chip[data-lib="canva"]');
  await expect(page.locator("#pickCount")).toHaveText("Removed Canva. 1 tool chosen: about 3 minutes.");
  await page.click('button.chip[data-lib="xero"]');
  await expect(page.locator("#pickCount")).toHaveText("Removed Xero. 0 tools chosen.");
});

test("7a: Mollie's data location is Unknown, without the third-party profile", async ({ page }) => {
  await fresh(page);
  const m = await page.evaluate(() => ({ w: BYID.mollie.w, loc: BYID.mollie.loc, store: BYID.mollie.store, src: BYID.mollie.src.map((s) => s[1]).join(" ") }));
  expect(m.w).toBe("Don't know");
  expect(m.loc).toBe("");
  expect(m.store).toMatch(/^Unknown\./);
  expect(m.store).not.toContain("third-party profile");
  expect(m.src).not.toContain("euvetted");
});
