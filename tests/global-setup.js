"use strict";
// The Umami script is not kept in this repository. Before the browser tests
// run, it is fetched once from the Jura Labs analytics server, the same file
// the live page loads, and kept in tests/.cache/ (ignored by git).
//
// This is a plain GET of a static file. It is not counted as a visit, and
// the tests never send anything to the analytics server: see stubAnalytics
// in helpers.js.
const fs = require("node:fs");
const path = require("node:path");

const URL = "https://analytics.juralabs.org/script.js";
const FILE = path.join(__dirname, ".cache", "umami-script.js");

module.exports = async function () {
  let text = "", why = "";
  try {
    const res = await fetch(URL, { signal: AbortSignal.timeout(15000) });
    if (res.ok) text = await res.text();
    else why = "HTTP " + res.status;
  } catch (e) {
    why = e.message;
  }
  if (text.includes("/api/send")) {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, text);
    return;
  }
  if (!why) why = "the response does not look like the Umami script";
  // Working offline: an earlier copy on this computer will do. CI has none.
  if (fs.existsSync(FILE) && !process.env.CI) {
    console.warn("Could not fetch " + URL + " (" + why + "). Using the copy from an earlier run.");
    return;
  }
  throw new Error("Could not fetch " + URL + " (" + why + "). The browser tests need it to check what the page sends.");
};
