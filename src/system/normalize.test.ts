import { describe, expect, it } from '@rstest/core';
import type { Systeminformation } from 'systeminformation';
import {
  pickPrimaryDisk,
  roundTo,
  toBatteryInfo,
  toBytes,
  toCpuLoadInfo,
  toDiskUsage,
  toMemoryInfo,
  toPercent,
} from './normalize';

function batteryData(
  overrides: Partial<Systeminformation.BatteryData> = {},
): Systeminformation.BatteryData {
  return {
    hasBattery: true,
    cycleCount: 149,
    isCharging: false,
    voltage: 12.5,
    designedCapacity: 110_536,
    maxCapacity: 102_907,
    currentCapacity: 99_818,
    capacityUnit: 'mWh',
    percent: 100,
    timeRemaining: 555,
    acConnected: false,
    type: 'Li-ion',
    model: 'bq40z651',
    manufacturer: 'SMP',
    serial: '0123',
    ...overrides,
  };
}

function memData(overrides: Partial<Systeminformation.MemData> = {}): Systeminformation.MemData {
  return {
    total: 34_359_738_368,
    free: 1_647_378_432,
    used: 32_712_359_936,
    active: 24_105_795_584,
    available: 10_253_942_784,
    buffcache: 8_606_564_352,
    buffers: 0,
    cached: 0,
    slab: 0,
    reclaimable: 0,
    swaptotal: 9_663_676_416,
    swapused: 8_689_224_253.44,
    swapfree: 974_452_162.56,
    writeback: null,
    dirty: null,
    ...overrides,
  };
}

function cpuCore(load: number): Systeminformation.CurrentLoadCpuData {
  return {
    load,
    loadUser: load,
    loadSystem: 0,
    loadNice: 0,
    loadIdle: 100 - load,
    loadIrq: 0,
    loadSteal: 0,
    loadGuest: 0,
    rawLoad: 0,
    rawLoadUser: 0,
    rawLoadSystem: 0,
    rawLoadNice: 0,
    rawLoadIdle: 0,
    rawLoadIrq: 0,
    rawLoadSteal: 0,
    rawLoadGuest: 0,
  };
}

function loadData(
  overrides: Partial<Systeminformation.CurrentLoadData> = {},
): Systeminformation.CurrentLoadData {
  return {
    avgLoad: 0.45,
    currentLoad: 28.477_123,
    currentLoadUser: 18.874,
    currentLoadSystem: 9.603,
    currentLoadNice: 0,
    currentLoadIdle: 71.523,
    currentLoadIrq: 0,
    currentLoadSteal: 0,
    currentLoadGuest: 0,
    rawCurrentLoad: 0,
    rawCurrentLoadUser: 0,
    rawCurrentLoadSystem: 0,
    rawCurrentLoadNice: 0,
    rawCurrentLoadIdle: 0,
    rawCurrentLoadIrq: 0,
    rawCurrentLoadSteal: 0,
    rawCurrentLoadGuest: 0,
    cpus: [cpuCore(30), cpuCore(20)],
    ...overrides,
  };
}

function fsData(
  overrides: Partial<Systeminformation.FsSizeData> = {},
): Systeminformation.FsSizeData {
  return {
    fs: '/dev/disk3s1',
    type: 'APFS',
    size: 994_662_584_320,
    used: 515_840_303_104,
    available: 442_990_383_104,
    use: 53.8,
    mount: '/System/Volumes/Data',
    rw: true,
    ...overrides,
  };
}

describe('number helpers', () => {
  it('should round to the requested digits and fall back to 0 for non-numbers', () => {
    expect(roundTo(1.234_5, 2)).toBe(1.23);
    expect(roundTo(Number.NaN, 1)).toBe(0);
    expect(roundTo(Number.POSITIVE_INFINITY, 1)).toBe(0);
  });

  it('should clamp percentages into 0-100', () => {
    expect(toPercent(28.477_123)).toBe(28.5);
    expect(toPercent(-3)).toBe(0);
    expect(toPercent(120)).toBe(100);
  });

  it('should keep byte counts whole and non-negative', () => {
    expect(toBytes(8_689_224_253.44)).toBe(8_689_224_253);
    expect(toBytes(-1)).toBe(0);
    expect(toBytes(Number.NaN)).toBe(0);
  });
});

describe('toBatteryInfo', () => {
  it('should return null for a machine without a battery', () => {
    expect(toBatteryInfo(batteryData({ hasBattery: false }))).toBeNull();
  });

  it('should report running on battery when the adapter is unplugged', () => {
    expect(toBatteryInfo(batteryData())).toMatchObject({
      percent: 100,
      isCharging: false,
      powerSource: 'battery',
      timeRemainingMin: 555,
      cycleCount: 149,
      type: 'Li-ion',
      model: 'bq40z651',
    });
  });

  // 완충 상태로 꽂아 둔 기계는 전원이 ac이면서 충전 중은 아니다.
  it('should separate the power source from whether it is charging', () => {
    const plugged = toBatteryInfo(batteryData({ acConnected: true, isCharging: false }));
    expect(plugged).toMatchObject({ powerSource: 'ac', isCharging: false });
  });

  it('should compute health from the designed capacity', () => {
    expect(toBatteryInfo(batteryData())?.healthPercent).toBe(93.1);
  });

  // 최대 용량이 설계 용량을 넘기는 배터리가 있어 건강도는 100에서 자르지 않는다.
  it('should leave health above 100 alone', () => {
    const info = toBatteryInfo(batteryData({ designedCapacity: 100, maxCapacity: 105 }));
    expect(info?.healthPercent).toBe(105);
  });

  it('should treat unreadable capacity as unknown health', () => {
    expect(toBatteryInfo(batteryData({ designedCapacity: 0 }))?.healthPercent).toBeNull();
  });

  // systeminformation은 모르는 값을 0이나 -1로 채운다. 그대로 두면 "0분 남음",
  // "사이클 0회"라는 틀린 사실이 된다.
  it.each([
    ['timeRemaining', { timeRemaining: -1 }],
    ['timeRemaining', { timeRemaining: 0 }],
  ])('should map an unreadable %s to null', (_field, overrides) => {
    expect(toBatteryInfo(batteryData(overrides))?.timeRemainingMin).toBeNull();
  });

  it('should map an unreadable cycle count to null', () => {
    expect(toBatteryInfo(batteryData({ cycleCount: 0 }))?.cycleCount).toBeNull();
  });

  it('should map blank text fields to null', () => {
    const info = toBatteryInfo(batteryData({ type: '', model: '  ' }));
    expect(info).toMatchObject({ type: null, model: null });
  });
});

