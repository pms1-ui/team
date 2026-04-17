# 배포 가이드

## Netlify 배포 설정

### 1. Netlify 사이트 생성

1. [Netlify](https://app.netlify.com/)에 로그인
2. "Add new site" → "Import an existing project" 클릭
3. GitHub 저장소 연결: `pms1-ui/team`
4. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.` (루트 디렉토리)

### 2. 환경 변수 설정

Netlify 대시보드에서 **Site settings** → **Environment variables**로 이동하여 다음 변수들을 추가하세요:

#### 필수 환경 변수:

```
BASEROW_TOKEN=Token YOUR_NEW_TOKEN_HERE
```

#### 선택적 환경 변수 (기본값 사용 가능):

```
BASEROW_API_URL=https://baserow.childylab.com/api
TABLE_DIVISIONS=1940
TABLE_TEAMS=1941
TABLE_MEMBERS=1942
TABLE_GOALS=1943
TABLE_KEY_RESULTS=1944
TABLE_RNR=1945
```

### 3. 배포

환경 변수 설정 후:
1. "Deploy site" 버튼 클릭
2. 빌드가 완료되면 자동으로 배포됩니다
3. Netlify가 제공하는 URL로 접속 가능합니다 (예: `https://your-site-name.netlify.app`)

### 4. 커스텀 도메인 (선택사항)

Netlify 대시보드에서 **Domain settings**로 이동하여 커스텀 도메인을 설정할 수 있습니다.

## 로컬 개발 환경

### 1. 환경 변수 설정

로컬에서 개발할 때는 `.env` 파일을 생성하세요:

```bash
cp .env.example .env
```

`.env` 파일에 실제 토큰을 입력:

```
BASEROW_TOKEN=Token YOUR_TOKEN_HERE
BASEROW_API_URL=https://baserow.childylab.com/api
TABLE_DIVISIONS=1940
TABLE_TEAMS=1941
TABLE_MEMBERS=1942
TABLE_GOALS=1943
TABLE_KEY_RESULTS=1944
TABLE_RNR=1945
```

### 2. config.js 생성

```bash
npm run build
```

이 명령어는 환경 변수를 읽어서 `config.js` 파일을 생성합니다.

### 3. 로컬 서버 실행

간단한 HTTP 서버로 테스트:

```bash
# Python 3
python -m http.server 8000

# Node.js (http-server 설치 필요)
npx http-server -p 8000
```

브라우저에서 `http://localhost:8000` 접속

## 보안 체크리스트

- [ ] Baserow에서 노출된 기존 토큰 무효화
- [ ] 새 토큰 발급
- [ ] Netlify 환경 변수에 새 토큰 설정
- [ ] 로컬 `.env` 파일에 새 토큰 설정
- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] `config.js` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] Git 히스토리에 토큰이 남아있지 않은지 확인

## 문제 해결

### config.js 파일이 없다는 오류

로컬 개발 시:
```bash
npm run build
```

Netlify 배포 시:
- 환경 변수가 올바르게 설정되었는지 확인
- Build log에서 "config.js generated" 메시지 확인

### API 연결 오류

- Netlify 환경 변수에서 `BASEROW_TOKEN` 값 확인
- 토큰 형식: `Token YOUR_TOKEN_HERE` (앞에 "Token " 포함)
- Baserow에서 토큰이 활성화되어 있는지 확인
