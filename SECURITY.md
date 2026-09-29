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
- **A visit count**, once analytics is switched on: Umami, hosted by Jura
  Labs in the EU, records that the page was visited. It never records what
  you enter, and the tool never puts your answers in the page address. There
  are no custom analytics events.

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
