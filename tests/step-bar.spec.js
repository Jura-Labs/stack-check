// The sticky step bar (W44-15, 2 Nov 2026), from the a11y audit of 1 Nov 2026: at 320px with text
// at 200% the bar was about 145px tall, its words broke mid-word, and while sticky it could cover the
// control in focus (WCAG 2.4.11).
const { test, expect } = require("@playwright/test");
const { fresh, step } = require("./helpers");

function bar(page) {
  return page.evaluate(() => {
    const nav = document.querySelector("nav.steps");
    const lines = [...nav.querySelectorAll(".short")].map((e) => { const r = document.createRange(); r.selectNodeContents(e); return r.getClientRects().length; });
    return { h: nav.offsetHeight, position: getComputedStyle(nav).position, lines, vh: innerHeight };
  });
}

test("at 320px with text at 150% and 200%, step names never break mid-word and a tall bar is not sticky", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await fresh(page);
  await step(page, 1);
  for (const size of ["150%", "200%"]) {
    await page.evaluate((s) => { document.documentElement.style.fontSize = s; }, size);
    await page.waitForTimeout(50); // let the bar's size observer run
    const b = await bar(page);
    console.log(`320x640 ${size}: bar ${b.h}px, ${b.position}, lines ${b.lines}`);
    expect(b.lines, `${size}: each step name on one line`).toEqual([1, 1, 1, 1]);
    expect(b.position === "static" || b.h <= b.vh / 5, `${size}: bar ${b.h}px is ${b.position}`).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), size).toBeLessThanOrEqual(0);
    if (b.position === "static") expect(await page.evaluate(() => document.documentElement.style.scrollPaddingTop), size).toBe("");
  }
  // Back to normal text, the bar is one row and sticky again.
  await page.evaluate(() => { document.documentElement.style.fontSize = ""; });
  await page.waitForTimeout(50);
  const b = await bar(page);
  expect(b.position).toBe("sticky");
  expect(b.lines).toEqual([1, 1, 1, 1]);
});

test("on a desktop, tabbing to a chip scrolled under the sticky bar brings it clear of the bar", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await fresh(page);
  await step(page, 1);
  expect((await bar(page)).position).toBe("sticky");
  const chips = page.locator("button.chip:visible");
  const i = 12;
  // Scroll so the chip sits just under the bar, then Tab to it from the chip before.
  await chips.nth(i).evaluate((c) => {
    const nav = document.querySelector("nav.steps").getBoundingClientRect();
    window.scrollBy(0, c.getBoundingClientRect().top - nav.top - 4);
  });
  await chips.nth(i - 1).evaluate((c) => c.focus({ preventScroll: true }));
  await page.keyboard.press("Tab");
  const r = await page.evaluate(() => {
    const a = document.activeElement.getBoundingClientRect();
    const nav = document.querySelector("nav.steps").getBoundingClientRect();
    return { isChip: document.activeElement.classList.contains("chip"), top: a.top, navBottom: nav.bottom };
  });
  expect(r.isChip).toBe(true);
  expect(r.top, "the focused chip is below the bar").toBeGreaterThanOrEqual(r.navBottom);
});
