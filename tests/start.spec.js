// Paul's decisions of 29 September 2026: a start screen; the example is
// read-only; a one-line privacy box after step 1; "your team" for small
// businesses; a print button on Decide.
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { watchErrors, fresh, step } = require("./helpers");

test("first visit opens on a start screen, not on the example's results", async ({ page }) => {
  await fresh(page);
  await expect(page.locator("#startH")).toHaveText("Start here");
  await expect(page).toHaveTitle("Stack Check: stay in command of your technology");
  await expect(page.locator("#exampleBanner")).toBeHidden();
  expect(await page.locator("nav.steps [aria-current]").count()).toBe(0);
  await expect(page.locator("#view")).toContainText("about 2 minutes a tool");
});

test("start screen: See the example, and Start your own", async ({ page }) => {
  await fresh(page);
  await page.click("#seeExample");
  await expect.poll(() => page.evaluate(() => state.step)).toBe(3);
  await expect(page.locator("#exampleBanner")).toBeVisible();
  await page.reload();
  await page.click("#startNew");
  await expect.poll(() => page.evaluate(() => [state.step, state.mode, state.tools.length])).toEqual([1, "own", 0]);
});

test("coming back: Welcome back with progress, and Carry on returns to where they were", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await page.click('[data-lib="xero"]');
  await page.click('[data-lib="canva"]');
  await step(page, 2);
  await page.reload();
  await expect(page.locator("#startH")).toHaveText("Welcome back");
  await expect(page.locator("#view")).toContainText("0 of 2 tools answered");
  await page.click("#carryOn");
  await expect.poll(() => page.evaluate(() => state.step)).toBe(2);
});

test("Start a new list with work in progress asks first", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await page.click('[data-lib="xero"]');
  await page.reload();
  await page.click("#startNew");
  await expect(page.locator("#confirmClear")).toBeVisible();
  await expect(page.locator("#clearNo")).toBeFocused();
});

test("the example is read-only: ticking, deciding and typing are stopped, with a clear offer", async ({ page }) => {
  const errors = watchErrors(page);
  await fresh(page);
  await page.click("#seeExample");
  const before = await page.evaluate(() => JSON.stringify(state.tools));
  // A decision in the register
  const key = await page.evaluate(() => state.tools[0].key);
  await page.selectOption(`#dec-${key}`, "Retire");
  await expect(page.locator("#exampleEdit")).toBeVisible();
  await expect(page.locator("#exStart")).toBeFocused();
  expect(await page.evaluate((k) => state.tools.find((t) => t.key === k).decision, key)).not.toBe("Retire");
  await page.click("#exKeep");
  await expect(page.locator("#exampleEdit")).toBeHidden();
  // A tick on step 1
  await step(page, 1);
  await page.click('[data-lib="asana"]');
  await expect(page.locator("#exampleEdit")).toBeVisible();
  await page.keyboard.press("Escape");
  // An answer on step 2
  await step(page, 2);
  await page.locator('#view input[type="radio"]').nth(1).check({ force: true }).catch(() => {});
  expect(await page.evaluate(() => JSON.stringify(state.tools))).toBe(before);
  expect(await page.evaluate(() => state.mode)).toBe("example");
  expect(errors).toEqual([]);
});

test("the example can still be explored: steps, compare, the map's toggle, organisation type", async ({ page }) => {
  await fresh(page);
  await page.click("#seeExample");
  await page.locator('details[data-fold="cmp"] summary').click();
  await page.selectOption("#cmpB", "google-workspace");
  await expect(page.locator("#exampleEdit")).toBeHidden();
  await step(page, 4);
  await page.locator("[data-law]").first().click();
  await expect(page.locator("#exampleEdit")).toBeHidden();
  await step(page, 1);
  await page.locator('label[for="org-1"]').click();
  await expect(page.locator("#exampleEdit")).toBeHidden();
  expect(await page.evaluate(() => state.org)).toBe("cci");
});

