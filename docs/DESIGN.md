# 차일디 목표관리 시스템 - 디자인 시스템

## 디자인 철학

차일디 목표관리 시스템은 **명확성**, **일관성**, **효율성**을 핵심 가치로 하는 디자인 시스템을 따릅니다.

- **명확성**: 정보 계층이 명확하고 사용자가 직관적으로 이해할 수 있는 UI
- **일관성**: 모든 화면에서 동일한 패턴과 스타일 적용
- **효율성**: 최소한의 클릭으로 목표를 달성할 수 있는 인터페이스

---

## 색상 시스템 (Color Tokens)

### Primary Colors
```css
--primary: #0053db           /* 주요 액션, 강조 요소 */
--primary-dim: #0048c1       /* Primary hover 상태 */
```

### Surface Colors
```css
--surface: #f8f9ff           /* 메인 배경 */
--surface-container: #eff4ff /* 카드, 컨테이너 배경 */
--surface-container-low: rgba(239, 244, 255, 0.6)
--surface-container-lowest: rgba(255, 255, 255, 0.85)
```

### Text Colors
```css
--on-surface: #003360        /* 주요 텍스트 */
--on-surface-variant: #2f619a /* 보조 텍스트 */
```

### Semantic Colors
```css
--error: #9f403d             /* 에러, 삭제, 경고 */
--success: #059669           /* 성공, 완료, 승인 */
```

### 색상 사용 가이드

| 요소 | 색상 | 용도 |
|------|------|------|
| 버튼 (Primary) | `bg-primary` | 주요 액션 (승인, 저장, 요청) |
| 버튼 (Secondary) | `bg-white border-blue-100` | 보조 액션 (취소, 닫기) |
| 버튼 (Danger) | `border-error text-error` | 삭제, 취소 요청 |
| 링크/강조 텍스트 | `text-primary` | 클릭 가능한 요소 |
| 본문 텍스트 | `text-on-surface` | 일반 텍스트 |
| 보조 텍스트 | `text-on-surface-variant` | 라벨, 설명 |
| 배경 | `bg-surface` | 페이지 배경 |
| 카드 배경 | `bg-white` | 테이블, 카드 |

---

## 타이포그래피 (Typography)

### 폰트 패밀리
```css
font-sans: 'Inter', sans-serif      /* 본문, 일반 텍스트 */
font-display: 'Manrope', sans-serif /* 제목, 강조 텍스트 */
```

### 폰트 크기 및 용도

| 클래스 | 크기 | 용도 | 예시 |
|--------|------|------|------|
| `text-2xl` | 24px | 페이지 타이틀 | "대시보드", "목표 설정 및 합의" |
| `text-lg` | 18px | 섹션 제목, 탭 | "월별", "분기별", "연간" |
| `text-[14px]` | 14px | 테이블 헤더, 버튼 | 필드명, 액션 버튼 |
| `text-[13px]` | 13px | 테이블 내용, 일반 텍스트 | OKR 내용, KR 텍스트 |
| `text-[12px]` | 12px | 보조 버튼, 태그 | "추가", 상태 태그 |
| `text-[11px]` | 11px | 배지, 라벨 | 알림 배지 |
| `text-[10px]` | 10px | 캡션, 메타 정보 | "작업 공간" 라벨 |

### 폰트 굵기

| 클래스 | 굵기 | 용도 |
|--------|------|------|
| `font-black` | 900 | 최상위 강조 (헤더, 중요 수치) |
| `font-extrabold` | 800 | 테이블 헤더, 섹션 타이틀 |
| `font-bold` | 700 | 버튼, 강조 텍스트 |
| `font-semibold` | 600 | 서브 헤딩 |
| `font-medium` | 500 | 일반 텍스트 (약간 강조) |
| `font-normal` | 400 | 본문 텍스트 |

---

## 간격 시스템 (Spacing)

### 컴포넌트 간격
```css
mb-4  /* 16px - 기본 요소 간 간격 */
mb-6  /* 24px - 섹션 간 간격 */
mb-8  /* 32px - 큰 섹션 간 간격 */
mb-10 /* 40px - 페이지 레벨 간격 */
```

### 내부 패딩
```css
p-1   /* 4px  - 탭 컨테이너 */
p-2   /* 8px  - 작은 버튼 */
p-3   /* 12px - 입력 필드 */
p-4   /* 16px - 일반 버튼 */
p-6   /* 24px - 카드 내부 */
p-10  /* 40px - 모달 내부 */
```

### 수평 간격
```css
gap-1  /* 4px  - 밀접한 요소 */
gap-2  /* 8px  - 버튼 그룹 */
gap-3  /* 12px - 폼 요소 */
gap-4  /* 16px - 카드 내 요소 */
gap-8  /* 32px - 탭 버튼 */
```

---

## 레이아웃 패턴

### 1. 페이지 레이아웃 구조

모든 화면은 동일한 구조를 따릅니다:

