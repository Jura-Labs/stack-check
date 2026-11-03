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

test("#32: above phone width the steps are one row of four, two rows of two, or one a row, never three and one", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await fresh(page);
  await step(page, 1);
  const rows = () => page.evaluate(() => { const by = {}; for (const l of document.querySelectorAll("nav.steps li")) { const t = Math.round(l.getBoundingClientRect().top); by[t] = (by[t] || 0) + 1; } return Object.values(by).join("+"); });
  expect(await rows(), "1280px, normal text").toBe("4");
  for (const w of [561, 640, 700, 761, 768, 820, 900, 1024, 1280]) {
    await page.setViewportSize({ width: w, height: 800 });
    for (const size of ["", "125%", "150%", "200%"]) {
      await textSize(page, size);
      expect(["4", "2+2", "1+1+1+1"], `${w}px text ${size || "100%"}`).toContain(await rows());
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    }
  }
});

test("#33: the decision and date fields on step 3 pass target size at 200% text", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await fresh(page);
  await step(page, 3);
  await textSize(page, "200%");
  // Every row of the register, each scrolled into view in turn.
  const n = await page.locator("table.reg tbody tr").count();
  for (let i = 0; i < n; i++) {
    await page.locator("table.reg tbody tr").nth(i).scrollIntoViewIfNeeded();
    const r = await new AxeBuilder({ page }).include("table.reg tbody tr:nth-child(" + (i + 1) + ")").withRules(["target-size"]).analyze();
    expect(r.violations.flatMap((v) => v.nodes.map((n) => n.target.join(" "))), `row ${i + 1}`).toEqual([]);
  }
});

test("#33: at normal text the decision select is wide enough for its longest choice", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await fresh(page);
  await step(page, 3);
  // At 200% text the closed select still cuts off "Reduce dependency" in a four-column table
  // at 1280px; it was 31px wide before 2.2.14. Open, the choices show in full.
  for (const size of [""]) {
    await textSize(page, size);
    const r = await page.evaluate(() => [...document.querySelectorAll("table.reg select")].map((s) => {
      const c = document.createElement("canvas").getContext("2d"); const cs = getComputedStyle(s); c.font = cs.font;
      const text = Math.max(...[...s.options].map((o) => c.measureText(o.text).width));
      return { have: s.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), need: text + 20 }; // 20px for the arrow
    }));
    for (const x of r) expect(x.have, `text ${size || "100%"}`).toBeGreaterThanOrEqual(x.need);
  }
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
  // It says why, in a status line, and focus is on the start screen's heading.
  await expect(other.locator("#fileStatus")).toHaveText("Your list was cleared or replaced in another tab.");
  await expect(other.locator("#fileStatus")).toHaveAttribute("role", "status");
  expect(await other.evaluate(() => document.activeElement.tagName + " " + document.activeElement.textContent)).toMatch(/^H2 /);

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

test("#21: Clear everything with no tools listed is not undone by a second tab (privacy check, PR #35)", async ({ page, context }) => {
  await fresh(page);
  await page.evaluate(() => { state = blank(); state.mode = "own"; state.org = "cci"; state.loc = "EU"; state.home = "DK"; state.ccy = "DKK"; render(); });
  await step(page, 3);
  expect(await page.evaluate(() => localStorage.getItem("stackcheck.v5"))).toContain("DKK");
  const other = await context.newPage();
  await stubAnalytics(other);
  await other.goto("/index.html");
  await other.waitForFunction(() => typeof render === "function" && !!document.querySelector("#view").children.length);
  await other.evaluate(() => { state = load(); go(3); });
  expect(await other.evaluate(() => state.ccy)).toBe("DKK");

  await page.click("#clearAll");
  await page.click("#clearYes");
  await expect.poll(() => other.evaluate(() => state.step)).toBe(0);
  await other.click("#startNew");
  await other.click("#nav3");
  const saved = await page.evaluate(() => localStorage.getItem("stackcheck.v5") || "");
  for (const old of ['"cci"', '"DK"', "DKK"]) expect(saved).not.toContain(old);
});

test("#19: no unicode line break in a name or next step can start a line of Copy for owners, or get into a register cell", async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => {
    window.__copied = [];
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: (t) => { window.__copied.push(t); return Promise.resolve(); } } });
    state.mode = "own";
    state.tools[0].owner = "A\u2028=1+1"; state.tools[1].owner = "B\u2029@X"; state.tools[2].owner = "C\v=2"; state.tools[3].owner = "D\f=3";
    state.tools[4].owner = "E\u0085-4"; state.tools[3].name = "N\u2028=HYPERLINK(1)"; state.tools[3].next = "Tidy\u2029=1+1";
    render();
  });
  await step(page, 3);
  await page.click("#copyOwners");
  await expect.poll(() => page.evaluate(() => window.__copied.length)).toBe(1);
  const text = await page.evaluate(() => window.__copied[0]);
  for (const line of text.split(/[\n\r\v\f\u0085\u2028\u2029]/)) expect(line === "" || /^(- |Owner: |Nobody yet|Your )/.test(line), JSON.stringify(line)).toBe(true);
  const cells = await page.evaluate(() => [...state.tools.slice(0, 5).map((t) => tsvCell(t.owner)), tsvCell(state.tools[3].name)]);
  for (const c of cells) expect(c).not.toMatch(/[\v\f\u0085\u2028\u2029]/);
});
