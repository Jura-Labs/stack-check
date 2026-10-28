// Simpler steps for small charities, and three bug fixes (W44-15, Paul in the terminal, 28 Oct 2026:
// decisions/2026-10-28-stack-check-simplify.md in the brain). Scoring is unchanged: these test words,
// layout and what is shown, not the lights.
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { fresh, step, watchErrors } = require("./helpers");

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const blocking = (r) => r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id + " " + v.nodes[0].target.join(" "));

async function own(page, org, loc, tools) {
  await fresh(page);
  await page.evaluate(([org, loc, tools]) => {
    state = blank(); state.mode = "own"; state.org = org; state.loc = loc; state.home = loc === "UK" ? "GB" : "DK"; state.ccy = loc === "UK" ? "GBP" : "EUR";
    state.tools = tools.map((x) => Object.assign(x.lib ? fromLib(BYID[x.lib]) : fromLib(x.custom), x.a || {}));
    state.cur = 0; render();
  }, [org, loc, tools]);
}
const ANSWERED = { owner: "Office manager", account: "Organisation", admins: "Two or more", depend: "Important", data: "Personal", signin: "Yes", copy: "No" };

// ---------- The three bugs ----------
test("B1: a currency the person chose stays when they change where they are based", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  // Not chosen yet: the location sets it.
  await page.locator('label[for="loc-1"]').click(); // Europe
  await expect.poll(() => page.evaluate(() => state.ccy)).toBe("EUR");
  await page.locator('label[for="loc-0"]').click(); // UK
  await expect.poll(() => page.evaluate(() => state.ccy)).toBe("GBP");
  // Chosen: it stays, whatever the location.
  await page.locator("#ccySum").click();
  await page.selectOption("#ccy", "DKK");
  await expect(page.locator("#ccySum")).toContainText("Danish krone (DKK)");
  for (const i of [1, 2, 0]) {
    await page.locator(`label[for="loc-${i}"]`).click();
    await expect.poll(() => page.evaluate(() => state.loc)).toBe(["UK", "EU", "CA"][i]);
    expect(await page.evaluate(() => state.ccy), `after location ${i}`).toBe("DKK");
  }
  // Clear everything forgets the choice too, so the location sets it again.
  await page.evaluate(() => { state.tools = [fromLib(BYID["xero"])]; render(); });
  await step(page, 3);
  await page.click("#clearAll");
  await page.click("#clearYes");
  await expect.poll(() => page.evaluate(() => [state.ccy, !!state.ccyMine])).toEqual(["GBP", false]);
  await page.locator('label[for="loc-1"]').click();
  await expect.poll(() => page.evaluate(() => state.ccy)).toBe("EUR");
});

test("B2: a sole trader's summary is in one voice, and has no 'Nothing' above the recovery codes", async ({ page }) => {
  await own(page, "sole", "UK", [
    { lib: "xero", a: Object.assign({}, ANSWERED, { owner: "Me", admins: "One person", data: "Internal" }) },
    { lib: "canva", a: Object.assign({}, ANSWERED, { owner: "Me", admins: "One person", data: "None" }) },
  ]);
  const b = await page.evaluate(() => board());
  expect(b).toContain("1. What I depend on\nI use 2 tools.");
  expect(b).toContain("2. What I am fixing now (0)\n- Recovery codes: I am the only person who can get into 2 tools (Xero, Canva).");
  expect(b).not.toContain("- Nothing");
  expect(b).toContain("3. What I need to decide\nMy decisions (0):\n- None");
  expect(b).toContain("I review the register once a year, and whenever I start using a new tool.");
  for (const we of ["What we", "We use", "We review", "Your decision", "what we need you"]) expect(b, we).not.toContain(we);
  // A charity with nothing to fix still says "Nothing", in its own voice.
  await own(page, "nonprofit", "UK", [{ lib: "xero", a: Object.assign({}, ANSWERED, { data: "Internal", copy: "Yes", exp: "Yes" }) }]);
  const c = await page.evaluate(() => board());
  expect(c).toContain("2. What we are fixing now (0)\n- Nothing");
  expect(c).toContain("Trustee decisions (0):");
  await step(page, 3);
  await expect(page.locator("#outH").locator("xpath=..")).toContainText("what we depend on, what we are fixing now, and what we need you to decide");
});

