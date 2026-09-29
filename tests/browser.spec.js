// Each of the four steps loads without errors, for every organisation type and
// location (Drive doc 24 v0.3, "Checks on every change", item 2).
const { test, expect } = require("@playwright/test");
const { watchErrors, fresh, step } = require("./helpers");

const ORGS = ["nonprofit", "business", "cci", "sole"];
const LOCS = ["UK", "EU", "CA", "US", "OTHER"];

for (const org of ORGS) {
  for (const loc of LOCS) {
    test(`all steps load: ${org}, ${loc}`, async ({ page }) => {
      const errors = watchErrors(page);
      await fresh(page);
      await page.evaluate(([o, l]) => { state.org = o; state.loc = l; render(); }, [org, loc]);
      for (const n of [1, 2, 3, 4]) {
        await step(page, n);
        await expect(page.locator("#view h2").first()).toBeVisible();
      }
      expect(errors).toEqual([]);
    });
  }
}

test("start your own: pick tools, answer, see results", async ({ page }) => {
  const errors = watchErrors(page);
  await fresh(page);
  await page.click("#startOwn");
  await step(page, 1);
  const chips = page.locator("button.chip[data-lib]");
  for (let i = 0; i < 3; i++) await chips.nth(i).click();
  await expect(page.locator('button.chip[aria-pressed="true"]')).toHaveCount(3);
  await step(page, 2);
  await expect(page.locator("#nextT")).toBeVisible();
  await step(page, 3);
  await step(page, 4);
  expect(errors).toEqual([]);
});

test("answers survive a reload (kept in this browser)", async ({ page }) => {
  await fresh(page);
  await page.click("#startOwn");
  await step(page, 1);
  await page.locator("button.chip[data-lib]").first().click();
  await page.reload();
  await page.waitForFunction(() => typeof state === "object" && state.tools.length === 1);
});
