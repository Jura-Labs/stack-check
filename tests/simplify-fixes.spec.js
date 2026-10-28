// Fix round 1 for PR #25 (W44-15, 28 Oct 2026): findings from the a11y, claims-drift, audience and
// privacy checks. Scoring is unchanged: these test words, layout and what is kept.
const { test, expect } = require("@playwright/test");
const { fresh, step } = require("./helpers");

async function own(page, org, loc, tools) {
  await fresh(page);
  await page.evaluate(([org, loc, tools]) => {
    state = blank(); state.mode = "own"; state.org = org; state.loc = loc; state.home = loc === "UK" ? "GB" : "DK"; state.ccy = loc === "UK" ? "GBP" : "EUR";
    state.tools = tools.map((x) => Object.assign(x.lib ? fromLib(BYID[x.lib]) : fromLib(x.custom), x.a || {}));
    state.cur = 0; render();
  }, [org, loc, tools]);
}
const ANSWERED = { owner: "Office manager", account: "Organisation", admins: "Two or more", depend: "Important", data: "Personal", signin: "Yes", copy: "No" };

test("fix 1: at 320px with text at 150% and 200%, the step bar never makes the page scroll sideways", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await fresh(page);
  await step(page, 2);
  for (const size of ["150%", "200%"]) {
    await page.evaluate((s) => { document.documentElement.style.fontSize = s; }, size);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), size).toBeLessThanOrEqual(0);
    const over = await page.$$eval("nav.steps .short", (els) => els.map((e) => e.closest("button").scrollWidth - e.closest("button").clientWidth));
    expect(over.every((x) => x <= 0), `${size}: ${over}`).toBe(true);
  }
});

test("fix 2: changing the location keeps step 1's folds open, and a currency change is announced", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await page.locator("#ccySum").click();
  await page.locator("details.fold > summary", { hasText: "ask your team" }).click();
  await page.locator('label[for="loc-1"]').click();
  await expect.poll(() => page.evaluate(() => state.loc)).toBe("EU");
  await expect(page.locator('details[data-fold1="ccy"]')).toHaveAttribute("open", "");
  await expect(page.locator('details[data-fold1="ask"]')).toHaveAttribute("open", "");
  await expect(page.locator("#pickCount")).toHaveText("Currency for costs: Euro (€).");
  await expect(page.locator("#pickCount")).toHaveAttribute("role", "status");
  await page.selectOption("#ccy", "SEK");
  await expect(page.locator("#pickCount")).toHaveText("Currency for costs: Swedish krona (SEK).");
});

test("fix 3: the country sets its own currency where it has one, unless the person chose one", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await page.locator('label[for="loc-1"]').click();
  for (const [c, ccy] of [["DK", "DKK"], ["SE", "SEK"], ["NO", "NOK"], ["CH", "CHF"], ["DE", "EUR"], ["DK", "DKK"]]) {
    await page.selectOption("#home", c);
    await expect.poll(() => page.evaluate(() => [state.home, state.ccy]), c).toEqual([c, ccy]);
    await expect(page.locator("#home")).toBeFocused();
  }
  // Back to the UK: the Danish default was not a choice, so it goes back to pounds.
  await page.locator('label[for="loc-0"]').click();
  await expect.poll(() => page.evaluate(() => state.ccy)).toBe("GBP");
  // A choice is kept.
  await page.locator('label[for="loc-1"]').click();
  await page.selectOption("#home", "DE");
  await page.locator("#ccySum").click();
  await page.selectOption("#ccy", "USD");
  await page.selectOption("#home", "DK");
  await expect.poll(() => page.evaluate(() => state.home)).toBe("DK");
  expect(await page.evaluate(() => state.ccy)).toBe("USD");
});

test("B1 and the privacy check: a saved file keeps 'currency chosen by me', as a real true only", async ({ page }) => {
  await fresh(page);
  const r = await page.evaluate(() => {
    const file = (v) => JSON.stringify({ app: "stack-check", state: { v: 6, ccy: "DKK", ccyMine: v, tools: [{ name: "Xero", data: "Internal" }] } });
    return [true, "true", 1, false, null].map((v) => stateFromFile(file(v)).ccyMine);
  });
  expect(r).toEqual([true, false, false, false, false]);
  // Opened, then moved: the chosen currency stays.
  await page.evaluate(() => { state = stateFromFile(JSON.stringify({ app: "stack-check", state: { v: 6, loc: "UK", ccy: "DKK", ccyMine: true, tools: [{ name: "Xero", data: "Internal" }] } })); state.step = 1; render(); });
  await page.locator('label[for="loc-1"]').click();
  await expect.poll(() => page.evaluate(() => state.loc)).toBe("EU");
  expect(await page.evaluate(() => state.ccy)).toBe("DKK");
});

