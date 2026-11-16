// Paul's decisions of 16 November 2026 (decisions/2026-11-16-stack-check-open-source.md, W47-19):
// no open-source count; an exit line for critical tools on the one-page summary; one definition for the
// library's open-source field, with only a checked value pre-filling the answer; and a new hint.
// Scoring is unchanged: these test the summary, the pre-fill and the words.
const { test, expect } = require("@playwright/test");
const { fresh, step } = require("./helpers");

async function own(page, org, tools) {
  await fresh(page);
  await page.evaluate(([org, tools]) => {
    state = blank(); state.mode = "own"; state.org = org; state.loc = "UK"; state.home = "GB"; state.ccy = "GBP";
    state.tools = tools.map((x) => Object.assign(x.lib ? fromLib(BYID[x.lib]) : fromLib(x.custom), x.a || {}));
    state.cur = 0; render();
  }, [org, tools]);
}
const BASE = { owner: "Office manager", account: "Organisation", admins: "Two or more", data: "Personal", signin: "Yes" };
const crit = (a) => Object.assign({}, BASE, { depend: "Critical" }, a);

test("item 2: the summary says how many critical tools have a full export and a tested copy", async ({ page }) => {
  await own(page, "nonprofit", [
    { lib: "xero", a: crit({ exp: "Yes", copy: "Yes" }) },
    { lib: "mailchimp", a: crit({ exp: "Yes", copy: "Yes" }) },
    { lib: "zoom", a: crit({ exp: "No", copy: "No" }) },
    { lib: "canva", a: Object.assign({}, BASE, { depend: "Minor", exp: "Yes", copy: "Yes" }) },
  ]);
  const b = await page.evaluate(() => board());
  expect(b).toContain("2 of our 3 critical tools have a full export and a tested copy.");
  expect(b).not.toMatch(/open source/i);
});

test("item 2: one critical tool, one green, and devices counted on their own, in the I voice", async ({ page }) => {
  await own(page, "sole", [
    { lib: "xero", a: crit({ owner: "Me", exp: "Yes", copy: "Yes" }) },
    { lib: "win10", a: crit({ owner: "Me", copy: "No" }) },
  ]);
  const b = await page.evaluate(() => board());
  expect(b).toContain("My critical tool has a full export and a tested copy.");
  expect(b).toContain("My critical device or desktop app does not yet have a tested backup.");
});

test("item 2: no line when nothing is critical, and the suggested action is unchanged", async ({ page }) => {
  await own(page, "nonprofit", [{ lib: "xero", a: Object.assign({}, BASE, { depend: "Important", exp: "No", copy: "No" }) }]);
  expect(await page.evaluate(() => board())).not.toContain("critical tool");
  expect(await page.evaluate(() => action(state.tools[0]))).toBe("Review this year");
});

test("item 3: the six corrected entries are open source, and an unchecked value does not pre-fill", async ({ page }) => {
  await fresh(page);
  const r = await page.evaluate(() => ({
    six: ["plausible-analytics", "umami-cloud", "mattermost-cloud", "element", "pretix", "matomo-cloud"].map((id) => BYID[id].o),
    words: [OPENW(true), OPENW(false), OPENW(undefined), OPENW(null)],
    custom: fromLib({ name: "Our own tool", job: "x" }).open,
    checkedNo: fromLib(BYID["xero"]).open,
  }));
  expect(r.six).toEqual([true, true, true, true, true, true]);
  expect(r.words).toEqual(["Yes", "No", "", ""]);
  expect(r.custom).toBe("");
  expect(r.checkedNo).toBe("No");
});

test("item 4: the open-source hint says it does not mean safer or cheaper", async ({ page }) => {
  await own(page, "nonprofit", [{ lib: "xero", a: BASE }]);
  await step(page, 2);
  const html = await page.evaluate(() => document.body.innerHTML);
  expect(html).toContain("Open source?");
  expect(html).toContain("Open source does not mean safer or cheaper. It means another provider could run the same software for you.");
  expect(html).not.toContain("do not treat it as proof that a tool is safer");
});
