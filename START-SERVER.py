#!/usr/bin/env python3
"""
START-SERVER.py
Run this from inside the portfolio/ folder to serve the site locally.

Usage:
  python START-SERVER.py

Then open:  http://localhost:8080
"""
import http.server
import socketserver
import webbrowser
import os

PORT = 8080
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"  {self.address_string()} → {args[0]}")

print("=" * 50)
print("  🚀  XR Portfolio — Local Server")
print("=" * 50)
print(f"  Serving from: {os.getcwd()}")
print(f"  URL:          http://localhost:{PORT}")
print(f"  Stop:         Ctrl + C")
print("=" * 50)

webbrowser.open(f"http://localhost:{PORT}")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
