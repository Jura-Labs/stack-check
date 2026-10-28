// Scenario tests: small lists of tools for different organisations, with the
// five lights and the suggested action for every tool WORKED OUT BY HAND from
// the rules (assets/scoring.js, register v2.2, and the stack-check-parity
// skill), written here as literals. Nothing in this file calls the app's own
// scoring functions to get an expected value. Each scenario is loaded into the
// real page, and every view is checked against the literals and against each
// other: step 2 "So far", step 3 tiles, "What to do", reasons, owners, the
// register table, the "Where your data lives" summary, board(), the CSV and
// registerRows(), and on step 4 the zones, the map pins and the map table.
//
// A test marked test.fail() documents a BUG in the app: it states what the rules
// say should happen, and fails because the app does something else. (None at
// present: the six found on 30 September were fixed and are now normal tests.)
const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const { fresh, step } = require("./helpers");

// ---------- Assertion counting (optional: SC_ASSERT_LOG=/path/file) ----------
let N = 0;
test.beforeEach(() => { N = 0; });
test.afterEach(({}, info) => {
  if (process.env.SC_ASSERT_LOG) fs.appendFileSync(process.env.SC_ASSERT_LOG, info.title + "\t" + N + "\t" + info.status + "\n");
});
function soft(v, msg) { N++; return expect.soft(v, msg); }

// ---------- Answer values, as the page stores them ----------
const EU = "UK, EU or EEA", ELSE = "Elsewhere", DK = "Don't know", EUR = "UK or Europe";
// Every answer healthy: Safety, Control, Exit and Value green, Mission not checked, Keep.
const GOOD = { owner: "Office manager", account: "Organisation", admins: "Two or more", depend: "Important", data: "Internal", signin: "Yes", where: EU, based: EUR, terms: "Yes", exp: "Yes", copy: "Yes", value: "Green" };
const g = (x) => Object.assign({}, GOOD, x || {});
// Devices: two plain questions (enc, upd) make the Safety answer (signin).
const DEV = { owner: "Office manager", account: "Organisation", admins: "Two or more", depend: "Important", data: "Internal", enc: "Yes", upd: "Yes", signin: "Yes", copy: "Yes", value: "Green" };
const d = (x) => Object.assign({}, DEV, x || {});

// Light codes: G green, A amber, R red, N not checked, - not answered. Order: Safety Control Exit Value Mission.
const WORD = { G: "Green", A: "Amber", R: "Red", N: "not checked", "-": "not answered" };
const LISTED = { "Fix now": "Fix now", "Trustee decision": "Decide", "Board decision": "Decide", "Your decision": "Decide", "Review this year": "This year", "Review at renewal": "At renewal", Keep: null, "": null };
const NOBODY = "Nobody yet: name an owner";
const ORDER = ["Fix now", "Decide", "This year", "At renewal"];
const CONTROL_REASONS = ["Nobody owns it.", "It is on someone's personal account.", "Only one person can manage it.", "You are not sure who can manage it.", "You are not sure where the data is stored.", "The platform does not publish where it keeps data.", "No data protection terms recorded.", "Sensitive data with a supplier or storage outside", "Personal data stored outside"];
const SAFETY_REASONS = ["sign-in is not", "The devices are not encrypted", "Sign-in is not protected"];
const EXIT_REASONS = ["You can only export some of the data.", "You may not be able to get the data out.", "No tested copy of your own"];
const MISSION_REASONS = ["It does not fit your mission.", "A serious human rights concern.", "A serious environmental concern.", "The supplier trains AI on personal data you hold."];

// ---------- Loading a scenario into the page ----------
async function load(page, sc) {
  await fresh(page);
  if (sc.example) {
    await page.click("#seeExample");
    await expect.poll(() => page.evaluate(() => state.step)).toBe(3);
    return;
  }
  const plain = { org: sc.org, loc: sc.loc, home: sc.home, ccy: sc.ccy, tools: sc.tools.map((t) => ({ lib: t.lib || null, custom: t.custom || null, a: t.a || {} })) };
  await page.evaluate((sc) => {
    // The organisation is set first: some pre-fills depend on it (Microsoft 365 outside the UK).
    state = { v: 6, showLaw: true, org: sc.org, loc: sc.loc, home: sc.home, ccy: sc.ccy, mode: "own", step: 1, cur: 0, jcur: 0, tools: [], journeys: [] };
    state.tools = sc.tools.map((s) => Object.assign(s.lib ? fromLib(BYID[s.lib]) : fromLib(s.custom), s.a));
    render();
  }, plain);
}

// ---------- Reading the views ----------
async function readStep2(page, i) {
  return page.evaluate((i) => {
    state.cur = i; render();
    const tx = (e) => (e ? e.textContent.replace(/\s+/g, " ").trim() : null);
    return {
      name: tx(document.querySelector("#askH")),
      lights: [...document.querySelectorAll("#lightsRow .light")].map(tx),
      suggested: tx(document.querySelector("#lightsRow b")),
      why: [...document.querySelectorAll("#whyBox li")].map(tx),
    };
  }, i);
}

async function readStep3(page) {
  return page.evaluate(() => {
    const tx = (e) => (e ? e.textContent.replace(/\s+/g, " ").trim() : null);
    const sec = (id) => { const h = document.getElementById(id); return h ? h.closest("section") : null; };
    return {
      banner: tx(document.querySelector("#view > .banner span")),
      tiles: [...document.querySelectorAll(".tiles .tile")].map((t) => ({ label: tx(t.querySelector(".eyebrow")), num: Number(tx(t.querySelector(".num"))), sub: tx(t.querySelector(".small")) })),
      intro: tx(sec("prioH").querySelector("p.muted")),
      items: [...document.querySelectorAll("ol.prio > li")].map((li) => ({ text: tx(li), when: tx(li.querySelector(".when")), whenClass: li.querySelector(".when").className, title: tx(li.querySelector("h3")), muted: tx(li.querySelector("p.small.muted")), bold: tx(li.querySelector("p.small b")) })),
      owners: [...document.querySelectorAll(".owners > .panel")].map((p) => ({ head: tx(p.querySelector("h3")), items: [...p.querySelectorAll("li")].map((li) => ({ tool: tx(li.querySelector("b")).replace(/:$/, ""), text: tx(li), lvl: li.className })) })),
      noOwners: !!sec("ownH") && /No actions for anyone yet/.test(sec("ownH").textContent),
      summary: tx(sec("whereSumH").querySelector("p")),
      dups: sec("dupH") ? [...sec("dupH").querySelectorAll("li")].map(tx) : [],
      reg: [...document.querySelectorAll("table.reg tbody tr")].map((tr) => ({ name: tx(tr.querySelector("td b")), minis: [...tr.querySelectorAll(".minis .light")].map(tx), act: tx(tr.querySelector('td[data-label="Suggested action"]')), owner: tx(tr.querySelector("td .small")) })),
      board: board(),
      rows: registerRows(),
    };
  });
}

async function readStep4(page) {
  return page.evaluate(() => {
    const tx = (e) => (e ? e.textContent.replace(/\s+/g, " ").trim() : null);
    return {
      zones: [...document.querySelectorAll(".strip .zone")].map((z) => ({ head: tx(z.querySelector("h3")), tools: [...z.querySelectorAll(".tchip")].map((c) => tx(c).replace(/ \(supplier elsewhere\)$/, "")) })),
      pins: [...document.querySelectorAll("svg.map .m-pin")].map((p) => ({ title: tx(p.querySelector("title")), cls: p.getAttribute("class"), n: Number(tx(p.querySelector("text"))), cx: Number(p.querySelector("circle").getAttribute("cx")) })),
      table: [...document.querySelectorAll("details.maptable tbody tr")].map((tr) => ({ place: tx(tr.querySelector("th")), tools: tx(tr.querySelectorAll("td")[0]), law: tx(tr.querySelectorAll("td")[1]) })),
    };
  });
}

