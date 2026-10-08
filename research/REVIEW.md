# Library review before launch

The 27 tools added on 29 September 2026 (see CHANGELOG) were researched by
agents from suppliers' own pages. Several supplier pages blocked the
agents or returned only summaries, so some facts rest on search summaries
of first-party pages rather than a full read. Drive doc 24a: Paul reviews
the research before launch, low and medium confidence first. Tick each
item when a person has checked it in a browser.

Facts per tool are in `tool-facts.csv`; every link is in `tool-sources.csv`.

## Low confidence: check these first

- [x] **HMRC online services.** Removed from the library (Paul, 30 Sep).
- [x] **Zettle by PayPal.** The privacy policy names transfers to the US and
  Australia but not where data is stored; two-step sign-in page did not
  load. Now branded PayPal Point of Sale.
- [x] **Sage Payroll.** Sage's trust, privacy and DPA pages blocked the
  agent (403): data location is "Don't know" and the contracting entity is
  blank. Assumed cloud Sage Payroll, not Sage 50 Payroll on a computer.
- [x] **Google Ads (and Ad Grants).** Contracting entity (Google Ireland
  Limited for UK advertisers?) from a search summary; the ads data
  processing terms link was not opened; two-step sign-in unclear.
- [x] **Betalingsservice.** The creditor rules and privacy notice PDFs could
  not be read: data location, export and exit terms need a person. Supplier
  base is set to Europe (the Danish entity), though Mastercard (US) is the
  parent. Which do you want?

## Medium confidence: questions the researchers raised

**UK and payroll**
- [x] FreeAgent: its security page says Ireland, its Trust Centre says the
  UK. Recorded as UK or EU with a note to check.
- [ ] SumUp: "for our European business we store personal data within the
  EEA". Does that cover UK accounts?
- [x] BrightPay: hosting "EU/Ireland or UK", not which for a UK customer.
  Contracting entity (Bright SG Ltd) from a search summary.
- [x] BrightHR: export, two-step sign-in and AI training are unstated.
- [x] Breathe HR: "all plans" for two-step sign-in means no plan limit is
  stated, not that one is promised. The owner (ELMO, Australia) is in the
  note.

**Websites, shops and automation**
- [x] Shopify: the DPA names no storage country; two help pages disagree on
  which plans can require two-step sign-in. Headquarters left as Other.
- [x] Wix: US and Ireland both listed, no choice stated. The TechSoup offer
  covers 40+ countries; the UK is not confirmed.
- [ ] Calendly: its help says no EU storage on any plan; one secondary
  source says Enterprise can use Ireland. Left as "no".
- [x] Zapier: contracting entity and headquarters left blank (the terms page
  did not load). AI training "yes" means trains unless you opt out, for
  non-Enterprise customers.

**Social media**
- [x] Meta's help centre could not be read directly. Please open and confirm:
  - what a Page download includes (are Messenger messages in it?):
    https://www.facebook.com/business/help/466076673571942
  - the two-factor requirement for portfolios over 90 days old:
    https://www.facebook.com/business/help/280940009201586
  - a Page with nobody holding full control is deactivated:
    https://www.facebook.com/help/289207354498410
- [x] AI training is "unclear" for Facebook, Instagram and Business Suite
  (Meta's statements cover adults' public posts, not Pages), and "yes" for
  LinkedIn (member data, a per-member setting). Agree?
- [x] LinkedIn's generative AI page lists the UK among covered regions;
  check the wording.

**Danish**
- [x] e-conomic: security, DPA and 2FA pages blocked the agent; hosting and
  DPA wording come from search summaries. 2FA is required through Visma
  Connect. Should two-step sign-in be "all plans"?
- [x] Billy is now Shine Regnskab (Shine Denmark ApS); the privacy policy
  names Ageras A/S as controller, which conflicts with the terms. Prices on
  billy.dk and shine.co differ, so none are shown.
- [x] MobilePay: no stated storage location. Box belongs to a person's
  profile, not the organisation; keep it in this entry?
- [x] Membersite: owned by EG since 2023 (was Groupcare); no data processing
  agreement, price or export terms found; hosting said "Denmark" in one
  place and "Nordic" in another.
- [x] e-Boks: the support article on MitID Erhverv rights would not open:
  https://brugersupport.e-boks.dk/hc/en-us/articles/10247350513554
- [ ] Digital Post and e-Boks sign in with MitID, which is two-factor, but
  no supplier page says so; left "unclear". Accept, or treat MitID as
  two-step sign-in on all plans?
- [ ] Digital Post: the agency is controller and offers no data processing
  agreement. Is the note's wording legally fair?

## Conventions the researchers asked about

