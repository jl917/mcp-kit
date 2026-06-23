# mcp-kit

pnpm + Turborepo 기반 모노레포. 각 패키지는 release-please를 통해 독립적으로 npm에 배포됩니다.

## 개발 환경

- Node.js `v24` (`.nvmrc` 참고)
- pnpm `9.12.1`

```bash
nvm use          # .nvmrc 기준 Node 버전 적용
pnpm install     # 전체 의존성 설치
```

## 빌드

Turborepo가 의존 관계를 분석해 올바른 순서로 빌드하며, 변경이 없는 패키지는 캐시를 사용합니다.

```bash
pnpm build       # 전체 빌드
pnpm typecheck   # 전체 타입 검사
pnpm clean       # 빌드 아웃풋 및 캐시 제거
```

## MCP 서버

각 패키지는 [Model Context Protocol](https://modelcontextprotocol.io) 서버로 동작합니다. npm에 배포된 패키지를 `npx`로 바로 실행하거나, Claude Desktop / Cursor 등 MCP 클라이언트에 연결할 수 있습니다.

### Claude Desktop 연결

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) 또는  
`%APPDATA%\Claude\claude_desktop_config.json` (Windows)에 추가합니다.

```json
{
  "mcpServers": {
    "mono-rele2-core": {
      "command": "npx",
      "args": ["-y", "@julong/mono-rele2-core"]
    },
    "mono-rele2-utils": {
      "command": "npx",
      "args": ["-y", "@julong/mono-rele2-utils"]
    }
  }
}
```

설정 후 Claude Desktop을 재시작하면 Tool 목록에 자동 등록됩니다.

---

### Cursor 연결

`.cursor/mcp.json` (프로젝트별) 또는 `~/.cursor/mcp.json` (전역)에 추가합니다.

```json
{
  "mcpServers": {
    "mono-rele2-core": {
      "command": "npx",
      "args": ["-y", "@julong/mono-rele2-core"]
    },
    "mono-rele2-utils": {
      "command": "npx",
      "args": ["-y", "@julong/mono-rele2-utils"]
    }
  }
}
```

---

### 환경변수 전달

서버에 환경변수를 주입해야 하는 경우:

```json
{
  "mcpServers": {
    "mono-rele2-core": {
      "command": "npx",
      "args": ["-y", "@julong/mono-rele2-core"],
      "env": {
        "MY_API_KEY": "your-key-here"
      }
    }
  }
}
```

---

### 로컬 개발 중 연결

npm 배포 전에 로컬 빌드를 MCP 클라이언트에 연결할 때는 `node`로 직접 실행합니다.

```bash
# 먼저 빌드
pnpm build

# 로컬 실행 확인 (MCP Inspector 사용 시)
npx @modelcontextprotocol/inspector node packages/core/dist/server.js
npx @modelcontextprotocol/inspector node packages/utils/dist/server.js
```

Claude Desktop에서 로컬 빌드 연결:

```json
{
  "mcpServers": {
    "mono-rele2-core-dev": {
      "command": "node",
      "args": ["/절대경로/mono-rele2/packages/core/dist/server.js"]
    }
  }
}
```

---

## 커밋 메시지 규칙

[Conventional Commits](https://www.conventionalcommits.org/) 형식을 따릅니다. release-please가 커밋 타입을 분석해 자동으로 버전을 결정하고 릴리스 PR을 통해 CHANGELOG를 생성합니다.

### 형식

```
<type>(<scope>): <subject>

[body]

[footer]
```

### 타입별 릴리스 결정

| 타입 | 설명 | 버전 bump |
|------|------|-----------|
| `feat` | 새로운 기능 | `minor` (1.x.0) |
| `fix` | 버그 수정 | `patch` (1.0.x) |
| `perf` | 성능 개선 | `patch` (1.0.x) |
| `revert` | 커밋 되돌리기 | `patch` (1.0.x) |
| `BREAKING CHANGE` | 하위 호환 불가 변경 | `major` (x.0.0) |
| `docs` | 문서 변경 | 릴리스 없음 |
| `chore` | 빌드/설정 변경 | 릴리스 없음 |
| `refactor` | 코드 리팩토링 | 릴리스 없음 |
| `test` | 테스트 추가/수정 | 릴리스 없음 |

### 예시

```bash
# minor 릴리스 (1.0.0 → 1.1.0)
git commit -m "feat(utils): add debounce utility"

# patch 릴리스 (1.0.0 → 1.0.1)
git commit -m "fix(core): resolve null reference error"

# major 릴리스 (1.0.0 → 2.0.0)
git commit -m "feat(utils)!: rename cn to classNames"
# 또는 footer에 BREAKING CHANGE 명시
git commit -m "feat(utils): rename cn to classNames

BREAKING CHANGE: cn function has been renamed to classNames"

# 릴리스 없음
git commit -m "chore: update dependencies"
git commit -m "docs: update README"
```

## 릴리스

`main` 브랜치에 push되면 GitHub Actions가 자동으로 다음을 수행합니다:

1. 변경된 패키지를 감지
2. 커밋 메시지를 분석해 버전 결정
3. `CHANGELOG.md` 생성/업데이트
4. `package.json` 버전 bump
5. Git 태그 생성 (예: `@julong/mono-rele2-utils@1.1.0`)
6. npm 배포
7. GitHub Release 생성

### 사전 설정 (GitHub Repository Secrets)

| Secret | 설명 |
|--------|------|
| `NPM_TOKEN` | npm Automation 토큰 (`npm token create --type=automation`) |

`GITHUB_TOKEN`은 Actions에서 자동으로 제공됩니다.

## GitHub Actions

| 워크플로우 | 트리거 | 목적 |
|-----------|--------|------|
| `ci.yml` | PR 및 main push | 타입 검사 + 빌드 검증 |
| `release.yml` | main push | release-please 릴리스 PR 관리 → 머지 시 태그/GitHub Release/npm 배포 |
