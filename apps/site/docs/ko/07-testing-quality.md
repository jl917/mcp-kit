# 7. 테스트 및 품질 기준

## 현재 상태

> **이 프로젝트는 현재 테스트 코드가 작성되어 있지 않습니다.**
> 테스트 프레임워크(Vitest, Jest 등)가 설정되어 있지 않으며, `*.test.ts` 파일이 존재하지 않습니다.

## 추후 테스트 도입 시 기준

### 반드시 테스트해야 하는 핵심 시나리오

| 우선순위 | 대상 | 테스트 내용 |
|----------|------|------------|
| 🔴 상 | 각 도구 핸들러 | 정상 입력, 경계값, 에러 입력에 대한 응답 |
| 🔴 상 | Zod 스키마 검증 | Optional, Default, Enum 등 각 Zod 타입별 동작 확인 |
| 🟡 중 | MCP 서버 등록 | createMcpServer()가 모든 도구를 올바르게 등록하는지 |
| 🟡 중 | CLI 파싱 | runCli()의 인자 파싱(JSON 자동 파싱 포함) |
| 🟢 하 | 문서 생성 | generateReadmeSkills() 출력 포맷 |

### 신규 코드 작성 시 테스트 규칙 (향후)

1. **새 도구를 추가할 때마다** 해당 도구의 핸들러 단위 테스트를 함께 작성
2. **파라미터 Zod 스키마**가 추가/변경될 때 검증 테스트 추가
3. **예제(examples)** 가 실제로 동작하는지 확인하는 테스트 포함
4. **가이드라인(guidelines)** 이 문서에 올바르게 렌더링되는지 스냅샷 테스트

## 현재 품질 검증 방식

### 타입 검사

```bash
pnpm typecheck       # 전체 패키지 타입 검사
pnpm typecheck       # turbo run typecheck (개별 패키지의 tsc --noEmit)
```

- 각 패키지의 `tsconfig.json`에 `"noEmit": true`로 타입 검사 전용 설정
- `strict: true` 모드 사용
- CI에서 `pnpm typecheck`가 선행되어 타입 안전성 확보

### 빌드 검증

```bash
pnpm build           # turbo run build
```

- tsup이 3개 엔트리(index, server, cli)를 모두 정상 번들링하는지 확인
- DTS 생성이 정상 동작하는지 확인
- 릴리스는 release-please(릴리스 PR 머지)가 처리하므로 CI에 릴리스 드라이런 단계가 없음

### CI 파이프라인 (`.github/workflows/ci.yml`)

1. `pnpm install --frozen-lockfile`
2. `pnpm typecheck`
3. `pnpm build`

## Lint 검사 기준

- **현재 ESLint 미설정** — lint 검사가 수행되지 않음
- 코드 리뷰 시 다음을 수동 확인:
  - `any` 타입 사용 금지 (tool.ts의 handler 제외)
  - 불필요한 `console.log` 제거
  - 사용하지 않는 import 제거
  - 일관된 import 스타일

## "작업 완료" 판단 기준

변경 사항이 "완료"되려면 다음을 모두 충족해야 합니다:

- [ ] `pnpm typecheck` 통과
- [ ] `pnpm build` 정상 완료
- [ ] 새 도구를 추가한 경우 `pnpm readme`로 README.md 업데이트
- [ ] Conventional Commits 형식의 커밋 메시지 작성
- [ ] 불필요한 파일(dist, node_modules 등)이 커밋에 포함되지 않음
- [ ] `packages/common/` 변경 시 모든 패키지 재빌드 및 테스트
