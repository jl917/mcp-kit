import { beforeEach, describe, expect, it, rs } from '@rstest/core';
import * as si from 'systeminformation';
import type { Systeminformation } from 'systeminformation';
import { readBattery, readCpu, readDisks, readMemory, readSnapshot } from './collect';
import { MIN_CPU_SAMPLE_MS } from './types';

rs.mock('systeminformation', () => ({
  battery: rs.fn(),
  mem: rs.fn(),
  currentLoad: rs.fn(),
  fsSize: rs.fn(),
}));

const mocked = {
  battery: rs.mocked(si.battery),
  mem: rs.mocked(si.mem),
  currentLoad: rs.mocked(si.currentLoad),
  fsSize: rs.mocked(si.fsSize),
};

/** 정리 결과를 따로 검증하므로 여기서는 필드 몇 개만 채운 값을 쓴다. */
function battery(overrides: Partial<Systeminformation.BatteryData> = {}) {
  return {
    hasBattery: true,
    percent: 82,
    isCharging: true,
    acConnected: true,
    timeRemaining: -1,
    cycleCount: 12,
    designedCapacity: 100,
    maxCapacity: 95,
    type: 'Li-ion',
    model: 'test',
    ...overrides,
  } as Systeminformation.BatteryData;
}

function mem() {
  return {
    total: 1000,
    active: 400,
    available: 600,
    buffcache: 100,
    swaptotal: 0,
    swapused: 0,
  } as Systeminformation.MemData;
}

function load(currentLoad: number) {
  return {
    avgLoad: 0.5,
    currentLoad,
    currentLoadUser: currentLoad,
    currentLoadSystem: 0,
    cpus: [{ load: currentLoad }],
  } as Systeminformation.CurrentLoadData;
}

function fs(mount: string, size = 100) {
  return {
    fs: `/dev/${mount}`,
    type: 'APFS',
    size,
    used: 50,
    available: 50,
    use: 50,
    mount,
    rw: true,
  } as Systeminformation.FsSizeData;
}

beforeEach(() => {
  mocked.battery.mockReset().mockResolvedValue(battery());
  mocked.mem.mockReset().mockResolvedValue(mem());
  mocked.currentLoad.mockReset().mockResolvedValue(load(30));
  mocked.fsSize.mockReset().mockResolvedValue([fs('/'), fs('/Volumes/Backup', 50)]);
});

describe('readBattery', () => {
  it('should hand back the normalized battery state', async () => {
    await expect(readBattery()).resolves.toMatchObject({
      percent: 82,
      isCharging: true,
      powerSource: 'ac',
    });
  });

  it('should report null for a machine without a battery', async () => {
    mocked.battery.mockResolvedValue(battery({ hasBattery: false }));
    await expect(readBattery()).resolves.toBeNull();
  });
});

describe('readMemory', () => {
  it('should hand back the normalized memory usage', async () => {
    await expect(readMemory()).resolves.toMatchObject({ usedBytes: 400, usedPercent: 40 });
  });
});

describe('readCpu', () => {
  // 첫 호출은 부팅 이후 평균이라 쓸 수 없다. 기준점을 잡고 표본 구간을 기다린 뒤
  // 다시 읽어야 "지금 몇 %"가 된다.
  it('should sample twice and report the second reading', async () => {
    mocked.currentLoad.mockResolvedValueOnce(load(99)).mockResolvedValueOnce(load(21));

    const info = await readCpu({ sampleMs: MIN_CPU_SAMPLE_MS });

    expect(mocked.currentLoad).toHaveBeenCalledTimes(2);
    expect(info.usagePercent).toBe(21);
    expect(info.sampleMs).toBe(MIN_CPU_SAMPLE_MS);
  });

  // 200ms 안에 다시 물으면 systeminformation이 앞선 값을 그대로 돌려주므로,
  // 더 짧은 구간을 요청받아도 하한까지는 기다린다.
  it('should raise a sample window below the floor', async () => {
    const info = await readCpu({ sampleMs: 10 });
    expect(info.sampleMs).toBe(MIN_CPU_SAMPLE_MS);
  });
});

