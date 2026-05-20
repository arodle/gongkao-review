from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        
        all_logs = []
        
        def on_console(msg):
            all_logs.append(f"[{msg.type}] {msg.text}")
        
        def on_page_error(e):
            all_logs.append(f"[PAGE_ERROR] {e}")
        
        page.on("console", on_console)
        page.on("pageerror", on_page_error)
        
        page.goto('http://localhost:5000')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(8000)
        
        # Save all logs to file
        with open('all_console_logs.txt', 'w', encoding='utf-8') as f:
            for log in all_logs:
                f.write(log + '\n')
        
        # Print summary
        print("=" * 60)
        print("LOG SUMMARY")
        print("=" * 60)
        print(f"Total logs: {len(all_logs)}")
        
        kg_logs = [l for l in all_logs if 'KnowledgeGraph' in l or 'KG' in l]
        print(f"\nKnowledgeGraph related logs: {len(kg_logs)}")
        for log in kg_logs:
            print(log)
        
        error_logs = [l for l in all_logs if 'error' in l.lower()]
        print(f"\nError logs: {len(error_logs)}")
        for log in error_logs[:10]:
            print(log)
        
        # Check canvas
        canvas_count = page.locator('canvas').count()
        print(f"\nCanvas elements: {canvas_count}")
        
        browser.close()

if __name__ == "__main__":
    main()
