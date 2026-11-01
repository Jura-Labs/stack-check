// Paul's decisions of 1 November 2026 (decisions/2026-11-01-stack-check-open-decisions.md, W44-15):
// 8a the nine reviewer-judgement tools are search-only; 11a one time statement that scales with the
// number of tools, and no "2-hour"; 5b "Free" whenever a free option exists; and the new
// not-for-profit tools in the main list.
const fs = require("node:fs");
const { test, expect } = require("@playwright/test");
const { fresh, step } = require("./helpers");

const NINE = {
  "mattermost-cloud": "mattermost", "openproject-cloud": "openproject", "fireflies-ai": "fireflies",
  "otter-ai": "otter", hubspot: "hubspot", "google-analytics-4": "google analytics",
  "plausible-analytics": "plausible", "umami-cloud": "umami", "matomo-cloud": "matomo",
};
const NEW = ["libreoffice", "google-forms", "microsoft-forms", "youtube-channel", "tiktok-account",
  "localgiving", "caf-donate", "charitylog", "lamplight", "conventus", "klubmodul"];

test("8a: the nine reviewer-judgement tools are hidden until searched, and a search finds each", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await step(page, 1);
  expect(await page.evaluate((ids) => ids.filter((id) => !BYID[id] || !SEARCH_ONLY[id]), Object.keys(NINE))).toEqual([]);
  for (const id of Object.keys(NINE)) await expect(page.locator(`button.chip[data-lib="${id}"]`)).toBeHidden();
  for (const [id, q] of Object.entries(NINE)) {
    await page.fill("#findTool", q);
    await expect(page.locator(`button.chip[data-lib="${id}"]`)).toBeVisible();
  }
  await page.fill("#findTool", "");
  for (const id of Object.keys(NINE)) await expect(page.locator(`button.chip[data-lib="${id}"]`)).toBeHidden();
  // Ticked from a search, a search-only tool stays in view.
  await page.fill("#findTool", "umami");
  await page.click('button.chip[data-lib="umami-cloud"]');
  await page.fill("#findTool", "");
  await expect(page.locator('button.chip[data-lib="umami-cloud"]')).toBeVisible();
});

test("the new not-for-profit tools are in the main list, with a checked date and a region", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await step(page, 1);
  for (const id of NEW) await expect(page.locator(`button.chip[data-lib="${id}"]`)).toBeVisible();
  const bad = await page.evaluate((ids) => ids.filter((id) => {
    const t = BYID[id];
    return !t || SEARCH_ONLY[id] || ["2026-10-28", "2026-11-01"].indexOf(t.checked) < 0 || ["UK", "DK", "EU", "Global"].indexOf(t.region) < 0 || !(t.src || []).length;
  }), NEW);
  expect(bad).toEqual([]);
  // Main list = every library entry less the search-only ones (README "88 common tools").
  expect(await page.evaluate(() => { let all = 0, main = 0; LIB.forEach((g) => g.items.forEach((t) => { all++; if (!SEARCH_ONLY[t.id]) main++; })); return [all, main]; })).toEqual([110, 88]);
  expect(fs.readFileSync("README.md", "utf8")).toContain("a list of 88 common tools");
});

test("5b: an entry with a free option a small charity can use says Free, and names it", async ({ page }) => {
  await fresh(page);
  const got = await page.evaluate(() => ["figma", "dinero", "enthuse", "libreoffice", "google-forms", "microsoft-forms", "tiktok-account"].map((id) => BYID[id].npk));
  expect(got).toEqual(Array(7).fill("Free"));
  expect(await page.evaluate(() => BYID["mattermost-cloud"].npk)).toBe("On request");
  expect(await page.evaluate(() => BYID["enthuse"].np)).toMatch(/^Mass Participation .* no monthly fee; other products do\./);
});

test("11a: no '2-hour' anywhere, and one time statement of about 3 minutes a tool", async ({ page }) => {
  for (const f of ["index.html", "404.html", "README.md", "assets/app.js"]) {
    expect(fs.readFileSync(f, "utf8")).not.toMatch(/2-hour|2 minutes/);
  }
  await fresh(page);
  await expect(page.locator("body")).not.toContainText("2-hour");
  await expect(page.locator("#view")).toContainText("The essentials take about 3 minutes a tool, so 10 tools take about 30 minutes.");
  await page.click("#startNew");
  // Step 1 uses the start screen's words (fix round 1).
  await expect(page.locator("#view")).toContainText("The essentials take about 3 minutes a tool.");
});

