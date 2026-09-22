import type { Locator } from 'playwright';
import { deriveQuotedUnit, parseNumber } from './parse';

const POLL_INTERVAL_MS = 200;

/**
 * 이번 대기에 실제로 쓸 수 있는 시간을 돌려줍니다.
 *
 * 통화를 순회하는 스크레이퍼는 남은 예산과 무관하게 매번 `timeoutMs`를 통째로
 * 기다렸습니다. 그래서 통화가 늘어날수록 이미 버려진 수집이 예산을 한참 넘겨
 * 계속 돌았고, 그동안 Chromium도 붙잡고 있었습니다. 남은 시간으로 잘라 두면
 * 예산이 끝나는 시점에 수집도 같이 멈춥니다.
 *
 * @param deadline - 전체 수집을 끝내야 하는 시각(epoch ms)
 * @returns 남은 시간으로 자른 대기 시간. 예산이 없으면 `0`
 */
export function stepTimeout(timeoutMs: number, deadline: number): number {
  return Math.max(0, Math.min(timeoutMs, deadline - Date.now()));
}

/**
 * 시세 요소가 실제 값을 담을 때까지 기다린 뒤 원본 문자열을 돌려줍니다.
 *
 * 포털이 SPA로 그리는 구간에서는 값이 채워지기 전에 `-`나 `0.00` 같은
 * 자리표시자가 먼저 보입니다. 요소가 나타난 것만으로 값을 읽으면 이런
 * 자리표시자를 시세로 오인하므로, 0보다 큰 숫자가 들어올 때까지 다시 읽습니다.
 *
 * @returns 읽어낸 원본 문자열. 제한 시간 안에 값이 채워지지 않으면 `null`
 */
export async function readRateText(locator: Locator, timeoutMs: number): Promise<string | null> {
  const deadline = Date.now() + timeoutMs;

  try {
    await locator.waitFor({ state: 'attached', timeout: timeoutMs });
  } catch {
    return null;
  }

  while (Date.now() < deadline) {
    const raw = await locator.textContent().catch(() => null);
    const value = parseNumber(raw);
    if (value !== null && value > 0) return raw;
    await locator.page().waitForTimeout(POLL_INTERVAL_MS);
  }

  return null;
}

/**
 * 포털 환율 계산기의 입력 두 칸(외화 / 원화)에서 고시 기준 단위를 읽습니다.
 *
 * 같은 탭에서 통화를 옮겨 다니면 계산기에 직전 통화 값이 잠시 남아 있어
 * 엉뚱한 단위가 나옵니다. 그래서 고시가와 앞뒤가 맞는 단위가 나올 때까지
 * 다시 읽고, 끝내 맞아떨어지지 않으면 1단위 고시로 봅니다.
 *
 * @param inputs - 계산기 입력 칸들을 가리키는 로케이터 (0번 외화, 1번 원화)
 * @param quotedRate - 이미 읽어둔 고시가
 */
export async function readQuotedUnit(
  inputs: Locator,
  quotedRate: number | null,
  timeoutMs: number,
): Promise<number> {
  if (!quotedRate) return 1;

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const unit = await deriveOnce(inputs, quotedRate);
    if (unit !== null) return unit;
    await inputs.page().waitForTimeout(POLL_INTERVAL_MS);
  }

  return 1;
}

async function deriveOnce(inputs: Locator, quotedRate: number): Promise<number | null> {
  try {
    if ((await inputs.count()) < 2) return null;
    return deriveQuotedUnit(
      quotedRate,
      parseNumber(await inputs.nth(0).inputValue()),
      parseNumber(await inputs.nth(1).inputValue()),
    );
  } catch {
    return null;
  }
}
