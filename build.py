"""Build the app.

Writes two files from src/:
- index.html     full HTML document for GitHub Pages (doctype, viewport, charset)
- artifact.html  fragment for the Claude-hosted page, which adds its own document wrapper

The meal plan is generated here with Node and embedded, so the page does no rotation work
when it opens.
"""
import subprocess
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"

plan = subprocess.run(
    ["node", "-e", "const E=require('./src/engine.js'); process.stdout.write(E.exportTable(E.MAX_DAYS + 1));"],
    cwd=ROOT, check=True, capture_output=True, text=True).stdout

body = (SRC / "app.html").read_text(encoding="utf-8")
body = body.replace("/*DATA*/", (SRC / "data.js").read_text(encoding="utf-8"))
body = body.replace("/*PRICES*/", (SRC / "prices.js").read_text(encoding="utf-8"))
body = body.replace("/*PRICING*/", (SRC / "pricing.js").read_text(encoding="utf-8"))
body = body.replace("/*PLAN*/", 'var PLAN_TABLE = "' + plan + '";')
body = body.replace("/*ENGINE*/", (SRC / "engine.js").read_text(encoding="utf-8"))

(ROOT / "artifact.html").write_text(body, encoding="utf-8")

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#161b35" media="(prefers-color-scheme: dark)">
<style>
:root { padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }
body { margin: 0; font: 14px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-text-size-adjust: 100%; }
img { max-width: 100%; }
[hidden] { display: none !important; }
</style>
"""
# The fragment starts with <title>, meta and <style>; they belong in the head.
split = body.index("</style>") + len("</style>")
page = HEAD + body[:split] + "\n</head>\n<body>\n" + body[split:] + "\n</body>\n</html>\n"
(ROOT / "index.html").write_text(page, encoding="utf-8")
print(f"Wrote index.html ({len(page) // 1024} KB) and artifact.html; plan table {len(plan) // 1024} KB")
