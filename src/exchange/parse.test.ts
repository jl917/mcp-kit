import { describe, expect, it } from '@rstest/core';
import { deriveQuotedUnit, parseNumber, toQuote } from '@/exchange/parse';
import { stepTimeout } from '@/exchange/wait';

describe('stepTimeout()', () => {
  it('should keep the full step while the budget is wide open', () => {
    expect(stepTimeout(20_000, Date.now() + 60_000)).toBe(20_000);
  });

  it('should shrink the step to what the budget has left', () => {
    const left = stepTimeout(20_000, Date.now() + 5_000);
    expect(left).toBeGreaterThan(4_000);
    expect(left).toBeLessThanOrEqual(5_000);
  });

  it('should return 0 once the budget is spent so the scraper stops', () => {
    expect(stepTimeout(20_000, Date.now() - 1)).toBe(0);
  });
});

describe('parseNumber()', () => {
  it('should parse a plain decimal', () => {
    expect(parseNumber('205.12')).toBe(205.12);
  });

  it('should strip thousands separators', () => {
    expect(parseNumber('1,576.27')).toBe(1576.27);
  });

  it('should treat a trailing comma group as the decimal separator', () => {
    expect(parseNumber('1.576,27')).toBe(1576.27);
  });

  it('should ignore currency symbols and whitespace', () => {
    expect(parseNumber('₩ 1 372.40 원')).toBe(1372.4);
  });

  it('should return null for placeholder text', () => {
    expect(parseNumber('-')).toBeNull();
    expect(parseNumber('')).toBeNull();
    expect(parseNumber(null)).toBeNull();
    expect(parseNumber(undefined)).toBeNull();
  });
});

describe('deriveQuotedUnit()', () => {
  it('should derive 1 when the quote matches the per-unit value', () => {
    expect(deriveQuotedUnit(205.12, 1, 205.12)).toBe(1);
  });

  it('should derive 100 for a 100-yen quote', () => {
    expect(deriveQuotedUnit(872.3, 100, 872.3)).toBe(100);
    expect(deriveQuotedUnit(872.3, 1, 8.723)).toBe(100);
  });

  it('should return null when the calculator holds a stale currency', () => {
    // 엔화(100엔=872.22)가 남은 계산기로 유로 고시가를 역산하면 어떤 단위에도 맞지 않는다.
    expect(deriveQuotedUnit(1576.13, 100, 872.22)).toBeNull();
  });

  it('should return null when the calculator is not filled in yet', () => {
    expect(deriveQuotedUnit(205.12, null, null)).toBeNull();
    expect(deriveQuotedUnit(205.12, 0, 0)).toBeNull();
    expect(deriveQuotedUnit(null, 1, 205.12)).toBeNull();
  });
});

describe('toQuote()', () => {
  const base = { currency: 'CNY', provider: 'naver', url: 'https://example.test' } as const;

  it('should normalize the rate to a single unit', () => {
    const quote = toQuote({
      currency: 'JPY',
      provider: 'daum',
      url: 'https://example.test',
      raw: '872.30',
      quotedUnit: 100,
    });
    expect(quote).toMatchObject({
      currency: 'JPY',
      base: 'KRW',
      rate: 8.723,
      quotedRate: 872.3,
      quotedUnit: 100,
      raw: '872.30',
      provider: 'daum',
    });
  });

  it('should default to a single unit', () => {
    expect(toQuote({ ...base, raw: ' 205.12 ' })).toMatchObject({
      rate: 205.12,
      quotedUnit: 1,
      raw: '205.12',
    });
  });

  it('should stamp an ISO timestamp', () => {
    const quote = toQuote({ ...base, raw: '205.12' });
    expect(new Date(quote!.fetchedAt).toISOString()).toBe(quote!.fetchedAt);
  });

  it('should return null for a placeholder or non-positive value', () => {
    expect(toQuote({ ...base, raw: '-' })).toBeNull();
    expect(toQuote({ ...base, raw: '0.00' })).toBeNull();
    expect(toQuote({ ...base, raw: null })).toBeNull();
  });
});
