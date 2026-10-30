// Save to a file, open a saved file, download the register as CSV, print.
// Nothing is uploaded: files are made and read in the browser.
const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const { watchErrors, fresh, step } = require("./helpers");

async function download(page, selector) {
  const [d] = await Promise.all([page.waitForEvent("download"), page.click(selector)]);
  return { name: d.suggestedFilename(), text: fs.readFileSync(await d.path(), "utf8") };
}

test("CSV: the register's 34 columns (A to AH), the example's nine tools, and its lights", async ({ page }) => {
  await fresh(page);
  await step(page, 3);
  const { name, text } = await download(page, "#dlCsv");
  expect(name).toMatch(/^stack-check-register-\d{4}-\d{2}-\d{2}\.csv$/);
  expect(text.charCodeAt(0)).toBe(0xfeff);
  const lines = text.slice(1).trim().split("\r\n");
  expect(lines).toHaveLength(10);
  const header = lines[0].split('","');
  expect(header).toHaveLength(34);
  expect(header[0]).toBe('"Tool');
  expect(lines[1]).toContain('"Microsoft 365 Business Basic","Review this year","Green","Green","Red","Green","Amber"');
});

test("CSV: a tool name that looks like a formula cannot run as one", async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => { state.tools[0].name = '=HYPERLINK("http://example.invalid","x")'; state.tools[1].name = "+1"; state.tools[2].name = "@SUM(A1)"; state.tools[3].name = "-2"; render(); });
  await step(page, 3);
  const { text } = await download(page, "#dlCsv");
  expect(text).toContain(`"'=HYPERLINK(""http://example.invalid"",""x"")"`);
  expect(text).toContain(`"'+1"`);
  expect(text).toContain(`"'@SUM(A1)"`);
  expect(text).toContain(`"'-2"`);
});

test("CSV: a formula behind a space, a tab or a return cannot run either", async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => { state.tools[0].name = " =1+1"; state.tools[1].name = "\t=2+2"; state.tools[2].name = "\r\n=3+3"; state.tools[3].owner = "  -4"; render(); });
  await step(page, 3);
  const { text } = await download(page, "#dlCsv");
  expect(text).toContain(`"' =1+1"`);
  expect(text).toContain(`"' =2+2"`);
  expect(text).toContain(`"'  =3+3"`);
  expect(text).toContain(`"'  -4"`);
  for (const line of text.slice(1).trim().split("\r\n")) for (const cell of line.slice(1, -1).split('","')) expect(cell).not.toMatch(/^\s*[=+\-@]/);
});

test("Copy register for a spreadsheet: a tool name that looks like a formula cannot run as one", async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => {
    window.__copied = [];
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: (t) => { window.__copied.push(t); return Promise.resolve(); } } });
    state.tools[0].name = '=HYPERLINK("http://example.invalid","x")'; state.tools[1].name = "+1"; state.tools[2].name = "@SUM(A1)"; state.tools[3].name = "-2"; render();
  });
  await step(page, 3);
  await page.click("#copyRows");
  await expect.poll(() => page.evaluate(() => window.__copied.length)).toBe(1);
  const lines = (await page.evaluate(() => window.__copied[0])).split("\n");
  expect(lines).toHaveLength(10);
  expect(lines[0].split("\t")).toHaveLength(34);
  expect(lines[1].split("\t")[0]).toBe(`'=HYPERLINK("http://example.invalid","x")`);
  expect(lines[2].split("\t")[0]).toBe("'+1");
  expect(lines[3].split("\t")[0]).toBe("'@SUM(A1)");
  expect(lines[4].split("\t")[0]).toBe("'-2");
  // No cell anywhere in the copied text starts a formula.
  for (const line of lines) for (const cell of line.split("\t")) expect(cell).not.toMatch(/^[=+\-@]/);
});

test("Copy register for a spreadsheet: spaces, tabs, quotes and the currency cannot smuggle a formula in", async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => {
    window.__copied = [];
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: (t) => { window.__copied.push(t); return Promise.resolve(); } } });
    state.tools[0].name = " =1+1"; state.tools[1].name = "\t=1+1"; state.tools[2].name = "\r\n=1+1";
    state.tools[3].name = '"=1+1"'; state.tools[4].name = '"=1+1'; state.tools[5].owner = "x\t=1+1";
    state.ccy = "GBP)\t=1+1\t("; render();
  });
  await step(page, 3);
  await page.click("#copyRows");
  await expect.poll(() => page.evaluate(() => window.__copied.length)).toBe(1);
  const lines = (await page.evaluate(() => window.__copied[0])).split("\n");
  expect(lines).toHaveLength(10);
  for (const line of lines) {
    const cells = line.split("\t");
    expect(cells).toHaveLength(34);
    for (const cell of cells) expect(cell).not.toMatch(/^\s*["=+\-@]/);
  }
  expect(lines[1].split("\t")[0]).toBe("' =1+1");
  expect(lines[4].split("\t")[0]).toBe(`'"=1+1"`);
});