describe('toMemoryInfo', () => {
  // `used`는 캐시와 버퍼까지 포함해서 여유가 있는 기계도 95%로 보인다. 회수할 수
  // 없는 실제 사용량은 `active`이므로 이 값으로 세야 한다.
  it('should count active memory as used, not the cache-inclusive figure', () => {
    const info = toMemoryInfo(memData());

    expect(info.usedBytes).toBe(24_105_795_584);
    expect(info.usedPercent).toBe(70.2);
    expect(info.cachedBytes).toBe(8_606_564_352);
  });

  it('should keep the available figure as reported', () => {
    expect(toMemoryInfo(memData()).availableBytes).toBe(10_253_942_784);
  });

  it('should round the fractional swap figure', () => {
    expect(toMemoryInfo(memData()).swap).toEqual({
      totalBytes: 9_663_676_416,
      usedBytes: 8_689_224_253,
      usedPercent: 89.9,
    });
  });

  it('should report no swap when the machine has none', () => {
    expect(toMemoryInfo(memData({ swaptotal: 0, swapused: 0 })).swap).toBeNull();
  });

  it('should not divide by a zero total', () => {
    expect(toMemoryInfo(memData({ total: 0, active: 0 })).usedPercent).toBe(0);
  });
});

describe('toCpuLoadInfo', () => {
  it('should round the load figures and count the cores', () => {
    expect(toCpuLoadInfo(loadData(), 300)).toEqual({
      usagePercent: 28.5,
      userPercent: 18.9,
      systemPercent: 9.6,
      cores: 2,
      perCorePercent: [30, 20],
      loadAveragePerCore: 0.45,
      sampleMs: 300,
    });
  });

  // Windows는 부하 평균을 내지 않아 0이 올라온다. 0을 그대로 두면 한가한 기계로 읽힌다.
  it('should report an absent load average as null', () => {
    expect(toCpuLoadInfo(loadData({ avgLoad: 0 }), 300).loadAveragePerCore).toBeNull();
  });
});

describe('toDiskUsage', () => {
  // df와 같은 기준으로 센다. size로 나누면 예약 블록 탓에 51.9%가 나와 실제보다 낮다.
  it('should compute usage against used plus available', () => {
    expect(toDiskUsage(fsData())).toEqual({
      mount: '/System/Volumes/Data',
      fs: '/dev/disk3s1',
      type: 'APFS',
      totalBytes: 994_662_584_320,
      usedBytes: 515_840_303_104,
      availableBytes: 442_990_383_104,
      usedPercent: 53.8,
    });
  });

  it('should not divide by a zero volume', () => {
    expect(toDiskUsage(fsData({ size: 0, used: 0, available: 0 })).usedPercent).toBe(0);
  });
});

describe('pickPrimaryDisk', () => {
  const root = fsData({ mount: '/', fs: '/dev/disk3s3s1', used: 12_565_327_872, use: 2.76 });
  const data = fsData();
  const external = fsData({ mount: '/Volumes/Backup', fs: '/dev/disk4s2', size: 1_836_011_520 });

  // macOS의 `/`에는 읽기 전용 시스템 스냅샷만 올라가 사용률이 3% 남짓으로 나온다.
  it('should prefer the macOS data volume over the read-only root', () => {
    expect(pickPrimaryDisk([root, data, external], 'darwin')?.mount).toBe('/System/Volumes/Data');
  });

  it('should fall back to the root when macOS has no data volume', () => {
    expect(pickPrimaryDisk([root, external], 'darwin')?.mount).toBe('/');
  });

  it('should pick the root on Linux', () => {
    expect(pickPrimaryDisk([external, root], 'linux')?.mount).toBe('/');
  });

  it('should pick the drive holding the working directory on Windows', () => {
    const c = fsData({ mount: 'C:' });
    const d = fsData({ mount: 'D:' });
    expect(pickPrimaryDisk([c, d], 'win32', 'd:\\work\\repo')?.mount).toBe('D:');
  });

  it('should fall back to the largest volume when no mount matches', () => {
    const small = fsData({ mount: '/mnt/small', size: 100 });
    const big = fsData({ mount: '/mnt/big', size: 200 });
    expect(pickPrimaryDisk([small, big], 'linux')?.mount).toBe('/mnt/big');
  });

  it('should return null when nothing is mounted', () => {
    expect(pickPrimaryDisk([], 'linux')).toBeNull();
  });
});
