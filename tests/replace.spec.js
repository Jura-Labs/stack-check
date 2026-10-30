// Opening a saved file over work in progress asks "Replace your current list?" first
// (Paul, 30 Oct 2026, option 1). With no list of your own, the file opens straight away.
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { watchErrors, fresh, step } = require("./helpers");

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

// A real saved file: the example's nine tools, as Save to a file writes it.
async function savedFile(page) {
  await fresh(page);
  await page.evaluate(() => { state = example(); state.mode = "own"; });
  const text = await page.evaluate(() => { var t = ""; var d = window.downloadFile; window.downloadFile = function (n, m, x) { t = x; }; saveToFile(); window.downloadFile = d; return t; });
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  return { name: "saved.json", mimeType: "application/json", buffer: Buffer.from(text) };
}

// Own work in progress: one tool ticked on step 1.
async function withWork(page) {
  await page.reload();
  await page.click("#startNew");
  await page.click('[data-lib="xero"]');
  await expect.poll(() => page.evaluate(() => state.tools.length)).toBe(1);
}

// The three places "Open a saved file" appears, each reached with work in progress.
const ENTRY = {
  "#openFile0": { status: "#fileStatus", reach: async (page) => { await page.reload(); await expect(page.locator("#startH")).toHaveText("Welcome back"); } },
  "#openFile": { status: "#fileStatus", reach: async (page) => { await step(page, 3); } },
  "#openAny": { status: "#saveAnyStatus", reach: async () => {} },
};

for (const [sel, e] of Object.entries(ENTRY)) {
  test(`${sel}: with a list in progress, asks first; Keep my list changes nothing`, async ({ page }) => {
    const errors = watchErrors(page);
    const file = await savedFile(page);
    await withWork(page);
    await e.reach(page);
    const before = await page.evaluate(() => [JSON.stringify(state.tools), state.step, localStorage.getItem("stackcheck.v5")]);
    await page.setInputFiles(sel, file);
    await expect(page.locator("#confirmReplace")).toBeVisible();
    await expect(page.locator("#confirmReplace")).toContainText("Replace your current list?");
    await expect(page.locator("#replaceNo")).toBeFocused();
    await expect(page.locator(e.status)).toHaveText("Replace your current list?");
    expect(await page.evaluate(() => [JSON.stringify(state.tools), state.step, localStorage.getItem("stackcheck.v5")])).toEqual(before);

    await page.click("#replaceNo");
    await expect(page.locator("#confirmReplace")).toBeHidden();
    await expect(page.locator(sel)).toBeFocused();
    await expect(page.locator(e.status)).toContainText("Nothing was opened");
    expect(await page.evaluate(() => [JSON.stringify(state.tools), state.step, localStorage.getItem("stackcheck.v5")])).toEqual(before);
    expect(errors).toEqual([]);
  });

  test(`${sel}: with a list in progress, Replace it opens the file`, async ({ page }) => {
    const errors = watchErrors(page);
    const file = await savedFile(page);
    await withWork(page);
    await e.reach(page);
    await page.setInputFiles(sel, file);
    await expect(page.locator("#replaceNo")).toBeFocused();
    await page.click("#replaceYes");
    await expect(page.locator("#confirmReplace")).toBeHidden();
    await expect.poll(() => page.evaluate(() => state.tools.length)).toBe(9);
    await expect(page.locator("#fileStatus")).toContainText("9 tools");
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("stackcheck.v5")).tools.length)).toBe(9);
    expect(errors).toEqual([]);
  });
}

test("Escape keeps the list, like Keep my list", async ({ page }) => {
  const file = await savedFile(page);
  await withWork(page);
  await page.setInputFiles("#openAny", file);
  await expect(page.locator("#replaceNo")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#confirmReplace")).toBeHidden();
  await expect(page.locator("#openAny")).toBeFocused();
  expect(await page.evaluate(() => state.tools.length)).toBe(1);
});

test("no list of your own: the file opens straight away, from the start screen, the example and an empty step 1", async ({ page }) => {
  const file = await savedFile(page);
  // A blank start screen
  await page.reload();
  await expect(page.locator("#startH")).toHaveText("Start here");
  await page.setInputFiles("#openFile0", file);
  await expect.poll(() => page.evaluate(() => state.tools.length)).toBe(9);
  await expect(page.locator("#confirmReplace")).toBeHidden();
  // The example, with nothing of your own saved
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload();
  await page.click("#seeExample");
  await page.setInputFiles("#openFile", file);
  await expect.poll(() => page.evaluate(() => state.mode)).toBe("own");
  await expect(page.locator("#confirmReplace")).toBeHidden();
  // A new list with no tools yet
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload();
  await page.click("#startNew");
  await page.setInputFiles("#openAny", file);
  await expect.poll(() => page.evaluate(() => state.tools.length)).toBe(9);
  await expect(page.locator("#confirmReplace")).toBeHidden();
});

for (const scheme of ["light", "dark"]) {
  test(`axe: the replace question, ${scheme}, 320px, has no serious issues`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.setViewportSize({ width: 320, height: 900 });
    const file = await savedFile(page);
    await withWork(page);
    await page.setInputFiles("#openAny", file);
    await expect(page.locator("#confirmReplace")).toBeVisible();
    const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes[0].target.join(" ")}`)).toEqual([]);
  });
}
