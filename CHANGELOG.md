# Changelog

Stack Check's version follows the guide and the register it implements:
guide 2.1, register v2.1, Stack Check 2.1.x.

## 2.1.0 (in development)

- Moved from the private prototype (Claude artifact, version 18,
  29 September 2026) into this repository, split into separate files with
  no change in behaviour.
- Privacy line reworded: "No account. Your answers stay in this browser and
  are never sent anywhere."
- Content Security Policy: the page can load only its own files and the
  visit counter at analytics.juralabs.org.
- The decision, next-step and date fields in the register table now have
  names that screen readers announce.
- Checks on every change: scoring matches the register, every step loads,
  nothing you enter is sent anywhere, and automated accessibility checks.
- Tool facts checked against suppliers' own pages on 29 September 2026. The
  sources are in `research/`.
- Save your answers to a file and open them again, on any computer. Nothing
  is uploaded: the file goes where you choose.
- Download the register as a CSV file, in the register spreadsheet's column
  order. Cells that look like spreadsheet formulas cannot run as formulas.
- Print or save as PDF, with a print layout for a board paper.
- On each step change, focus moves to the step's heading, and the browser
  tab names the step.
- The register and compare tables can be scrolled from the keyboard.
- Focused fields are kept clear of the sticky step bar.
- 27 tools added to the library, researched from suppliers' own pages on
  29 September 2026: UK money and admin (HMRC online services, FreeAgent,
  Zettle, SumUp), staff, payroll and HR (BrightPay, Sage Payroll, BrightHR,
  Breathe HR), websites and shops (Shopify, Squarespace, Wix), Calendly,
  Zapier, social media and advertising (Facebook Page, Instagram, LinkedIn
  Company Page, Meta Business Suite, Google Ads), and Danish tools
  (e-conomic, Dinero, Billy, MobilePay, Betalingsservice, ForeningLet,
  Membersite, e-Boks, Digital Post). The library now has 100 tools.
- Two accounting tools are now grouped under "Tools doing the same job"
  (the rule matched no real accounting tool before), and payroll and HR
  tools are grouped too.
- Visits are counted with Umami (page views only, on check.juralabs.org
  only, never the page address's query or hash, Do Not Track respected).
