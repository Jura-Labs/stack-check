# Security and privacy

Stack Check runs entirely in your browser. There is no account and no
server-side code. Your answers are kept in your browser's local storage
and are never sent anywhere. You can check this yourself: open your
browser's developer tools, go to the Network tab, fill in the tool, and
watch what is requested.

## How the claim is tested

`tests/network.spec.js` runs on every change. It types a marker into every
field, chooses an option in every question, and fails if the marker appears
in any request or in the page address, or if the page contacts any host
other than its own files and `analytics.juralabs.org`.

## What does reach a server

- **The page itself**, from GitHub Pages, as for any website.
- **A visit count**: Umami, hosted by Jura Labs in the EU, records that the
  page was visited, with the page address (never its query or hash), the
  page title, the referring site, screen size and browser language. It sets
  no cookies, counts only on check.juralabs.org, and respects Do Not Track.
  It never records what you enter, and the tool never puts your answers in
  the page address. There are no custom analytics events. The no-egress test
  runs the real Umami script and checks what it sends.
- **Saved files and CSV downloads** are made in your browser and saved where
  you choose. They are not uploaded. An opened file is read as data only:
  it is never run, and only plain text and numbers are taken from it.

## Known limits

- GitHub Pages cannot send HTTP security headers, so the Content Security
  Policy is set in a `<meta>` tag. That cannot stop another site from
  showing this page in a frame (`frame-ancestors`), and there is no
  `Permissions-Policy`. Serving the files from our own server would close
  this gap.
- Answers stay in the browser until you clear them. On a shared or office
  computer, use "Clear everything" when you finish.
- The tool facts are a snapshot, dated in the tool. Check your own account.

## Reporting a problem

Please report security or privacy problems privately through the contact
page at https://juralabs.org/contact, or through GitHub's private
vulnerability reporting on this repository. We aim to reply within five
working days.
