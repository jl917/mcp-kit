import type { CurrencyCode, ExchangeQuote, Provider } from './types';

/**
 * `"1,234.56"`, `"₩ 1 234,56"` 같은 표기에서 숫자를 뽑아냅니다.
 * 통화 기호와 공백, 천 단위 구분자를 걷어내고 소수점만 남깁니다.
 *
 * @returns 파싱된 숫자. 숫자를 찾지 못하면 `null`
 */
export function parseNumber(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const match = raw.replace(/\s/g, '').match(/-?\d[\d,.]*/);
  if (!match) return null;

  let token = match[0].replace(/[,.]+$/, '');
  // 소수점 자리는 마지막 구분자로만 결정하고, 앞쪽 구분자는 천 단위로 본다.
  const lastComma = token.lastIndexOf(',');
  const lastDot = token.lastIndexOf('.');
  if (lastComma > lastDot) {
    token = token.replace(/\./g, '').replace(',', '.');
  } else {
    token = token.replace(/,/g, '');
  }

  const value = Number(token);
  return Number.isFinite(value) ? value : null;
}

/** 고시 단위로 인정하는 값. 국내 포털은 엔화를 100엔 단위로 고시합니다. */
const UNIT_CANDIDATES = [1, 10, 100, 1000];

/**
 * 포털 환율 계산기의 입력값으로부터 고시 기준 단위를 역산합니다.
 *
 * 계산기는 "100 엔 = 872.30 원"처럼 실제 환산 결과를 보여주므로
 * 고시가를 1단위 값으로 나누면 고시 단위(엔은 100)가 나옵니다.
 *
 * 계산기가 아직 그려지지 않았거나 이전 통화 값이 남아 있으면 역산 결과가
 * 1/10/100/1000 중 어디에도 들어맞지 않습니다. 이때는 단위를 단정하지 않고
 * `null`을 돌려주어 호출 쪽이 다시 읽도록 합니다.
 *
 * @param quotedRate - 화면에 표시된 고시가
 * @param amountIn - 계산기의 외화 입력값
 * @param amountOut - 계산기의 원화 결과값
 * @returns 역산된 고시 단위. 신뢰할 수 없으면 `null`
 */
export function deriveQuotedUnit(
  quotedRate: number | null,
  amountIn: number | null,
  amountOut: number | null,
): number | null {
  if (!quotedRate || !amountIn || !amountOut) return null;

  const perUnit = amountOut / amountIn;
  if (!Number.isFinite(perUnit) || perUnit <= 0) return null;

  const derived = quotedRate / perUnit;
  if (!Number.isFinite(derived) || derived <= 0) return null;

  const nearest = UNIT_CANDIDATES.reduce((best, candidate) =>
    Math.abs(Math.log10(derived / candidate)) < Math.abs(Math.log10(derived / best))
      ? candidate
      : best,
  );
  return Math.abs(derived - nearest) / nearest <= 0.1 ? nearest : null;
}

/**
 * 스크레이퍼가 읽은 원본 문자열을 `ExchangeQuote`로 만듭니다.
 * 숫자가 아니거나 0 이하면 시세로 인정하지 않고 `null`을 반환합니다.
 *
 * @param quotedUnit - 포털이 고시한 기준 단위 (100엔 고시라면 100). 생략하면 1
 */
export function toQuote(input: {
  currency: CurrencyCode;
  provider: Provider;
  url: string;
  raw: string | null | undefined;
  quotedUnit?: number;
}): ExchangeQuote | null {
  const { currency, provider, url, raw } = input;
  const quotedRate = parseNumber(raw);
  if (quotedRate === null || quotedRate <= 0) return null;

  const quotedUnit = input.quotedUnit && input.quotedUnit > 0 ? input.quotedUnit : 1;

  return {
    currency,
    base: 'KRW',
    rate: round(quotedRate / quotedUnit, 6),
    quotedRate,
    quotedUnit,
    raw: (raw ?? '').trim(),
    provider,
    url,
    fetchedAt: new Date().toISOString(),
  };
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
