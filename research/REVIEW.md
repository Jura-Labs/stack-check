# Library review before launch

The 27 tools added on 29 September 2026 (see CHANGELOG) were researched by
agents from suppliers' own pages. Several supplier pages blocked the
agents or returned only summaries, so some facts rest on search summaries
of first-party pages rather than a full read. Drive doc 24a: Paul reviews
the research before launch, low and medium confidence first. Tick each
item when a person has checked it in a browser.

Facts per tool are in `tool-facts.csv`; every link is in `tool-sources.csv`.

## Low confidence: check these first

- [ ] **HMRC online services.** gov.uk says nothing on data location,
  export or AI, so they are "Don't know". Is "Other" the right kind for a
  government service?
- [ ] **Zettle by PayPal.** The privacy policy names transfers to the US and
  Australia but not where data is stored; two-step sign-in page did not
  load. Now branded PayPal Point of Sale.
- [ ] **Sage Payroll.** Sage's trust, privacy and DPA pages blocked the
  agent (403): data location is "Don't know" and the contracting entity is
  blank. Assumed cloud Sage Payroll, not Sage 50 Payroll on a computer.
- [ ] **Google Ads (and Ad Grants).** Contracting entity (Google Ireland
  Limited for UK advertisers?) from a search summary; the ads data
  processing terms link was not opened; two-step sign-in unclear.
- [ ] **Betalingsservice.** The creditor rules and privacy notice PDFs could
  not be read: data location, export and exit terms need a person. Supplier
  base is set to Europe (the Danish entity), though Mastercard (US) is the
  parent. Which do you want?

## Medium confidence: questions the researchers raised

**UK and payroll**
- [ ] FreeAgent: its security page says Ireland, its Trust Centre says the
  UK. Recorded as UK or EU with a note to check.
- [ ] SumUp: "for our European business we store personal data within the
  EEA". Does that cover UK accounts?
- [ ] BrightPay: hosting "EU/Ireland or UK", not which for a UK customer.
  Contracting entity (Bright SG Ltd) from a search summary.
- [ ] BrightHR: export, two-step sign-in and AI training are unstated.
- [ ] Breathe HR: "all plans" for two-step sign-in means no plan limit is
  stated, not that one is promised. The owner (ELMO, Australia) is in the
  note.

**Websites, shops and automation**
- [ ] Shopify: the DPA names no storage country; two help pages disagree on
  which plans can require two-step sign-in. Headquarters left as Other.
- [ ] Wix: US and Ireland both listed, no choice stated. The TechSoup offer
  covers 40+ countries; the UK is not confirmed.
- [ ] Calendly: its help says no EU storage on any plan; one secondary
  source says Enterprise can use Ireland. Left as "no".
- [ ] Zapier: contracting entity and headquarters left blank (the terms page
  did not load). AI training "yes" means trains unless you opt out, for
  non-Enterprise customers.

**Social media**
- [ ] Meta's help centre could not be read directly. Please open and confirm:
  - what a Page download includes (are Messenger messages in it?):
    https://www.facebook.com/business/help/466076673571942
  - the two-factor requirement for portfolios over 90 days old:
    https://www.facebook.com/business/help/280940009201586
  - a Page with nobody holding full control is deactivated:
    https://www.facebook.com/help/289207354498410
- [ ] AI training is "unclear" for Facebook, Instagram and Business Suite
  (Meta's statements cover adults' public posts, not Pages), and "yes" for
  LinkedIn (member data, a per-member setting). Agree?
- [ ] LinkedIn's generative AI page lists the UK among covered regions;
  check the wording.

**Danish**
- [ ] e-conomic: security, DPA and 2FA pages blocked the agent; hosting and
  DPA wording come from search summaries. 2FA is required through Visma
  Connect. Should two-step sign-in be "all plans"?
- [ ] Billy is now Shine Regnskab (Shine Denmark ApS); the privacy policy
  names Ageras A/S as controller, which conflicts with the terms. Prices on
  billy.dk and shine.co differ, so none are shown.
- [ ] MobilePay: no stated storage location. Box belongs to a person's
  profile, not the organisation; keep it in this entry?
- [ ] Membersite: owned by EG since 2023 (was Groupcare); no data processing
  agreement, price or export terms found; hosting said "Denmark" in one
  place and "Nordic" in another.
- [ ] e-Boks: the support article on MitID Erhverv rights would not open:
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
  no plan limit stated.
