import type { Page } from 'playwright';
import { parseNumber, toQuote } from '../parse';
import { readQuotedUnit, readRateText } from '../wait';
import { CURRENCY_META, type CurrencyCode, type ProviderQuotes, type Scraper } from '../types';

export function naverUrl(currency: CurrencyCode): string {
  return (
    'https://search.naver.com/search.naver?query=' +
    encodeURIComponent(CURRENCY_META[currency].naverQuery)
  );
}

/**
 * 네이버 통합검색의 "은행 고시환율" 카드에서 매매기준율을 읽습니다.
 * 통화마다 검색 페이지가 달라 통화별로 한 번씩 이동합니다.
 * 엔화는 100엔 단위로 고시되며, 단위는 카드 안 계산기에서 역산합니다.
 */
export const scrapeNaver: Scraper = async (page, currencies, timeoutMs) => {
  const quotes: Partial<ProviderQuotes> = {};

  for (const currency of currencies) {
    const url = naverUrl(currency);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      const card = page.locator('.cs_nexchangerate').first();
      await card.waitFor({ state: 'attached', timeout: timeoutMs });

      // 카드의 통화 코드가 요청한 통화와 같은지 본다. 네이버가 검색어를 다르게
      // 해석해 다른 통화를 보여주면 엉뚱한 값을 시세로 잡지 않도록 버린다.
      // 엔화 카드는 "JPY 100"처럼 단위를 덧붙이므로 부분 일치로 확인한다.
      const code = await textOf(card.locator('[data-price-info] .unit_tlt span').first());
      if (code && !code.toUpperCase().includes(currency)) {
        quotes[currency] = null;
        continue;
      }

      const raw = await readRateText(card.locator('[data-price-info] .price').first(), timeoutMs);
      quotes[currency] = toQuote({
        currency,
        provider: 'naver',
        url,
        raw,
        quotedUnit: await readQuotedUnit(
          page.locator('._exchange_rate_calculator .excr_box .num input'),
          parseNumber(raw),
          timeoutMs,
        ),
      });
    } catch {
      quotes[currency] = null;
    }
  }

  return quotes;
};

async function textOf(locator: ReturnType<Page['locator']>): Promise<string | null> {
  return (await locator.count()) > 0 ? locator.textContent() : null;
}
