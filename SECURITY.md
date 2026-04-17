# 보안 가이드

## ⚠️ 중요: API 토큰 관리

이 프로젝트는 Baserow API를 사용하며, API 토큰이 필요합니다.

### 초기 설정

1. `config.example.js` 파일을 `config.js`로 복사합니다:
   ```bash
   cp config.example.js config.js
   ```

2. `config.js` 파일을 열고 실제 Baserow API 토큰을 입력합니다:
   ```javascript
   token: 'Token YOUR_ACTUAL_TOKEN_HERE'
   ```

3. **절대로 `config.js` 파일을 Git에 커밋하지 마세요!**
   - 이 파일은 `.gitignore`에 포함되어 있습니다.

### 토큰이 노출된 경우

만약 실수로 토큰이 Git에 커밋되거나 공개된 경우:

1. **즉시 Baserow에서 해당 토큰을 무효화(revoke)하세요**
2. 새로운 토큰을 발급받으세요
3. `config.js` 파일의 토큰을 새 토큰으로 교체하세요
4. Git 히스토리에서 토큰을 완전히 제거하려면:
   ```bash
   git filter-branch --force --index-filter \
   "git rm --cached --ignore-unmatch config.js" \
   --prune-empty --tag-name-filter cat -- --all
   ```

### 배포 시 주의사항

- GitHub Pages나 다른 정적 호스팅에 배포할 때는 `config.js` 파일이 포함되어야 합니다.
- 하지만 Git 저장소에는 포함되지 않아야 합니다.
- 배포 시 수동으로 `config.js` 파일을 서버에 업로드하거나, CI/CD 환경 변수를 사용하세요.

## 문의

보안 관련 문제를 발견하신 경우, 공개 이슈가 아닌 비공개 채널로 연락해주세요.