test("save to a file, clear everything, open the file: the answers come back", async ({ page }) => {
  const errors = watchErrors(page);
  await fresh(page);
  await page.evaluate(() => { state.mode = "own"; state.tools[0].owner = "Finance lead"; render(); });
  await step(page, 3);
  const saved = await download(page, "#saveFile");
  expect(saved.name).toMatch(/^stack-check-\d{4}-\d{2}-\d{2}\.json$/);
  const before = await page.evaluate(() => JSON.stringify(state.tools));

  await page.click("#clearAll");
  await page.click("#clearYes");
  await expect.poll(() => page.evaluate(() => state.tools.length)).toBe(0);

  await page.reload(); // "Open a saved file" is on the start screen (28 Oct 2026)
  await page.setInputFiles("#openFile0", { name: "saved.json", mimeType: "application/json", buffer: Buffer.from(saved.text) });
  await expect.poll(() => page.evaluate(() => state.step)).toBe(3);
  expect(await page.evaluate(() => JSON.stringify(state.tools))).toBe(before);
  await expect(page.locator("#fileStatus")).toContainText("9 tools");
  expect(errors).toEqual([]);
});

test("Clear everything leaves nothing of the old answers in the browser, not even the kind of organisation", async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => { state.mode = "own"; state.org = "cci"; state.loc = "EU"; state.home = "DK"; state.ccy = "DKK"; state.tools[0].owner = "Finance lead"; render(); });
  await step(page, 3);
  expect(await page.evaluate(() => localStorage.getItem("stackcheck.v5"))).toContain("DKK");
  await page.click("#clearAll");
  await page.click("#clearYes");
  await expect.poll(() => page.evaluate(() => state.step)).toBe(1);
  const saved = await page.evaluate(() => localStorage.getItem("stackcheck.v5") || "");
  for (const old of ['"cci"', '"DK"', "DKK", '"EU"', "Finance lead", "Microsoft"]) expect(saved).not.toContain(old);
  expect(await page.evaluate(() => [state.org, state.loc, state.home, state.ccy, state.tools.length])).toEqual(["nonprofit", "UK", "GB", "GBP", 0]);
});

test("Copy for owners: an owner's name that looks like a formula cannot start a line as one", async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => {
    window.__copied = [];
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: (t) => { window.__copied.push(t); return Promise.resolve(); } } });
    state.mode = "own"; state.tools[0].owner = "=1+1"; state.tools[1].owner = "-2+3"; state.tools[2].owner = " @SUM(1)"; state.tools[3].owner = "Finance lead";
    state.tools[3].name = "Payroll\n=HYPERLINK(1)"; state.tools[3].next = "Tidy up\n=1+1"; render();
  });
  await step(page, 3);
  await page.click("#copyOwners");
  await expect.poll(() => page.evaluate(() => window.__copied.length)).toBe(1);
  const lines = (await page.evaluate(() => window.__copied[0])).split("\n");
  expect(lines).toContain("'=1+1");
  expect(lines).toContain("'-2+3");
  expect(lines).toContain("'@SUM(1)");
  expect(lines).toContain("Finance lead");
  // A line break inside a tool name or a next step cannot start a line of its own.
  for (const line of lines) expect(line).not.toMatch(/^\s*[=+@]/);
  for (const line of lines) expect(line === "" || /^(- |'|[A-Za-z])/.test(line)).toBe(true);
});

test("opening something that is not a Stack Check file changes nothing and says why", async ({ page }) => {
  await fresh(page);
  const before = await page.evaluate(() => JSON.stringify(state)); // on the start screen, where "Open a saved file" is
  for (const [body, msg] of [
    ["not json", "not a Stack Check file"],
    [JSON.stringify({ app: "something-else", state: {} }), "not a Stack Check file"],
    [JSON.stringify({ app: "stack-check", state: { v: 99, tools: [] } }), "different version"],
  ]) {
    await page.setInputFiles("#openFile0", { name: "x.json", mimeType: "application/json", buffer: Buffer.from(body) });
    await expect(page.locator("#fileStatus")).toContainText(msg);
    expect(await page.evaluate(() => JSON.stringify(state))).toBe(before);
  }
});

