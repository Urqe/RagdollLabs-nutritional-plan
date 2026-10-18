"""Browser test for the calendar: zoom levels, touch gestures, taps, keyboard and links.

Needs Playwright with Chromium (pip install playwright && playwright install chromium).
Usage: python3 tools/test-ui.py   (run python3 build.py first)
Loads the real GitHub Pages file (index.html). Touches are sent through Chrome's
input protocol, so the browser's own scrolling and touch-action rules apply, like
on a real phone. Frame timing is checked at normal CPU speed and slowed 2x.
"""
import asyncio
import sys
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
FAILS = []


def url(hash_=""):
    return INDEX.as_uri() + hash_


async def open_page(page, hash_=""):
    await page.goto(url(hash_))
    await page.wait_for_timeout(250)


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
    await open_page(page)
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

    if phone:
        # The tap above opened the day sheet. Swiping inside it must not scroll the page,
        # and pulling it down closes it.
        open_ = await page.eval_on_selector("#panel", "e=>e.classList.contains('open')")
        check(f"{name}: tapping a day opens the sheet", open_)
        y0 = await page.evaluate("window.scrollY")
        await swipe(page, cdp, w / 2, h * 0.85, 0, -300)
        await swipe(page, cdp, w / 2, h * 0.5, 0, 250)
        await page.wait_for_timeout(100)
        await page.eval_on_selector("#panel", "e=>e.scrollTo(0,0)")
        y1 = await page.evaluate("window.scrollY")
        check(f"{name}: swiping in the sheet leaves the page behind still", abs(y1 - y0) < 2, f"{y0} -> {y1}")
        top = await page.eval_on_selector("#panel", "e=>e.getBoundingClientRect().top")
        await swipe(page, cdp, w / 2, top + 60, 0, 100, steps=24)  # about 0.25 px/ms: slow
        await page.wait_for_timeout(200)
        still = await page.eval_on_selector("#panel", "e=>e.classList.contains('open')")
        check(f"{name}: a short slow pull springs the sheet back", still)
        top = await page.eval_on_selector("#panel", "e=>e.getBoundingClientRect().top")
        await swipe(page, cdp, w / 2, top + 60, 0, 380, steps=10)
        await page.wait_for_timeout(400)
        closed = not await page.eval_on_selector("#panel", "e=>e.classList.contains('open')")
        y2 = await page.evaluate("window.scrollY")
        check(f"{name}: swiping the sheet down closes it", closed)
        check(f"{name}: closing the sheet leaves the page behind still", abs(y2 - y0) < 2, f"{y0} -> {y2}")

    sw = await page.evaluate("document.documentElement.scrollWidth")
    check(f"{name}: no horizontal page scroll", sw <= w, str(sw))
    check(f"{name}: no script errors", not errors, "; ".join(errors[:2]))
    await ctx.close()


async def desktop_suite(browser):
    page = await browser.new_page(viewport={"width": 1400, "height": 900})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    await open_page(page)
    await page.keyboard.press("+")
    await page.wait_for_timeout(450)
    check("desktop: + key opens the month", (await level(page)).startswith("#m"))
    await page.keyboard.press("ArrowRight")
    await page.wait_for_timeout(450)
    m1 = await level(page)
    await page.keyboard.press("-")
    await page.wait_for_timeout(450)
    check("desktop: arrow moves month, - goes back to year", m1.startswith("#m") and await level(page) == "#year")
    x, y = await page.eval_on_selector(".month.now", "e=>{const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]}")
    await page.mouse.move(x, y)
    await page.keyboard.down("Control")
    await page.mouse.wheel(0, -120)
    await page.keyboard.up("Control")
    await page.wait_for_timeout(500)
    check("desktop: Ctrl + scroll zooms in", (await level(page)).startswith("#m"))
    await page.click("#zin")
    await page.wait_for_timeout(450)
    await page.click('#months [data-recipe="l"]')
    await page.wait_for_timeout(450)
    back = await page.inner_text("#panel .back")
    check("desktop: recipe opened from day level goes back to the week", back.startswith("‹ Week"), back)
    # Theme switch: automatic -> light -> dark -> automatic, remembered after reload.
    seen = []
    for _ in range(3):
        await page.click("#theme")
        await page.wait_for_timeout(80)
        seen.append(await page.evaluate("document.documentElement.getAttribute('data-theme')"))
    check("desktop: theme switch cycles light, dark, automatic", seen == ["light", "dark", None], str(seen))
    await page.click("#theme")
    await page.reload()
    await page.wait_for_timeout(300)
    check("desktop: chosen theme is remembered", await page.evaluate("document.documentElement.getAttribute('data-theme')") == "light")
    await page.click("#theme"); await page.click("#theme")  # back to automatic for later tests
    # Week shopping list: three trips whose totals add up to the checkout total.
    await page.evaluate("location.hash = '#year'")
    await page.wait_for_timeout(300)
    await page.click("#months [data-wk]")
    await page.wait_for_timeout(300)
    shop = await page.evaluate("""() => {
      const num = s => parseFloat(s.replace(/[^0-9,.]/g, '').replace(',', '.'));
      const trips = [...document.querySelectorAll('#panel details.trip')];
      const sums = trips.map(d => num(d.querySelector('.t-sum').textContent.split('≈')[1]));
      const total = num(document.querySelector('#panel .shop .costline b').textContent);
      return { n: trips.length, open: trips.filter(d => d.open).length, sums, total,
               copies: document.querySelectorAll('#panel [data-copy]').length };
    }""")
    check("desktop: week shopping list has three trips, one open", shop["n"] == 3 and shop["open"] == 1 and shop["copies"] == 3, str(shop))
    check("desktop: trip totals add up to the checkout total", abs(sum(shop["sums"]) - shop["total"]) <= 0.05, str(shop))
    check("desktop: no script errors", not errors, "; ".join(errors[:2]))
    await page.close()


