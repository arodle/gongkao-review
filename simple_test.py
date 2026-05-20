from playwright.sync_api import sync_playwright
import sys

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        
        kg_logs = []
        
        def on_console(msg):
            txt = msg.text
            if '[KG]' in txt or 'Graph' in txt or 'canvas' in txt.lower():
                kg_logs.append(txt)
        
        page.on("console", on_console)
        
        page.goto('http://localhost:5000')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(6000)
        
        # Print results
        for log in kg_logs:
            print(log)
        
        browser.close()

if __name__ == "__main__":
    main()
