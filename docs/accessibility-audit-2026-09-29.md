# Accessibility audit, 29 September 2026

Status, updated after the fixes on branch `feature/phase5` (the same evening):

| Finding | Status |
|---|---|
| S1 page scrolls sideways on step 3 (1.4.10) | Fixed. Caused by the visually hidden table labels added earlier that day, and a second cause (the new map table) found while fixing it. Test: `tests/audit.spec.js` S1 |
| S2 step 2 tool list lost its button role (4.1.2) | Fixed; test S2 |
| S3 focus lost after five actions (2.4.3) | Fixed; tests S3 |
| S4 forced colours: chosen answer and current step (1.4.1, 1.4.11) | Fixed; test S4 |
| S5 dark-theme journey map numbers (1.4.3) | Fixed; test S5 |
| S6 the map's text alternative (1.1.1) | Fixed: "The map as a table" with place, tools and whose law applies. The label no longer claims the list says the same; test S6 |
| S7 hints not linked; unnamed group (1.3.1, 3.3.2) | Fixed; test S7 |
| M2 clear-everything banner | Fixed: focus starts on "Keep my answers", Escape closes and returns focus |
| M3 no skip link | Fixed; test M3 |
| M4 control borders 1.4:1 (1.4.11) | Fixed: 3.2:1 or more in both themes; test M4 |
| M5 sticky bar at high zoom | Fixed for short screens; test M5 |
| M6 duplicate landmark names | Fixed |
| M8 empty tool name gives no message | Fixed; test M8 |
| M9 new-tab links not announced | Fixed; test M9 |
| M1 live regions, M7 summary tiles, the six minor items | Open |
| Real screen-reader pass (VoiceOver, NVDA, JAWS, iOS) | **Still owed, by a person.** See the last section below |

This was an accessibility-tree and rendering review by the a11y-auditor
agent, not a screen-reader session. It does not support a public
accessibility claim (claims.md).

---

# Stack Check accessibility audit, manual-pass approximation (W40-27)

Date: 2026-09-29. Repo: ~/stack-check, branch feature/phase5 (unchanged; `git status` clean before and after). Served with `python3 -m http.server 8090` (stopped afterwards).
Tooling: Playwright 1.63.0, Chromium 153, CDP `Accessibility.getPartialAXTree` for names and roles, `locator('body').ariaSnapshot()`. Scripts and screenshots are in this folder (kb*.js, snap*.js, reflow.js, ts.js, fc.js and others).

This is an accessibility-tree and rendering review. It is not a screen-reader session. Nothing here should be logged as "manual pass done" or used to back a `claims.md` row (see the last section).

Line references are `assets/app.js` unless a file is named.

## Summary

| Rank | Count |
|---|---|
| Critical | 0 |
| Serious | 7 |
| Moderate | 9 |
| Minor | 6 |

The main things axe cannot see:
- Focus is lost after five common actions.
- The step-2 tool list has its button role stripped.
- The results page scrolls sideways at 1366 px wide and below.
- Forced-colours mode hides the current step and the chosen answers.
- Dark-theme step numbers on the journey map are unreadable.

## Serious

**S1. Register table pushes the whole page sideways (WCAG 1.4.10 Reflow).**
- Where: `assets/styles.css:131` (`.tablewrap`) with `.vh` at `styles.css:248`. Rendered by `renderResults` at `app.js:526-531`.
- What happens: the visually hidden `<label class="vh">` elements in the decision, next-step and date cells are `position:absolute`. `.tablewrap` is not a containing block, so they escape its `overflow-x:auto` and stretch the page. There are 27 of them in the example.
- Measured `document.documentElement.scrollWidth - innerWidth` on step 3: 0 at 1536, 6 at 1366, 49 at 1280, 143 at 1093 (a 1366 laptop at 125% zoom, the stated persona), 529 at 640 (200% zoom) and 849 at 320.
- The user gets a horizontal page scrollbar and has to pan the whole results page. The skill allows horizontal scroll only inside the register table region.
- Fix: add `position:relative` to `.tablewrap`. I tested this: scrollWidth then equals 320 at a 320 px viewport.
- axe does not check reflow, so the suite passes.

