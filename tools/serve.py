#!/usr/bin/env python3
"""Local server for development: http://127.0.0.1:8080 (npm run serve).

Like `python3 -m http.server`, but tells the browser not to cache anything.
Without this, Chrome can reuse an old app.js alongside a new tools.js after a
change, and the page stops before it draws anything.
"""
import functools
import http.server
import sys
from pathlib import Path


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    root = Path(__file__).resolve().parent.parent
    handler = functools.partial(NoCache, directory=str(root))
    with http.server.ThreadingHTTPServer(("127.0.0.1", port), handler) as httpd:
        print(f"Serving {root} at http://127.0.0.1:{port}/ (no caching)")
        httpd.serve_forever()
