#!/usr/bin/env python3
"""Dev-gallery server: plain http.server, but / serves dev-gallery.html.

Lets .claude/launch.json open the gallery in one step (launch config
"dev gallery"), since a launch URL can only be the server origin.
"""
import os
import sys
import http.server

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8002
# Serve the repo this script lives in, regardless of the launch directory —
# so `python3 ~/Work/OSKIMOO_sub-timer/gallery-server.py` works from anywhere.
ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        if self.path == '/' or self.path.startswith('/?'):
            self.path = '/dev-gallery.html' + self.path[1:]
        super().do_GET()


if __name__ == '__main__':
    http.server.ThreadingHTTPServer(('', PORT), Handler).serve_forever()
