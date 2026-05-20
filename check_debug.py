from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})

    console_messages = []
    errors = []
    def on_console(msg):
        text = msg.text
        console_messages.append(f"[{msg.type}] {text}")
        if 'fitView' in text or 'error' in text.lower() or 'Error' in text:
            print(f"  >> {text}")
    
    page.on("console", on_console)
    page.on("pageerror", lambda e: errors.append(str(e)))

    page.goto('http://localhost:5000')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(8000)

    print("=" * 60)
    print("CANVAS CHECK")
    print("=" * 60)
    canvas_count = page.locator('canvas').count()
    print(f"Canvas elements: {canvas_count}")

    canvas_info = page.evaluate('''() => {
        const canvases = document.querySelectorAll('canvas');
        const info = [];
        canvases.forEach((c, i) => {
            info.push({
                idx: i,
                w: c.width,
                h: c.height,
                hasContent: c.getContext ? true : false,
            });
        });
        return info;
    }''')
    print(f"Canvas info: {canvas_info}")

    print("\n" + "=" * 60)
    print("KEY CONSOLE LOGS (fitView / error)")
    print("=" * 60)
    found_fitview = False
    for msg in console_messages:
        if 'fitView' in msg or 'error' in msg.lower() or 'not registered' in msg:
            print(msg)
            if 'fitView completed' in msg:
                found_fitview = True
    
    if not found_fitview:
        print("  (fitView was NOT called!)")

    print("\n" + "=" * 60)
    print("ALL CONSOLE LOGS (last 30)")
    print("=" * 60)
    for msg in console_messages[-30:]:
        print(msg)

    print("\n" + "=" * 60)
    print("PAGE ERRORS")
    print("=" * 60)
    for e in errors:
        print(e)
    if not errors:
        print("  (none)")

    browser.close()
