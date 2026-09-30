"use strict";
// Shared helpers for the browser tests.

// Collects page errors, console errors and Content Security Policy violations.
function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("console: " + m.text());
  });
  return errors;
}

const fs = require("node:fs");
const path = require("node:path");
const UMAMI = fs.readFileSync(path.join(__dirname, "fixtures", "umami-script.js"), "utf8");

// Tests never contact the real analytics server. The real Umami script (a
// saved copy) is served in its place, and whatever it sends is captured in
// page.analyticsSent for the network test to inspect.
async function stubAnalytics(page) {
  page.analyticsSent = [];
  await page.route("https://analytics.juralabs.org/**", (route) => {
    const req = route.request();
    if (req.url().endsWith("/script.js")) return route.fulfill({ contentType: "application/javascript", body: UMAMI });
    page.analyticsSent.push({ url: req.url(), body: req.postData() || "" });
    return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
}

// A fresh visit: nothing saved from an earlier test.
async function fresh(page) {
  if (!page.analyticsSent) await stubAnalytics(page);
  await page.addInitScript(() => {
    try { if (!sessionStorage.getItem("sc-test-init")) { localStorage.clear(); sessionStorage.setItem("sc-test-init", "1"); } } catch (e) {}
  });
  await page.goto("/index.html");
  await page.waitForFunction(() => typeof render === "function" && !!document.querySelector("#view").children.length);
}

async function step(page, n) {
  await page.click(`#nav${n}`);
  await page.waitForFunction((n) => state.step === n, n);
}

module.exports = { watchErrors, fresh, step, stubAnalytics };