function parseCsv(text) {
  text = text.replace(/^﻿/, "");
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\r") { /* skip */ }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

async function readCsv(page) {
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#dlCsv")]);
  return parseCsv(fs.readFileSync(await dl.path(), "utf8"));
}

// Is `name` one of the tools listed in "Place: a, b, c"?
function pinHas(title, name) { const rest = title.slice(title.indexOf(": ") + 2); return (", " + rest + ", ").includes(", " + name + ", "); }
function inList(text, name) { return (", " + text.replace(/\.$/, "") + ", ").includes(", " + name + ", ") || (", " + text + ", ").includes(", " + name + " ("); }

// ---------- The checks, the same for every scenario ----------
async function run(page, sc) {
  const ml = sc.ml, T = sc.tools;
  // Sanity of the hand-worked literals themselves.
  const zc = { in: 0, out: 0, unk: 0, dev: 0 };
  T.forEach((t) => zc[t.zone]++);
  expect([zc.in, zc.out, zc.unk, zc.dev], "scenario literals: zone counts").toEqual(sc.zones);

  await load(page, sc);

  // 1. Step 2: the "So far" lights and "Suggested:" for every tool.
  await step(page, 2);
  for (let i = 0; i < T.length; i++) {
    const t = T[i], s2 = await readStep2(page, i);
    soft(s2.name, "step 2 heading").toBe(t.name);
    const labels = ["Safety", "Control", "Exit", "Value", ml];
    const want = labels.map((l, k) => { const c = t.L[k]; return "GAR".includes(c) ? l + " " + WORD[c] : l + ": " + WORD[c]; });
    soft(s2.lights, `step 2 lights for ${t.name}`).toEqual(want);
    soft(s2.suggested, `step 2 Suggested for ${t.name}`).toBe(t.act ? "Suggested: " + t.act : null);
    // Reasons agree with the lights: no reason for a light that is not raised.
    const has = (list) => s2.why.filter((w) => list.some((r) => w.includes(r)));
    if (t.L[0] === "G") soft(has(SAFETY_REASONS), `step 2: no Safety reason for green Safety (${t.name})`).toEqual([]);
    if (t.L[1] === "G") soft(has(CONTROL_REASONS), `step 2: no Control reason for green Control (${t.name})`).toEqual([]);
    if (t.L[2] === "G") soft(has(EXIT_REASONS), `step 2: no Exit reason for green Exit (${t.name})`).toEqual([]);
    if (t.L[4] !== "R") soft(has(MISSION_REASONS), `step 2: no Mission reason unless Mission is red (${t.name})`).toEqual([]);
    if (t.kind === "platform" || t.kind === "app") soft(s2.why, `step 2: ${t.name} is never "not sure where the data is stored"`).not.toContain("You are not sure where the data is stored.");
    if (t.kind === "platform" && t.a && (t.a.where === DK || !t.a.where) && t.L[1] === "A") soft(s2.why, `step 2: platform reason for ${t.name}`).toContain("The platform does not publish where it keeps data.");
    for (const w of t.why2 || []) soft(s2.why.join(" | "), `step 2 reason for ${t.name}`).toContain(w);
    for (const w of t.noWhy2 || []) soft(s2.why.join(" | "), `step 2: no such reason for ${t.name}`).not.toContain(w);
  }

  // 2. Step 3 tiles.
  await step(page, 3);
  const s3 = await readStep3(page);
  const tile = (i) => s3.tiles[i] || {};
  soft(s3.tiles.map((x) => x.label), "tile labels").toEqual(["Tools", "Personal data", "Fix now", sc.decLabel, "Review this year"]);
  soft(s3.tiles.map((x) => x.num), "tile numbers").toEqual([sc.tiles.tools, sc.tiles.pers, sc.tiles.fix, sc.tiles.dec, sc.tiles.year]);
  soft(tile(3).sub, "decision tile sub-label").toBe(sc.decSub || ml + " concerns");
  if (sc.costLine) soft(tile(0).sub, "tools tile cost").toBe(sc.costLine);
  const unanswered = T.filter((t) => !t.act).length;
  soft(s3.banner, "not-answered banner").toBe(unanswered ? `${unanswered} of ${T.length} tools are not answered yet, so they are not scored.` : null);

  // 3. "What to do".
  const groupItem = s3.items.find((x) => /have only one admin|You are the only person/.test(x.title));
  const single = s3.items.filter((x) => x !== groupItem);
  if (sc.group) {
    soft(!!groupItem, "grouped admin card present").toBe(true);
    if (groupItem) {
      soft(groupItem.title, "group card title").toBe(sc.group.title);
      soft(groupItem.muted, "group card names").toBe(sc.group.names);
      soft(groupItem.when, "group card label").toBe(sc.group.when);
      soft(groupItem.bold, "group card next step").toContain(sc.group.bold);
      for (const l of sc.group.lines || []) soft(groupItem.text, "group card line").toContain(l);
      for (const t of T.filter((x) => x.kind === "app")) soft(inList(groupItem.muted || "", t.name), `app ${t.name} is never in the admin card`).toBe(false);
    }
  } else soft(groupItem, "no grouped admin card").toBeUndefined();
  if (groupItem) soft(s3.items.indexOf(groupItem), "group card comes first").toBe(0);
  const wantList = [];
  ORDER.forEach((w) => T.forEach((t) => { if (!t.group && LISTED[t.act] === w) wantList.push([t.name, w]); }));
  soft(single.map((x) => [x.title, x.when]), "What to do: tools, labels and order").toEqual(wantList);
  soft(s3.intro, "What to do intro").toBe(sc.nothing ? "Nothing needs attention. Please review again in 12 months, or when someone starts using a new tool." : "Everything not listed here can stay as it is. Please review again in 12 months.");
  for (const t of T) {
    const it = single.find((x) => x.title === t.name);
    if (!it) continue;
    const bold = it.bold || "", why = it.muted || "";
    for (const s of t.step || []) soft(bold, `next step for ${t.name}`).toContain(s);
    for (const s of t.noStep || []) soft(bold, `next step for ${t.name} must not say`).not.toContain(s);
    for (const s of t.reasons || []) soft(why, `reasons for ${t.name}`).toContain(s);
    for (const s of t.noReasons || []) soft(why, `reasons for ${t.name} must not say`).not.toContain(s);
    // Invariants by kind and action.
    if (t.act === "Fix now" && t.L[0] === "R") soft(bold, `Fix now with red Safety (${t.name})`).toMatch(t.kind === "device" ? /^(Upgrade, encrypt or replace these devices\.|Check encryption \(BitLocker or FileVault\) and updates on each device\.)/ : /^Switch on two-step sign-in \(MFA\)/);
    if (t.act === "Fix now" && t.L[0] !== "R") soft(bold, `no MFA step when Safety is not red (${t.name})`).not.toContain("two-step");
    if (t.kind === "platform" || t.kind === "app") {
      soft(bold, `${t.name}: never ask the supplier`).not.toContain("Send the supplier the data questions");
      soft(why, `${t.name}: never "not sure where"`).not.toContain("You are not sure where the data is stored.");
    }
    if (t.kind === "app") {
      soft(bold + " " + why, `${t.name}: an app never mentions export or data location`).not.toMatch(/export|where the data|data is kept|data location|supplier/i);
      soft(why, `${t.name}: an app never shows a personal-account reason`).not.toMatch(/personal account/);
    }
    if (t.kind === "platform" && t.a && (t.a.where === DK || !t.a.where) && t.L[1] === "A") soft(why, `platform reason (${t.name})`).toContain("The platform does not publish where it keeps data.");
    // pendingMission: Mission red and not approved. Only a Fix-now tool can carry one outside Decide.
    const pending = t.L[4] === "R" && !(t.a && t.a.approved);
    if (it.when !== "Decide" && !pending) soft(bold, `no Mission hand-off without a pending Mission (${t.name})`).not.toMatch(/Then (take|decide)/);
    if (it.when !== "Decide" && pending) soft(bold, `Mission red on a ${it.when} tool (${t.name})`).toContain(sc.org === "sole" ? `Then decide whether you accept the ${ml} concern.` : `Then take the ${ml} concern to your ${sc.tr}.`);
    if (t.L[4] !== "R") soft(bold, `no Mission hand-off without a red Mission (${t.name})`).not.toContain("concern");
    if (t.L[0] !== "R") soft(why, `no Safety reason in the list (${t.name})`).not.toMatch(/sign-in is not|devices are not encrypted/);
  }

  // 5. Owners.
  if (sc.noOwners) soft(s3.noOwners, "no owner actions").toBe(true);
  for (const t of T) {
    if (t.owner === undefined) continue;
    const heads = s3.owners.filter((o) => o.items.some((x) => x.tool === t.name)).map((o) => o.head);
    soft(heads, `owners section for ${t.name}`).toEqual(t.owner ? [].concat(t.owner) : []);
    if (t.ownerTask) {
      const grp = s3.owners.find((o) => o.head === t.ownerTask[0]);
      const item = grp && grp.items.find((x) => x.tool === t.name);
      soft(item && item.text, `owner task for ${t.name} under ${t.ownerTask[0]}`).toBe(t.name + ": " + t.ownerTask[1]);
    }
  }
  if (s3.owners.length) soft(s3.owners.findIndex((o) => o.head === NOBODY), "Nobody yet comes first").toBeLessThanOrEqual(0);

  // 6. Register table.
  soft(s3.reg.map((r) => r.name), "register rows").toEqual(T.map((t) => t.name));
  for (const t of T) {
    const r = s3.reg.find((x) => x.name === t.name);
    if (!r) continue;
    soft(r.minis, `register lights for ${t.name}`).toEqual(["Safety", "Control", "Exit", "Value", ml].map((l, k) => l + ": " + WORD[t.L[k]]));
    soft(r.act, `register action for ${t.name}`).toBe(t.act || "–");
  }

  // 8. board(): counts match the tiles and the literals.
  const b = s3.board;
  soft(b, "board: fixing now").toContain(`2. What we are fixing now (${sc.board.fix})`);
  soft(b, "board: decisions").toContain(`${sc.decLabel}s (${sc.board.dec}):`);
  soft(b, "board: this year").toContain(`Reviews this year (${sc.board.year}):`);
  if (sc.board.ren) soft(b, "board: at renewal").toContain(`Reviews at renewal (${sc.board.ren}):`);
  else soft(b, "board: no renewal list").not.toContain("Reviews at renewal");
  if (sc.board.also) soft(b, "board: also to decide").toContain(`Also to decide, once the fix is done (${sc.board.also}):`);
  else if (sc.board.also === 0) soft(b, "board: nothing else to decide").not.toContain("Also to decide");
  for (const l of sc.board.lines || []) soft(b, "board line").toContain(l);
  for (const l of sc.board.noLines || []) soft(b, "board must not have").not.toContain(l);
  soft(b, "board section 3 heading").toContain(sc.org === "sole" ? "3. What I need to decide" : "3. What we need you to decide");
  soft(sc.board.fix, "board fix = tile").toBe(tile(2).num);
  soft(sc.board.dec, "board decisions = tile").toBe(tile(3).num);
  soft(sc.board.year, "board this year = tile").toBe(tile(4).num);
  if (unanswered) soft(b, "board: unanswered").toContain(`${unanswered} tool${unanswered === 1 ? " is" : "s are"} not answered yet`);
  const pers = (b.match(/and (\d+) hold personal or sensitive data/) || [])[1];
  soft(Number(pers), "board personal = tile").toBe(sc.tiles.pers);

  // 9. registerRows() and the downloaded CSV: the action column.
  soft(s3.rows[0][1], "registerRows header").toBe("Suggested action");
  soft(s3.rows.slice(1).map((r) => [r[0], r[1], r[2], r[3], r[4], r[5], r[6]]), "registerRows action and lights").toEqual(
    T.map((t) => [t.name, t.act, ...t.L.split("").map((c, k) => (c === "-" ? (k === 3 ? "" : "") : c === "N" ? (k === 4 ? "Not checked" : "") : WORD[c]))]));
  const csv = await readCsv(page);
  soft(csv.slice(1).map((r) => [r[0], r[1]]), "CSV action column").toEqual(T.map((t) => [t.name, t.act]));

  // 7. Where your data lives: the step 3 summary against step 4.
  const [zi, zo, zu, zd] = sc.zones;
  soft(s3.summary, "step 3 summary").toBe(`${zi} in the UK, EU or EEA, ${zo} outside, ${zu} not sure, and ${zd} on your devices.`);
  if (sc.dups) for (const dline of sc.dups) soft(s3.dups.join(" | "), "duplicates").toContain(dline);

  await step(page, 4);
  const s4 = await readStep4(page);
  soft(s4.zones.map((z) => z.head), "step 4 zone counts").toEqual([`UK, EU or EEA (${zi})`, `Outside the UK, EU or EEA (${zo})`, `Not sure (${zu})`, `On your devices (${zd})`]);
  const zoneKey = ["in", "out", "unk", "dev"];
  for (const t of T) {
    const z = s4.zones.findIndex((zz) => zz.tools.includes(t.name));
    soft(zoneKey[z], `step 4 zone of ${t.name}`).toBe(t.zone);
    const pins = s4.pins.filter((p) => pinHas(p.title, t.name));
    if (!t.map) { soft(pins.length, `${t.name} is not on the map`).toBe(0); continue; }
    soft(pins.map((p) => p.title.slice(0, p.title.indexOf(": "))), `map pin for ${t.name}`).toEqual([t.map]);
    if (pins[0]) {
      const cls = pins[0].cls;
      const want = t.zone === "out" ? "m-out" : t.zone === "unk" ? "m-unk" : "";
      soft(cls.includes("m-out") ? "m-out" : cls.includes("m-unk") ? "m-unk" : "", `pin colour agrees with the zone for ${t.name}`).toBe(want);
    }
    const rows = s4.table.filter((r) => inList(r.tools, t.name));
    soft(rows.map((r) => r.place), `map table row for ${t.name}`).toEqual([t.row || t.map]);
    if (t.law) soft(rows[0] && rows[0].law, `whose law applies for ${t.name}`).toContain(t.law);
  }
  // Pin numbers add up to the answered tools.
  soft(s4.pins.reduce((a, p) => a + p.n, 0), "pins count every answered tool once").toBe(T.filter((t) => t.act).length);
}

// ===================================================================
// The scenarios. Every value below was worked out by hand from the rules.
// ===================================================================
const S = {};

S.ukHealthy = {
  title: "UK charity, everything healthy: all Keep, nothing to do",
  org: "nonprofit", loc: "UK", home: "GB", ccy: "GBP", ml: "Mission", decLabel: "Trustee decision", tr: "trustees",
  tools: [
    { lib: "brevo", name: "Brevo", a: g({ data: "Personal" }), L: "GGGGN", act: "Keep", zone: "in", map: "France", owner: null },
    { lib: "beacon-crm", name: "Beacon CRM", a: g({ data: "Sensitive" }), L: "GGGGN", act: "Keep", zone: "in", map: "United Kingdom", owner: null },
    { custom: { name: "Volunteer rota sheet", job: "Rota", k: "Software" }, name: "Volunteer rota sheet", a: g({ data: "None" }), L: "GGGGN", act: "Keep", zone: "in", map: "UK, EU or EEA, country not stated", owner: null },
  ],
  tiles: { tools: 3, pers: 2, fix: 0, dec: 0, year: 0 }, zones: [3, 0, 0, 0], nothing: true, noOwners: true, costLine: "No costs entered",
  board: { fix: 0, dec: 0, year: 0, ren: 0, also: 0, lines: ["- Nothing", "Trustee decisions (0):\n- None", "Technology check: summary for our trustees"] },
};

S.ukFixNow = {
  title: "UK charity: Fix now for every reason (MFA, no owner, personal account, one admin, Windows 10)",
  org: "nonprofit", loc: "UK", home: "GB", ccy: "GBP", ml: "Mission", decLabel: "Trustee decision", tr: "trustees",
  tools: [
    { lib: "mailchimp", name: "Mailchimp", a: g({ data: "Personal", signin: "No", where: ELSE, based: ELSE }), L: "RAGGN", act: "Fix now", zone: "out", map: "United States", owner: "Office manager",
      step: ["Switch on two-step sign-in (MFA) for everyone."], reasons: ["It holds personal data, and sign-in is not protected.", "Personal data stored outside the UK, EU or EEA. Understand and document it."] },
    { lib: "trello", name: "Trello", a: g({ owner: "", where: ELSE, based: ELSE }), L: "GRGGN", act: "Fix now", zone: "out", map: "United States", owner: NOBODY, step: ["Name an owner."], reasons: ["Nobody owns it."] },
    { lib: "dropbox", name: "Dropbox", a: g({ account: "Personal", data: "Personal", where: ELSE, based: ELSE }), L: "GRGGN", act: "Fix now", zone: "out", map: "United States", owner: "Office manager",
      step: ["Move the work to an organisation account."], reasons: ["It is on someone's personal account."] },
    { lib: "canva", name: "Canva", a: g({ admins: "One person", data: "None", where: ELSE, based: ELSE }), L: "GRGGN", act: "Fix now", zone: "out", map: "United States", owner: "Office manager",
      step: ["Add a second admin."], reasons: ["Only one person can manage it."] },
    { lib: "win10", kind: "device", name: "Laptops on Windows 10", a: d({ depend: "Critical", data: "Personal", upd: "No", signin: "No", copy: "No", value: "Amber" }), L: "RGRAN", act: "Fix now", zone: "dev", map: "Your office and devices", owner: "Office manager",
      step: ["Upgrade, encrypt or replace these devices."], reasons: ["The devices are not encrypted, or no longer get security updates.", "No tested copy of your own, and you depend on it."] },
  ],
  tiles: { tools: 5, pers: 3, fix: 5, dec: 0, year: 0 }, zones: [0, 4, 0, 1],
  board: { fix: 5, dec: 0, year: 0, ren: 0, also: 0, lines: ["- Mailchimp: Switch on two-step sign-in (MFA) for everyone.", "- Trello: Name an owner.", "- Canva: Add a second admin.", "- Laptops on Windows 10: Upgrade, encrypt or replace these devices."] },
};

S.ukGrouped = {
  title: "UK charity: three single-admin tools grouped in one card, MFA fix listed on its own",
  org: "nonprofit", loc: "UK", home: "GB", ccy: "GBP", ml: "Mission", decLabel: "Trustee decision", tr: "trustees",
  tools: [
    { lib: "xero", name: "Xero", group: true, a: g({ admins: "One person", data: "Personal", where: ELSE, based: ELSE, exp: "Partial" }), L: "GRAGN", act: "Fix now", zone: "out", map: "United States", owner: "Office manager" },
    { lib: "hubspot", name: "HubSpot", group: true, a: g({ admins: "One person", data: "Personal", based: ELSE }), L: "GRGGN", act: "Fix now", zone: "in", map: "Germany", owner: "Office manager", law: "HubSpot: United States" },
    { lib: "slack", name: "Slack", a: g({ admins: "One person", signin: "No", data: "Personal", where: ELSE, based: ELSE }), L: "RRGGN", act: "Fix now", zone: "out", map: "United States", owner: "Office manager",
      step: ["Switch on two-step sign-in (MFA) for everyone."], noStep: ["Add a second admin."], reasons: ["It holds personal data, and sign-in is not protected."], noReasons: ["Only one person can manage it."] },
    { lib: "enthuse", name: "Enthuse", a: g({ data: "Personal" }), L: "GGGGN", act: "Keep", zone: "in", map: "United Kingdom", owner: null },
    // An app with one person: Control red, Fix now, but never in the admin card (change 6).
    { lib: "keepassxc", kind: "app", name: "KeePassXC", a: { owner: "Office manager", admins: "One person", depend: "Important", data: "Internal", signin: "Not offered", copy: "Yes", value: "Green" }, L: "GRGGN", act: "Fix now", zone: "dev", map: "Your office and devices", owner: "Office manager",
      step: ["Make sure someone else can open the files, and knows where the master password is kept."], noStep: ["Add a second admin"], reasons: ["Only one person can open the files."] },
  ],
  group: { title: "3 tools have only one admin", names: "Xero, HubSpot, Slack.", when: "Fix now", bold: "Add a second admin to each. If that is not possible, write down the recovery codes and keep them with the chair." },
  tiles: { tools: 5, pers: 4, fix: 4, dec: 0, year: 0 }, zones: [2, 2, 0, 1],
  board: { fix: 4, dec: 0, year: 0, ren: 0, also: 0, lines: ["- Slack: Switch on two-step sign-in (MFA) for everyone.\n", "- KeePassXC: Make sure someone else can open the files, and knows where the master password is kept.", "- Add a second admin to 3 tools: Xero, HubSpot, Slack."], noLines: ["- Xero:", "- HubSpot:"] },
};

S.soleCodes = {
  title: "Sole trader: 'Only me' is not a fix; one recovery-codes card",
  org: "sole", loc: "UK", home: "GB", ccy: "GBP", ml: "Values", decLabel: "Your decision", tr: "records",
  tools: [
    { lib: "xero", name: "Xero", a: g({ owner: "", admins: "One person", data: "Personal", where: ELSE, based: ELSE }), L: "GAGGN", act: "Keep", zone: "out", map: "United States", owner: null,
      why2: ["Personal data stored outside the UK, EU or EEA. Understand and document it."], noWhy2: ["Only one person can manage it.", "Nobody owns it."] },
    { lib: "canva", name: "Canva", a: g({ owner: "", admins: "One person", data: "None", where: ELSE, based: ELSE }), L: "GAGGN", act: "Keep", zone: "out", map: "United States", owner: null },
    { lib: "freeagent", name: "FreeAgent", a: g({ owner: "Me", data: "Personal" }), L: "GGGGN", act: "Keep", zone: "in", map: "Ireland", owner: null },
  ],
  group: { title: "You are the only person who can get into 2 tools", names: "Xero, Canva.", when: "Plan for it", bold: "For each one, write down the recovery codes and keep them somewhere a person you trust can reach if you cannot. Tell them where." },
  tiles: { tools: 3, pers: 2, fix: 0, dec: 0, year: 0 }, zones: [1, 2, 0, 0], noOwners: true, costLine: "No costs entered",
  board: { fix: 0, dec: 0, year: 0, ren: 0, also: 0, lines: ["Technology check: summary, ", "Your decisions (0):", "- Recovery codes: I am the only person who can get into 2 tools (Xero, Canva). Write down the recovery codes and tell someone I trust where they are.", "3. What I need to decide"], noLines: ["Add a second admin"] },
};

S.soleValues = {
  title: "Sole trader: Your decision, and a Values red on a tool that also needs a fix",
  org: "sole", loc: "UK", home: "GB", ccy: "GBP", ml: "Values", decLabel: "Your decision", tr: "records",
  tools: [
    { lib: "chatgpt", name: "ChatGPT", a: g({ owner: "Me", data: "Personal", where: ELSE, based: ELSE, exp: "Partial", copy: "No", ai: "Yes", fits: "Yes", value: "Amber" }), L: "GAAAR", act: "Your decision", zone: "out", map: "United States", owner: "You",
      step: ["Decide whether you accept this Values concern, and write down your decision."], reasons: ["The supplier trains AI on personal data you hold."] },
    { lib: "canva", name: "Canva", a: g({ owner: "Me", data: "Personal", signin: "No", where: ELSE, based: ELSE, fits: "No" }), L: "RAGGR", act: "Fix now", zone: "out", map: "United States", owner: ["Me", "You"],
      ownerTask: ["You", "After the fix, decide whether you accept the Values concern. It does not fit your values."],
      step: ["Switch on two-step sign-in (MFA). Then decide whether you accept the Values concern."], noStep: ["for everyone"], reasons: ["It does not fit your values."] },
    { lib: "dropbox", name: "Dropbox", a: g({ owner: "Me", account: "Personal", data: "Personal", where: ELSE, based: ELSE }), L: "GRGGN", act: "Fix now", zone: "out", map: "United States", owner: "Me",
      step: ["Move it to a business account."], reasons: ["It is on a personal account."], noReasons: ["someone's"] },
  ],
  tiles: { tools: 3, pers: 3, fix: 2, dec: 1, year: 0 }, zones: [0, 3, 0, 0], decSub: "Values concerns, and 1 more after a fix",
  board: { fix: 2, dec: 1, year: 0, ren: 0, also: 1, lines: ["- Canva: Switch on two-step sign-in (MFA).\n", "- Dropbox: Move it to a business account.", "Your decisions (1):\n- ChatGPT: The supplier trains AI on personal data you hold.", "Also to decide, once the fix is done (1):\n- Canva: It does not fit your values."] },
};

S.ukTrustee = {
  title: "UK charity: two Trustee decisions (human rights, does not fit)",
  org: "nonprofit", loc: "UK", home: "GB", ccy: "GBP", ml: "Mission", decLabel: "Trustee decision", tr: "trustees",
  tools: [
    { lib: "google-workspace", name: "Google Workspace", a: g({ data: "Personal", where: ELSE, based: ELSE, rights: "Serious concern", ai: "No", env: "None known", fits: "Yes" }), L: "GAGGR", act: "Trustee decision", zone: "out", map: "Elsewhere", row: "Outside Europe, country not stated", owner: "Your trustees",
      step: ["Take the Mission concern to your trustees. Record who approved the trade-off, or plan a change."], reasons: ["A serious human rights concern."] },
    { lib: "mailchimp", name: "Mailchimp", a: g({ data: "Personal", where: ELSE, based: ELSE, fits: "No" }), L: "GAGGR", act: "Trustee decision", zone: "out", map: "United States", owner: "Your trustees",
      reasons: ["It does not fit your mission."] },
  ],
  tiles: { tools: 2, pers: 2, fix: 0, dec: 2, year: 0 }, zones: [0, 2, 0, 0],
  board: { fix: 0, dec: 2, year: 0, ren: 0, also: 0, lines: ["Trustee decisions (2):\n- Google Workspace: A serious human rights concern.\n- Mailchimp: It does not fit your mission."] },
};

S.ukApproved = {
  title: "UK charity: a red Mission already approved is not a decision (views that are right)",
  org: "nonprofit", loc: "UK", home: "GB", ccy: "GBP", ml: "Mission", decLabel: "Trustee decision", tr: "trustees",
  tools: [
    { lib: "zoom", name: "Zoom", a: g({ where: ELSE, based: ELSE, env: "Serious concern", approved: "Chair, June 2026" }), L: "GGGGR", act: "Keep", zone: "out", map: "United States", owner: null },
    { lib: "beacon-crm", name: "Beacon CRM", a: g({ data: "Personal" }), L: "GGGGN", act: "Keep", zone: "in", map: "United Kingdom", owner: null },
    { lib: "microsoft-365", name: "Microsoft 365", a: g({ data: "Personal", depend: "Critical", based: ELSE, exp: "Partial", copy: "No", ai: "Yes", approved: "Board, May 2026" }), L: "GGRGR", act: "Review this year", zone: "in",
      map: "London and Cardiff", row: "London and Cardiff, United Kingdom", owner: "Office manager", law: "Microsoft 365: United States",
      step: ["Keep your own copy of the data, and test that you can restore it."], noStep: ["Then take"], reasons: ["You can only export some of the data.", "No tested copy of your own, and you depend on it."] },
  ],
  tiles: { tools: 3, pers: 2, fix: 0, dec: 0, year: 1 }, zones: [2, 1, 0, 0],
  board: { fix: 0, dec: 0, year: 1, ren: 0, also: 0, lines: ["Trustee decisions (0):\n- None", "- Microsoft 365: Keep your own copy of the data, and test that you can restore it."] },
};

S.ukThisYear = {
  title: "UK charity: Review this year for each trigger (unknown location, no export, critical, an app with no copy)",
  org: "nonprofit", loc: "UK", home: "GB", ccy: "GBP", ml: "Mission", decLabel: "Trustee decision", tr: "trustees",
  tools: [
    { lib: "justgiving", name: "JustGiving", a: g({ data: "Personal", where: DK }), L: "GRGGN", act: "Review this year", zone: "unk", map: "Not sure where", owner: "Office manager",
      step: ["Find out where the data is kept. Send the supplier the data questions."], reasons: ["You are not sure where the data is stored."] },
    { lib: "sage-accounting", name: "Sage Accounting", a: g({ data: "Personal", exp: "No", copy: "No" }), L: "GGRGN", act: "Review this year", zone: "in", map: "Dublin", row: "Dublin, Ireland", owner: "Office manager",
      step: ["Keep your own copy of the data, and test that you can restore it."], reasons: ["You may not be able to get the data out.", "No tested copy of your own."] },
    { lib: "trello", name: "Trello", a: g({ depend: "Critical", where: ELSE, based: ELSE, exp: "Partial", copy: "No" }), L: "GGRGN", act: "Review this year", zone: "out", map: "United States", owner: "Office manager",
      reasons: ["You can only export some of the data.", "No tested copy of your own, and you depend on it."] },
    { lib: "keepassxc", kind: "app", name: "KeePassXC", a: { owner: "Office manager", admins: "Two or more", depend: "Important", data: "Personal", signin: "Not offered", copy: "No", value: "Green" }, L: "GGRGN", act: "Review this year", zone: "dev", map: "Your office and devices", owner: "Office manager",
      step: ["Copy the files somewhere else, and check you can open the copy."], reasons: ["No tested copy of your own."] },
  ],
  tiles: { tools: 4, pers: 3, fix: 0, dec: 0, year: 4 }, zones: [1, 1, 1, 1],
  board: { fix: 0, dec: 0, year: 4, ren: 0, also: 0, lines: ["- JustGiving: Find out where the data is kept. Send the supplier the data questions.", "- KeePassXC: Copy the files somewhere else, and check you can open the copy."] },
};

S.ukRenewal = {
  title: "UK charity: Review at renewal (two reds) and a single red that stays Keep",
  org: "nonprofit", loc: "UK", home: "GB", ccy: "GBP", ml: "Mission", decLabel: "Trustee decision", tr: "trustees",
  tools: [
    { lib: "squarespace", name: "Squarespace", a: g({ value: "Red", exp: "No", copy: "No", where: ELSE, based: ELSE }), L: "GGRRN", act: "Review at renewal", zone: "out", map: "United States", owner: "Office manager",
      step: ["Look at whether you still need it before it renews."] },
    { lib: "calendly", name: "Calendly", a: g({ data: "None", signin: "No", value: "Red", where: ELSE, based: ELSE }), L: "AGGRN", act: "Keep", zone: "out", map: "United States", owner: null,
      why2: ["Sign-in is not protected, but it holds no personal data."] },
    { lib: "surveymonkey", name: "SurveyMonkey", a: g({ signin: "No", exp: DK, copy: DK, value: "Red", where: ELSE, based: ELSE }), L: "AGRRN", act: "Review at renewal", zone: "out", map: "United States", owner: "Office manager",
      step: ["Look at whether you still need it before it renews."] },
  ],
  tiles: { tools: 3, pers: 0, fix: 0, dec: 0, year: 0 }, zones: [0, 3, 0, 0],
  board: { fix: 0, dec: 0, year: 0, ren: 2, also: 0, lines: ["Reviews at renewal (2):\n- Squarespace\n- SurveyMonkey"] },
};

S.ukPlatforms = {
  title: "UK charity: accounts on a platform (Facebook, X, Bluesky, LinkedIn) against Software with an unknown location",
  org: "nonprofit", loc: "UK", home: "GB", ccy: "GBP", ml: "Mission", decLabel: "Trustee decision", tr: "trustees",
  tools: [
    { lib: "facebook-page", kind: "platform", name: "Facebook Page", a: { owner: "Comms lead", account: "Organisation", admins: "Two or more", depend: "Important", data: "Personal", signin: "Yes", where: DK, based: ELSE, copy: "No", value: "Green" }, L: "GAAGN", act: "Keep", zone: "unk", map: "Not sure where", owner: null,
      why2: ["The platform does not publish where it keeps data.", "You can only export some of the data.", "No tested copy of your own."], noWhy2: ["You are not sure where the data is stored.", "No data protection terms recorded."] },
    { lib: "x-twitter", kind: "platform", name: "X (formerly Twitter)", a: { owner: "", account: "Organisation", admins: "Two or more", depend: "Important", data: "Internal", signin: "No", where: DK, based: ELSE, copy: "No", value: "Amber" }, L: "ARAAN", act: "Fix now", zone: "unk", map: "Not sure where", owner: NOBODY,
      step: ["Name an owner."], reasons: ["Nobody owns it."], noReasons: ["You are not sure where the data is stored."] },
    { lib: "bluesky", kind: "platform", name: "Bluesky", a: { owner: "Comms lead", account: "Personal", admins: "Two or more", depend: "Important", data: "Personal", signin: "Yes", where: DK, based: ELSE, copy: "Yes", value: "Green" }, L: "GRAGN", act: "Fix now", zone: "unk", map: "Not sure where", owner: "Comms lead",
      step: ["Move the work to an organisation account."], reasons: ["It is on someone's personal account."] },
    { lib: "salesforce-nonprofit-cloud", name: "Salesforce Nonprofit", a: g({ data: "Personal", where: DK, based: ELSE }), L: "GRGGN", act: "Review this year", zone: "unk", map: "Not sure where", owner: "Office manager",
      step: ["Find out where the data is kept. Send the supplier the data questions."], reasons: ["You are not sure where the data is stored."] },
    { lib: "linkedin-company-page", kind: "platform", name: "LinkedIn Company Page", a: { owner: "Comms lead", account: "Organisation", admins: "Two or more", depend: "Critical", data: "Personal", signin: "Yes", where: DK, based: ELSE, exp: "No", copy: "No", value: "Green" }, L: "GARGN", act: "Review this year", zone: "unk", map: "Not sure where", owner: "Comms lead",
      step: ["Keep your own copy of the data, and test that you can restore it."], reasons: ["The platform does not publish where it keeps data.", "You may not be able to get the data out.", "No tested copy of your own, and you depend on it."] },
    // "Where" left blank on a platform counts like Don't know: Control capped at amber (change 2).
    { lib: "instagram-professional", kind: "platform", name: "Instagram (professional account)", a: { owner: "Comms lead", account: "Organisation", admins: "Two or more", depend: "Minor", data: "Internal", signin: "Yes", based: ELSE, copy: "Yes", value: "Green" }, L: "GAAGN", act: "Keep", zone: "unk", map: "Not sure where", owner: null,
      why2: ["The platform does not publish where it keeps data."], noWhy2: ["You are not sure where the data is stored."] },
  ],
  tiles: { tools: 6, pers: 4, fix: 2, dec: 0, year: 2 }, zones: [0, 0, 6, 0],
  board: { fix: 2, dec: 0, year: 2, ren: 0, also: 0, lines: ["- Salesforce Nonprofit: Find out where the data is kept. Send the supplier the data questions.", "- LinkedIn Company Page: Keep your own copy of the data, and test that you can restore it."] },
};

S.cciApps = {
  title: "Cultural organisation: apps on our computers (KeePassXC, GIMP, Inkscape)",
  org: "cci", loc: "UK", home: "GB", ccy: "GBP", ml: "Values", decLabel: "Board decision", tr: "board",
  tools: [
    { lib: "keepassxc", kind: "app", name: "KeePassXC", a: { owner: "Office manager", admins: "Two or more", depend: "Critical", data: "Sensitive", signin: "Not offered", copy: "Yes", value: "Green" }, L: "GGGGN", act: "Keep", zone: "dev", map: "Your office and devices", owner: null },
    { lib: "gimp", kind: "app", name: "GIMP", a: { owner: "Designer", admins: "One person", depend: "Minor", data: "Internal", signin: "Not offered", copy: "No", value: "Green" }, L: "GRAGN", act: "Fix now", zone: "dev", map: "Your office and devices", owner: "Designer",
      step: ["Make sure someone else can open the files."], noStep: ["admin"], reasons: ["Only one person can open the files."] },
    { lib: "inkscape", kind: "app", name: "Inkscape", a: { owner: "", admins: "Two or more", depend: "Minor", data: "Internal", signin: "Not offered", copy: "Yes", value: "Green" }, L: "GRGGN", act: "Fix now", zone: "dev", map: "Your office and devices", owner: NOBODY,
      step: ["Name an owner."], reasons: ["Nobody owns it."] },
  ],
  tiles: { tools: 3, pers: 1, fix: 2, dec: 0, year: 0 }, zones: [0, 0, 0, 3],
  board: { fix: 2, dec: 0, year: 0, ren: 0, also: 0, lines: ["Technology check: summary for our board", "Board decisions (0):", "- GIMP: Make sure someone else can open the files.", "- Inkscape: Name an owner."] },
};

S.dkNonprofit = {
  title: "Danish non-profit (EU): Board decision, Danish tools, Windows 11",
  org: "nonprofit", loc: "EU", home: "DK", ccy: "DKK", ml: "Mission", decLabel: "Board decision", tr: "board",
  tools: [
    { lib: "e-conomic", name: "e-conomic", a: g({ data: "Personal" }), L: "GGGGN", act: "Keep", zone: "in", map: "UK, EU or EEA, country not stated", owner: null },
    { lib: "foreninglet", name: "ForeningLet", a: g({ data: "Personal", ai: "No", rights: "Some concerns", env: "None known", fits: "Yes" }), L: "GGGGA", act: "Keep", zone: "in", map: "UK, EU or EEA, country not stated", owner: null },
    // Outside the UK, Microsoft 365 pre-fills its EU region, not the London and Cardiff site (change 9).
    { lib: "microsoft-365", name: "Microsoft 365", a: g({ data: "Personal", based: ELSE }), L: "GGGGN", act: "Keep", zone: "in", map: "UK, EU or EEA, country not stated", owner: null, law: "Microsoft 365: United States" },
    { lib: "mobilepay", name: "MobilePay (MyShop, Donations)", a: g({ data: "Personal", loc: "DK", ai: "Yes", fits: "Needs discussion" }), L: "GGGGR", act: "Board decision", zone: "in", map: "Denmark", owner: "Your board",
      step: ["Take the Mission concern to your board. Record who approved the trade-off, or plan a change."], reasons: ["The supplier trains AI on personal data you hold."] },
    { custom: { name: "Official post mailbox", job: "Official post", k: "Software" }, name: "Official post mailbox", a: g({ data: "Sensitive", signin: "No", loc: "DK" }), L: "RGGGN", act: "Fix now", zone: "in", map: "Denmark", owner: "Office manager",
      step: ["Switch on two-step sign-in (MFA) for everyone."], reasons: ["It holds sensitive data, and sign-in is not protected."] },
    { lib: "win11", kind: "device", name: "Laptops on Windows 11", a: d(), L: "GGGGN", act: "Keep", zone: "dev", map: "Your office and devices", owner: null },
  ],
  tiles: { tools: 6, pers: 5, fix: 1, dec: 1, year: 0 }, zones: [5, 0, 0, 1], costLine: "No costs entered",
  board: { fix: 1, dec: 1, year: 0, ren: 0, also: 0, lines: ["Technology check: summary for our board", "Board decisions (1):\n- MobilePay (MyShop, Donations): The supplier trains AI on personal data you hold."] },
};

S.eea = {
  title: "EEA rule: data in Norway and Iceland counts as inside; Switzerland and the US are outside",
  org: "nonprofit", loc: "EU", home: "DK", ccy: "EUR", ml: "Mission", decLabel: "Board decision", tr: "board",
  tools: [
    { custom: { name: "Norway member system", job: "Members", k: "Software" }, name: "Norway member system", a: g({ data: "Personal", loc: "NO", hq: "NO" }), L: "GGGGN", act: "Keep", zone: "in", map: "Norway", owner: null },
    { custom: { name: "Iceland backup service", job: "Backups", k: "Software" }, name: "Iceland backup service", a: g({ data: "Sensitive", loc: "IS" }), L: "GGGGN", act: "Keep", zone: "in", map: "Iceland", owner: null },
    { lib: "proton", name: "Proton", a: g({ data: "Sensitive", where: ELSE }), L: "GAGGN", act: "Keep", zone: "out", map: "Switzerland", owner: null,
      why2: ["Sensitive data stored outside the UK, EU or EEA. Understand and document it."] },
    { custom: { name: "US survey tool", job: "Surveys", k: "Software" }, name: "US survey tool", a: g({ data: "Personal", where: ELSE, based: ELSE, loc: "US", hq: "US" }), L: "GAGGN", act: "Keep", zone: "out", map: "United States", owner: null,
      why2: ["Personal data stored outside the UK, EU or EEA. Understand and document it."] },
  ],
  tiles: { tools: 4, pers: 4, fix: 0, dec: 0, year: 0 }, zones: [2, 2, 0, 0], nothing: true, noOwners: true, costLine: "No costs entered",
  board: { fix: 0, dec: 0, year: 0, ren: 0, also: 0 },
};

S.canada = {
  title: "Canadian non-profit: outside the UK and EU, board wording, grouped admins, Mission red on a fix",
  org: "nonprofit", loc: "CA", home: "CA", ccy: "CAD", ml: "Mission", decLabel: "Board decision", tr: "board",
  tools: [
    { custom: { name: "Canadian donor database", job: "Donor records", k: "Software" }, name: "Canadian donor database", a: g({ data: "Personal", where: ELSE, based: ELSE, loc: "OTHER" }), L: "GAGGN", act: "Keep", zone: "out", map: "Elsewhere", row: "Outside Europe, country not stated", owner: null },
    { lib: "google-workspace", name: "Google Workspace", group: true, a: g({ data: "Personal", admins: "One person", where: ELSE, based: ELSE }), L: "GRGGN", act: "Fix now", zone: "out", map: "Elsewhere", row: "Outside Europe, country not stated", owner: "Office manager", law: "Google Workspace: United States" },
    // Shown only in the admin card, with a pending Mission concern: the card says so (change 5).
    { lib: "zoom", name: "Zoom", group: true, a: g({ data: "Personal", admins: "One person", where: ELSE, based: ELSE, fits: "No" }), L: "GRGGR", act: "Fix now", zone: "out", map: "United States", owner: ["Office manager", "Your board"],
      ownerTask: ["Your board", "After the fix, decide on the Mission concern. It does not fit your mission."] },
    { lib: "chatgpt", name: "ChatGPT", a: g({ data: "Personal", signin: DK, where: ELSE, based: ELSE, terms: "No", exp: "Partial", copy: "No", ai: "Yes", value: "Amber" }), L: "RAAAR", act: "Fix now", zone: "out", map: "United States", owner: ["Office manager", "Your board"],
      ownerTask: ["Your board", "After the fix, decide on the Mission concern. The supplier trains AI on personal data you hold."],
      step: ["Switch on two-step sign-in (MFA) for everyone.", "Then take the Mission concern to your board."], reasons: ["It holds personal data, and sign-in is not known to be protected.", "The supplier trains AI on personal data you hold."] },
  ],
  group: { title: "2 tools have only one admin", names: "Google Workspace, Zoom.", when: "Fix now", bold: "Add a second admin to each. If that is not possible, write down the recovery codes and keep them with the chair of the board.",
    lines: ["Zoom also has a Mission concern. It does not fit your mission. After the fix, take it to your board."] },
  tiles: { tools: 4, pers: 4, fix: 3, dec: 0, year: 0 }, zones: [0, 4, 0, 0], costLine: "No costs entered", decSub: "Mission concerns, and 2 more after a fix",
  board: { fix: 3, dec: 0, year: 0, ren: 0, also: 2, lines: ["- ChatGPT: Switch on two-step sign-in (MFA) for everyone.", "- Add a second admin to 2 tools: Google Workspace, Zoom.", "Board decisions (0):", "Also to decide, once the fix is done (2):\n- Zoom: It does not fit your mission.\n- ChatGPT: The supplier trains AI on personal data you hold."], noLines: ["- Zoom: Add", "- Google Workspace:"] },
};

S.payments = {
  title: "Stripe and PayPal: flagged as doing a similar job, a critical tool with no copy",
  org: "nonprofit", loc: "UK", home: "GB", ccy: "GBP", ml: "Mission", decLabel: "Trustee decision", tr: "trustees",
  tools: [
    { lib: "stripe", name: "Stripe", a: g({ data: "Personal", where: ELSE, depend: "Critical", copy: "No", cost: 120 }), L: "GARGN", act: "Review this year", zone: "out", map: "United States", owner: "Office manager",
      step: ["Keep your own copy of the data, and test that you can restore it."], reasons: ["Personal data stored outside the UK, EU or EEA. Understand and document it.", "No tested copy of your own, and you depend on it."], noReasons: ["export"] },
    { lib: "paypal", name: "PayPal", a: g({ data: "Personal", where: ELSE, exp: "Partial", value: "Amber", cost: 120 }), L: "GAAAN", act: "Keep", zone: "out", map: "United States", owner: null },
  ],
  tiles: { tools: 2, pers: 2, fix: 0, dec: 0, year: 1 }, zones: [0, 2, 0, 0], costLine: "£240 a year listed",
  dups: ["Donations, payments and tickets: Stripe, PayPal. Together: £240 a year. (Offering donors a choice of how to pay is fine.)"],
  board: { fix: 0, dec: 0, year: 1, ren: 0, also: 0, lines: ["Listed licence costs: £240 a year."] },
};

S.unanswered = {
  title: "Unanswered tools: counted in Tools and the zones, not scored, not on the map",
  org: "nonprofit", loc: "UK", home: "GB", ccy: "GBP", ml: "Mission", decLabel: "Trustee decision", tr: "trustees",
  tools: [
    { lib: "asana", name: "Asana", a: {}, L: "-----", act: "", zone: "out", map: null, owner: null },
    { lib: "notion", name: "Notion", a: {}, L: "-----", act: "", zone: "out", map: null, owner: null },
    { lib: "quickbooks-online", name: "QuickBooks Online", a: {}, L: "-----", act: "", zone: "unk", map: null, owner: null },
    { lib: "canva", name: "Canva", a: g({ data: "None", where: ELSE, based: ELSE }), L: "GGGGN", act: "Keep", zone: "out", map: "United States", owner: null },
  ],
  tiles: { tools: 4, pers: 0, fix: 0, dec: 0, year: 0 }, zones: [0, 3, 1, 0], nothing: true, noOwners: true,
  board: { fix: 0, dec: 0, year: 0, ren: 0, also: 0, lines: ["We use 4 tools. 0 are critical and 0 hold personal or sensitive data."] },
};

S.personalSensitive = {
  title: "Personal against sensitive data: the geography cap and a US supplier",
  org: "nonprofit", loc: "UK", home: "GB", ccy: "GBP", ml: "Mission", decLabel: "Trustee decision", tr: "trustees",
  tools: [
    { custom: { name: "Casework system", job: "Casework", k: "Software" }, name: "Casework system", a: g({ data: "Sensitive", based: ELSE, loc: "DE", hq: "US" }), L: "GAGGN", act: "Keep", zone: "in", map: "Germany", owner: null, law: "Casework system: United States",
      why2: ["Sensitive data with a supplier based outside the UK, EU or EEA. Understand and document it."] },
    { custom: { name: "Mailing list tool", job: "Mailing list", k: "Software" }, name: "Mailing list tool", a: g({ data: "Personal", based: ELSE, loc: "DE", hq: "US" }), L: "GGGGN", act: "Keep", zone: "in", map: "Germany", owner: null, law: "Mailing list tool: United States",
      noWhy2: ["Personal data stored outside"] },
    { custom: { name: "Volunteer app", job: "Volunteer rota", k: "Software" }, name: "Volunteer app", a: g({ data: "Personal", where: ELSE, loc: "US", terms: "No" }), L: "GAGGN", act: "Keep", zone: "out", map: "United States", owner: null,
      why2: ["No data protection terms recorded.", "Personal data stored outside the UK, EU or EEA. Understand and document it."] },
    { custom: { name: "Safeguarding log", job: "Safeguarding records", k: "Software" }, name: "Safeguarding log", a: g({ owner: "Safeguarding lead", data: "Sensitive", signin: "No", loc: "GB" }), L: "RGGGN", act: "Fix now", zone: "in", map: "United Kingdom", owner: "Safeguarding lead",
      step: ["Switch on two-step sign-in (MFA) for everyone."], reasons: ["It holds sensitive data, and sign-in is not protected."] },
  ],
  tiles: { tools: 4, pers: 4, fix: 1, dec: 0, year: 0 }, zones: [3, 1, 0, 0],
  board: { fix: 1, dec: 0, year: 0, ren: 0, also: 0, lines: ["- Safeguarding log: Switch on two-step sign-in (MFA) for everyone."] },
};

S.devices = {
  title: "Devices: Windows 10, Macs, and staff's own laptops with no owner",
  org: "nonprofit", loc: "UK", home: "GB", ccy: "GBP", ml: "Mission", decLabel: "Trustee decision", tr: "trustees",
  tools: [
    { lib: "win10", kind: "device", name: "Laptops on Windows 10", a: d({ depend: "Critical", data: "Sensitive", upd: "No", signin: "No", copy: "No", value: "Red" }), L: "RGRRN", act: "Fix now", zone: "dev", map: "Your office and devices", owner: "Office manager",
      step: ["Upgrade, encrypt or replace these devices."], reasons: ["The devices are not encrypted, or no longer get security updates.", "No tested copy of your own, and you depend on it."] },
    { lib: "mac", kind: "device", name: "Macs", a: d({ data: "Personal" }), L: "GGGGN", act: "Keep", zone: "dev", map: "Your office and devices", owner: null },
    { lib: "byod", kind: "device", name: "Staff's own laptops or phones", a: d({ owner: "", account: "Personal", data: "Personal", enc: DK, upd: "Yes", signin: DK, copy: DK, value: "Amber" }), L: "RRRAN", act: "Fix now", zone: "dev", map: "Your office and devices", owner: NOBODY,
      step: ["Check encryption (BitLocker or FileVault) and updates on each device. Name an owner. Agree rules for using personal devices for work, or provide work devices."],
      reasons: ["You are not sure the devices are encrypted and still get security updates.", "Nobody owns it.", "They are staff's own devices."], noReasons: ["someone's personal account"] },
  ],
  tiles: { tools: 3, pers: 3, fix: 2, dec: 0, year: 0 }, zones: [0, 0, 0, 3],
  board: { fix: 2, dec: 0, year: 0, ren: 0, also: 0, lines: ["- Staff's own laptops or phones: Check encryption (BitLocker or FileVault) and updates on each device. Name an owner. Agree rules for using personal devices for work, or provide work devices."] },
};

S.cciValues = {
  title: "Cultural organisation: Values red on a platform that needs a fix, and a Board decision",
  org: "cci", loc: "UK", home: "GB", ccy: "GBP", ml: "Values", decLabel: "Board decision", tr: "board",
  tools: [
    { lib: "meta-business-suite", kind: "platform", name: "Meta Business Suite (Business Portfolio)", a: { owner: "Comms lead", account: "Organisation", admins: "Two or more", depend: "Important", data: "Personal", signin: "No", where: DK, based: ELSE, copy: "No", env: "Serious concern", value: "Green" }, L: "RAAGR", act: "Fix now", zone: "unk", map: "Not sure where", owner: ["Comms lead", "Your board"],
      ownerTask: ["Your board", "After the fix, decide on the Values concern. A serious environmental concern."],
      step: ["Switch on two-step sign-in (MFA) for everyone.", "Then take the Values concern to your board."], reasons: ["It holds personal data, and sign-in is not protected.", "The platform does not publish where it keeps data.", "A serious environmental concern."] },
    { lib: "instagram-professional", kind: "platform", name: "Instagram (professional account)", a: { owner: "Comms lead", account: "Organisation", admins: "Two or more", depend: "Important", data: "Internal", signin: "Yes", where: DK, based: ELSE, copy: "Yes", fits: "No", value: "Amber" }, L: "GAAAR", act: "Board decision", zone: "unk", map: "Not sure where", owner: "Your board",
      step: ["Take the Values concern to your board. Record who approved the trade-off, or plan a change."], reasons: ["It does not fit your values."] },
    { lib: "eventbrite", name: "Eventbrite", a: g({ data: "Personal", where: ELSE, based: ELSE }), L: "GAGGN", act: "Keep", zone: "out", map: "United States", owner: null },
    { lib: "ticket-tailor", name: "Ticket Tailor", a: g({ data: "Personal" }), L: "GGGGN", act: "Keep", zone: "in", map: "Dublin", row: "Dublin, Ireland", owner: null },
  ],
  tiles: { tools: 4, pers: 3, fix: 1, dec: 1, year: 0 }, zones: [1, 1, 2, 0], decSub: "Values concerns, and 1 more after a fix",
  board: { fix: 1, dec: 1, year: 0, ren: 0, also: 1, lines: ["Board decisions (1):\n- Instagram (professional account): It does not fit your values.", "Also to decide, once the fix is done (1):\n- Meta Business Suite (Business Portfolio): A serious environmental concern."] },
};

// The worked example: lights and actions from the parity table (register v2.1, rows 1 to 9).
S.example = {
  title: "The worked example (nine tools) matches the register table in every view",
  example: true, org: "nonprofit", ml: "Mission", decLabel: "Trustee decision", tr: "trustees",
  tools: [
    { name: "Microsoft 365 Business Basic", L: "GGRGA", act: "Review this year", zone: "in", map: "London and Cardiff", row: "London and Cardiff, United Kingdom", owner: "Office manager", a: {} },
    { name: "Mailchimp", L: "GRAAA", act: "Fix now", zone: "out", map: "United States", owner: "Comms lead", step: ["Add a second admin."], a: {} },
    { name: "Zoom Pro", L: "AGAAA", act: "Keep", zone: "out", map: "United States", owner: "Office manager", a: {} },
    { name: "Dropbox", L: "RRARN", act: "Fix now", zone: "out", map: "United States", owner: NOBODY, step: ["Switch on two-step sign-in (MFA) for everyone. Name an owner. Move the work to an organisation account."], a: {} },
    { name: "Canva", L: "GGAGN", act: "Keep", zone: "out", map: "United States", owner: null, a: {} },
    { name: "Donor CRM (UK-hosted)", L: "GGGGN", act: "Keep", zone: "in", map: "United Kingdom", owner: null, a: {} },
    { name: "Plausible Analytics", L: "GGGGN", act: "Keep", zone: "in", map: "Falkenstein", row: "Falkenstein, Germany", owner: null, a: {} },
    { name: "Laptops on Windows 10 (5)", kind: "device", L: "RGRRN", act: "Fix now", zone: "dev", map: "Your office and devices", owner: "Office manager", step: ["Upgrade, encrypt or replace these devices."], a: {} },
    { name: "ChatGPT (staff personal accounts)", L: "RRAGR", act: "Fix now", zone: "out", map: "United States", owner: [NOBODY, "Your trustees"],
      ownerTask: ["Your trustees", "After the fix, decide on the Mission concern. The supplier trains AI on personal data you hold."],
      step: ["Switch on two-step sign-in (MFA) for everyone. Name an owner. Move the work to an organisation account.", "Then take the Mission concern to your trustees."], reasons: ["The supplier trains AI on personal data you hold."], a: {} },
  ],
  tiles: { tools: 9, pers: 6, fix: 4, dec: 0, year: 1 }, zones: [3, 5, 0, 1], decSub: "Mission concerns, and 1 more after a fix",
  board: { fix: 4, dec: 0, year: 1, ren: 0, also: 1, lines: ["- Mailchimp: Add a second admin.", "Trustee decisions (0):\n- None", "Also to decide, once the fix is done (1):\n- ChatGPT (staff personal accounts): The supplier trains AI on personal data you hold.", "Listed licence costs: £2,106 a year."] },
};

for (const key of Object.keys(S)) {
  test(`scenario: ${S[key].title}`, async ({ page }) => { await run(page, S[key]); });
}

// ===================================================================
// Focused checks. The last six were BUG tests (test.fail) until the fixes of 30 September;
// they now check the fixed behaviour.
// ===================================================================

// Build a list from literals, go to step 3, return the page.
async function loadAt3(page, sc) { await load(page, sc); await step(page, 3); }

test("platform with location 'Don't know' or blank is amber; Software with 'Don't know' is red, blank is neutral", async ({ page }) => {
  const same = { owner: "Comms lead", account: "Organisation", admins: "Two or more", depend: "Important", data: "Internal", signin: "Yes", where: DK, based: ELSE, terms: "", exp: "Yes", copy: "Yes", value: "Green" };
  const blank = Object.assign({}, same, { where: "" });
  await loadAt3(page, { org: "nonprofit", loc: "UK", home: "GB", ccy: "GBP", tools: [
    { lib: "facebook-page", a: same },
    { custom: { name: "Supporter forum", job: "Forum", k: "Software" }, a: same },
    { lib: "x-twitter", a: blank },
    { custom: { name: "Rota app", job: "Rota", k: "Software" }, a: blank },
  ] });
  const s3 = await readStep3(page);
  const reg = s3.reg;
  // Facebook Page: platform, Don't know: amber. Forum: Software, Don't know: red.
  // X: platform, blank: counts like Don't know, amber (change 2). Rota app: Software, blank: neutral, green.
  soft(reg.map((r) => r.minis[1])).toEqual(["Control: Amber", "Control: Red", "Control: Amber", "Control: Green"]);
  soft(reg.map((r) => r.act)).toEqual(["Keep", "Keep", "Keep", "Keep"]); // internal data, not critical, at most one red
  await step(page, 2);
  soft((await readStep2(page, 2)).why, "X with a blank location").toContain("The platform does not publish where it keeps data.");
  soft((await readStep2(page, 3)).why, "Software with a blank location").toEqual([]);
});

test("Mission red on a Review-this-year tool also sends it to the trustees", async ({ page }) => {
  await loadAt3(page, { org: "nonprofit", loc: "UK", home: "GB", ccy: "GBP", tools: [
    // Personal data, no export and no copy: Exit red, so Review this year would apply... but Mission red (not approved) comes first: Trustee decision.
    { lib: "typeform", a: g({ data: "Personal", where: ELSE, based: EUR, exp: "No", copy: "No", rights: "Serious concern" }) },
  ] });
  const s3 = await readStep3(page);
  soft(s3.items.map((x) => x.when)).toEqual(["Decide"]);
  soft(s3.reg[0].act).toBe("Trustee decision");
  soft(s3.board).toContain("Trustee decisions (1):\n- Typeform: A serious human rights concern.");
  soft(s3.board).not.toContain("Also to decide");
});

test("removed from the library: HMRC online services, e-Boks, Digital Post, Online banking", async ({ page }) => {
  await fresh(page);
  soft(await page.evaluate(() => ["hmrc-online", "e-boks", "digital-post", "online-banking"].map((id) => !!BYID[id]))).toEqual([false, false, false, false]);
});

test("admins answers read Two or more, One person, Not sure (non-sole); changing 'where' to Not sure clears the country", async ({ page }) => {
  await load(page, { org: "nonprofit", loc: "UK", home: "GB", ccy: "GBP", tools: [
    { custom: { name: "Files box", job: "Storage", k: "Software" }, a: g({ loc: "DE" }) },
  ] });
  await step(page, 2);
  const key = await page.evaluate(() => state.tools[0].key);
  soft(await page.locator(`input[name="admins-${key}"] + span`).allTextContents()).toEqual(["Two or more", "One person", "Not sure"]);
  soft(await page.locator(`#loc-${key}`).inputValue()).toBe("DE");
  await page.locator(`label[for="where-${key}-2"]`).click(); // "Not sure"
  await expect.poll(() => page.evaluate(() => state.tools[0].where)).toBe(DK);
  soft(await page.evaluate(() => state.tools[0].loc), "country cleared").toBe("");
  soft(await page.locator(`#loc-${key}`).inputValue()).toBe("");
});

// Fixed (was BUG): an approved Mission red is not a decision. No "Also to decide" and no
// "Then take the Mission concern" for a tool whose trade-off is approved.
test("an approved Mission red is not sent to the trustees again (board summary and What to do)", async ({ page }) => {
  await loadAt3(page, S.ukApproved);
  const s3 = await readStep3(page);
  const m365 = s3.items.find((x) => x.title === "Microsoft 365");
  soft(m365 && m365.bold, "Microsoft 365 next step").not.toContain("Then take the Mission concern");
  soft(s3.board, "board summary").not.toContain("Also to decide");
  soft(s3.tiles[3] && s3.tiles[3].sub, "decision tile").toBe("Mission concerns");
  soft(s3.owners.map((o) => o.head), "no trustees group").not.toContain("Your trustees");
});

// Fixed (was BUG): Jotform's library "where" is now Elsewhere (US by default), so Control,
// the step 3 summary and the map agree.
test("Jotform: pre-filled as Elsewhere, and the summary, Control and map agree", async ({ page }) => {
  const a = Object.assign({}, GOOD, { data: "Personal" }); delete a.where; delete a.based;
  await loadAt3(page, { org: "nonprofit", loc: "UK", home: "GB", ccy: "GBP", tools: [{ lib: "jotform", a }] });
  const s3 = await readStep3(page);
  soft(await page.evaluate(() => state.tools[0].where), "pre-filled where").toBe(ELSE);
  await step(page, 4);
  const s4 = await readStep4(page);
  soft(s4.pins.map((p) => p.title), "map").toEqual(["United States: Jotform"]);
  soft(s4.pins[0] && s4.pins[0].cls, "outside pin").toContain("m-out");
  soft(s3.summary, "summary agrees with the map").toBe("0 in the UK, EU or EEA, 1 outside, 0 not sure, and 0 on your devices.");
  soft(s3.reg[0].minis[1], "Control for personal data stored in the US").toBe("Control: Amber");
});

// Fixed (was BUG): Liechtenstein has a name, is offered, and sits on the Austria point.
test("data kept in Liechtenstein: named, offered in the list, and pinned inside Europe on the Austria point", async ({ page }) => {
  await load(page, { org: "nonprofit", loc: "EU", home: "DK", ccy: "EUR", tools: [
    { custom: { name: "Liechtenstein archive", job: "Archive", k: "Software" }, a: g({ data: "Personal", loc: "LI" }) },
    { custom: { name: "Vienna backup", job: "Backups", k: "Software" }, a: g({ data: "Internal", loc: "AT" }) },
  ] });
  await step(page, 2);
  soft(await page.locator('select[id^="loc-"]').first().locator('option[value="LI"]').count(), "Liechtenstein offered").toBe(1);
  await step(page, 3);
  soft((await readStep3(page)).summary).toBe("2 in the UK, EU or EEA, 0 outside, 0 not sure, and 0 on your devices.");
  await step(page, 4);
  const s4 = await readStep4(page);
  soft(s4.pins.map((p) => p.title).sort(), "pin titles").toEqual(["Austria: Vienna backup", "Liechtenstein: Liechtenstein archive"]);
  soft(s4.table.map((r) => r.place).sort(), "table rows").toEqual(["Austria", "Liechtenstein"]);
  const li = s4.pins.find((p) => p.title.startsWith("Liechtenstein")), at = s4.pins.find((p) => p.title.startsWith("Austria"));
  soft(li && li.cls, "not an outside pin").not.toContain("m-out");
  soft(li && li.cx, "on the Europe map, not in the outside-Europe box").toBeGreaterThan(-10);
  soft(li && li.cx, "on the Austria point").toBe(at && at.cx);
});

// Fixed (was BUG): an app on our computers never shows a personal-account reason. Reproduced
// through the real form: Account "Personal" answered, then the kind changed to an app.
test("an app on our computers with a left-over 'Personal' account shows no personal-account reason", async ({ page }) => {
  await load(page, { org: "nonprofit", loc: "UK", home: "GB", ccy: "GBP", tools: [
    { custom: { name: "Photo archive", job: "Photos", k: "Software" }, a: { owner: "Office manager", account: "Personal", admins: "Two or more", depend: "Important", data: "Personal", signin: "Not offered", copy: "No", value: "Green" } },
  ] });
  await step(page, 2);
  await page.locator('label.opt:has-text("App on our computers")').click();
  await expect.poll(() => page.evaluate(() => state.tools[0].kind)).toBe("App on our computers");
  const s2 = await readStep2(page, 0);
  soft(s2.lights[1], "Control").toBe("Control Green");
  soft(s2.why, "reasons").toEqual(["No tested copy of your own."]);
  await step(page, 3);
  const it = (await readStep3(page)).items.find((x) => x.title === "Photo archive");
  soft(it && it.when).toBe("This year");
  soft(it && it.muted, "What to do reasons").toBe("No tested copy of your own.");
  soft(it && it.bold).toBe("Copy the files somewhere else, and check you can open the copy.");
});

// Fixed (was BUG): a pending Mission concern on a Fix-now tool is also on the trustees' list.
test("the trustees' owner list includes a Mission concern on a tool that needs a fix (example ChatGPT)", async ({ page }) => {
  await load(page, S.example);
  const s3 = await readStep3(page);
  const trustees = s3.owners.find((o) => o.head === "Your trustees");
  soft(trustees && trustees.items.map((x) => x.text), "Your trustees").toEqual(["ChatGPT (staff personal accounts): After the fix, decide on the Mission concern. The supplier trains AI on personal data you hold."]);
  soft(s3.owners[s3.owners.length - 1].head, "trustees come last").toBe("Your trustees");
});

// Fixed (was BUG): the reason follows the organisation's word, Values or Mission.
test("'It does not fit your values.' for a cultural organisation, 'mission' for a charity", async ({ page }) => {
  await loadAt3(page, S.cciValues);
  let s3 = await readStep3(page);
  const it = s3.items.find((x) => x.title === "Instagram (professional account)");
  soft(it && it.muted).toContain("It does not fit your values.");
  soft(s3.board).toContain("- Instagram (professional account): It does not fit your values.");
  await loadAt3(page, S.ukTrustee);
  s3 = await readStep3(page);
  soft(s3.board).toContain("- Mailchimp: It does not fit your mission.");
});
