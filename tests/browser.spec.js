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

test("tools doing the same job: two accounting tools are grouped (the rule matched no real job before)", async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => {
    state.mode = "own";
    const a = fromLib(BYID["xero"]), b = fromLib(BYID["quickbooks-online"]), c = fromLib(BYID["online-banking"]);
    for (const t of [a, b, c]) Object.assign(t, { owner: "Finance lead", account: "Organisation", admins: "Two or more", depend: "Important", data: "Internal", signin: "Yes" });
    state.tools = [a, b, c];
    render();
  });
  await step(page, 3);
  const dup = page.locator("#dupH").locator("xpath=ancestor::section[1]");
  await expect(dup).toContainText("Accounts");
  await expect(dup).toContainText("Xero");
  await expect(dup).not.toContainText("Online banking");
});

test("every tool in the library can be chosen, answered and shown on the results and map", async ({ page }) => {
  const errors = watchErrors(page);
  await fresh(page);
  await page.click("#startOwn");
  await step(page, 1);
  const n = await page.evaluate(() => {
    const all = [];
    LIB.forEach((g) => g.items.forEach((l) => all.push(l)));
    state.tools = all.map((l) => Object.assign(fromLib(l), { owner: "Office manager", account: "Organisation", admins: "Two or more", depend: "Important", data: "Personal", signin: "Yes", copy: "No" }));
    render();
    return all.length;
  });
  expect(n).toBeGreaterThanOrEqual(100);
  for (const s of [2, 3, 4]) {
    await step(page, s);
    await expect(page.locator("#view h2").first()).toBeVisible();
  }
  await step(page, 3);
  await expect(page.locator("#regH")).toBeVisible();
  expect(await page.locator("#view table tbody tr").count()).toBeGreaterThanOrEqual(n);
  expect(errors).toEqual([]);
});
