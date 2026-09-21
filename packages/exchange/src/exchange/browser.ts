import type { Browser, BrowserContext } from 'playwright';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * 스크레이핑용 Chromium을 띄웁니다.
 *
 * Playwright가 내려받은 Chromium을 먼저 쓰고, 설치돼 있지 않으면
 * 시스템에 깔린 Chrome(`channel: "chrome"`)으로 한 번 더 시도합니다.
 * 둘 다 없으면 브라우저 설치 방법을 담은 에러를 던집니다.
 */
export async function launchBrowser(): Promise<Browser> {
  const { chromium } = await import('playwright');
  const args = ['--disable-blink-features=AutomationControlled'];

  try {
    return await chromium.launch({ headless: true, args });
  } catch (err) {
    try {
      return await chromium.launch({ headless: true, channel: 'chrome', args });
    } catch {
      throw new Error(
        `Failed to launch a browser — ${(err as Error).message}\n` +
          'Install the bundled browser once with: npx playwright install chromium',
      );
    }
  }
}

/** 한국어 로케일과 데스크톱 UA를 쓰는 브라우저 컨텍스트를 만듭니다. */
export async function createContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({
    userAgent: USER_AGENT,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    viewport: { width: 1440, height: 900 },
    extraHTTPHeaders: { 'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8' },
  });
}
