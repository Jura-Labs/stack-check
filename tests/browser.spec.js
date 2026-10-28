// Each of the four steps loads without errors, for every organisation type and
// location (Drive doc 24 v0.3, "Checks on every change", item 2).
const { test, expect } = require("@playwright/test");
const { watchErrors, fresh, step } = require("./helpers");

test("the footer's checked dates match the library, and each tool shows its own", async ({ page }) => {
  await fresh(page);
  const d = await page.evaluate(() => ({ first: longDate(CHECKED), last: longDate(lastChecked()), bs: longDate(checkedOn("betalingsservice")), ms: longDate(checkedOn("microsoft-365")) }));
  expect(d.first).toBe("29 September 2026");
  expect(d.ms).toBe("29 September 2026");
  expect(d.bs).not.toBe("29 September 2026");
  const footer = await page.locator("footer").innerText();
  expect(footer).toContain("between " + d.first.replace(" 2026", "") + " and " + d.last);
});

const ORGS = ["nonprofit", "business", "cci", "sole"];
const LOCS = ["UK", "EU", "CA", "US", "OTHER"];

for (const org of ORGS) {
  for (const loc of LOCS) {
    test(`all steps load: ${org}, ${loc}`, async ({ page }) => {
      const errors = watchErrors(page);
      await fresh(page);
      await page.evaluate(([o, l]) => { state.org = o; state.loc = l; render(); }, [org, loc]);
      for (const n of [1, 2, 3, 4]) {
        await step(page, n);
        await expect(page.locator("#view h2").first()).toBeVisible();
      }
      expect(errors).toEqual([]);
    });
  }
}

test("start your own: pick tools, answer, see results", async ({ page }) => {
  const errors = watchErrors(page);
  await fresh(page);
  await page.click("#startNew");
  await step(page, 1);
  const chips = page.locator("button.chip[data-lib]");
  for (let i = 0; i < 3; i++) await chips.nth(i).click();
  await expect(page.locator('button.chip[aria-pressed="true"]')).toHaveCount(3);
  await step(page, 2);
  await expect(page.locator("#nextT")).toBeVisible();
  await step(page, 3);
  await step(page, 4);
  expect(errors).toEqual([]);
});

test("answers survive a reload (kept in this browser)", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await step(page, 1);
  await page.locator("button.chip[data-lib]").first().click();
  await page.reload();
  await page.waitForFunction(() => typeof state === "object" && state.tools.length === 1);
});

test("tools that may be doing a similar job: two accounting tools are grouped (the rule matched no real job before)", async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => {
    state.mode = "own";
    const a = fromLib(BYID["xero"]), b = fromLib(BYID["quickbooks-online"]), c = fromLib({ name: "Online banking", job: "Bank account", k: "Software" }); // added by hand: no longer in the library
    for (const t of [a, b, c]) Object.assign(t, { owner: "Finance lead", account: "Organisation", admins: "Two or more", depend: "Important", data: "Internal", signin: "Yes" });
    state.tools = [a, b, c];
    render();
  });
  await step(page, 3);
  const dup = page.locator("#dupH").locator("xpath=ancestor::section[1]");
  await expect(dup).toContainText("Accounts");
  await expect(dup).toContainText("Xero");
  await expect(dup).not.toContainText("Online banking");
});

test("every tool in the library can be chosen, answered and shown on the results and map", async ({ page }) => {
  const errors = watchErrors(page);
  await fresh(page);
  await page.click("#startNew");
  await step(page, 1);
  const n = await page.evaluate(() => {
    const all = [];
    LIB.forEach((g) => g.items.forEach((l) => all.push(l)));
    state.tools = all.map((l) => Object.assign(fromLib(l), { owner: "Office manager", account: "Organisation", admins: "Two or more", depend: "Important", data: "Personal", signin: "Yes", copy: "No" }));
    render();
    return all.length;
  });
  expect(n).toBeGreaterThanOrEqual(99);
  for (const s of [2, 3, 4]) {
    await step(page, s);
    await expect(page.locator("#view h2").first()).toBeVisible();
  }
  await step(page, 3);
  await expect(page.locator("#regH")).toBeVisible();
  expect(await page.locator("#view table tbody tr").count()).toBeGreaterThanOrEqual(n);
  expect(errors).toEqual([]);
});

