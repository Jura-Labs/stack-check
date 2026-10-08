# Stack Check

**Stay in command of your technology.** List every tool your organisation
uses, see where your data goes, and get a recommendation on what to do.

Stack Check is the online version of the free
[Stay in command register](https://juralabs.org/updates/stay-in-command-of-your-technology)
from Jura Labs. It is written for small charities, non-profits, cultural
organisations and sole traders in the UK, Europe and beyond, most of whom
have no IT department.

> **Status: live** at https://check.juralabs.org since 30 September 2026.
> User testing with small organisations follows the launch.

## Your answers stay in your browser

No account. Your answers stay in this browser and are never sent anywhere.
There is no server-side code. You can check this yourself in your
browser's developer tools (Network tab), and `tests/network.spec.js`
checks it on every change. See [SECURITY.md](SECURITY.md) for exactly
what does reach a server (the page itself, and a visit count) and the
known limits.

## How it works

Four steps:

1. **List your tools.** Tick them from a library of about 100 common tools,
   or add your own.
2. **Answer the questions.** The essentials first, one tool at a time. Facts
   about each supplier are filled in from the supplier's own pages, and you
   can edit them.
3. **Decide.** Five lights for each tool (Safety, Control, Exit, Value, and
   Mission or Values) and a suggested action: Fix now, Trustee or board
   decision, Review this year, Review at renewal, or Keep.
4. **Your data.** See on a map where each tool keeps your data.

The scoring is the same as the register spreadsheet, rule for rule. The
spreadsheet is the reference, and `tests/scoring.test.js` checks the tool
against its worked example.

## Running it

It is plain HTML, CSS and JavaScript, with no build step and nothing to
install to use it.

- **Online:** https://check.juralabs.org
- **On your own computer:** download a release zip and open `index.html`.
- **On your own server:** copy the files. Any static web host works.

## Developing

```sh
npm ci
npx playwright install chromium
npm test          # scoring, HTML, and browser tests (steps, no-egress, accessibility)
npm run serve     # http://localhost:8080
```

| Path | What it is |
|---|---|
| `index.html` | The page, with its Content Security Policy |
| `assets/tools.js` | Answer options and the tool library, with sources |
| `assets/map.js` | Offline maps (Natural Earth, public domain) |
| `assets/example.js` | The worked example: a fictional 12-person charity |
| `assets/scoring.js` | The five lights and the suggested action |
| `assets/app.js` | Screens and interaction |
| `downloads/` | The register spreadsheet v2.2 (.ods and .xlsx) |
| `research/` | Every library fact and its source, as CSV (`node tools/export-research.js`) |
| `tests/` | Scoring parity, browser, no-egress and accessibility tests |
| `prototype/` | The original single-file prototype, kept as the reference |

The scripts are classic scripts, not ES modules, so the page still works
when opened from a file. No runtime dependencies: the `devDependencies` are
for testing only and never reach the page.

Changes go through pull requests, so the checks run. Every merge to
`main` deploys to https://check.juralabs.org.

## Licences

- **Code:** MIT, © 2026 Paul - Jura Labs ([LICENSE](LICENSE)).
- **Text, questions, scoring rules, tool facts and the register:** © 2026 Jura Labs CIC, CC BY 4.0
  ([LICENSE-CONTENT](LICENSE-CONTENT)). Suggested credit: "Based on Stack
  Check and the Stay in command register by Jura Labs (juralabs.org),
  CC BY 4.0."
- **The Jura Labs name and logo** are not covered by either licence. See
  [NOTICE](NOTICE).

This tool gives general guidance, not legal advice.
