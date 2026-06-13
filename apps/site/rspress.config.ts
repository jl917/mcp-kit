import { defineConfig } from "@rspress/core";
import { packageDocsPlugin } from "./scripts/package-docs-plugin.js";
import { pluginLlms } from "@rspress/plugin-llms";

export default defineConfig({
  root: "docs",
  plugins: [packageDocsPlugin(), pluginLlms()],
  lang: "ko",
  locales: [
    { lang: "ko", label: "한국어" },
    { lang: "en", label: "English" },
  ],
  title: "MCP-Kit",
  description: "MCP(Model Context Protocol) 서버 모노레포 키트",
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
          { text: "시작하기", link: "/01-project-overview" },
          { text: "Packages", link: "/packages" },
        ],
        sidebar: {
          "/": [
            {
              text: "시작하기",
              items: [
                { text: "프로젝트 개요", link: "/01-project-overview" },
              ],
            },
            {
              text: "기술 문서",
              items: [
                { text: "전체 기술 스택", link: "/02-tech-stack" },
                { text: "프로젝트 아키텍처", link: "/03-architecture" },
                { text: "코드 작성 규칙", link: "/04-coding-rules" },
                { text: "UI 및 디자인 시스템", link: "/05-ui-design-system" },
                { text: "문구 및 카피라이팅 규칙", link: "/06-copywriting-rules" },
                { text: "테스트 및 품질 기준", link: "/07-testing-quality" },
                { text: "파일 및 컴포넌트 생성 규칙", link: "/08-file-creation-rules" },
                { text: "안전한 변경 규칙", link: "/09-safe-change-rules" },
                { text: "프로젝트 전용 명령어", link: "/10-commands" },
              ],
            },
          ],
          "/packages": [
            { text: "Packages", items: [] },
          ],
        },
      },
      {
        lang: "en",
        label: "English",
        nav: [
          { text: "Getting Started", link: "/en/01-project-overview" },
          { text: "Packages", link: "/en/packages" },
        ],
        sidebar: {
          "/en/": [
            {
              text: "Getting Started",
              items: [
                { text: "Project Overview", link: "/en/01-project-overview" },
              ],
            },
            {
              text: "Technical Docs",
              items: [
                { text: "Tech Stack", link: "/en/02-tech-stack" },
                { text: "Architecture", link: "/en/03-architecture" },
                { text: "Coding Rules", link: "/en/04-coding-rules" },
                { text: "UI & Design System", link: "/en/05-ui-design-system" },
                { text: "Copywriting Rules", link: "/en/06-copywriting-rules" },
                { text: "Testing & Quality", link: "/en/07-testing-quality" },
                { text: "File & Component Creation", link: "/en/08-file-creation-rules" },
                { text: "Safe Change Rules", link: "/en/09-safe-change-rules" },
                { text: "Commands", link: "/en/10-commands" },
              ],
            },
          ],
          "/en/packages": [
            { text: "Packages", items: [] },
          ],
        },
      },
    ],
  },
});
