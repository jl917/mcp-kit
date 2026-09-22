import { describe, expect, it } from '@rstest/core';
import { textOf } from '@/common';
import { z } from 'zod';
import { exchangeRateTool, exchangeRatesTool, tools } from '@/tools/exchange';
import { fetchExchangeRates } from '@/exchange/index';
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
