# Changelog

Stack Check's version follows the guide and the register it implements:
register v2.2, Stack Check 2.2.x.

## 2.2.2 (30 September 2026)

- Accessibility fixes from the live check: map labels on coloured
  countries have a halo, example text in fields is easier to read, a
  screen reader hears when changing the kind changes the questions, the
  "not answered yet" warning on Decide is announced, the theme button's
  icon is decorative, small text is a little larger, and checkboxes are
  bigger.
- Analytics: Umami counts three clicks, with fixed names only: Start your
  own, register template downloads, and links to the guide (decision
  2026-09-30-stack-check-analytics-events). Nothing you type or choose is
  sent, and which tools you use is not collected.

## 2.2.1 (30 September 2026)

- Reference card links go to the cards on the live guide page ("Step 4.
  Move"; Windows 10 has its own anchor). The separate cards page they
  pointed to does not exist.
- Security: a crafted save file could put HTML into the page through a
  tool's internal key and send the page to another site. Keys are now
  checked when a file is opened and when answers load from the browser,
  and escaped wherever they are written. Found by the live privacy check.
- The 404 page sends no referrer, like the main page.

## 2.2.0 (30 September 2026)

- Launched at https://check.juralabs.org (decision 2026-09-30-stack-check-launch).

- Register v2.2 (decision 2026-09-30): two new kinds. "App on our
  computers" (no online account, such as GIMP or KeePassXC) is not asked
  about account, data location, supplier, terms or export, and its Exit
  light follows the Devices rule. "Account on a platform" (such as a
  Facebook Page, LinkedIn Page, X or Bluesky) gets amber, not red, when the
  platform does not say where it keeps data, and needs no data protection
  terms for green. The spreadsheet and the tool change together; the
  scoring matches the spreadsheet on the worked example, 36 branch cases
  and 153 random answer sets recalculated in LibreOffice.
- The register's "Where data is kept" dropdown offers "UK, EU or EEA" as
  one option again, in Excel as well as LibreOffice.
- The register templates (.xlsx and .ods) can be downloaded from the start
  screen and the footer, to work offline.
- Script and stylesheet links carry the version, so a browser cannot mix old
  and new files after an update.

- Final walk-through fixes (30 September 2026):
  - For an account on a platform, a blank "where the data is kept" counts as
    not sure (amber), as the map shows. Register v2.2 changed to match.
  - HMRC online services, e-Boks, Digital Post and online banking are no
    longer in the library. Add them as your own tools if you use them.
  - Jotform is recorded as keeping data in the US by default.
  - A Mission or Values concern on a tool that needs a fix first is shown
    on the decision tile, in the admin card, in your trustees' or board's
    list and in the summary. An approved trade-off is not raised again.
  - Apps on your computers are never told to "add a second admin".
  - Devices: "Not sure" is no longer reported as "not encrypted"; staff's
    own devices get their own next step.
  - Sole traders get their own wording, and the summary includes the
    recovery-codes line.
  - Map: clearer place names ("UK, EU or EEA, country not stated", "Country
    not stated"), Liechtenstein inside Europe, Microsoft 365 not pinned to
    London for organisations outside the UK, and "Not sure" clears the
    country.
  - "No costs entered" instead of "£0 a year listed"; "Not sure" for Admins.
  - Phones: the step bar is one short row.
- Scenario tests (tests/scenarios.spec.js): 20 scenarios checked by hand
  against every view.

## 2.1.0 (not released; folded into 2.2.0)

- Copy review (30 September 2026): clearer wording on the start, list,
  Decide and Your data steps, and a new line under the title.
- "Follow one person" removed from Your data, which now shows where your
  data lives. Journeys in saved files are kept, so nothing is lost.
- The register table has four columns (tool, lights, suggested action,
  your decision) and fits the page; on a phone each tool is a card.
- Light and dark theme switch in the header, remembered in this browser.
- Larger Jura Labs logo, linked to juralabs.org, and a fuller footer.
- Dark theme by default. The browser icon is now the juralabs.org icon.
- Colours follow the Jura Labs brand (terracotta, cream and charcoal), in
  both themes. The green, amber and red lights are unchanged.
- Tool groups reorganised: Websites and forms; Money; Security and task
  management; and a new Design group. Calendly moved to Talking and meeting.
  FreeAgent, Dinero and Billy are found by searching, so Money shows the
  tools most charities use.
- Six design tools added to the library, researched 30 September 2026:
  Adobe Creative Cloud, Adobe Express, Figma, Affinity, GIMP and Inkscape.
- X and Bluesky added to Social media and advertising (30 September 2026).
- Fewer false red lights where questions do not fit: a supplier's "Don't
  know" is no longer pre-filled as your answer; apps on your own computers
  (KeePassXC, GIMP, Inkscape, Affinity) count as on your devices; no
  supplier email for HMRC, social platforms or desktop apps; backup and
  cost questions reworded; a Mission concern reaches trustees even when a
  fix comes first. Scoring is unchanged. See docs/register-v2.2-proposal.md.
- Reference card links go to the cards on the guide page; the separate
  cards page they pointed to does not exist.
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
- A start screen: what the check is, the four steps and how long it takes;
  Start your own, See the example, Open a saved file; and for returning
  visitors, Welcome back with progress and Carry on.
- The worked example is read-only. Changing it offers Start your own (or
  Back to your list) instead of quietly turning the example into your own,
  and looking at it never overwrites your own list.
- Decide is summary first and about half as long: the board panel comes
  before the folded Before you move and Compare two tools, and it has a
  print button at the end. The Critical tile is gone; Personal data reads
  "tools hold this data".
- Step 4 is now Your data: the map of where everything is kept, then
  Follow one person, with a way back and a print button.
- Find a tool knows other names (SharePoint, Gmail, Vipps...), keeps your
  search, and says when nothing matches. The step bar shows how many tools
  are chosen and answered. Save to a file on every step.
- After step 1 the privacy note is one line. Small businesses see "your
  team" rather than "board".
- Visits are counted with Umami (page views only, on check.juralabs.org
  only, never the page address's query or hash, Do Not Track respected).
