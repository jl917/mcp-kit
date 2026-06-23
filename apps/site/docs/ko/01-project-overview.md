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