// Script and stylesheet links carry the version, so after a deploy a browser cannot mix
// old and new files (GitHub Pages lets browsers reuse files for 10 minutes).
test("every script and stylesheet link carries the current version", async () => {
  const fs = require("node:fs");
  const version = JSON.parse(fs.readFileSync("package.json", "utf8")).version;
  for (const page of ["index.html", "404.html"]) {
    const html = fs.readFileSync(page, "utf8");
    const links = [...html.matchAll(/(?:src|href)="\/?(assets\/[^"]+\.(?:js|css)[^"]*)"/g)].map((m) => m[1]);
    expect(links.length, page).toBeGreaterThan(0);
    for (const l of links) expect(l, `${page}: ${l}`).toMatch(new RegExp(`\\?v=${version.replace(/\./g, "\\.")}$`));
  }
  expect(fs.readFileSync("index.html", "utf8")).toContain(`<span id="version">${version}</span>`);
});

// Paul, 1 Oct 2026: library text states facts and advice. A point that could not be established
// says "Unknown", without describing the research (no "I found", "could not be opened", "Don't know…").
// Widened on 28 Oct 2026 (W44-15, option 3): nor what a supplier's pages do not say ("X does not
// say which country…", "No AI features are listed on…", "no statement on…", "only says…").
test("library text never narrates the research, and unknown facts show as Unknown", async ({ page }) => {
  await fresh(page);
  const bad = await page.evaluate(() => {
    const rx = new RegExp([
      /\b(I|we) (could not|did not|found|have not|could (read|open))\b|could not be (opened|read|loaded)|did not load|search (excerpt|summary|result)|\b403\b|pages? (we|I) (read|found|could)|blocked the|Don.t know/.source,
      /\b(does|do|did|doesn.t|don.t) not (say|state|mention|list|name|describe|specify|publish|disclose|advertise)\b/.source,
      /\bnot (stated|listed|published|specified|mentioned|disclosed|described)\b|\bno (published|public)\b|\bno (explicit )?statement\b/.source,
      /\b(only|just) says\b|\b(lists|names|gives|publishes|advertises?|mentions) no\b|\bis silent\b|\b(is|are) listed on\b|\b(no|any) [\w -]{1,40}(is|are)? listed\b/.source,
    ].join("|"), "i");
    const out = [];
    LIB.forEach((g) => g.items.forEach((t) => ["store", "plans", "aid", "np", "note", "co"].forEach((k) => {
      if (typeof t[k] === "string" && rx.test(t[k])) out.push(t.id + "." + k);
    })));
    return out;
  });
  expect(bad).toEqual([]);
  // In the tool, an unknown export or two-step sign-in reads "Unknown".
  await page.evaluate(() => { state.mode = "own"; state.tools = [fromLib(BYID["membersite"])]; state.cur = 0; });
  await step(page, 2);
  const facts = page.locator("details.facts").first();
  await facts.locator("summary").click();
  await expect(facts).toContainText("Unknown");
  await expect(facts).not.toContainText("Don't know");
  await expect(facts).not.toContainText("unclear");
});

// W44-15 (Paul, 28 Oct 2026, option 2): the nonprofit offer is one fixed choice plus one short line,
// with no prices, and it shows the same way in the facts panel and in the compare table.
test("the nonprofit offer is a fixed choice, always shown the same way in the facts and the comparison", async ({ page }) => {
  await fresh(page);
  const bad = await page.evaluate(() => {
    const out = [];
    LIB.forEach((g) => g.items.forEach((t) => {
      if (t.k === "Devices") return;
      if (["Free", "Discount", "On request", "None", "Unknown"].indexOf(t.npk) < 0) out.push(t.id + ".npk");
      if (t.np && /\d+ ?%|[£$€]|\bUSD\b|\bkr\b/.test(t.np)) out.push(t.id + ".np has a price");
      if (t.npk === "Unknown" && t.np) out.push(t.id + ".np with Unknown");
    }));
    return out;
  });
  expect(bad).toEqual([]);
  // An entry with no offer line (Unknown) still shows the row, in both places.
  await page.evaluate(() => { state.mode = "own"; state.tools = [fromLib(BYID["beacon-crm"]), fromLib(BYID["canva"])]; state.cur = 0; state.cmpA = "beacon-crm"; state.cmpB = "canva"; state.foldCmp = true; });
  await step(page, 2);
  const facts = page.locator("details.facts").first();
  await facts.locator("summary").click();
  await expect(facts.locator("dt", { hasText: "Nonprofit offer" })).toHaveCount(1);
  await expect(facts.locator("div", { has: page.locator("dt", { hasText: "Nonprofit offer" }) }).locator("dd")).toHaveText("Unknown");
  await step(page, 3);
  const row = page.locator("table.cmp tr", { has: page.locator("th", { hasText: "Nonprofit offer" }) });
  await expect(row.locator("td").nth(0)).toHaveText("Unknown");
  await expect(row.locator("td").nth(1)).toHaveText(await page.evaluate(() => npText(BYID["canva"])));
  expect(await page.evaluate(() => npText(BYID["canva"]))).toMatch(/^Free\. /);
});

