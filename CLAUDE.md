# MCP-Kit

pnpm 기반 단일 저장소. KRW 환율을 조회하는 MCP(Model Context Protocol) 서버와 CLI를 제공합니다.

상세 문서는 `docs/` 디렉토리를 참고하세요.

---

## 문서 목차

| # | 문서 | 설명 |
|---|------|------|
| 1 | [프로젝트 개요](docs/01-project-overview.md) | 제품 목적, 사용자, 핵심 기능, 제약사항 |
| 2 | [전체 기술 스택](docs/02-tech-stack.md) | 프레임워크/라이브러리 버전, 부재 항목 |
| 3 | [프로젝트 아키텍처](docs/03-architecture.md) | 디렉토리 구조, 계층별 책임, 데이터 흐름 |
| 4 | [코드 작성 규칙](docs/04-coding-rules.md) | 도구 작성 패턴, TypeScript 규칙, import 규칙 |
| 5 | [CLI 및 인터페이스 규칙](docs/05-cli-interface.md) | CLI 출력/UX 규칙, 접근성, 컴포넌트 재사용 |
| 6 | [문구 및 카피라이팅 규칙](docs/06-copywriting-rules.md) | description 작성법, 금지 표현 |
| 7 | [테스트 및 품질 기준](docs/07-testing-quality.md) | 테스트 현황, 품질 검증, 작업 완료 기준 |
| 8 | [파일 및 컴포넌트 생성 규칙](docs/08-file-creation-rules.md) | 신규 파일 위치, 네이밍 규칙 |
| 9 | [안전한 변경 규칙](docs/09-safe-change-rules.md) | 변경 금지 대상, 버전 호환성, 브랜치 보호 |
| 10 | [프로젝트 전용 명령어](docs/10-commands.md) | 설치/빌드/타입검사/문서/MCP/CLI/배포 명령어 |

## 디렉토리 구조

```
src/
├── index.ts        # 라이브러리 진입점
├── server.ts       # MCP 서버 진입점
├── cli.ts          # CLI 진입점
├── tools/          # MCP 도구 정의
├── exchange/       # 환율 스크레이핑 도메인
└── common/         # 공용 kit(tool/server/cli/skill) · agent
docs/               # 문서 사이트 콘텐츠 (rspress)
scripts/            # README 생성, 문서 플러그인
skills/             # 생성된 SKILL.md
```

## 빠른 명령어

```bash
pnpm install        # 의존성 설치
pnpm build          # 빌드 (tsup)
pnpm typecheck      # 타입 검사
pnpm test           # 테스트 (rstest)
pnpm readme         # README 업데이트 (bun 필요)
pnpm docs:dev       # 문서 사이트 로컬 개발 서버 실행
pnpm docs:build     # 문서 사이트 정적 빌드
pnpm clean          # 캐시/dist 제거
```
