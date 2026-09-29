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

/**
 * 제한 시간 스키마.
 *
 * OpenAI 도구 스키마는 `default`·`minimum`·`exclusiveMinimum`을 받지 않고
 * 모든 필드가 `required`여야 하므로, 값을 비우는 뜻은 `null`로만 나타냅니다.
 * 기본값과 범위는 `describe()`로 모델에 알리고 적용은 도메인이 맡습니다.
 */
const timeoutSchema = z
  .number()
  .nullable()
  .describe(
    `페이지 이동·요소 대기 하나에 허용할 시간(ms). null이거나 0 이하면 ${DEFAULT_TIMEOUT_MS}`,
  );

export const tools = {
  exchangeRatesTool: toolDef({
    name: 'exchange_rates',
    description:
      '네이버·구글·다음에서 미국(USD)·중국(CNY)·일본(JPY)·유로(EUR)의 원화 환율을 가져와 JSON으로 반환합니다. ' +
      `${QUOTE_SHAPE} 읽지 못한 통화는 null, 포털 자체를 열지 못하면 그 포털 전체가 null입니다`,
    inputSchema: {
      providers: z
        .array(providerSchema)
        .nullable()
        .describe(`조회할 포털 목록. null이면 ${PROVIDERS.join('·')} 전부`),
      currencies: z
        .array(currencySchema)
        .nullable()
        .describe(`조회할 통화 목록. null이면 ${CURRENCIES.join('·')} 전부`),
      timeoutMs: timeoutSchema,
    },
    handler: async ({ providers, currencies, timeoutMs }) => {
      try {
        const result = await fetchExchangeRates({
          providers: providers ?? undefined,
          currencies: currencies ?? undefined,
          timeoutMs: timeoutMs ?? undefined,
        });
        return text(JSON.stringify(result, null, 2));
      } catch (err) {
        return text(`Error: ${(err as Error).message}`);
      }
    },
  }),

  exchangeRateTool: toolDef({
    name: 'exchange_rate',
    description: `포털 한 곳에서 통화 하나의 원화 환율을 가져옵니다. ${QUOTE_SHAPE} 읽지 못하면 null을 반환합니다`,
    inputSchema: {
      provider: providerSchema.describe('조회할 포털'),
      currency: currencySchema.describe('조회할 통화'),
      timeoutMs: timeoutSchema,
    },
    handler: async ({ provider, currency, timeoutMs }) => {
      try {
        const quote = await fetchExchangeRate(provider, currency, timeoutMs ?? undefined);
        return text(JSON.stringify(quote, null, 2));
      } catch (err) {
        return text(`Error: ${(err as Error).message}`);
      }
    },
  }),
};

export const exchangeRatesTool = defineTool(tools.exchangeRatesTool);
export const exchangeRateTool = defineTool(tools.exchangeRateTool);
