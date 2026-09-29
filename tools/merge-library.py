#!/usr/bin/env python3
"""Validate researched library entries and merge them into assets/tools.js.

Each input file is JSON: {"Group name": [entry, ...], ...}, in the shape of the
existing LIB entries (see skills/stack-check-library in the Jura Labs brain).
Nothing is merged unless every entry passes. New groups are placed before
"Laptops and phones". Existing ids are never overwritten.

    python3 tools/merge-library.py batch-a.json batch-b.json ...
"""
import json
import re
import sys
from pathlib import Path

TOOLS = Path("assets/tools.js")
APP = Path("assets/app.js")

KEYS = ["id", "name", "job", "k", "w", "b", "x", "o", "loc", "locs", "hq", "co", "par", "parc",
        "store", "res", "plans", "mfa", "ai", "aid", "np", "note", "conf", "src"]
ALLOWED = {
    "k": {"Software", "AI tool", "Devices", "Other"},
    "w": {"UK, EU or EEA", "Elsewhere", "Don't know"},
    "b": {"UK or Europe", "Elsewhere"},
    "x": {"Yes", "Partial", "No", "Don't know"},
    "res": {"yes-default", "yes-some-plans", "yes-on-request", "no", "unclear"},
    "mfa": {"all plans", "some plans", "unclear", "no"},
    "ai": {"no", "yes", "not-applicable", "unclear", "depends-on-plan"},
    "conf": {"high", "medium", "low"},
}
NEW_GROUP_ORDER = ["Staff, payroll and HR", "Social media and advertising"]


def place_codes():
    s = APP.read_text()
    m = re.search(r"var PLACE=(\{.*?\})", s, re.S)
    codes = set(re.findall(r"([A-Z_]{2,8}):", m.group(1)))
    return codes | {"OTHER", "EU", "UNKNOWN"}


def check(e, codes, errors, where):
    for k in KEYS:
        if k not in e:
            errors.append(f"{where}: missing {k}")
    for k in e:
        if k not in KEYS:
            errors.append(f"{where}: unexpected key {k}")
    for k, allowed in ALLOWED.items():
        if k in e and e[k] is not None and e[k] not in allowed:
            errors.append(f"{where}: {k}={e[k]!r} not one of {sorted(allowed)}")
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", str(e.get("id", ""))):
        errors.append(f"{where}: bad id {e.get('id')!r}")
    if not isinstance(e.get("o"), bool):
        errors.append(f"{where}: o must be true or false")
    for k in ("loc", "hq", "parc"):
        v = e.get(k)
        if v not in (None, "") and v not in codes:
            errors.append(f"{where}: {k}={v!r} is not a place code")
    for v in e.get("locs") or []:
        if not re.fullmatch(r"[A-Z]{2}|EU", str(v)):
            errors.append(f"{where}: locs has {v!r}, not a two-letter country code")
    src = e.get("src") or []
    if not src:
        errors.append(f"{where}: no sources")
    for pair in src:
        if not (isinstance(pair, list) and len(pair) == 2 and str(pair[1]).startswith("https://")):
            errors.append(f"{where}: bad source {pair!r}")
    for k in ("name", "job", "note", "store"):
        if not str(e.get(k) or "").strip():
            errors.append(f"{where}: empty {k}")
        if re.search(r"<\s*[a-zA-Z/!]", str(e.get(k) or "")):
            errors.append(f"{where}: markup in {k}")


def main(paths):
    s = TOOLS.read_text()
    m = re.search(r"^var LIB=(\[.*\]);$", s, re.M)
    lib = json.loads(m.group(1))
    have = {t["id"] for g in lib for t in g["items"]} | {"online-banking", "win10", "win11", "mac", "byod"}
    codes = place_codes()
    errors, added = [], []
    incoming = []
    for p in paths:
        for group, entries in json.loads(Path(p).read_text()).items():
            for i, e in enumerate(entries):
                where = f"{Path(p).name} {group} #{i + 1} {e.get('id')}"
                check(e, codes, errors, where)
                if e.get("id") in have:
                    errors.append(f"{where}: id already in the library")
                have.add(e.get("id"))
                incoming.append((group, {k: e[k] for k in KEYS if k in e}))
    if errors:
        print("NOT MERGED:\n  " + "\n  ".join(errors))
        sys.exit(1)
    groups = {g["g"]: g for g in lib}
    for group, e in incoming:
        if group not in groups:
            groups[group] = {"g": group, "items": []}
            lib.append(groups[group])
        groups[group]["items"].append(e)
        added.append(f"{group}: {e['name']} ({e['conf']})")
    known = [g for g in lib if g["g"] not in NEW_GROUP_ORDER]
    lib = known + [groups[g] for g in NEW_GROUP_ORDER if g in groups]
    s = s[:m.start(1)] + json.dumps(lib, ensure_ascii=False, separators=(",", ":")) + s[m.end(1):]
    TOOLS.write_text(s)
    print(f"merged {len(added)} tools:\n  " + "\n  ".join(added))


if __name__ == "__main__":
    main(sys.argv[1:])
