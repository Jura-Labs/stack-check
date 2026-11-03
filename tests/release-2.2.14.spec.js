// 2.2.14 (W44-15, 3 Nov 2026): large text (#32, #33, #34) and Clear everything with two tabs open (#21).
// Text size is set on the root element, the same way as tests/step-bar.spec.js.
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { fresh, step, stubAnalytics, watchErrors } = require("./helpers");

async function textSize(page, size) {
  await page.evaluate((s) => { document.documentElement.style.fontSize = s; }, size);
  await page.waitForTimeout(50); // let the step bar's size observer run
}

// What sticks out past the right edge of the page inside a region.
function outside(page, sel) {
  return page.evaluate((sel) => [...document.querySelectorAll(sel + " *")]
    .filter((e) => { const b = e.getBoundingClientRect(); return b.width && b.right > innerWidth + 1; })
    .map((e) => e.tagName + "." + (typeof e.className === "string" ? e.className : "")), sel);
}

test("#32: the header and the step bar stay inside the page at 300% and 400% text", async ({ page }) => {
  for (const [w, h] of [[320, 640], [640, 800], [1280, 800]]) {
    await page.setViewportSize({ width: w, height: h });
    await fresh(page);
    for (const s of [0, 1, 3]) {
      if (s) await step(page, s);
      for (const size of ["300%", "400%"]) {
        await textSize(page, size);
        expect(await outside(page, "header.top"), `${w}px step ${s} text ${size}: header`).toEqual([]);
        expect(await outside(page, "nav.steps"), `${w}px step ${s} text ${size}: step bar`).toEqual([]);
      }
      await textSize(page, "");
    }
  }
});

test("#32: at normal text on a wide screen the four steps are still one row", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await fresh(page);
  await step(page, 1);
  const tops = await page.evaluate(() => [...document.querySelectorAll("nav.steps li")].map((l) => Math.round(l.getBoundingClientRect().top)));
  expect(new Set(tops).size).toBe(1);
});

test("#33: the decision and date fields on step 3 pass target size at 200% text", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await fresh(page);
  await step(page, 3);
  await textSize(page, "200%");
  for (const y of [0, 600, 1400]) {
    await page.evaluate((y) => scrollTo(0, y), y);
    const r = await new AxeBuilder({ page }).withRules(["target-size"]).analyze();
    expect(r.violations.flatMap((v) => v.nodes.map((n) => n.target.join(" "))), `scrolled to ${y}`).toEqual([]);
  }
  // Neither field is squeezed narrower than it can be used.
  const widths = await page.evaluate(() => [...document.querySelectorAll("table.reg select, table.reg input[type=date]")].map((e) => e.getBoundingClientRect().width));
  for (const wd of widths) expect(wd).toBeGreaterThanOrEqual(100);
});

test("#34: the step 3 priority list does not scroll sideways at 320px with text at 200%", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await fresh(page);
  await step(page, 3);
  await textSize(page, "200%");
  expect(await outside(page, "ol.prio")).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test("#21: Clear everything in one tab is not undone by a second open tab", async ({ page, context }) => {
  const errors = watchErrors(page);
  await fresh(page);
  await page.evaluate(() => { state.mode = "own"; state.tools[0].owner = "Finance lead"; render(); });
  await step(page, 3);
  expect(await page.evaluate(() => localStorage.getItem("stackcheck.v5"))).toContain("Finance lead");

  // A second tab, in the same browser, carries on with the same list.
  const other = await context.newPage();
  const otherErrors = watchErrors(other);
  await stubAnalytics(other);
  await other.goto("/index.html");
  await other.waitForFunction(() => typeof render === "function" && !!document.querySelector("#view").children.length);
  await other.click("#carryOn");
  await expect.poll(() => other.evaluate(() => state.step)).toBe(3);
  expect(await other.evaluate(() => state.tools.length)).toBeGreaterThan(0);

  // Clear everything in the first tab.
  await page.click("#clearAll");
  await page.click("#clearYes");
  await expect.poll(() => page.evaluate(() => state.step)).toBe(1);

  // The second tab drops its copy and shows the start screen, with no list to carry on.
  await expect.poll(() => other.evaluate(() => state.step)).toBe(0);
  expect(await other.evaluate(() => JSON.stringify(state))).not.toContain("Finance lead");
  await expect(other.locator("#carryOn")).toHaveCount(0);

  // Moving around in the second tab writes nothing old back.
  await other.click("#startNew");
  await expect.poll(() => other.evaluate(() => state.step)).toBe(1);
  await other.click("#nav3");
  expect(await page.evaluate(() => localStorage.getItem("stackcheck.v5") || "")).not.toContain("Finance lead");

  // The tab that cleared was not sent back to the start screen by the other one.
  expect(await page.evaluate(() => [state.step, state.tools.length])).toEqual([1, 0]);
  expect(errors).toEqual([]);
  expect(otherErrors).toEqual([]);
});

test("#21: an edit to the same list in another tab does not reset this tab; a different list does", async ({ page, context }) => {
  await fresh(page);
  await page.evaluate(() => { state.mode = "own"; render(); });
  await step(page, 2);
  const other = await context.newPage();
  await stubAnalytics(other);
  await other.goto("/index.html");
  await other.waitForFunction(() => typeof render === "function" && !!document.querySelector("#view").children.length);
  await other.click("#carryOn");
  await expect.poll(() => other.evaluate(() => state.step)).toBe(2);

  // An edit in the first tab, and Carry on in the second, leave both where they are.
  await page.evaluate(() => { state.tools[0].owner = "Office manager 2"; save(); });
  await other.waitForTimeout(200);
  expect(await other.evaluate(() => state.step)).toBe(2);
  expect(await page.evaluate(() => state.step)).toBe(2);

  // A different list saved in the first tab: the second shows the start screen, and Carry on brings it.
  await page.evaluate(() => { state.tools = state.tools.slice(0, 2); save(); });
  await expect.poll(() => other.evaluate(() => state.step)).toBe(0);
  await other.click("#carryOn");
  expect(await other.evaluate(() => state.tools.length)).toBe(2);
  // Carry on in the second tab saves the same list, so the first tab is not reset by it.
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => state.step)).toBe(2);
});
