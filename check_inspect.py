from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})

    all_logs = []
    def on_console(msg):
        all_logs.append(f"[{msg.type}] {msg.text}")
    page.on("console", on_console)
    page.on("pageerror", lambda e: all_logs.append(f"[PAGE_ERROR] {e}"))

    page.goto('http://localhost:5000')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(8000)

    # 通过 evaluate 检查 G6 内部状态
    g6_state = page.evaluate('''() => {
        // 检查全局是否有 G6 实例引用
        const containers = document.querySelectorAll('.h-full.w-full');
        const info = {
            containerCount: containers.length,
            canvasCount: document.querySelectorAll('canvas').length,
            windowsKeys: Object.keys(window).filter(k => k.startsWith('__G6') || k.includes('graph')),
        };

        // 检查 canvas 的像素内容
        const canvases = document.querySelectorAll('canvas');
        info.canvasPixels = [];
        canvases.forEach((c, i) => {
            try {
                const ctx = c.getContext('2d');
                if (ctx) {
                    const imgData = ctx.getImageData(0, 0, c.width, c.height);
                    let nonWhite = 0;
                    for (let j = 0; j < imgData.data.length; j += 4) {
                        const r = imgData.data[j];
                        const g = imgData.data[j+1];
                        const b = imgData.data[j+2];
                        if (r < 250 || g < 250 || b < 250) {
                            nonWhite++;
                            if (nonWhite > 10000) break;
                        }
                    }
                    info.canvasPixels.push({ idx: i, nonWhitePixels: nonWhite, totalPixels: c.width * c.height });
                }
            } catch(e) {
                info.canvasPixels.push({ idx: i, error: e.message });
            }
        });

        return info;
    }''')

    print("=" * 60)
    print("G6 内部状态")
    print("=" * 60)
    import json
    print(json.dumps(g6_state, indent=2, ensure_ascii=False))

    print("\n" + "=" * 60)
    print("关键日志 (fitView / error / G6)")
    print("=" * 60)
    found = False
    for msg in all_logs:
        if 'fitView' in msg or 'error' in msg.lower() or '[KG]' in msg or 'G6' in msg:
            print(msg)
            found = True
            if 'fitView completed' in msg:
                found = True
    
    print("\n" + "=" * 60)
    print("最后 20 条日志")
    print("=" * 60)
    for msg in all_logs[-20:]:
        print(msg)

    browser.close()
