import { describe, expect, it } from '@rstest/core';
import { textOf } from '@/common';
import { z } from 'zod';
import {
  systemBatteryTool,
  systemCpuTool,
  systemDiskTool,
  systemInfoTool,
  systemMemoryTool,
  tools,
} from '@/tools/system';
import {
  DEFAULT_CPU_SAMPLE_MS,
  DEFAULT_TIMEOUT_MS,
  MIN_CPU_SAMPLE_MS,
  SECTIONS,
} from '@/system/index';

/** 기본값으로 도구를 돌리고 JSON을 돌려준다. */
async function run(tool: typeof systemCpuTool, input: Record<string, unknown> = {}) {
  const parsed = z.object(tool.inputSchema).parse(input);
  return JSON.parse(textOf(await tool.handler(parsed)));
}

describe('tool definitions', () => {
  it('should expose the four per-section tools and the combined one', () => {
    expect(Object.keys(tools)).toEqual([
      'systemBatteryTool',
      'systemMemoryTool',
      'systemCpuTool',
      'systemDiskTool',
      'systemInfoTool',
    ]);
    expect(systemBatteryTool.name).toBe('system_battery');
    expect(systemMemoryTool.name).toBe('system_memory');
    expect(systemCpuTool.name).toBe('system_cpu');
    expect(systemDiskTool.name).toBe('system_disk');
    expect(systemInfoTool.name).toBe('system_info');
  });

  it('should run with no arguments at all', () => {
    for (const tool of [systemBatteryTool, systemMemoryTool, systemCpuTool, systemDiskTool]) {
      expect(z.object(tool.inputSchema).parse({})).toMatchObject({
        timeoutMs: DEFAULT_TIMEOUT_MS,
      });
    }
  });

  it('should default the combined tool to every section', () => {
    expect(z.object(systemInfoTool.inputSchema).parse({})).toMatchObject({
      sections: [...SECTIONS],
      sampleMs: DEFAULT_CPU_SAMPLE_MS,
      allDisks: false,
      timeoutMs: DEFAULT_TIMEOUT_MS,
    });
  });

  // 하한보다 짧은 구간은 부팅 이후 평균을 돌려주므로 스키마에서 막는다.
  it('should reject a sample window below the floor', () => {
    const schema = z.object(systemCpuTool.inputSchema);
    expect(() => schema.parse({ sampleMs: MIN_CPU_SAMPLE_MS - 1 })).toThrow();
    expect(() => schema.parse({ sampleMs: 250.5 })).toThrow();
    expect(schema.parse({ sampleMs: MIN_CPU_SAMPLE_MS }).sampleMs).toBe(MIN_CPU_SAMPLE_MS);
  });

  it('should reject a timeout that is not a positive integer', () => {
    const schema = z.object(systemMemoryTool.inputSchema);
    expect(() => schema.parse({ timeoutMs: 0 })).toThrow();
    expect(() => schema.parse({ timeoutMs: -1 })).toThrow();
  });

  it('should reject an unknown section', () => {
    const schema = z.object(systemInfoTool.inputSchema);
    expect(() => schema.parse({ sections: ['gpu'] })).toThrow();
  });
});

// 이 기계에서 바로 읽는다. 네트워크도 브라우저도 타지 않으므로 기본 실행에 둔다.
describe('handlers', () => {
  it('should report memory usage in bytes and percent', async () => {
    const body = await run(systemMemoryTool);

    expect(body.totalBytes).toBeGreaterThan(0);
    expect(body.usedBytes).toBeLessThanOrEqual(body.totalBytes);
    expect(body.usedPercent).toBeGreaterThanOrEqual(0);
    expect(body.usedPercent).toBeLessThanOrEqual(100);
    expect(body.swap === null || body.swap.totalBytes > 0).toBe(true);
  });

  it('should report CPU usage over the requested sample window', async () => {
    const body = await run(systemCpuTool, { sampleMs: MIN_CPU_SAMPLE_MS });

    expect(body.sampleMs).toBe(MIN_CPU_SAMPLE_MS);
    expect(body.cores).toBeGreaterThan(0);
    expect(body.perCorePercent).toHaveLength(body.cores);
    expect(body.usagePercent).toBeGreaterThanOrEqual(0);
    expect(body.usagePercent).toBeLessThanOrEqual(100);
  });

  it('should report one volume by default and more with allDisks', async () => {
    const primary = await run(systemDiskTool);
    expect(primary).toHaveLength(1);
    expect(primary[0].totalBytes).toBeGreaterThan(0);
    expect(primary[0].mount).toBeTruthy();

    const all = await run(systemDiskTool, { allDisks: true });
    expect(all.length).toBeGreaterThanOrEqual(primary.length);
  });

  // CI 러너에는 배터리가 없다. 배터리가 없는 기계는 null이어야 한다.
  it('should report the battery state or null', async () => {
    const body = await run(systemBatteryTool);

    if (body === null) return;
    expect(body.percent).toBeGreaterThanOrEqual(0);
    expect(body.percent).toBeLessThanOrEqual(100);
    expect(['ac', 'battery']).toContain(body.powerSource);
    expect(typeof body.isCharging).toBe('boolean');
  });

  it('should return only the requested sections', async () => {
    const body = await run(systemInfoTool, { sections: ['memory'] });

    expect(Object.keys(body)).toEqual(['collectedAt', 'memory']);
    expect(Date.parse(body.collectedAt)).not.toBeNaN();
  });

  it('should read every section in one call', async () => {
    const body = await run(systemInfoTool, { sampleMs: MIN_CPU_SAMPLE_MS });

    expect(body.errors).toBeUndefined();
    expect(body.memory.totalBytes).toBeGreaterThan(0);
    expect(body.cpu.cores).toBeGreaterThan(0);
    expect(Array.isArray(body.disks)).toBe(true);
  });

  // 도구 호출 하나가 읽기에 실패해도 예외 대신 한 줄이 돌아와야 한다.
  it('should answer with an Error line when a read cannot finish', async () => {
    const parsed = z.object(systemDiskTool.inputSchema).parse({ timeoutMs: 1 });
    const output = textOf(await systemDiskTool.handler(parsed));

    if (output.startsWith('Error: ')) {
      expect(output).toContain('disk');
    } else {
      expect(Array.isArray(JSON.parse(output))).toBe(true);
    }
  });
});
