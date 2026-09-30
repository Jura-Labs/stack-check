# Register v2.2 proposal: questions that do not apply

Status: **items 1, 2 and 5 decided by Paul on 30 September 2026 and done**
(decision `2026-09-30-register-v2.2-kinds` in the brain): register v2.2 in
`downloads/`, `scoring.js`, tests, and the guide v1.1 draft. Item 3 was
dropped and item 4 waits for the user tests (Paul, 30 September 2026). Prepared 30 September 2026.

## Why

A review on 30 September walked the tool as a small UK charity's operations
lead and a trustee on a phone, for social media, HMRC, online banking,
payment services, desktop apps and Mailchimp (for comparison), and ran the
real scoring for each. It was a simulation, not user evidence; the findings
are hypotheses for the doc 24 user tests.

Mailchimp worked as designed: every reason was true and actionable. The
others fell short in the same few ways:

- Questions written for software you buy (data protection terms, restore
  test, export, "organisation or personal account") do not fit public
  bodies, banks, social platforms or apps with no account.
- Truthful answers then give red lights that cannot be fixed, and the
  trustee sees a crisis that is not real ("Fix now 11" of 14 tools in the
  test run, about 4 of them from questions that did not fit).

The register has no "does not apply" answer anywhere. Its only escapes are
"Not offered" (sign-in), "Not relevant" (AI) and a blank cell, which is
neutral for Where and Account but counts against you for Export and Terms.

## Already done in the tool (no scoring change, parity kept)

- A supplier fact of "Don't know" is no longer pre-filled as the person's
  answer for Where or Export. Blank is neutral, as in the register. This
  removes the red Control light that appeared, before the question was
  seen, on 10 of the 14 tools tested.
- Desktop apps with no account (KeePassXC, GIMP, Inkscape, Affinity):
  Where pre-filled as UK, EU or EEA and Export as Yes (the files are on your
  own computers); counted as "on your devices" in Your data; no supplier
  law line on the map; Account, Admins and Backup hints written for files
  on a computer.
- No "Copy an email to ask the supplier" for HMRC, Digital Post, the social
  platforms or desktop apps; a line says what to check instead.
- Backup hint for money and government services asks about downloading
  your own records, not restoring.
- "Cost per year: licence, fees or charges".
- Data hint: "Public posts only count as Internal."
- A Mission concern on a tool that also needs a fix is shown on Decide and
  in the trustee summary ("Also to decide, once the fix is done").
- Duplicates: "Offering donors a choice of how to pay is fine."

## Proposed for register v2.2 (needs a decision)

Each changes a register formula, so it needs: a 24a decision, the change in
both .ods and .xlsx, the guide's Step 2 and 3 text, new branch cases in
`tests/scoring.test.js`, and a LibreOffice recalculation run (parity skill).

### 1. A new kind: "App on our computers" (recommended)

Column I (Kind) gains a value. Like Devices, it skips questions that do not
apply:

- Not asked: Account, Where, Based, Terms, Export.
- Admins becomes "Could someone else open the files if this person left?".
- Control: Red only for no owner, or only one person can open the files.
  No terms requirement.
- Exit: own copy of the files, tested, as for Devices.
- Formulas: D (Control), E (Exit), B (Action), and the I validation.

### 2. A new kind: "Account on a platform" (recommended)

For social media pages, ad accounts and similar, where the platform decides
how data is used and publishes no location.

- Where "Don't know" caps Control at Amber, not Red, with the reason "The
  platform does not publish where it keeps data". Keep Red for a service
  where you simply have not looked.
- Terms not required for Green.
- Account reworded: "Is the page owned by the organisation (for example in
  a Business Portfolio), with at least two people holding full control?"
- Next step: "Keep as little personal data there as you can" instead of
  "Send the supplier the data questions".
- Keep the admin and two-step sign-in rules exactly as they are. They gave
  the most valuable findings in the review.
- Formulas: D (Control), B (Action), I validation.

### 3. Terms answer for independent controllers (dropped, Paul, 30 Sep)

HMRC, banks, PayPal, JustGiving, and largely Meta and LinkedIn, decide how
they use the data themselves, so "Data protection terms in place?" and the
pause box ("You need a written contract with the supplier") are the wrong
test. Proposal: a third answer, "They decide how they use it (they are a
controller)", which satisfies Control, and pause-box text that depends on
it. This is a data protection claim: check with claims.md and a data
protection adviser before any wording ships. Formula: D (Control).

### 4. Admins answer: "Several people share one login" (waits for the user tests)

Instagram and some payment accounts are run on one shared password. Today
that is recorded as "Two or more" and the risk disappears. Proposal: a
fourth answer scored like "One person", with the reason "Everyone uses one
shared password." Formulas: D (Control), B (Action), L validation.

### 5. Register bug (fix in any case)

The "Where data is kept" dropdown in both .xlsx and .ods is split at the
comma: it offers "UK" and "EU or EEA" as separate options, so the tool's
CSV value "UK, EU or EEA" fails the spreadsheet's validation. Scoring is
not affected. Fix the list in both files.

### Not recommended: a per-question "Not applicable" answer

It would let anyone escape a red light on any tool. A kind is declared once
and can be checked; "Not applicable" can be picked question by question.

## Library items for Paul's review

- KeePassXC: `mfa` is "all plans", but it is a master password with an
  optional key file or hardware key, not two-step sign-in.
- New entries, all checked 30 September 2026: Adobe Creative Cloud
  (medium), Adobe Express (low), Figma (medium), Affinity (medium), GIMP
  (medium), Inkscape (medium), X (medium, re-check after its new terms on
  9 October 2026), Bluesky (medium). Adobe and X help pages could not be
  opened by the researchers; several facts come from search excerpts of
  the suppliers' own pages.
- GIMP and Inkscape: supplier home recorded as US (their fiscal sponsors).
  Consider leaving it blank.

## Suggested order

1. Decide 1, 2 and 5 together as register v2.2.
2. Take 3 to a data protection adviser; decide separately.
3. Decide 4 after the user tests show whether shared logins come up.