test("Start your own from the prompt; and looking at the example never overwrites your list", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await page.click('[data-lib="xero"]');
  await page.reload();
  await page.click("#seeExample");
  await expect(page.locator("#startOwn")).toHaveText("Back to your list");
  await step(page, 1);
  await page.click('[data-lib="asana"]');
  await expect(page.locator("#exStart")).toHaveText("Back to your list");
  await page.click("#exStart");
  await expect.poll(() => page.evaluate(() => [state.mode, state.tools.map((t) => t.lib)])).toEqual(["own", ["xero"]]);
});

test("after step 1 the privacy box is one line, the claims row 28 sentence", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await expect(page.locator(".privacy .pmore")).toBeVisible();
  await page.click('[data-lib="xero"]');
  await step(page, 2);
  await expect(page.locator(".privacy .pmore")).toBeHidden();
  await expect(page.locator(".privacy b")).toHaveText("No account. Your answers stay in this browser and are never sent anywhere.");
});

test("small businesses see 'your team'; UK charities 'trustees'; others 'board'", async ({ page }) => {
  await fresh(page);
  const words = await page.evaluate(() => {
    const out = {};
    for (const [org, loc] of [["business", "UK"], ["nonprofit", "UK"], ["nonprofit", "EU"], ["cci", "UK"], ["sole", "UK"]]) {
      state.org = org; state.loc = loc;
      out[org + "-" + loc] = [BOARD(), ACT("Trustee decision")];
    }
    return out;
  });
  expect(words).toEqual({
    "business-UK": ["team", "Team decision"],
    "nonprofit-UK": ["trustees", "Trustee decision"],
    "nonprofit-EU": ["board", "Board decision"],
    "cci-UK": ["board", "Board decision"],
    "sole-UK": ["", "Your decision"],
  });
});

test("Decide has a print button at the end, like Your data", async ({ page }) => {
  await fresh(page);
  await page.click("#seeExample");
  await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
  await page.click("#printDecide");
  expect(await page.evaluate(() => window.__printed)).toBe(1);
});

test("axe: the start screen, light and dark, has no serious issues", async ({ page }) => {
  for (const scheme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: scheme });
    await fresh(page);
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
  }
});

test("Decide tiles: no Critical tile; Personal data says 'tools hold this data'; Fix now has no 'usually free' (Paul, 29 Sep)", async ({ page }) => {
  await fresh(page);
  await page.click("#seeExample");
  const tiles = page.locator(".tiles .tile");
  const headings = await page.locator(".tiles .tile .eyebrow").allTextContents();
  expect(headings).not.toContain("Critical");
  await expect(tiles.filter({ hasText: "Personal data" })).toContainText("tools hold this data");
  // "usually free" is gone from Fix now (Paul, 29 Sep)
  await expect(tiles.filter({ hasText: "Fix now" })).not.toContainText("usually free");
});

test("not-for-profits only: no business option in the picker; a saved business list still opens (Paul, 30 Sep)", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await expect(page.locator('input[name="org"]')).toHaveCount(3);
  await expect(page.locator("#view")).not.toContainText("A small or medium business");
  const opened = await page.evaluate(() => stateFromFile(JSON.stringify({ app: "stack-check", state: { v: 6, org: "business", tools: [{ name: "Xero", data: "Internal" }] } })).org);
  expect(opened).toBe("business");
});

test("card links go to the guide's cards page anchors", async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => { state.mode = "own"; state.tools.find((t) => t.lib === "dropbox").decision = "Retire"; });
  await step(page, 3);
  await page.locator('details[data-fold="cards"] summary').click();
  const href = await page.locator('details[data-fold="cards"] a', { hasText: "Full card" }).first().getAttribute("href");
  expect(href).toBe("https://juralabs.org/updates/stay-in-command-of-your-technology/reference-cards#files");
});
