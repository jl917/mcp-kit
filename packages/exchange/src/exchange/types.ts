import type { Page } from 'playwright';

/** 환율을 수집하는 포털 목록. */
export const PROVIDERS = ['naver', 'google', 'daum'] as const;

/** 수집 대상 통화 — 중국 위안 / 일본 엔 / 유로. */
export const CURRENCIES = ['CNY', 'JPY', 'EUR'] as const;

export type Provider = (typeof PROVIDERS)[number];
export type CurrencyCode = (typeof CURRENCIES)[number];

/** 통화별 한글 명칭과 각 포털에서 쓰는 검색어. */
export const CURRENCY_META: Record<
  CurrencyCode,
  { country: string; name: string; naverQuery: string; daumLabel: string }
> = {
  CNY: { country: '중국', name: '위안', naverQuery: '중국 환율', daumLabel: '중국' },
  JPY: { country: '일본', name: '엔', naverQuery: '일본 환율', daumLabel: '일본' },
  EUR: { country: '유럽연합', name: '유로', naverQuery: '유로 환율', daumLabel: '유로' },
};

/**
 * 한 포털에서 읽어낸 하나의 통화 시세.
 *
 * `rate`는 항상 1 통화 단위당 원화 값으로 정규화됩니다.
 * 포털이 100엔 단위로 고시하더라도 `rate`는 1엔 기준이며,
 * 화면에 표시된 원래 값은 `quotedRate`/`quotedUnit`에 그대로 담깁니다.
 */
export interface ExchangeQuote {
  currency: CurrencyCode;
  base: 'KRW';
  /** 1 통화 단위당 원화. */
  rate: number;
  /** 포털 화면에 표시된 값. */
  quotedRate: number;
  /** `quotedRate`의 기준 단위 (일본 엔은 보통 100). */
  quotedUnit: number;
  /** 화면에서 읽은 원본 문자열. */
  raw: string;
  provider: Provider;
  url: string;
  fetchedAt: string;
}

/** 통화별 시세. 읽지 못한 통화는 `null`. */
export type ProviderQuotes = Record<CurrencyCode, ExchangeQuote | null>;

/** 포털별 결과. 포털 전체가 실패하면 해당 포털은 `null`. */
export type ExchangeRatesResult = Record<Provider, ProviderQuotes | null>;

/**
 * 한 포털에서 요청된 통화들을 읽어오는 스크레이퍼.
 *
 * @param timeoutMs - 페이지 이동·요소 대기 하나에 허용할 시간
 */
export type Scraper = (
  page: Page,
  currencies: readonly CurrencyCode[],
  timeoutMs: number,
) => Promise<Partial<ProviderQuotes>>;