**S2. Step 2 tool list has its button role overridden (4.1.2 Name, Role, Value).**
- Where: `app.js:398-399`, `<div role="list">` containing `<button role="listitem">`.
- What happens: the accessibility tree reports role `listitem`, not `button`. `aria-current="true"` sits on a listitem. Screen-reader users hear "Microsoft 365, list item" and are not told it is activatable, or which tool is current.
- Fix: use `<ul><li><button aria-current="true">` and drop the role attributes.

**S3. Focus is lost after five common actions (2.4.3 Focus Order, 3.2.2).**
- "Start your own": `app.js:776`. The button is inside `#exampleBanner`, which `render()` hides. `activeElement` stays on the now-hidden button (Chromium keeps it there). The page swaps to step 1 with no focus move and no announcement. The next Tab lands on the first radio in step 1's "Who is this for?" group.
- Step 2 "Next tool", "Previous tool" and the progress buttons: `app.js:466-468`. `render()` rebuilds `#view` and focus becomes `<body>`. `nextT` only calls `scrollTo`. The tool's h2 is not focused, and nothing announces "Tool 2 of 4". A keyboard user has to Tab from the top of the document (5 stops).
- "Remove" on a custom tool chip: `app.js:375-376`. Focus goes to `<body>`.
- "Keep my answers": `app.js:777`. The banner hides and focus stays on the hidden `#clearNo`. The skill requires focus to return to the trigger, `#clearAll`.
- "Clear and start": `app.js:778`. `state=blank(); render();` sits on a hidden button, with no `go(1)`.
- Fix:
  - Reuse the `go()` focus logic (`app.js:770`) for a `focusHeading()` helper.
  - Call it after Start your own, Clear and start, Next tool, Previous tool and the progress buttons.
  - After Remove, focus the "Tool name" input or the previous chip.
  - After Keep my answers, focus `#clearAll`.

**S4. Forced-colours mode: chosen answers and current step are indistinguishable (1.4.1 Use of Colour, 1.4.11).**
- Where: `styles.css:89` (`.opt input:checked + span`), `styles.css:53` (`nav.steps button[aria-current]`), `styles.css:81` (`.pdot[aria-current]`).
- Method: `emulateMedia({forcedColors:'active'})`, comparing computed style pairs.
- Radio answers: the checked and unchecked pills have identical colour, background, border and font weight. The native radio is `opacity:0`, so the selected answer for every question is invisible.
- Step bar: the current step and the others are identical. `box-shadow` is stripped in forced colours and the `.n` badge fill is overridden.
- Tool-progress list: the current tool is only bold.
- What still works: the pressed tool chips (the `✓` tick shows), the five lights (shape and word survive, the SVG shapes take `currentColor`), and the map (SVG colours are not forced).
- Fix:
  - Add `@media (forced-colors:active){ .opt input:checked + span{border-width:3px;forced-color-adjust:none;background:Highlight;color:HighlightText} nav.steps button[aria-current]{border-width:3px;border-bottom-width:6px} }`. Alternatively add a `✓` glyph or a border-width difference that is not colour-based.
  - Do the same for `.pdot[aria-current]`.

