import { loadDotEnv, runCli, handleCliError } from '@/common';
import { tools } from '@/tools/index';

// 도구가 읽는 자격 증명(TMDB_API_KEY 등)을 `.env`에서도 받아 준다.
// 셸에 이미 있는 값이 우선이라 `TMDB_API_KEY=... node dist/cli.js`도 그대로 통한다.
loadDotEnv();

runCli(tools).catch(handleCliError);
