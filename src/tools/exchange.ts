import { defineTool, toolDef, text } from '@/common';
import { z } from 'zod';
import { DEFAULT_TIMEOUT_MS, fetchExchangeRate, fetchExchangeRates } from '@/exchange/index';
import { CURRENCIES, PROVIDERS } from '@/exchange/types';

const providerSchema = z.enum(PROVIDERS);
const currencySchema = z.enum(CURRENCIES);

const QUOTE_SHAPE =
  '통화 하나의 시세는 ' +
  '{ currency, base: "KRW", rate, quotedRate, quotedUnit, raw, provider, url, fetchedAt } 형태이고, ' +
  'rate는 1 통화 단위당 원화로 정규화된 값입니다.';

const QUOTE_TYPE = 'ExchangeQuote';

const GUIDELINES = [
  'Playwright로 각 포털을 실제로 열어 읽으므로 한 번 호출에 수 초가 걸립니다.',
  '처음 쓰기 전에 브라우저를 한 번 설치해야 합니다: npx playwright install chromium',
  '읽지 못한 통화는 null, 포털 자체를 열지 못하면 해당 포털 전체가 null입니다.',
  'rate는 항상 1 통화 단위당 원화입니다. 포털이 100엔으로 고시해도 rate는 1엔 기준이고, 화면 값은 quotedRate/quotedUnit에 남습니다.',
  '포털마다 고시 시각과 기준(매매기준율 / 시장환율)이 달라 값이 조금씩 다를 수 있습니다.',
];

export const tools = {
  exchangeRatesTool: toolDef({
    name: 'exchange_rates',
    description:
      '네이버·구글·다음에서 중국(CNY)·일본(JPY)·유로(EUR)의 원화 환율을 가져와 JSON으로 반환합니다. ' +
      `${QUOTE_SHAPE} 읽지 못한 통화는 null, 포털 자체를 열지 못하면 그 포털 전체가 null입니다`,
    inputSchema: {
      providers: z
        .array(providerSchema)
        .default([...PROVIDERS])
        .describe('조회할 포털 목록'),
      currencies: z
        .array(currencySchema)
        .default([...CURRENCIES])
        .describe('조회할 통화 목록'),
      timeoutMs: z
        .number()
        .int()
        .positive()
        .default(DEFAULT_TIMEOUT_MS)
        .describe('페이지 이동·요소 대기 하나에 허용할 시간(ms)'),
    },
    typeLabels: {
      providers: '("naver" | "google" | "daum")[]',
      currencies: '("CNY" | "JPY" | "EUR")[]',
      timeoutMs: 'number',
    },
    returnType:
      `Record<"naver" | "google" | "daum", ` +
      `Record<"CNY" | "JPY" | "EUR", ${QUOTE_TYPE} | null> | null>`,
    returnDescription:
      '포털별·통화별 시세 JSON. 통화를 읽지 못하면 그 통화가 null, 포털을 열지 못하면 포털 전체가 null',
    handler: async ({ providers, currencies, timeoutMs }) => {
      try {
        const result = await fetchExchangeRates({ providers, currencies, timeoutMs });
        return text(JSON.stringify(result, null, 2));
      } catch (err) {
        return text(`Error: ${(err as Error).message}`);
      }
    },
    examples: [
      {
        args: [`'["naver"]'`, `'["CNY"]'`],
        result:
          '{"naver":{"CNY":{"currency":"CNY","base":"KRW","rate":205.12,...},"JPY":null,"EUR":null},"google":null,"daum":null}',
      },
    ],
    guidelines: GUIDELINES,
  }),

  exchangeRateTool: toolDef({
    name: 'exchange_rate',
    description: `포털 한 곳에서 통화 하나의 원화 환율을 가져옵니다. ${QUOTE_SHAPE} 읽지 못하면 null을 반환합니다`,
    inputSchema: {
      provider: providerSchema.describe('조회할 포털'),
      currency: currencySchema.describe('조회할 통화'),
      timeoutMs: z
        .number()
        .int()
        .positive()
        .default(DEFAULT_TIMEOUT_MS)
        .describe('페이지 이동·요소 대기 하나에 허용할 시간(ms)'),
    },
    typeLabels: {
      provider: '"naver" | "google" | "daum"',
      currency: '"CNY" | "JPY" | "EUR"',
      timeoutMs: 'number',
    },
    returnType: `${QUOTE_TYPE} | null`,
    returnDescription: '해당 통화의 시세 JSON. 읽지 못했으면 null',
    handler: async ({ provider, currency, timeoutMs }) => {
      try {
        const quote = await fetchExchangeRate(provider, currency, timeoutMs);
        return text(JSON.stringify(quote, null, 2));
      } catch (err) {
        return text(`Error: ${(err as Error).message}`);
      }
    },
    examples: [
      {
        args: ['daum', 'JPY'],
        result:
          '{"currency":"JPY","base":"KRW","rate":8.723,"quotedRate":872.3,"quotedUnit":100,...}',
      },
    ],
    guidelines: GUIDELINES,
  }),
};

export const exchangeRatesTool = defineTool(tools.exchangeRatesTool);
export const exchangeRateTool = defineTool(tools.exchangeRateTool);
