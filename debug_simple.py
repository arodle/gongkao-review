from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False, slow_mo=50)
    page = browser.new_page(viewport={"width": 1280, "height": 800})

    # 直接打印到终端
    def log_console(msg):
        if '[KG]' in msg.text or 'error' in msg.text.lower():
            print(f"CONSOLE: {msg.text}")
    
    page.on("console", log_console)
    page.on("pageerror", lambda e: print(f"ERROR: {e}"))

    page.goto('http://localhost:5000')
    page.wait_for_load_state('networkidle')
    
    # 等待足够时间让 G6 初始化
    time.sleep(5)
    
    # 检查 DOM
    canvas_count = page.locator('canvas').count()
    print(f"\nCanvas count: {canvas_count}")
    
    browser.close()
