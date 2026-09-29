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
