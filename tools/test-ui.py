"""Browser test for the calendar: zoom levels, touch gestures, taps, keyboard and links.

Needs Playwright with Chromium (pip install playwright && playwright install chromium).
Usage: python3 tools/test-ui.py   (run python3 build.py first)
Loads the real GitHub Pages file (index.html). Touches are sent through Chrome's
input protocol, so the browser's own scrolling and touch-action rules apply, like
on a real phone. Frame timing is checked at normal CPU speed and slowed 2x.
"""
import asyncio
import tempfile
import pathlib
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
    await open_page(page, "#year")
    cdp = await ctx.new_cdp_session(page)
    phone = w <= 640
    cell = ".ag" if phone else ".dc"

    x, y = await centre(page, ".month.now")
    await pinch(page, cdp, x, y, 1.1)
    check(f"{name}: small pinch does nothing", await level(page) in ("", "#year"))
    t = await page.eval_on_selector("#months", "e=>e.style.transform")
    check(f"{name}: view settles back after small pinch", t in ("", "none"), t)

    # A closing pinch at year level has nowhere to go in the app: it must reach the browser
    # (Safari's tab overview), so no touch or gesture event may be cancelled.
    await page.evaluate("""() => { window.__blocked = 0; window.__moves = 0;
      document.addEventListener('touchmove', e => { window.__moves++; if (e.defaultPrevented) window.__blocked++; }); }""")
    await pinch(page, cdp, x, y, 0.6)
    blocked = await page.evaluate("[window.__blocked, window.__moves]")
    check(f"{name}: closing pinch at year level is left to the browser", blocked[0] == 0 and blocked[1] > 0 and await level(page) in ("", "#year"), f"blocked {blocked[0]} of {blocked[1]} moves")
    await page.evaluate("window.__blocked = 0; window.__moves = 0")
    await pinch(page, cdp, x, y, 1.7)
    claimed = await page.evaluate("[window.__blocked, window.__moves]")
    check(f"{name}: spreading pinch at year level is claimed by the app", claimed[0] == claimed[1] and claimed[1] > 0, str(claimed))
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
    await open_page(page, "#year")
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
    # The gestures below start from the year view.
    await page.goto(url("#year")); await page.reload(); await page.wait_for_timeout(400)
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


