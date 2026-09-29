// Writes research/tool-facts.csv and research/tool-sources.csv from the tool
// library in assets/tools.js, so anyone can check a pre-filled fact against its
// source without reading the code. Run after any library change:
//   node tools/export-research.js
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ctx = vm.createContext({ state: { org: "nonprofit" } });
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "assets", "tools.js"), "utf8"), ctx);
const LIB = vm.runInContext("LIB", ctx);
const CHECKED = "2026-09-29"; // Drive doc 24a decision 16

// Quote every field; neutralise leading formula characters for spreadsheets.
const cell = (v) => {
  let s = v == null ? "" : Array.isArray(v) ? v.join(" ") : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
};
const csv = (rows) => rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";

const FACTS = [
  ["id", "id"], ["name", "name"], ["group", "group"], ["job", "job"], ["kind", "k"],
  ["data_kept", "w"], ["supplier_based", "b"], ["supplier_hq", "hq"], ["contracting_entity", "co"],
  ["parent", "par"], ["storage", "store"], ["residency_option", "res"], ["plans", "plans"],
  ["export", "x"], ["open_source", "o"], ["mfa", "mfa"], ["ai_training", "ai"], ["ai_detail", "aid"],
  ["nonprofit_offer", "np"], ["note", "note"], ["confidence", "conf"],
];
const facts = [FACTS.map((f) => f[0]).concat(["sources", "checked"])];
const sources = [["id", "name", "source_title", "source_url", "checked"]];
for (const g of LIB) for (const t of g.items) {
  const src = t.src || [];
  facts.push(FACTS.map(([, k]) => (k === "group" ? g.g : k === "o" ? (t.o ? "yes" : t.o === false ? "no" : "") : t[k])).concat([src.length, src.length ? CHECKED : ""]));
  for (const [title, url] of src) sources.push([t.id, t.name, title, url, CHECKED]);
}
fs.writeFileSync(path.join(__dirname, "..", "research", "tool-facts.csv"), "﻿" + csv(facts));
fs.writeFileSync(path.join(__dirname, "..", "research", "tool-sources.csv"), "﻿" + csv(sources));
console.log(`${facts.length - 1} tools, ${sources.length - 1} sources`);