test("B2: on Decide, a sole trader is told what the summary holds in the same words", async ({ page }) => {
  await own(page, "sole", "UK", [{ lib: "xero", a: Object.assign({}, ANSWERED, { owner: "Me" }) }]);
  await step(page, 3);
  await expect(page.locator("#outH").locator("xpath=..")).toContainText("what I depend on, what I am fixing now, and what I need to decide");
});

test("B3: step 1 no longer mentions online banking, and the example tool is not in the list", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await expect(page.locator("#view")).not.toContainText("banking");
  await expect(page.locator("#view")).toContainText("It takes about 2 minutes per tool to complete.");
  const ph = await page.locator("#newName").getAttribute("placeholder");
  const name = ph.replace(/^For example: /, "");
  expect(await page.evaluate((n) => Object.keys(BYID).some((id) => BYID[id].name.toLowerCase() === n.toLowerCase()), name)).toBe(false);
  await page.fill("#findTool", name);
  await expect(page.locator("#findNone")).toContainText(`Nothing called "${name}"`);
});

// ---------- 1. Decide says which reasons rest on answers from our research or under More detail ----------
test("1: Decide marks reasons from our research and from More detail answers not given", async ({ page }) => {
  await fresh(page);
  expect(await page.evaluate(() => BYID["mailchimp"].w)).toBe("Elsewhere");
  await own(page, "nonprofit", "UK", [{ lib: "mailchimp", a: Object.assign({}, ANSWERED, { exp: "" }) }]);
  await step(page, 3);
  const item = page.locator("ol.prio > li", { hasText: "Mailchimp" });
  await expect(item.locator("p.small.muted").first()).toContainText("Personal data stored outside the UK, EU or EEA.");
  const note = item.locator("p.srcnote");
  await expect(note).toHaveText("From our research, not your own answer: where the data is kept. Check it under More detail in step 2. Not answered yet: data protection terms and full export. They are under More detail in step 2.");
  // Once the person answers, their answer is no longer marked.
  await page.evaluate(() => { state.tools[0].terms = "No"; state.tools[0].exp = "No"; state.tools[0].where = "Elsewhere"; render(); });
  await expect(note).toHaveText("From our research, not your own answer: where the data is kept. Check it under More detail in step 2.");
  await page.evaluate(() => { state.tools[0].lib = null; render(); });
  await expect(item.locator("p.srcnote")).toHaveCount(0);
});

test("1: step 2 says outside the fold that some answers are pre-filled", async ({ page }) => {
  await own(page, "nonprofit", "UK", [{ lib: "mailchimp" }, { custom: { name: "Rota sheet", job: "Volunteer rota", k: "Software" } }]);
  await step(page, 2);
  await expect(page.locator("details.facts", { hasText: "More detail (optional" })).not.toHaveAttribute("open", "");
  await expect(page.locator("#preNote")).toBeVisible();
  await expect(page.locator("#preNote")).toHaveText("Some answers under More detail are pre-filled from what we found about Mailchimp. Check them.");
  await page.click("#nextT");
  await expect(page.locator("#preNote")).toHaveCount(0);
});

// ---------- 2. A short header after the start screen ----------
test("2: after the start screen the header is short, and the privacy sentence stays", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await fresh(page);
  for (const sel of ["header.top .eyebrow", "header.top .tagline", "header.top > p.muted"]) await expect(page.locator(sel), sel).toBeVisible();
  await page.click("#startNew");
  for (const n of [1, 2, 3, 4]) {
    if (n === 2) await page.evaluate(() => { state.tools = [fromLib(BYID["xero"])]; });
    await step(page, n);
    for (const sel of ["header.top .eyebrow", "header.top .tagline", "header.top > p.muted"]) await expect(page.locator(sel), `step ${n}: ${sel}`).toBeHidden();
    await expect(page.locator("header.top h1")).toBeVisible();
    await expect(page.locator(".privacy b")).toHaveText("No account. Your answers stay in this browser and are never sent anywhere.");
    await expect(page.locator(".privacy b")).toBeVisible();
  }
  // The eyebrow's words are unchanged; it is only hidden after the start screen.
  await expect(page.locator("header.top .eyebrow")).toHaveText("The 2-hour technology check");
  // On a phone, the first question of step 2 starts on the first screen.
  await step(page, 2);
  const y = await page.locator("#askH").evaluate((e) => e.getBoundingClientRect().top + window.scrollY);
  expect(y).toBeLessThan(667);
});

