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

// A fresh visit: nothing saved from an earlier test.
async function fresh(page) {
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

module.exports = { watchErrors, fresh, step };