// Library SKILL.md: a tool with no check in the last six months shows "not checked since <date>".
test("facts older than six months say 'not checked since', with the date", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2027-04-01T12:00:00"));
  await fresh(page);
  expect(await page.evaluate(() => [notCheckedSince("microsoft-365"), notCheckedSince("betalingsservice")])).toEqual([true, false]);
  await page.evaluate(() => { state.mode = "own"; state.tools = [fromLib(BYID["microsoft-365"]), fromLib(BYID["betalingsservice"])]; state.cur = 0; });
  await step(page, 2);
  const s = page.locator("details.facts summary").first();
  await expect(s).toContainText("(not checked since 29 September 2026)");
  await expect(page.locator("details.facts").first()).toContainText("may be out of date");
  await page.evaluate(() => { state.cur = 1; render(); });
  await expect(page.locator("details.facts summary").first()).toContainText("(checked 8 October 2026)");
});

test("facts checked in the last six months show their checked date only", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-28T12:00:00"));
  await fresh(page);
  await page.evaluate(() => { state.mode = "own"; state.tools = [fromLib(BYID["microsoft-365"])]; state.cur = 0; });
  await step(page, 2);
  await expect(page.locator("details.facts summary").first()).toContainText("(checked 29 September 2026)");
  await expect(page.locator("details.facts").first()).not.toContainText("may be out of date");
});

// W44-15 (option 8): within each group, tools local to where the user is come first, then Global.
test("chips in each group follow the user's location: local first, then Global", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await step(page, 1);
  const first = async (loc, home) => {
    await page.evaluate(([l, h]) => { state.loc = l; state.home = h; render(); }, [loc, home]);
    return page.locator(".group", { has: page.locator("h3", { hasText: "Supporters and fundraising" }) }).locator("button.chip[data-lib]").first().getAttribute("data-lib");
  };
  expect(await first("UK", "GB")).toBe("beacon-crm");
  expect(await first("EU", "DK")).toBe("foreninglet");
  expect(await first("EU", "DE")).toBe("brevo");
  expect(await first("US", "US")).toBe("mailchimp");
});

// W44-15 (option 1): business tools are found by search only, and keep their ids.
test("business tools are not in the main list, but a search finds them", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await step(page, 1);
  for (const id of ["shopify", "squarespace", "wix", "freeagent", "sage-payroll", "brightpay", "brighthr", "breathe-hr", "calendly", "zapier", "google-ads"]) {
    await expect(page.locator(`button.chip[data-lib="${id}"]`)).toBeHidden();
  }
  await expect(page.locator(".group", { has: page.locator("h3", { hasText: "Staff, payroll and HR" }) })).toBeHidden();
  await page.fill("#findTool", "brightpay");
  await expect(page.locator('button.chip[data-lib="brightpay"]')).toBeVisible();
  await page.fill("#findTool", "");
  await expect(page.locator('button.chip[data-lib="brightpay"]')).toBeHidden();
  // On the main list: 99 entries less 13 found by search only.
  expect(await page.evaluate(() => { let n = 0; LIB.forEach((g) => g.items.forEach((t) => { if (!SEARCH_ONLY[t.id]) n++; })); return n; })).toBe(86);
});
