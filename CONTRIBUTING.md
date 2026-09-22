# Contributing

## 브랜치 전략

장수 브랜치는 `main` 하나입니다. 작업은 짧은 수명의 브랜치에서 하고 Pull Request로 `main`에 병합합니다. `main`에 직접 push하지 않습니다.

```sh
git switch -c <type>/<short-description> origin/main
```

## Pre-commit Workflow

커밋/푸시 전에 반드시 아래 순서로 모든 검증을 통과해야 합니다. CI와 동일한 순서입니다.

```sh
# 1. Lint
pnpm lint

# 2. Format check
pnpm format:check

# 3. TypeScript type check
pnpm typecheck

# 4. Test
pnpm test

# 5. Build
pnpm build
```

모두 통과한 후에만 커밋하고 푸시합니다. 커밋 메시지는 [Conventional Commits](.claude/rules.md)를 따릅니다.

```sh
git add -A
git commit -m "<type>(<scope>): <subject>"
git push -u origin <branch>
```

## Pull Request

```sh
gh pr create --base main
```

`main`을 대상으로 하는 PR에서 CI(lint · format · typecheck · test · build)가 실행되며, 통과해야 병합할 수 있습니다.

병합하면 release-please가 버전 Bump와 CHANGELOG를 담은 릴리스 PR을 열거나 업데이트합니다. 실제 태그·GitHub Release·npm 배포는 그 릴리스 PR을 머지할 때 수행됩니다.
