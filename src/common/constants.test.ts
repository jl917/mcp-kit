import { describe, expect, it } from '@rstest/core';
import { VERSION } from '@/common/constants';

describe('VERSION', () => {
  // 테스트는 번들러를 거치지 않으므로 `define`이 적용되지 않는다. 빌드가 아닌
  // 실행에서 실제 릴리스 버전인 척하지 않는지 본다.
  it('should fall back to a marker that is not a release version', () => {
    expect(VERSION).toBe('0.0.0-dev');
  });
});