// ---------- 3. Step 1 is shorter ----------
test("3: step 1 has no 'Are you returning?', the currency is folded, and asking the team is folded", async ({ page }) => {
  await fresh(page);
  await expect(page.locator("#openFile0")).toBeAttached(); // on the start screen
  await page.click("#startNew");
  await expect(page.locator("#view")).not.toContainText("Are you returning?");
  await expect(page.locator("#openFile1")).toHaveCount(0);
  await expect(page.locator("#ccy")).toBeHidden();
  await expect(page.locator("#ccySum")).toHaveText("More detail (optional: the currency for costs, now Pound sterling (£))");
  const ask = page.locator("details.fold", { hasText: "Before you start, ask your team" });
  await expect(ask).toHaveCount(1);
  await expect(ask).not.toHaveAttribute("open", "");
  await expect(page.locator("#copyAsk")).toBeHidden();
  await ask.locator("summary").click();
  await expect(page.locator("#copyAsk")).toBeVisible();
  // Sole traders have no team to ask.
  await page.locator('label[for="org-2"]').click();
  await expect.poll(() => page.evaluate(() => state.org)).toBe("sole");
  await expect(page.locator("#view")).not.toContainText("ask your team");
  await expect(page.locator("#copyAsk")).toHaveCount(0);
});

// ---------- 4. Plain questions ----------
test("4: plain question titles; the kind is folded for a tool from the list; More detail stays closed", async ({ page }) => {
  await own(page, "nonprofit", "UK", [{ lib: "xero" }, { lib: "win11" }, { custom: { name: "Rota sheet", job: "Volunteer rota", k: "" } }]);
  await step(page, 2);
  const k = await page.evaluate(() => state.tools[0].key);
  for (const name of ["Whose account is it?", "Who can manage it?"]) await expect(page.getByRole("group", { name })).toBeVisible();
  for (const name of ["Kind", "Account", "Admins"]) await expect(page.getByRole("group", { name, exact: true })).toHaveCount(0);
  await expect(page.locator(`#kindFold-${k} > summary`)).toHaveText("What kind of tool it is: Software (change)");
  await expect(page.getByRole("group", { name: "What kind of tool is it?" })).toBeHidden();
  await expect(page.locator(`label[for="owner-${k}"]`)).toHaveText("Who owns it?");
  const hint = await page.locator(`label[for="owner-${k}"] ~ span`).textContent();
  expect(hint).toContain("Treasurer");
  expect(hint).not.toContain("If nobody owns it, leave it blank.");
  // Devices: their own words.
  await page.click("#nextT");
  for (const name of ["Whose devices are they?", "Who can get into them if the user leaves?"]) await expect(page.getByRole("group", { name })).toBeVisible();
  // A tool added by hand: the kind is asked, and More detail is not opened for it.
  await page.click("#nextT");
  await expect(page.getByRole("group", { name: "What kind of tool is it?" })).toBeVisible();
  await expect(page.locator("details.facts", { hasText: "More detail (optional" })).not.toHaveAttribute("open", "");
});

// ---------- 5. Text that only applies in the UK ----------
test("5: Gift Aid and Cyber Essentials are mentioned to UK organisations only", async ({ page }) => {
  await own(page, "nonprofit", "UK", [{ lib: "xero" }]);
  await step(page, 2);
  await expect(page.locator("#view")).toContainText("Gift Aid schedules");
  expect(await page.evaluate(() => reduceText(CARDS.windows10))).toContain("Cyber Essentials");
  await own(page, "nonprofit", "EU", [{ lib: "xero" }]);
  await step(page, 2);
  await expect(page.locator("#view")).not.toContainText("Gift Aid");
  await expect(page.locator("#view")).toContainText("(such as statements or payslips)");
  expect(await page.evaluate(() => reduceText(CARDS.windows10))).not.toContain("Cyber Essentials");
  expect(await page.evaluate(() => reduceText(CARDS.windows10))).toContain("then double each year.");
});

// ---------- 6. Smaller fixes ----------
test("6: sole traders get their own data hint and example approver", async ({ page }) => {
  await own(page, "sole", "UK", [{ lib: "xero" }]);
  await step(page, 2);
  const k = await page.evaluate(() => state.tools[0].key);
  await expect(page.locator(`#hint-data-${k}`)).toContainText("Personal: clients");
  await expect(page.locator(`#hint-data-${k}`)).not.toContainText("customers, staff");
  await expect(page.locator(`#approved-${k}`)).toHaveAttribute("placeholder", "For example: Me, June 2026");
  await own(page, "nonprofit", "UK", [{ lib: "xero" }]);
  await step(page, 2);
  await expect(page.locator("input[id^=approved-]")).toHaveAttribute("placeholder", "For example: Chair, June 2026");
});

