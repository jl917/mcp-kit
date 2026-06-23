# 3. 프로젝트 아키텍처 및 디렉토리 역할

## 최상위 디렉토리 구조

```
mcp-kit/
├── apps/
│   └── site/           # Rspress 문서 사이트 (docs/ + README 동적 페이지)
├── packages/
│   ├── common/         # 공유 키트 (npm 미배포, workspace 제외)
│   ├── core/           # @julong/mono-rele2-core — 핵심 시스템 도구
│   └── utils/          # @julong/mono-rele2-utils — 텍스트/데이터 유틸리티 도구
├── .github/workflows/  # CI/CD 파이프라인
├── package.json        # 루트 설정 (workspace 정의)
├── turbo.json          # Turborepo 태스크 설정
├── tsconfig.json       # 루트 TypeScript 설정
├── release-please-config.json      # release-please 매니페스트 설정 (패키지별 릴리스 구성)
├── .release-please-manifest.json   # 패키지별 현재 버전 추적
├── CLAUDE.md           # AI 어시스턴트용 프로젝트 컨텍스트
└── pnpm-workspace.yaml # 워크스페이스 범위 (common 제외)
```

## 계층별 책임 분리

### `packages/common/` — 공유 키트 (내부 전용, npm 배포 안함)

**pnpm workspace에서 `!packages/common`으로 명시적 제외**되며, 각 패키지의 `tsup.config`에서 `noExternal: /^@common$/`로 처리되어 빌드 시 번들에 포함됩니다.

```
common/
├── kit/
│   ├── tool.ts     # 도구 정의: toolDef(), defineTool(), AnyToolDef 타입, text() 헬퍼
│   ├── server.ts   # MCP 서버: createMcpServer(), startServer()
│   ├── cli.ts      # CLI 실행: runCli(), handleCliError()
│   └── skill.ts    # 문서 생성: generateSkillMarkdown(), generateReadmeSkills()
├── build/
│   ├── tsup.config.mjs       # 공통 tsup 설정 (createTsupConfig)
│   └── update-readme.mjs     # README 생성 스크립트
├── types.ts        # 공통 타입 (Nullable, Optional, MaybePromise)
├── constants.ts    # 공통 상수 (VERSION)
└── index.ts        # 공개 진입점 (kit/* 전체 re-export)
```

### `packages/core/` — @julong/mono-rele2-core

```
core/
├── src/
│   ├── index.ts            # 라이브러리 진입점 (tools + generate* re-export)
│   ├── server.ts           # MCP 서버 진입점 (stdio)
│   ├── cli.ts              # CLI 진입점
│   └── tools/
│       ├── index.ts        # tools re-export
│       └── system.ts       # echoTool, timestampTool, envTool, uuidTool 정의
├── tsup.config.ts          # tsup 설정 (common 설정 재사용)
└── package.json            # 배포용 npm 패키지 설정
```

### `packages/utils/` — @julong/mono-rele2-utils

```
utils/
├── src/
│   ├── index.ts            # 라이브러리 진입점 (cn, tools, generate* re-export)
│   ├── server.ts           # MCP 서버 진입점 (6개 도구 등록)
│   ├── cli.ts              # CLI 진입점
│   ├── cn.ts               # cn() 유틸리티 함수 (classNames 필터링)
│   └── tools/
│       ├── index.ts        # tools re-export (text + deep + user + env 병합)
│       ├── text.ts         # cnTool, caseConvertTool, truncateTool 정의
│       ├── deep.ts         # objectFlattenTool — 중첩 JSON dot-notation 평탄화
│       ├── user.ts         # getUserTool — RandomUser 파싱 및 한글 문장 생성
│       └── env.ts          # envGetTool — MCP client env 변수 조회 + UTILS_ENV_KEYS
├── tsup.config.ts
└── package.json
```

### `apps/site/` — Rspress 문서 사이트

```
site/
├── docs/                    # 정적 마크다운 문서 (01-*.md ~ 10-*.md)
│   ├── index.md             # 홈 페이지 (Rspress hero layout)
│   ├── 01-project-overview.md
│   ├── ...
│   └── 10-commands.md
├── scripts/
│   └── package-docs-plugin.ts  # README → 동적 페이지 변환 플러그인
├── rspress.config.ts        # Rspress 설정 (sidebar, nav, plugins)
├── netlify.toml             # Netlify 배포 설정
└── package.json             # @julong/mcp-kit-site (private)
```

`package-docs-plugin`이 `packages/*/README.md`를 탐색하여 `/packages/<name>` 라우트에 동적 페이지를 생성하고, `/packages` 개요 페이지에 패키지 목록 테이블을 자동 렌더링합니다.

## 전체 데이터 흐름

```
도구 정의 (src/tools/*.ts)
  │
  ├──→ src/index.ts        ─→ tsup build ─→ dist/index.js   (라이브러리)
  ├──→ src/server.ts       ─→ tsup build ─→ dist/server.js  (MCP 서버)
  └──→ src/cli.ts          ─→ tsup build ─→ dist/cli.js     (CLI)

src/tools/*.ts
  ├──→ README.md (bun update-readme.mjs → tools 소스 직접 import)
  └──→ dist/skills/*/skill.md (tsup onSuccess → dist/index.js import)
```

**tsconfig path alias**: `@common` → `../common/index.ts` (각 패키지의 tsconfig.json에서 설정)

## 관심사 분리 원칙

1. **도구 정의는 각 패키지의 `src/tools/`** 에서 담당 — 비즈니스 로직은 여기에만 위치
2. **MCP 서버/CLI 공통 로직은 `packages/common/kit/`** 에서 담당 — 서버 생성, CLI 파싱, 에러 처리 등
3. **설정 파일은 `packages/common/build/`** 에서 공유 — tsup 설정, README 생성 스크립트
4. **각 패키지의 `src/server.ts`** 는 도구 객체를 `createMcpServer()`에 전달하는 역할만 수행 (매우 얇은 레이어)
5. **각 패키지의 `src/cli.ts`** 는 도구 객체를 `runCli()`에 전달하는 역할만 수행 (매우 얇은 레이어)

## 신규 기능 추가 위치

- **새 MCP 서버 패키지**: `packages/<name>/` 디렉토리 생성, `src/tools/*.ts`에 도구 정의
- **기존 패키지에 새 도구 추가**: 해당 패키지의 `src/tools/` 하위에 파일 추가 (또는 기존 파일에 추가)
- **공통 기능 추가**: `packages/common/kit/`에 모듈 추가
- **빌드 설정 변경**: `packages/common/build/tsup.config.mjs` 수정
