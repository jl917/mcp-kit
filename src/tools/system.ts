import { defineTool, text, toolDef, type ToolResult } from '@/common';
import { z } from 'zod';
import {
  DEFAULT_CPU_SAMPLE_MS,
  DEFAULT_TIMEOUT_MS,
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

const GUIDELINES = [
  '크기는 모두 바이트, 비율은 모두 퍼센트(0~100)입니다.',
  '읽지 못하면 예외 대신 "Error: ..." 한 줄로 돌아옵니다.',
  '항목이 하나만 필요하면 항목별 도구를, 둘 이상 필요하면 system_info에 sections를 넘겨 한 번에 받습니다.',
];

const BATTERY_GUIDELINES = [
  ...GUIDELINES,
  '배터리가 없는 기계면 null입니다.',
  'powerSource는 어댑터에 꽂혀 있는지, isCharging은 실제로 충전되고 있는지입니다. 완충 상태로 꽂아 두면 powerSource는 "ac", isCharging은 false입니다.',
  'timeRemainingMin은 배터리로 쓰는 동안만 값이 있고 충전 중에는 null입니다.',
];

const MEMORY_GUIDELINES = [
  ...GUIDELINES,
  'usedBytes는 캐시·버퍼를 뺀 값이라 운영체제 도구가 보여 주는 "사용 중"보다 작습니다. 회수 가능한 몫은 cachedBytes에 있습니다.',
  'swap은 스왑을 쓰지 않는 환경에서 null입니다.',
];

const CPU_GUIDELINES = [
  ...GUIDELINES,
  `usagePercent는 표본 구간(sampleMs, 기본 ${DEFAULT_CPU_SAMPLE_MS}ms) 동안의 평균이며 순간값이 아닙니다.`,
  'sampleMs를 늘리면 값이 안정되는 대신 호출이 그만큼 늦어집니다.',
  'loadAveragePerCore는 부하 평균을 내지 않는 Windows에서 null입니다.',
];

const DISK_GUIDELINES = [
  ...GUIDELINES,
  '기본은 용량 질문에 답하는 볼륨 하나입니다. macOS는 사용자 데이터 볼륨(/System/Volumes/Data), 그 밖의 환경은 루트(/)를 고릅니다.',
  'allDisks를 주면 외장 디스크와 시스템 볼륨까지 나옵니다. macOS APFS는 볼륨 여러 개가 컨테이너 하나를 나눠 쓰므로 availableBytes가 서로 겹칩니다.',
  'usedPercent는 df와 같은 기준(usedBytes / (usedBytes + availableBytes))이므로 usedBytes / totalBytes와 다를 수 있습니다.',
];

const timeoutSchema = z
  .number()
  .int()
  .positive()
  .default(DEFAULT_TIMEOUT_MS)
  .describe('항목 하나를 읽는 데 허용할 시간(ms)');

const sampleSchema = z
  .number()
  .int()
  .min(MIN_CPU_SAMPLE_MS)
  .max(5_000)
  .default(DEFAULT_CPU_SAMPLE_MS)
  .describe(`CPU 사용률을 재는 표본 구간(ms). ${MIN_CPU_SAMPLE_MS}ms 미만은 받지 않음`);

const allDisksSchema = z
  .boolean()
  .default(false)
  .describe('true면 마운트된 파일 시스템 전부, false면 기본 디스크 하나만');

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
    typeLabels: { timeoutMs: 'number' },
    returnType: 'BatteryInfo | null',
    returnDescription: '배터리 상태 JSON. 배터리가 없으면 null',
    handler: async ({ timeoutMs }) => json(() => readBattery({ timeoutMs })),
    examples: [
      {
        args: [],
        result:
          '{"percent":100,"isCharging":false,"powerSource":"battery","timeRemainingMin":555,...}',
      },
    ],
    guidelines: BATTERY_GUIDELINES,
  }),

  systemMemoryTool: toolDef({
    name: 'system_memory',
    description: `물리 메모리와 스왑 사용량을 JSON으로 반환합니다. ${MEMORY_SHAPE} 형태이고, usedBytes는 캐시를 뺀 실제 사용량입니다`,
    inputSchema: { timeoutMs: timeoutSchema },
    typeLabels: { timeoutMs: 'number' },
    returnType: 'MemoryInfo',
    returnDescription: '메모리 사용량 JSON. 스왑을 쓰지 않으면 swap은 null',
    handler: async ({ timeoutMs }) => json(() => readMemory({ timeoutMs })),
    examples: [
      {
        args: [],
        result: '{"totalBytes":34359738368,"usedBytes":24105795584,"usedPercent":70.2,...}',
      },
    ],
    guidelines: MEMORY_GUIDELINES,
  }),

  systemCpuTool: toolDef({
    name: 'system_cpu',
    description: `표본 구간 동안의 CPU 사용률을 JSON으로 반환합니다. ${CPU_SHAPE} 형태이고, 코어별 사용률이 perCorePercent에 담깁니다`,
    inputSchema: { sampleMs: sampleSchema, timeoutMs: timeoutSchema },
    typeLabels: { sampleMs: 'number', timeoutMs: 'number' },
    returnType: 'CpuLoadInfo',
    returnDescription: 'CPU 사용률 JSON. 실제로 잰 표본 구간은 sampleMs',
    handler: async ({ sampleMs, timeoutMs }) => json(() => readCpu({ sampleMs, timeoutMs })),
    examples: [
      {
        args: ['500'],
        result: '{"usagePercent":28.5,"userPercent":18.9,"cores":10,"sampleMs":500,...}',
      },
    ],
    guidelines: CPU_GUIDELINES,
  }),

  systemDiskTool: toolDef({
    name: 'system_disk',
    description: `파일 시스템 용량을 JSON 배열로 반환합니다. 항목 하나는 ${DISK_SHAPE} 형태이고, 기본은 용량 질문에 답하는 볼륨 하나입니다`,
    inputSchema: { allDisks: allDisksSchema, timeoutMs: timeoutSchema },
    typeLabels: { allDisks: 'boolean', timeoutMs: 'number' },
    returnType: 'DiskUsage[]',
    returnDescription: '파일 시스템별 용량 JSON 배열. 읽을 볼륨이 없으면 빈 배열',
    handler: async ({ allDisks, timeoutMs }) => json(() => readDisks({ allDisks, timeoutMs })),
    examples: [
      {
        args: [],
        result:
          '[{"mount":"/System/Volumes/Data","totalBytes":994662584320,"availableBytes":442990383104,"usedPercent":53.8,...}]',
      },
      { args: ['true'], result: '[{"mount":"/",...},{"mount":"/Volumes/Backup",...}]' },
    ],
    guidelines: DISK_GUIDELINES,
  }),

  systemInfoTool: toolDef({
    name: 'system_info',
    description:
      '배터리·메모리·CPU·디스크 가운데 요청한 항목을 한 번에 읽어 JSON으로 반환합니다. ' +
      '{ collectedAt, battery, memory, cpu, disks, errors } 형태이고, 요청하지 않은 항목은 필드째 빠집니다',
    inputSchema: {
      sections: z
        .array(z.enum(SECTIONS))
        .default([...SECTIONS])
        .describe('읽을 항목 목록'),
      sampleMs: sampleSchema,
      allDisks: allDisksSchema,
      timeoutMs: timeoutSchema,
    },
    typeLabels: {
      sections: '("battery" | "memory" | "cpu" | "disk")[]',
      sampleMs: 'number',
      allDisks: 'boolean',
      timeoutMs: 'number',
    },
    returnType:
      '{ collectedAt: string, battery?: BatteryInfo | null, memory?: MemoryInfo | null, ' +
      'cpu?: CpuLoadInfo | null, disks?: DiskUsage[] | null, errors?: Record<string, string> }',
    returnDescription: '요청한 항목만 담긴 JSON. 읽지 못한 항목은 null이고 이유가 errors에 담김',
    handler: async ({ sections, sampleMs, allDisks, timeoutMs }) =>
      json(() => readSnapshot({ sections, sampleMs, allDisks, timeoutMs })),
    examples: [
      {
        args: [`'["cpu","memory"]'`],
        result: '{"collectedAt":"2026-09-25T01:15:00.000Z","memory":{...},"cpu":{...}}',
      },
      {
        args: [`'["battery"]'`],
        result: '{"collectedAt":"2026-09-25T01:15:00.000Z","battery":{"percent":100,...}}',
      },
    ],
    guidelines: [
      ...GUIDELINES,
      'sections에 넣은 항목만 응답에 들어갑니다. 넣지 않은 항목은 필드째 빠집니다.',
      '항목은 동시에 읽습니다. 네 항목을 다 물어도 CPU 하나를 물을 때와 걸리는 시간이 비슷합니다.',
      '읽지 못한 항목은 null이 되고 이유가 errors에 담깁니다. errors에 없는 null 배터리는 배터리가 없는 기계입니다.',
    ],
  }),
};

export const systemBatteryTool = defineTool(tools.systemBatteryTool);
export const systemMemoryTool = defineTool(tools.systemMemoryTool);
export const systemCpuTool = defineTool(tools.systemCpuTool);
export const systemDiskTool = defineTool(tools.systemDiskTool);
export const systemInfoTool = defineTool(tools.systemInfoTool);
