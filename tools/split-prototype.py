#!/usr/bin/env python3
"""Split the single-file Stack Check prototype (Claude artifact, version 18)
into the repository layout in Drive doc 24 v0.3.

Behaviour-preserving: the one IIFE becomes classic scripts that share the
page's global scope, loaded in the same order the code ran. Inline style
attributes become classes, so the Content Security Policy can forbid inline
styles. Run once; kept so the split can be checked and repeated.

    python3 tools/split-prototype.py prototype/stack-check-artifact-v18.html
"""
import re
import sys
from pathlib import Path

src = Path(sys.argv[1]).read_text(encoding="utf-8").split("\n")
L = lambda a, b: "\n".join(src[a - 1:b])  # 1-based, inclusive

HEADER = "/* {name}: {what}\n   Split from the prototype (artifact version 18, 29 September 2026) by tools/split-prototype.py. */\n\"use strict\";\n"

css = L(4, 219)
body = L(221, 260)
parts = {
    "tools.js": ("Answer options and the tool library, with sources", L(266, 295) + "\n" + L(299, 300)),
    "map.js": ("Offline basemaps, Natural Earth via world-atlas (public domain)", L(296, 298)),
    "example.js": ("The worked example: the same fictional charity as the guide and the register", L(301, 332)),
    "scoring.js": ("Five lights and the suggested action. The register spreadsheet v2.1 is the reference; each rule names its column", L(333, 376)),
    "app.js": ("Screens and interaction", L(377, 1134)),
}

# Inline style attributes -> generated classes.
styles = {}
def cls_for(decl):
    if decl not in styles:
        styles[decl] = "s%d" % (len(styles) + 1)
    return styles[decl]

tag = re.compile(r'<(\w+)([^<>]*?)\sstyle="([^"]*)"([^<>]*)>')
count = 0
def fix(m):
    global count
    count += 1
    name, pre, decl, post = m.groups()
    c = cls_for(decl.strip().rstrip(";"))
    attrs = pre + post
    if 'class="' in attrs:
        attrs = attrs.replace('class="', 'class="' + c + ' ', 1)
    else:
        attrs = ' class="' + c + '"' + attrs
    return "<" + name + attrs + ">"

body = tag.sub(fix, body)
for k, (what, code) in parts.items():
    parts[k] = (what, tag.sub(fix, code))

left = sum(len(re.findall(r'style="', t)) for _, t in parts.values()) + body.count('style="')
if left:
    sys.exit("%d inline style attributes not converted" % left)

css += "\n\n/* Generated from the prototype's inline style attributes (tools/split-prototype.py). */\n"
css += "\n".join(".%s{%s}" % (c, d) for d, c in styles.items()) + "\n"

out = Path(".")
(out / "assets/styles.css").write_text(css.strip() + "\n", encoding="utf-8")
for k, (what, code) in parts.items():
    (out / "assets" / k).write_text(HEADER.format(name=k, what=what) + code.strip() + "\n", encoding="utf-8")
(out / "prototype/body.html").write_text(body + "\n", encoding="utf-8")
print("converted %d inline styles into %d classes" % (count, len(styles)))
