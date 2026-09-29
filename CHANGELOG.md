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
