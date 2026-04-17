# 보안 가이드

## ⚠️ 중요: API 토큰 관리

이 프로젝트는 Baserow API를 사용하며, API 토큰이 필요합니다.

## Netlify 배포 (권장)

Netlify를 사용하면 환경 변수로 안전하게 토큰을 관리할 수 있습니다.

### 설정 방법

1. **Netlify 환경 변수 설정**:
   - Netlify 대시보드 → Site settings → Environment variables
   - `BASEROW_TOKEN` 변수 추가: `Token YOUR_NEW_TOKEN_HERE`

2. **자동 배포**:
   - Git push 시 자동으로 빌드 및 배포됩니다
   - 빌드 과정에서 환경 변수로부터 `config.js`가 생성됩니다

자세한 내용은 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참고하세요.

## 로컬 개발

### 초기 설정

1. `.env.example` 파일을 `.env`로 복사:
   ```bash
   cp .env.example .env
   ```

2. `.env` 파일에 실제 Baserow API 토큰 입력:
   ```
   BASEROW_TOKEN=Token YOUR_ACTUAL_TOKEN_HERE
   ```

3. `config.js` 생성:
   ```bash
   npm run build
   ```

4. **절대로 `.env` 파일이나 `config.js` 파일을 Git에 커밋하지 마세요!**

## 토큰이 노출된 경우

만약 실수로 토큰이 Git에 커밋되거나 공개된 경우:

1. **즉시 Baserow에서 해당 토큰을 무효화(revoke)하세요**
2. 새로운 토큰을 발급받으세요
3. Netlify 환경 변수를 새 토큰으로 업데이트하세요
4. 로컬 `.env` 파일도 새 토큰으로 업데이트하세요

## 문의

보안 관련 문제를 발견하신 경우, 공개 이슈가 아닌 비공개 채널로 연락해주세요.
