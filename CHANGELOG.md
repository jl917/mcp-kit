# Changelog

## [2.4.0](https://github.com/jl917/mcp-kit/compare/v2.3.0...v2.4.0) (2026-09-25)


### Features

* **system:** add battery, memory, cpu, and disk tools ([#58](https://github.com/jl917/mcp-kit/issues/58)) ([81c53d9](https://github.com/jl917/mcp-kit/commit/81c53d90b475a6859906004fbe3a62be75241e03))

## [2.3.0](https://github.com/jl917/mcp-kit/compare/v2.2.1...v2.3.0) (2026-09-23)


### Features

* **release:** ship the published bundle with a TMDB credential ([#54](https://github.com/jl917/mcp-kit/issues/54)) ([f4df056](https://github.com/jl917/mcp-kit/commit/f4df0567a7e44591548064163ca2a497fac52f36))

## [2.2.1](https://github.com/jl917/mcp-kit/compare/v2.2.0...v2.2.1) (2026-09-23)


### Bug Fixes

* keep dist/*.cjs loadable, and allow a TMDB credential to be embedded at build time ([#52](https://github.com/jl917/mcp-kit/issues/52)) ([b5d7a4f](https://github.com/jl917/mcp-kit/commit/b5d7a4f6f3f7dafd4e5c1c4692bcaa1dfda9963e))

## [2.2.0](https://github.com/jl917/mcp-kit/compare/v2.1.1...v2.2.0) (2026-09-23)


### Features

* **tools:** add TMDB movie lookup tools ([#50](https://github.com/jl917/mcp-kit/issues/50)) ([0c24106](https://github.com/jl917/mcp-kit/commit/0c2410613a44a3e035bd3c9783f6d6eeb07146c5))

## [2.1.1](https://github.com/jl917/mcp-kit/compare/v2.1.0...v2.1.1) (2026-09-22)


### Bug Fixes

* **exchange:** cap a lookup at what an MCP client will wait for ([#48](https://github.com/jl917/mcp-kit/issues/48)) ([913c793](https://github.com/jl917/mcp-kit/commit/913c793318eceb62b0602e0e41896d59ed87f70d))

## [2.1.0](https://github.com/jl917/mcp-kit/compare/v2.0.1...v2.1.0) (2026-09-22)


### Features

* **exchange:** add USD to the collected currencies ([#46](https://github.com/jl917/mcp-kit/issues/46)) ([8a120fb](https://github.com/jl917/mcp-kit/commit/8a120fb5d6481e7a003a30eaee3fa7d951e13850))

## [2.0.1](https://github.com/jl917/mcp-kit/compare/v2.0.0...v2.0.1) (2026-09-22)


### Bug Fixes

* **common:** keep the MCP server alive on escaped async errors ([#44](https://github.com/jl917/mcp-kit/issues/44)) ([8b42d7f](https://github.com/jl917/mcp-kit/commit/8b42d7f2b469964e98b33e9f8cabeb77632904f9))

## [2.0.0](https://github.com/jl917/mcp-kit/compare/v1.0.0...v2.0.0) (2026-09-22)


### ⚠ BREAKING CHANGES

* @julong/mono-rele2-core, @julong/mono-rele2-utils and @julong/mono-rele2-exchange are no longer published from this repository. The exchange tools now ship as @julong/mcp-kit with the mcp-kit and mcp-kit-cli binaries.

### Features

* CJS 지원 및 dev watch 모드 추가 ([42ea348](https://github.com/jl917/mcp-kit/commit/42ea34864a563279b589e53adb48fde1a5d721d8))
* **common:** MCP 도구를 LLM으로 검증하는 에이전트 키트 추가 ([f7283bc](https://github.com/jl917/mcp-kit/commit/f7283bc7eab64fa00dc61eecc459c1d58bc70f97))
* **docs:** add Rspress documentation site with dynamic package pages ([6ddc33b](https://github.com/jl917/mcp-kit/commit/6ddc33b83b7f2bcb601a7df9c9b58d1408db49f0))
* doc문서 추가 ([be39b75](https://github.com/jl917/mcp-kit/commit/be39b7562506a785b0e1154488d4b6ee2b484c21))
* doc사이트 빌드 테스트 ([5b95706](https://github.com/jl917/mcp-kit/commit/5b957068896e1db2ae823ebe38544a2ca1dca9d5))
* **exchange:** 네이버·구글·다음 환율 수집 MCP 패키지 추가 ([9457cef](https://github.com/jl917/mcp-kit/commit/9457cefd1cc189f0059451c1b4877bc720238002))
* move skills to packages/{dir}/skills/, add Skill Installation section to README, pin branch to main ([f5c1df8](https://github.com/jl917/mcp-kit/commit/f5c1df803cb25449e8318b81325d01530a722229))
* rspress 다국어(i18n) 지원 — 한국어/영어 ([8a894de](https://github.com/jl917/mcp-kit/commit/8a894de2c0104a02264ca25ca9eecab2c9dde7b7))
* **server:** WHITE_FN/BLACK_FN 환경변수로 도구 활성화 필터링 ([d3c3519](https://github.com/jl917/mcp-kit/commit/d3c3519fb598934ec5bf19b5095e46ebe5a8d338))
* update common-update.md in core and utils [skip ci] ([cf87478](https://github.com/jl917/mcp-kit/commit/cf87478910a92c6b6c601203410b843ed270e3af))
* update common-update.md in core and utils [skip ci] ([55c3833](https://github.com/jl917/mcp-kit/commit/55c3833f97db7919817e5bf18de7961d3676f081))
* update common-update.md in core and utils [skip ci] ([a96c305](https://github.com/jl917/mcp-kit/commit/a96c305001142ae908e2f6eea2610b49e0fb466a))
* update common-update.md in core and utils [skip ci] ([4843362](https://github.com/jl917/mcp-kit/commit/4843362cddce1f9b39725dafb6d8821b8deaa31f))
* update common-update.md in core and utils [skip ci] ([da5861b](https://github.com/jl917/mcp-kit/commit/da5861b9cd47862b61296820a984cc30047ddc9a))
* update common-update.md in core and utils [skip ci] ([9ac05ec](https://github.com/jl917/mcp-kit/commit/9ac05ec4c1e9c273307b28b1dbd5db01fa228da7))
* update common-update.md in core and utils [skip ci] ([52c193e](https://github.com/jl917/mcp-kit/commit/52c193e43853cbcf993067cbbbb8e757aa1a3bd9))
* update common-update.md in core and utils [skip ci] ([ac0d75c](https://github.com/jl917/mcp-kit/commit/ac0d75c1f2a7fa2281bb79e62cd2c5103c23749b))
* update common-update.md in core and utils [skip ci] ([61b900b](https://github.com/jl917/mcp-kit/commit/61b900be41ad6157d3a419ffdf0e4fe536b676a6))
* update common-update.md in core and utils [skip ci] ([e8a9ef9](https://github.com/jl917/mcp-kit/commit/e8a9ef97bc788665dea41715c98c217377069088))
* update common-update.md in core and utils [skip ci] ([9f9c42e](https://github.com/jl917/mcp-kit/commit/9f9c42ec6a2405787b0e0a1e1cf6b3f5dc5d3712))
* update common-update.md in core and utils [skip ci] ([3f08bd9](https://github.com/jl917/mcp-kit/commit/3f08bd9eaaa973f75502924df6ef447dbe127855))
* update common-update.md in core and utils [skip ci] ([4698755](https://github.com/jl917/mcp-kit/commit/469875573659ae37b24c5b6df8b0bdb92fdd2168))
* update common-update.md in core and utils [skip ci] ([ba65e69](https://github.com/jl917/mcp-kit/commit/ba65e69fdcf339a65b7abc2082e69f046d70e8c7))
* update common-update.md in core and utils [skip ci] ([4515d43](https://github.com/jl917/mcp-kit/commit/4515d43c8e5b080656e23cc48881656db054e4e1))
* update common-update.md in core and utils [skip ci] ([63115d5](https://github.com/jl917/mcp-kit/commit/63115d57f9b595de158d129148c9517d3cef38e9))
* update common-update.md in core and utils [skip ci] ([c53d048](https://github.com/jl917/mcp-kit/commit/c53d048fc5a7ea388621e7f776a7888d7bda48ae))
* update common-update.md in core and utils [skip ci] ([5dff3e8](https://github.com/jl917/mcp-kit/commit/5dff3e8159f16a2871c9d61b566d3772bb5c2008))
* update common-update.md in core and utils [skip ci] ([a972781](https://github.com/jl917/mcp-kit/commit/a9727819cf55aeed7d65c835794a8ade8a42428f))
* update common-update.md in core and utils [skip ci] ([76a31be](https://github.com/jl917/mcp-kit/commit/76a31be3d0baf3c5c0b76c85a1b10d29da84a3cb))
* update common-update.md in core and utils [skip ci] ([b03d595](https://github.com/jl917/mcp-kit/commit/b03d5958959339714b09f7f6ef533e0cc5301f84))
* update common-update.md in core and utils [skip ci] ([c3b83dd](https://github.com/jl917/mcp-kit/commit/c3b83dd966cf00eea0fb0adf3c8c4e9dee8eb22f))
* **utils:** add env_get tool for MCP client-injected env vars ([cc2e8d0](https://github.com/jl917/mcp-kit/commit/cc2e8d0f7583aec37d3d7e97c8d9cd7cdca2a367))
* **utils:** add getUser tool with full RandomUser type specs in docs ([2f93de5](https://github.com/jl917/mcp-kit/commit/2f93de57be67864dffd806016249ce2945167c77))
* **utils:** add getUser tool with full RandomUser type specs in docs ([9c3bd6d](https://github.com/jl917/mcp-kit/commit/9c3bd6d23db3362aa28ecff8f6d5e903687ac0c9))
* **utils:** add object_flatten tool for recursive nested-object flattening ([e4ce8f0](https://github.com/jl917/mcp-kit/commit/e4ce8f0805647530c6961e72aba05332542637b3))
* 빌드 ([b8b0318](https://github.com/jl917/mcp-kit/commit/b8b031862430a8fab5b33ad6e71425d7d96fa2e5))
* 빌드 ([b4bc231](https://github.com/jl917/mcp-kit/commit/b4bc2316aeaad1921a4b551b56780fab42526933))
* 빌드 체크 ([eca16c6](https://github.com/jl917/mcp-kit/commit/eca16c6ac94804d74e24c4897357ddc034c15ef4))
* 빌드 체크 ([09b2260](https://github.com/jl917/mcp-kit/commit/09b2260249d6eb644d46470b46390042ca6bb669))
* 빌드 체크 ([5026881](https://github.com/jl917/mcp-kit/commit/5026881c0ad32046aad5602a4bc4ca133577c4ca))
* 스크립트 수정 ([b0f3ced](https://github.com/jl917/mcp-kit/commit/b0f3cedca0ac160f3fd013a7cec5486db86aeff6))
* 스크립트 수정 ([8e5a4c7](https://github.com/jl917/mcp-kit/commit/8e5a4c79725ed04933114cc7bee19292e58a3573))
* 환율 수집 MCP 패키지와 LLM 에이전트 키트 추가 ([254e1d4](https://github.com/jl917/mcp-kit/commit/254e1d4ff0d8a407b2a1df19007a1c1bd2a836c1))


### Bug Fixes

* 17.0 버전 sync ([38fb296](https://github.com/jl917/mcp-kit/commit/38fb2964d5becb40b4821d3d216be1afc2cc9c60))
* common 테스트 ([2932f5c](https://github.com/jl917/mcp-kit/commit/2932f5ca104d12b4db6345844641ef3a8e735723))
* core cli.ts import 경로 통일 (./tools/system.js → ./tools/index.js) ([66a303f](https://github.com/jl917/mcp-kit/commit/66a303fc570325c21555be4fa48074591d8e7eaa))
* **docs:** ko 로케일 packages 페이지 404 수정 ([ed06179](https://github.com/jl917/mcp-kit/commit/ed061796c92390de2a22a2fa68739268891673b7))
* packages 개요 페이지 영어로 변경 ([608dd23](https://github.com/jl917/mcp-kit/commit/608dd232ccdc14fefa31ca671b5af3208eb957ae))
* readme template 수정 ([6d1c7e6](https://github.com/jl917/mcp-kit/commit/6d1c7e67cd557a251f95fd115a68ced452865d25))
* remove unused import UTILS_ENV_KEYS in env.test.ts ([172d9cb](https://github.com/jl917/mcp-kit/commit/172d9cbf043d53d4e8ed506f0ea873e299aed509))
* skill 파일명을 SKILL.md 대문자로 변경 ([126b67a](https://github.com/jl917/mcp-kit/commit/126b67ac98f56c617a356e03d6508ea172bab7e2))
* **turbo:** common 변경이 build/typecheck/test 캐시를 무효화하도록 inputs 추가 ([d3c3519](https://github.com/jl917/mcp-kit/commit/d3c3519fb598934ec5bf19b5095e46ebe5a8d338))
* 릴리스 워크플로의 SKILL.md 대문자 경로 반영 ([f2a252d](https://github.com/jl917/mcp-kit/commit/f2a252d8a533986021e4c40184f533fef487e433))
* 마크다운 테이블 셀의 파이프(|) 이스케이프 처리 ([78aa4bf](https://github.com/jl917/mcp-kit/commit/78aa4bf6fc2a7ef324dd09508b0134bbb6bff8c3))
* 버저닝 테스트 ([217a18e](https://github.com/jl917/mcp-kit/commit/217a18e536801b6866390ab3a7614203dbd493d5))
* 빌드 ([affe06b](https://github.com/jl917/mcp-kit/commit/affe06b62dff2605b67eb48b1103cfdbdf12ef54))
* 빌드 스크립트 테스트 ([d4b1f29](https://github.com/jl917/mcp-kit/commit/d4b1f29c3397c57ec30b30c88361e3593c31afd3))
* 스크립트 수정 ([7d99057](https://github.com/jl917/mcp-kit/commit/7d9905796a8424d1bcfa050621a9c0db0a1ba522))
* 스크립트 수정 ([62851a4](https://github.com/jl917/mcp-kit/commit/62851a439d9ce56f04fd766831bd24eb690a8553))
* 이관 ([9c997f9](https://github.com/jl917/mcp-kit/commit/9c997f9d7a0ebd0ffc2dafd0697d87f0b06ad795))
* 특정 패키지만 ([d0f90ac](https://github.com/jl917/mcp-kit/commit/d0f90ac851fbba6706115440a469bda8a2da44a5))


### Code Refactoring

* collapse monorepo into a single repository ([#42](https://github.com/jl917/mcp-kit/issues/42)) ([534f31c](https://github.com/jl917/mcp-kit/commit/534f31c0251c315184936965420e86a4fee027ac))
