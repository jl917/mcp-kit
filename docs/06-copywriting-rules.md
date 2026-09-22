# 6. Copywriting Rules

## Scope

These rules apply to:
- Package `description` field (package.json)
- Each tool's `description` and `guidelines`
- README.md content
- CHANGELOG.md (auto-generated)
- CLI output messages

## Style Guidelines

- Use **concise and clear sentences** (eliminate unnecessary modifiers)
- **One sentence per tool description**, within 30 characters recommended (Korean)
- Avoid nominal endings; use descriptive form
- Maintain a **professional and neutral tone**

## Package Description Format

```
Use this skill to [action] via the [package-name] CLI. Handles [main features].
```

Examples:
- `@julong/mcp-kit`: "Use this skill to fetch the latest KRW exchange rates for the United States, China, Japan, and the Euro area from Naver, Google, and Daum via the mcp-kit CLI. Scrapes each portal with Playwright and returns JSON, using null for any rate it cannot read."

## Tool Description Rules

- **One sentence**, starting with a verb in third-person singular (Returns, Merges, Converts, Truncates, Generates, etc.)
- **Omit the period** (for clean display in tool lists)
- Write **result-oriented** rather than function-oriented (e.g., "Truncates text to a maximum length" ✓ / "Takes text and truncates it" ✗)

## Prohibited Expressions

| Prohibited | Reason | Replacement |
|------------|--------|-------------|
| "very", "really", "extremely" | Unnecessary emphasis | Remove |
| "simply", "just", "easily" | Exaggerated | Remove |
| "revolutionary", "powerful" | Marketing hype | Replace with specific description |
| Emoji/special characters | CLI/MCP compatibility | Prohibited |
| "Please" | Unnecessary in imperative sentences | Remove |
| Vague units ("a lot of", "some") | Lacks precision | Specify concrete values/conditions |

## README Documentation Rules

- **Title**: Use the package name directly (`# @julong/mcp-kit`)
- **Description**: Use the package.json description directly
- **Examples**: Focus on working commands with result comments
- **CLI usage**: Maintain consistent pattern: `npx <package>-cli <toolName> [...args]`
- **Installation**: Provide both npm and npx methods
