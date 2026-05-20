from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})

    console_messages = []
    page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))

    page_errors = []
    page.on("pageerror", lambda exc: page_errors.append(str(exc)))

    page.goto('http://localhost:5000')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(5000)

    # full page screenshot
    page.screenshot(path="screenshot_full.png", full_page=True)

    # screenshot just the graph container area
    graph_container = page.locator('.h-full.w-full').first
    if graph_container:
        graph_container.screenshot(path="screenshot_graph.png")

    # also capture the body html for canvas inspection
    canvas_count = page.locator('canvas').count()
    print(f"Canvas elements found: {canvas_count}")

    # Check if G6 created canvas inside container
    container_html = page.locator('.h-full.w-full').first.inner_html()
    print(f"\nContainer inner HTML (first 1000 chars):\n{container_html[:1000]}")

    print("\n" + "=" * 80)
    print("CONSOLE LOGS")
    print("=" * 80)
    for msg in console_messages:
        print(msg)

    print("\n" + "=" * 80)
    print("PAGE ERRORS")
    print("=" * 80)
    for err in page_errors:
        print(err)

    browser.close()
