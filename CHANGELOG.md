# 변경 이력

## 2026-04-16

### UI 스타일 통일화

**변경 내용:**
- '요청 관리' 페이지의 UI 스타일을 '내 목표 관리' 페이지와 동일하게 통일

**상세 변경사항:**

1. **기간 선택 드롭다운 스타일 변경**
   - 기존: 흰색 배경 컨테이너 내부에 위치, `bg-surface-container-low` 사용
   - 변경: 단독 배치, `bg-surface-container` 사용
   - 패딩 조정: `px-4 py-2` → `px-3 py-1.5`

2. **테이블 헤더 스타일 통일**
   - 배경색: `bg-surface-container-low` → `bg-surface-container`
   - 텍스트 스타일: `uppercase tracking-widest` 제거
   - 패딩 조정: `py-5` → `py-4`
   - 테두리 스타일: `border-blue-100` → `border-blue-50`

3. **테이블 컨테이너 스타일 통일**
   - 테두리: `border-blue-100` → `border-blue-50`
   - 하단 여백 제거: `mb-10` 삭제

4. **레이아웃 간소화**
   - 기간 선택 영역의 불필요한 래퍼 제거
   - "총 N건의 결재 라인" 카운터 표시 제거

**영향 범위:**
- `script.js` 파일의 `renderRequests()` 함수
- 필드명 및 기능은 변경 없음 (스타일만 수정)

**목적:**
- 전체 애플리케이션의 일관된 사용자 경험 제공
- 페이지 간 시각적 통일성 확보
