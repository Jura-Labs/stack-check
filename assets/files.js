/* files.js: save to a file, open a saved file, download the register as CSV.
   Everything happens in the browser. Files are made with a Blob and a download
   link, and opened with FileReader: nothing is uploaded anywhere. An opened file
   is never executed or inserted as HTML; it is parsed as JSON and every value
   is copied only if it is a short string, a number, true/false or empty. */
"use strict";

var FILE_APP = "stack-check";
var FILE_MAX_BYTES = 2 * 1024 * 1024;
var FILE_MAX_TEXT = 2000;
var FILE_MAX_TOOLS = 500;

function stamp() {
  var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; };
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

function downloadFile(name, mime, text) {
  var blob = new Blob([text], { type: mime });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url; a.download = name; a.hidden = true;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

// A spreadsheet treats a cell starting with = + - @ as a formula, and may
// ignore spaces in front of it (a tab or a return in a field reaches here as
// a space).
// A tool name typed by a colleague, or opened from someone else's file, must
// never run as one (CSV injection). Prefix such cells with an apostrophe.
// The CSV download and "Copy register for a spreadsheet" both use this.
function formulaSafe(v) {
  var s = v == null ? "" : String(v);
  return /^\s*[=+\-@]/.test(s) ? "'" + s : s;
}

// Copied text has no quoting, so it needs more care than the CSV: a tab
// would start a new column, a leading double quote can be unwrapped on
// paste, and a spreadsheet may trim spaces in front of a formula.
function tsvCell(v) {
  var s = (v == null ? "" : String(v)).replace(/[\t\n\r]/g, " ");
  return /^\s*["=+\-@]/.test(s) ? "'" + s : s;
}

function csvCell(v) {
  return '"' + formulaSafe(v).replace(/"/g, '""') + '"';
}

function csvText(rows) {
  // UTF-8 with a byte-order mark so Excel reads £, € and ø correctly.
  return "﻿" + rows.map(function (r) { return r.map(csvCell).join(","); }).join("\r\n") + "\r\n";
}

function downloadCsv() {
  downloadFile("stack-check-register-" + stamp() + ".csv", "text/csv;charset=utf-8", csvText(registerRows()));
}

function saveToFile() {
  var data = { app: FILE_APP, saved: new Date().toISOString(), state: state };
  downloadFile("stack-check-" + stamp() + ".json", "application/json", JSON.stringify(data, null, 1));
}

// Copies only plain values. Anything else in the file is dropped.
function plain(v) {
  if (v === null) return null;
  if (typeof v === "string") return v.length > FILE_MAX_TEXT ? v.slice(0, FILE_MAX_TEXT) : v;
  if (typeof v === "number") return isFinite(v) ? v : "";
  if (typeof v === "boolean") return v;
  return undefined;
}
function plainObject(o) {
  var out = {};
  if (!o || typeof o !== "object" || Array.isArray(o)) return out;
  Object.keys(o).forEach(function (k) {
    if (k === "__proto__" || k === "constructor" || k === "prototype") return;
    var v = plain(o[k]);
    if (v !== undefined) out[k] = v;
  });
  return out;
}
function oneOf(v, list, fallback) {
  return list.indexOf(v) >= 0 ? v : fallback;
}

// A tool's key is written into the page as an id and attribute, so only letters, digits and
// hyphens are kept. Anything else (a crafted file could hold HTML) gets a fresh key. Used for
// opened files and for answers loaded from this browser (live privacy check, 30 Sep 2026).
var KEY_OK = /^[a-z0-9][a-z0-9-]{0,63}$/;
function cleanKeys(tools) {
  var seen = {};
  (tools || []).forEach(function (t, i) {
    if (typeof t.key !== "string" || !KEY_OK.test(t.key) || seen[t.key]) t.key = "tool-" + i + "-" + Math.random().toString(36).slice(2, 7);
    seen[t.key] = 1;
  });
  return tools;
}

// Returns a clean state, or throws an Error with a message for the user.
function stateFromFile(text) {
  var data;
  try { data = JSON.parse(text); } catch (e) { throw new Error("This is not a Stack Check file. It could not be read."); }
  if (!data || data.app !== FILE_APP || !data.state || typeof data.state !== "object") {
    throw new Error("This is not a Stack Check file.");
  }
  var s = data.state;
  if (s.v !== 5 && s.v !== 6) throw new Error("This file was saved by a different version of Stack Check, and cannot be opened here.");
  if (!Array.isArray(s.tools)) throw new Error("This file has no tools in it.");
  if (s.tools.length > FILE_MAX_TOOLS) throw new Error("This file has more tools than Stack Check can open.");
  var tools = s.tools.map(plainObject).filter(function (t) { return typeof t.name === "string" && t.name; });
  cleanKeys(tools);
  tools.forEach(function (t) { if (s.v === 5 && t.where === "UK or EU") t.where = EU; });
  var journeys = (Array.isArray(s.journeys) ? s.journeys : []).slice(0, 50).map(function (j) {
    var o = plainObject(j);
    o.stops = (j && Array.isArray(j.stops) ? j.stops : []).slice(0, 50).map(plainObject);
    return o;
  });
  migrateDevices(tools);
  return {
    v: 6,
    showLaw: s.showLaw !== false,
    org: oneOf(s.org, ORGS_ALL.map(function (o) { return o[0]; }), "nonprofit"),
    loc: oneOf(s.loc, LOCS.map(function (l) { return l[0]; }), "UK"),
    home: typeof s.home === "string" && /^[A-Z]{2,5}$/.test(s.home) ? s.home : "GB",
    ccy: oneOf(s.ccy, Object.keys(CCY), "GBP"),
    mode: "own",
    step: 3, cur: 0, jcur: 0,
    tools: tools,
    journeys: journeys
  };
}

// Wires an <input type="file"> so choosing a file replaces the current answers.
function bindOpenFile(input, status) {
  if (!input) return;
  input.addEventListener("change", function () {
    var f = input.files && input.files[0];
    if (!f) return;
    if (f.size > FILE_MAX_BYTES) { status.textContent = "This file is too large to be a Stack Check file."; input.value = ""; return; }
    var r = new FileReader();
    r.onload = function () {
      try {
        state = stateFromFile(String(r.result));
        render();
        var h = document.querySelector("#view h2");
        var msg = document.getElementById("fileStatus");
        if (msg) msg.textContent = "Opened " + f.name + ": " + state.tools.length + " tools.";
        if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
      } catch (e) {
        status.textContent = e.message;
      }
      input.value = "";
    };
    r.onerror = function () { status.textContent = "The file could not be read."; input.value = ""; };
    r.readAsText(f);
  });
}