test("11a: the estimate grows with the number of tools, in the one count that is announced", async ({ page }) => {
  await fresh(page);
  // Exact up to 30 minutes, then the nearest 5; an hour is "about an hour".
  expect(await page.evaluate(() => [1, 2, 9, 10, 12, 20, 35, 40].map(timeFor))).toEqual([
    "about 3 minutes", "about 6 minutes", "about 27 minutes", "about 30 minutes", "about 35 minutes", "about an hour", "about 1 hour 45 minutes", "about 2 hours",
  ]);
  await page.click("#startNew");
  await step(page, 1);
  // Only #pickCount announces; the line by the Next button is not a live region.
  expect(await page.locator(".navrow .muted.small").evaluate((e) => e.hasAttribute("aria-live") || e.hasAttribute("role"))).toBe(false);
  await page.click('button.chip[data-lib="xero"]');
  await expect(page.locator("#pickCount")).toHaveText("Added Xero. 1 tool chosen: about 3 minutes.");
  await page.click('button.chip[data-lib="canva"]');
  await expect(page.locator("#pickCount")).toHaveText("Added Canva. 2 tools chosen: about 6 minutes.");
  await expect(page.locator(".navrow .muted.small")).toHaveText("2 tools listed, about 6 minutes. You can stop and carry on later.");
  await page.click('button.chip[data-lib="canva"]');
  await expect(page.locator("#pickCount")).toHaveText("Removed Canva. 1 tool chosen: about 3 minutes.");
  // An own tool is announced the same way.
  await page.fill("#newName", "Volunteer rota");
  await page.click("#addTool");
  await expect(page.locator("#pickCount")).toHaveText("Added Volunteer rota. 2 tools chosen: about 6 minutes.");
});

test("11c: Welcome back gives the time for the tools not yet answered", async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => {
    state = blank(); state.mode = "own";
    const done = { owner: "Office manager", account: "Organisation", admins: "Two or more", depend: "Important", data: "Personal", signin: "Yes", copy: "No", where: "UK, EU or EEA", based: "UK or Europe", exp: "Yes", terms: "Yes" };
    state.tools = ["xero", "canva", "trello", "asana"].map((id, i) => i === 0 ? Object.assign(fromLib(BYID[id]), done) : fromLib(BYID[id]));
    state.step = 0; save(); render();
  });
  await expect(page.locator("#startH")).toHaveText("Welcome back");
  await expect(page.locator("#view")).toContainText("so the 3 tools still to answer take about 9 minutes.");
  await expect(page.locator("#view")).not.toContainText("10 tools take");
});

test("12a and 12b: the found count is written once, after a pause, and not again when a chip is ticked", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await step(page, 1);
  await page.locator("#findTool").pressSequentially("xer");
  // Not written while typing: the update waits about half a second.
  await expect(page.locator("#findNone")).toHaveText("");
  await expect(page.locator("#findNone")).toHaveText("1 tool found.");
  // Ticking the found chip redraws the step; the found count is not written (and announced) again.
  await page.evaluate(() => {
    window.__writes = 0;
    const proto = Object.getOwnPropertyDescriptor(Node.prototype, "textContent");
    Object.defineProperty(Node.prototype, "textContent", { configurable: true, get: proto.get, set(v) { if (this.id === "findNone") window.__writes++; return proto.set.call(this, v); } });
  });
  await page.click('button.chip[data-lib="xero"]');
  await expect(page.locator("#pickCount")).toHaveText("Added Xero. 1 tool chosen: about 3 minutes.");
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => window.__writes)).toBe(0);
  await expect(page.locator("#findNone")).toHaveText("1 tool found.");
});

test("12c: the register table can be reached by keyboard, empty or not", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await step(page, 3);
  await expect(page.locator('.tablewrap[aria-label="Register table"]')).toHaveAttribute("tabindex", "0");
});

test("7: TikTok, YouTube and note-takers are not video meetings; Zoom and Jitsi are", async ({ page }) => {
  await fresh(page);
  const fam = await page.evaluate(() => ["tiktok-account", "youtube-channel", "otter-ai", "zoom", "jitsi-meet"].map((id) => familyOf(fromLib(BYID[id]))));
  expect(fam).toEqual(["", "", "", "meetings", "meetings"]);
  // An own tool for video calls still gets the Meetings card.
  expect(await page.evaluate(() => familyOf(fromLib({ name: "Whereby", job: "Video calls" })))).toBe("meetings");
  // On Decide, TikTok marked Replace gets no Jitsi advice and is not grouped with meeting tools.
  await page.evaluate(() => {
    state.mode = "own"; state.tools = ["tiktok-account", "youtube-channel", "zoom"].map((id) => Object.assign(fromLib(BYID[id]), { decision: "Replace" })); state.foldCards = true;
  });
  await step(page, 3);
  await expect(page.locator(".card", { hasText: "TikTok" })).toHaveCount(0);
  await expect(page.locator("ul.dup li", { hasText: "Meetings and chat" })).toHaveCount(0);
});

test("8: a card never recommends the tool it is for", async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => {
    state.mode = "own"; state.tools = ["libreoffice", "jitsi-meet", "bitwarden"].map((id) => Object.assign(fromLib(BYID[id]), { decision: "Replace" })); state.foldCards = true;
  });
  await step(page, 3);
  // LibreOffice: the Documents card is built around LibreOffice, so it is not shown.
  await expect(page.locator(".card h3", { hasText: "Documents" })).toHaveCount(0);
  const meet = page.locator(".card", { has: page.locator("h3", { hasText: "Meetings" }) });
  await expect(meet).toHaveCount(1);
  await expect(meet).not.toContainText("Jitsi: open source");
  const pw = page.locator(".card", { has: page.locator("h3", { hasText: "Passwords" }) });
  await expect(pw).not.toContainText("Bitwarden Teams");
  await expect(pw).toContainText("KeePassXC");
});