**S5. Journey-map step numbers are unreadable in the dark theme (1.4.3 Contrast, Minimum).**
- Where: `styles.css:183` (`.m-step text{fill:#fff}`), painted on `--good/--warn/--bad` circles, which are pale in dark mode.
- Measured: white on #8BD6A5 is 1.71:1; on #F1C466 and #F39A92 it is lower. The screenshot `dark-journeymap.png` confirms it.
- axe does not test SVG text.
- Fix: `.m-step text{fill:var(--accent-ink)}`. That gives white in light mode (6.45:1 on #236B43) and #0E1613 in dark mode.

**S6. The map has no complete text alternative (1.1.1 Non-text Content, 1.3.1).**
- Where: `svgWrap` at `app.js:234`, `overviewMap` at `app.js:235-246`, `mapLegend` at `app.js:267-271`, step 3 at `app.js:519-522`.
- What the label gives: `role="img"` with a label such as "Map of where your tools keep data: London and Cardiff 1, United States 5, United Kingdom 1, Falkenstein 1…". It ends "The same information is in the list next to the map."
- What is missing:
  - The label has counts but no tool names.
  - The per-pin `<title>` elements (tool names, `app.js:243`) are inside a `role="img"` and are therefore not exposed.
  - The list that follows (`app.js:521`) is grouped by "UK, EU or EEA / Outside / Not sure / On your devices". It has no city or site level and no "whose law applies" layer.
  - The "Show whose law applies" checkbox toggles that layer, which is a visual-only change with no text and no announcement.
- The label's claim that the list holds "the same information" is therefore not true, and the skill says the map must add nothing a screen-reader user cannot get from the list.
- Fix: add a visually adjacent list or table with the columns Place, Tools, Supplier's home country and "Whose law applies". Mark it as the equivalent and reference it with `aria-describedby` on the img. Show the law column only when the toggle is on.
- The journey map is better: `ol.flow` (`app.js:688-697`) already lists each stop with its place and flags. It is placed after the map and the editor.

**S7. Question hints are not programmatically linked, and some radio groups have no group name (1.3.1, 3.3.2, 4.1.2).**
- Hints: `q()` at `app.js:312-313` renders `<span class="hint">` after the radios, with no `aria-describedby`. There is no `aria-describedby` anywhere in app.js.
  - In forms or focus mode NVDA and JAWS announce "Data held, group, None, radio button 1 of 4". The definitions of None, Internal, Personal and Sensitive, the "Not offered" explanation and the "Critical" definition are never read.
  - Browse-mode readers only get them by reading on past the group.
  - That is a real loss for the safeguarding-data question.
- Group with no name: the "Who is this for?" radios (`app.js:336`, `radios("org",…)`) sit in a bare `div.opts` with no fieldset, so the group name is empty. The enclosing region name is not a radiogroup name, so each radio announces only its own label with no question. ("Where are you based?" is a proper fieldset and is fine.)
- Fix: give each hint an id and add `aria-describedby` on the fieldset. For "Who is this for?" wrap in `<fieldset><legend>` (the h2 can stay).

## Moderate

**M1. Live regions: nothing announces the events the skill lists (4.1.3 Status Messages).**
- Inventory (all `role="status" aria-live="polite"`, redundant but harmless):
  - `#fileStatus`: step 1 (`app.js:342`) and step 3 (`app.js:568`); it also receives text from `files.js`.
  - `#copied`: step 1 (`app.js:344`), step 2 (`app.js:442`, only for non-device tools), step 3 (`app.js:565`) and step 4 (`app.js:699`, only once a journey exists).
  - Steps 1 and 3 each have two, step 2 has one, step 4 has one or none.
- Not announced at all:
  - Tool count. `"N tools listed"` (`app.js:357`) is plain text, so the required "9 tools chosen" announcement is missing. Toggling a chip changes `aria-pressed` and the count silently.
  - Filter results. Typing in "Find a tool" hides chips without any count or "no matches" message (`app.js:366-367`).
  - Lights updating in step 2 (`#lightsRow`, `app.js:454`, `partial()` at `app.js:469`). The lights, the "Suggested: Fix now" text and the "why" list change under the user's hands with no announcement.
  - A new "Before you move" section appearing after a decision change (`app.js:581`).
  - A journey step being added or removed.
  - The armed "Click again to delete this journey" state (`app.js:678`; focus stays on the button, the label changes, and `state.rmArm` stays true after Tab-away).
- Other problems:
  - The `#copied` regions are re-created on every `render()`. The message text is never cleared, and repeating the same copy may not re-announce it.
  - "Copy each owner's list" (`app.js:507`) has no `#copied` nearby. The message appears in the "Take it to your trustees" section at the bottom, and on the clipboard-failure fallback `area.focus()` throws focus down there.
  - In the fallback the textarea is named "Copied text" before anything was copied.
- Fix: one polite region in `index.html` near `<main>` (for example `<div id="live" role="status">`) with a `say(msg)` helper. Use it for the chip count, saved, copied and lights updated. Debounce the lights message (about 800 ms, after the last change). Remove the per-view regions.

**M2. Destructive confirm banner (3.3.4, 4.1.2, 2.4.3).**
- Where: `index.html:52` and `app.js:589`.
- What happens: `#confirmClear` has no role. Focus goes straight to the destructive "Clear and start", so a screen reader reads only the button name and not "Clear everything and start again? This cannot be undone." Escape does nothing (tested), which the skill requires to close it. The banner is in the DOM before `<main>`, so getting back to the trigger means travelling backwards.
- Fix: `role="alertdialog"` (or `role="group"` with `aria-labelledby` pointing at the text), focus "Keep my answers" first, add an Escape handler that returns focus to `#clearAll`.

**M3. Step 1 has 100 tool buttons in the Tab order, and there is no skip link (2.4.1, 2.4.3).**
- Measured: 114 Tab presses from the top to "Next: answer the questions", with no filter typed.
- There is no skip link. The four step buttons plus radios, select, file input, copy button and search box come first (10 stops before the first chip).
- Bypass Blocks is technically met through landmarks, but the skill's manual pass expects a working skip link.
- The chips are not grouped, so `h3` group names only help heading navigation. The `.group` divs need `role="group" aria-labelledby`.
- Fix:
  - Add `<a class="skip" href="#view">Skip to the tool list</a>` (visible on focus).
  - Add `role="group" aria-labelledby` to each `.group`.
  - Add a "Skip to the Next button" anchor after the search box.

**M4. Input and control boundaries fail 3:1 (1.4.11 Non-text Contrast).**
- Where: `styles.css:75` (text, number and select inputs), `styles.css:88` (`.opt span`), `.btn`, `.chip` and `.pdot`, all using `--line`.
- Measured: `#D3DCD7` on white is 1.40:1 (1.28:1 on the page background); dark theme is 1.38:1.
- The unchecked answer pills and empty text fields have nearly invisible edges. Text buttons are identified by their text, but the text input boundary is required.
- Fix: use a border of at least 3:1, for example light `#7A8A83` (about 3.4:1 on white) and dark `#6B7F76`, for input, select and `.opt span`.

**M5. Sticky step bar takes half the screen at high zoom (1.4.4, 1.4.10, 2.4.11 spirit).**
- Measured: `nav.steps` is 125 px tall at 640×400 (200% zoom of 1280×800), which is 31% of the viewport. It is 132 px of 256 (52%) at 320×256 (400% zoom of 1280×1024).
- The 2.4.11 rule is honoured: `padForSteps` sets scroll-padding, and 0 of 25 focused elements were under the bar. But at 400% there is little room left to read.
- Fix: `@media (max-height:500px), (max-width:400px){nav.steps{position:static}}`.

**M6. Redundant and confusing landmark names (1.3.1, 2.4.6).**
- The example step 3 has 8 or more regions from `section[aria-labelledby]`.
- Two are duplicated inside another region with the same name: "Your register" (region inside region) and "Compare two tools" (`app.js:526`, `app.js:558`).
- The banner and the "Start your own" button sit outside `main` and outside any landmark.
- Fix: name the scroll wrappers differently, for example "Register table, scrollable" and "Comparison table, scrollable".

**M7. Results summary tiles have no structure (1.3.1).**
- Where: `app.js:488-494`.
- The tree reads as one text run: "Tools 9 £2,106 a year listed Critical 3 hard to work a week without …". The tiles are not a list or `dl`, and there is no heading or intro.
- Fix: render as `<dl>` (dt for the eyebrow, dd for the number and note) or `<ul>` with `aria-label="Summary"`. Put "Five lights" in the results view as well: there is no "What the five lights mean" block (grep for it finds nothing), and the lights appear only in the register table.

**M8. Empty-name error is silent (3.3.1, 3.3.3).**
- Where: `app.js:378`. Pressing Add tool with an empty "Tool name" only refocuses the field. There is no message and no `aria-invalid`.
- Fix: write "Type a name for the tool" into a linked `aria-describedby` element and set `aria-invalid="true"`.

**M9. Links that open a new tab do not say so (3.2.5 advisory, G201).**
- 5 places: `app.js:42`, `app.js:284`, `app.js:449`, `app.js:561`, and the CC licence link in `index.html:69`. There is no "opens in a new tab" text.
- Fix: append `<span class="vh"> (opens in a new tab)</span>`.

## Minor

- **m1. Long unbroken names reflow badly at 320 px (1.4.10).** A URL-like tool name of 45 characters or more gives a 380 px page on step 4 (`selects` and `.jtabs`). Add `overflow-wrap:anywhere` on `.chip`, `.pdot`, `.jtabs button` and `select` options.
- **m2. Map labels collide under text-spacing (1.4.12).** With the bookmarklet CSS applied, "Your office / UK, place not stated / London and Cardiff" overlap and "Place not stated" runs into the US pin (`labelsFor`, `app.js:220-228`, assumes 7.2 px per character). The page text does not clip, nothing else overlapped, and a text equivalent is needed anyway (see S6).
- **m3. Targets slightly under 24 px (2.5.8).** The three `<summary>` elements are 23 px high (`styles.css:94`). The "Show whose law applies" checkbox label is 213×20 px. Both pass by spacing, but add `min-height:24px`.
- **m4. `title` on lights, double-read risk (`app.js:300`, `app.js:306`).** `title="Safety: Red"` duplicates the visible word and some screen readers read it twice. Remove it.
- **m5. The `✓` in the progress buttons is announced as "check mark" (`app.js:399`).** Use `aria-hidden` on the glyph and add visually hidden "answered".
- **m6. Step 2's h2 is the tool name, not the step (`app.js:400`).** The page title carries the step ("Step 2 of 4, Answer the questions"), and the heading outline is fine otherwise. Consider a visually hidden "Step 2 of 4" prefix so the focus announcement says where the user is.

## What passed

- **Language and title:** `lang="en-GB"` is set. The title updates per step ("Step N of 4, …") and focus moves to the new step's h2 for all four step-bar buttons and for "Next: answer the questions", "See what to do", "Next: follow the data" and file open (`go()` at `app.js:770`, `files.js` open handler).
- **Focus ring:** the ring is visible on every tabbable element. That includes the visually hidden radios (through the sibling span), the file inputs (through the label) and the programmatically focused h2. Contrast is 3.88:1 on the light page background and 8.58:1 in dark.
- **Focus order and hidden elements:** no keyboard trap, no hidden element focused, and no focused field under the sticky bar (0 of 25 at 320×256). The ring is outside the pressed chip through `outline-offset`.
- **Radios and chips:** arrow keys move and select within groups, Space and Enter toggle chips, and focus is kept on the same control after chip toggles, org and location radios, decision select, dates and compare selects (the `render()` then `focus()` pattern).
- **Register table:** `role="region"`, `aria-labelledby`, `tabindex="0"`, `th scope="col"`. Arrow keys scroll it (scrollLeft 201 after two presses) and every cell control has a name.
- **Lights:** always colour plus shape plus word (Red = square, Amber = triangle, Green = circle). They survive forced colours. Light-theme contrast is 4.98 to 5.53:1 and dark 7.2 to 8.4:1.
- **Journey step list:** `ol.flow` gives an equivalent for the journey map, including flags and how data moves between stops.
- **Reflow (except S1):** steps 1, 2 and 4 have no horizontal scroll at 320 or 640. Text spacing (line-height 1.5, letter 0.12em, word 0.16em, paragraph 2em) produced no clipped text at 1280 or 360, apart from m2.
- **Motion:** the only animation is a 0.15 s border-colour transition, inside `prefers-reduced-motion:no-preference`.

## Keyboard walk-through record

Chromium, 1280×800, Tab, Shift+Tab, Enter, Space, arrows, Escape (typing was used for text fields and the search box). Roles and names are from the CDP accessibility tree.

| Step | Focus order | Result |
|---|---|---|
| Load (example) | Step buttons 1 to 4 ("1 List your tools Tick what you use" etc.), then "Start your own" | 5 stops. Rings visible. Step buttons are under the sticky bar, but the ring is visible. |
| Start your own (Enter) | activeElement is the now-hidden button | **Focus lost (S3).** The next Tab lands on the "A charity or non-profit" radio. |
| Step 1 | radio "A charity or non-profit" (no group name, S7), radio "UK" in group "Where are you based?", combobox "Currency for costs", button "Open a saved file", button "Copy the message", searchbox "Find a tool", then 100 chips | 114 Tab presses to "Next" (M3). Arrows change org and location, and focus stays on the radio after the re-render. |
| Pick three tools | Type in the search box, Tab, Space or Enter | Chips toggle, focus stays, `aria-pressed` flips. Count changes silently (M1). Filter text is not cleared. |
| Custom tool | textbox "Tool name", textbox "The job it does", button "Add tool" | Enter works and focus goes back to "Tool name". Empty name gives no message (M8). "Remove JustGiving" sends focus to `<body>` (S3). |
| Next: answer the questions | h2 "Microsoft 365" (tabindex -1, ring visible) | Title updated. Shift+Tab goes to the last tool button (listitem, S2). |
| Step 2, one tool, all questions | summary "What we found…", textbox "The job it does", radio groups Kind, Account, Admins, "How much do you depend on it?", "Data held", "Two-step sign-in on for everyone?", "Your own copy?", summary "More detail…", button "Copy an email to ask the supplier", radio group "Is it worth the money and staff time?", summary "Mission check…", radio groups AI, rights (plus a link), env, fits, textbox "Who approved the trade-off?", buttons "Back to the list", "Next tool" | 16 stops for an answered tool. Space selects, Arrow moves and selects, and focus stays through the radio changes. Lights change silently (M1). For a custom tool the "More detail" details is open by default, so Enter on its summary closes it. |
| Next tool / Previous tool / progress button | | **Focus lost to `<body>` (S3).** |
| See what to do | h2 "What to do" | Title "Step 3 of 4, Decide: Stack Check". |
| Step 3 | 53 stops on the example. Order is law checkbox, region "Your register", per row Decision, Next step and Date, compare selects, compare chips, region "Compare two tools", source links, copy and save buttons, "Change answers", "Clear everything", "Next: follow the data". | 3 date-picker sub-stops per row have no separate ring on the picker button (it is Chromium's internal control). The three region stops are nested (M6). |
| Change a decision | Type-ahead in the select ("Rep") | Focus stays on the select after the re-render. The decision card section appears with no announcement (M1). |
| Save to a file | Enter on "Save to a file" | Download `stack-check-2026-09-29.json`. Focus stays. `#fileStatus` reads "Saved. Look in your downloads folder." |
| Copy summary | Enter | In headless Chromium the clipboard fallback runs. Focus moves to textarea "Copied text" and the message says "Select all and copy the text below." |
| Clear everything | Enter | Focus goes to "Clear and start". No role. Escape does nothing (M2). "Keep my answers" leaves focus on a hidden button (S3). |
| Step 4 | h2 "Follow the data"; then the journey tabs, combobox "Add a journey", button "Add journey" | "Add journey" focuses `#addStop`. "Add step" keeps focus on the select, or moves to the new "How it gets there" select. Editor order is name, whose details, stops, Remove step N, Add step, Delete this journey, Copy this journey as text. "Delete this journey" arms silently (M1). |

## What still needs a real person with VoiceOver or NVDA

None of these can be confirmed from the accessibility tree. Do not mark any as passed.

1. **Announcement after each step change.** Does the screen reader say the new h2 and the page title? The `go()` focus move plus the title change may announce twice in some browsers.
2. **Focus loss actions.** What is said, if anything, after "Start your own", "Next tool", "Remove", "Clear and start" and "Keep my answers", with S3 unfixed and after the fix.
3. **Radio groups.** Confirm that the legend is read on entry to each group, the hints are not read in forms mode (S7), the "Who is this for?" group has no name, and the checked answer is announced.
4. **Lights in step 2 and the register.** Confirm that "Safety Red" and so on are read well, and that the polite regions announce "Saved" and "Copied" (and that a second identical copy is re-announced).
5. **Map.** Read the `role="img"` label aloud and judge whether it is useful. Confirm that the pin `<title>` text is not reachable, and that the list and journey flow give enough.
6. **Register table.** Column header reading per cell (NVDA table mode, JAWS Ctrl+Alt+arrows), the "Your register" region read twice, and use of the scroll region with the keyboard.
7. **Reading order of step 4.** The journey map section is before the editor in the DOM (`app.js:700-701`). Is that the order a user wants?
8. **Tool chip group.** Does 100 unlabelled buttons make sense to a person? Try the search box and heading navigation.
9. **Compare table and facts panel.** Reading `dl`/`dt`/`dd` and the row headers.
10. **File open dialog and download.** Native file picker (label plus visually hidden input) and Save in Safari and Firefox.
11. **iOS VoiceOver.** Rotor use, chip and radio activation, sticky bar, and selects.
12. **Real high-contrast mode.** Windows Contrast themes (not just the emulation), and 400% zoom in Firefox.
13. **Text spacing bookmarklet in Firefox and Safari.** Confirm that no text clips.
14. **Plain language and reading age.** The skill's 9 to 11 target, "two-step sign-in (MFA)" spelled out on first use, and the "about 2 minutes per tool" statement.
15. **Print stylesheet.** The skill lists it as not built. `print.css` exists, and I did not test it.
16. **Reduced motion.** Confirmed by code only.

Not done here: NVDA, JAWS, VoiceOver, 400% real browser zoom, Windows high-contrast themes. The axe suite result was taken as given.