async def plan_suite(browser):
    """v0.9: swaps refresh prepared pages, leftover lunch in the swap list, extras toggles."""
    page = await browser.new_page(viewport={"width": 1400, "height": 900})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    await open_page(page, "#d2026-10-19")  # dinner is a double batch; the 20th has the leftovers
    await page.evaluate("localStorage.removeItem('mpd-swaps'); localStorage.removeItem('mpd-extras')")
    await open_page(page, "#d2026-10-19")
    await page.wait_for_timeout(1500)  # let the neighbour pages prepare in idle time
    lunch20 = "() => document.querySelectorAll('.dbig .dmeal h3')[1].textContent"
    num = "s => parseFloat(s.replace(/[^0-9,.]/g, '').replace(',', '.'))"

    # Extras: unticking the juice lowers the day's cost and the week's shopping, and is saved.
    # At day level on desktop the day is in the main view and the side panel shows its week.
    cost = lambda: page.evaluate("(" + num + ")(document.querySelector('.dbig .costline b').textContent)")
    week = lambda: page.evaluate("(" + num + ")(document.querySelector('#panel .shop .costline b').textContent)")
    c_on, wk_on = await cost(), await week()
    await page.click('.dbig [data-extra="juice"]'); await page.wait_for_timeout(400)
    c_off, wk_off = await cost(), await week()
    unticked = await page.evaluate("[...document.querySelectorAll('[data-extra=juice]')].every(x => !x.checked)")
    saved = await page.evaluate("JSON.parse(localStorage.getItem('mpd-extras') || '{}').juice")
    check("plan: unticking the juice lowers day cost and week shopping", c_off < c_on and wk_off < wk_on, f"day {c_on} -> {c_off}, week {wk_on} -> {wk_off}")
    check("plan: extras setting is saved on the device", unticked and saved is False, f"{unticked}, saved {saved}")
    await page.click('.dbig [data-extra="juice"]'); await page.wait_for_timeout(400)

    # Swap the double-batch dinner, then move to the next day: no stale leftovers.
    await page.click('.dbig [data-recipe="d"]'); await page.wait_for_timeout(300)
    other = await page.evaluate("[...document.querySelectorAll('#swap-sel option')].find(o => !o.selected).value")
    await page.select_option("#swap-sel", other); await page.wait_for_timeout(300)
    await page.evaluate("document.activeElement && document.activeElement.blur()")
    await page.wait_for_timeout(1200)
    await page.keyboard.press("ArrowRight"); await page.wait_for_timeout(600)
    after = await page.evaluate(lunch20)
    check("plan: after swapping the batch dinner, the next day has a normal lunch", (await level(page)) == "#d2026-10-20" and not after.startswith("Leftovers"), after)
    await page.keyboard.press("ArrowLeft"); await page.wait_for_timeout(600)
    await page.click('.dbig [data-recipe="d"]'); await page.wait_for_timeout(300)
    await page.click('#panel [data-reset]'); await page.wait_for_timeout(300)
    await page.evaluate("document.activeElement && document.activeElement.blur()")  # arrows only act on the calendar
    await page.wait_for_timeout(1200)
    await page.keyboard.press("ArrowRight"); await page.wait_for_timeout(600)
    back = await page.evaluate(lunch20)
    check("plan: back to plan brings the leftover lunch back on the next day", back.startswith("Leftovers"), back)

    # Leftover lunch: the swap list starts on the leftovers, and the first lunch can be picked.
    await page.click('.dbig [data-recipe="l"]'); await page.wait_for_timeout(300)
    sel = await page.evaluate("(() => { const s = document.querySelector('#swap-sel'); return [s.options[s.selectedIndex].text, s.selectedIndex, s.options[1].value]; })()")
    check("plan: leftover lunch is the selected entry in the swap list", sel[0].startswith("Leftovers") and sel[1] == 0, str(sel))
    await page.select_option("#swap-sel", sel[2]); await page.wait_for_timeout(300)
    picked = await page.evaluate("document.querySelector('#panel .p-title').textContent")
    swaps = await page.evaluate("localStorage.getItem('mpd-swaps')")
    check("plan: the first lunch in the list can be picked directly", not picked.startswith("Leftovers") and sel[2] in swaps, f"{picked} {swaps}")
    await page.evaluate("localStorage.removeItem('mpd-swaps'); localStorage.removeItem('mpd-extras')")
    check("plan: no script errors", not errors, "; ".join(errors[:2]))
    await page.close()


