# 1. 프로젝트 개요

## 핵심 포지션 및 목적

**mcp-kit**는 [Model Context Protocol(MCP)](https://modelcontextprotocol.io) 서버를 구축하기 위한 모노레포 키트입니다. 각 패키지는 독립적인 MCP 서버로 동작하며, CLI 도구와 MCP 서버 인터페이스를 동시에 제공합니다. 주 목적은 AI 어시스턴트(Claude 등)가 시스템 유틸리티와 텍스트 처리 기능을 MCP 프로토콜을 통해 직접 호출할 수 있도록 하는 것입니다.

## 주요 사용자 대상

- **최종 사용자**: Claude Desktop, Cursor 등 MCP 클라이언트를 통해 AI 어시스턴트에 시스템/텍스트 유틸리티 기능을 연결하려는 개발자
- **개발자**: MCP 서버 패키지를 npm으로 설치하거나 npx로 직접 실행하여 사용
- **AI 에이전트**: MCP 프로토콜을 통해 도구(tool)를 직접 호출

## 핵심 기능


각 패키지는 다음 세 가지 인터페이스를 제공합니다:
- **라이브러리 API**: `import { tools } from "{package.name}"` 형태로 Node.js 코드에서 직접 사용
- **MCP 서버**: `npx {package.name}`로 stdio 기반 MCP 서버 실행
- **CLI**: `npx {package.name}-cli <toolName> [args]`로 터미널에서 직접 도구 호출

## `npx`로 MCP 서버가 실행되는 원리 (stdio 전송)

MCP 클라이언트(Claude Desktop, Cursor 등)가 `npx {package.name}`으로 서버를 실행할 때, 서버는 **네트워크 포트를 열지 않습니다.** 대신 프로세스의 표준 스트림으로 통신합니다. 흐름은 다음과 같습니다:

1. **프로세스 실행(spawn)**: 클라이언트가 해당 명령을 **자식 프로세스**(`npx {package.name}`)로 실행합니다. `npx`는 npm 레지스트리(또는 로컬 캐시)에서 패키지를 찾아 `bin` 엔트리를 실행하는데, 이 스크립트는 shebang(`#!/usr/bin/env node`) 덕분에 Node.js로 바로 구동됩니다.

2. **파이프 연결**: 클라이언트는 자식 프로세스의 `stdin`, `stdout`, `stderr`를 파이프로 연결한 상태로 유지합니다. 이 세 스트림이 곧 전송 채널입니다:
   - **`stdin`** (클라이언트 → 서버): 클라이언트가 요청을 씁니다. 서버는 들어오는 메시지를 `stdin`에서 읽습니다.
   - **`stdout`** (서버 → 클라이언트): 서버가 응답/알림을 씁니다. **이 채널은 프로토콜 메시지 전용**이며, 다른 것을 `stdout`에 출력하면 스트림이 손상됩니다.
   - **`stderr`** (서버 → 클라이언트, 대역 외): 로깅/진단용입니다. 클라이언트가 캡처할 수는 있지만 프로토콜 데이터로 파싱하지 않습니다. 사람이 읽을 로그는 `stdout`이 아니라 반드시 여기로 보내야 합니다.

3. **메시지 프레이밍(JSON-RPC 2.0)**: MCP는 [JSON-RPC 2.0](https://www.jsonrpc.org/specification)으로 통신합니다. 각 메시지는 한 줄로 직렬화된 JSON 객체이며 개행(`\n`)으로 끝나는 newline-delimited JSON입니다. 대표적인 교환 예시:
   - 클라이언트 → `stdin`: `{"jsonrpc":"2.0","id":1,"method":"initialize",...}`
   - 서버 → `stdout`: `{"jsonrpc":"2.0","id":1,"result":{...}}`
   - 이후 `tools/list`, `tools/call` 등이 동일한 요청/응답 패턴을 따릅니다.

4. **라이프사이클**: 연결은 자식 프로세스가 살아있는 동안만 유지됩니다. 클라이언트가 `stdin`을 닫거나(EOF) 프로세스를 종료하면 서버도 종료됩니다. 상시 실행되는 데몬도, 관리할 포트도 없습니다 — 클라이언트가 파이프를 열어 두는 동안에만 서버가 존재합니다.

이 레포에서는 `@modelcontextprotocol/sdk`의 `StdioServerTransport`가 이 배관을 처리하므로, 도구 작성자는 `stdin`/`stdout`을 직접 다룰 필요 없이 async 도구 핸들러만 등록하면 됩니다. SDK가 표준 스트림 위에서 JSON-RPC 프레임의 직렬화/역직렬화를 대신 수행합니다.

> **왜 HTTP가 아닌 stdio인가?** 포트 할당, 인증 계층, 네트워크 노출이 필요 없기 때문입니다. 클라이언트가 서버의 수명을 완전히 제어하고, OS 파이프는 안전한 로컬 채널입니다. 이것이 이 프로젝트가 **stdio 전송만** 사용하는 이유입니다(아래 비즈니스 제약 참고).

## 문서 사이트

`apps/site/` 디렉토리에 Rspress 기반 문서 사이트가 운영됩니다:

- **패키지 README 자동 연동**: `package-docs-plugin`이 `packages/*/README.md`를 탐색하여 `/packages` 페이지에 동적 렌더링
- **static docs**: `apps/site/docs/`의 마크다운 파일이 정적 문서 페이지로 제공
- **llms.txt 자동 생성**: `@rspress/plugin-llms` 플러그인으로 LLM 친화적 사이트맵(llms.txt, llms-full.txt) 자동 생성
- **배포**: Netlify (`netlify.toml` 설정)로 배포

## 향후 개선 방향

- 패키지 확장: 더 많은 도메인 영역의 MCP 서버 패키지 추가 가능
- 도구 확장: 각 패키지 내에서 더 다양한 도구 정의 및 추가

## 비즈니스 제약사항 및 금지 규칙

- `packages/common`은 내부 공유 라이브러리로, **절대 npm에 배포되지 않음** (pnpm workspace에서 `!packages/common`으로 제외)
- 각 패키지는 **독립적으로 release-please**를 통해 버전 관리 및 배포됨
- `@modelcontextprotocol/sdk`와 `zod`는 모든 패키지의 **핵심 외부 의존성**으로, 함부로 버전을 올리거나 제거하지 않음
- MCP 서버는 **stdio 전송 방식**만 사용 (HTTP/SSE 아직 미지원)
- 모든 도구는 **비동기 핸들러(async handler)**로 작성되어야 함
- 도구의 inputSchema는 **Zod 스키마**로만 정의 가능 (json-schema 등 다른 형식 불가)
