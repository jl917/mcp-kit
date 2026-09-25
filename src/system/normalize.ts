import type { Systeminformation } from 'systeminformation';
import type { BatteryInfo, CpuLoadInfo, DiskUsage, MemoryInfo, SwapInfo } from './types';

/**
 * macOS에서 사용자 데이터가 올라가는 APFS 볼륨.
 *
 * 경로는 APFS 볼륨 역할 분리(macOS 10.15)와 함께 고정된 이름입니다.
 */
const MACOS_DATA_MOUNT = '/System/Volumes/Data';

/** 자릿수를 맞춥니다. 값이 수가 아니면 `0`. */
export function roundTo(value: number, digits: number): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/** 비율을 0~100 사이 소수 첫째 자리로 맞춥니다. */
export function toPercent(value: number): number {
  return Math.min(100, Math.max(0, roundTo(value, 1)));
}

/** 바이트 수를 음수 없는 정수로 맞춥니다. */
export function toBytes(value: number): number {
  return Math.max(0, Math.round(Number.isFinite(value) ? value : 0));
}

/** 값을 읽지 못했다는 뜻의 `0`·`-1`을 `null`로 바꿉니다. */
function positiveOrNull(value: number): number | null {
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** 채우지 못한 문자열 필드를 `null`로 바꿉니다. */
function textOrNull(value: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * 배터리 정보를 정리합니다.
 *
 * @returns 배터리가 없는 기계면 `null`
 */
export function toBatteryInfo(raw: Systeminformation.BatteryData): BatteryInfo | null {
  if (!raw.hasBattery) return null;

  // 설계 용량 대비 최대 용량은 100을 넘길 수 있어 다른 비율과 달리 자르지 않습니다.
  const healthPercent =
    raw.designedCapacity > 0 && raw.maxCapacity > 0
      ? roundTo((raw.maxCapacity / raw.designedCapacity) * 100, 1)
      : null;

  return {
    percent: toPercent(raw.percent),
    isCharging: raw.isCharging,
    powerSource: raw.acConnected ? 'ac' : 'battery',
    timeRemainingMin: positiveOrNull(raw.timeRemaining),
    cycleCount: positiveOrNull(raw.cycleCount),
    healthPercent,
    type: textOrNull(raw.type),
    model: textOrNull(raw.model),
  };
}

/** 메모리 사용량을 정리합니다. */
export function toMemoryInfo(raw: Systeminformation.MemData): MemoryInfo {
  const totalBytes = toBytes(raw.total);
  // macOS·Linux의 `used`는 캐시와 버퍼까지 포함해서, 여유가 충분한 기계도 90%대로
  // 보입니다. 회수할 수 없는 실제 사용량은 `active`이므로 이 값을 씁니다.
  const usedBytes = toBytes(raw.active);

  return {
    totalBytes,
    usedBytes,
    availableBytes: toBytes(raw.available),
    usedPercent: totalBytes > 0 ? toPercent((usedBytes / totalBytes) * 100) : 0,
    cachedBytes: toBytes(raw.buffcache),
    swap: toSwapInfo(raw),
  };
}

/** 스왑을 쓰지 않는 환경이면 `null`. */
function toSwapInfo(raw: Systeminformation.MemData): SwapInfo | null {
  const totalBytes = toBytes(raw.swaptotal);
  if (totalBytes === 0) return null;

  const usedBytes = toBytes(raw.swapused);
  return {
    totalBytes,
    usedBytes,
    usedPercent: toPercent((usedBytes / totalBytes) * 100),
  };
}

/** CPU 부하를 정리합니다. `sampleMs`는 이 값을 뜬 표본 구간입니다. */
export function toCpuLoadInfo(
  raw: Systeminformation.CurrentLoadData,
  sampleMs: number,
): CpuLoadInfo {
  return {
    usagePercent: toPercent(raw.currentLoad),
    userPercent: toPercent(raw.currentLoadUser),
    systemPercent: toPercent(raw.currentLoadSystem),
    cores: raw.cpus.length,
    perCorePercent: raw.cpus.map((cpu) => toPercent(cpu.load)),
    // Windows는 부하 평균을 내지 않아 0이 올라옵니다. 0을 그대로 두면 "한가한
    // 기계"로 읽히므로 값이 없다는 뜻의 null로 바꿉니다.
    loadAveragePerCore: raw.avgLoad > 0 ? roundTo(raw.avgLoad, 2) : null,
    sampleMs,
  };
}

/** 파일 시스템 하나의 용량을 정리합니다. */
export function toDiskUsage(raw: Systeminformation.FsSizeData): DiskUsage {
  const usedBytes = toBytes(raw.used);
  const availableBytes = toBytes(raw.available);
  // `df`와 같은 기준으로 셉니다. `size`에는 예약 블록이 섞여 있어 그대로 나누면
  // 사용률이 실제보다 낮게 나옵니다.
  const claimed = usedBytes + availableBytes;

  return {
    mount: raw.mount,
    fs: raw.fs,
    type: raw.type,
    totalBytes: toBytes(raw.size),
    usedBytes,
    availableBytes,
    usedPercent: claimed > 0 ? toPercent((usedBytes / claimed) * 100) : 0,
  };
}

/**
 * "디스크 용량이 얼마나 남았는지"에 답하는 볼륨 하나를 고릅니다.
 *
 * macOS는 APFS 컨테이너 하나를 여러 볼륨으로 쪼개 마운트하고 `/`에는 읽기 전용
 * 시스템 스냅샷만 올립니다. `/`를 그대로 읽으면 사용률이 3% 남짓으로 나오므로
 * 사용자 데이터가 쌓이는 데이터 볼륨을 먼저 찾습니다. Windows는 작업 디렉터리가
 * 놓인 드라이브를, 그 밖의 환경은 `/`를 씁니다.
 *
 * @returns 마운트된 파일 시스템이 없으면 `null`
 */
export function pickPrimaryDisk(
  entries: readonly Systeminformation.FsSizeData[],
  platform: string = process.platform,
  cwd: string = process.cwd(),
): Systeminformation.FsSizeData | null {
  if (entries.length === 0) return null;

  const at = (mount: string) => entries.find((entry) => entry.mount === mount);

  if (platform === 'darwin') {
    const data = at(MACOS_DATA_MOUNT);
    if (data) return data;
  }

  if (platform === 'win32') {
    const drive = cwd.slice(0, 2).toUpperCase();
    const onDrive = entries.find((entry) => entry.mount.toUpperCase() === drive);
    if (onDrive) return onDrive;
  }

  return at('/') ?? largest(entries);
}

/** 고를 기준이 없으면 가장 큰 볼륨을 씁니다. */
function largest(
  entries: readonly Systeminformation.FsSizeData[],
): Systeminformation.FsSizeData | null {
  return entries.reduce<Systeminformation.FsSizeData | null>(
    (best, entry) => (best === null || entry.size > best.size ? entry : best),
    null,
  );
}