async def cook_shop_suite(browser):
    """v0.10: extras recipes, batch amounts, leftovers, shopping ticks, have-it, first trip, copy."""
    ctx = await browser.new_context(viewport={"width": 1400, "height": 900}, permissions=["clipboard-read", "clipboard-write"])
    page = await ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    await open_page(page, "#d2026-10-19")
    await page.evaluate("['mpd-swaps','mpd-extras','mpd-shop'].forEach(k => localStorage.removeItem(k))")
    await open_page(page, "#d2026-10-19")
    await page.wait_for_timeout(400)
    num = "s => parseFloat(s.replace(/[^0-9,.]/g, '').replace(',', '.'))"

    # Juice recipe opens with ingredients for two and directions.
    await page.click('.dbig [data-extra-open="juice"]'); await page.wait_for_timeout(300)
    ex = await page.evaluate("[document.querySelector('#panel .p-title').textContent, document.querySelectorAll('#panel .ing li').length, document.querySelectorAll('#panel .steps li').length]")
    check("cook: juice opens with ingredients and directions", ex[1] >= 2 and ex[2] >= 1, str(ex))

    # Double-batch dinner shows doubled amounts (chicken thighs 280 g per batch -> 560 g).
    await page.click('.dbig [data-recipe="d"]'); await page.wait_for_timeout(300)
    batch = await page.evaluate("[...document.querySelectorAll('#panel .sec h3')].map(h => h.textContent).join(' | ') + ' || ' + document.querySelector('#panel .ing li').textContent")
    check("cook: double-batch dinner lists doubled amounts", "double batch" in batch and "560 g" in batch, batch[:160])

    # Leftover lunch leads with reheating; yesterday's recipe is folded below.
    await page.keyboard.press("ArrowRight"); await page.wait_for_timeout(600)
    await page.click('.dbig [data-recipe="l"]'); await page.wait_for_timeout(300)
    first = await page.evaluate("document.querySelector('#panel .sec h3').textContent")
    folded = await page.evaluate("!!document.querySelector('#panel details.orig:not([open])')")
    check("cook: leftover lunch starts with reheat and serve", first == "Reheat and serve" and folded, first)

    # Shopping: tick, have it, first trip, copy.
    await open_page(page, "#d2026-10-19"); await page.reload(); await page.wait_for_timeout(500)
    total = lambda: page.evaluate("(" + num + ")(document.querySelector('#panel .shop .costline b').textContent)")
    t0 = await total()
    box = '#panel details.trip[open] [data-tick]'
    await page.click(box); await page.wait_for_timeout(150)
    cnt = await page.evaluate("document.querySelector('#panel details.trip[open] [data-count]').textContent")
    stored = await page.evaluate("JSON.stringify(JSON.parse(localStorage.getItem('mpd-shop'))['2026-10-19'].tick)")
    check("shop: ticking an item counts it and saves it", cnt.startswith("1 of") and stored != "{}", f"{cnt} {stored}")
    price = await page.evaluate("(" + num + ")(document.querySelector('#panel details.trip[open] li.item .buy').childNodes[2].textContent)")
    await page.click('#panel details.trip[open] [data-have]'); await page.wait_for_timeout(300)
    t1 = await total()
    home = await page.evaluate("document.querySelector('#panel details.trip[open] li.item').classList.contains('home')")
    check("shop: 'Have it' takes the item off the trip and the total", home and abs((t0 - t1) - price) < 0.02, f"{t0} -> {t1}, item {price}")
    await page.click('#panel details.trip[open] [data-copy]'); await page.wait_for_timeout(200)
    clip = await page.evaluate("navigator.clipboard.readText()")
    check("shop: copied trip has Finnish names and a check-at-home list", "CHECK AT HOME" in clip and " (" in clip.split("\n")[2] and "- Chicken breast fillets (" not in clip, clip[:200].replace("\n", " / "))
    await page.select_option('#panel [data-shop-start]', "1"); await page.wait_for_timeout(300)
    skipped = await page.evaluate("[document.querySelectorAll('#panel .trip.skipped').length, document.querySelectorAll('#panel details.trip').length]")
    t2 = await total()
    check("shop: starting on Wednesday skips trip 1", skipped == [1, 2] and t2 < t1, f"{skipped}, {t1} -> {t2}")
    await page.reload(); await page.wait_for_timeout(500)
    kept = await page.evaluate("document.querySelector('#panel [data-shop-start]').value")
    check("shop: first trip is remembered for the week", kept == "1", kept)
    await page.evaluate("['mpd-swaps','mpd-extras','mpd-shop'].forEach(k => localStorage.removeItem(k))")
    check("cook/shop: no script errors", not errors, "; ".join(errors[:2]))
    await ctx.close()


