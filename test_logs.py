from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        
        all_logs = []
        def on_console(msg):
            all_logs.append(msg.text)
        
        page.on("console", on_console)
        page.on("pageerror", lambda e: all_logs.append(f"[PAGE_ERROR] {e}"))
        
        page.goto('http://localhost:5000')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(8000)
        
        # Save logs to file
        with open('console_logs.txt', 'w', encoding='utf-8') as f:
            for log in all_logs:
                f.write(log + '\n')
        
        # Print KG related logs
        print("=" * 60)
        print("KG RELATED LOGS")
        print("=" * 60)
        for log in all_logs:
            if '[KG]' in log or 'Graph' in log or 'graph' in log.lower():
                print(log)
        
        browser.close()

if __name__ == "__main__":
    main()
