// Automated accessibility checks with axe, WCAG 2.2 AA tags, on every step, in
// light and dark schemes and at phone width. Fails on serious or critical
// issues. axe finds only part of what matters: the manual pass in
// skills/stack-check-a11y is still owed before any accessibility claim.
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { fresh, step } = require("./helpers");

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const summary = (v) => v.map((x) => `${x.impact} ${x.id}: ${x.help} (${x.nodes.length}) e.g. ${x.nodes[0].target.join(" ")}`);

for (const scheme of ["light", "dark"]) {
  for (const width of [1280, 320]) {
    for (const n of [1, 2, 3, 4]) {
      test(`axe: step ${n}, ${scheme}, ${width}px`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.setViewportSize({ width, height: 900 });
        await fresh(page);
        await step(page, n);
        const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        const blocking = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        const other = r.violations.filter((v) => !blocking.includes(v));
        if (other.length) console.log(`step ${n} ${scheme} ${width}px, moderate or minor:\n  ` + summary(other).join("\n  "));
        expect(summary(blocking)).toEqual([]);
      });
    }
  }
}

test("keyboard: the step buttons are reachable and focus is visible", async ({ page }) => {
  await fresh(page);
  await page.keyboard.press("Tab");
  let found = false;
  for (let i = 0; i < 40 && !found; i++) {
    const id = await page.evaluate(() => document.activeElement && document.activeElement.id);
    if (id === "nav1") found = true; else await page.keyboard.press("Tab");
  }
  expect(found).toBe(true);
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  expect(outline).not.toBe("none");
});

test("step change: focus moves to the new step's heading, and the page title names the step", async ({ page }) => {
  await fresh(page);
  for (const [n, name] of [[1, "List your tools"], [2, "Answer the questions"], [3, "Decide"], [4, "Follow the data"]]) {
    await step(page, n);
    expect(await page.evaluate(() => document.activeElement.tagName)).toBe("H2");
    await expect(page).toHaveTitle(`Step ${n} of 4, ${name}: Stack Check`);
  }
});

test("the register table can be scrolled from the keyboard", async ({ page }) => {
  await fresh(page);
  await step(page, 3);
  const region = page.locator('.tablewrap[role="region"][aria-labelledby="regH"]');
  await expect(region).toHaveAttribute("tabindex", "0");
});

test("focused fields are kept clear of the sticky step bar", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 700 });
  await fresh(page);
  const pad = await page.evaluate(() => parseFloat(document.documentElement.style.scrollPaddingTop));
  const nav = await page.evaluate(() => document.querySelector("nav.steps").offsetHeight);
  expect(pad).toBeGreaterThanOrEqual(nav);
});

test("open-file buttons show keyboard focus", async ({ page }) => {
  await fresh(page);
  await page.click("#startOwn");
  await page.focus("#openFile1");
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  const outline = await page.locator('label[for="openFile1"]').evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe("none");
});
