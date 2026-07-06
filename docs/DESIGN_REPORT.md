# 평가 리포트 디자인 시스템

> 구성원별 AI 피드백 리포트를 **A4 세로형 PDF/출력용**으로 제작할 때 적용하는 디자인 가이드입니다.
> (주)차일디 IR 투자제안서의 폰트, 배치, 컬러 톤을 참조하되 세로형 평가표에 맞게 변환합니다.

---

## 1. 페이지 규격

| 항목 | 값 |
|------|------|
| 용지 | A4 (210mm × 297mm) |
| 방향 | 세로(Portrait) |
| 여백 | 상 30mm, 하 25mm, 좌우 25mm |
| 콘텐츠 영역 | 160mm × 242mm |
| 페이지 번호 | 우측 상단, 13px, `#94a3b8` |

---

## 2. 컬러 시스템

투자제안서의 파란색 기조를 유지하되, 평가 등급에 따른 보조색을 추가합니다.

### Primary (브랜드)

| 용도 | HEX | 사용처 |
|------|------|--------|
| Primary Blue | `#2563EB` | 표지 배경, 섹션 타이틀, 표 헤더, 강조 텍스트 |
| Primary Dark | `#1E40AF` | 표지 제목, hover 상태 |
| Primary Light | `#DBEAFE` | 강점 태그 배경, 연한 강조 영역 |

### Neutral (본문)

| 용도 | HEX | 사용처 |
|------|------|--------|
| Text Primary | `#1E293B` | 본문 텍스트, 이름 |
| Text Secondary | `#475569` | 보조 설명, 직급 |
| Text Tertiary | `#94A3B8` | 페이지 번호, 날짜 |
| Background | `#FFFFFF` | 페이지 배경 |
| Surface | `#F8FAFC` | 섹션 구분 박스 배경 |
| Border | `#E2E8F0` | 표 경계선, 구분선 |

### Semantic (평가 등급)

| 등급 | 배경 | 텍스트 | 조건 |
|------|------|--------|------|
| 우수 (8.0+) | `#DCFCE7` | `#166534` | 종합 8.0 이상 |
| 양호 (6.5~7.9) | `#FEF9C3` | `#854D0E` | 종합 6.5~7.9 |
| 개선필요 (~6.4) | `#FEE2E2` | `#991B1B` | 종합 6.4 이하 |

---

## 3. 타이포그래피

투자제안서의 폰트 사용 패턴을 세로형에 맞게 적용합니다.

| 역할 | 폰트 | 굵기 | 크기 | 행간 | 사용처 |
|------|------|------|------|------|--------|
| 표지 타이틀 | Pretendard | Bold (700) | 36px | 1.3 | 표지 문서 제목 |
| 표지 서브타이틀 | Pretendard | Regular (400) | 16px | 1.5 | 표지 부제, 날짜 |
| 섹션 타이틀 | Pretendard | Bold (700) | 20px | 1.4 | "OKR 달성 현황" 등 |
| 구성원 이름 | Pretendard | Bold (700) | 18px | 1.4 | 카드 헤더 |
| 본문 | Pretendard | Regular (400) | 13px | 1.7 | 서술 평가, 설명 |
| 표 헤더 | Pretendard | SemiBold (600) | 12px | 1.4 | 표 th |
| 표 본문 | Pretendard | Regular (400) | 12px | 1.5 | 표 td |
| 태그 | Pretendard | Medium (500) | 11px | 1.2 | 강점/개선 태그 |
| 캡션 | Pretendard | Regular (400) | 11px | 1.5 | 하단 안내문 |

---

## 4. 페이지 구성

### 4-1. 표지 (1페이지)

`260706_DX_2026_Q2_report_ai.html`의 표지 구조를 표준으로 사용한다.

```html
<div class="page cover">
  <div class="cover-inner">  <!-- padding: 28mm, flex-start -->
    <div class="logo">Childy</div>  <!-- 좌상단, mb: 40mm -->
    <h1>제목 (32px bold white)</h1>
    <p class="sub">설명문 (13px, white 80%)</p>
  </div>
  <div class="foot">© childy.co.kr</div>  <!-- 좌하단, mt: auto -->
</div>
```

- 배경: `#2563EB` 전면
- 제목은 상단 1/3 지점에 위치 (가운데 아님, 위쪽 배치)
- 로고 → 여백 40mm → 제목 → 설명 → (하단 자동) 카피라이트

