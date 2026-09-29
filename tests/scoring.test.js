// Scoring parity with the Stay in command register v2.1.
// The expected table is Drive doc 23 v0.3 section 2 ("Parity test"), verified in
// the spreadsheet on 29 September 2026, with the CRM row renamed to
// "Donor CRM (UK-hosted)" by doc 24a decision 7. The spreadsheet is the
// reference: if these fail, the tool is wrong, not the table.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load");

const lights = (c, t) => ({
  action: c.action(t),
  safety: c.safety(t),
  control: c.control(t),
  exit: c.exitL(t),
  value: t.value,
  mission: c.mission(t),
});

const EXPECTED = [
  ["Microsoft 365 Business Basic", "Review this year", "Green", "Green", "Red", "Green", "Amber"],
  ["Mailchimp", "Fix now", "Green", "Red", "Amber", "Amber", "Amber"],
  ["Zoom Pro", "Keep", "Amber", "Green", "Amber", "Amber", "Amber"],
  ["Dropbox (personal)", "Fix now", "Red", "Red", "Amber", "Red", "Not checked"],
  ["Canva", "Keep", "Green", "Green", "Amber", "Green", "Not checked"],
  ["Donor CRM (UK-hosted)", "Keep", "Green", "Green", "Green", "Green", "Not checked"],
  ["Plausible", "Keep", "Green", "Green", "Green", "Green", "Not checked"],
  ["Laptops on Windows 10", "Fix now", "Red", "Green", "Red", "Red", "Not checked"],
  ["ChatGPT (personal accounts)", "Fix now", "Red", "Red", "Amber", "Green", "Red"],
];

test("the worked example has nine tools, in the register's order", () => {
  const c = load();
  assert.equal(c.example().tools.length, 9);
});

EXPECTED.forEach(([label, action, safety, control, exit, value, mission], i) => {
  test(`example row ${i + 1}: ${label}`, () => {
    const c = load();
    const t = c.example().tools[i];
    assert.deepEqual(lights(c, t), { action, safety, control, exit, value, mission });
  });
});

// Branch cases: one per rule edge in doc 23 section 2 (with the EEA change in
// 24a decision 22). A tool that passes every light unless a case changes it.
const base = {
  name: "Case", kind: "Software", owner: "Office manager", account: "Organisation",
  admins: "Two or more", depend: "Important", data: "Internal", signin: "Yes",
  where: "UK, EU or EEA", based: "UK or Europe", terms: "Yes", exp: "Yes", copy: "Yes", value: "Green",
};
const CASES = [
  // Safety
  ["safety: two-step sign-in not offered is green", { signin: "Not offered", data: "Personal" }, { safety: "Green" }],
  ["safety: unprotected, internal data only, is amber", { signin: "No" }, { safety: "Amber", action: "Keep" }],
  ["safety: unprotected with personal data is red and Fix now", { signin: "No", data: "Personal" }, { safety: "Red", action: "Fix now" }],
  ["safety: unprotected device is red", { signin: "No", kind: "Devices" }, { safety: "Red" }],
  // Control
  ["control: no owner is red and Fix now", { owner: "" }, { control: "Red", action: "Fix now" }],
  ["control: one admin is red and Fix now", { admins: "One person" }, { control: "Red", action: "Fix now" }],
  ["control: unknown data location is red", { where: "Don't know" }, { control: "Red" }],
  ["control: personal data on a personal account is Fix now", { account: "Personal", data: "Personal" }, { control: "Red", action: "Fix now" }],
  ["control: personal data without terms is amber", { data: "Personal", terms: "No" }, { control: "Amber" }],
  ["control: personal data stored elsewhere is capped at amber", { data: "Personal", where: "Elsewhere", based: "Elsewhere" }, { control: "Amber" }],
  ["control: personal data in the EEA with a supplier elsewhere stays green", { data: "Personal", based: "Elsewhere" }, { control: "Green" }],
  ["control: sensitive data with a supplier elsewhere is capped at amber", { data: "Sensitive", based: "Elsewhere" }, { control: "Amber" }],
  // Exit
  ["exit: export but no own copy is amber", { copy: "No" }, { exit: "Amber" }],
  ["exit: no export and no copy is red", { exp: "No", copy: "No" }, { exit: "Red" }],
  ["exit: export unknown and no copy is red", { exp: "Don't know", copy: "No" }, { exit: "Red" }],
  ["exit: critical with no own copy is red and Review this year", { depend: "Critical", copy: "No" }, { exit: "Red", action: "Review this year" }],
  ["exit: device with personal data and no copy is red", { kind: "Devices", data: "Personal", copy: "No" }, { exit: "Red" }],
  ["exit: minor device with no copy is amber", { kind: "Devices", depend: "Minor", copy: "No" }, { exit: "Amber" }],
  // Mission
  ["mission: not checked until a question is answered", {}, { mission: "Not checked" }],
  ["mission: AI training on with personal data is red, Trustee decision", { data: "Personal", ai: "Yes" }, { mission: "Red", action: "Trustee decision" }],
  ["mission: red but approved falls through to Keep", { fits: "No", approved: "Board, 1 Oct" }, { mission: "Red", action: "Keep" }],
  ["mission: all clear is green", { fits: "Yes", rights: "None known", env: "None known", ai: "Opted out" }, { mission: "Green" }],
  ["mission: partly answered is amber", { fits: "Yes" }, { mission: "Amber" }],
  // Two reds
  ["action: two reds elsewhere is Review at renewal", { exp: "No", copy: "No", value: "Red" }, { action: "Review at renewal" }],
  ["action: one red elsewhere is Keep", { value: "Red" }, { action: "Keep" }],
];

CASES.forEach(([name, change, want]) => {
  test(`branch: ${name}`, () => {
    const c = load();
    const got = lights(c, { ...base, ...change });
    for (const [k, v] of Object.entries(want)) assert.equal(got[k], v, `${k}`);
  });
});

test("sole trader: 'Only me' as the admin does not fail a tool (24a decision 14)", () => {
  const c = load("sole");
  const t = { ...base, owner: "", admins: "One person" };
  // Not red and not Fix now. Control stays amber, because green needs two or
  // more admins: "does not fail" is not the same as "passes".
  assert.equal(c.control(t), "Amber");
  assert.equal(c.action(t), "Keep");
  // The same answers for a charity do fail.
  const n = load("nonprofit");
  assert.equal(n.control(t), "Red");
  assert.equal(n.action(t), "Fix now");
});

test("unanswered tools get no lights", () => {
  const c = load();
  const t = { ...base, data: "" };
  assert.deepEqual([c.safety(t), c.control(t), c.exitL(t), c.mission(t), c.action(t)], ["", "", "", "", ""]);
});
