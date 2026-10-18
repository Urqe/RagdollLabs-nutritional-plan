"""Browser test for the calendar: zoom levels, touch gestures, taps, keyboard and links.

Needs Playwright with Chromium (pip install playwright && playwright install chromium).
Usage: python3 tools/test-ui.py   (run python3 build.py first)
Touches are sent through Chrome's input protocol, so the browser's own scrolling
and touch-action rules apply, like on a real phone.
"""
import asyncio
import sys
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
BODY = (ROOT / "index.html").read_text(encoding="utf-8")
FAILS = []


def page_html(hash_=""):
    pre = f'<script>history.replaceState(null,"","{hash_}")</script>' if hash_ else ""
    return f'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">{pre}</head><body>{BODY}</body></html>'


def check(name, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + name + (f"  ({detail})" if detail else ""))
    if not ok:
        FAILS.append(name)


async def touch(cdp, kind, pts):
    await cdp.send("Input.dispatchTouchEvent", {"type": kind, "touchPoints": [{"x": x, "y": y, "id": i} for i, (x, y) in enumerate(pts)]})


async def pinch(page, cdp, x, y, factor, steps=8):
    d0 = 40
    await touch(cdp, "touchStart", [(x - d0, y), (x + d0, y)])
    for s in range(1, steps + 1):
        d = d0 * (1 + (factor - 1) * s / steps)
        await touch(cdp, "touchMove", [(x - d, y), (x + d, y)])
        await page.wait_for_timeout(16)
    await touch(cdp, "touchEnd", [])
    await page.wait_for_timeout(450)


async def swipe(page, cdp, x, y, dx, dy=0, steps=8):
    await touch(cdp, "touchStart", [(x, y)])
    for s in range(1, steps + 1):
        await touch(cdp, "touchMove", [(x + dx * s / steps, y + dy * s / steps)])
        await page.wait_for_timeout(16)
    await touch(cdp, "touchEnd", [])
    await page.wait_for_timeout(450)


async def level(page):
    return await page.evaluate("location.hash")


async def centre(page, sel):
    await page.eval_on_selector(sel, 'e=>e.scrollIntoView({block:"center"})')
    await page.wait_for_timeout(100)
    return await page.eval_on_selector(sel, "e=>{const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]}")


async def touch_suite(browser, name, w, h):
    ctx = await browser.new_context(viewport={"width": w, "height": h}, has_touch=True, is_mobile=True)
    page = await ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    await page.set_content(page_html())
    await page.wait_for_timeout(300)
    cdp = await ctx.new_cdp_session(page)
    phone = w <= 640
    cell = ".ag" if phone else ".dc"

    x, y = await centre(page, ".month.now")
    await pinch(page, cdp, x, y, 1.1)
    check(f"{name}: small pinch does nothing", await level(page) in ("", "#year"))
    t = await page.eval_on_selector("#months", "e=>e.style.transform")
    check(f"{name}: view settles back after small pinch", t in ("", "none"), t)

    await pinch(page, cdp, x, y, 1.7)
    check(f"{name}: pinch out on month opens it", (await level(page)).startswith("#m"), await level(page))

    x, y = await centre(page, f'{cell}[data-day$=",20"]')
    await pinch(page, cdp, x, y, 1.7)
    check(f"{name}: pinch out on a day opens that day", (await level(page)).endswith("-20"), await level(page))

    before = await level(page)
    await swipe(page, cdp, w * 0.7, h * 0.6, -200)
    after = await level(page)
    check(f"{name}: swipe left moves to the next day", before != after and after.endswith("-21"), f"{before} -> {after}")

    await swipe(page, cdp, w * 0.5, h * 0.7, 0, -300)
    check(f"{name}: vertical swipe scrolls, does not change day", await level(page) == after)

    await pinch(page, cdp, w / 2, h / 2, 0.55)
    check(f"{name}: pinch in goes back to the month", (await level(page)).startswith("#m"), await level(page))

    await page.wait_for_timeout(400)
    await page.tap(f'{cell}[data-day$=",15"]')
    await page.wait_for_timeout(250)
    sel = await page.eval_on_selector(f"{cell}.sel", 'e=>e.getAttribute("data-day")')
    check(f"{name}: tap still selects a day", sel.endswith(",15"), sel)

    sw = await page.evaluate("document.documentElement.scrollWidth")
    check(f"{name}: no horizontal page scroll", sw <= w, str(sw))
    check(f"{name}: no script errors", not errors, "; ".join(errors[:2]))
    await ctx.close()


async def desktop_suite(browser):
    page = await browser.new_page(viewport={"width": 1400, "height": 900})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    await page.set_content(page_html())
    await page.wait_for_timeout(300)
    await page.keyboard.press("+")
    await page.wait_for_timeout(150)
    check("desktop: + key opens the month", (await level(page)).startswith("#m"))
    await page.keyboard.press("ArrowRight")
    await page.wait_for_timeout(150)
    m1 = await level(page)
    await page.keyboard.press("-")
    await page.wait_for_timeout(150)
    check("desktop: arrow moves month, - goes back to year", m1.startswith("#m") and await level(page) == "#year")
    x, y = await page.eval_on_selector(".month.now", "e=>{const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]}")
    await page.mouse.move(x, y)
    await page.keyboard.down("Control")
    await page.mouse.wheel(0, -120)
    await page.keyboard.up("Control")
    await page.wait_for_timeout(500)
    check("desktop: Ctrl + scroll zooms in", (await level(page)).startswith("#m"))
    await page.click("#zin")
    await page.wait_for_timeout(200)
    await page.click('#months [data-recipe="l"]')
    await page.wait_for_timeout(150)
    back = await page.inner_text("#panel .back")
    check("desktop: recipe opened from day level goes back to the week", back.startswith("‹ Week"), back)
    check("desktop: no script errors", not errors, "; ".join(errors[:2]))
    await page.close()


async def link_suite(browser):
    # Invalid or out-of-range links fall back to today's month or day at the same level.
    for h, want in [("#d2026-02-31", "today"), ("#m2026-13", "today"), ("#d2199-01-01", "today"), ("#d2026-10-18", "#d2026-10-18"), ("#m2026-11", "#m2026-11")]:
        page = await browser.new_page(viewport={"width": 1300, "height": 900})
        t0 = asyncio.get_event_loop().time()
        await page.set_content(page_html(h))
        await page.wait_for_timeout(100)
        ms = int((asyncio.get_event_loop().time() - t0) * 1000)
        crumbs = (await page.inner_text("#crumbs")).replace("\n", " ")
        if want == "today":
            today = await page.evaluate("(()=>{const n=new Date();return [n.getFullYear(),n.getMonth()+1,n.getDate()]})()")
            hv = await level(page)
            ok = hv in (f"#m{today[0]}-{today[1]}", f"#d{today[0]}-{today[1]:02d}-{today[2]:02d}") and "undefined" not in crumbs
        else:
            ok = (await level(page)) == want
        check(f"link {h} opens {want}", ok and ms < 3000, f"{crumbs}, {ms} ms")
        await page.close()


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for name, w, h in [("phone", 390, 844), ("tablet", 820, 1180)]:
            await touch_suite(browser, name, w, h)
        await desktop_suite(browser)
        await link_suite(browser)
        await browser.close()
    print(f"\n{len(FAILS)} failed" if FAILS else "\nAll passed")
    sys.exit(1 if FAILS else 0)


asyncio.run(main())
