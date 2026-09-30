// The Decide and Your data layout Paul chose on 29 September 2026: Decide
// summary first with the board panel before the folded extras; step 4 is
// "Your data" with the map.
const { test, expect } = require("@playwright/test");
const { watchErrors, fresh, step } = require("./helpers");

const order = (page) => page.$$eval("#view h2", (hs) => hs.map((h) => h.id));

test("Decide: summary first, the board panel before the folded extras, and no map", async ({ page }) => {
  await fresh(page);
  await step(page, 3);
  const ids = await order(page);
  const at = (id) => ids.indexOf(id);
  expect(at("prioH")).toBeGreaterThanOrEqual(0);
  expect(at("prioH")).toBeLessThan(at("regH"));
  expect(at("regH")).toBeLessThan(at("outH"));
  expect(at("outH")).toBeLessThan(at("chgH"));
  expect(ids).not.toContain("whereH");
  expect(await page.locator("#view svg.map").count()).toBe(0);
  await expect(page.locator("#whereSumH")).toBeVisible();
});

test("Decide is much shorter: under 7 laptop screens for the example", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await fresh(page);
  await step(page, 3);
  const screens = await page.evaluate(() => document.documentElement.scrollHeight / window.innerHeight);
  expect(screens).toBeLessThan(7);
});

test("Decide: the folded extras start closed, stay open across redraws, and advice is announced", async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => { state.mode = "own"; }); // the example is read-only
  await step(page, 3);
  const cmp = page.locator('details[data-fold="cmp"]');
  await expect(cmp).not.toHaveAttribute("open", "");
  await cmp.locator("summary").click();
  await expect(cmp).toHaveAttribute("open", "");
  // A decision change redraws the page; the fold stays open.
  const key = await page.evaluate(() => state.tools[2].key);
  await page.selectOption(`#dec-${key}`, "Replace");
  await expect(page.locator('details[data-fold="cmp"]')).toHaveAttribute("open", "");
  await expect(page.locator(`#dec-${key}`)).toBeFocused();
  await expect(page.locator("#decStatus")).toContainText("Thinking of changing a tool");
});

test("See it on the map goes to Your data", async ({ page }) => {
  await fresh(page);
  await step(page, 3);
  await page.click("#toData");
  await expect.poll(() => page.evaluate(() => state.step)).toBe(4);
  await expect(page).toHaveTitle("Step 4 of 4, Your data: Stack Check");
});

test("Your data: the map only, then a way back and print (Follow one person removed, Paul 30 Sep)", async ({ page }) => {
  const errors = watchErrors(page);
  await fresh(page);
  await step(page, 4);
  const ids = await order(page);
  expect(ids[0]).toBe("whereH");
  expect(ids).not.toContain("jH");
  await expect(page.locator("#view svg.map").first()).toBeVisible();
  await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
  await page.click("#printData");
  expect(await page.evaluate(() => window.__printed)).toBe(1);
  await page.click("#back3");
  await expect.poll(() => page.evaluate(() => state.step)).toBe(3);
  expect(errors).toEqual([]);
});

test("Your data with no journeys still shows the map and the way back", async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => { state.journeys = []; state.jcur = -1; });
  await step(page, 4);
  await expect(page.locator("#whereH")).toBeVisible();
  await expect(page.locator("#back3")).toBeVisible();
});

test("the law toggle on Your data works, and no id is used twice on any step", async ({ page }) => {
  await fresh(page);
  for (const s of [1, 2, 3, 4]) {
    await step(page, s);
    const dups = await page.evaluate(() => {
      const seen = {}, d = [];
      document.querySelectorAll("[id]").forEach((e) => { if (seen[e.id]) d.push(e.id); seen[e.id] = 1; });
      return d;
    });
    expect(dups, `step ${s}`).toEqual([]);
  }
  await step(page, 4);
  const toggles = page.locator("[data-law]");
  expect(await toggles.count()).toBe(1);
  const before = await page.evaluate(() => state.showLaw);
  await toggles.first().click();
  expect(await page.evaluate(() => state.showLaw)).toBe(!before);
});

test("print: Decide leaves out the folded extras; Your data prints the map and table", async ({ page }) => {
  await fresh(page);
  await step(page, 3);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator('details[data-fold="cmp"]')).toBeHidden();
  await expect(page.locator("#regH")).toBeVisible();
  await page.emulateMedia({ media: "screen" });
  await step(page, 4);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("#view svg.map").first()).toBeVisible();
  await expect(page.getByRole("region", { name: /The map as a table/ })).toBeVisible();
});


// Paul, 30 Sep: dark by default, with a switch to light that is remembered in this browser.
test("the page starts dark, the switch goes to light and back, and the choice is remembered", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await fresh(page);
  const btn = page.locator("#themeBtn");
  const theme = () => page.evaluate(() => document.documentElement.dataset.theme);
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(await theme()).toBe("dark");
  await expect(btn).toHaveAttribute("aria-pressed", "true");
  const dark = await bg();
  await btn.click();
  await expect(btn).toHaveAttribute("aria-pressed", "false");
  expect(await theme()).toBe("light");
  expect(await bg()).not.toBe(dark);
  await page.reload();
  expect(await theme()).toBe("light");
  await page.locator("#themeBtn").click();
  expect(await bg()).toBe(dark);
});