test("an opened file cannot inject markup or odd values", async ({ page }) => {
  const errors = watchErrors(page);
  await fresh(page);
  await page.evaluate(() => { window.__pwned = 0; });
  const evil = {
    app: "stack-check",
    state: {
      v: 6, org: "<b>x</b>", loc: "Mars", ccy: "BTC", home: "<script>",
      tools: [
        { key: "a", name: '<img src=x onerror="window.__pwned=1">', job: "<script>window.__pwned=1</script>", data: "Personal", owner: { toString: 1 }, nested: { a: 1 } },
        { key: "a", name: "Duplicate key", data: "None" },
        { name: "" },
      ],
      journeys: "nope",
    },
  };
  // fresh() lands on the start screen, where "Open a saved file" is (28 Oct 2026).
  await page.setInputFiles("#openFile0", { name: "evil.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(evil)) });
  await expect.poll(() => page.evaluate(() => state.step)).toBe(3);
  const s = await page.evaluate(() => state);
  expect([s.org, s.loc, s.ccy, s.home]).toEqual(["nonprofit", "UK", "GBP", "GB"]);
  expect(s.tools).toHaveLength(2);
  expect(s.tools[0].owner).toBeUndefined();
  expect(s.tools[0].nested).toBeUndefined();
  expect(s.tools[0].key).not.toBe(s.tools[1].key);
  expect(s.journeys).toEqual([]);
  expect(await page.locator("#view img[src=x]").count()).toBe(0);
  await expect(page.locator("#view")).toContainText('<img src=x onerror="window.__pwned=1">');
  expect(await page.evaluate(() => window.__pwned)).toBe(0);
  expect(errors).toEqual([]);
});

test("print: the button opens the print dialog, and the print layout hides the controls", async ({ page }) => {
  await fresh(page);
  await step(page, 3);
  await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
  await page.click("#printIt");
  expect(await page.evaluate(() => window.__printed)).toBe(1);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("nav.steps")).toBeHidden();
  await expect(page.locator("#dlCsv")).toBeHidden();
  await expect(page.locator("#regH")).toBeVisible();
});

// Live privacy check, 30 Sep 2026: a crafted file must not be able to put HTML into the page
// (a key like this made the page redirect to another site, and the redirect stuck in storage).
test("a crafted file cannot inject HTML through a tool's key, from the file or from storage", async ({ page }) => {
  await fresh(page);
  const evil = 'a"><meta http-equiv="refresh" content="0;url=https://evil.example/x"><x y="';
  const file = JSON.stringify({ app: "stack-check", state: { v: 6, org: "nonprofit", loc: "UK", tools: [
    { key: evil, name: "Crafted", job: "Test", kind: "Software", owner: "Me", account: "Organisation", admins: "Two or more", depend: "Minor", data: "Internal", signin: "Yes", copy: "Yes" },
  ] } });
  const navs = [];
  page.on("framenavigated", (f) => { if (f === page.mainFrame()) navs.push(f.url()); });
  await page.route("https://evil.example/**", (r) => r.abort());
  // fresh() lands on the start screen, where "Open a saved file" is (28 Oct 2026).
  await page.setInputFiles("#openFile0", { name: "crafted.json", mimeType: "application/json", buffer: Buffer.from(file) });
  await expect.poll(() => page.evaluate(() => state.step)).toBe(3);
  expect(await page.evaluate(() => state.tools[0].key)).toMatch(/^[a-z0-9][a-z0-9-]{0,63}$/);
  for (const s of [2, 3, 4]) await step(page, s);
  expect(await page.locator("meta[http-equiv=refresh]").count()).toBe(0);
  // The same key arriving from this browser's storage is cleaned too.
  await page.evaluate((k) => {
    const s = { v: 6, org: "nonprofit", loc: "UK", mode: "own", step: 3, tools: [{ key: k, name: "Stored", job: "", data: "Internal", kind: "Software" }], journeys: [] };
    localStorage.setItem("stackcheck.v5", JSON.stringify(s));
  }, evil);
  expect(await page.evaluate(() => load().tools[0].key)).toMatch(/^[a-z0-9][a-z0-9-]{0,63}$/);
  expect(navs.some((u) => u.includes("evil.example"))).toBe(false);
});

// W44-15 (28 Oct 2026): five library entries were merged into others. A file saved before the merge,
// or answers kept in this browser, still open, and each old tool shows as the merged entry.
// Files are opened from the start screen (#openFile0), which every version has.
const MERGE_BASE = { kind: "Software", owner: "Office manager", account: "Organisation", admins: "Two or more", depend: "Important", data: "Internal", signin: "Yes", copy: "No" };
async function openOld(page, tools, journeys) {
  const file = JSON.stringify({ app: "stack-check", state: { v: 6, org: "nonprofit", loc: "UK", tools, journeys: journeys || [] } });
  await page.setInputFiles("#openFile0", { name: "old.json", mimeType: "application/json", buffer: Buffer.from(file) });
  await expect.poll(() => page.evaluate(() => state.step)).toBe(3);
}

test("a saved file with a merged library id opens as the merged entry", async ({ page }) => {
  const errors = watchErrors(page);
  await fresh(page);
  const old = { "microsoft-teams": "microsoft-365", "whatsapp-business": "whatsapp", "instagram-professional": "facebook-page" };
  await openOld(page, Object.keys(old).map((id, i) => Object.assign({ key: "t" + i, lib: id, name: "Old " + id, job: "Saved before the merge" }, MERGE_BASE)));
  // The answers are the file's own; only the library id changes.
  expect(await page.evaluate(() => state.tools.map((t) => [t.lib, t.name]))).toEqual(Object.keys(old).map((id) => [old[id], "Old " + id]));
  await step(page, 1);
  for (const id of ["microsoft-365", "whatsapp", "facebook-page"]) await expect(page.locator(`button.chip[data-lib="${id}"]`)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('button.chip[data-lib="microsoft-teams"]')).toHaveCount(0);
  await step(page, 2);
  await expect(page.locator("details.facts summary").first()).toContainText("What we found about Microsoft 365");
  // The merged entry's longer detail sits in the facts panel, not in the note above the questions.
  await page.locator("details.facts summary").first().click();
  await expect(page.locator("details.facts").first().locator("div", { has: page.locator("dt", { hasText: "More about it" }) })).toContainText("flex routing");
  await expect(page.locator("p.note").first()).not.toContainText("flex routing");
  // The same ids kept in this browser's storage are rewritten too, and an old id still finds the merged facts.
  await page.evaluate(() => {
    localStorage.setItem("stackcheck.v5", JSON.stringify({ v: 6, org: "nonprofit", loc: "UK", mode: "own", step: 1, tools: [{ key: "s1", lib: "instagram-professional", name: "Stored", data: "Internal", kind: "Account on a platform" }], journeys: [] }));
  });
  expect(await page.evaluate(() => [load().tools[0].lib, BYID["meta-business-suite"].name, BYID["microsoft-365-copilot"].id])).toEqual(["facebook-page", "Facebook and Instagram", "microsoft-365"]);
  expect(errors).toEqual([]);
});

// Fix round 1: a 2.2.8 file can hold two or three tools that are now one entry. They open as one
// tool: the first one listed, with its own answers. Nothing from the others is added to it.
for (const [into, ids] of [["microsoft-365", ["microsoft-365", "microsoft-teams", "microsoft-365-copilot"]], ["whatsapp", ["whatsapp-business", "whatsapp"]], ["facebook-page", ["instagram-professional", "facebook-page", "meta-business-suite"]]]) {
  test(`a saved file with ${ids.join(" and ")} opens as one ${into} tool, with the first one's answers`, async ({ page }) => {
    const errors = watchErrors(page);
    await fresh(page);
    const tools = ids.map((id, i) => Object.assign({}, MERGE_BASE, { key: "m" + i, lib: id, name: "Saved " + id, owner: "Owner " + i, admins: i ? "One person" : "Two or more" }));
    tools.push(Object.assign({}, MERGE_BASE, { key: "other", lib: "canva", name: "Canva" }));
    const journeys = [{ title: "A supporter writes in", who: "Supporter", stops: [{ ref: "m1", how: "" }, { ref: "other", how: "Typed in by hand" }] }];
    await openOld(page, tools, journeys);
    const s = await page.evaluate(() => ({ tools: state.tools.map((t) => [t.key, t.lib, t.name, t.owner, t.admins]), refs: state.journeys[0].stops.map((x) => x.ref) }));
    expect(s.tools).toEqual([["m0", into, "Saved " + ids[0], "Owner 0", "Two or more"], ["other", "canva", "Canva", "Office manager", "Two or more"]]);
    // A journey stop that named a dropped tool now names the kept one.
    expect(s.refs).toEqual(["m0", "other"]);
    // Unticking the chip removes the tool, and the chip is no longer pressed.
    await step(page, 1);
    const chip = page.locator(`button.chip[data-lib="${into}"]`);
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    await chip.click();
    await expect(page.locator(`button.chip[data-lib="${into}"]`)).toHaveAttribute("aria-pressed", "false");
    expect(await page.evaluate((id) => state.tools.filter((t) => t.lib === id).length, into)).toBe(0);
    expect(errors).toEqual([]);
  });
}

test("two tools with the same library id that were never merged are both kept", async ({ page }) => {
  await fresh(page);
  await openOld(page, [Object.assign({}, MERGE_BASE, { key: "z1", lib: "zoom", name: "Zoom (staff)" }), Object.assign({}, MERGE_BASE, { key: "z2", lib: "zoom", name: "Zoom (board)" })]);
  expect(await page.evaluate(() => state.tools.map((t) => t.name))).toEqual(["Zoom (staff)", "Zoom (board)"]);
});
