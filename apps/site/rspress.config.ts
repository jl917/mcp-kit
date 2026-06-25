import { defineConfig } from "@rspress/core";
import { packageDocsPlugin } from "./scripts/package-docs-plugin.js";
import { pluginLlms } from "@rspress/plugin-llms";
import mermaid from "rspress-plugin-mermaid";

export default defineConfig({
  root: "docs",
  plugins: [packageDocsPlugin(), pluginLlms(), mermaid()],
  lang: "en",
  locales: [
    { lang: "ko", label: "한국어" },
    { lang: "en", label: "English" },
  ],
  title: "MCP-Kit",
  description: "A monorepo kit for building and deploying MCP servers",
  icon: "https://modelcontextprotocol.io/favicon.ico",
  themeConfig: {
    llmsUI: true,
    socialLinks: [
      {
        icon: "github",
        mode: "link",
        content: "https://github.com/jl917/mcp-kit",
      },
    ],
    locales: [
      {
        lang: "ko",
        label: "한국어",
        nav: [
          { text: "시작하기", link: "/ko/01-project-overview" },
          { text: "Packages", link: "/packages" },
        ],
      },
      {
        lang: "en",
        label: "English",
        nav: [
          { text: "Getting Started", link: "/01-project-overview" },
          { text: "Packages", link: "/packages" },
        ],
      },
    ],
    sidebar: {
      "/": [
        {
          text: "Getting Started",
          items: [
            { text: "Project Overview", link: "/01-project-overview" },
          ],
        },
        {
          text: "Technical Docs",
          items: [
            { text: "Tech Stack", link: "/02-tech-stack" },
            { text: "Architecture", link: "/03-architecture" },
            { text: "Coding Rules", link: "/04-coding-rules" },
            { text: "UI & Design System", link: "/05-ui-design-system" },
            { text: "Copywriting Rules", link: "/06-copywriting-rules" },
            { text: "Testing & Quality", link: "/07-testing-quality" },
            { text: "File & Component Creation", link: "/08-file-creation-rules" },
            { text: "Safe Change Rules", link: "/09-safe-change-rules" },
            { text: "Commands", link: "/10-commands" },
          ],
        },
      ],
      "/ko/": [
        {
          text: "시작하기",
          items: [
            { text: "프로젝트 개요", link: "/ko/01-project-overview" },
          ],
        },
        {
          text: "기술 문서",
          items: [
            { text: "전체 기술 스택", link: "/ko/02-tech-stack" },
            { text: "프로젝트 아키텍처", link: "/ko/03-architecture" },
            { text: "코드 작성 규칙", link: "/ko/04-coding-rules" },
            { text: "UI 및 디자인 시스템", link: "/ko/05-ui-design-system" },
            { text: "문구 및 카피라이팅 규칙", link: "/ko/06-copywriting-rules" },
            { text: "테스트 및 품질 기준", link: "/ko/07-testing-quality" },
            { text: "파일 및 컴포넌트 생성 규칙", link: "/ko/08-file-creation-rules" },
            { text: "안전한 변경 규칙", link: "/ko/09-safe-change-rules" },
            { text: "프로젝트 전용 명령어", link: "/ko/10-commands" },
          ],
        },
      ],
      "/packages": [
        { text: "Packages", items: [] },
      ],
    },
  },
});
