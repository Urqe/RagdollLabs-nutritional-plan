"""Inline the src/*.js modules into src/app.html and write index.html."""
from pathlib import Path
src = Path(__file__).parent / "src"
page = (src / "app.html").read_text(encoding="utf-8")
page = page.replace("/*DATA*/", (src / "data.js").read_text(encoding="utf-8"))
page = page.replace("/*PRICES*/", (src / "prices.js").read_text(encoding="utf-8"))
page = page.replace("/*PRICING*/", (src / "pricing.js").read_text(encoding="utf-8"))
page = page.replace("/*ENGINE*/", (src / "engine.js").read_text(encoding="utf-8"))
(Path(__file__).parent / "index.html").write_text(page, encoding="utf-8")
print("Wrote index.html")
