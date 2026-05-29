---
pageType: home
hero:
  name: MCP-Kit
  text: MCP 서버 모노레포 키트
  tagline: pnpm + Turborepo 기반 MCP(Model Context Protocol) 서버 모노레포
  actions:
    - theme: brand
      text: 프로젝트 개요
      link: /01-project-overview
    - theme: alt
      text: GitHub
      link: https://github.com/jl917/mcp-kit
features:
  - title: MCP 서버
    details: 각 패키지는 독립적인 MCP(Model Context Protocol) 서버로 동작하며, AI 어시스턴트가 시스템 유틸리티를 직접 호출할 수 있습니다.
  - title: 모노레포
    details: pnpm + Turborepo로 구성된 모노레포로, 각 패키지가 독립적으로 빌드, 테스트, 배포됩니다.
  - title: 자동 릴리스
    details: semantic-release를 통해 Conventional Commits 기반으로 버전 관리와 npm 배포가 자동화되어 있습니다.
  - title: 문서 사이트
    details: Rspress 기반 문서 사이트가 apps/site/에 구축되어 있으며, 패키지 README를 동적으로 페이지로 생성합니다.
---