async def link_suite(browser):
    # Invalid or out-of-range links fall back to today's month or day at the same level.
    for h, want in [("#d2026-02-31", "today"), ("#m2026-13", "today"), ("#d2199-01-01", "today"), ("#d2026-10-18", "#d2026-10-18"), ("#m2026-11", "#m2026-11")]:
        page = await browser.new_page(viewport={"width": 1300, "height": 900})
        t0 = asyncio.get_event_loop().time()
        await page.goto(url(h))
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


def build_suite():
    html = INDEX.read_text(encoding="utf-8")
    check("build: Pages file is a full document with a viewport", html.lstrip().lower().startswith("<!doctype html>") and 'name="viewport"' in html)
    frag = (ROOT / "artifact.html").read_text(encoding="utf-8")
    check("build: Claude page file is a fragment", "<!doctype" not in frag.lower() and "<html" not in frag.lower())


async def perf_suite(browser, rate, limit):
    """Frame timing during pinch, zoom, swipe and zoom out. rate 1 is this machine's
    normal speed (about a recent iPhone's single core); rate 2 stands in for an older iPhone."""
    ctx = await browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True, device_scale_factor=3)
    page = await ctx.new_page()
    cdp = await ctx.new_cdp_session(page)
    await cdp.send("Emulation.setCPUThrottlingRate", {"rate": rate})
    await page.goto(url())
    await page.wait_for_timeout(400)
    if rate == 1:
        ms = await page.evaluate("(() => { const a = performance.getEntriesByName('app-start')[0], b = performance.getEntriesByName('app-ready')[0]; return a && b ? b.startTime - a.startTime : 9999; })()")
        check("perf: app start-up script under 300 ms", ms < 300, f"{ms:.0f} ms")
    await page.evaluate("""() => { window.__gaps = []; let last = performance.now();
      const tick = t => { window.__gaps.push(t - last); last = t; window.__raf = requestAnimationFrame(tick); }; window.__raf = requestAnimationFrame(tick); }""")
    x, y = await centre(page, ".month.now")
    await pinch(page, cdp, x, y, 1.7, steps=16)
    await swipe(page, cdp, 300, 500, -250, steps=16)
    await pinch(page, cdp, 195, 420, 0.55, steps=16)
    gaps = await page.evaluate("cancelAnimationFrame(window.__raf), window.__gaps.slice(2)")
    gaps.sort()
    worst = gaps[-1] if gaps else 0
    p95 = gaps[int(len(gaps) * 0.95)] if gaps else 0
    # The 95th-percentile frame is the stable measure of smoothness; the single worst frame
    # mostly reflects background load on the test machine, so it gets a looser cap.
    check(f"perf: CPU x{rate}, 95 % of frames within {limit} ms, none over {limit * 3 + 1} ms",
          p95 <= limit and worst <= limit * 3 + 1, f"p95 {p95:.0f} ms, worst {worst:.0f} ms over {len(gaps)} frames")
    await ctx.close()


async def main():
    build_suite()
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for name, w, h in [("phone", 390, 844), ("tablet", 820, 1180)]:
            await touch_suite(browser, name, w, h)
        await desktop_suite(browser)
        await link_suite(browser)
        await perf_suite(browser, 1, 17)
        await perf_suite(browser, 2, 34)
        await browser.close()
    print(f"\n{len(FAILS)} failed" if FAILS else "\nAll passed")
    sys.exit(1 if FAILS else 0)


asyncio.run(main())