### 4-2. 본문 페이지

`260706_DX_2026_Q2_report_ai_shared.html`의 본문 스타일을 표준으로 사용한다.

```css
/* 구성원 헤더 */
.person-header { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #e2e8f0; }
.person-name { font-size: 18px; font-weight: 700; }
.person-role { font-size: 12px; color: #475569; }

/* OKR 리스트 */
.okr-list li { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #f1f5f9; font-size: 12px; }

/* 평가 블록 */
.eval-block { background: #f8fafc; border-radius: 8px; padding: 14px; margin-bottom: 10px; }
.eval-block .block-title { font-size: 12px; font-weight: 700; color: #2563EB; }
.eval-block li { font-size: 12px; color: #334155; }
.eval-block p { font-size: 12px; color: #334155; }

/* 태그 */
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.tag { padding: 3px 9px; border-radius: 5px; font-size: 11px; font-weight: 500; }
```

### 4-3. 통합 기준 요약

| 요소 | 참조 파일 |
|------|-----------|
| 표지 구조 | `report_ai.html` (cover-inner, flex-start, 로고 위 배치) |
| 본문 스타일 | `report_ai_shared.html` (person-header, eval-block, okr-list, tags) |
| 인쇄 CSS | 공통 (`@page size: 210mm 297mm; margin: 0`, `color-adjust: exact`) |

앞으로 리포트 생성 시 이 두 파일의 조합을 표준 템플릿으로 사용한다.

---

## 5. 표(Table) 스타일

투자제안서의 표 스타일을 따릅니다.

```css
/* 표 헤더 */
th {
  background: #2563EB;
  color: #FFFFFF;
  font-weight: 600;
  padding: 10px 14px;
  text-align: center;
  font-size: 12px;
}

/* 표 본문 */
td {
  padding: 10px 14px;
  border-bottom: 1px solid #E2E8F0;
  font-size: 12px;
  text-align: center;
}

/* 짝수 행 */
tr:nth-child(even) {
  background: #F8FAFC;
}
```

---

## 6. 섹션 타이틀 스타일

투자제안서에서 좌측 상단 파란색 섹션 타이틀을 사용하는 패턴을 따릅니다.

```css
.section-title {
  color: #2563EB;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #2563EB;
  display: inline-block;
}
```

---

## 7. 태그(Badge) 스타일

| 유형 | 배경 | 텍스트 | 용도 |
|------|------|--------|------|
| 강점 | `#DBEAFE` | `#1E40AF` | 잘한 점 |
| 개선 | `#FEF3C7` | `#92400E` | 개선 필요 |
| 점수 뱃지 (우수) | `#DCFCE7` | `#166534` | 8.0+ |
| 점수 뱃지 (양호) | `#FEF9C3` | `#854D0E` | 6.5~7.9 |
| 점수 뱃지 (개선) | `#FEE2E2` | `#991B1B` | ~6.4 |

```css
.tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
}
```

---

## 8. 인쇄/PDF 변환 규칙

```css
@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page-break { page-break-before: always; }
  .no-break { page-break-inside: avoid; }
}

@page {
  size: A4 portrait;
  margin: 30mm 25mm 25mm 25mm;
}
```

- 표지는 반드시 단독 1페이지 (page-break-after: always)
- 개인별 카드는 page-break-inside: avoid 적용
- 카드가 페이지를 넘기면 다음 페이지 시작에서 자르기

---

## 9. 레이아웃 참고 (투자제안서 패턴 → 세로형 변환)

| 투자제안서 (가로형) | 평가표 (세로형) |
|---------------------|----------------|
| 좌측 대형 타이틀 + 우측 설명 | 상단 이름/점수 + 하단 서술 |
| 가로 2분할 비교 박스 | 3축 점수 가로 3등분 그리드 |
| 파란 헤더 + 흰 본문 표 | 동일 적용 |
| 우측 상단 페이지 번호 | 동일 적용 |
| 하단 여백 넉넉히 | A4 하단 여백 25mm 유지 |

---

## 10. 파일 네이밍

| 용도 | 파일명 |
|------|--------|
| 스코어 포함 (관리자용) | `{팀명}_{분기}_{연도}_review.html` |
| 스코어 제외 (공유용) | `{팀명}_{분기}_{연도}_review_shared.html` |
| PDF 출력용 | `{팀명}_{분기}_{연도}_review_print.html` (print CSS 적용 버전) |
