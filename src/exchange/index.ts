import type { Browser, BrowserContext } from 'playwright';
import { closeBrowser, createContext, launchBrowser } from './browser';
import { scrapeDaum } from './providers/daum';
import { scrapeGoogle } from './providers/google';
import { scrapeNaver } from './providers/naver';
import {
  CURRENCIES,
  PROVIDERS,
  type CurrencyCode,
  type ExchangeQuote,
  type ExchangeRatesResult,
  type Provider,
  type ProviderQuotes,
  type Scraper,
} from './types';

const SCRAPERS: Record<Provider, Scraper> = {
  naver: scrapeNaver,
  google: scrapeGoogle,
  daum: scrapeDaum,
};

export interface FetchOptions {
  providers?: readonly Provider[];
  currencies?: readonly CurrencyCode[];
  /** 페이지 이동·요소 대기 하나에 허용할 시간(ms). */
  timeoutMs?: number;
}

export const DEFAULT_TIMEOUT_MS = 20_000;

/**
 * 도구 호출 하나에 허용할 전체 시간.
 *
 * MCP 클라이언트는 요청 하나를 기본 60초까지만 기다립니다
 * (SDK의 `DEFAULT_REQUEST_TIMEOUT_MSEC`). 예산을 통화 수에 비례해 늘리면
 * 통화를 하나 더할 때마다 이 한계에 가까워지고, 넘는 순간 클라이언트는
 * 부분 결과조차 받지 못한 채 연결을 정리합니다. 그래서 전체 예산은 통화 수와
 * 무관하게 여기서 끊고, 시간이 모자라 읽지 못한 통화는 `null`로 돌려줍니다.
 */
export const MAX_BUDGET_MS = 45_000;

/**
 * 브라우저·탭을 닫는 데 허용할 시간.
 *
 * Chromium이 응답하지 않으면 `close()`가 끝나지 않습니다. 그대로 기다리면
 * 도구 호출이 영영 응답하지 않으므로 정리도 시간 안에 끊고,
 * 끊긴 브라우저는 `closeBrowser()`가 프로세스째 끝냅니다.
 */
const CLOSE_TIMEOUT_MS = 5_000;

/**
 * 수집 한 번에 허용할 전체 시간을 정합니다.
 *
 * 포털은 통화를 하나씩 순회하므로 통화 수만큼 잡고 브라우저 기동 몫으로 한 번
 * 더 여유를 두되, 클라이언트가 기다려 주는 시간을 넘지 않도록 `MAX_BUDGET_MS`
 * 에서 끊습니다. `timeoutMs`를 직접 크게 준 호출까지 잘라 버리지 않도록
 * 한 단계 분량은 언제나 남깁니다.
 */
export function budgetFor(timeoutMs: number, currencyCount: number): number {
  return Math.min(timeoutMs * (currencyCount + 1), Math.max(MAX_BUDGET_MS, timeoutMs));
}

/**
 * 네이버·구글·다음에서 원화 기준 환율을 가져옵니다.
 *
 * 포털마다 탭을 따로 열어 병렬로 수집하므로 한 곳이 느리거나 막혀도
 * 나머지 결과는 그대로 돌아옵니다. 읽지 못한 통화는 `null`,
 * 포털 자체를 열지 못하면 해당 포털 전체가 `null`이 됩니다.
 *
 * @throws 브라우저를 띄우지 못한 경우에만 예외를 던집니다.
 */
export async function fetchExchangeRates(options: FetchOptions = {}): Promise<ExchangeRatesResult> {
  const providers = dedupe(options.providers ?? PROVIDERS);
  const currencies = dedupe(options.currencies ?? CURRENCIES);
  const timeoutMs =
    options.timeoutMs && options.timeoutMs > 0 ? options.timeoutMs : DEFAULT_TIMEOUT_MS;

  const result = emptyResult();
  if (providers.length === 0 || currencies.length === 0) return result;

  const budgetMs = budgetFor(timeoutMs, currencies.length);

  let browser: Browser | undefined;
  try {
    browser = await launchBrowser();
    const scoped = browser;
    const deadline = Date.now() + budgetMs;
    await Promise.all(
      providers.map(async (provider) => {
        result[provider] = await withTimeout(
          runScraper(scoped, provider, currencies, timeoutMs, deadline),
          budgetMs,
        );
      }),
    );
  } finally {
    if (browser) await closeBrowser(browser, CLOSE_TIMEOUT_MS);
  }

  return result;
}

/**
 * 포털 한 곳에서 통화 하나의 환율을 가져옵니다.
 *
 * @returns 읽지 못했으면 `null`
 */
export async function fetchExchangeRate(
  provider: Provider,
  currency: CurrencyCode,
  timeoutMs?: number,
): Promise<ExchangeQuote | null> {
  const result = await fetchExchangeRates({
    providers: [provider],
    currencies: [currency],
    timeoutMs,
  });
  return result[provider]?.[currency] ?? null;
}

/** 포털 하나를 전용 탭에서 수집합니다. 탭을 열지 못하면 `null`. */
async function runScraper(
  browser: Browser,
  provider: Provider,
  currencies: readonly CurrencyCode[],
  timeoutMs: number,
  deadline: number,
): Promise<ProviderQuotes | null> {
  // 컨텍스트 생성도 try 안에 둔다. 예산을 넘겨 버려진 수집이 돌고 있을 때
  // 브라우저가 먼저 닫히면 바로 이 줄이 던지는데, 밖으로 나가면 그 예외를
  // 받아 줄 곳이 없다.
  let context: BrowserContext | undefined;
  try {
    context = await createContext(browser);
    const page = await context.newPage();
    page.setDefaultTimeout(timeoutMs);
    page.setDefaultNavigationTimeout(timeoutMs);
    return normalize(await SCRAPERS[provider](page, currencies, timeoutMs, deadline));
  } catch {
    return null;
  } finally {
    if (context)
      await withTimeout(
        context.close().catch(() => undefined),
        CLOSE_TIMEOUT_MS,
      );
  }
}

/** 요청하지 않았거나 스크레이퍼가 채우지 못한 통화를 `null`로 메웁니다. */
function normalize(partial: Partial<ProviderQuotes>): ProviderQuotes {
  const quotes = {} as ProviderQuotes;
  for (const currency of CURRENCIES) {
    quotes[currency] = partial[currency] ?? null;
  }
  return quotes;
}

function emptyResult(): ExchangeRatesResult {
  const result = {} as ExchangeRatesResult;
  for (const provider of PROVIDERS) result[provider] = null;
  return result;
}

/** 제한 시간을 넘기면 예외 대신 `null`로 끝냅니다. */
async function withTimeout<T>(task: Promise<T>, ms: number): Promise<T | null> {
  let timer: NodeJS.Timeout | undefined;
  const guard = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  try {
    return await Promise.race([task.catch(() => null), guard]);
  } finally {
    clearTimeout(timer);
  }
}

function dedupe<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
