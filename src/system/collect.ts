import * as si from 'systeminformation';
import {
  pickPrimaryDisk,
  toBatteryInfo,
  toCpuLoadInfo,
  toDiskUsage,
  toMemoryInfo,
} from './normalize';
import {
  DEFAULT_CPU_SAMPLE_MS,
  DEFAULT_TIMEOUT_MS,
  MIN_CPU_SAMPLE_MS,
  SECTIONS,
  type BatteryInfo,
  type CpuLoadInfo,
  type DiskUsage,
  type MemoryInfo,
  type SystemSection,
  type SystemSnapshot,
} from './types';

export interface ReadOptions {
  /** 항목 하나를 읽는 데 허용할 시간(ms). */
  timeoutMs?: number;
}

export interface CpuReadOptions extends ReadOptions {
  /** CPU 사용률을 재는 표본 구간(ms). */
  sampleMs?: number;
}

export interface DiskReadOptions extends ReadOptions {
  /** 마운트된 파일 시스템을 모두 담을지. 기본은 기본 디스크 하나. */
  allDisks?: boolean;
}

export interface SnapshotOptions extends CpuReadOptions, DiskReadOptions {
  /** 읽을 항목. 비우면 전부 읽습니다. */
  sections?: readonly SystemSection[];
}

/**
 * 배터리 잔량과 전원 상태를 읽습니다.
 *
 * @returns 배터리가 없는 기계면 `null`
 */
export async function readBattery(options: ReadOptions = {}): Promise<BatteryInfo | null> {
  return toBatteryInfo(await withTimeout(si.battery(), timeoutOf(options), 'battery'));
}

/** 물리 메모리와 스왑 사용량을 읽습니다. */
export async function readMemory(options: ReadOptions = {}): Promise<MemoryInfo> {
  return toMemoryInfo(await withTimeout(si.mem(), timeoutOf(options), 'memory'));
}

/**
 * CPU 사용률을 읽습니다. 표본을 두 번 떠서 그 사이 구간만 셉니다.
 *
 * `systeminformation`은 앞선 호출과의 차이로 사용률을 내므로 첫 호출은 부팅 이후
 * 평균이 됩니다. 한 번 눌러 기준점을 잡고 `sampleMs`를 기다린 뒤 다시 읽어야
 * "지금 몇 %"에 답하는 값이 나옵니다.
 */
export async function readCpu(options: CpuReadOptions = {}): Promise<CpuLoadInfo> {
  const sampleMs = Math.max(options.sampleMs ?? DEFAULT_CPU_SAMPLE_MS, MIN_CPU_SAMPLE_MS);
  const timeoutMs = timeoutOf(options);

  await withTimeout(si.currentLoad(), timeoutMs, 'cpu');
  await delay(sampleMs);

  return toCpuLoadInfo(await withTimeout(si.currentLoad(), timeoutMs, 'cpu'), sampleMs);
}

/**
 * 파일 시스템 용량을 읽습니다.
 *
 * 기본은 용량 질문에 답하는 볼륨 하나만 담습니다. `allDisks`를 주면 외장 디스크와
 * 시스템 볼륨까지 마운트된 것을 모두 담습니다.
 */
export async function readDisks(options: DiskReadOptions = {}): Promise<DiskUsage[]> {
  const entries = await withTimeout(si.fsSize(), timeoutOf(options), 'disk');
  if (options.allDisks) return entries.map(toDiskUsage);

  const primary = pickPrimaryDisk(entries);
  return primary ? [toDiskUsage(primary)] : [];
}

/**
 * 요청한 항목을 한 번에 읽습니다.
 *
 * 항목끼리 의존이 없어 동시에 읽습니다. 가장 오래 걸리는 항목은 표본 구간을
 * 기다리는 CPU이므로, 네 항목을 다 물어도 전체 시간은 CPU 하나를 물을 때와
 * 비슷합니다. 한 항목이 실패해도 나머지는 그대로 돌아오고, 실패한 항목은
 * `null`로 남으면서 이유가 `errors`에 들어갑니다.
 */
export async function readSnapshot(options: SnapshotOptions = {}): Promise<SystemSnapshot> {
  const sections = new Set(options.sections ?? SECTIONS);
  const errors: Partial<Record<SystemSection, string>> = {};
  const wanted = <T>(section: SystemSection, read: () => Promise<T>) =>
    sections.has(section) ? attempt(section, read, errors) : undefined;

  const [battery, memory, cpu, disks] = await Promise.all([
    wanted('battery', () => readBattery(options)),
    wanted('memory', () => readMemory(options)),
    wanted('cpu', () => readCpu(options)),
    wanted('disk', () => readDisks(options)),
  ]);

  const snapshot: SystemSnapshot = {
    collectedAt: new Date().toISOString(),
    battery,
    memory,
    cpu,
    disks,
  };
  if (Object.keys(errors).length > 0) snapshot.errors = errors;

  return snapshot;
}

/** 한 항목이 실패해도 나머지를 돌려주려고 실패를 `null`로 접습니다. */
async function attempt<T>(
  section: SystemSection,
  read: () => Promise<T>,
  errors: Partial<Record<SystemSection, string>>,
): Promise<T | null> {
  try {
    return await read();
  } catch (err) {
    errors[section] = err instanceof Error ? err.message : String(err);
    return null;
  }
}

function timeoutOf(options: ReadOptions): number {
  return options.timeoutMs && options.timeoutMs > 0 ? options.timeoutMs : DEFAULT_TIMEOUT_MS;
}

/**
 * 제한 시간을 넘기면 어느 항목이 멈췄는지 밝히는 예외로 끝냅니다.
 *
 * `systeminformation`은 항목마다 외부 명령을 실행합니다. 그 명령이 응답하지
 * 않으면 도구 호출이 영영 끝나지 않으므로 여기서 끊습니다.
 */
async function withTimeout<T>(task: Promise<T>, ms: number, section: SystemSection): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const guard = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out reading ${section} after ${ms}ms`)), ms);
  });

  try {
    return await Promise.race([task, guard]);
  } finally {
    clearTimeout(timer);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