test("6: the skip link names where it goes on each step", async ({ page }) => {
  await fresh(page);
  await expect(page.locator("a.skip")).toHaveText("Skip to the start");
  const want = { 1: "Skip to your tools", 2: "Skip to the questions", 3: "Skip to what to do", 4: "Skip to your data" };
  for (const n of [1, 2, 3, 4]) { await step(page, n); await expect(page.locator("a.skip")).toHaveText(want[n]); }
});

test("6: on a 320px phone each step name in the bar is on one line", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await fresh(page);
  await step(page, 2);
  const lines = await page.$$eval("nav.steps .short", (els) => els.map((e) => { const r = document.createRange(); r.selectNodeContents(e); return [e.textContent, r.getClientRects().length]; }));
  expect(lines).toEqual([["Tools", 1], ["Questions", 1], ["Decide", 1], ["Data", 1]]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test("6: print leaves out the copy and save buttons and 'Thinking of changing', and prints the date", async ({ page }) => {
  await fresh(page);
  await step(page, 3);
  await expect(page.locator("#printDate")).toBeHidden();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator('section[aria-labelledby="outH"]')).toBeHidden();
  await expect(page.locator('section[aria-labelledby="chgH"]')).toBeHidden();
  await expect(page.locator("#regH")).toBeVisible();
  await expect(page.locator("#printDate")).toBeVisible();
  const today = await page.evaluate(() => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }));
  await expect(page.locator("#printDate")).toHaveText(new RegExp(`^Printed ${today} from Stack Check \\d+\\.\\d+\\.\\d+\\.$`));
});

test("6: when two-step sign-in is 'Not sure', the step is to check it first; scoring is unchanged", async ({ page }) => {
  await own(page, "nonprofit", "UK", [{ lib: "dropbox", a: Object.assign({}, ANSWERED, { signin: "Don't know" }) }, { lib: "slack", a: Object.assign({}, ANSWERED, { signin: "No" }) }]);
  const r = await page.evaluate(() => state.tools.map((t) => [action(t), safety(t), nextStep(t)]));
  expect(r[0]).toEqual(["Fix now", "Red", "Check whether two-step sign-in (MFA) is on for everyone, and switch it on where it is not."]);
  expect(r[1]).toEqual(["Fix now", "Red", "Switch on two-step sign-in (MFA) for everyone."]);
  await page.evaluate(() => { state.org = "sole"; state.tools[0].owner = "Me"; });
  expect(await page.evaluate(() => nextStep(state.tools[0]))).toBe("Check whether two-step sign-in (MFA) is on, and switch it on if not.");
});

// ---------- Accessibility of the new folds ----------
test("axe: the new folds, open, in light and dark, at phone width", async ({ page }) => {
  const errors = watchErrors(page);
  for (const scheme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.setViewportSize({ width: 320, height: 800 });
    await own(page, "nonprofit", "UK", [{ lib: "xero" }, { custom: { name: "Rota sheet", job: "Volunteer rota", k: "Software" } }]);
    await step(page, 1);
    await page.locator("#ccySum").click();
    await page.locator("details.fold > summary", { hasText: "ask your team" }).click();
    expect(blocking(await new AxeBuilder({ page }).withTags(TAGS).analyze()), `step 1 ${scheme}`).toEqual([]);
    await step(page, 2);
    const k = await page.evaluate(() => state.tools[0].key);
    await page.locator(`#kindFold-${k} > summary`).click();
    await page.locator("details.facts > summary", { hasText: "More detail" }).click();
    expect(blocking(await new AxeBuilder({ page }).withTags(TAGS).analyze()), `step 2 ${scheme}`).toEqual([]);
    await page.evaluate(() => { state.tools[0].exp = ""; Object.assign(state.tools[0], { owner: "Treasurer", account: "Organisation", admins: "Two or more", depend: "Important", data: "Personal", signin: "Yes", copy: "No" }); });
    await step(page, 3);
    expect(blocking(await new AxeBuilder({ page }).withTags(TAGS).analyze()), `step 3 ${scheme}`).toEqual([]);
  }
  expect(errors).toEqual([]);
});
