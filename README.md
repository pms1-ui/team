# 차일디 목표관리 시스템

## 프로젝트 개요

차일디 목표관리 시스템은 팀 구성원들의 OKR(Objectives and Key Results)을 설정하고, 진척률을 관리하며, 승인 프로세스를 처리하는 웹 기반 성과 관리 시스템입니다.

## 주요 기능

### 1. 대시보드
- 구성원별 OKR 달성 현황 조회
- 월별/분기별/연간 단위 조회 지원
- Key Results별 진척률 시각화

### 2. 목표 설정 및 합의
- 새로운 OKR 작성 및 등록
- Key Results 추가/삭제 기능
- 승인 요청 및 취소 기능
- 상태별 관리 (작성중, 승인 대기중, 합의 완료)

### 3. 내 목표 관리
- 합의 완료된 OKR 조회 및 수정
- Key Results 진척률 업데이트
- 수정 승인 요청 (OKR 변경, KR 내용 변경, KR 항목 증감, 진척률 보고)
- 실시간 변경사항 추적

### 4. 요청 관리 (관리자 전용)
- 모든 승인 대기 요청 조회
- 요청 유형별 필터링 (신규 수립, OKR 변경, KR 변경, 진척률 보고)
- 변경 전후 비교 상세 보기
- 승인/취소 처리

## 기술 스택

- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript
- **Design System**: Custom design tokens with Tailwind configuration
- **Fonts**: Inter (body), Manrope (display)
- **Icons**: Inline SVG
- **Version Control**: Git, GitHub

## 프로젝트 구조

```
team/
├── index.html          # 메인 HTML 파일
├── script.js           # 애플리케이션 로직
├── style.css           # 커스텀 스타일
├── README.md           # 프로젝트 문서
├── DESIGN.md           # 디자인 시스템 문서
└── CHANGELOG.md        # 변경 이력
```

## 사용자 역할

### 관리자 (Admin)
- **계정**: master / 1111
- **권한**: 모든 화면 접근, 요청 승인/거부

### 일반 사용자 (User)
- **계정**: member / 1111
- **권한**: 대시보드, 목표 설정, 내 목표 관리

## 데이터 구조

### OKR 객체
```javascript
{
  id: Number,                    // 고유 ID
  userId: String,                // 사용자 ID
  periodType: String,            // 'monthly' | 'quarterly' | 'yearly'
  periodValue: String,           // '2026-04' | '2026-Q2' | '2026'
  text: String,                  // OKR 목표 텍스트
  keyResults: Array,             // Key Results 배열
  status: String,                // '작성중' | '승인 대기중' | '합의 완료'
  requestType: String | null,    // 요청 유형
  comment: String,               // 요청 코멘트
  isProcessed: Boolean,          // 처리 완료 여부
  tempText: String,              // 임시 OKR 텍스트 (수정 시)
  tempKeyResults: Array          // 임시 KR 배열 (수정 시)
}
```

### Key Result 객체
```javascript
{
  id: String,        // 고유 ID
  text: String,      // KR 내용
  progress: Number   // 진척률 (0-100)
}
```

## 주요 기능 흐름

### 1. OKR 신규 수립
1. 사용자가 "목표 설정 및 합의" 화면에서 OKR 작성
2. Key Results 추가 및 내용 입력
3. "승인 요청" 버튼 클릭
4. 관리자가 "요청 관리"에서 승인
5. 상태가 "합의 완료"로 변경

### 2. 진척률 업데이트
1. 사용자가 "내 목표 관리"에서 진척률 조정
2. "수정 요청" 버튼 클릭 및 코멘트 작성
3. 관리자가 "요청 관리"에서 변경사항 확인
4. 승인 시 실제 데이터에 반영

### 3. OKR/KR 수정
1. 사용자가 "내 목표 관리"에서 OKR 또는 KR 내용 수정
2. 시스템이 자동으로 변경 유형 감지
3. 수정 요청 제출
4. 관리자 승인 후 반영

## 상태 관리

애플리케이트 전역 상태는 `STATE` 객체로 관리됩니다:

```javascript
STATE = {
  user: Object,              // 현재 로그인 사용자
  currentView: String,       // 현재 화면
  dashboardTab: String,      // 대시보드 탭
  dashboardPeriodValue: String,
  goalsSetTab: String,
  goalsSetPeriodValue: String,
  goalsManageTab: String,
  goalsManagePeriodValue: String,
  requestsTab: String,
  requestsPeriodValue: String,
  modalData: Object | null,  // 모달 데이터
  allGoals: Array            // 모든 OKR 데이터
}
```

## 화면별 접근 권한

| 화면 | 관리자 | 일반 사용자 |
|------|--------|-------------|
| 대시보드 | ✅ | ✅ |
| 목표 설정 및 합의 | ✅ | ✅ |
| 내 목표 관리 | ✅ | ✅ |
| 요청 관리 | ✅ | ❌ |

## 설치 및 실행

### 로컬 실행
```bash
# 저장소 클론
git clone https://github.com/pms1-ui/team.git

# 디렉토리 이동
cd team

# 브라우저에서 index.html 열기
# 또는 로컬 서버 실행
python -m http.server 8000
# 또는
npx serve
```

### GitHub Pages 배포
1. GitHub 저장소 Settings > Pages
2. Source를 "main" 브랜치로 설정
3. 배포 URL 확인

## 브라우저 지원

- Chrome (최신 버전)
- Firefox (최신 버전)
- Safari (최신 버전)
- Edge (최신 버전)

## 향후 개선 사항

- [ ] 백엔드 API 연동
- [ ] 데이터베이스 연결
- [ ] 실시간 알림 기능
- [ ] 파일 첨부 기능
- [ ] 히스토리 추적 및 롤백
- [ ] 다크 모드 지원
- [ ] 모바일 반응형 최적화
- [ ] 엑셀 내보내기 기능
- [ ] 차트 및 통계 대시보드

## 라이선스

MIT License

## 기여자

- 개발: Childy Team
- 디자인: Childy Team

## 문의

프로젝트 관련 문의사항은 GitHub Issues를 통해 등록해주세요.