```html
<!-- 탭 영역 -->
<div class="flex items-center gap-8 border-b-2 border-blue-50 mb-6 px-2 w-full">
    <button class="pb-3 text-lg transition-all [active-styles]">탭1</button>
    <button class="pb-3 text-lg transition-all [inactive-styles]">탭2</button>
</div>

<!-- 기간 선택 영역 -->
<div class="mb-4 w-full">
    <select class="bg-surface-container text-primary font-bold border border-blue-50 rounded-lg text-[13px] px-3 py-1.5 outline-none">
        <!-- options -->
    </select>
</div>

<!-- 메인 콘텐츠 (테이블) -->
<div class="bg-white rounded-2xl border border-blue-50 shadow-sm w-full overflow-hidden">
    <table class="w-full text-left table-auto">
        <!-- content -->
    </table>
</div>
```

### 2. 탭 스타일

**활성 탭**:
```css
border-b-2 border-primary text-primary font-bold
```

**비활성 탭**:
```css
text-on-surface-variant hover:text-primary
```

### 3. 테이블 스타일

**테이블 헤더**:
```html
<thead class="bg-surface-container">
    <tr class="text-[14px] text-on-surface-variant font-extrabold border-b border-blue-50">
        <th class="py-4 px-6 border-r border-blue-50/30">필드명</th>
    </tr>
</thead>
```

**테이블 바디**:
```html
<tbody>
    <tr class="hover:bg-surface-container-lowest transition-colors border-b border-blue-50/50">
        <td class="py-5 px-6 border-r border-blue-50/30">내용</td>
    </tr>
</tbody>
```

---

## 컴포넌트 스타일

### 버튼

#### Primary Button
```html
<button class="bg-primary text-white py-2 px-4 rounded-lg text-[13px] font-bold shadow-sm hover:bg-primary-dim transition-all">
    버튼 텍스트
</button>
```

#### Secondary Button
```html
<button class="bg-white border border-blue-100 text-primary font-bold text-[13px] rounded-lg hover:bg-blue-50 transition-all shadow-sm">
    버튼 텍스트
</button>
```

#### Danger Button
```html
<button class="border border-error text-error hover:bg-error/10 py-2 rounded-lg text-[13px] font-bold transition-colors">
    삭제
</button>
```

### 입력 필드

#### Text Input
```html
<input type="text" class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-medium text-on-surface outline-none focus:border-primary shadow-sm transition-all">
```

#### Textarea
```html
<textarea rows="3" class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-bold text-on-surface outline-none focus:border-primary shadow-sm resize-none"></textarea>
```

#### Select Dropdown
```html
<select class="bg-surface-container text-primary font-bold border border-blue-50 rounded-lg text-[13px] px-3 py-1.5 outline-none">
    <option>옵션</option>
</select>
```

### 카드

```html
<div class="bg-white rounded-2xl border border-blue-50 shadow-sm p-6">
    <!-- 카드 내용 -->
</div>
```

### 모달

```html
<div class="fixed inset-0 z-[100] flex items-center justify-center p-6">
    <div class="absolute inset-0 bg-black/40 backdrop-blur-[3px]"></div>
    <div class="relative bg-white rounded-[2rem] w-full max-w-xl shadow-2xl p-10 border border-blue-100">
        <!-- 모달 내용 -->
    </div>
</div>
```

### 상태 태그

```html
<!-- 신규 수립 -->
<span class="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 text-[12px] font-extrabold rounded-md">신규 수립</span>

<!-- 진척률 -->
<span class="px-2.5 py-1 bg-[#fef3c7] text-[#b45309] border border-[#f59e0b]/20 text-[12px] font-extrabold rounded-md">진척률</span>

<!-- OKR 변경 -->
<span class="px-2.5 py-1 bg-[#ecfdf5] text-[#047857] border border-[#10b981]/20 text-[12px] font-extrabold rounded-md">OKR 변경</span>

<!-- KR 변경 -->
<span class="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-[12px] font-extrabold rounded-md">KR 변경</span>
```

---

## 인터랙션 & 애니메이션

### Transition
모든 인터랙티브 요소는 부드러운 전환 효과를 적용합니다:
```css
transition-all
transition-colors
transition-opacity
transition-transform
```

### Hover Effects

**버튼**:
- Primary: `hover:bg-primary-dim`
- Secondary: `hover:bg-blue-50`
- Danger: `hover:bg-error/10`

**테이블 행**:
```css
hover:bg-surface-container-lowest transition-colors
```

**링크/텍스트**:
```css
hover:text-primary
```

### Focus States

모든 입력 필드는 포커스 시 primary 색상 테두리를 표시합니다:
```css
focus:border-primary focus:ring-1 focus:ring-primary/20
```

---

## 반응형 디자인

### 브레이크포인트
```css
sm: 640px   /* 모바일 */
md: 768px   /* 태블릿 */
lg: 1024px  /* 데스크톱 */
xl: 1280px  /* 대형 데스크톱 */
```