async def today_suite(browser, tmpdir):
    """v0.11: opens on today, shopping shortcut, dialog sheet, P1 first, touch targets,
    wide panel, export/import, layout changes, other tabs."""
    # Phone: opens on today; the sheet is a dialog with focus inside and an inert page behind.
    ctx = await browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    page = await ctx.new_page(); errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    await page.goto(url()); await page.evaluate("localStorage.clear()"); await page.goto(url("")); await page.reload(); await page.wait_for_timeout(400)
    today = await page.evaluate("(()=>{const n=new Date();return '#d'+n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0')})()")
    check("today: opening without a link shows today", await level(page) == today, await level(page))
    await page.tap("#shop"); await page.wait_for_timeout(500)
    st = await page.evaluate("""(() => { const p = document.getElementById('panel'); return { open: p.classList.contains('open'), role: p.getAttribute('role'),
      modal: p.getAttribute('aria-modal'), inert: document.querySelector('main').inert, focus: p.contains(document.activeElement),
      title: (p.querySelector('.p-title') || {}).textContent }; })()""")
    wk = await page.evaluate("(()=>{const n=new Date(),t=new Date(Date.UTC(n.getFullYear(),n.getMonth(),n.getDate()));const d=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-d);const y0=new Date(Date.UTC(t.getUTCFullYear(),0,1));return 'Week '+Math.ceil(((t-y0)/864e5+1)/7)})()")
    check("today: 'This week' opens this week's shopping in the sheet", st["open"] and st["title"] == wk, str(st))
    check("today: the open sheet is a modal dialog with focus inside", st["role"] == "dialog" and st["modal"] == "true" and st["inert"] and st["focus"], str(st))
    before = await level(page)
    await page.keyboard.press("ArrowRight"); await page.wait_for_timeout(300)
    check("today: arrow keys don't move the calendar while the sheet is open", await level(page) == before, await level(page))
    await page.keyboard.press("Escape"); await page.wait_for_timeout(400)
    st2 = await page.evaluate("(() => { const p = document.getElementById('panel'); return [p.classList.contains('open'), p.getAttribute('aria-hidden'), document.querySelector('main').inert, p.contains(document.activeElement)]; })()")
    check("today: Escape closes the sheet, hides it and gives the page back", st2 == [False, "true", False, False], str(st2))
    sizes = await page.evaluate("""(() => { const r = s => document.querySelector(s).getBoundingClientRect();
      const hdr = document.querySelector('.top-in');
      return { prev: [Math.round(r('#prev').width), Math.round(r('#prev').height)], next: Math.round(r('#next').height), shop: Math.round(r('#shop').height),
               zin: Math.round(r('#zin').height), fits: hdr.scrollWidth <= hdr.clientWidth + 1 && r('#next').right <= innerWidth }; })()""")
    check("today: header and zoom buttons are at least 44 px tall and the header fits", sizes["prev"][0] >= 40 and min(sizes["prev"][1], sizes["next"], sizes["shop"], sizes["zin"]) >= 44 and sizes["fits"], str(sizes))
    check("today: phone no script errors", not errors, "; ".join(errors[:2]))
    await ctx.close()

    # Desktop: wide panel for the week, Person 1 first, export and import, layout changes, other tabs.
    ctx = await browser.new_context(viewport={"width": 1400, "height": 900}, accept_downloads=True)
    page = await ctx.new_page(); errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    await page.goto(url("#d2026-10-19")); await page.evaluate("localStorage.clear()"); await page.reload(); await page.wait_for_timeout(400)
    await page.click("#shop"); await page.wait_for_timeout(400)
    wide = await page.evaluate("(() => { const w = document.querySelector('.wrap'), t = document.querySelector('#panel .tbl-wrap'); return [w.classList.contains('wide'), Math.round(document.getElementById('panel').getBoundingClientRect().width), t.scrollWidth <= t.clientWidth + 1]; })()")
    check("today: desktop week panel is wide and the table fits", wide[0] and wide[1] >= 560 and wide[2], str(wide))
    await page.click('.dbig [data-recipe="b"]'); await page.wait_for_timeout(300)
    order = await page.evaluate("[[...document.querySelectorAll('#panel .split .lbl')].map(e => e.textContent), document.querySelector('.dbig .dmeal .kcal').textContent.slice(0, 9), document.querySelector('.wrap').classList.contains('wide')]")
    check("today: Person 1 comes first in recipe splits and the day view", order[0] == ["Person 1", "Person 2"] and order[1] == "Person 1:", str(order))
    check("today: the recipe panel goes back to normal width", order[2] is False, str(order[2]))

    await page.evaluate("""localStorage.setItem('mpd-swaps', JSON.stringify({'2026-10-21|d': 'd01'}));
      localStorage.setItem('mpd-extras', JSON.stringify({juice: false, s1: true, s2: true}))""")
    await page.reload(); await page.wait_for_timeout(400)
    async with page.expect_download() as dl:
        await page.click("#export")
    path = str(tmpdir / "plan.json"); await (await dl.value).save_as(path)
    await page.evaluate("localStorage.clear()"); await page.reload(); await page.wait_for_timeout(300)
    await page.set_input_files("#import-file", path); await page.wait_for_timeout(400)
    got = await page.evaluate("[localStorage.getItem('mpd-swaps'), JSON.parse(localStorage.getItem('mpd-extras')).juice, document.getElementById('dev-msg').textContent]")
    check("today: export then import restores swaps and extras", got[0] == '{"2026-10-21|d":"d01"}' and got[1] is False and got[2].startswith("Imported 1 swap"), str(got))
    bad = tmpdir / "bad.json"; bad.write_text('{"hello": 1}')
    await page.set_input_files("#import-file", str(bad)); await page.wait_for_timeout(300)
    msg = await page.evaluate("[document.getElementById('dev-msg').textContent, localStorage.getItem('mpd-swaps')]")
    check("today: a wrong file is refused and changes nothing", msg[0].startswith("That file is not") and msg[1] == '{"2026-10-21|d":"d01"}', str(msg))

    # Another tab changes the extras: this tab follows.
    other = await ctx.new_page(); await other.goto(url("#d2026-10-19")); await other.wait_for_timeout(300)
    await other.evaluate("localStorage.setItem('mpd-extras', JSON.stringify({juice: true, s1: true, s2: false}))")
    await page.wait_for_timeout(400)
    follows = await page.evaluate("[document.querySelector('.dbig [data-extra=juice]').checked, document.querySelector('.dbig [data-extra=s2]').checked]")
    check("today: a change in another tab shows up here", follows == [True, False], str(follows))
    await other.close()

    # Desktop -> tablet width -> desktop: sheet state and panel follow the layout.
    await page.set_viewport_size({"width": 800, "height": 1000}); await page.wait_for_timeout(400)
    small = await page.evaluate("(() => { const p = document.getElementById('panel'); return [p.classList.contains('open'), p.getAttribute('aria-hidden'), p.getAttribute('role'), document.querySelector('.wrap').classList.contains('wide')]; })()")
    check("today: narrowing to tablet width closes the panel into a hidden sheet", small == [False, "true", "dialog", False], str(small))
    await page.set_viewport_size({"width": 1400, "height": 900}); await page.wait_for_timeout(400)
    big = await page.evaluate("(() => { const p = document.getElementById('panel'); return [p.getAttribute('aria-hidden'), p.getAttribute('role'), document.querySelector('main').inert, !!p.querySelector('.p-title'), getComputedStyle(p).display !== 'none']; })()")
    check("today: widening again brings back the side panel with content", big == [None, "region", False, True, True], str(big))
    check("today: desktop no script errors", not errors, "; ".join(errors[:2]))
    await ctx.close()


async def main():
    build_suite()
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for name, w, h in [("phone", 390, 844), ("tablet", 820, 1180)]:
            await touch_suite(browser, name, w, h)
        await desktop_suite(browser)
        await plan_suite(browser)
        await cook_shop_suite(browser)
        with tempfile.TemporaryDirectory() as td:
            await today_suite(browser, pathlib.Path(td))
        await link_suite(browser)
        await perf_suite(browser, 1, 17)
        await perf_suite(browser, 2, 34)
        await browser.close()
    print(f"\n{len(FAILS)} failed" if FAILS else "\nAll passed")
    sys.exit(1 if FAILS else 0)


asyncio.run(main())
