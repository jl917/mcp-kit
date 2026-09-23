import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * 빌드 시점에 번들로 들어간 TMDB 자격 증명.
 *
 * `pnpm build`는 빌드 환경의 `TMDB_API_KEY` / `TMDB_ACCESS_TOKEN`을 읽어 아래 세
 * 식별자를 문자열 리터럴로 바꿔 놓습니다 (`tsup.config.ts`의 `define`). 값이 들어간
 * 빌드를 받은 쪽은 서버를 띄울 때 자격 증명을 따로 넣지 않아도 영화 도구가 그대로
 * 돕니다.
 *
 * 값은 평문이 아니라 AES-256-GCM으로 봉해서 넣고, 여는 열쇠도 같은 번들 안에
 * 들어갑니다. 그래서 이것은 **암호화가 아니라 난독화**입니다 — 번들을 가진 사람은
 * 언제든 열 수 있습니다. 얻는 것은 두 가지뿐입니다. 키가 번들에 그대로 적힌 문자열로
 * 남지 않아 `grep`이나 자동 시크릿 스캐너에 걸리지 않고, 실수로 번들 일부를 붙여
 * 넣어도 키가 노출되지 않습니다.
 *
 * 이 저장소의 릴리스 빌드는 자격 증명을 심은 채 npm에 올라갑니다. 따라서 여기 담기는
 * 키는 비밀이 아니라 "공개된 공용 키"로 다뤄야 합니다 — 남용되면 발급을 다시 받아
 * 저장소 시크릿만 갈아 끼웁니다.
 *
 * 빌드 환경에 값이 없으면 빈 문자열이 들어가고, 그때는 실행 시점의 환경 변수만
 * 봅니다. 번들러를 거치지 않고 소스를 그대로 실행하는 경우(rstest 등)에는 식별자가
 * 아예 선언되지 않으므로 `typeof`로 확인한 뒤 읽습니다.
 */

/** GCM 표준 nonce 길이. */
const IV_BYTES = 12;

/** GCM 인증 태그 길이. */
const TAG_BYTES = 16;

/** AES-256 키 길이. `createSealSecret()`이 만드는 값의 크기입니다. */
const SECRET_BYTES = 32;

const ALGORITHM = 'aes-256-gcm';

declare const __TMDB_SEAL_SECRET__: string;
declare const __TMDB_API_KEY__: string;
declare const __TMDB_ACCESS_TOKEN__: string;

/** 빌드 한 번에 쓸 열쇠를 만듭니다. base64로 돌려줍니다. */
export function createSealSecret(): string {
  return randomBytes(SECRET_BYTES).toString('base64');
}

/**
 * 자격 증명을 봉해 번들에 넣을 문자열로 만듭니다. 빈 값은 빈 문자열이 됩니다.
 *
 * 결과는 `iv | tag | ciphertext`를 이어 붙인 base64입니다.
 */
export function sealCredential(value: string, secret: string): string {
  if (!value) return '';
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(secret, 'base64'), iv);
  const body = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64');
}

/**
 * 봉한 자격 증명을 되돌립니다.
 *
 * 값이 없거나, 열쇠가 맞지 않거나, 내용이 변조돼 GCM 인증이 깨지면 `undefined`를
 * 돌려줍니다. 여기서 던지면 도구 호출이 아니라 모듈을 읽는 시점에 서버가 죽고,
 * 클라이언트에는 `-32000 Connection closed`만 남습니다.
 */
export function unsealCredential(sealed: string, secret: string): string | undefined {
  if (!sealed || !secret) return undefined;
  try {
    const raw = Buffer.from(sealed, 'base64');
    const decipher = createDecipheriv(
      ALGORITHM,
      Buffer.from(secret, 'base64'),
      raw.subarray(0, IV_BYTES),
    );
    decipher.setAuthTag(raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
    const opened = Buffer.concat([
      decipher.update(raw.subarray(IV_BYTES + TAG_BYTES)),
      decipher.final(),
    ]);
    return opened.toString('utf8').trim() || undefined;
  } catch {
    return undefined;
  }
}

// 번들러가 바꿔 놓지 않았으면 식별자가 선언조차 되지 않으므로 `typeof`로 먼저 본다.
const SEAL_SECRET = typeof __TMDB_SEAL_SECRET__ === 'string' ? __TMDB_SEAL_SECRET__ : '';
const SEALED_API_KEY = typeof __TMDB_API_KEY__ === 'string' ? __TMDB_API_KEY__ : '';
const SEALED_ACCESS_TOKEN = typeof __TMDB_ACCESS_TOKEN__ === 'string' ? __TMDB_ACCESS_TOKEN__ : '';

/** 빌드에 심긴 v3 API 키. 심지 않았으면 `undefined` */
export const EMBEDDED_TMDB_API_KEY: string | undefined = unsealCredential(
  SEALED_API_KEY,
  SEAL_SECRET,
);

/** 빌드에 심긴 읽기 액세스 토큰. 심지 않았으면 `undefined` */
export const EMBEDDED_TMDB_ACCESS_TOKEN: string | undefined = unsealCredential(
  SEALED_ACCESS_TOKEN,
  SEAL_SECRET,
);

/** 빌드에 자격 증명이 하나라도 심겨 있으면 `true` */
export function hasEmbeddedCredentials(): boolean {
  return Boolean(EMBEDDED_TMDB_API_KEY || EMBEDDED_TMDB_ACCESS_TOKEN);
}
