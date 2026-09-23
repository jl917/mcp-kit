import { describe, expect, it } from '@rstest/core';
import {
  createSealSecret,
  EMBEDDED_TMDB_ACCESS_TOKEN,
  EMBEDDED_TMDB_API_KEY,
  hasEmbeddedCredentials,
  sealCredential,
  unsealCredential,
} from '@/tmdb/embedded';

describe('sealCredential() / unsealCredential()', () => {
  it('should return the original value', () => {
    const secret = createSealSecret();
    expect(unsealCredential(sealCredential('v3-api-key', secret), secret)).toBe('v3-api-key');
  });

  // 같은 값을 두 번 봉해도 nonce가 달라 결과가 달라진다. 번들만 비교해서는
  // 두 빌드가 같은 키를 들고 있는지 알 수 없다.
  it('should produce a different ciphertext each time', () => {
    const secret = createSealSecret();
    expect(sealCredential('v3-api-key', secret)).not.toBe(sealCredential('v3-api-key', secret));
  });

  it('should not leave the value readable in the sealed form', () => {
    expect(sealCredential('v3-api-key', createSealSecret())).not.toContain('v3-api-key');
  });

  it('should treat an empty value as nothing to seal', () => {
    const secret = createSealSecret();
    expect(sealCredential('', secret)).toBe('');
    expect(unsealCredential('', secret)).toBeUndefined();
  });

  // 여기서 던지면 도구 호출이 아니라 모듈을 읽는 시점에 서버가 죽는다.
  it('should answer undefined instead of throwing when it cannot open the value', () => {
    const sealed = sealCredential('v3-api-key', createSealSecret());
    expect(unsealCredential(sealed, createSealSecret())).toBeUndefined();
    expect(unsealCredential(sealed, '')).toBeUndefined();
    expect(unsealCredential('not-base64-at-all', createSealSecret())).toBeUndefined();
  });

  it('should reject a value that was tampered with', () => {
    const secret = createSealSecret();
    const raw = Buffer.from(sealCredential('v3-api-key', secret), 'base64');
    raw[raw.length - 1] ^= 0xff;
    expect(unsealCredential(raw.toString('base64'), secret)).toBeUndefined();
  });
});

// 테스트는 번들러를 거치지 않으므로 `define`이 적용되지 않는다. 자격 증명을 심지
// 않은 빌드와 같은 상태이고, 그 상태에서 예전 동작이 그대로 유지되는지 본다.
describe('embedded credentials', () => {
  it('should carry nothing when the build did not inject one', () => {
    expect(hasEmbeddedCredentials()).toBe(false);
    expect(EMBEDDED_TMDB_API_KEY).toBeUndefined();
    expect(EMBEDDED_TMDB_ACCESS_TOKEN).toBeUndefined();
  });
});