- A US parent with an Irish or EU contracting entity is recorded as
  supplier based "Elsewhere" (as Microsoft 365 already is). Confirm.
- No residency option stated is recorded as "unclear", not "no", unless the
  supplier says there is none.
- "All plans" for two-step sign-in is used when the supplier offers it with
  no plan limit stated. **Confirmed by Paul, 8 October 2026.**

## Added 30 September 2026

Researched by agents from suppliers' own pages; several Adobe and X help
pages blocked them, so some facts rest on search summaries of first-party
pages. **Approved to ship by Paul, 30 September 2026** (in the terminal),
on the facts as recorded; the individual facts are still to be checked in a
browser before launch, like the rows above.

- [x] Adobe Creative Cloud (medium): EU storage for EU customers; the UK is
  not named. No nonprofit discount for Creative Cloud for teams found.
- [x] Figma (medium): US storage unless Enterprise; AI content training on
  by default on Starter and Professional. Contracting entity not confirmed.
- [x] Affinity (medium): files on your devices; needs a Canva account.
  Export formats not confirmed.
- [x] GIMP and Inkscape (medium): apps on your computers; export formats
  not confirmed from the projects' own pages; no supplier home recorded.
- [ ] X (medium): X Internet Unlimited Company (Ireland); trains Grok unless
  switched off. **Re-check after the new terms start on 9 October 2026.**
- [x] Bluesky (medium): AI training "No" from Bluesky's public statement,
  not its terms (Paul's decision). Export is public records only.
- Held, not shipped: Adobe Express (low), in `held/`.

## Review of 1 October 2026 (wording and facts)

All 103 entries were reviewed. Text now says "Unknown" where a point could
not be established, without describing the research. 32 tools were
re-checked on suppliers' own pages. These rest on thinner evidence than a
full first-party read, so check them in a browser:

- [ ] Adobe Creative Cloud: export "Yes" (downloads from the desktop app,
  Libraries export, 30 days after a teams licence is cancelled). Adobe's
  help pages could only be read as search excerpts.
- [x] Wix: AI training "yes", from Wix's Generative AI Policy (user content
  listed as a data source). The Terms of Use clause itself was not read.
- [x] Tally and ForeningLet: two-step sign-in "all plans" because their
  help pages state no plan limit. ForeningLet's is for administrators.
- [x] e-conomic two-step sign-in and the FreeAgent charity discount (50%,
  on request): from search excerpts of first-party help pages.
- [x] Sage Payroll: data in Ireland, from a 2023 sub-processor list quoted
  in search results. Confidence left at low.
- [x] Betalingsservice: "processed in Denmark and may be transferred to
  other countries". Recorded as UK, EU or EEA.
- [x] Affinity: export formats from the older Affinity Designer help.
- [ ] Facebook Page and Instagram: whether messages are included in Meta's
  downloads is unknown (Meta's help pages returned only their titles).
- [x] Stripe (EU storage), Plausible and Matomo (AI training): the recorded
  fact was "no" with no statement behind it; now "unknown".


## Browser check of 8 October 2026

Six agents opened each supplier's own pages in a real browser on 8 October
2026 (issue #8). An item ticked above on that date was read on the
supplier's pages by an agent, not by a person. Corrections are in the
library and in CHANGELOG.md.

Still open, and why:

- Betalingsservice supplier base: settled by Paul, 8 October 2026. It
  stays "UK or Europe": the contract is with Mastercard Payment Services
  Denmark A/S. The parent, Mastercard, is in the US.
- SumUp: both sentences are confirmed. Whether they mean a UK account is
  kept in the EEA is a reading, so it is Paul's.
- Calendly: no Calendly page says there is no storage choice. Recorded as
  "no"; the convention above would make it "unclear".
- AI training for Facebook, Instagram, Business Suite and LinkedIn:
  settled by Paul, 8 October 2026. All four are "unclear": the suppliers'
  pages speak of members' and users' own content, not of Pages.
- Digital Post and e-Boks sign-in, and Digital Post as controller: no
  supplier page settles either question. Neither tool is in the library.
- Adobe Creative Cloud export: the value holds. Three sentences in the old
  note were not found on Adobe's pages and have been replaced.
- Facebook Page: whether a Page download includes the inbox is not stated
  by Meta. Instagram lists messages among what can be downloaded.
- X: its new terms start on 9 October 2026 (issue #9).
- Two of the three conventions above are still Paul's to confirm (supplier
  base for a US parent; "unclear" against "no" for a storage choice). The
  third, "all plans", is confirmed, so two-step sign-in for Shopify, Wix,
  Google Ads and BrightHR is now "all plans".
