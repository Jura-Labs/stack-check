// Fixes from the persona walk-through of 29 September 2026 (audience-tester):
// finding tools, knowing where you are, saving on any step, the board summary.
const { test, expect } = require("@playwright/test");
const { fresh, step } = require("./helpers");

async function startOwn(page) {
  await fresh(page);
  await page.click("#startNew");
  await expect.poll(() => page.evaluate(() => state.step)).toBe(1);
}

test("search finds tools by the names people use (SharePoint, Gmail, Vipps)", async ({ page }) => {
  await startOwn(page);
  for (const [q, id] of [["SharePoint", "microsoft-365"], ["gmail", "google-workspace"], ["Vipps", "mobilepay"], ["twitter", "x-twitter"], ["bsky", "bluesky"]]) {
    await page.fill("#findTool", q);
    await expect(page.locator(`[data-lib="${id}"]`)).toBeVisible();
  }
});

test("search keeps its text after ticking, and a count is announced", async ({ page }) => {
  await startOwn(page);
  await page.fill("#findTool", "xero");
  await page.click('[data-lib="xero"]');
  await expect(page.locator("#findTool")).toHaveValue("xero");
  await expect(page.locator('[data-lib="asana"]')).toBeHidden();
  await expect(page.locator("#pickCount")).toHaveText("Added Xero. 1 tool chosen.");
});

test("no match says so and offers the name for 'Something not on the list?'", async ({ page }) => {
  await startOwn(page);
  await page.fill("#findTool", "Charitylog");
  await expect(page.locator("#findNone")).toContainText('Nothing called "Charitylog"');
  await expect(page.locator("#newName")).toHaveValue("Charitylog");
});

test("the step bar shows how many tools are chosen and answered", async ({ page }) => {
  await fresh(page);
  await expect(page.locator("#nav1 .sub")).toHaveText("9 tools chosen");
  await expect(page.locator("#nav2 .sub")).toHaveText("9 of 9 answered");
  await page.click("#startNew");
  await expect(page.locator("#nav1 .sub")).toHaveText("Tick what you use");
  await page.click('[data-lib="xero"]');
  await page.click('[data-lib="canva"]');
  await expect(page.locator("#nav2 .sub")).toHaveText("0 of 2 answered");
});

test("step 2 says how many are left, and results are one click away", async ({ page }) => {
  await startOwn(page);
  await page.click('[data-lib="xero"]');
  await page.click('[data-lib="canva"]');
  await step(page, 2);
  await expect(page.locator("#view")).toContainText("Tool 1 of 2. 0 answered, 2 to go.");
  await page.click("#toResults");
  await expect.poll(() => page.evaluate(() => state.step)).toBe(3);
});

test("on Decide, focus starts on the 'not answered yet' warning when there is one", async ({ page }) => {
  await startOwn(page);
  await page.click('[data-lib="xero"]');
  await step(page, 3);
  await expect(page.locator("#view > .banner")).toBeFocused();
});

test("Save to a file is on every step", async ({ page }) => {
  await fresh(page);
  for (const [s, id] of [[1, "#saveAny"], [2, "#saveAny"], [3, "#saveFile"], [4, "#saveAny"]]) {
    await step(page, s);
    const [d] = await Promise.all([page.waitForEvent("download"), page.click(id)]);
    expect(d.suggestedFilename()).toMatch(/^stack-check-.*\.json$/);
  }
});

test("the board summary: one line for second admins, no £0 costs, a date, and unanswered tools named", async ({ page }) => {
  await fresh(page);
  const text = await page.evaluate(() => {
    state.mode = "own";
    const base = { owner: "Office manager", account: "Organisation", admins: "One person", depend: "Important", data: "Internal", signin: "Yes", where: "UK, EU or EEA", based: "UK or Europe", terms: "Yes", exp: "Yes", copy: "Yes", value: "Green", cost: "" };
    state.tools = ["xero", "canva", "trello"].map((id) => Object.assign(fromLib(BYID[id]), base));
    state.tools.push(fromLib(BYID["asana"]));
    return board();
  });
  expect(text).toMatch(/summary for our trustees, \d{1,2} \w+ \d{4}/);
  expect(text).toContain("- Add a second admin to 3 tools: Xero, Canva, Trello.");
  expect(text).not.toContain("Listed licence costs");
  expect(text).toContain("1 tool is not answered yet and not included below.");
});

