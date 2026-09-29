// Fixes from the persona walk-through of 29 September 2026 (audience-tester):
// finding tools, knowing where you are, saving on any step, the board summary.
const { test, expect } = require("@playwright/test");
const { fresh, step } = require("./helpers");

async function startOwn(page) {
  await fresh(page);
  await page.click("#startOwn");
  await expect.poll(() => page.evaluate(() => state.step)).toBe(1);
}

test("search finds tools by the names people use (SharePoint, Gmail, Vipps)", async ({ page }) => {
  await startOwn(page);
  for (const [q, id] of [["SharePoint", "microsoft-365"], ["gmail", "google-workspace"], ["Vipps", "mobilepay"], ["gift aid", "hmrc-online"]]) {
    await page.fill("#findTool", q);
    await expect(page.locator(`[data-lib="${id}"]`)).toBeVisible();
  }
});

test("search keeps its text after ticking, and a count is announced", async ({ page }) => {
  await startOwn(page);
  await page.fill("#findTool", "xero");
  await page.click('[data-lib="xero"]');
  await expect(page.locator("#findTool")).toHaveValue("xero");
  await expect(page.locator('[data-lib="asana"]')).toBeHidden();
  await expect(page.locator("#pickCount")).toHaveText("Added Xero. 1 tool chosen.");
});

test("no match says so and offers the name for 'Something not on the list?'", async ({ page }) => {
  await startOwn(page);
  await page.fill("#findTool", "Charitylog");
  await expect(page.locator("#findNone")).toContainText('Nothing called "Charitylog"');
  await expect(page.locator("#newName")).toHaveValue("Charitylog");
});

test("the step bar shows how many tools are chosen and answered", async ({ page }) => {
  await fresh(page);
  await expect(page.locator("#nav1 .sub")).toHaveText("9 tools chosen");
  await expect(page.locator("#nav2 .sub")).toHaveText("9 of 9 answered");
  await page.click("#startOwn");
  await expect(page.locator("#nav1 .sub")).toHaveText("Tick what you use");
  await page.click('[data-lib="xero"]');
  await page.click('[data-lib="canva"]');
  await expect(page.locator("#nav2 .sub")).toHaveText("0 of 2 answered");
});

test("step 2 says how many are left, and results are one click away", async ({ page }) => {
  await startOwn(page);
  await page.click('[data-lib="xero"]');
  await page.click('[data-lib="canva"]');
  await step(page, 2);
  await expect(page.locator("#view")).toContainText("Tool 1 of 2. 0 answered, 2 to go.");
  await page.click("#toResults");
  await expect.poll(() => page.evaluate(() => state.step)).toBe(3);
});

test("on Decide, focus starts on the 'not answered yet' warning when there is one", async ({ page }) => {
  await startOwn(page);
  await page.click('[data-lib="xero"]');
  await step(page, 3);
  await expect(page.locator("#view > .banner")).toBeFocused();
});

test("Save to a file is on every step", async ({ page }) => {
  await fresh(page);
  for (const [s, id] of [[1, "#saveAny"], [2, "#saveAny"], [3, "#saveFile"], [4, "#saveAny"]]) {
    await step(page, s);
    const [d] = await Promise.all([page.waitForEvent("download"), page.click(id)]);
    expect(d.suggestedFilename()).toMatch(/^stack-check-.*\.json$/);
  }
});

test("Your data speaks to businesses as businesses, and never says '0 places'", async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => { state.org = "business"; state.journeys = []; state.jcur = -1; });
  await step(page, 4);
  await expect(page.locator("#view")).toContainText("usually your customers, then your staff.");
  await page.evaluate(() => { state.journeys = [{ title: "A customer orders", who: "Customer", stops: [] }]; state.jcur = 0; render(); });
  await expect(page.locator("#view")).not.toContainText("find them in 0 places");
});

test("the board summary: one line for second admins, no £0 costs, a date, and unanswered tools named", async ({ page }) => {
  await fresh(page);
  const text = await page.evaluate(() => {
    state.mode = "own";
    const base = { owner: "Office manager", account: "Organisation", admins: "One person", depend: "Important", data: "Internal", signin: "Yes", where: "UK, EU or EEA", based: "UK or Europe", terms: "Yes", exp: "Yes", copy: "Yes", value: "Green", cost: "" };
    state.tools = ["xero", "canva", "trello"].map((id) => Object.assign(fromLib(BYID[id]), base));
    state.tools.push(fromLib(BYID["asana"]));
    return board();
  });
  expect(text).toMatch(/summary for our trustees, \d{1,2} \w+ \d{4}/);
  expect(text).toContain("- Add a second admin to 3 tools: Xero, Canva, Trello.");
  expect(text).not.toContain("Listed licence costs");
  expect(text).toContain("1 tool is not answered yet and not included below.");
});