test("fix 4: on step 1 the skip link goes to the list of tools", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await expect(page.locator("a.skip")).toHaveAttribute("href", "#pickH");
  await page.locator("a.skip").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#pickH")).toBeFocused();
  await step(page, 3);
  await expect(page.locator("a.skip")).toHaveAttribute("href", "#view");
});

test("fix 6: 'Open a saved file' is on steps 1 and 2, before and after there is anything to save", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await expect(page.locator('label[for="openAny"]')).toBeVisible();
  await expect(page.locator("#saveAny")).toHaveCount(0);
  const file = JSON.stringify({ app: "stack-check", state: { v: 6, org: "nonprofit", loc: "UK", tools: [{ name: "Xero", data: "Internal" }, { name: "Canva", data: "None" }] } });
  await page.setInputFiles("#openAny", { name: "saved.json", mimeType: "application/json", buffer: Buffer.from(file) });
  await expect.poll(() => page.evaluate(() => [state.step, state.tools.length])).toEqual([3, 2]);
  await expect(page.locator("#fileStatus")).toContainText("2 tools");
  await step(page, 2);
  await expect(page.locator("#saveAny")).toBeVisible();
  await expect(page.locator('label[for="openAny"]')).toBeVisible();
  await page.setInputFiles("#openAny", { name: "x.json", mimeType: "application/json", buffer: Buffer.from("not json") });
  await expect(page.locator("#saveAnyStatus")).toContainText("not a Stack Check file");
});

test("fix 7: the owner hint names a role and says what a blank means", async ({ page }) => {
  await own(page, "nonprofit", "UK", [{ lib: "xero" }]);
  await step(page, 2);
  const k = await page.evaluate(() => state.tools[0].key);
  await expect(page.locator(`label[for="owner-${k}"] ~ span`)).toHaveText("Name a role, not a team, such as Treasurer or Office manager. Leave it blank if nobody owns it: naming someone is the first fix.");
});

test("fix 8: a sole trader's review lines are in the I voice too", async ({ page }) => {
  await own(page, "sole", "UK", [{ lib: "xero", a: Object.assign({}, ANSWERED, { owner: "Me", exp: "No", copy: "No" }) }]);
  expect(await page.evaluate(() => action(state.tools[0]))).toBe("Review this year");
  const b = await page.evaluate(() => board());
  expect(b).toContain("Reviews this year (1):\n- Xero: Keep my own copy of the data, and test that I can restore it.");
  expect(b).not.toMatch(/\byour\b|\byou\b/);
});

test("fix 9: the one-admin card uses device words for devices", async ({ page }) => {
  const dev = Object.assign({}, ANSWERED, { admins: "One person", enc: "Yes", upd: "Yes", signin: "Yes" });
  await own(page, "nonprofit", "UK", [{ lib: "win11", a: dev }, { lib: "mac", a: dev }]);
  const names = await page.evaluate(() => state.tools.map((t) => t.name).join(", "));
  await step(page, 3);
  const card = page.locator("ol.prio > li").first();
  await expect(card.locator("p.small b")).toContainText("Make sure a second person can get into each of them if the user leaves.");
  await expect(card).not.toContainText("Add a second admin");
  expect(await page.evaluate(() => board())).toContain(`- Only one person can get into 2 tools: ${names}. Make sure a second person can get into each of them if the user leaves.`);
  await own(page, "nonprofit", "UK", [{ lib: "win11", a: dev }, { lib: "xero", a: Object.assign({}, ANSWERED, { admins: "One person" }) }]);
  await step(page, 3);
  await expect(page.locator("ol.prio > li").first().locator("p.small b")).toContainText("Add a second admin to each tool, and make sure a second person can get into the devices if the user leaves.");
  // One device on its own.
  expect(await page.evaluate(() => nextStep(state.tools[0]))).toBe("Make sure a second person can get into them if the user leaves.");
});

test("fix 10: Find a tool says how many it found", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await page.fill("#findTool", "zoom");
  const n = await page.locator("[data-lib]:visible").count();
  expect(n).toBeGreaterThan(0);
  await expect(page.locator("#findNone")).toHaveText(`${n} tool${n === 1 ? "" : "s"} found.`);
  await page.fill("#findTool", "");
  await expect(page.locator("#findNone")).toHaveText("");
});
