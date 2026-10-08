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

  await step(page, 1);
  await page.setInputFiles("#openFile1", { name: "saved.json", mimeType: "application/json", buffer: Buffer.from(saved.text) });
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
    state.mode = "own"; state.tools[0].owner = "=1+1"; state.tools[1].owner = "-2+3"; state.tools[2].owner = " @SUM(1)"; state.tools[3].owner = "Finance lead"; render();
  });
  await step(page, 3);
  await page.click("#copyOwners");
  await expect.poll(() => page.evaluate(() => window.__copied.length)).toBe(1);
  const lines = (await page.evaluate(() => window.__copied[0])).split("\n");
  expect(lines).toContain("'=1+1");
  expect(lines).toContain("'-2+3");
  expect(lines).toContain("'@SUM(1)");
  expect(lines).toContain("Finance lead");
  for (const line of lines) expect(line).not.toMatch(/^\s*[=+@]/);
});

test("opening something that is not a Stack Check file changes nothing and says why", async ({ page }) => {
  await fresh(page);
  await step(page, 1);
  const before = await page.evaluate(() => JSON.stringify(state));
  for (const [body, msg] of [
    ["not json", "not a Stack Check file"],
    [JSON.stringify({ app: "something-else", state: {} }), "not a Stack Check file"],
    [JSON.stringify({ app: "stack-check", state: { v: 99, tools: [] } }), "different version"],
  ]) {
    await page.setInputFiles("#openFile1", { name: "x.json", mimeType: "application/json", buffer: Buffer.from(body) });
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
  await step(page, 1);
  await page.setInputFiles("#openFile1", { name: "evil.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(evil)) });
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
  await step(page, 1);
  await page.setInputFiles("#openFile1", { name: "crafted.json", mimeType: "application/json", buffer: Buffer.from(file) });
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