### 현재 구현
- 데스크톱 우선 디자인 (1280px 이상 최적화)
- 사이드바 고정 너비: 256px (w-64)
- 메인 콘텐츠: flex-1 (가변)

---

## 아이콘 시스템

### 아이콘 스타일
- **라이브러리**: Inline SVG (Heroicons 스타일)
- **크기**: w-4 h-4 (16px), w-5 h-5 (20px)
- **색상**: currentColor (부모 텍스트 색상 상속)
- **Stroke Width**: 2px (기본)

### 주요 아이콘 용도
- **대시보드**: 수평선 아이콘
- **목표 설정**: 플러스 아이콘
- **내 목표 관리**: 차트 아이콘
- **요청 관리**: 체크 서클 아이콘
- **추가**: 플러스 아이콘
- **삭제**: X 아이콘
- **알림**: 벨 아이콘

---

## 그림자 시스템

```css
shadow-sm    /* 0 1px 2px - 미세한 그림자 */
shadow       /* 0 1px 3px - 기본 그림자 */
shadow-md    /* 0 4px 6px - 중간 그림자 */
shadow-lg    /* 0 10px 15px - 큰 그림자 */
shadow-xl    /* 0 20px 25px - 매우 큰 그림자 */
shadow-2xl   /* 0 25px 50px - 모달 그림자 */
```

### 사용 가이드
- **버튼**: `shadow-sm`
- **카드/테이블**: `shadow-sm`
- **드롭다운**: `shadow-sm`
- **모달**: `shadow-2xl`

---

## 테두리 시스템

### Border Radius
```css
rounded-md   /* 6px  - 작은 요소 */
rounded-lg   /* 8px  - 버튼, 입력 필드 */
rounded-xl   /* 12px - 카드 내부 요소 */
rounded-2xl  /* 16px - 카드, 테이블 */
rounded-full /* 50%  - 원형 (아바타, 배지) */
```

### Border Colors
```css
border-blue-50      /* 기본 테두리 */
border-blue-50/30   /* 투명도 30% */
border-blue-100     /* 강조 테두리 */
border-primary      /* Primary 테두리 */
border-error        /* Error 테두리 */
```

---

## 접근성 (Accessibility)

### 색상 대비
- 모든 텍스트는 WCAG AA 기준 이상의 대비율 유지
- Primary (#0053db)와 흰색 배경: 8.6:1
- On-surface (#003360)와 흰색 배경: 12.6:1

### 키보드 네비게이션
- 모든 인터랙티브 요소는 키보드로 접근 가능
- Focus 상태 명확히 표시
- Tab 순서 논리적 구성

### 시맨틱 HTML
- 적절한 HTML5 태그 사용 (header, nav, main, table)
- 버튼은 `<button>` 태그 사용
- 폼 요소는 적절한 label 연결

---

## 개발 가이드라인

### 새로운 화면 추가 시

1. **탭 구조 복사**: 기존 화면의 탭 구조를 그대로 사용
2. **기간 선택 위치**: 탭 바로 아래, `mb-4` 간격
3. **테이블 스타일**: `bg-surface-container` 헤더, `border-blue-50` 테두리
4. **버튼 정렬**: 우측 정렬 시 `flex justify-between items-start` 사용

### 새로운 컴포넌트 추가 시

1. **색상**: 디자인 토큰 사용 (커스텀 색상 금지)
2. **간격**: Tailwind 기본 간격 시스템 사용
3. **폰트**: Inter (본문), Manrope (제목)
4. **애니메이션**: `transition-all` 또는 `transition-colors` 사용

### 코드 스타일

```javascript
// 클래스명은 논리적 순서로 작성
// 1. 레이아웃 (flex, grid, w-, h-)
// 2. 간격 (p-, m-, gap-)
// 3. 색상 (bg-, text-, border-)
// 4. 타이포그래피 (font-, text-[size])
// 5. 테두리 (border, rounded-)
// 6. 그림자 (shadow-)
// 7. 상태 (hover:, focus:, transition-)

<button class="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold text-[13px] rounded-lg shadow-sm hover:bg-primary-dim transition-all">
```

---

## 디자인 체크리스트

새로운 UI 요소를 추가할 때 다음을 확인하세요:

- [ ] 색상이 디자인 토큰을 사용하는가?
- [ ] 폰트 크기가 정의된 스케일을 따르는가?
- [ ] 간격이 일관성 있게 적용되었는가?
- [ ] Hover/Focus 상태가 정의되어 있는가?
- [ ] 다른 화면과 시각적 일관성이 있는가?
- [ ] 테두리 반경이 적절한가?
- [ ] 그림자가 과하지 않은가?
- [ ] 애니메이션이 부드러운가?
- [ ] 접근성 기준을 충족하는가?

---

## 참고 자료

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Heroicons](https://heroicons.com/)
- [Google Fonts - Inter](https://fonts.google.com/specimen/Inter)
- [Google Fonts - Manrope](https://fonts.google.com/specimen/Manrope)

---

**마지막 업데이트**: 2026-04-16
