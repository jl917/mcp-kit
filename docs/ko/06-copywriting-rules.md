# 6. 문구 및 카피라이팅 규칙

## 적용 범위

이 규칙은 다음에 적용됩니다:
- 패키지 `description` 필드 (package.json)
- 각 도구의 `description` 및 `guidelines`
- README.md 내용
- CHANGELOG.md (자동 생성)
- CLI 출력 메시지

## 문체 기준

- **간결하고 명확한 문장** 사용 (불필요한 수식어 제거)
- **한 문장은 30자 이내** 권장 (도구 설명에 한해)
- **명사형 종결** 지양하고, 서술형으로 마무리 (예: "반환합니다" → 좋음, "반환" → 지양)
- **존댓말(-습니다)** 사용 (공식 문서 스타일)
- **전문적이고 중립적인 톤** 유지

## 패키지 description 작성 규칙

```
Use this skill to [동작] via the [패키지명] CLI. Handles [주요 기능].
```

예시:
- `@julong/mcp-kit`: "Use this skill to fetch the latest KRW exchange rates for the United States, China, Japan, and the Euro area from Naver, Google, and Daum via the mcp-kit CLI. Scrapes each portal with Playwright and returns JSON, using null for any rate it cannot read."

## 도구 description 작성 규칙

- **한 문장**, 동사 원형으로 시작 (Returns, Merges, Converts, Truncates, Generates 등)
- **마침표 생략** (도구 목록에서 깔끔하게 표시되도록)
- 기능이 아닌 **결과 중심**으로 작성 (예: "Truncates text to a maximum length" - 좋음 / "Takes text and truncates it" - 지양)

## 사용 금지 표현

| 금지 | 이유 | 대체 |
|------|------|------|
| "very", "really", "extremely" | 불필요한 강조 | 제거 |
| "simply", "just", "easily" | 과장된 표현 | 제거 |
| "revolutionary", "powerful" | 마케팅 과장 | 구체적 설명으로 대체 |
| 이모지/특수문자 | CLI/MCP 환경 호환성 | 사용 금지 |
| "Please" | 명령형 문장에서 불필요 | 제거 |
| 모호한 단위 ("a lot of", "some") | 정확성 부족 | 구체적 수치/조건 명시 |

## README 문서 규칙

- **제목**: 패키지명을 그대로 사용 (`# @julong/mcp-kit`)
- **설명**: package.json의 description을 그대로 사용
- **예제**: 실제 동작하는 명령어 위주로 작성, 결과 주석 포함
- **CLI 사용법**은 일관된 패턴 유지: `npx <package>-cli <toolName> [...args]`
- **설치 명령어**는 npm과 npx 두 가지 방식을 모두 제공
