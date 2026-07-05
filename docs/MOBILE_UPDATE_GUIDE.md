# 모바일 반응형 업데이트 가이드

## 완료된 작업

1. **HTML 구조 업데이트** ✅
   - 햄버거 메뉴 버튼 추가
   - 모바일 오버레이 추가
   - 사이드바 슬라이드 애니메이션
   - 반응형 패딩 및 텍스트 크기

2. **모바일 렌더 함수 작성** ✅
   - `script-mobile.js` 파일 생성
   - 모든 화면의 모바일 카드 레이아웃 함수 작성:
     - `renderDashboardMobile()` - 카드 기반 OKR 표시
     - `renderGoalsSetMobile()` - 카드 기반 목표 설정
     - `renderGoalsManageMobile()` - 카드 기반 목표 관리
     - `renderRequestsMobile()` - 카드 기반 요청 관리
     - `renderMembersMobile()` - 카드 기반 구성원 관리

3. **모바일 메뉴 토글 함수** ✅
   - `toggleMobileMenu()` - 사이드바 열기/닫기
   - `closeMobileMenuOnNavigate()` - 메뉴 선택 시 자동 닫기

## 다음 단계 (수동 적용 필요)

각 render 함수에 다음 패턴을 적용해야 합니다:

```javascript
function renderXXX(container) {
    // 데이터 준비
    const data = ...;
    
    // 모바일 감지
    const isMobile = window.innerWidth < 1024;
    
    // 공통 헤더 (탭 + 기간 선택)
    let h = `
        <div class="flex items-center gap-4 lg:gap-8 border-b-2 border-blue-50 mb-6 px-2 w-full overflow-x-auto">
            <button ... class="pb-3 text-sm lg:text-lg ...">탭1</button>
            ...
        </div>
        <div class="mb-4 w-full">
            <select class="w-full lg:w-auto ...">...</select>
        </div>
    `;
    
    // 모바일/데스크톱 분기
    if(isMobile) {
        h += renderXXXMobile(data);
    } else {
        h += `<div class="bg-white rounded-2xl ...">
            <table>...</table>
        </div>`;
    }
    
    container.innerHTML = h;
}
```

## 모바일 레이아웃 특징

### 대시보드
- 사용자별 카드로 분리
- OKR당 하나의 카드
- Key Results는 카드 내부에 세로 배치
- 진척률 바와 퍼센트 표시

### 목표 설정 및 합의
- OKR당 하나의 카드
- 상태 배지 (작성중/승인 대기중/합의 완료)
- KR 추가/삭제 버튼
- 승인 요청/삭제 버튼

### 내 목표 관리
- OKR당 하나의 카드
- KR 진척률 슬라이더
- 실시간 퍼센트 업데이트
- 수정 요청/요청 취소 버튼

### 요청 관리
- 요청당 하나의 카드
- 기안자 정보 (아바타 + 이름)
- 성격 태그 (신규 수립, 진척률, OKR 변경 등)
- 상세 내용 확인 / 코멘트 보기 버튼
- 승인 처리 / 승인 취소 버튼

### 구성원 관리
- 구성원당 하나의 카드
- 모든 필드 세로 배치
- 드롭다운 (팀명, 직책)
- 삭제 버튼

## CSS 반응형 클래스

- `lg:` 접두사 = 1024px 이상 (데스크톱)
- 모바일: 기본 스타일
- 예시:
  - `text-sm lg:text-lg` - 모바일 작게, 데스크톱 크게
  - `px-4 lg:px-10` - 모바일 작은 패딩, 데스크톱 큰 패딩
  - `w-full lg:w-auto` - 모바일 전체 너비, 데스크톱 자동

## 테스트 방법

1. 브라우저 개발자 도구 열기 (F12)
2. 디바이스 툴바 토글 (Ctrl+Shift+M)
3. 다양한 화면 크기 테스트:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)
   - Desktop (1024px+)

## 주의사항

- 모든 버튼은 터치 친화적 크기 (최소 44x44px)
- 텍스트는 모바일에서 읽기 쉬운 크기 (최소 12px)
- 입력 필드는 충분한 패딩 (px-3 py-2)
- 카드 간격은 mb-4 (16px)