describe('readDisks', () => {
  it('should return the volume that answers the capacity question', async () => {
    const disks = await readDisks();

    expect(disks).toHaveLength(1);
    expect(disks[0].mount).toBe('/');
  });

  it('should return every mounted filesystem when asked', async () => {
    const disks = await readDisks({ allDisks: true });
    expect(disks.map((disk) => disk.mount)).toEqual(['/', '/Volumes/Backup']);
  });

  it('should return an empty array when nothing is mounted', async () => {
    mocked.fsSize.mockResolvedValue([]);
    await expect(readDisks()).resolves.toEqual([]);
  });
});

describe('readSnapshot', () => {
  it('should read every section by default', async () => {
    const snapshot = await readSnapshot({ sampleMs: MIN_CPU_SAMPLE_MS });

    expect(Object.keys(snapshot)).toEqual(['collectedAt', 'battery', 'memory', 'cpu', 'disks']);
    expect(snapshot.errors).toBeUndefined();
  });

  // 요청하지 않은 항목은 읽지도, 응답에 담지도 않는다.
  it('should skip the sections that were not asked for', async () => {
    const snapshot = await readSnapshot({ sections: ['memory'] });

    expect(snapshot.memory).toMatchObject({ usedPercent: 40 });
    expect(snapshot.battery).toBeUndefined();
    expect(snapshot.cpu).toBeUndefined();
    expect(snapshot.disks).toBeUndefined();
    expect(mocked.battery).not.toHaveBeenCalled();
    expect(mocked.currentLoad).not.toHaveBeenCalled();
    expect(mocked.fsSize).not.toHaveBeenCalled();
  });

  it('should drop unrequested sections from the serialized payload', async () => {
    const snapshot = await readSnapshot({ sections: ['memory'] });
    expect(Object.keys(JSON.parse(JSON.stringify(snapshot)))).toEqual(['collectedAt', 'memory']);
  });

  // 한 항목이 실패해도 나머지는 그대로 돌려준다. 실패한 항목은 null로 남고
  // 이유가 errors에 들어가므로, 배터리가 없는 기계와 구분된다.
  it('should keep the other sections when one fails', async () => {
    mocked.fsSize.mockRejectedValue(new Error('df exited with 1'));

    const snapshot = await readSnapshot({ sections: ['memory', 'disk'] });

    expect(snapshot.memory).toMatchObject({ usedPercent: 40 });
    expect(snapshot.disks).toBeNull();
    expect(snapshot.errors).toEqual({ disk: 'df exited with 1' });
  });

  it('should leave errors out when every section was read', async () => {
    const snapshot = await readSnapshot({ sections: ['memory'] });
    expect('errors' in snapshot).toBe(false);
  });

  // 항목을 차례로 읽으면 네 항목을 다 물을 때 네 배로 늦어진다. 동시에 읽으므로
  // 가장 느린 항목 하나만큼만 걸린다.
  it('should read the sections concurrently', async () => {
    const slow = <T>(value: T) =>
      new Promise<T>((resolve) => setTimeout(() => resolve(value), 150));
    mocked.battery.mockReturnValue(slow(battery()));
    mocked.mem.mockReturnValue(slow(mem()));
    mocked.fsSize.mockReturnValue(slow([fs('/')]));

    const started = Date.now();
    await readSnapshot({ sections: ['battery', 'memory', 'disk'] });

    expect(Date.now() - started).toBeLessThan(450);
  });
});

describe('timeouts', () => {
  // systeminformation은 항목마다 외부 명령을 실행한다. 그 명령이 응답하지 않으면
  // 도구 호출이 영영 끝나지 않으므로 항목 이름을 밝히며 끊는다.
  it('should fail with the section name when a read hangs', async () => {
    mocked.mem.mockReturnValue(new Promise<Systeminformation.MemData>(() => {}));

    await expect(readMemory({ timeoutMs: 50 })).rejects.toThrow(
      'Timed out reading memory after 50ms',
    );
  });

  it('should fold a hung read into the snapshot errors', async () => {
    mocked.fsSize.mockReturnValue(new Promise<Systeminformation.FsSizeData[]>(() => {}));

    const snapshot = await readSnapshot({ sections: ['disk'], timeoutMs: 50 });

    expect(snapshot.disks).toBeNull();
    expect(snapshot.errors?.disk).toContain('Timed out reading disk');
  });
});
