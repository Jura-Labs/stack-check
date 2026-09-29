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
