import { defineTool, text, toolDef, type ToolResult } from '@/common';
import { z } from 'zod';
import {
  DEFAULT_CPU_SAMPLE_MS,
  DEFAULT_TIMEOUT_MS,
  MAX_CPU_SAMPLE_MS,
  MIN_CPU_SAMPLE_MS,
  readBattery,
  readCpu,
  readDisks,
  readMemory,
  readSnapshot,
  SECTIONS,
} from '@/system/index';

const BATTERY_SHAPE =
  '{ percent, isCharging, powerSource, timeRemainingMin, cycleCount, healthPercent, type, model }';
const MEMORY_SHAPE = '{ totalBytes, usedBytes, availableBytes, usedPercent, cachedBytes, swap }';
const CPU_SHAPE =
  '{ usagePercent, userPercent, systemPercent, cores, perCorePercent, loadAveragePerCore, sampleMs }';
const DISK_SHAPE = '{ mount, fs, type, totalBytes, usedBytes, availableBytes, usedPercent }';

/**
 * 도구 다섯 개가 공유하는 입력 스키마.
 *
 * OpenAI 도구 스키마는 `default`·`minimum`·`maximum`을 받지 않고 모든 필드가
 * `required`여야 하므로, 값을 비우는 뜻은 `null`로만 나타냅니다. 기본값과 범위는
 * `describe()`로 모델에 알리고 적용은 `@/system`이 맡습니다.
 */
const timeoutSchema = z
  .number()
  .nullable()
  .describe(`항목 하나를 읽는 데 허용할 시간(ms). null이거나 0 이하면 ${DEFAULT_TIMEOUT_MS}`);

const sampleSchema = z
  .number()
  .nullable()
  .describe(
    `CPU 사용률을 재는 표본 구간(ms). null이면 ${DEFAULT_CPU_SAMPLE_MS}이고, ` +
      `${MIN_CPU_SAMPLE_MS}~${MAX_CPU_SAMPLE_MS} 밖의 값은 그 범위로 끊음`,
  );

const allDisksSchema = z
  .boolean()
  .nullable()
  .describe('true면 마운트된 파일 시스템 전부, false나 null이면 기본 디스크 하나만');

/** 도구 다섯 개가 같은 형태로 답하도록 직렬화와 실패 처리를 한곳에 둡니다. */
async function json(read: () => Promise<unknown>): Promise<ToolResult> {
  try {
    return text(JSON.stringify(await read(), null, 2));
  } catch (err) {
    return text(`Error: ${(err as Error).message}`);
  }
}

export const tools = {
  systemBatteryTool: toolDef({
    name: 'system_battery',
    description: `배터리 잔량과 전원 상태를 JSON으로 반환합니다. ${BATTERY_SHAPE} 형태이고, 배터리가 없는 기계면 null입니다`,
    inputSchema: { timeoutMs: timeoutSchema },
    handler: async ({ timeoutMs }) =>
      json(() => readBattery({ timeoutMs: timeoutMs ?? undefined })),
  }),

  systemMemoryTool: toolDef({
    name: 'system_memory',
    description: `물리 메모리와 스왑 사용량을 JSON으로 반환합니다. ${MEMORY_SHAPE} 형태이고, usedBytes는 캐시를 뺀 실제 사용량입니다`,
    inputSchema: { timeoutMs: timeoutSchema },
    handler: async ({ timeoutMs }) => json(() => readMemory({ timeoutMs: timeoutMs ?? undefined })),
  }),

  systemCpuTool: toolDef({
    name: 'system_cpu',
    description: `표본 구간 동안의 CPU 사용률을 JSON으로 반환합니다. ${CPU_SHAPE} 형태이고, 코어별 사용률이 perCorePercent에 담깁니다`,
    inputSchema: { sampleMs: sampleSchema, timeoutMs: timeoutSchema },
    handler: async ({ sampleMs, timeoutMs }) =>
      json(() => readCpu({ sampleMs: sampleMs ?? undefined, timeoutMs: timeoutMs ?? undefined })),
  }),

  systemDiskTool: toolDef({
    name: 'system_disk',
    description: `파일 시스템 용량을 JSON 배열로 반환합니다. 항목 하나는 ${DISK_SHAPE} 형태이고, 기본은 용량 질문에 답하는 볼륨 하나입니다`,
    inputSchema: { allDisks: allDisksSchema, timeoutMs: timeoutSchema },
    handler: async ({ allDisks, timeoutMs }) =>
      json(() => readDisks({ allDisks: allDisks ?? undefined, timeoutMs: timeoutMs ?? undefined })),
  }),

  systemInfoTool: toolDef({
    name: 'system_info',
    description:
      '배터리·메모리·CPU·디스크 가운데 요청한 항목을 한 번에 읽어 JSON으로 반환합니다. ' +
      '{ collectedAt, battery, memory, cpu, disks, errors } 형태이고, 요청하지 않은 항목은 필드째 빠집니다',
    inputSchema: {
      sections: z
        .array(z.enum(SECTIONS))
        .nullable()
        .describe(`읽을 항목 목록. null이면 ${SECTIONS.join('·')} 전부`),
      sampleMs: sampleSchema,
      allDisks: allDisksSchema,
      timeoutMs: timeoutSchema,
    },
    handler: async ({ sections, sampleMs, allDisks, timeoutMs }) =>
      json(() =>
        readSnapshot({
          sections: sections ?? undefined,
          sampleMs: sampleMs ?? undefined,
          allDisks: allDisks ?? undefined,
          timeoutMs: timeoutMs ?? undefined,
        }),
      ),
  }),
};

export const systemBatteryTool = defineTool(tools.systemBatteryTool);
export const systemMemoryTool = defineTool(tools.systemMemoryTool);
export const systemCpuTool = defineTool(tools.systemCpuTool);
export const systemDiskTool = defineTool(tools.systemDiskTool);
export const systemInfoTool = defineTool(tools.systemInfoTool);
