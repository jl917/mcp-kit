import { defineConfig } from '@rspress/core';
import { readmeDocsPlugin } from './scripts/readme-docs-plugin.js';
import { pluginLlms } from '@rspress/plugin-llms';
import mermaid from 'rspress-plugin-mermaid';

export default defineConfig({
  root: 'docs',
  plugins: [readmeDocsPlugin(), pluginLlms(), mermaid()],
  lang: 'en',
  locales: [
    { lang: 'ko', label: '한국어' },
    { lang: 'en', label: 'English' },
  ],
  title: 'MCP-Kit',
  description: 'An MCP server for KRW exchange rates, with CLI and skill output',
  icon: 'https://modelcontextprotocol.io/favicon.ico',
  themeConfig: {
    llmsUI: true,
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/jl917/mcp-kit',
      },
    ],
    locales: [
      {
        lang: 'ko',
        label: '한국어',
        nav: [
          { text: '시작하기', link: '/ko/01-project-overview' },
          { text: 'API', link: '/ko/api' },
        ],
      },
      {
        lang: 'en',
        label: 'English',
        nav: [
          { text: 'Getting Started', link: '/01-project-overview' },
          { text: 'API', link: '/api' },
        ],
      },
    ],
    sidebar: {
      '/': [
        {
          text: 'Getting Started',
          items: [{ text: 'Project Overview', link: '/01-project-overview' }],
        },
        {
          text: 'Technical Docs',
          items: [
            { text: 'Tech Stack', link: '/02-tech-stack' },
            { text: 'Architecture', link: '/03-architecture' },
            { text: 'Coding Rules', link: '/04-coding-rules' },
            { text: 'CLI & Interface Conventions', link: '/05-cli-interface' },
            { text: 'Copywriting Rules', link: '/06-copywriting-rules' },
            { text: 'Testing & Quality', link: '/07-testing-quality' },
            { text: 'File & Component Creation', link: '/08-file-creation-rules' },
            { text: 'Safe Change Rules', link: '/09-safe-change-rules' },
            { text: 'Commands', link: '/10-commands' },
          ],
        },
        {
          text: 'Reference',
          items: [{ text: 'Tools API', link: '/api' }],
        },
      ],
      '/ko/': [
        {
          text: '시작하기',
          items: [{ text: '프로젝트 개요', link: '/ko/01-project-overview' }],
        },
        {
          text: '기술 문서',
          items: [
            { text: '전체 기술 스택', link: '/ko/02-tech-stack' },
            { text: '프로젝트 아키텍처', link: '/ko/03-architecture' },
            { text: '코드 작성 규칙', link: '/ko/04-coding-rules' },
            { text: 'CLI 및 인터페이스 규칙', link: '/ko/05-cli-interface' },
            { text: '문구 및 카피라이팅 규칙', link: '/ko/06-copywriting-rules' },
            { text: '테스트 및 품질 기준', link: '/ko/07-testing-quality' },
            { text: '파일 및 컴포넌트 생성 규칙', link: '/ko/08-file-creation-rules' },
            { text: '안전한 변경 규칙', link: '/ko/09-safe-change-rules' },
            { text: '프로젝트 전용 명령어', link: '/ko/10-commands' },
          ],
        },
        {
          text: '레퍼런스',
          items: [{ text: '도구 API', link: '/ko/api' }],
        },
      ],
    },
  },
});