// Paul, 29 Sep: "users find this too difficult to understand" (the combined
// "Encrypted and still getting security updates?" question for devices).
test("devices: two plain questions instead of one, and no 'Not offered'", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await page.click('[data-lib="win11"]');
  await step(page, 2);
  await expect(page.getByRole("group", { name: "If one is lost or stolen, is the information on it locked?" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Do they still get security updates?" })).toBeVisible();
  await expect(page.locator("#view")).not.toContainText("Encrypted and still getting");
  await expect(page.locator("#view")).not.toContainText("Not offered");
});

test("devices: Safety comes from both answers, as the register's one column", async ({ page }) => {
  await fresh(page);
  const got = await page.evaluate(() => {
    const t = { kind: "Devices", name: "Laptops", data: "Personal", owner: "Office", depend: "Important", copy: "Yes" };
    const out = {};
    for (const [e, u] of [["Yes", "Yes"], ["Some of them", "Yes"], ["Yes", "No"], ["Yes", "Don't know"], ["Yes", ""]]) {
      t.enc = e; t.upd = u; t.signin = deviceSignin(t);
      out[e + "/" + u] = [t.signin, safety(t)];
    }
    return out;
  });
  expect(got).toEqual({
    "Yes/Yes": ["Yes", "Green"],
    "Some of them/Yes": ["No", "Red"],
    "Yes/No": ["No", "Red"],
    "Yes/Don't know": ["Don't know", "Red"],
    "Yes/": ["", ""],
  });
});

test("devices: answering both questions in the page sets the Safety light", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await page.click('[data-lib="mac"]');
  await step(page, 2);
  const key = await page.evaluate(() => state.tools[0].key);
  await page.locator(`input[name="enc-${key}"][value="Yes"]`).check({ force: true });
  await page.locator(`input[name="upd-${key}"][value="Yes"]`).check({ force: true });
  expect(await page.evaluate(() => state.tools[0].signin)).toBe("Yes");
});

test("devices: an answer saved before the split carries over", async ({ page }) => {
  await fresh(page);
  const t = await page.evaluate(() => {
    const tools = [{ kind: "Devices", name: "Macs", signin: "Yes" }, { kind: "Devices", name: "Old", signin: "No" }];
    migrateDevices(tools);
    return tools.map((x) => [x.enc || "", x.upd || "", x.signin]);
  });
  expect(t).toEqual([["Yes", "Yes", "Yes"], ["", "", "No"]]);
});

test("plain question wording: what data or content, and backup (Paul, 29 Sep)", async ({ page }) => {
  await fresh(page);
  await page.click("#startNew");
  await page.click('[data-lib="xero"]');
  await step(page, 2);
  await expect(page.getByRole("group", { name: "What data or content do you store in this tool?" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Do you have a backup of this data?" })).toBeVisible();
});

// Paul, 30 Sep: fewer Money tools on show; the freelancer ones are found by searching.
test("Money shows the charity tools; FreeAgent, Dinero and Billy appear when searched for", async ({ page }) => {
  await startOwn(page);
  await expect(page.locator('[data-lib="xero"]')).toBeVisible();
  for (const id of ["freeagent", "dinero", "billy"]) await expect(page.locator(`[data-lib="${id}"]`)).toBeHidden();
  await expect(page.locator(".groupmore")).toContainText("FreeAgent");
  await page.fill("#findTool", "freeagent");
  await expect(page.locator('[data-lib="freeagent"]')).toBeVisible();
  await page.click('[data-lib="freeagent"]');
  await page.fill("#findTool", "");
  await expect(page.locator('[data-lib="freeagent"]')).toBeVisible();
});

// Review of questions that do not apply (30 Sep): no false reds from pre-fills, and the right help.
test("a supplier's 'Don't know' is not pre-filled as the answer, so it does not turn Control red", async ({ page }) => {
  await fresh(page);
  const t = await page.evaluate(() => { const t = fromLib(BYID["facebook-page"]); return { where: t.where, exp: t.exp }; });
  expect(t.where).toBe("");
  const lights = await page.evaluate(() => {
    const t = Object.assign(fromLib(BYID["justgiving"]), { owner: "Fundraising manager", account: "Organisation", admins: "Two or more", depend: "Important", data: "Personal", signin: "Yes", copy: "No", terms: "Yes" });
    return { control: control(t), action: action(t) };
  });
  expect(lights.control).not.toBe("Red");
});

test("desktop apps: on your devices, no supplier email, and no red from pre-filled answers", async ({ page }) => {
  await fresh(page);
  const r = await page.evaluate(() => {
    const t = Object.assign(fromLib(BYID["gimp"]), { owner: "Comms officer", account: "Organisation", admins: "Two or more", depend: "Minor", data: "Internal", signin: "Not offered", copy: "No" });
    state.mode = "own"; state.tools = [t]; state.cur = 0;
    return { control: control(t), exit: exitL(t), place: placeOf(t), action: action(t) };
  });
  expect(r.control).not.toBe("Red");
  expect(r.exit).not.toBe("Red");
  expect(r.place).toBe("OFFICE");
  expect(r.action).not.toBe("Review at renewal");
  await step(page, 2);
  await expect(page.locator("#askSupplier")).toHaveCount(0);
  await expect(page.locator("#view")).toContainText("There is no supplier holding your data");
  await step(page, 3);
  await expect(page.locator("#whereSumH").locator("xpath=ancestor::section[1]")).toContainText("1 on your devices");
});

test("a Mission concern on a tool that needs a fix still reaches the trustees", async ({ page }) => {
  await fresh(page);
  const text = await page.evaluate(() => {
    const t = Object.assign(fromLib(BYID["stripe"]), { owner: "Finance officer", account: "Organisation", admins: "One person", depend: "Important", data: "Personal", signin: "Yes", copy: "No", ai: "Yes" });
    state.mode = "own"; state.tools = [t];
    return { action: action(t), board: board() };
  });
  expect(text.action).toBe("Fix now");
  expect(text.board).toContain("Also to decide, once the fix is done (1):");
  expect(text.board).toContain("Stripe");
});

// Register v2.2 (decision 2026-09-30): the questions follow the kind.
test("v2.2: an app on our computers is not asked about account, location, terms or export", async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => { state.mode = "own"; state.tools = [fromLib(BYID["keepassxc"])]; state.cur = 0; });
  await step(page, 2);
  const k = await page.evaluate(() => state.tools[0].key);
  expect(await page.evaluate(() => state.tools[0].kind)).toBe("App on our computers");
  for (const f of ["account", "where", "based", "terms", "exp"]) await expect(page.locator(`input[name="${f}-${k}"]`)).toHaveCount(0);
  await expect(page.locator(`input[name="open-${k}"]`).first()).toBeAttached();
  await expect(page.locator("#view")).toContainText("could someone else open the files");
});

test("v2.2: an account on a platform asks who owns the page, and an unknown location is amber", async ({ page }) => {
  await fresh(page);
  const r = await page.evaluate(() => {
    const t = Object.assign(fromLib(BYID["facebook-page"]), { owner: "Comms officer", account: "Organisation", admins: "Two or more", depend: "Important", data: "Personal", signin: "Yes", copy: "No", where: "Don't know" });
    state.mode = "own"; state.tools = [t]; state.cur = 0;
    return { kind: t.kind, control: control(t), why: why(t).control };
  });
  expect(r.kind).toBe("Account on a platform");
  expect(r.control).toBe("Amber");
  expect(r.why).toContain("The platform does not publish where it keeps data.");
  await step(page, 2);
  await expect(page.locator("#view")).toContainText("owned by the organisation (for example in a Business Portfolio)");
  await expect(page.locator("#askSupplier")).toHaveCount(0);
});
