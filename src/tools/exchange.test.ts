import { describe, expect, it } from '@rstest/core';
import { textOf } from '@/common';
import { z } from 'zod';
import { exchangeRateTool, exchangeRatesTool, tools } from '@/tools/exchange';
import { budgetFor, DEFAULT_TIMEOUT_MS, fetchExchangeRates } from '@/exchange/index';
import { CURRENCIES, PROVIDERS } from '@/exchange/types';

describe('tool definitions', () => {
  it('should expose both tools under MCP snake_case names', () => {
    expect(Object.keys(tools)).toEqual(['exchangeRatesTool', 'exchangeRateTool']);
    expect(exchangeRatesTool.name).toBe('exchange_rates');
    expect(exchangeRateTool.name).toBe('exchange_rate');
  });

  it('should default exchange_rates to every provider and currency', () => {
    const parsed = z.object(exchangeRatesTool.inputSchema).parse({});
    expect(parsed).toMatchObject({
      providers: [...PROVIDERS],
      currencies: [...CURRENCIES],
    });
    expect(parsed.timeoutMs).toBeGreaterThan(0);
  });

  it('should reject unsupported providers and currencies', () => {
    const schema = z.object(exchangeRateTool.inputSchema);
    expect(() => schema.parse({ provider: 'bing', currency: 'CNY' })).toThrow();
    expect(() => schema.parse({ provider: 'naver', currency: 'GBP' })).toThrow();
  });
});

describe('fetchExchangeRates()', () => {
  it('should return a null-filled result without opening a browser when nothing is requested', async () => {
    const result = await fetchExchangeRates({ providers: [], currencies: [] });
    expect(result).toEqual({ naver: null, google: null, daum: null });
  });

  // 통화를 하나 더할 때마다 예산이 늘어나면, 언젠가 클라이언트의 기본 요청
  // 제한 시간(60초)을 넘겨 호출 쪽이 결과 대신 연결 오류만 받는다.
  it('should keep the default budget under the MCP client request timeout, whatever the currency count', () => {
    const MCP_CLIENT_REQUEST_TIMEOUT_MS = 60_000;
    for (const count of [CURRENCIES.length, CURRENCIES.length + 4, 100]) {
      expect(budgetFor(DEFAULT_TIMEOUT_MS, count)).toBeLessThan(MCP_CLIENT_REQUEST_TIMEOUT_MS);
    }
  });

  it('should still leave one full step for a caller that raises timeoutMs on purpose', () => {
    expect(budgetFor(90_000, 1)).toBe(90_000);
  });

  it('should not stretch the budget past what the requested currencies need', () => {
    expect(budgetFor(1_000, 2)).toBe(3_000);
  });
});

describe('exchange_rates handler', () => {
  it('should return every provider as JSON when nothing is requested', async () => {
    const result = await exchangeRatesTool.handler({
      providers: [],
      currencies: [],
      timeoutMs: 1000,
    });
    expect(result.content[0].type).toBe('text');
    expect(JSON.parse(textOf(result))).toEqual({ naver: null, google: null, daum: null });
  });
});
