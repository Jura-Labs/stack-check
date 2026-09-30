// Loads the browser scripts into a Node context, in page order, so the scoring
// can be tested without a browser. The scripts are classic scripts sharing one
// global scope, exactly as on the page.
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const FILES = ["tools.js", "map.js", "example.js", "scoring.js"];

function load(org = "nonprofit") {
  const ctx = vm.createContext({ state: { org } });
  for (const f of FILES) {
    const code = fs.readFileSync(path.join(__dirname, "..", "assets", f), "utf8");
    vm.runInContext(code, ctx, { filename: f });
  }
  return ctx;
}

module.exports = { load };
