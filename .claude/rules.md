# Commit Convention

모든 커밋은 [Conventional Commits v1.0.0](https://www.conventionalcommits.org/ko/v1.0.0/)을 따라야 합니다.

## 형식

```
<type>(<scope>): <subject>

<body>

<footer>
```

- `<type>`과 `<subject>`는 **필수**
- `<scope>`와 `<body>`와 `<footer>`는 **선택**

## Type

| 타입 | 설명 | release-please |
|------|------|-----------------|
| `feat` | 새로운 기능 | `minor` |
| `fix` | 버그 수정 | `patch` |
| `perf` | 성능 개선 | `patch` |
| `revert` | 이전 커밋 되돌리기 | `patch` |
| `docs` | 문서 변경 | 릴리스 없음 |
| `refactor` | 코드 리팩토링 (기능/버그 수정 없음) | 릴리스 없음 |
| `test` | 테스트 추가/수정 | 릴리스 없음 |
| `chore` | 빌드 설정, 의존성, CI/CD 변경 | 릴리스 없음 |
| `style` | 코드 포맷팅, 세미콜론 등 (로직 변경 없음) | 릴리스 없음 |
| `ci` | CI/CD 설정 변경 | 릴리스 없음 |

## Scope

변경 범위를 나타냅니다. 소문자로 작성합니다. 예시:

- `core` — `packages/core/` 관련 변경
- `utils` — `packages/utils/` 관련 변경
- `common` — `packages/common/` 관련 변경
- `deps` — 의존성 변경
- `docs` — 문서 관련 변경
- `release` — 릴리스 관련 변경
- `config` — 설정 파일 변경

## Subject

- 명령문 현재형으로 작성 (과거형 금지)
  - ✅ `feat: add echoTool`
  - ❌ `feat: added echoTool`
- 첫 글자는 소문자
- 마침표로 끝내지 않음
- 50자 이내로 제한

## Body (선택)

- `subject`만으로 설명이 부족할 때 작성
- `subject`와 한 줄 띄워서 작성
- "왜" 변경했는지, "무엇을" 변경했는지 설명

## Breaking Change

하위 호환성을 깨는 변경은 다음 중 하나로 표시:

1. `type` 뒤에 `!` 추가: `feat(core)!: remove deprecated echoTool`
2. `footer`에 `BREAKING CHANGE:` 명시:

```
feat(core): rename echoTool to echo

BREAKING CHANGE: echoTool has been renamed to echo.
```

## 예시

```bash
# 새로운 기능 (minor)
git commit -m "feat(core): add uuid generation tool"

# 버그 수정 (patch)
git commit -m "fix(utils): handle empty string in truncateTool"

# 문서 변경 (릴리스 없음)
git commit -m "docs: update README with installation guide"

# Breaking Change (major)
git commit -m "feat(core)!: rename echoTool to echo"

# scope + body 포함
git commit -m "refactor(common): extract tool validation logic

Extract shared validation logic from core and utils into common/kit
to reduce code duplication"
```

## 금지 사항

- `fixup!` 또는 `squash!` 커밋을 그대로 push 금지 (rebase 후 정리)
- `WIP`, `temp`, `asdf` 등 의미 없는 메시지 금지
- 한글 subject 지양 (영문으로 통일)
- 하나의 커밋에 여러 타입/scope 혼합 금지 (atomic commit 원칙)
