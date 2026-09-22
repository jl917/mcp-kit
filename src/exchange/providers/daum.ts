import { parseNumber, toQuote } from '../parse';
import { readQuotedUnit, readRateText, stepTimeout } from '../wait';
import type { CurrencyCode, ProviderQuotes, Scraper } from '../types';

export function daumUrl(currency: CurrencyCode): string {
  return `https://finance.daum.net/exchanges/FRX.KRW${currency}`;
}

/**
 * 다음 금융의 통화 상세 페이지에서 매매기준율을 읽습니다.
 * 값을 클라이언트에서 그리므로 자리표시자가 실제 시세로 바뀔 때까지 기다립니다.
 * 엔화는 100엔 단위로 고시되며, 단위는 페이지 계산기에서 역산합니다.
 */
export const scrapeDaum: Scraper = async (page, currencies, timeoutMs, deadline) => {
  const quotes: Partial<ProviderQuotes> = {};

  for (const currency of currencies) {
    const step = stepTimeout(timeoutMs, deadline);
    if (step === 0) break;

    const url = daumUrl(currency);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: step });
      const raw = await readRateText(
        page.locator('.numB strong').first(),
        stepTimeout(timeoutMs, deadline),
      );
      quotes[currency] = toQuote({
        currency,
        provider: 'daum',
        url,
        raw,
        quotedUnit: await readQuotedUnit(
          page.locator('.exchB .inputB input'),
          parseNumber(raw),
          stepTimeout(timeoutMs, deadline),
        ),
      });
    } catch {
      quotes[currency] = null;
    }
  }

  return quotes;
};
