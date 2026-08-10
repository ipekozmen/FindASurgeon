"""Smoke test: opens a visible Chromium window and navigates to example.com.
Run this first to confirm Browser Use can launch a real browser before wiring up the LLM.
"""

import asyncio

from browser_use import BrowserSession


async def main():
    browser_session = BrowserSession(headless=False)
    await browser_session.start()
    await browser_session.navigate_to("https://example.com")
    print("Title:", await browser_session.get_current_page_title())
    await asyncio.sleep(3)
    await browser_session.close()


if __name__ == "__main__":
    asyncio.run(main())
