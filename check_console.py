from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # 监听控制台消息
    console_messages = []
    page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))

    # 监听页面错误
    page_errors = []
    page.on("pageerror", lambda exc: page_errors.append(str(exc)))

    page.goto('http://localhost:5000')
    page.wait_for_load_state('networkidle')

    # 等待一会儿让React组件渲染
    page.wait_for_timeout(3000)

    # 输出所有控制台日志
    print("=" * 80)
    print("浏览器控制台日志:")
    print("=" * 80)
    for msg in console_messages:
        print(msg)

    print("\n" + "=" * 80)
    print("页面错误:")
    print("=" * 80)
    for err in page_errors:
        print(err)

    browser.close()