test("9: search finds tools by the words people use, in English and Danish", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await step(page, 1);
  for (const [q, id] of [["ga4", "google-analytics-4"], ["piwik", "matomo-cloud"], ["note taker", "otter-ai"], ["notetaker", "fireflies-ai"], ["statistik", "plausible-analytics"], ["projekt", "asana"], ["medlemmer", "klubmodul"], ["medlemmer", "conventus"]]) {
    await page.fill("#findTool", q);
    await expect(page.locator(`button.chip[data-lib="${id}"]`)).toBeVisible();
  }
});

test("10: an unknown storage option is shown as Unknown, without the plan text after it", async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => { state.mode = "own"; state.tools = [fromLib(BYID["caf-donate"]), fromLib(BYID["google-workspace"])]; state.cur = 0; });
  await step(page, 2);
  const facts = page.locator("details.facts").first();
  await facts.locator("summary").click();
  const storage = facts.locator("div", { has: page.locator("dt", { hasText: "UK or EU storage" }) }).locator("dd");
  await expect(storage).toHaveText("Unknown");
  await page.evaluate(() => { state.cur = 1; render(); });
  await page.locator("details.facts summary").first().click();
  await expect(page.locator("details.facts").first().locator("div", { has: page.locator("dt", { hasText: "UK or EU storage" }) }).locator("dd")).toHaveText(/^Only on some plans: /);
});

test("14 and 15: the offer row reads 'Free plan or non-profit offer', and charity-only tools say Not applicable", async ({ page }) => {
  await fresh(page);
  const na = await page.evaluate(() => { const o = []; LIB.forEach((g) => g.items.forEach((t) => { if (t.npk === "Not applicable") o.push(t.id); })); return o.sort(); });
  expect(na).toEqual(["caf-donate", "foreninglet", "localgiving", "membersite"]);
  expect(await page.evaluate(() => [BYID.conventus.npk, BYID.conventus.np])).toEqual(["Free", "The Gratis plan, for up to 30 users and 3 booking resources."]);
  await page.evaluate(() => { state.mode = "own"; state.tools = [fromLib(BYID["localgiving"])]; state.cur = 0; });
  await step(page, 2);
  const facts = page.locator("details.facts").first();
  await facts.locator("summary").click();
  await expect(facts.locator("dt", { hasText: "Nonprofit offer" })).toHaveCount(0);
  await expect(facts.locator("div", { has: page.locator("dt", { hasText: "Free plan or non-profit offer" }) }).locator("dd")).toHaveText(/^Not applicable\. It is only for charities and community groups/);
});

test("7a: Mollie's data location is Unknown, without the third-party profile", async ({ page }) => {
  await fresh(page);
  const m = await page.evaluate(() => ({ w: BYID.mollie.w, loc: BYID.mollie.loc, store: BYID.mollie.store, src: BYID.mollie.src.map((s) => s[1]).join(" ") }));
  expect(m.w).toBe("Don't know");
  expect(m.loc).toBe("");
  expect(m.store).toMatch(/^Unknown\./);
  expect(m.store).not.toContain("third-party profile");
  expect(m.src).not.toContain("euvetted");
});

test("fix round 2: 'website stats' finds the four web-analytics tools", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await step(page, 1);
  await page.fill("#findTool", "website stats");
  for (const id of ["google-analytics-4", "plausible-analytics", "umami-cloud", "matomo-cloud"]) {
    await expect(page.locator(`button.chip[data-lib="${id}"]`)).toBeVisible();
  }
});

test("fix round 2: Replace on a tool with no card says so in one plain line", async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => {
    state.mode = "own"; state.tools = ["tiktok-account", "youtube-channel", "libreoffice"].map((id) => Object.assign(fromLib(BYID[id]), { decision: "Replace" }));
    state.tools.push(Object.assign(fromLib({ name: "Rota spreadsheet", job: "Volunteer shifts" }), { decision: "Retire" }));
    state.foldCards = true;
  });
  await step(page, 3);
  await expect(page.locator("details[data-fold=cards] summary")).toHaveText("Before you move: 4 tools you plan to change");
  const lines = page.locator("ul.nocard li");
  await expect(lines).toHaveText([
    "There is no card for TikTok account. Compare it with another tool below.",
    "There is no card for YouTube channel. Compare it with another tool below.",
    "There is no card for LibreOffice. Compare it with another tool below.",
    "There is no card for Rota spreadsheet.",
  ]);
});

test("fix round 2: each Not applicable line is one plain fact", async ({ page }) => {
  await fresh(page);
  expect(await page.evaluate(() => ["caf-donate", "localgiving", "foreninglet", "membersite"].map((id) => npText(BYID[id])))).toEqual([
    "Not applicable. It is only for UK-registered charities.",
    "Not applicable. It is only for charities and community groups doing charitable work in the UK, registered or not.",
    "Not applicable. It is built for associations.",
    "Not applicable. It is built for membership organisations.",
  ]);
});
