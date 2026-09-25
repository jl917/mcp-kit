/** 따로 물어볼 수 있는 시스템 항목. */
export const SECTIONS = ['battery', 'memory', 'cpu', 'disk'] as const;

export type SystemSection = (typeof SECTIONS)[number];

/**
 * CPU 사용률을 재는 기본 표본 구간(ms).
 *
 * 구간이 길수록 값이 안정되지만 그만큼 호출이 늦어집니다. 300ms면 도구 호출
 * 한 번이 체감되지 않는 선에서 순간 부하를 걸러냅니다.
 */
export const DEFAULT_CPU_SAMPLE_MS = 300;

/**
 * 표본 구간의 하한.
 *
 * `systeminformation`은 200ms 안에 다시 물으면 앞선 측정값을 그대로 돌려줍니다.
 * 그보다 짧게 재면 표본 구간이 없는 셈이 되므로 여기서 끊습니다.
 */
export const MIN_CPU_SAMPLE_MS = 200;

/** 항목 하나를 읽는 데 허용할 기본 시간(ms). */
export const DEFAULT_TIMEOUT_MS = 5_000;

/** 배터리 잔량과 전원 상태. */
export interface BatteryInfo {
  /** 남은 용량(%). */
  percent: number;
  /** 충전 중인지. */
  isCharging: boolean;
  /** 지금 쓰는 전원. 어댑터에 꽂혀 있으면 `"ac"`. */
  powerSource: 'ac' | 'battery';
  /** 배터리로 더 쓸 수 있는 시간(분). 충전 중이거나 읽지 못하면 `null`. */
  timeRemainingMin: number | null;
  /** 충전 사이클 수. 읽지 못하면 `null`. */
  cycleCount: number | null;
  /** 설계 용량 대비 현재 최대 용량(%). 100에서 멀어질수록 노화된 배터리. */
  healthPercent: number | null;
  type: string | null;
  model: string | null;
}

/** 스왑 사용량. */
export interface SwapInfo {
  totalBytes: number;
  usedBytes: number;
  usedPercent: number;
}

/** 물리 메모리 사용량. */
export interface MemoryInfo {
  totalBytes: number;
  /** 실제로 쓰고 있는 양. 캐시·버퍼는 빼고 셉니다. */
  usedBytes: number;
  /** 새 할당에 바로 내줄 수 있는 양. */
  availableBytes: number;
  /** `totalBytes` 대비 `usedBytes`(%). */
  usedPercent: number;
  /** 캐시·버퍼가 잡고 있는 양. 필요해지면 회수됩니다. */
  cachedBytes: number;
  /** 스왑을 쓰지 않는 환경이면 `null`. */
  swap: SwapInfo | null;
}

/** 표본 구간 동안의 CPU 사용률. */
export interface CpuLoadInfo {
  /** 표본 구간 동안의 사용률(%). */
  usagePercent: number;
  /** 사용률 중 사용자 코드 몫(%). */
  userPercent: number;
  /** 사용률 중 커널 몫(%). */
  systemPercent: number;
  /** 논리 코어 수. */
  cores: number;
  /** 코어별 사용률(%). */
  perCorePercent: number[];
  /** 코어 하나로 환산한 부하 평균. Windows는 값이 없어 `null`. */
  loadAveragePerCore: number | null;
  /** 실제로 잰 표본 구간(ms). */
  sampleMs: number;
}

/** 파일 시스템 하나의 용량. */
export interface DiskUsage {
  /** 마운트 지점. */
  mount: string;
  /** 장치 이름. */
  fs: string;
  /** 파일 시스템 종류. */
  type: string;
  /** 볼륨 전체 크기. */
  totalBytes: number;
  usedBytes: number;
  /** 지금 더 쓸 수 있는 양. */
  availableBytes: number;
  /** `usedBytes / (usedBytes + availableBytes)`(%). `df`와 같은 기준. */
  usedPercent: number;
}

/**
 * 여러 항목을 한 번에 읽은 결과.
 *
 * 요청하지 않은 항목은 필드째 빠지고, 읽지 못한 항목은 `null`로 남으면서
 * 이유가 `errors`에 들어갑니다. 즉 `null`이면서 `errors`에 없는 배터리는
 * 배터리가 없는 기계라는 뜻입니다.
 */
export interface SystemSnapshot {
  collectedAt: string;
  battery?: BatteryInfo | null;
  memory?: MemoryInfo | null;
  cpu?: CpuLoadInfo | null;
  disks?: DiskUsage[] | null;
  /** 읽지 못한 항목과 그 이유. 전부 읽었으면 빠집니다. */
  errors?: Partial<Record<SystemSection, string>>;
}
