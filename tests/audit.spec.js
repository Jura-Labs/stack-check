// Regression tests for the accessibility audit of 29 September 2026
// (a11y-auditor; findings S1 to S7 serious, M2, M3, M6, M8, M9 moderate).
const { test, expect } = require("@playwright/test");
const { fresh, step } = require("./helpers");

test("S1: the results page never scrolls sideways; only the register table does", async ({ page }) => {
  for (const width of [320, 640, 1093, 1280, 1366]) {
    await page.setViewportSize({ width, height: 800 });
    await fresh(page);
    for (const s of [3, 4]) {
      await step(page, s);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(over, `page overflow on step ${s} at ${width}px`).toBeLessThanOrEqual(0);
    }
  }
});

test("S2: the step 2 tool list is a list of buttons, with the current tool marked", async ({ page }) => {
  await fresh(page);
  await step(page, 2);
  const current = page.getByRole("list", { name: "Your tools" }).getByRole("button", { name: /Microsoft 365/ });
  await expect(current).toHaveAttribute("aria-current", "true");
});

test("S3 and M2: focus lands on a heading or the right control after actions that rebuild the page", async ({ page }) => {
  await fresh(page);
  await step(page, 2);
  const focused = () => page.evaluate(() => document.activeElement && document.activeElement.id);
  await page.click("#nextT");
  expect(await focused()).toBe("askH");
  await page.click("#prevT");
  expect(await focused()).toBe("askH");
  await page.locator("[data-jump]").nth(3).click();
  expect(await focused()).toBe("askH");

  await step(page, 3);
  await page.click("#clearAll");
  expect(await focused()).toBe("clearNo");
  await page.keyboard.press("Escape");
  await expect(page.locator("#confirmClear")).toBeHidden();
  expect(await focused()).toBe("clearAll");
  await page.click("#clearAll");
  await page.click("#clearNo");
  expect(await focused()).toBe("clearAll");
  await page.click("#clearAll");
  await page.click("#clearYes");
  await expect.poll(() => page.evaluate(() => state.step)).toBe(1);
  expect(await page.evaluate(() => document.activeElement.tagName)).toBe("H2");
});

test("S3: Start your own and Remove keep focus in the page", async ({ page }) => {
  await fresh(page);
  await page.click("#startOwn");
  expect(await page.evaluate(() => document.activeElement.tagName)).toBe("H2");
  await page.fill("#newName", "JustGiving");
  await page.click("#addTool");
  await page.click("[data-remove]");
  expect(await page.evaluate(() => document.activeElement.id)).toBe("newName");
});

test("S4: in forced colours, a chosen answer and the current step look different", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await fresh(page);
  await step(page, 2);
  const styles = await page.evaluate(() => {
    const k = (e) => { const c = getComputedStyle(e); return [c.backgroundColor, c.borderTopWidth, c.borderBottomWidth].join("|"); };
    return {
      checked: k(document.querySelector(".opt input:checked + span")),
      other: k(document.querySelector(".opt input:not(:checked) + span")),
      cur: k(document.querySelector('nav.steps button[aria-current="step"]')),
      not: k(document.querySelector("nav.steps button:not([aria-current])")),
    };
  });
  expect(styles.checked).not.toBe(styles.other);
  expect(styles.cur).not.toBe(styles.not);
});

test("S5: journey map step numbers use the accent ink, readable in dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await fresh(page);
  await step(page, 4);
  const fill = await page.locator(".m-step text").first().evaluate((e) => getComputedStyle(e).fill);
  expect(fill).toBe("rgb(14, 22, 19)");
});

test("S6: the map has a table with every place, its tools, and whose law applies", async ({ page }) => {
  await fresh(page);
  await step(page, 4);
  const table = page.getByRole("region", { name: /The map as a table/ });
  await expect(table).toBeVisible();
  expect(await table.locator("tbody tr").count()).toBe(await page.locator("svg.map").first().locator(".m-pin").count());
  await expect(table).toContainText("ChatGPT");
  await expect(table).toContainText("United States");
  await expect(page.locator("svg.map").first()).toHaveAttribute("aria-label", /table after the map/);
});

test("S7: every question's hint is read with it, and 'Who is this for?' is a named group", async ({ page }) => {
  await fresh(page);
  await step(page, 2);
  const unlinked = await page.evaluate(() => [...document.querySelectorAll(".q .hint")].filter((h) => {
    const fs = h.closest("fieldset");
    return !(h.id && fs.getAttribute("aria-describedby") === h.id);
  }).length);
  expect(unlinked).toBe(0);
  await step(page, 1);
  await expect(page.getByRole("group", { name: "Who is this for?" })).toBeVisible();
});

test("M3: a skip link goes to the questions", async ({ page }) => {
  await fresh(page);
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip")).toBeFocused();
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => document.activeElement.id)).toBe("view");
});

test("M8: adding a tool with no name says why", async ({ page }) => {
  await fresh(page);
  await page.click("#startOwn");
  await page.click("#addTool");
  await expect(page.locator("#newNameErr")).toHaveText("Type the tool's name first.");
  await expect(page.locator("#newName")).toHaveAttribute("aria-invalid", "true");
});

test("M9: links that open a new tab say so", async ({ page }) => {
  await fresh(page);
  for (const s of [1, 2, 3, 4]) {
    await step(page, s);
    const silent = await page.$$eval('a[target="_blank"]', (as) => as.filter((a) => !/opens in a new tab/.test(a.textContent)).length);
    expect(silent, `step ${s}`).toBe(0);
  }
});

test("M4: control edges are at least 3:1 against the card and the page, light and dark", async ({ page }) => {
  for (const scheme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: scheme });
    await fresh(page);
    await step(page, 2);
    const ratio = await page.evaluate(() => {
      const rgb = (s) => s.match(/\d+/g).slice(0, 3).map(Number);
      const lum = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
      const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
      const edge = rgb(getComputedStyle(document.querySelector(".opt span")).borderTopColor);
      const card = rgb(getComputedStyle(document.querySelector(".panel")).backgroundColor);
      const bg = rgb(getComputedStyle(document.body).backgroundColor);
      return Math.min(cr(edge, card), cr(edge, bg));
    });
    expect(ratio, scheme).toBeGreaterThanOrEqual(3);
  }
});

test("M5: on a short screen (high zoom) the step bar is not sticky", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  await fresh(page);
  expect(await page.locator("nav.steps").evaluate((e) => getComputedStyle(e).position)).toBe("static");
});
