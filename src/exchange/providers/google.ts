import type { Page } from 'playwright';
import { toQuote } from '../parse';
import { readRateText, stepTimeout } from '../wait';
import type { CurrencyCode, ExchangeQuote, ProviderQuotes, Scraper } from '../types';

export function googleUrl(currency: CurrencyCode): string {
  return `https://www.google.com/finance/quote/${currency}-KRW`;
}

// Google Finance는 클래스명을 주기적으로 바꾸므로 시세 위치 후보를 순서대로 시도한다.
// 앞의 둘은 구 레이아웃, `.ujg0He`는 현재 레이아웃의 대표 시세 블록이고,
// 마지막 후보는 대표 블록 클래스까지 바뀌었을 때를 대비한 최후 수단이다.
const PRICE_SELECTORS = [
  '[data-last-price]',
  '.YMlKec.fxKbKc',
  'main .ujg0He [jsname="Pdsbrc"]',
  'main [jsname="Pdsbrc"]',
];

/**
 * Google Finance의 통화 시세 페이지에서 환율을 읽습니다.
 * 구글은 모든 통화를 1단위 기준으로 표시하므로 단위 환산이 없습니다.
 */
export const scrapeGoogle: Scraper = async (page, currencies, timeoutMs, deadline) => {
  const quotes: Partial<ProviderQuotes> = {};

  for (const currency of currencies) {
    const step = stepTimeout(timeoutMs, deadline);
    if (step === 0) break;

    const url = googleUrl(currency);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: step });
      quotes[currency] = await readPrice(page, url, currency, stepTimeout(timeoutMs, deadline));
    } catch {
      quotes[currency] = null;
    }
  }

  return quotes;
};

async function readPrice(
  page: Page,
  url: string,
  currency: CurrencyCode,
  timeoutMs: number,
): Promise<ExchangeQuote | null> {
  // 후보를 하나씩 기다리면 존재하지 않는 후보마다 타임아웃을 소진하므로,
  // 먼저 합친 셀렉터로 한 번만 기다린 뒤 우선순위대로 읽는다.
  try {
    await page
      .locator(PRICE_SELECTORS.join(', '))
      .first()
      .waitFor({ state: 'attached', timeout: timeoutMs });
  } catch {
    return null;
  }

  for (const selector of PRICE_SELECTORS) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) === 0) continue;
    const raw =
      (await locator.getAttribute('data-last-price')) ?? (await readRateText(locator, timeoutMs));
    const quote = toQuote({ currency, provider: 'google', url, raw });
    if (quote) return quote;
  }
  return null;
}
