// --- State & Config ---
const STATE = {
    user: null, // { id: 'master'|'member', name: '...', role: 'admin'|'user', division: '운영본부' }
    currentView: 'dashboard',
    
    // Tab states
    dashboardTab: 'quarterly',
    dashboardPeriodValue: '',
    
    goalsSetTab: 'quarterly',
    goalsSetPeriodValue: '',
    
    goalsManageTab: 'quarterly',
    goalsManagePeriodValue: '',
    
    requestsTab: 'quarterly',
    requestsPeriodValue: '',
    requestsFilter: 'pending', // 'pending' | 'approved' | 'rejected'
    requestsDivisionFilter: 'all',
    requestsTeamFilter: 'all',
    
    // Feedback State
    feedbackSelectedMember: '',
    feedbackData: {},
    feedbackPeriod: '2026',
    feedbackView: 'dashboard',
    feedbackDashPeriod: '2026-Q2',
    feedbackTeamFilter: 'all',
    feedbackDashTeamFilter: 'all',
    feedbackDivisionFilter: 'all',
    feedbackDashDivisionFilter: 'all',
    feedbackPeriodType: '', // '' | 'quarterly' | 'yearly'
    assessmentData: [],
    
    // Modal State
    modalData: null, // { title: '', content: '', onConfirm: null, isWide: false }
    
    // Members filter state
    membersTeamFilter: 'all', // 'all' or team name
    membersDivisionFilter: 'all', // 'all' or division name
    membersShowHidden: false, // 숨긴 구성원 보기 토글
    membersView: 'list', // 'list' | 'pending'
    
    // Weekly report team filter (all view)
    weeklyReportTeamFilter: '',
    weeklyReportDivisionFilter: '',
    
    // Dashboard team filter
    dashboardTeamFilter: 'all', // 'all' or team name
    dashboardDivisionFilter: 'all', // 'all' or division name
    
    // R&R view state
    rnrViewMode: 'edit', // 'edit' | 'browse'
    rnrBrowseTeamFilter: 'all', // 'all' or team name
    
    // Divisions Data (loaded from Baserow)
    divisions: [],
    
    // Teams Data (loaded from Baserow)
    teams: [],
    
    // Members Data (loaded from Baserow)
    members: [],
    
    // R&R Data (loaded from Baserow)
    rnrData: [],
    
    // Weekly Report Data
    weeklyReports: [],
    weeklyReportSelectedMonth: '',   // 'YYYY-M' 형식
    weeklyReportSelectedWeek: '',    // 'YYYY-M-W' 형식
    
    // All Goals Data (loaded from Baserow)
    allGoals: [],
    
    // Period Settings
    periodSettings: [],
    
    // Loading state
    isLoading: true
};

const USER_NAMES = {
    'master': '마스터 관리자',
    'member': '김전략',
    'member2': '박성공',
    'member3': '이혁신',
    'member4': '최효율'
};

// Get user display name from members data
function getUserName(userId) {
    const member = STATE.members.find(m => m.user_id === userId);
    if (member) return member.name;
    return USER_NAMES[userId] || userId;
}

// Format date to Korean format (YYYY-MM-DD HH:mm)
function formatRequestDate(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// --- Baserow Data Loading ---

// --- Baserow Data Loading ---
async function loadDataFromBaserow() {
    console.log('Loading data from Baserow (parallel)...');
    const t0 = Date.now();

    try {
        // 1단계: 독립적인 테이블 전부 병렬로 한 번에 호출
        const [
            divisionsResult,
            teamsResult,
            membersResult,
            rnrResult,
            goalsResult,
            allKeyResultsResult,
            weeklyReportsResult,
            assessmentResult,
            periodSettingsResult
        ] = await Promise.allSettled([
            DivisionsAPI.list(),
            TeamsAPI.list(),
            MembersAPI.list(),
            RnRAPI.list(),
            GoalsAPI.list(),
            KeyResultsAPI.listAll(),
            WeeklyReportAPI.list(),
            AssessmentAPI.list(),
            PeriodSettingsAPI.list()
        ]);

        // --- divisions ---
        if (divisionsResult.status === 'fulfilled') {
            STATE.divisions = divisionsResult.value;
        } else {
            console.error('divisions load error:', divisionsResult.reason);
            STATE.divisions = [{ id: 1, name: '운영본부' }];
        }

        // --- teams ---
        if (teamsResult.status === 'fulfilled') {
            STATE.teams = teamsResult.value;
        } else {
            console.error('teams load error:', teamsResult.reason);
            STATE.teams = [];
        }

        // --- members ---
        if (membersResult.status === 'fulfilled') {
            STATE.members = membersResult.value;
        } else {
            console.error('members load error:', membersResult.reason);
            STATE.members = [];
        }

        // --- rnr ---
        if (rnrResult.status === 'fulfilled') {
            STATE.rnrData = rnrResult.value.map(rnr => ({
                id: rnr.id,
                user_id: rnr.user_id,
                name: rnr.name,
                team: rnr.team,
                position: rnr.position,
                job: rnr.job,
                rnr: rnr.rnr,
                content: rnr.content,
                status: rnr.status,
                request_type: rnr.request_type,
                temp_content: rnr.temp_content,
                comment: rnr.comment,
                reject_comment: rnr.reject_comment,
                request_date: rnr.request_date || null
            }));
        } else {
            console.error('rnr load error:', rnrResult.reason);
            STATE.rnrData = [];
        }

        // --- goals + key_results 매핑 (API 1회로 처리) ---
        if (goalsResult.status === 'fulfilled') {
            const goals = goalsResult.value;

            // key_results를 goal_id → KR 배열로 그룹핑
            const krMap = {};
            if (allKeyResultsResult.status === 'fulfilled') {
                for (const kr of allKeyResultsResult.value) {
                    const gid = String(kr.goal_id);
                    if (!krMap[gid]) krMap[gid] = [];
                    krMap[gid].push({
                        id: kr.kr_id,
                        text: kr.KR || '',
                        progress: parseInt(kr.progress) || 0
                    });
                }
            } else {
                console.error('key_results load error:', allKeyResultsResult.reason);
            }

            STATE.allGoals = goals.map(goal => {
                let tempKeyResults;
                if (goal.temp_kr) {
                    try { tempKeyResults = JSON.parse(goal.temp_kr); } catch (e) {}
                }
                return {
                    id: goal.id,
                    userId: goal.user_id,
                    periodType: goal.period_type,
                    periodValue: goal.period_value,
                    text: goal.OKR || '',
                    keyResults: krMap[String(goal.id)] || [],
                    status: goal.status,
                    requestType: goal.request_type || null,
                    comment: goal.comment || '',
                    isProcessed: goal.is_processed || false,
                    tempText: goal.temp_text || undefined,
                    tempKeyResults,
                    reject_comment: goal.reject_comment || null,
                    request_date: goal.request_date || null
                };
            });
        } else {
            console.error('goals load error:', goalsResult.reason);
            STATE.allGoals = [];
        }

        // --- weekly reports ---
        if (weeklyReportsResult.status === 'fulfilled') {
            STATE.weeklyReports = weeklyReportsResult.value;
        } else {
            console.error('weekly reports load error:', weeklyReportsResult.reason);
            STATE.weeklyReports = [];
        }

        // --- assessment ---
        if (assessmentResult.status === 'fulfilled') {
            STATE.assessmentData = assessmentResult.value;
        } else {
            console.error('assessment load error:', assessmentResult.reason);
            STATE.assessmentData = [];
        }

        // --- period settings ---
        if (periodSettingsResult.status === 'fulfilled') {
            STATE.periodSettings = periodSettingsResult.value;
        } else {
            console.error('period settings load error:', periodSettingsResult.reason);
            STATE.periodSettings = [];
        }

        console.log(`All data loaded in ${Date.now() - t0}ms`, {
            divisions: STATE.divisions.length,
            teams: STATE.teams.length,
            members: STATE.members.length,
            rnrData: STATE.rnrData.length,
            allGoals: STATE.allGoals.length,
            weeklyReports: STATE.weeklyReports.length,
            assessmentData: STATE.assessmentData.length
        });

        STATE.isLoading = false;

    } catch (error) {
        console.error('Critical error loading data from Baserow:', error);
        STATE.divisions = [{ id: 1, name: '운영본부' }];
        STATE.teams = [];
        STATE.members = [];
        STATE.rnrData = [];
        STATE.allGoals = [];
        STATE.weeklyReports = [];
        STATE.assessmentData = [];
        STATE.isLoading = false;
        alert('Baserow 연결 실패. 오류: ' + error.message);
    }
}


// --- Initialization ---
function getDefaultPeriodValue(type) {
    const d = new Date();
    const currYear = d.getFullYear() > 2025 ? d.getFullYear() : 2026;
    if(type === 'quarterly') return `${currYear}-Q${Math.floor(d.getMonth()/3)+1}`;
    return `${currYear}`;
}

function initDates() {
    STATE.dashboardPeriodValue = getDefaultPeriodValue('quarterly');
    STATE.goalsSetPeriodValue = getDefaultPeriodValue('quarterly');
    STATE.goalsManagePeriodValue = getDefaultPeriodValue('quarterly');
    STATE.requestsPeriodValue = getDefaultPeriodValue('quarterly');
}
initDates();

// --- Helpers ---
function getPeriodLabel(type, value) {
    if(!value) return '알 수 없음';
    if (type === 'quarterly') return `${value.split('-')[0]}년 ${value.split('-')[1]}분기`;
    if (type === 'yearly') return `${value}년`;
    return value;
}

// Ensure temp structures exist for Manage tab
function ensureTempStructures(goal) {
    if((goal.status === '합의 완료' || goal.status === '거부') && !goal.tempKeyResults) {
        goal.tempKeyResults = JSON.parse(JSON.stringify(goal.keyResults));
    }
}

// --- Menu Configuration ---
const MENU_ITEMS = [
    { id: 'dashboard', label: '대시보드', icon: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['admin', 'user'], path: '/dashboard' },
    { id: 'goals_manage', label: '내 목표', icon: '<path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['user', 'admin'], path: '/goals-manage' },

    { id: 'weekly_report', label: '주간업무공유', icon: '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['user', 'admin'], path: '/weekly-report' },
    { id: 'rnr', label: '직무기술 / R&R', icon: '<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['user', 'admin'], path: '/rnr' },
    { id: 'requests', label: '요청 관리', icon: '<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['admin'], path: '/requests' },
    { id: 'members', label: '구성원', icon: '<path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['admin'], path: '/members' },
    { id: 'org_chart', label: '조직도', icon: '<path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['user', 'admin'], path: '/org-chart' },
    { id: 'feedback', label: '피드백', icon: '<path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['admin', 'user'], path: '/feedback' },
    { id: 'admin_settings', label: '관리자', icon: '<path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['admin'], path: '/admin-settings' }
];

// --- URL Routing ---
function navigateTo(viewId, updateHistory = true) {
    const menuItem = MENU_ITEMS.find(m => m.id === viewId);
    if (!menuItem) {
        console.error('Invalid view:', viewId);
        return;
    }
    
    STATE.currentView = viewId;
    
    // Update URL without page reload
    if (updateHistory && menuItem.path) {
        window.history.pushState({ view: viewId }, '', menuItem.path);
    }
    
    updateNavigation();
    renderCurrentView();
    closeMobileMenuOnNavigate();
}

function handlePopState(event) {
    if (event.state && event.state.view) {
        navigateTo(event.state.view, false);
    } else {
        // Handle direct URL access
        const path = window.location.pathname;
        const menuItem = MENU_ITEMS.find(m => m.path === path);
        if (menuItem) {
            navigateTo(menuItem.id, false);
        } else if (path === '/' || path === '/login' || path === '/main') {
            // Show login page or dashboard based on session
            if (!STATE.user) {
                window.history.replaceState(null, '', '/login');
            } else {
                navigateTo('dashboard', false);
            }
        }
    }
}

// Listen for browser back/forward buttons
window.addEventListener('popstate', handlePopState);

// Handle initial page load URL
function handleInitialRoute() {
    const path = window.location.pathname;
    
    // If on login page or root
    if (path === '/' || path === '/login' || path === '/main') {
        if (STATE.user) {
            // User is logged in, go to dashboard
            navigateTo('dashboard', true);
        } else {
            // Show login page
            window.history.replaceState(null, '', '/login');
        }
        return;
    }
    
    // Try to match path to a menu item
    const menuItem = MENU_ITEMS.find(m => m.path === path);
    if (menuItem && STATE.user) {
        navigateTo(menuItem.id, false);
    } else if (STATE.user) {
        // Invalid path but user is logged in, go to dashboard
        navigateTo('dashboard', true);
    } else {
        // User not logged in, redirect to login
        window.history.replaceState(null, '', '/login');
    }
}

// --- Global Dispatchers ---
window.setTab = function(view, tab) {
    if (view === 'dashboard') { STATE.dashboardTab = tab; STATE.dashboardPeriodValue = getDefaultPeriodValue(tab); }
    if (view === 'goals_set') { STATE.goalsSetTab = tab; STATE.goalsSetPeriodValue = getDefaultPeriodValue(tab); }
    if (view === 'goals_manage') { STATE.goalsManageTab = tab; STATE.goalsManagePeriodValue = getDefaultPeriodValue(tab); }
    if (view === 'requests') { STATE.requestsTab = tab; STATE.requestsPeriodValue = getDefaultPeriodValue(tab); }
    renderCurrentView();
};

window.setPeriod = function(view, val) {
    if(view === 'dashboard') STATE.dashboardPeriodValue = val;
    if(view === 'goals_set') STATE.goalsSetPeriodValue = val;
    if(view === 'goals_manage') STATE.goalsManagePeriodValue = val;
    if(view === 'requests') STATE.requestsPeriodValue = val;
    renderCurrentView();
};

window.setRequestsFilter = function(val) {
    STATE.requestsFilter = val;
    renderCurrentView();
};

window.setDashboardTeamFilter = function(val) {
    STATE.dashboardTeamFilter = val;
    renderCurrentView();
};

window.setDashboardDivisionFilter = function(val) {
    STATE.dashboardDivisionFilter = val;
    STATE.dashboardTeamFilter = 'all';
    renderCurrentView();
};

window.setRnrViewMode = function(mode) {
    STATE.rnrViewMode = mode;
    renderCurrentView();
};

window.setRnrBrowseTeamFilter = function(val) {
    STATE.rnrBrowseTeamFilter = val;
    renderCurrentView();
};

window.openDivisionGoalModal = function() {
    const content = `
        <div class="max-h-[60vh] overflow-y-auto custom-scroll space-y-5">
            <!-- 핵심 과제 요약 -->
            <div class="bg-gradient-to-br from-primary/5 to-blue-50/50 rounded-xl p-6 border border-primary/10">
                <h3 class="text-[16px] font-black text-on-surface mb-2">2026년 운영본부 핵심 과제</h3>
                <p class="text-[14px] text-on-surface-variant leading-relaxed">비용 절감이라는 '내실'과 글로벌 진출 및 DT라는 '성장'의 균형을 잡는 것이 이번 OKR의 핵심입니다.</p>
                <p class="text-[14px] text-on-surface font-bold mt-3">슬로건: "효율을 넘어 가치로, 로컬을 넘어 글로벌로"</p>
            </div>

            <!-- Objective 1 -->
            <div class="bg-white rounded-xl border border-blue-100 p-6">
                <div class="flex items-start gap-3 mb-4">
                    <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                        <span class="text-white font-black text-[13px]">O1</span>
                    </div>
                    <div>
                        <h4 class="text-[15px] font-black text-on-surface">기술과 혁신을 통한 압도적 운영 효율화 및 수익 구조 개선</h4>
                        <p class="text-[13px] text-on-surface-variant mt-1">인력 효율화 이후의 공백을 AI와 시스템으로 메우고, 불필요한 비용을 제거하여 본부의 존재 가치를 증명합니다.</p>
                    </div>
                </div>
                <div class="space-y-3 pl-11">
                    <div class="flex gap-2 items-start">
                        <span class="text-[12px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded flex-shrink-0">KR1</span>
                        <p class="text-[14px] text-on-surface leading-relaxed">AI 룩북 및 업무 자동화 솔루션 도입을 통해 콘텐츠 제작 비용 및 운영 리소스 50% 절감</p>
                    </div>
                    <div class="flex gap-2 items-start">
                        <span class="text-[12px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded flex-shrink-0">KR2</span>
                        <p class="text-[14px] text-on-surface leading-relaxed">전사 업무 DT 기반 구축을 위한 1단계 통합 대시보드 구축 및 유관 부서 활용도 50% 달성</p>
                    </div>
                    <div class="flex gap-2 items-start">
                        <span class="text-[12px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded flex-shrink-0">KR3</span>
                        <p class="text-[14px] text-on-surface leading-relaxed">본부 내 인당 생산성 지표(Revenue per Head) 전년 대비 20% 향상</p>
                    </div>
                </div>
            </div>

            <!-- Objective 2 -->
            <div class="bg-white rounded-xl border border-blue-100 p-6">
                <div class="flex items-start gap-3 mb-4">
                    <div class="w-8 h-8 bg-success rounded-lg flex items-center justify-center flex-shrink-0">
                        <span class="text-white font-black text-[13px]">O2</span>
                    </div>
                    <div>
                        <h4 class="text-[15px] font-black text-on-surface">글로벌 표준 물류 체계 구축 및 JV 운영 기반 확립</h4>
                        <p class="text-[13px] text-on-surface-variant mt-1">전사 통합 물류의 안정적 안착을 넘어, 글로벌 파트너(JV)가 브랜드 가치를 유지하며 유통할 수 있는 표준 운영 체계(Playbook)를 마련합니다.</p>
                    </div>
                </div>
                <div class="space-y-3 pl-11">
                    <div class="flex gap-2 items-start">
                        <span class="text-[12px] font-black text-success bg-success/10 px-2 py-0.5 rounded flex-shrink-0">KR1</span>
                        <p class="text-[14px] text-on-surface leading-relaxed"><span class="text-[12px] font-bold text-on-surface-variant">[내실: 통합 물류 안정화]</span> 신규 물류센터로의 전사 브랜드 이관 100% 완료, 자체 물류 당일 입/출고 완료율 80% 이상 관리</p>
                    </div>
                    <div class="flex gap-2 items-start">
                        <span class="text-[12px] font-black text-success bg-success/10 px-2 py-0.5 rounded flex-shrink-0">KR2</span>
                        <p class="text-[14px] text-on-surface leading-relaxed"><span class="text-[12px] font-bold text-on-surface-variant">[기반: 중국 JV 거버넌스]</span> 중국 JV의 원활한 유통을 위한 SCM 데이터 연동 규격 정의 및 운영 가이드라인(SOP) 수립</p>
                    </div>
                    <div class="flex gap-2 items-start">
                        <span class="text-[12px] font-black text-success bg-success/10 px-2 py-0.5 rounded flex-shrink-0">KR3</span>
                        <p class="text-[14px] text-on-surface leading-relaxed"><span class="text-[12px] font-bold text-on-surface-variant">[확장: 글로벌 인프라 레디니스]</span> 해외 진출용 결제/물류 API 표준화 및 타겟 국가별 현지화 물류 프로세스 검증</p>
                    </div>
                </div>
            </div>

            <!-- Objective 3 -->
            <div class="bg-white rounded-xl border border-blue-100 p-6">
                <div class="flex items-start gap-3 mb-4">
                    <div class="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span class="text-white font-black text-[13px]">O3</span>
                    </div>
                    <div>
                        <h4 class="text-[15px] font-black text-on-surface">고객 경험(CX) 고도화를 통한 브랜드 로열티 및 앱 활성 지표 강화</h4>
                        <p class="text-[13px] text-on-surface-variant mt-1">단순 CS를 넘어 데이터 기반의 DX 활동으로 고객을 묶어두는(Lock-in) 전략입니다.</p>
                    </div>
                </div>
                <div class="space-y-3 pl-11">
                    <div class="flex gap-2 items-start">
                        <span class="text-[12px] font-black text-purple-600 bg-purple-100 px-2 py-0.5 rounded flex-shrink-0">KR1</span>
                        <p class="text-[14px] text-on-surface leading-relaxed">전 브랜드 공식 앱 통합 MAU(월간 활성 사용자) 전년 대비 30% 증대</p>
                    </div>
                    <div class="flex gap-2 items-start">
                        <span class="text-[12px] font-black text-purple-600 bg-purple-100 px-2 py-0.5 rounded flex-shrink-0">KR2</span>
                        <p class="text-[14px] text-on-surface leading-relaxed">CX 데이터 분석을 통한 제품 개선 제안 및 실제 반영 건수 분기별 5건 이상</p>
                    </div>
                    <div class="flex gap-2 items-start">
                        <span class="text-[12px] font-black text-purple-600 bg-purple-100 px-2 py-0.5 rounded flex-shrink-0">KR3</span>
                        <p class="text-[14px] text-on-surface leading-relaxed">앱 내 핵심 전환 프로세스(결제/환불 등) 안정성 지수 99.9% 유지</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    openModal('2026년 본부별 목표', content, null, true);
};

window.openModal = function(title, content, onConfirmAction = null, isWide = false) {
    STATE.modalData = { title, content, onConfirmAction, isWide };
    renderCurrentView();
};
window.closeModal = function() {
    STATE.modalData = null;
    const modalEl = document.getElementById('app-modal');
    if (modalEl) {
        modalEl.remove();
    } else {
        renderCurrentView();
    }
};

// --- Logic Implementation ---

window.updateOKRTitle = function(id, val) {
    const goal = STATE.allGoals.find(g => g.id == id); // Use == for type coercion
    if(goal) {
        if(goal.status === '합의 완료' || goal.status === '승인 대기중') {
            goal.tempText = val;
        } else {
            goal.text = val;
        }
    }
};

window.updateKRTitle = function(okrId, krId, val, isTempObj = false) {
    const goal = STATE.allGoals.find(g => g.id == okrId); // Use == for type coercion
    if(goal) {
        if(isTempObj && goal.status !== '작성중') {
            ensureTempStructures(goal); // Ensure temp structures exist
            if (goal.tempKeyResults) {
                const kr = goal.tempKeyResults.find(k => k.id == krId);
                if(kr) kr.text = val;
            } else {
                const kr = goal.keyResults.find(k => k.id == krId);
                if(kr) kr.text = val;
            }
        } else {
            const kr = goal.keyResults.find(k => k.id == krId);
            if(kr) kr.text = val;
        }
    }
};

window.updateKRProgress = function(okrId, krId, val) {
    const goal = STATE.allGoals.find(g => g.id == okrId); // Use == for type coercion
    if(goal) {
        if (goal.status === '작성중') {
            // For draft goals, update keyResults directly
            const kr = goal.keyResults.find(k => k.id == krId);
            if(kr) {
                kr.progress = parseInt(val);
                const el = document.getElementById(`kr-prog-val-${krId}`);
                if(el) el.innerText = val + '%';
            }
        } else {
            ensureTempStructures(goal);
            if(goal.tempKeyResults) {
                const kr = goal.tempKeyResults.find(k => k.id == krId);
                if(kr) {
                    kr.progress = parseInt(val);
                    const el = document.getElementById(`kr-prog-val-${krId}`);
                    if(el) el.innerText = val + '%';
                }
            }
        }
    }
};

window.addKR = function(okrId, isTempObj = false) {
    const goal = STATE.allGoals.find(g => g.id == okrId);
    if(goal) {
        if(isTempObj && goal.status !== '작성중') {
            ensureTempStructures(goal);
            if (goal.tempKeyResults) {
                goal.tempKeyResults.push({ id: 'kr-' + Date.now() + Math.random().toString(36), text: '', progress: 0 });
            } else {
                goal.keyResults.push({ id: 'kr-' + Date.now() + Math.random().toString(36), text: '', progress: 0 });
            }
        } else {
            goal.keyResults.push({ id: 'kr-' + Date.now() + Math.random().toString(36), text: '', progress: 0 });
        }
        renderCurrentView();
    }
};

window.removeKR = function(okrId, krId, isTempObj = false) {
    const goal = STATE.allGoals.find(g => g.id == okrId);
    if(goal) {
        if(isTempObj) {
            ensureTempStructures(goal);
            const target = goal.tempKeyResults || goal.keyResults;
            if(target.length > 1) {
                if(goal.tempKeyResults) {
                    goal.tempKeyResults = goal.tempKeyResults.filter(k => k.id != krId);
                } else {
                    goal.keyResults = goal.keyResults.filter(k => k.id != krId);
                }
            }
        } else {
            if(goal.keyResults.length > 1) {
                goal.keyResults = goal.keyResults.filter(k => k.id !== krId);
            }
        }
        renderCurrentView();
    }
};

window.openImportOKRModal = function() {
    const currentTab = STATE.goalsSetTab;
    const currentPeriod = STATE.goalsSetPeriodValue;
    
    // 현재 사용자의 다른 기간 OKR 목록 가져오기
    const otherPeriodGoals = STATE.allGoals.filter(g => 
        g.userId === STATE.user.id && 
        g.periodType === currentTab && 
        g.periodValue !== currentPeriod &&
        (g.status === '합의 완료' || g.status === '승인 대기중' || g.status === '작성중')
    );
    
    // 기간별 그룹핑
    const periods = {};
    otherPeriodGoals.forEach(g => {
        if (!periods[g.periodValue]) periods[g.periodValue] = [];
        periods[g.periodValue].push(g);
    });
    
    if (Object.keys(periods).length === 0) {
        alert('가져올 수 있는 다른 기간의 OKR이 없습니다.');
        return;
    }
    
    let optionsHtml = Object.keys(periods).sort().reverse().map(pv => {
        const label = currentTab === 'quarterly' 
            ? pv.replace(/(\d{4})-Q(\d)/, '$1년 $2분기')
            : pv + '년';
        const count = periods[pv].length;
        return `<option value="${pv}">${label} (${count}개 목표)</option>`;
    }).join('');
    
    STATE.modalData = {
        title: 'OKR 가져오기',
        content: `
            <div class="space-y-4">
                <p class="text-[14px] text-on-surface-variant">다른 기간의 OKR을 현재 기간으로 가져옵니다.</p>
                <select id="import-period-select" class="w-full bg-white border border-blue-100 rounded-lg px-4 py-3 text-[14px] text-on-surface outline-none focus:border-primary">
                    ${optionsHtml}
                </select>
                <div id="import-preview" class="mt-3 max-h-[300px] overflow-y-auto"></div>
            </div>
        `,
        onConfirm: () => {
            const selectedPeriod = document.getElementById('import-period-select')?.value;
            if (!selectedPeriod) return;
            
            const goalsToImport = periods[selectedPeriod];
            const currentGoals = STATE.allGoals.filter(g => g.userId === STATE.user.id && g.periodType === currentTab && g.periodValue === currentPeriod);
            
            let msg = `${selectedPeriod}에서 ${goalsToImport.length}개 목표를 가져옵니다.`;
            if (currentGoals.length > 0) {
                msg += `\n\n⚠️ 현재 기간에 작성된 ${currentGoals.length}개 목표는 초기화됩니다.`;
            }
            msg += '\n\n진행하시겠습니까?';
            
            if (!confirm(msg)) return;
            
            // 기존 목표 제거 (로컬만 — temp 상태인 것들)
            STATE.allGoals = STATE.allGoals.filter(g => !(g.userId === STATE.user.id && g.periodType === currentTab && g.periodValue === currentPeriod && String(g.id).startsWith('temp-')));
            
            // 가져오기 — 새 ID로 복사
            goalsToImport.forEach((g, i) => {
                const newId = 'temp-' + Date.now() + i;
                const newKRs = g.keyResults.map(kr => ({
                    id: 'kr-' + Date.now() + Math.random().toString(36),
                    text: kr.text,
                    progress: 0
                }));
                STATE.allGoals.push({
                    id: newId,
                    userId: STATE.user.id,
                    periodType: currentTab,
                    periodValue: currentPeriod,
                    text: g.text,
                    keyResults: newKRs,
                    status: '작성중',
                    requestType: null,
                    comment: '',
                    isProcessed: false,
                    isLocalOnly: true,
                    reject_comment: null
                });
            });
            
            STATE.modalData = null;
            renderCurrentView();
        },
        isWide: false
    };
    renderCurrentView();
};

window.addOKR = function(timestamp_salt = 0) {
    // Create OKR only in local STATE, not in Baserow yet
    const newId = 'temp-' + Date.now() + timestamp_salt;
    
    STATE.allGoals.push({
        id: newId,
        userId: STATE.user.id,
        periodType: STATE.goalsManageTab,
        periodValue: STATE.goalsManagePeriodValue,
        text: '',
        keyResults: [{ id: 'kr-' + Date.now() + timestamp_salt, text: '', progress: 0 }],
        status: '작성중',
        requestType: null,
        comment: '',
        isProcessed: false,
        isLocalOnly: true  // Flag to indicate this is not yet in Baserow
    });
    
    renderCurrentView();
};

window.removeOKR = function(id) {
    // If it's a local-only goal (not yet in Baserow), just remove from STATE
    const goal = STATE.allGoals.find(g => g.id === id);
    if (goal && goal.isLocalOnly) {
        STATE.allGoals = STATE.allGoals.filter(g => g.id !== id);
        renderCurrentView();
        return;
    }
    
    // If it's in Baserow, delete from Baserow
    (async () => {
        try {
            // Delete all key results first
            const krs = await KeyResultsAPI.listByGoalId(id);
            for (const baserowKR of krs) {
                await KeyResultsAPI.delete(baserowKR.id);
            }
            
            // Delete the goal
            await GoalsAPI.delete(id);
            
            STATE.allGoals = STATE.allGoals.filter(g => g.id !== id);
            renderCurrentView();
        } catch (error) {
            console.error('Error removing OKR:', error);
            alert('OKR 삭제 중 오류가 발생했습니다.');
        }
    })();
};

// Requests
window.submitOKRRequest = async function(id) {
    const goal = STATE.allGoals.find(g => g.id === id);
    if(!goal) return;
    if(!goal.text.trim()) { alert('OKR 목표를 입력하세요.'); return; }
    if(goal.periodType !== 'yearly' && goal.keyResults.some(k => !k.text.trim())) { alert('모든 Key Results 내용을 입력하세요.'); return; }
    
    try {
        let goalId = id;
        
        // If this is a local-only goal, create it in Baserow first
        if (goal.isLocalOnly) {
            const newGoal = {
                user_id: goal.userId,
                period_type: goal.periodType,
                period_value: goal.periodValue,
                OKR: goal.text,
                status: '승인 대기중',
                is_processed: false,
                comment: '',
                temp_text: null,
                request_type: '신규 수립',
                request_date: new Date().toISOString()
            };
            
            const createdGoal = await GoalsAPI.create(newGoal);
            goalId = createdGoal.id;
            
            // Update the goal in STATE with the real Baserow ID
            goal.id = goalId;
            goal.isLocalOnly = false;
            
            // Create key results in Baserow
            for (const kr of goal.keyResults) {
                await KeyResultsAPI.create({
                    goal_id: String(goalId),
                    kr_id: kr.id,
                    OKR: goal.text,
                    KR: kr.text,
                    progress: String(kr.progress)
                });
            }
        } else {
            // Update existing goal in Baserow
            await GoalsAPI.update(goalId, {
                OKR: goal.text,
                status: '승인 대기중',
                is_processed: false,
                request_type: '신규 수립',
                request_date: new Date().toISOString()
            });
            
            // Update or create key results in Baserow
            const existingKRs = await KeyResultsAPI.listByGoalId(goalId);
            
            for (const kr of goal.keyResults) {
                const existingKR = existingKRs.find(k => k.kr_id == kr.id);
                if (existingKR) {
                    await KeyResultsAPI.update(existingKR.id, {
                        OKR: goal.text,
                        KR: kr.text,
                        progress: String(kr.progress)
                    });
                } else {
                    await KeyResultsAPI.create({
                        goal_id: String(goalId),
                        kr_id: kr.id,
                        OKR: goal.text,
                        KR: kr.text,
                        progress: String(kr.progress)
                    });
                }
            }
            
            // Delete removed KRs
            for (const existingKR of existingKRs) {
                if (!goal.keyResults.find(k => k.id == existingKR.kr_id)) {
                    await KeyResultsAPI.delete(existingKR.id);
                }
            }
        }
        
        goal.status = '승인 대기중';
        goal.requestType = '신규 수립';
        goal.isProcessed = false;
        renderCurrentView();
        updateNavigation();
    } catch (error) {
        console.error('Error submitting OKR request:', error);
        alert('OKR 제출 중 오류가 발생했습니다.');
    }
};

window.cancelOKRRequest = async function(id) {
    console.log('cancelOKRRequest called with id:', id, typeof id);
    const goal = STATE.allGoals.find(g => g.id == id); // Use == instead of === for type coercion
    console.log('Found goal:', goal);
    
    if(goal) {
        try {
            if(goal.requestType === '신규 수립') {
                // If it was a new request, delete from Baserow and revert to local-only
                if (!goal.isLocalOnly) {
                    // Delete from Baserow
                    const krs = await KeyResultsAPI.listByGoalId(id);
                    for (const kr of krs) {
                        await KeyResultsAPI.delete(kr.id);
                    }
                    await GoalsAPI.delete(id);
                    
                    // Revert to local-only state
                    goal.id = 'temp-' + Date.now();
                    goal.isLocalOnly = true;
                }
                
                goal.status = '작성중';
                goal.requestType = null;
            } else {
                await GoalsAPI.update(id, {
                    status: '합의 완료',
                    temp_text: null,
                    temp_kr: null,
                    request_type: null
                });
                goal.status = '합의 완료';
                goal.requestType = null;
                goal.tempText = undefined;
                goal.tempKeyResults = undefined;
            }
            renderCurrentView();
            updateNavigation();
        } catch (error) {
            console.error('Error canceling OKR request:', error);
            alert('요청 취소 중 오류가 발생했습니다.');
        }
    } else {
        console.error('Goal not found for id:', id);
        alert('목표를 찾을 수 없습니다.');
    }
};

window.submitModifyRequest = function(id) {
    console.log('submitModifyRequest called with id:', id, typeof id);
    const goal = STATE.allGoals.find(g => g.id == id); // Use == for type coercion
    console.log('Found goal:', goal);
    
    if(!goal) {
        console.error('Goal not found for id:', id);
        alert('목표를 찾을 수 없습니다.');
        return;
    }

    ensureTempStructures(goal);

    let edits = [];
    if(goal.tempText !== undefined && goal.tempText !== goal.text) edits.push('OKR 변경');
    
    // Compute exact diffs for KR
    const oldKRs = goal.keyResults;
    const newKRs = goal.tempKeyResults;
    
    let hasKrTextChange = false;
    let hasKrAddRem = false;
    let hasKrProg = false;

    if(oldKRs.length !== newKRs.length) hasKrAddRem = true;
    
    newKRs.forEach(nKr => {
        const oKr = oldKRs.find(k => k.id == nKr.id);
        if(!oKr) {
            hasKrAddRem = true;
        } else {
            if(oKr.text !== nKr.text) hasKrTextChange = true;
            if(oKr.progress !== nKr.progress) hasKrProg = true;
        }
    });

    if(hasKrTextChange) edits.push('KR 내용 변경');
    if(hasKrAddRem) edits.push('KR 항목 증감');
    if(hasKrProg) edits.push('진척률 보고');

    if(edits.length === 0 && goal.status !== '거부') { alert('변경사항이 없습니다.'); return; }
    if(edits.length === 0 && goal.status === '거부') edits.push('재요청');

    const mBody = `
        <div class="mb-4 text-[13px] font-bold text-on-surface p-3 bg-surface-container rounded-lg">수정 성격 유형: <span class="text-primary ml-1">${edits.join(', ')}</span></div>
        <textarea id="modify-comment" class="w-full bg-surface-container-lowest border border-blue-50 focus:border-primary rounded px-4 py-3 text-[14px] font-medium outline-none min-h-[120px] shadow-sm resize-none placeholder:text-on-surface-variant/40" placeholder="결재권자에게 보낼 수정 사유 및 코멘트를 입력하세요..."></textarea>
    `;
    openModal('수정/진척률 승인 요청하기', mBody, async () => {
        const comment = document.getElementById('modify-comment').value;
        
        try {
            // Update goal in Baserow
            const updateData = {
                status: '승인 대기중',
                request_type: edits.join(','),
                comment: comment,
                is_processed: false,
                request_date: new Date().toISOString()
            };
            
            if (goal.tempText !== undefined) {
                updateData.temp_text = goal.tempText;
            }
            
            // Serialize tempKeyResults to JSON and save to temp_kr field
            if (goal.tempKeyResults) {
                updateData.temp_kr = JSON.stringify(goal.tempKeyResults);
                // For yearly goals, also save progress to the progress field
                if (goal.periodType === 'yearly' && goal.tempKeyResults[0]) {
                    updateData.progress = goal.tempKeyResults[0].progress;
                }
            }
            
            await GoalsAPI.update(id, updateData);
            
            // 체크인 이력 저장
            try {
                const krSnapshot = goal.tempKeyResults || goal.keyResults || [];
                await baserowFetch('/database/rows/table/2137/?user_field_names=true', {
                    method: 'POST',
                    body: JSON.stringify({
                        checkin_id: 'chk-' + Date.now(),
                        user_id: STATE.user.id,
                        user_name: STATE.user.name,
                        goal_id: String(id),
                        goal_text: goal.text,
                        type: edits.join(','),
                        comment: comment,
                        progress_snapshot: JSON.stringify(krSnapshot.map(kr => ({ text: kr.text, progress: kr.progress }))),
                        created_at: new Date().toISOString(),
                        period_value: goal.periodValue
                    })
                });
            } catch (checkinErr) {
                console.error('Checkin history save error:', checkinErr);
            }

            goal.status = '승인 대기중';
            goal.requestType = edits.join(',');
            goal.comment = comment;
            goal.isProcessed = false;
            closeModal();
            renderCurrentView();
            updateNavigation();
        } catch (error) {
            console.error('Error submitting modify request:', error);
            alert('수정 요청 중 오류가 발생했습니다.');
        }
    }, false);
};

// 삭제 요청
window.requestDeleteOKR = function(id) {
    const goal = STATE.allGoals.find(g => g.id == id);
    if (!goal) return;
    
    const mBody = `
        <p class="text-[14px] text-on-surface mb-4">아래 OKR의 삭제를 요청합니다. 관리자 승인 후 삭제됩니다.</p>
        <div class="bg-surface-container rounded-lg p-4 mb-4">
            <p class="text-[13px] font-bold text-on-surface">${goal.text}</p>
        </div>
        <label class="block text-[13px] font-bold text-on-surface-variant mb-2">삭제 사유</label>
        <textarea id="delete-reason" class="w-full bg-surface-container-lowest border border-blue-50 focus:border-primary rounded px-4 py-3 text-[14px] font-medium outline-none min-h-[80px] shadow-sm resize-none placeholder:text-on-surface-variant/40" placeholder="삭제 요청 사유를 입력하세요..."></textarea>
    `;
    openModal('OKR 삭제 요청', mBody, async () => {
        const reason = document.getElementById('delete-reason').value;
        if (!reason.trim()) { alert('삭제 사유를 입력해주세요.'); return; }
        try {
            await GoalsAPI.update(id, {
                status: '승인 대기중',
                request_type: '삭제 요청',
                comment: reason,
                is_processed: false,
                request_date: new Date().toISOString()
            });
            goal.status = '승인 대기중';
            goal.requestType = '삭제 요청';
            goal.comment = reason;
            goal.isProcessed = false;
            closeModal();
            renderCurrentView();
            updateNavigation();
        } catch (e) {
            console.error('Error requesting OKR delete:', e);
            alert('삭제 요청 중 오류가 발생했습니다.');
        }
    }, false);
};


// --- 알림 웹훅 발송 ---
function sendNotificationWebhook(params) {
    const baseUrl = "https://n8n.childylab.com/webhook/7b666c7f-b12d-447f-bef7-957d4c896219";
    console.log("Sending webhook:", params);
    fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
    }).then(r => console.log("Webhook response:", r.status)).catch(e => console.error("Webhook error:", e));
}

window.approveAdminRequest = async function(id) {
    const goal = STATE.allGoals.find(g => g.id === id);
    if(goal) {
        try {
            // Apply temp changes to actual data BEFORE updating Baserow
            if(goal.tempText !== undefined) {
                goal.text = goal.tempText;
            }
            if(goal.tempKeyResults) {
                goal.keyResults = JSON.parse(JSON.stringify(goal.tempKeyResults));
            }
            
            // Update goal in Baserow
            const goalUpdateData = {
                OKR: goal.text,  // Save OKR to goals table
                status: '합의 완료',
                temp_text: null,  // Clear temp_text
                temp_kr: null,  // Clear temp_kr
                is_processed: true,
                request_type: null,
                reject_comment: null,
                comment: goal.comment || ''
            };
            
            // For yearly goals, save progress to goals table
            if (goal.periodType === 'yearly' && goal.keyResults[0]) {
                goalUpdateData.progress = goal.keyResults[0].progress;
            }
            
            await GoalsAPI.update(id, goalUpdateData);
            
            // Update key results in Baserow - use the UPDATED goal.keyResults
            const existingKRs = await KeyResultsAPI.listByGoalId(id);
            
            // Update or create each KR
            for (const kr of goal.keyResults) {
                const existingKR = existingKRs.find(k => k.kr_id == kr.id);
                if (existingKR) {
                    // Update existing KR
                    await KeyResultsAPI.update(existingKR.id, {
                        OKR: goal.text,  // Save OKR to key_results table
                        KR: kr.text,     // Save KR to key_results table
                        progress: String(kr.progress)
                    });
                } else {
                    // Create new KR
                    await KeyResultsAPI.create({
                        goal_id: String(id),
                        kr_id: kr.id,
                        OKR: goal.text,  // Save OKR to key_results table
                        KR: kr.text,     // Save KR to key_results table
                        progress: String(kr.progress)
                    });
                }
            }
            
            // Delete removed KRs
            for (const existingKR of existingKRs) {
                if (!goal.keyResults.find(k => k.id == existingKR.kr_id)) {
                    await KeyResultsAPI.delete(existingKR.id);
                }
            }
            
            // 이메일 알림 발송 (temp 클리어 전)
            console.log("WEBHOOK DEBUG - goal.requestType:", goal.requestType, "goal.comment:", goal.comment, "existingKRs:", existingKRs.map(k => k.kr_id + ":" + k.progress), "goal.keyResults:", goal.keyResults.map(k => k.id + ":" + k.progress));
            const notiMember = STATE.members.find(m => m.user_id === goal.userId);
            if (notiMember && notiMember.email) {
                let progressChanges = "";
                const krChanges = goal.keyResults.map(kr => {
                    const oldKr = existingKRs.find(k => k.kr_id == kr.id);
                    const oldProg = oldKr ? (parseInt(oldKr.progress) || 0) : 0;
                    const newProg = parseInt(kr.progress) || 0;
                    if (oldProg !== newProg) {
                        return (kr.text || "KR") + ": " + oldProg + "% → " + newProg + "%";
                    }
                    return null;
                }).filter(Boolean);
                if (krChanges.length > 0) progressChanges = krChanges.join(" | ");
                
                // requestType은 승인 전에 캡처 (승인 후 null이 되므로)
                const reqType = goal.requestType || goal.comment || "승인";
                sendNotificationWebhook({
                    type: "approved", name: notiMember.name, email: notiMember.email,
                    title: goal.text, requestType: reqType,
                    comment: goal.comment || "", progressChanges: progressChanges,
                    reviewer: STATE.user.name
                });
            }

            // Clear temp data
            goal.tempText = undefined;
            goal.tempKeyResults = undefined;
            
            // 삭제 요청인 경우 실제 삭제 처리
            if (goal.requestType === '삭제 요청') {
                // KR 삭제
                const krsToDelete = await KeyResultsAPI.listByGoalId(id);
                for (const kr of krsToDelete) {
                    await KeyResultsAPI.delete(kr.id);
                }
                // Goal 삭제
                await GoalsAPI.delete(id);
                STATE.allGoals = STATE.allGoals.filter(g => g.id != id);
                renderCurrentView();
                updateNavigation();
                return;
            }
            
            goal.status = '합의 완료';
            goal.requestType = null;
            goal.isProcessed = true;
            goal.reject_comment = null;
            renderCurrentView();
            updateNavigation();
        } catch (error) {
            console.error('Error approving request:', error);
            alert('승인 처리 중 오류가 발생했습니다.');
        }
    }
};

window.rejectAdminRequest = async function(id) {
    const goal = STATE.allGoals.find(g => g.id == id);
    if(goal) {
        // 거부 코멘트 입력 모달 표시
        STATE.modalData = {
            title: '요청 거부',
            content: `
                <div class="space-y-4">
                    <p class="text-[14px] text-on-surface-variant">거부 사유를 입력하세요. 작성자에게 전달됩니다.</p>
                    <textarea id="modal-reject-comment" rows="4" class="w-full bg-white border border-blue-100 rounded-lg px-4 py-3 text-[13px] text-on-surface outline-none focus:border-primary resize-none" placeholder="거부 사유 입력 (필수)" required></textarea>
                </div>
            `,
            onConfirm: async () => {
                const rejectComment = document.getElementById('modal-reject-comment')?.value.trim();
                
                if (!rejectComment) {
                    alert('거부 사유를 입력해주세요.');
                    return;
                }
                
                try {
                    if(goal.requestType === '신규 수립') {
                        // For new requests, keep the row and set status to '거부'
                        await GoalsAPI.update(id, {
                            status: '거부',
                            request_type: null,
                            reject_comment: rejectComment
                        });
                        
                        goal.status = '거부';
                        goal.requestType = null;
                        goal.reject_comment = rejectComment;
                    } else {
                        // For modification requests, clear temp data and revert to approved state
                        await GoalsAPI.update(id, {
                            status: '합의 완료',
                            temp_text: null,
                            temp_kr: null,
                            request_type: null,
                            comment: '',
                            reject_comment: rejectComment,
                            is_processed: true
                        });
                        
                        goal.status = '합의 완료';
                        goal.requestType = null;
                        goal.tempText = undefined;
                        goal.tempKeyResults = undefined;
                        goal.isProcessed = true;
                        goal.reject_comment = rejectComment;
                    }
                    
                    STATE.modalData = null;
                    alert('요청이 거부되었습니다.');
                    // 이메일 알림 발송
                    const rejectMember = STATE.members.find(m => m.user_id === goal.userId);
                    if (rejectMember && rejectMember.email) {
                        sendNotificationWebhook({ type: "rejected", name: rejectMember.name, email: rejectMember.email, title: goal.text, requestType: goal.requestType || "", comment: rejectComment, reviewer: STATE.user.name });
                    }
                    renderCurrentView();
                    updateNavigation();
                } catch (error) {
                    console.error('Error rejecting request:', error);
                    alert('요청 거부 중 오류가 발생했습니다.');
                }
            },
            isWide: false
        };
        renderCurrentView();
    }
};

window.undoApproval = async function(id) {
    const goal = STATE.allGoals.find(g => g.id == id);
    if(goal) {
        try {
            await GoalsAPI.update(id, {
                status: '승인 대기중',
                is_processed: false
            });
            goal.status = '승인 대기중';
            goal.isProcessed = false;
            alert('승인이 취소되었습니다.');
            renderCurrentView();
            updateNavigation();
        } catch (error) {
            console.error('Error undoing OKR approval:', error);
            alert('승인 취소 중 오류가 발생했습니다.');
        }
    }
};

window.approveRnRRequest = async function(id) {
    const rnr = STATE.rnrData.find(r => r.id === id);
    if(rnr) {
        try {
            if (rnr.request_type && rnr.request_type.includes('수정')) {
                // Apply modification from temp_content
                let tempData = { job: '', rnr: '' };
                try {
                    tempData = JSON.parse(rnr.temp_content);
                } catch (e) {
                    // Fallback for old format
                    tempData = { job: rnr.job, rnr: rnr.temp_content };
                }
                
                await RnRAPI.update(id, {
                    job: tempData.job,
                    rnr: tempData.rnr,
                    content: tempData.rnr,
                    temp_content: '',
                    status: '합의 완료',
                    request_type: null,
                    comment: '',
                    reject_comment: null
                });
                
                rnr.job = tempData.job;
                rnr.rnr = tempData.rnr;
                rnr.content = tempData.rnr;
                rnr.temp_content = '';
            } else {
                await RnRAPI.update(id, {
                    status: '합의 완료',
                    request_type: null,
                    comment: '',
                    reject_comment: null
                });
            }
            
            rnr.status = '합의 완료';
            rnr.request_type = null;
            rnr.comment = '';
            rnr.reject_comment = null;
            alert('요청이 승인되었습니다.');
            // 이메일 알림 발송
            if (rnr && rnr.email) {
                sendNotificationWebhook({ type: "approved", name: rnr.name, email: rnr.email || STATE.members.find(m => m.user_id === rnr.user_id)?.email, title: "R&R 합의", reviewer: STATE.user.name });
            }
            renderCurrentView();
            updateNavigation();
        } catch (error) {
            console.error('Error approving R&R request:', error);
            alert('승인 중 오류가 발생했습니다.');
        }
    }
};

window.rejectRnRRequest = async function(id) {
    const rnr = STATE.rnrData.find(r => r.id === id);
    if(rnr) {
        // 거부 코멘트 입력 모달 표시
        STATE.modalData = {
            title: '요청 거부',
            content: `
                <div class="space-y-4">
                    <p class="text-[14px] text-on-surface-variant">거부 사유를 입력하세요. 작성자에게 전달됩니다.</p>
                    <textarea id="modal-reject-comment" rows="4" class="w-full bg-white border border-blue-100 rounded-lg px-4 py-3 text-[13px] text-on-surface outline-none focus:border-primary resize-none" placeholder="거부 사유 입력 (필수)" required></textarea>
                </div>
            `,
            onConfirm: async () => {
                const rejectComment = document.getElementById('modal-reject-comment')?.value.trim();
                
                if (!rejectComment) {
                    alert('거부 사유를 입력해주세요.');
                    return;
                }
                
                try {
                    if (rnr.request_type && rnr.request_type.includes('등록')) {
                        // For new requests, keep the row and set status to '거부'
                        await RnRAPI.update(id, {
                            status: '거부',
                            request_type: null,
                            temp_content: '',
                            comment: '',
                            reject_comment: rejectComment
                        });
                        
                        rnr.status = '거부';
                        rnr.request_type = null;
                        rnr.temp_content = '';
                        rnr.comment = '';
                        rnr.reject_comment = rejectComment;
                    } else {
                        // For modification requests, clear temp data and revert
                        await RnRAPI.update(id, {
                            temp_content: '',
                            status: '합의 완료',
                            request_type: null,
                            comment: '',
                            reject_comment: rejectComment
                        });
                        
                        rnr.temp_content = '';
                        rnr.status = '합의 완료';
                        rnr.request_type = null;
                        rnr.comment = '';
                        rnr.reject_comment = rejectComment;
                    }
                    
                    STATE.modalData = null;
                    alert('요청이 거부되었습니다.');
                    // 이메일 알림 발송
                    const rnrRejectMember = STATE.members.find(m => m.user_id === rnr.user_id);
                    if (rnrRejectMember && rnrRejectMember.email) {
                        sendNotificationWebhook({ type: "rejected", name: rnrRejectMember.name, email: rnrRejectMember.email, title: "R&R 합의", comment: rejectComment, reviewer: STATE.user.name });
                    }
                    renderCurrentView();
                    updateNavigation();
                } catch (error) {
                    console.error('Error rejecting R&R request:', error);
                    alert('요청 거부 중 오류가 발생했습니다.');
                }
            },
            isWide: false
        };
        renderCurrentView();
    }
};

window.undoRnRApproval = async function(id) {
    const rnr = STATE.rnrData.find(r => r.id === id);
    if(rnr) {
        try {
            await RnRAPI.update(id, {
                status: '승인 대기중',
                request_type: '합의'
            });
            
            rnr.status = '승인 대기중';
            rnr.request_type = '합의';
            alert('R&R 승인이 취소되었습니다.');
            renderCurrentView();
            updateNavigation();
        } catch (error) {
            console.error('Error undoing R&R approval:', error);
            alert('R&R 승인 취소 중 오류가 발생했습니다.');
        }
    }
};

// Navigation
function updateNavigation() {
    const nav = document.getElementById('nav-menu');
    nav.innerHTML = '';

    const pendingOkrCount = STATE.allGoals.filter(g => g.requestType !== null && !g.isProcessed && g.status !== '작성중').length;
    const pendingRnrCount = STATE.rnrData.filter(r => r.request_type !== null && r.status === '승인 대기중').length;
    const pendingReqCount = pendingOkrCount + pendingRnrCount;

    // 2주 이내 나에게 온 새 피드백 여부
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const hasNewFeedback = (STATE.assessmentData || []).some(a =>
        a.target_id === STATE.user.id && a.created_at && new Date(a.created_at) >= twoWeeksAgo
    );

    MENU_ITEMS.forEach(item => {
        // Show all menus to everyone (don't filter by role)
        
        let badgeHtml = '';
        if(item.id === 'requests' && pendingReqCount > 0) {
            badgeHtml = `<span class="bg-error text-white text-[11px] font-black w-5 h-5 flex items-center justify-center rounded-full ml-auto shadow-sm">${pendingReqCount}</span>`;
        }
        if(item.id === 'feedback' && hasNewFeedback && STATE.user.role !== 'admin') {
            badgeHtml = `<span class="bg-error text-white text-[10px] font-black px-1.5 h-5 flex items-center justify-center rounded-full ml-auto shadow-sm">N</span>`;
        }
        // 구성원 메뉴 - 가입 대기자 뱃지
        const pendingApprovalCount = STATE.members.filter(m => m.is_approved === false).length;
        const canApproveMembers = STATE.user && (STATE.user.position === '대표' || STATE.user.position === '본부장' || STATE.user.id === 'pms1');
        if(item.id === 'members' && pendingApprovalCount > 0 && canApproveMembers) {
            badgeHtml = `<span class="bg-error text-white text-[10px] font-black px-1.5 h-5 flex items-center justify-center rounded-full ml-auto shadow-sm">N</span>`;
        }

        const btn = document.createElement('button');
        const isActive = STATE.currentView === item.id;
        const isRestricted = item.roles.includes('admin') && !item.roles.includes('user') && STATE.user.role !== 'admin';
        
        // 비활성화된 메뉴에는 뱃지 표시 안 함
        if (isRestricted) badgeHtml = '';
        btn.className = `flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-bold transition-all w-full ${isActive ? 'bg-primary/10 text-primary' : isRestricted ? 'text-on-surface-variant/50 hover:bg-surface-container' : 'text-on-surface-variant hover:bg-surface-container'}`;
        btn.innerHTML = `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">${item.icon}</svg> ${item.label} ${badgeHtml}`;
        btn.onclick = () => {
            if (isRestricted) {
                openModal('접근 제한', '<div class="text-center py-4"><div class="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4"><svg class="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg></div><p class="text-[15px] font-bold text-on-surface mb-2">접근 권한이 없습니다</p><p class="text-[13px] text-on-surface-variant">해당 메뉴는 관리자 권한이 필요합니다.</p></div>', null, false);
                return;
            }
            navigateTo(item.id);
        };
        nav.appendChild(btn);
    });
}

function renderCurrentView() {
    const content = document.getElementById('content-area');
    if(!content) return;
    content.innerHTML = '';
    const title = document.getElementById('page-title');
    const menuItem = MENU_ITEMS.find(m => m.id === STATE.currentView);
    title.innerText = menuItem ? menuItem.label : '대시보드';
    
    // Add dashboard button for feedback view
    const titleContainer = title.parentElement;
    const existingBtn = document.getElementById('feedback-dash-btn');
    if (existingBtn) existingBtn.remove();
    const existingMyBtn = document.getElementById("feedback-my-btn");
    if (existingMyBtn) existingMyBtn.remove();
    if (STATE.currentView === 'feedback' && STATE.user.role === 'admin') {
        const btn = document.createElement('button');
        btn.id = 'feedback-dash-btn';
        btn.className = STATE.feedbackView === 'dashboard' 
            ? 'ml-3 px-3 py-1.5 bg-primary text-white text-[12px] font-bold rounded-lg shadow-sm'
            : 'ml-3 px-3 py-1.5 bg-white border border-blue-100 text-primary text-[12px] font-bold rounded-lg hover:bg-blue-50 shadow-sm';
        btn.textContent = '피드백 대시보드';
        btn.onclick = function() {
            if (STATE.feedbackView === 'dashboard') {
                STATE.feedbackView = 'input';
                STATE.feedbackPeriodType = ''; // 진입 선택 화면으로
            } else {
                STATE.feedbackView = 'dashboard';
            }
            renderCurrentView();
        };
        titleContainer.appendChild(btn);

        // 나에게 온 피드백 버튼
        const myBtn = document.createElement("button");
        myBtn.id = "feedback-my-btn";
        myBtn.className = STATE.feedbackView === "myreceived"
            ? "ml-2 px-3 py-1.5 bg-primary text-white text-[12px] font-bold rounded-lg shadow-sm"
            : "ml-2 px-3 py-1.5 bg-white border border-blue-100 text-on-surface-variant text-[12px] font-bold rounded-lg hover:bg-blue-50 shadow-sm";
        myBtn.textContent = "나에게 온 피드백";
        myBtn.onclick = function() {
            STATE.feedbackView = STATE.feedbackView === "myreceived" ? "input" : "myreceived";
            STATE.feedbackPeriodType = "";
            renderCurrentView();
        };
        titleContainer.appendChild(myBtn);
    }
    
    // Handle guide view title
    if (STATE.currentView === 'guide') {
        title.innerText = 'OKR 설명서';
        window.history.pushState({ view: 'guide' }, '', '/okr-guide');
    }
    
    // Add dashboard info text
    const existingInfo = document.getElementById('dashboard-info-text');
    if (existingInfo) existingInfo.remove();
    if (STATE.currentView === 'dashboard') {
        const info = document.createElement('span');
        info.id = 'dashboard-info-text';
        info.className = 'ml-3 text-[12px] text-on-surface-variant font-medium';
        info.textContent = "상태값이 '합의'인 목표만 노출됩니다";
        titleContainer.appendChild(info);
    }
    
    if (STATE.currentView === 'dashboard') renderDashboard(content);
    else if (STATE.currentView === 'goals_set') renderGoalsSet(content);
    else if (STATE.currentView === 'goals_manage') renderGoalsManage(content);
    else if (STATE.currentView === 'requests') renderRequests(content);
    else if (STATE.currentView === 'members') renderMembers(content);
    else if (STATE.currentView === 'weekly_report') renderWeeklyReport(content);
    else if (STATE.currentView === 'org_chart') renderOrgChart(content);
    else if (STATE.currentView === 'rnr') renderRnR(content);
    else if (STATE.currentView === 'guide') renderGuide(content);
    else if (STATE.currentView === 'feedback') renderFeedback(content);
    else if (STATE.currentView === 'ai_poll') renderAIPoll(content);
    else if (STATE.currentView === "admin_settings") renderAdminSettings(content);
    
    if (STATE.modalData) renderModal(document.body);
    else {
        const modal = document.getElementById('app-modal');
        if(modal) modal.remove();
    }
    
    // Auto-resize all textareas after render
    setTimeout(() => {
        document.querySelectorAll('textarea[oninput*="scrollHeight"]').forEach(ta => {
            ta.style.height = 'auto';
            const lines = (ta.value || '').split('\n').length;
            ta.rows = Math.max(1, lines);
            ta.style.height = ta.scrollHeight + 'px';
        });
    }, 50);
}

function generatePeriodOptions(tab, selectedValue, useSettings) {
    let html = '';
    const d = new Date();
    const currYear = d.getFullYear() > 2025 ? d.getFullYear() : 2026;
    
    // 내 목표 / 요청관리에서는 period_settings 기반
    if (useSettings && STATE.periodSettings && STATE.periodSettings.length > 0) {
        const filtered = STATE.periodSettings.filter(p => p.period_type === tab && p.is_open);
        filtered.forEach(p => {
            const closed = p.is_closed ? ' (마감)' : '';
            html += `<option value="${p.period_value}" ${selectedValue === p.period_value ? 'selected' : ''}>${p.label}${closed}</option>`;
        });
        return html;
    }
    
    if (tab === 'quarterly') {
        const startQ = (STATE.currentView === 'dashboard' || STATE.currentView === 'requests') ? 1 : (Math.floor(d.getMonth()/3)+1);
        for(let q = startQ; q <= 4; q++) html += `<option value="${currYear}-Q${q}" ${selectedValue === `${currYear}-Q${q}` ? 'selected' : ''}>${currYear}년 ${q}분기</option>`;
    } else if (tab === 'yearly') {
        html += `<option value="${currYear}" ${selectedValue === String(currYear) ? 'selected':''}>${currYear}년</option><option value="${currYear+1}" ${selectedValue === String(currYear+1) ? 'selected':''}>${currYear+1}년</option>`;
    }
    return html;
}

// Rendering Views
function renderDashboard(container) {
    const relevantGoals = STATE.allGoals.filter(g => g.periodType === STATE.dashboardTab && g.periodValue === STATE.dashboardPeriodValue && g.status === '합의 완료');
    let users = {};
    relevantGoals.forEach(g => { if(!users[g.userId]) users[g.userId] = []; users[g.userId].push(g); });
    
    // Apply division + team filter
    let activeFilterIds;
    if (STATE.dashboardDivisionFilter !== 'all' || STATE.dashboardTeamFilter !== 'all') {
        let filtered = STATE.members.filter(m => !m.is_hidden);
        if (STATE.dashboardDivisionFilter !== 'all') filtered = filtered.filter(m => m.division === STATE.dashboardDivisionFilter);
        if (STATE.dashboardTeamFilter !== 'all') filtered = filtered.filter(m => m.team === STATE.dashboardTeamFilter);
        activeFilterIds = filtered.map(m => m.user_id);
    } else {
        activeFilterIds = STATE.members.filter(m => !m.is_hidden).map(m => m.user_id);
    }
    Object.keys(users).forEach(uid => {
        if (!activeFilterIds.includes(uid)) delete users[uid];
    });
    
    // Sort user keys by name (가나다순)
    const sortedUserIds = Object.keys(users).sort((a, b) => {
        const nameA = getUserName(a);
        const nameB = getUserName(b);
        return nameA.localeCompare(nameB, 'ko');
    });

    const isMobile = window.innerWidth < 1024;
    
    let h = '<div class="flex items-center gap-4 lg:gap-8 border-b-2 border-blue-50 mb-6 px-2 w-full overflow-x-auto">';
    h += '<button onclick="setTab(\'dashboard\', \'quarterly\')" class="pb-3 text-sm lg:text-lg transition-all whitespace-nowrap ' + (STATE.dashboardTab === 'quarterly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary') + '">분기별</button>';
    h += '<button onclick="setTab(\'dashboard\', \'yearly\')" class="pb-3 text-sm lg:text-lg transition-all whitespace-nowrap ' + (STATE.dashboardTab === 'yearly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary') + '">연간</button>';
    h += '</div>';
    h += '<div class="mb-4 w-full flex items-center justify-between gap-3">';
    h += '<div class="flex items-center gap-2">';
    h += '<select onchange="setPeriod(\'dashboard\', this.value)" class="w-full lg:w-auto bg-surface-container text-primary font-bold border border-blue-50 rounded-lg text-[13px] px-3 py-1.5 outline-none">';
    h += generatePeriodOptions(STATE.dashboardTab, STATE.dashboardPeriodValue);
    h += '</select>';
    h += '<select onchange="setDashboardDivisionFilter(this.value)" class="bg-white border border-blue-100 text-on-surface font-bold rounded-lg text-[13px] px-3 py-1.5 outline-none">';
    h += '<option value="all"' + (STATE.dashboardDivisionFilter === 'all' ? ' selected' : '') + '>전체 본부</option>';
    STATE.divisions.forEach(function(d) { h += '<option value="' + d.name + '"' + (STATE.dashboardDivisionFilter === d.name ? ' selected' : '') + '>' + d.name + '</option>'; });
    h += '</select>';
    var dashFilteredTeams = STATE.dashboardDivisionFilter === 'all' ? STATE.teams : STATE.teams.filter(function(t) { return t.division === STATE.dashboardDivisionFilter; });
    h += '<select onchange="setDashboardTeamFilter(this.value)" class="bg-white border border-blue-100 text-on-surface font-bold rounded-lg text-[13px] px-3 py-1.5 outline-none">';
    h += '<option value="all"' + (STATE.dashboardTeamFilter === 'all' ? ' selected' : '') + '>전체 팀</option>';
    dashFilteredTeams.forEach(function(team) { h += '<option value="' + team.name + '"' + (STATE.dashboardTeamFilter === team.name ? ' selected' : '') + '>' + team.name + '</option>'; });
    h += '</select>';
    h += '</div>';
    h += '<div class="flex items-center gap-2">';
    h += '<button onclick="toggleAllDashboardOKRs(true)" class="px-4 py-1.5 bg-white border border-blue-100 text-primary font-bold text-[13px] rounded-lg hover:bg-blue-50 transition-all shadow-sm whitespace-nowrap">모두 열기</button>';
    h += '<button onclick="toggleAllDashboardOKRs(false)" class="px-4 py-1.5 bg-white border border-blue-100 text-primary font-bold text-[13px] rounded-lg hover:bg-blue-50 transition-all shadow-sm whitespace-nowrap">모두 닫기</button>';
    h += '</div>';
    h += '</div>';

    if(Object.keys(users).length === 0) {
        h += '<div class="bg-white/50 border border-dashed border-blue-200 h-40 lg:h-64 rounded-xl lg:rounded-2xl flex items-center justify-center text-on-surface-variant font-bold text-[12px] lg:text-[13px] text-center p-4">표시할 목표 데이터가 없습니다.</div>';
    } else {
        // --- 총 평균 진척률 카드 ---
        const userAvgList = sortedUserIds.map(uid => {
            const uGoals = users[uid];
            const okrAvgs = uGoals.map(g => Math.round(g.keyResults.reduce((s, kr) => s + kr.progress, 0) / (g.keyResults.length || 1)));
            return okrAvgs.length ? Math.round(okrAvgs.reduce((s, v) => s + v, 0) / okrAvgs.length) : 0;
        });
        const totalAvg = userAvgList.length ? Math.round(userAvgList.reduce((s, v) => s + v, 0) / userAvgList.length) : 0;
        const totalColor = totalAvg === 100 ? '#22c55e' : totalAvg >= 50 ? 'currentColor' : '#9ca3af';
        const totalDash = totalAvg * 1.76;

        h += '<div class="bg-white rounded-2xl border border-blue-50 shadow-sm p-5 mb-14">';
        h += '<div class="flex items-center justify-between">';
        // 좌측: 구성원별 미니 게이지
        h += '<div class="flex items-center gap-5 flex-wrap">';
        sortedUserIds.forEach(function(uid, i) {
            const name = getUserName(uid);
            const avg = userAvgList[i];
            const c = avg < 30 ? '#ef4444' : avg < 60 ? '#eab308' : '#22c55e';
            const d = avg * 1.76;
            h += '<div class="flex flex-col items-center gap-1.5">';
            h += '<div class="relative w-12 h-12">';
            h += '<svg class="w-12 h-12 transform -rotate-90" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" stroke="#f1f5f9" stroke-width="6" fill="none"/>';
            h += '<circle cx="32" cy="32" r="28" stroke="' + c + '" stroke-width="6" fill="none" stroke-dasharray="' + d + ' 176" stroke-linecap="round"/></svg>';
            h += '<div class="absolute inset-0 flex items-center justify-center text-[12px] font-black text-on-surface">' + avg + '%</div>';
            h += '</div>';
            h += '<div class="text-[13px] font-bold text-on-surface-variant whitespace-nowrap">' + name + '</div>';
            h += '</div>';
        });
        h += '</div>';
        // 우측: 전체 평균 게이지 + 경계선 + 인원/목표 수
        h += '<div class="flex items-center gap-5 flex-shrink-0">';
        // 전체 평균 대형 게이지
        h += '<div class="flex flex-col items-center gap-1.5">';
        h += '<div class="relative w-20 h-20">';
        const totalGaugeColor = totalAvg < 30 ? '#ef4444' : totalAvg < 60 ? '#eab308' : '#22c55e';
        h += '<svg class="w-20 h-20 transform -rotate-90" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" stroke="#f1f5f9" stroke-width="6" fill="none"/>';
        h += '<circle cx="32" cy="32" r="28" stroke="' + totalGaugeColor + '" stroke-width="6" fill="none" stroke-dasharray="' + totalDash + ' 176" stroke-linecap="round"/></svg>';
        h += '<div class="absolute inset-0 flex items-center justify-center text-[15px] font-black text-on-surface">' + totalAvg + '%</div>';
        h += '</div>';
        h += '<div class="text-[13px] font-black text-on-surface-variant whitespace-nowrap">전체 평균</div>';
        h += '</div>';
        // 경계선 + 인원·목표 수
        h += '<div class="pl-5 border-l border-blue-100 text-right">';
        h += '<div class="text-[18px] font-black text-on-surface">' + sortedUserIds.length + '명</div>';
        h += '<div class="text-[13px] text-on-surface-variant">' + Object.values(users).flat().length + '개 목표</div>';
        h += '</div>';
        h += '</div>';
        h += '</div>';
        h += '</div>';
        // --- 총 평균 진척률 카드 끝 ---

        if(isMobile) {
            h += renderDashboardMobile(container, users);
        } else {
        h += '<div class="mt-10">';
        for(const uid of sortedUserIds) {
            const name = getUserName(uid);
            const uGoals = users[uid];
            const userIdx = Object.keys(users).indexOf(uid);
            
            // User-level toggle (closed by default)
            h += '<div class="mb-4">';
            h += '<div class="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-blue-50 shadow-sm cursor-pointer hover:bg-blue-50/50 transition-colors" onclick="document.getElementById(\'user-goals-' + userIdx + '\').classList.toggle(\'hidden\'); this.querySelector(\'svg\').classList.toggle(\'-rotate-90\')">';
            h += '<svg class="w-4 h-4 text-primary transition-transform -rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>';
            h += '<div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shadow-sm">' + name.charAt(0) + '</div>';
            h += '<span class="font-extrabold text-on-surface text-[14px]">' + name + '</span>';
            h += '<span class="text-[12px] text-on-surface-variant ml-auto">' + uGoals.length + '개 목표</span>';
            h += '</div>';
            h += '<div id="user-goals-' + userIdx + '" class="hidden mt-3 pl-4">';
            
            uGoals.forEach(g => {
                const avgProgress = Math.round(g.keyResults.reduce((sum, kr) => sum + kr.progress, 0) / (g.keyResults.length || 1));
                const progressColor = avgProgress === 100 ? 'bg-success' : avgProgress >= 50 ? 'bg-primary' : 'bg-gray-400';
                
                if (STATE.dashboardTab === 'yearly') {
                    // Yearly: simple card with progress bar, no toggle
                    h += '<div class="bg-white rounded-2xl border border-blue-50 shadow-sm overflow-hidden mb-4">';
                    h += '<div class="px-6 py-5">';
                    h += '<div class="flex items-center justify-between mb-3">';
                    h += '<h3 class="font-bold text-on-surface text-[15px] leading-relaxed break-keep flex-1">' + g.text + '</h3>';
                    h += '<span class="text-primary font-black text-[16px] ml-4 shrink-0">' + avgProgress + '%</span>';
                    h += '</div>';
                    h += '<div class="w-full bg-surface-container-low h-2.5 rounded-full overflow-hidden shadow-inner">';
                    h += '<div class="' + progressColor + ' h-full transition-all rounded-full" style="width: ' + avgProgress + '%"></div>';
                    h += '</div>';
                    h += '</div></div>';
                } else {
                // Quarterly: collapsible structure with KRs (2nd level toggle)
                h += '<div class="bg-white rounded-2xl border border-blue-50 shadow-sm overflow-hidden mb-4">';
                h += '<div class="bg-gradient-to-r from-primary/5 to-primary/10 px-6 py-4 border-b border-blue-50 cursor-pointer hover:bg-primary/10 transition-colors" onclick="toggleDashboardOKR(' + g.id + ')">';
                h += '<div class="flex items-center justify-between">';
                h += '<div class="flex items-center gap-3 flex-1">';
                h += '<svg id="toggle-icon-' + g.id + '" class="w-5 h-5 text-primary transition-transform -rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>';
                h += '<h3 class="font-bold text-on-surface text-[15px] leading-relaxed break-keep flex-1">' + g.text + '</h3>';
                h += '</div>';
                h += '<div class="flex items-center gap-3 ml-4">';
                h += '<div class="text-right"><div class="text-[11px] text-on-surface-variant font-bold mb-0.5">평균 진척률</div>';
                h += '<div class="text-primary font-black text-[16px]">' + avgProgress + '%</div></div>';
                h += '<div class="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center">';
                h += '<svg class="w-16 h-16 transform -rotate-90"><circle cx="32" cy="32" r="28" stroke="#eff4ff" stroke-width="6" fill="none"/>';
                h += '<circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="6" fill="none" class="' + progressColor + '" stroke-dasharray="' + (avgProgress * 1.76) + ' 176" stroke-linecap="round"/></svg>';
                h += '</div></div></div></div>';
                
                h += '<div id="okr-content-' + g.id + '" class="px-6 py-5 hidden"><div class="space-y-4">';
                if (g.periodType !== 'yearly') {
                g.keyResults.forEach(kr => {
                    const krColor = kr.progress === 100 ? 'bg-success' : kr.progress >= 50 ? 'bg-primary' : 'bg-gray-400';
                    const checkmark = kr.progress === 100 ? '<svg class="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>' : '';
                    
                    h += '<div class="flex items-start gap-3">';
                    h += '<div class="mt-1.5 w-2 h-2 rounded-full ' + krColor + ' flex-shrink-0"></div>';
                    h += '<div class="flex-1 min-w-0"><div class="text-[13px] font-medium text-on-surface mb-2 leading-relaxed">' + kr.text + '</div>';
                    h += '<div class="flex items-center gap-3"><div class="flex-1 bg-surface-container-low h-2 rounded-full overflow-hidden shadow-inner">';
                    h += '<div class="' + krColor + ' h-full transition-all rounded-full" style="width: ' + kr.progress + '%"></div></div>';
                    h += '<div class="flex items-center gap-1.5 min-w-[50px] justify-end">';
                    h += '<span class="text-primary font-black text-[13px]">' + kr.progress + '%</span>' + checkmark;
                    h += '</div></div></div></div>';
                });
                }
                h += '</div></div></div>';
                } // end else (quarterly)
            });
            
            h += '</div></div>';
        }
        h += '</div>'; // end mt-10 wrapper
        } // end else (desktop)
    }
    container.innerHTML = h;
}

window.toggleDashboardOKR = function(okrId) {
    const content = document.getElementById('okr-content-' + okrId);
    const icon = document.getElementById('toggle-icon-' + okrId);
    if (content && icon) {
        content.classList.toggle('hidden');
        icon.classList.toggle('-rotate-90');
    }
};

window.toggleAllDashboardOKRs = function(open) {
    // Toggle user-level sections
    const allUserGoals = document.querySelectorAll('[id^="user-goals-"]');
    allUserGoals.forEach(section => {
        if (open) section.classList.remove('hidden');
        else section.classList.add('hidden');
    });
    
    // Toggle OKR-level sections (KR details)
    const allContents = document.querySelectorAll('[id^="okr-content-"]');
    const allIcons = document.querySelectorAll('[id^="toggle-icon-"]');
    
    allContents.forEach(content => {
        if (open) {
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    });
    
    allIcons.forEach(icon => {
        if (open) {
            icon.classList.remove('-rotate-90');
            icon.classList.add('rotate-0');
        } else {
            icon.classList.add('-rotate-90');
            icon.classList.remove('rotate-0');
            icon.classList.remove('rotate-180');
        }
    });
};
function renderGoalsSet(container) {
    const drafts = STATE.allGoals.filter(g => g.userId === STATE.user.id && g.periodType === STATE.goalsSetTab && g.periodValue === STATE.goalsSetPeriodValue);
    if(drafts.length === 0) {
        for(let i=0; i<3; i++) addOKR(i); 
        return;
    }

    let itemsHtml = drafts.map((g, i) => {
        const isEditable = g.status === '작성중' || g.status === '거부';
        const isPending = g.status.includes('대기중');
        const isRejected = g.status === '거부';

        let opHtml = '';
        if(isPending) {
            opHtml = `
                <div class="flex flex-col items-center gap-2 px-1">
                    <span class="text-on-surface-variant text-[13px] font-bold">승인 대기중</span>
                    <button onclick="cancelOKRRequest('${g.id}')" class="w-full text-error border border-error hover:bg-error/10 py-1.5 rounded-lg text-[12px] font-bold transition-colors">요청 취소</button>
                </div>
            `;
        } else if(isRejected) {
            opHtml = `
                <div class="flex flex-col items-center gap-2 px-1">
                    <span class="text-error font-black text-[13px]">거부됨</span>
                    ${g.reject_comment ? `<button onclick="openModal('거부 사유', '<div class=\\'p-5 bg-surface-container-lowest rounded-xl text-[14px] leading-relaxed text-on-surface border border-blue-100\\'>${g.reject_comment.replace(/'/g, "\\'").replace(/\n/g, '<br/>')}</div>', null, true)" class="w-full bg-error text-white py-1.5 rounded-lg text-[12px] font-bold hover:bg-error/90 transition-all">사유 보기</button>` : ''}
                    <button onclick="submitOKRRequest('${g.id}')" class="w-full bg-primary text-white py-2 px-2 rounded-lg text-[13px] font-bold shadow-sm hover:scale-[1.02] transition-transform">재요청</button>
                    <button onclick="removeOKR('${g.id}')" class="w-full bg-surface-container text-on-surface-variant py-2 px-2 rounded-lg text-[13px] font-bold hover:bg-error hover:text-white transition-colors border border-blue-50">삭제</button>
                </div>
            `;
        } else if(isEditable) {
            opHtml = `
                <div class="flex flex-col items-center gap-2 px-1">
                    <button onclick="submitOKRRequest('${g.id}')" class="w-full bg-primary text-white py-2 px-2 rounded-lg text-[13px] font-bold shadow-sm hover:scale-[1.02] transition-transform">승인 요청</button>
                    <button onclick="removeOKR('${g.id}')" class="w-full bg-surface-container text-on-surface-variant py-2 px-2 rounded-lg text-[13px] font-bold hover:bg-error hover:text-white transition-colors border border-blue-50">삭제</button>
                </div>
            `;
        } else {
            opHtml = `<span class="text-success font-black text-[14px]">합의 완료</span>`;
        }

        return `
            <tr class="hover:bg-surface-container-lowest transition-colors border-b border-blue-50/50">
                <td class="py-5 px-4 text-center border-r border-blue-50/30 font-bold text-on-surface-variant text-[14px] w-12">${i+1}</td>
                <td class="py-5 px-6 border-r border-blue-50/30 w-[35%] align-top">
                    <textarea rows="3" oninput="updateOKRTitle('${g.id}', this.value)" ${!isEditable?'disabled':''} class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-bold text-on-surface outline-none focus:border-primary disabled:bg-surface-container-low shadow-sm resize-none">${g.text}</textarea>
                </td>
                <td class="py-5 px-6 border-r border-blue-50/30 w-[40%] align-top">
                    ${g.periodType === 'yearly' ? '' : `<div class="flex flex-col gap-3">
                        ${g.keyResults.map((kr, kri) => `
                            <div class="flex group items-center gap-2">
                                <input type="text" value="${kr.text}" oninput="updateKRTitle('${g.id}', '${kr.id}', this.value)" ${!isEditable?'disabled':''} class="flex-1 bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-medium text-on-surface outline-none focus:border-primary disabled:bg-surface-container-low shadow-sm transition-all">
                                ${isEditable && g.keyResults.length > 1 ? `<button onclick="removeKR('${g.id}', '${kr.id}')" class="text-error opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-error/10 rounded-md"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>` : ''}
                            </div>
                        `).join('')}
                        ${isEditable ? `<button onclick="addKR('${g.id}')" class="text-primary font-bold text-[12px] flex items-center gap-1 hover:bg-primary/5 py-1 px-2 rounded-md w-max transition-colors mt-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> 추가</button>` : ''}
                    </div>`}
                </td>
                <td class="py-5 px-6 text-center align-middle w-28">
                    ${opHtml}
                </td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <div class="flex items-center gap-8 border-b-2 border-blue-50 mb-6 px-2 w-full">
            <button onclick="setTab('goals_set', 'quarterly')" class="pb-3 text-lg transition-all ${STATE.goalsSetTab === 'quarterly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">분기별</button>
            <button onclick="setTab('goals_set', 'yearly')" class="pb-3 text-lg transition-all ${STATE.goalsSetTab === 'yearly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">연간</button>
        </div>
        <div class="mb-4 w-full">
            <div class="flex justify-between items-start">
                <select onchange="setPeriod('goals_set', this.value)" class="bg-surface-container text-primary font-bold border border-blue-50 rounded-lg text-[13px] px-3 py-1.5 outline-none">
                    ${generatePeriodOptions(STATE.goalsSetTab, STATE.goalsSetPeriodValue)}
                </select>
                <button onclick="addOKR()" class="flex items-center gap-2 px-4 py-2 bg-white border border-blue-100 text-primary font-bold text-[13px] rounded-lg hover:bg-blue-50 transition-all shadow-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    새 OKR 추가
                </button>
                <button onclick="openImportOKRModal()" class="flex items-center gap-2 px-4 py-2 bg-white border border-blue-100 text-on-surface-variant font-bold text-[13px] rounded-lg hover:bg-blue-50 transition-all shadow-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    가져오기
                </button>
            </div>
        </div>
        <div class="bg-white rounded-2xl border border-blue-50 shadow-sm w-full overflow-hidden">
            <table class="w-full text-left table-auto">
                <thead>
                    <tr class="text-[14px] text-on-surface-variant font-extrabold bg-surface-container border-b border-blue-50">
                        <th class="py-4 px-4 text-center border-r border-blue-50/30">No.</th>
                        <th class="py-4 px-6 border-r border-blue-50/30">Objective</th>
                        <th class="py-4 px-6 border-r border-blue-50/30">Key Results</th>
                        <th class="py-4 px-6 text-center">상태</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
            </table>
        </div>
    `;
}

function renderGoalsManage(container) {
    // 현재 선택된 기간이 마감인지 확인
    const currentPeriodSetting = STATE.periodSettings.find(p => p.period_type === STATE.goalsManageTab && p.period_value === STATE.goalsManagePeriodValue);
    const isAdmin = STATE.user && (STATE.user.position === '대표' || STATE.user.position === 'CCO' || STATE.user.position === '본부장' || STATE.user.position === '팀장' || STATE.user.id === 'pms1');
    const isPeriodClosed = currentPeriodSetting && currentPeriodSetting.is_closed && !isAdmin;
    
    const items = STATE.allGoals.filter(g => g.userId === STATE.user.id && g.periodType === STATE.goalsManageTab && g.periodValue === STATE.goalsManagePeriodValue);
    
    let rowsHtml = '';
    if(items.length === 0) {
        rowsHtml = `<tr><td colspan="${STATE.goalsManageTab === 'yearly' ? '4' : '5'}" class="py-20 text-center text-on-surface-variant text-[13px] font-bold">등록된 목표가 없습니다. '새 OKR 추가' 버튼을 눌러 목표를 추가하세요.</td></tr>`;
    } else {
        rowsHtml = items.map((g, i) => {
            const isPending = g.status.includes('대기중');
            const isRejected = g.status === '거부';
            
            ensureTempStructures(g);
            
            const krsToRender = g.tempKeyResults || g.keyResults;
            const cTitle = g.tempText !== undefined ? g.tempText : g.text;

            let mainRow = `
                <tr class="hover:bg-surface-container-lowest/50 transition-colors border-b border-blue-50/50">
                    <td class="py-6 px-4 text-center border-r border-blue-50/30 font-bold text-on-surface-variant text-[14px] w-12 align-top">${i+1}</td>
                    <td class="py-6 px-6 ${g.periodType === 'yearly' ? 'w-[45%]' : 'w-[25%]'} border-r border-blue-50/30 align-top">
                        <textarea rows="3" oninput="updateOKRTitle('${g.id}', this.value)" ${isPending ? 'disabled':''} class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-bold text-on-surface focus:border-primary outline-none shadow-sm disabled:bg-surface-container-low resize-none">${cTitle}</textarea>
                    </td>
                    ${g.periodType !== 'yearly' ? `<td class="py-6 px-6 w-[60%] border-r border-blue-50/30 align-top" colspan="2">
                        <div class="flex flex-col gap-4">
                            ${krsToRender.map(kr => `
                                <div class="flex group items-start gap-3">
                                    <div class="flex-1 flex items-start gap-2">
                                        <textarea rows="1" oninput="updateKRTitle('${g.id}', '${kr.id}', this.value, true); this.style.height='auto'; this.style.height=this.scrollHeight+'px';" ${isPending?'disabled':''} class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-medium text-on-surface focus:border-primary outline-none shadow-sm disabled:bg-surface-container-low transition-all resize-none overflow-hidden">${kr.text}</textarea>
                                        ${!isPending && krsToRender.length > 1 ? `<button onclick="removeKR('${g.id}', '${kr.id}', true)" class="mt-2 px-2 text-error opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/10 rounded-md shrink-0"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>` : ''}
                                    </div>
                                    <div class="flex items-center gap-2 w-[180px] shrink-0 pt-2">
                                        <input type="range" min="0" max="100" value="${kr.progress}" oninput="updateKRProgress('${g.id}', '${kr.id}', this.value)" ${isPending?'disabled':''} class="w-full accent-primary h-1.5 bg-blue-100 rounded-full appearance-none cursor-pointer">
                                        <span id="kr-prog-val-${kr.id}" class="text-primary font-black text-[14px] w-10 text-right shrink-0">${kr.progress}%</span>
                                    </div>
                                </div>
                            `).join('')}
                            ${!isPending ? `<button onclick="addKR('${g.id}', true)" class="text-primary font-bold text-[12px] flex items-center gap-1 hover:bg-primary/5 py-1 px-2 rounded-md w-max transition-colors"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> 추가</button>` : ''}
                        </div>
                    </td>` : `<td class="py-6 px-4 border-r border-blue-50/30 align-top">
                        <div class="flex items-center justify-between px-4 h-[44px] bg-surface-container-lowest rounded-xl border border-blue-50 shadow-inner">
                            <input type="range" min="0" max="100" value="${g.keyResults[0]?.progress || 0}" oninput="updateKRProgress('${g.id}', '${g.keyResults[0]?.id}', this.value)" ${isPending?'disabled':''} class="w-full accent-primary h-1.5 bg-blue-100 rounded-full appearance-none cursor-pointer mr-4">
                            <span id="kr-prog-val-${g.keyResults[0]?.id}" class="text-primary font-black text-[14px] w-10 text-right shrink-0">${g.keyResults[0]?.progress || 0}%</span>
                        </div>
                    </td>`}
                    <td class="py-6 px-4 text-center align-middle w-28">
                        <div class="flex flex-col items-center gap-1.5">
                            <span class="text-[13px] font-black ${g.status === '작성중' ? 'text-on-surface-variant' : isPending ? 'text-warning' : isRejected ? 'text-error' : 'text-success'}">${g.status === '작성중' ? '작성중' : isRejected ? '거부됨' : g.status}</span>
                            ${isRejected && g.reject_comment ? `<button onclick="openModal('거부 사유', '<div class=\\'p-5 bg-surface-container-lowest rounded-xl text-[14px] leading-relaxed text-on-surface border border-blue-100\\'>${g.reject_comment.replace(/'/g, "\\'").replace(/\n/g, '<br/>')}</div>', null, true)" class="w-full bg-error text-white py-1.5 rounded-lg text-[12px] font-bold hover:bg-error/90 transition-all">사유 보기</button>` : ''}
                            ${g.status === '작성중' ?
                                `<button onclick="submitOKRRequest('${g.id}')" class="w-full bg-primary text-white py-2 rounded-lg text-[13px] font-bold hover:bg-primary-dim shadow transition-all">승인 요청</button>
                                <button onclick="removeOKR('${g.id}')" class="w-full border border-error text-error hover:bg-error/10 py-1.5 rounded-lg text-[12px] font-bold transition-all">삭제</button>` :
                            isPending ? 
                                `<button onclick="console.log('Cancel clicked for:', '${g.id}'); cancelOKRRequest('${g.id}')" class="w-full border border-error text-error hover:bg-error/10 py-2 rounded-lg text-[13px] font-bold shadow-sm transition-all">요청 취소</button>` : 
                                isRejected ?
                                `<button onclick="console.log('Resubmit clicked for:', '${g.id}'); submitModifyRequest('${g.id}')" class="w-full bg-primary text-white py-2 rounded-lg text-[13px] font-bold hover:bg-primary-dim shadow transition-all">재요청</button><button onclick="removeOKR('${g.id}')" class="w-full border border-error text-error hover:bg-error/10 py-1.5 rounded-lg text-[12px] font-bold transition-all">삭제</button>` :
                                `${isPeriodClosed ? "<button disabled class=\"w-full bg-surface-container text-on-surface-variant py-2 rounded-lg text-[13px] font-bold cursor-not-allowed\">마감됨</button>" : "<button onclick=\"submitModifyRequest('" + g.id + "')\" class=\"w-full bg-primary text-white py-2 rounded-lg text-[13px] font-bold hover:bg-primary-dim shadow transition-all\">체크인</button><button onclick=\"requestDeleteOKR('" + g.id + "')\" class=\"w-full border border-error text-error hover:bg-error/10 py-1.5 rounded-lg text-[12px] font-bold transition-all\">삭제 요청</button>"}`
                            }
                        </div>
                    </td>
                </tr>
            `;
            
            return mainRow;
        }).join('');
    }

    container.innerHTML = `
        <div class="flex items-center gap-8 border-b-2 border-blue-50 mb-6 px-2 w-full">
            <button onclick="setTab('goals_manage', 'quarterly')" class="pb-3 text-lg transition-all ${STATE.goalsManageTab === 'quarterly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">분기별</button>
            <button onclick="setTab('goals_manage', 'yearly')" class="pb-3 text-lg transition-all ${STATE.goalsManageTab === 'yearly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">연간</button>
        </div>
        <div class="mb-4 w-full flex items-center justify-between">
            <select onchange="setPeriod('goals_manage', this.value)" class="bg-surface-container text-primary font-bold border border-blue-50 rounded-lg text-[13px] px-3 py-1.5 outline-none">
                ${generatePeriodOptions(STATE.goalsManageTab, STATE.goalsManagePeriodValue, true)}
            </select>
            ${isPeriodClosed ? "" : `<button onclick="addOKR()" class="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold text-[13px] rounded-lg hover:bg-primary-dim transition-all shadow-sm"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>새 OKR 추가</button>`}
        </div>
        <div class="bg-white rounded-2xl border border-blue-50 shadow-sm w-full overflow-hidden">
            <table class="w-full text-left table-auto">
                <thead class="bg-surface-container">
                    <tr class="text-[14px] text-on-surface-variant font-extrabold border-b border-blue-50">
                        <th class="py-4 px-4 text-center border-r border-blue-50/30">No.</th>
                        <th class="py-4 px-6 border-r border-blue-50/30">Objective</th>
                        ${STATE.goalsManageTab !== 'yearly' ? `<th class="py-4 px-6 border-r border-blue-50/30" colspan="2">Key Results / 진척률</th>` : `<th class="py-4 px-6 border-r border-blue-50/30 text-center">진척률</th>`}
                        <th class="py-4 px-4 text-center">상태</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </div>
    `;
}

function renderRequests(container) {
    const okrList = STATE.allGoals.filter(g => (g.requestType !== null || g.isProcessed === true || g.status === '거부') && g.periodType === STATE.requestsTab && g.periodValue === STATE.requestsPeriodValue);
    const rnrList = STATE.rnrData.filter(r => r.request_type !== null || r.status === '합의 완료' || r.status === '거부');
    
    // Combine OKR and R&R requests
    let combinedList = [
        ...okrList.map(g => ({ type: 'okr', data: g })),
        ...rnrList.map(r => ({ type: 'rnr', data: r }))
    ];
    
    // Apply status filter
    const filter = STATE.requestsFilter || 'pending';
    combinedList = combinedList.filter(item => {
        if (item.type === 'okr') {
            const g = item.data;
            if (filter === 'pending') return !g.isProcessed && g.status !== '거부';
            if (filter === 'approved') return g.isProcessed && g.status !== '거부';
            if (filter === 'rejected') return g.status === '거부';
        } else {
            const r = item.data;
            if (filter === 'pending') return r.status !== '합의 완료' && r.status !== '거부';
            if (filter === 'approved') return r.status === '합의 완료';
            if (filter === 'rejected') return r.status === '거부';
        }
        return true;
    });
    
    // Sort by processed status
    combinedList.sort((a, b) => {
        const aProcessed = a.type === 'okr' ? a.data.isProcessed : (a.data.status === '합의 완료');
        const bProcessed = b.type === 'okr' ? b.data.isProcessed : (b.data.status === '합의 완료');
        return (aProcessed === bProcessed) ? 0 : aProcessed ? 1 : -1;
    });

    // Apply division/team filter
    if (STATE.requestsDivisionFilter !== 'all' || STATE.requestsTeamFilter !== 'all') {
        combinedList = combinedList.filter(item => {
            const userId = item.type === 'okr' ? item.data.userId : item.data.user_id;
            const member = STATE.members.find(m => m.user_id === userId);
            if (!member) return true;
            if (STATE.requestsDivisionFilter !== 'all' && member.division !== STATE.requestsDivisionFilter) return false;
            if (STATE.requestsTeamFilter !== 'all' && member.team !== STATE.requestsTeamFilter) return false;
            return true;
        });
    }

    let rowsHtml = '';
    if(combinedList.length === 0) {
        rowsHtml = `<tr><td colspan="8" class="py-24 text-center text-on-surface-variant font-bold text-[14px]">불러올 수 있는 요청 데이터가 없습니다.</td></tr>`;
    } else {
        rowsHtml = combinedList.map(item => {
            if (item.type === 'rnr') {
                const r = item.data;
                const isProcessed = r.status === '합의 완료';
                
                let requestTypeLabel = r.request_type || 'R&R 등록';
                let tagClass = 'bg-primary/10 text-primary border border-primary/20';
                if (r.request_type && r.request_type.includes('수정')) {
                    tagClass = 'bg-purple-50 text-purple-700 border border-purple-200';
                }
                
                let diffHtml = '';
                if (r.request_type && r.request_type.includes('수정')) {
                    // Parse temp_content
                    let tempData = { job: '', rnr: '' };
                    try {
                        tempData = JSON.parse(r.temp_content);
                    } catch (e) {
                        // Fallback for old format
                        tempData = { job: r.job, rnr: r.temp_content };
                    }
                    
                    
                    const jobDisplay = (r.job || '없음').replace(/\n/g, '<br>');
                    const tempJobDisplay = (tempData.job || '').replace(/\n/g, '<br>');
                    const rnrDisplay = (r.rnr || r.content || '없음').replace(/\n/g, '<br>');
                    const tempRnrDisplay = (tempData.rnr || '').replace(/\n/g, '<br>');

                    diffHtml = `
                        <div class="space-y-6 max-h-[75vh] overflow-y-auto px-2 custom-scroll py-2">
                            ${tempData.job !== r.job ? `
                            <div class="flex flex-col gap-2">
                                <div class="text-[14px] font-black text-on-surface-variant uppercase tracking-wider pl-1 font-display">직무기술 수정</div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="p-5 bg-error/5 text-error text-[13px] rounded-xl border border-error/10 relative overflow-hidden">
                                        <span class="absolute top-0 right-0 bg-error text-white text-[11px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-xl">AS-IS</span>
                                        <div class="font-sans leading-relaxed break-all pt-4">${jobDisplay}</div>
                                    </div>
                                    <div class="p-5 bg-success/5 text-success text-[13px] font-bold rounded-xl border border-success/20 relative shadow-sm overflow-hidden">
                                        <span class="absolute top-0 right-0 bg-success text-white text-[11px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-xl">TO-BE</span>
                                        <div class="font-sans leading-relaxed break-all pt-4">${tempJobDisplay}</div>
                                    </div>
                                </div>
                            </div>
                            ` : ''}
                            ${tempData.rnr !== (r.rnr || r.content) ? `
                            <div class="flex flex-col gap-2">
                                <div class="text-[14px] font-black text-on-surface-variant uppercase tracking-wider pl-1 font-display">R&R 수정</div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="p-5 bg-error/5 text-error text-[13px] rounded-xl border border-error/10 relative overflow-hidden">
                                        <span class="absolute top-0 right-0 bg-error text-white text-[11px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-xl">AS-IS</span>
                                        <div class="font-sans leading-relaxed break-all pt-4">${rnrDisplay}</div>
                                    </div>
                                    <div class="p-5 bg-success/5 text-success text-[13px] font-bold rounded-xl border border-success/20 relative shadow-sm overflow-hidden">
                                        <span class="absolute top-0 right-0 bg-success text-white text-[11px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-xl">TO-BE</span>
                                        <div class="font-sans leading-relaxed break-all pt-4">${tempRnrDisplay}</div>
                                    </div>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    `.replace(/"/g, '&quot;').replace(/\n/g, '');
                } else {
                    const jobSingle = (r.job || '').replace(/\n/g, '<br>');
                    const rnrSingle = (r.rnr || r.content || '').replace(/\n/g, '<br>');

                    diffHtml = `
                        <div class="space-y-6 max-h-[75vh] overflow-y-auto px-2 custom-scroll py-2">
                            ${r.job ? `
                            <div class="flex flex-col gap-2">
                                <div class="text-[14px] font-black text-on-surface-variant uppercase tracking-wider pl-1 font-display">직무기술</div>
                                <div class="p-5 text-on-surface text-[13px] bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                                    <div class="font-sans leading-relaxed break-all">${jobSingle}</div>
                                </div>
                            </div>
                            ` : ''}
                            ${r.rnr || r.content ? `
                            <div class="flex flex-col gap-2">
                                <div class="text-[14px] font-black text-on-surface-variant uppercase tracking-wider pl-1 font-display">R&R</div>
                                <div class="p-5 text-on-surface text-[13px] bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                                    <div class="font-sans leading-relaxed break-all">${rnrSingle}</div>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    `.replace(/"/g, '&quot;').replace(/\n/g, '');
                }
                
                return `
                    <tr class="border-b border-blue-50 hover:bg-blue-50/30 transition-colors bg-white">
                        <td class="py-6 px-5 font-extrabold text-on-surface text-[14px] text-center w-36 whitespace-nowrap">${r.name}</td>
                        <td class="py-6 px-4 text-center text-on-surface-variant text-[13px] font-semibold border-x border-blue-50/50 w-36">-</td>
                        <td class="py-6 px-4 border-r border-blue-50/50 w-44 align-middle text-center">
                            <div class="flex flex-col gap-1.5 items-center justify-center">
                                <span class="px-2.5 py-1 ${tagClass} text-[12px] font-extrabold rounded-md block w-full text-center whitespace-nowrap shadow-sm">${requestTypeLabel}</span>
                            </div>
                        </td>
                        <td class="py-6 px-5 border-r border-blue-50/50 text-center w-28">
                            <button onclick="openModal('R&R 상세 내용', \`${diffHtml}\`, null, true )" class="px-5 py-2.5 bg-white border border-blue-100 text-primary font-bold text-[14px] rounded-lg hover:bg-blue-50 hover:border-primary/30 shadow-sm transition-all mx-auto block w-max">상세 내용 확인</button>
                        </td>
                        <td class="py-6 px-4 border-r border-blue-50/50 text-center w-40">
                            ${r.comment ? `<button onclick="openModal('요청 전달 코멘트', '<div class=\\'p-6 bg-surface-container-lowest rounded-2xl text-[15px] leading-relaxed text-on-surface font-semibold border border-blue-100 shadow-sm\\'>${r.comment.replace(/\n/g, '<br/>')}</div>', null, true)" class="px-5 py-2.5 bg-white border border-blue-100 text-on-surface font-bold text-[14px] rounded-lg hover:bg-surface-container shadow-sm transition-all mx-auto block w-max">코멘트 보기</button>` : `<span class="text-[13px] text-on-surface-variant/40 font-bold">없음</span>`}
                        </td>
                        <td class="py-6 px-4 border-r border-blue-50/50 text-center w-40">
                            <span class="text-[13px] text-on-surface-variant font-semibold">${formatRequestDate(r.request_date)}</span>
                        </td>
                        <td class="py-6 px-5 text-center w-36 align-middle">
                            ${isProcessed ? 
                                `<button onclick="undoRnRApproval(${r.id})" class="w-full py-2.5 bg-white text-error font-extrabold text-[14px] rounded-lg shadow-sm hover:bg-error/5 transition-all border border-error">취소</button>` : 
                                `<div class="flex flex-col gap-2">
                                    <button onclick="approveRnRRequest(${r.id})" class="w-full py-2.5 bg-primary text-white font-extrabold text-[14px] rounded-lg shadow-md hover:scale-[1.04] transition-all border border-primary-dim">승인</button>
                                    <button onclick="rejectRnRRequest(${r.id})" class="w-full py-2 bg-white text-error font-bold text-[13px] rounded-lg shadow-sm hover:bg-error/10 transition-all border border-error">거부</button>
                                </div>`
                            }
                        </td>
                    </tr>
                `;
            } else {
                const g = item.data;
                const assignee = getUserName(g.userId);
                const period = getPeriodLabel(g.periodType, g.periodValue);
                
                let types = (g.requestType || '신규 수립').split(',');
                let tagsHtml = `<div class="flex flex-col gap-1.5 items-center justify-center">` + types.map(t => {
                    let c = 'bg-surface-container-low text-on-surface-variant border border-blue-50/50';
                    const s = t.trim();
                    if(s === '신규 수립') c = 'bg-primary/10 text-primary border border-primary/20';
                    else if(s.includes('진척률')) c = 'bg-[#fef3c7] text-[#b45309] border border-[#f59e0b]/20';
                    else if(s.includes('OKR')) c = 'bg-[#ecfdf5] text-[#047857] border border-[#10b981]/20';
                    else if(s.includes('KR')) c = 'bg-purple-50 text-purple-700 border border-purple-200';
                    return `<span class="px-2.5 py-1 ${c} text-[12px] font-extrabold rounded-md block w-full text-center whitespace-nowrap shadow-sm">${s}</span>`;
                }).join('') + `</div>`;

                const hasComment = !!g.comment;
                const diffHtml = createDiffContent(g);

                return `
                    <tr class="border-b border-blue-50 hover:bg-blue-50/30 transition-colors bg-white">
                        <td class="py-6 px-5 font-extrabold text-on-surface text-[14px] text-center w-36 whitespace-nowrap">${assignee}</td>
                        <td class="py-6 px-4 text-center text-on-surface-variant text-[13px] font-semibold border-x border-blue-50/50 w-36">${period}</td>
                        <td class="py-6 px-4 border-r border-blue-50/50 w-44 align-middle text-center">
                            ${tagsHtml}
                        </td>
                        <td class="py-6 px-5 border-r border-blue-50/50 text-center w-28">
                            <button onclick="openModal('상세 결재 내용 전후 비교', \`${diffHtml}\`, null, true )" class="px-5 py-2.5 bg-white border border-blue-100 text-primary font-bold text-[14px] rounded-lg hover:bg-blue-50 hover:border-primary/30 shadow-sm transition-all mx-auto block w-max">상세 내용 확인</button>
                        </td>
                        <td class="py-6 px-4 border-r border-blue-50/50 text-center w-40">
                            ${hasComment ? `<button onclick="openModal('요청 전달 코멘트', '<div class=\\'p-6 bg-surface-container-lowest rounded-2xl text-[15px] leading-relaxed text-on-surface font-semibold border border-blue-100 shadow-sm\\'>${g.comment.replace(/\n/g, '<br/>')}</div>', null, true)" class="px-5 py-2.5 bg-white border border-blue-100 text-on-surface font-bold text-[14px] rounded-lg hover:bg-surface-container shadow-sm transition-all mx-auto block w-max">코멘트 보기</button>` : `<span class="text-[13px] text-on-surface-variant/40 font-bold">없음</span>`}
                        </td>
                        <td class="py-6 px-4 border-r border-blue-50/50 text-center w-40">
                            <span class="text-[13px] text-on-surface-variant font-semibold">${formatRequestDate(g.request_date)}</span>
                        </td>
                        <td class="py-6 px-5 text-center w-36 align-middle">
                            ${g.isProcessed ? 
                                `<button onclick="undoApproval(${g.id})" class="w-full py-2.5 bg-white text-error font-extrabold text-[14px] rounded-lg shadow-sm hover:bg-error/5 transition-all border border-error">취소</button>` : 
                                `<div class="flex flex-col gap-2">
                                    <button onclick="approveAdminRequest(${g.id})" class="w-full py-2.5 bg-primary text-white font-extrabold text-[14px] rounded-lg shadow-md hover:scale-[1.04] transition-all border border-primary-dim">승인</button>
                                    <button onclick="rejectAdminRequest(${g.id})" class="w-full py-2 bg-white text-error font-bold text-[13px] rounded-lg shadow-sm hover:bg-error/10 transition-all border border-error">거부</button>
                                </div>`
                            }
                        </td>
                    </tr>
                `;
            }
        }).join('');
    }

    container.innerHTML = `
        <div class="flex items-center justify-between border-b-2 border-blue-50 mb-6 px-2 w-full">
            <div class="flex items-center gap-8">
                <button onclick="setTab('requests', 'quarterly')" class="pb-3 text-lg transition-all ${STATE.requestsTab === 'quarterly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">분기별</button>
                <button onclick="setTab('requests', 'yearly')" class="pb-3 text-lg transition-all ${STATE.requestsTab === 'yearly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">연간</button>
            </div>
            <select onchange="setRequestsFilter(this.value)" class="bg-surface-container text-on-surface font-bold border border-blue-50 rounded-lg text-[13px] px-3 py-1.5 outline-none mb-1">
                <option value="pending" ${STATE.requestsFilter === 'pending' ? 'selected' : ''}>요청된 항목</option>
                <option value="approved" ${STATE.requestsFilter === 'approved' ? 'selected' : ''}>승인된 항목</option>
                <option value="rejected" ${STATE.requestsFilter === 'rejected' ? 'selected' : ''}>거부된 항목</option>
            </select>
        </div>
        <div class="mb-4 w-full flex items-center gap-3 flex-wrap">
            <select onchange="setPeriod('requests', this.value)" class="bg-surface-container text-primary font-bold border border-blue-50 rounded-lg text-[13px] px-3 py-1.5 outline-none">
                ${generatePeriodOptions(STATE.requestsTab, STATE.requestsPeriodValue)}
            </select>
            <select onchange="STATE.requestsDivisionFilter=this.value;STATE.requestsTeamFilter='all';renderCurrentView();" class="bg-surface-container text-on-surface font-bold border border-blue-50 rounded-lg text-[13px] px-3 py-1.5 outline-none">
                <option value="all" ${STATE.requestsDivisionFilter==='all'?'selected':''}>전체 본부</option>
                ${STATE.divisions.map(d=>`<option value="${d.name}" ${STATE.requestsDivisionFilter===d.name?'selected':''}>${d.name}</option>`).join('')}
            </select>
            <select onchange="STATE.requestsTeamFilter=this.value;renderCurrentView();" class="bg-surface-container text-on-surface font-bold border border-blue-50 rounded-lg text-[13px] px-3 py-1.5 outline-none">
                <option value="all" ${STATE.requestsTeamFilter==='all'?'selected':''}>전체 팀</option>
                ${(STATE.requestsDivisionFilter==='all'?STATE.teams:STATE.teams.filter(t=>t.division===STATE.requestsDivisionFilter)).map(t=>`<option value="${t.name}" ${STATE.requestsTeamFilter===t.name?'selected':''}>${t.name}</option>`).join('')}
            </select>
        </div>
        <div class="bg-white rounded-2xl border border-blue-50 shadow-sm w-full overflow-hidden">
            <table class="w-full text-left table-auto">
                <thead class="bg-surface-container">
                    <tr class="text-[14px] text-on-surface-variant font-extrabold border-b border-blue-50">
                        <th class="py-4 px-5 text-center">기안자</th>
                        <th class="py-4 px-4 text-center border-x border-blue-50/30">기간</th>
                        <th class="py-4 px-4 text-center border-r border-blue-50/30">성격</th>
                        <th class="py-4 px-5 text-center border-r border-blue-50/30">데이터 상세</th>
                        <th class="py-4 px-4 text-center border-r border-blue-50/30">코멘트</th>
                        <th class="py-4 px-4 text-center border-r border-blue-50/30">요청일시</th>
                        <th class="py-4 px-5 text-center">관리</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </div>
    `;
}

function createDiffContent(g) {
    let diff = `
        <div class="max-h-[75vh] overflow-y-auto custom-scroll">
            <!-- Objective Section -->
            <div class="mb-4">
                <div class="text-[12px] font-bold text-on-surface-variant mb-2 px-1">Objective</div>
                ${g.tempText !== undefined && g.tempText !== g.text ? `
                    <div class="grid grid-cols-2 gap-3">
                        <div class="p-3 bg-surface-container text-on-surface text-[13px] rounded-lg border border-blue-100">
                            <div class="text-[10px] font-bold text-on-surface-variant mb-1">변경 전</div>
                            <div class="line-through opacity-60">${g.text}</div>
                        </div>
                        <div class="p-3 bg-surface-container text-on-surface text-[13px] rounded-lg border border-blue-100">
                            <div class="text-[10px] font-bold text-on-surface-variant mb-1">변경 후</div>
                            <div class="font-bold">${g.tempText}</div>
                        </div>
                    </div>
                ` : `<div class="p-3 text-on-surface text-[13px] bg-surface-container rounded-lg border border-blue-100">${g.text}</div>`}
            </div>
            
            <!-- Key Results Section -->
            ${g.periodType !== 'yearly' ? `<div>
                <div class="text-[12px] font-bold text-on-surface-variant mb-2 px-1">Key Results</div>
                <div class="bg-white border border-blue-100 rounded-lg overflow-hidden">
                    <table class="w-full text-[12px]">
                        <thead class="bg-surface-container">
                            <tr class="border-b border-blue-100">
                                <th class="py-2 px-3 text-left font-bold text-on-surface-variant w-12">No.</th>
                                <th class="py-2 px-3 text-left font-bold text-on-surface-variant border-l border-blue-100">내용</th>
                                <th class="py-2 px-3 text-center font-bold text-on-surface-variant border-l border-blue-100 w-24">진척률</th>
                                <th class="py-2 px-3 text-center font-bold text-on-surface-variant border-l border-blue-100 w-20">상태</th>
                            </tr>
                        </thead>
                        <tbody>
    ` : ''}`;

    if (g.periodType !== 'yearly') {
    const krsToRender = g.tempKeyResults || g.keyResults;
    
    krsToRender.forEach((kr, i) => {
        const oldKr = g.keyResults.find(k => k.id == kr.id);
        const isNew = !oldKr;
        
        let hasTextDiff = false;
        let hasProgDiff = false;
        if(oldKr) {
            hasTextDiff = kr.text !== oldKr.text;
            hasProgDiff = kr.progress !== oldKr.progress;
        }

        let statusBadge = '';
        if(isNew) {
            statusBadge = '<span class="text-[10px] font-bold text-on-surface bg-surface-container px-2 py-0.5 rounded border border-blue-100">신규</span>';
        } else if(hasTextDiff || hasProgDiff) {
            statusBadge = '<span class="text-[10px] font-bold text-on-surface bg-surface-container px-2 py-0.5 rounded border border-blue-100">수정</span>';
        } else {
            statusBadge = '<span class="text-[10px] font-bold text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded">유지</span>';
        }

        diff += `
            <tr class="border-b border-blue-50 hover:bg-surface-container-lowest/50">
                <td class="py-2 px-3 text-center font-bold text-on-surface-variant">${i+1}</td>
                <td class="py-2 px-3 border-l border-blue-50 text-on-surface">
                    ${hasTextDiff ? `
                        <div class="space-y-1">
                            <div class="line-through opacity-50 text-[11px]">${oldKr.text}</div>
                            <div class="font-bold">${kr.text}</div>
                        </div>
                    ` : `<div>${kr.text}</div>`}
                </td>
                <td class="py-2 px-3 text-center border-l border-blue-50 text-on-surface">
                    ${hasProgDiff ? `
                        <div class="flex items-center justify-center gap-1">
                            <span class="line-through opacity-50 text-[11px]">${oldKr.progress}%</span>
                            <span class="text-on-surface-variant">→</span>
                            <span class="font-bold">${kr.progress}%</span>
                        </div>
                    ` : `<span class="font-bold">${kr.progress}%</span>`}
                </td>
                <td class="py-2 px-3 text-center border-l border-blue-50">${statusBadge}</td>
            </tr>
        `;
    });
    
    // Check for deleted items
    if(g.tempKeyResults) {
        g.keyResults.forEach(oldKr => {
            if(!g.tempKeyResults.find(k => k.id == oldKr.id)) {
                diff += `
                    <tr class="border-b border-blue-50 bg-surface-container-low">
                        <td class="py-2 px-3 text-center font-bold text-on-surface-variant">-</td>
                        <td class="py-2 px-3 border-l border-blue-50 text-on-surface line-through opacity-50 text-[11px]">${oldKr.text}</td>
                        <td class="py-2 px-3 text-center border-l border-blue-50 text-on-surface line-through opacity-50 text-[11px]">${oldKr.progress}%</td>
                        <td class="py-2 px-3 text-center border-l border-blue-50">
                            <span class="text-[10px] font-bold text-on-surface bg-surface-container px-2 py-0.5 rounded border border-blue-100">삭제</span>
                        </td>
                    </tr>
                `;
            }
        });
    }

    diff += `
                        </tbody>
                    </table>
                </div>
            </div>`;
    } // end if not yearly

    // For yearly goals, show progress change
    if (g.periodType === 'yearly' && g.tempKeyResults && g.tempKeyResults[0]) {
        const newProg = g.tempKeyResults[0].progress;
        const oldProg = g.keyResults[0]?.progress || 0;
        if (newProg !== oldProg) {
            diff += `
            <div class="mt-4">
                <div class="text-[12px] font-bold text-on-surface-variant mb-2 px-1">진척률</div>
                <div class="p-4 bg-surface-container rounded-lg border border-blue-100">
                    <div class="flex items-center gap-3">
                        <span class="text-[13px] line-through opacity-50">${oldProg}%</span>
                        <span class="text-on-surface-variant">→</span>
                        <span class="text-[15px] font-black text-primary">${newProg}%</span>
                    </div>
                    <div class="mt-2 w-full bg-blue-100 h-2 rounded-full overflow-hidden">
                        <div class="bg-primary h-full rounded-full" style="width: ${newProg}%"></div>
                    </div>
                </div>
            </div>`;
        }
    }

    diff += `
        </div>
    `;
    return diff.replace(/"/g, '&quot;').replace(/\n/g, '');
}

function renderModal(container) {
    if(!STATE.modalData) return;
    const hasAction = typeof STATE.modalData.onConfirmAction === 'function' || typeof STATE.modalData.onConfirm === 'function';
    const confirmAction = STATE.modalData.onConfirmAction || STATE.modalData.onConfirm;
    // isWide determines the width of the modal
    const maxWidthClass = STATE.modalData.isWide ? 'max-w-5xl' : 'max-w-xl';
    
    const mHtml = `
        <div id="app-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div class="absolute inset-0 bg-black/40 backdrop-blur-[3px]" onclick="closeModal()"></div>
            <div class="relative bg-white rounded-[2rem] w-full ${maxWidthClass} shadow-2xl p-10 transform transition-all border border-blue-100 overflow-hidden">
                <div class="flex justify-between items-center mb-8 pb-5 border-b border-blue-50">
                    <h3 class="font-display font-black text-[22px] text-primary tracking-tight">${STATE.modalData.title}</h3>
                    <button onclick="closeModal()" class="text-on-surface-variant hover:text-error transition-colors p-2.5 rounded-full hover:bg-error/10 bg-surface-container"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                </div>
                <div class="text-on-surface text-[15px] mb-8 leading-relaxed">
                    ${STATE.modalData.content}
                </div>
                <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-blue-50/50">
                    <button onclick="closeModal()" class="px-8 py-3.5 bg-surface-container hover:bg-blue-100 text-on-surface font-black text-[14px] rounded-xl transition-all">닫기</button>
                    ${hasAction ? `<button id="modal-confirm-btn" class="px-10 py-3.5 bg-primary hover:bg-primary-dim text-white font-black text-[14px] rounded-xl shadow-xl transition-all">확인</button>` : ''}
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', mHtml);
    if(hasAction) document.getElementById('modal-confirm-btn').onclick = () => confirmAction();
}

// Auth
document.getElementById('btn-login').addEventListener('click', async () => {
    const id = document.getElementById('login-id').value;
    const pw = document.getElementById('login-pw').value;
    
    if (!id || !pw) {
        alert('아이디와 비밀번호를 입력하세요.');
        return;
    }
    
    // Show loading state
    const loginBtn = document.getElementById('btn-login');
    const originalText = loginBtn.innerText;
    loginBtn.innerText = '로그인 중...';
    loginBtn.disabled = true;
    
    try {
        // Load data from Baserow first
        await loadDataFromBaserow();
        // assessment already loaded inside loadDataFromBaserow
        
        // Find member in loaded data (including master account)
        const member = STATE.members.find(m => m.user_id === id);
        
        if (!member) {
            alert('아이디가 존재하지 않습니다.');
            loginBtn.innerText = originalText;
            loginBtn.disabled = false;
            return;
        }
        
        if (member.password !== pw) {
            alert('비밀번호가 일치하지 않습니다.');
            loginBtn.innerText = originalText;
            loginBtn.disabled = false;
            return;
        }
        
        // 가입 승인 대기 체크
        if (member.is_approved === false) {
            alert('승인 대기중입니다.');
            loginBtn.innerText = originalText;
            loginBtn.disabled = false;
            return;
        }
        
        // Debug logging
        console.log('Login - member data:', member);
        console.log('Login - member.team:', member.team);
        
        // Set user with member data
        STATE.user = {
            id: member.user_id,
            name: member.name,
            role: (member.position === '팀장' || member.position === '본부장' || member.position === '대표' || member.position === 'CCO' || member.user_id === 'pms1') ? 'admin' : 'user',
            division: member.division,
            team: member.team,
            position: member.position,
            memberId: member.id
        };
        
        console.log('Login - STATE.user after setting:', STATE.user);
        // Save login session to localStorage
        localStorage.setItem('okr_session', JSON.stringify({
            user: STATE.user,
            timestamp: Date.now()
        }));
        
        document.getElementById('user-avatar').innerText = STATE.user.name.charAt(0);
        document.getElementById('auth-user-name').innerText = STATE.user.name;
        document.getElementById('division-label').innerText = '';
        document.getElementById('login-view').classList.add('hidden');
        document.getElementById('app-view').classList.remove('hidden');
        
        // Set default dashboard filter to user's division/team
        if (STATE.user.division) STATE.dashboardDivisionFilter = STATE.user.division;
        if (STATE.user.team) STATE.dashboardTeamFilter = STATE.user.team;
        
        // Navigate to dashboard and update URL
        navigateTo('dashboard', true);
    } catch (error) {
        console.error('Login error:', error);
        alert('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
        loginBtn.innerText = originalText;
        loginBtn.disabled = false;
    }
});
document.getElementById('btn-logout').addEventListener('click', () => {
    STATE.user = null;
    // Clear login session from localStorage
    localStorage.removeItem('okr_session');
    
    // Reset login button state
    const loginBtn = document.getElementById('btn-login');
    loginBtn.innerText = '로그인';
    loginBtn.disabled = false;
    
    document.getElementById('login-view').classList.remove('hidden');
    document.getElementById('app-view').classList.add('hidden');
    // Update URL to login page
    window.history.pushState(null, '', '/login');
});

// Password Change Function
window.openPasswordChangeModal = function() {
    STATE.modalData = {
        title: '비밀번호 변경',
        content: `
            <div class="space-y-4">
                <div>
                    <label class="block text-[13px] font-bold text-on-surface-variant mb-2">현재 비밀번호</label>
                    <input type="password" id="current-password" class="w-full bg-white border border-blue-100 rounded-lg px-4 py-3 text-[13px] text-on-surface outline-none focus:border-primary" placeholder="현재 비밀번호 입력">
                </div>
                <div>
                    <label class="block text-[13px] font-bold text-on-surface-variant mb-2">새 비밀번호</label>
                    <input type="password" id="new-password" class="w-full bg-white border border-blue-100 rounded-lg px-4 py-3 text-[13px] text-on-surface outline-none focus:border-primary" placeholder="새 비밀번호 입력">
                </div>
                <div>
                    <label class="block text-[13px] font-bold text-on-surface-variant mb-2">새 비밀번호 확인</label>
                    <input type="password" id="new-password-confirm" class="w-full bg-white border border-blue-100 rounded-lg px-4 py-3 text-[13px] text-on-surface outline-none focus:border-primary" placeholder="새 비밀번호 재입력">
                </div>
            </div>
        `,
        onConfirm: async () => {
            const currentPassword = document.getElementById('current-password')?.value.trim();
            const newPassword = document.getElementById('new-password')?.value.trim();
            const newPasswordConfirm = document.getElementById('new-password-confirm')?.value.trim();
            
            if (!currentPassword || !newPassword || !newPasswordConfirm) {
                alert('모든 필드를 입력해주세요.');
                return;
            }
            
            // Find current user in members
            const currentMember = STATE.members.find(m => m.user_id === STATE.user.id);
            if (!currentMember) {
                alert('사용자 정보를 찾을 수 없습니다.');
                return;
            }
            
            // Verify current password
            if (currentMember.password !== currentPassword) {
                alert('현재 비밀번호가 일치하지 않습니다.');
                return;
            }
            
            // Verify new password confirmation
            if (newPassword !== newPasswordConfirm) {
                alert('새 비밀번호가 일치하지 않습니다.');
                return;
            }
            
            // Validate new password (minimum 4 characters)
            if (newPassword.length < 4) {
                alert('새 비밀번호는 최소 4자 이상이어야 합니다.');
                return;
            }
            
            try {
                // Update password in Baserow
                await MembersAPI.update(currentMember.id, {
                    password: newPassword
                });
                
                // Update local state
                currentMember.password = newPassword;
                
                // Update session
                const session = {
                    user: STATE.user,
                    timestamp: Date.now()
                };
                localStorage.setItem('okr_session', JSON.stringify(session));
                
                STATE.modalData = null;
                alert('비밀번호가 성공적으로 변경되었습니다.');
                renderCurrentView();
            } catch (error) {
                console.error('Error changing password:', error);
                alert('비밀번호 변경 중 오류가 발생했습니다.');
            }
        },
        isWide: false
    };
    renderCurrentView();
};

// 날짜 및 시간 업데이트 함수
function updateDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    document.getElementById('current-date').innerText = `${year}년 ${month}월 ${date}일`;
    document.getElementById('current-time').innerText = `${hours}:${minutes}:${seconds}`;
}

// 초기 날짜/시간 설정 및 1초마다 업데이트
updateDateTime();
setInterval(updateDateTime, 1000);

// --- Members Management ---
window.updateMemberField = async function(id, field, value) {
    const member = STATE.members.find(m => m.id === id);
    if(member) {
        member[field] = value;
        // Mark as modified but don't save immediately
        if (!member._modified) member._modified = {};
        member._modified[field] = true;
    }
};

window.saveAllMembers = async function() {
    try {
        let updateCount = 0;
        let currentUserUpdated = false;
        
        for (const member of STATE.members) {
            if (member._modified) {
                // Update in Baserow
                const updateData = {};
                for (const field in member._modified) {
                    updateData[field] = member[field];
                }
                
                await MembersAPI.update(member.id, updateData);
                
                // Check if current user's position was updated
                if (member.user_id === STATE.user.id && member._modified.position) {
                    currentUserUpdated = true;
                    STATE.user.role = (member.position === '팀장' || member.position === '본부장' || member.position === '대표' || member.position === 'CCO' || member.user_id === 'pms1') ? 'admin' : 'user';
                    
                    // Update localStorage session
                    const session = JSON.parse(localStorage.getItem('okr_session') || '{}');
                    if (session.user) {
                        session.user.role = STATE.user.role;
                        localStorage.setItem('okr_session', JSON.stringify(session));
                    }
                }
                
                delete member._modified;
                updateCount++;
            }
        }
        
        if (updateCount > 0) {
            alert(`${updateCount}명의 구성원 정보가 저장되었습니다.`);
            if (currentUserUpdated) {
                alert('회원님의 권한이 변경되었습니다. 페이지를 새로고침합니다.');
                location.reload();
            }
        } else {
            alert('변경된 정보가 없습니다.');
        }
    } catch (error) {
        console.error('Error saving members:', error);
        alert('구성원 정보 저장 중 오류가 발생했습니다.');
    }
};

// Set members team filter
window.setMembersTeamFilter = function(teamName) {
    STATE.membersTeamFilter = teamName;
    renderCurrentView();
};

window.setMembersDivisionFilter = function(val) {
    STATE.membersDivisionFilter = val;
    STATE.membersTeamFilter = 'all';
    renderCurrentView();
};

window.setFeedbackDivisionFilter = function(val) {
    STATE.feedbackDivisionFilter = val;
    STATE.feedbackTeamFilter = 'all';
    STATE.feedbackSelectedMember = '';
    renderCurrentView();
};

window.setFeedbackDashDivisionFilter = function(val) {
    STATE.feedbackDashDivisionFilter = val;
    STATE.feedbackDashTeamFilter = 'all';
    renderCurrentView();
};

window.toggleMembersShowHidden = function() {
    STATE.membersShowHidden = !STATE.membersShowHidden;
    renderCurrentView();
};


window.approveMember = async function(id) {
    try {
        await MembersAPI.update(id, { is_approved: true, is_hidden: false });
        const member = STATE.members.find(m => m.id === id);
        if (member) { member.is_approved = true; member.is_hidden = false; }
        renderCurrentView();
    } catch (e) {
        console.error("Error approving member:", e);
        alert("승인 처리 중 오류가 발생했습니다.");
    }
};

window.toggleMemberHidden = async function(id) {
    const member = STATE.members.find(m => m.id === id);
    if (!member) return;
    const newVal = !member.is_hidden;
    try {
        await MembersAPI.update(id, { is_hidden: newVal });
        member.is_hidden = newVal;
        renderCurrentView();
    } catch (e) {
        console.error('Error toggling hidden:', e);
        alert('숨김 처리 중 오류가 발생했습니다.');
    }
};

window.setWeeklyReportTeamFilter = function(val) {
    STATE.weeklyReportTeamFilter = val;
    renderCurrentView();
};

window.setWeeklyReportDivisionFilter = function(val) {
    STATE.weeklyReportDivisionFilter = val;
    STATE.weeklyReportTeamFilter = '';
    renderCurrentView();
};

window.addMember = async function() {
    try {
        const newMember = {
            name: '',
            user_id: '',
            password: '',
            division: STATE.user.division,
            team: STATE.membersTeamFilter !== 'all' ? STATE.membersTeamFilter : (STATE.teams.length > 0 ? STATE.teams[0].name : ''),
            job: '',
            position: '멤버',
            email: '',
            role: 'user'
        };
        
        const created = await MembersAPI.create(newMember);
        
        STATE.members.push({
            id: created.id,
            name: created.name,
            user_id: created.user_id,
            password: created.password,
            division: created.division,
            team: created.team,
            job: created.job || '',
            position: created.position,
            email: created.email
        });
        
        renderCurrentView();
    } catch (error) {
        console.error('Error adding member:', error);
        alert('구성원 추가 중 오류가 발생했습니다.');
    }
};

// --- Team Management ---
window.openTeamManagement = function() {
    const teamListHtml = STATE.teams.map(team => `
        <div class="flex items-center gap-3 p-4 bg-surface-container rounded-lg border border-blue-50 hover:border-primary/30 transition-all group">
            <input type="text" value="${team.name}" id="team-name-${team.id}" class="flex-1 bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-bold text-on-surface outline-none focus:border-primary shadow-sm" placeholder="팀명 입력">
            <button onclick="updateTeamName(${team.id})" class="px-4 py-2 bg-primary text-white font-bold text-[13px] rounded-lg hover:bg-primary-dim transition-all shadow-sm">수정</button>
            <button onclick="deleteTeam(${team.id})" class="px-4 py-2 bg-white border border-error text-error font-bold text-[13px] rounded-lg hover:bg-error/10 transition-colors shadow-sm">삭제</button>
        </div>
    `).join('');

    const content = `
        <div class="space-y-4 max-h-[60vh] overflow-y-auto px-2">
            ${teamListHtml}
            <div class="flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-dashed border-blue-200">
                <input type="text" id="new-team-name" class="flex-1 bg-surface-container border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-medium text-on-surface outline-none focus:border-primary shadow-sm" placeholder="새 팀명 입력">
                <button onclick="addTeam()" class="px-4 py-2 bg-success text-white font-bold text-[13px] rounded-lg hover:opacity-90 transition-all shadow-sm flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    팀 추가
                </button>
            </div>
        </div>
    `;

    openModal('팀 관리', content, null, false);
};

window.addTeam = async function() {
    const input = document.getElementById('new-team-name');
    const teamName = input.value.trim();
    if(!teamName) {
        alert('팀명을 입력하세요.');
        return;
    }
    if(STATE.teams.some(t => t.name === teamName)) {
        alert('이미 존재하는 팀명입니다.');
        return;
    }
    
    try {
        const created = await TeamsAPI.create({
            name: teamName,
            division: STATE.divisions.length > 0 ? STATE.divisions[0].name : ''
        });
        
        STATE.teams.push({ id: created.id, name: created.name });
        closeModal();
        openTeamManagement();
    } catch (error) {
        console.error('Error adding team:', error);
        alert('팀 추가 중 오류가 발생했습니다.');
    }
};

window.updateTeamName = async function(id) {
    const input = document.getElementById(`team-name-${id}`);
    const newName = input.value.trim();
    if(!newName) {
        alert('팀명을 입력하세요.');
        return;
    }
    const team = STATE.teams.find(t => t.id === id);
    if(!team) return;
    
    const oldName = team.name;
    if(STATE.teams.some(t => t.id !== id && t.name === newName)) {
        alert('이미 존재하는 팀명입니다.');
        return;
    }
    
    try {
        // Update team in Baserow
        await TeamsAPI.update(id, { name: newName });
        
        // Update members' team names
        const membersToUpdate = STATE.members.filter(m => m.team === oldName);
        for (const member of membersToUpdate) {
            member.team = newName;
            await MembersAPI.update(member.id, { team: newName });
        }
        
        team.name = newName;
        closeModal();
        openTeamManagement();
    } catch (error) {
        console.error('Error updating team:', error);
        alert('팀명 수정 중 오류가 발생했습니다.');
    }
};

window.deleteTeam = async function(id) {
    const team = STATE.teams.find(t => t.id === id);
    if(!team) return;
    
    // 해당 팀에 속한 구성원이 있는지 확인
    const membersInTeam = STATE.members.filter(m => m.team === team.name);
    if(membersInTeam.length > 0) {
        alert(`${team.name}에 ${membersInTeam.length}명의 구성원이 있습니다. 구성원을 먼저 다른 팀으로 이동하거나 삭제해주세요.`);
        return;
    }
    
    if(confirm(`'${team.name}' 팀을 삭제하시겠습니까?`)) {
        try {
            await TeamsAPI.delete(id);
            STATE.teams = STATE.teams.filter(t => t.id !== id);
            closeModal();
            openTeamManagement();
        } catch (error) {
            console.error('Error deleting team:', error);
            alert('팀 삭제 중 오류가 발생했습니다.');
        }
    }
};

window.removeMember = function(id) {
    const member = STATE.members.find(m => m.id === id);
    if (!member) return;
    if (STATE.members.length <= 1) {
        alert('최소 1명의 구성원이 필요합니다.');
        return;
    }
    STATE.modalData = {
        title: '구성원 삭제',
        content: `<div class="text-center py-2"><p class="text-[14px] text-on-surface font-bold mb-2">${member.name}님을 구성원에서 정말 삭제하시겠습니까?</p><p class="text-[13px] text-on-surface-variant">복구할 수 없습니다.</p></div>`,
        onConfirm: async () => {
            try {
                await MembersAPI.delete(id);
                STATE.members = STATE.members.filter(m => m.id !== id);
                STATE.modalData = null;
                renderCurrentView();
            } catch (error) {
                console.error('Error removing member:', error);
                alert('구성원 삭제 중 오류가 발생했습니다.');
            }
        },
        isWide: false
    };
    renderCurrentView();
};
function renderMembers(container) {
    // 가입 대기자 승인 권한: 대표, 본부장, pms1
    const canApprove = STATE.user && (
        STATE.user.position === '대표' || STATE.user.position === '본부장' || STATE.user.id === 'pms1'
    );
    const pendingMembers = STATE.members.filter(m => m.is_approved === false);

    // 가입 대기자 뷰
    if (STATE.membersView === 'pending' && canApprove) {
        let pendingHtml = pendingMembers.length === 0
            ? '<div class="bg-white/50 border border-dashed border-blue-200 h-32 rounded-xl flex items-center justify-center text-on-surface-variant font-bold text-[13px]">가입 대기자가 없습니다.</div>'
            : pendingMembers.map(m => `
                <div class="bg-white rounded-xl border border-blue-50 shadow-sm p-5 mb-3 flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning font-bold text-[14px]">${m.name.charAt(0)}</div>
                        <div>
                            <p class="text-[14px] font-bold text-on-surface">${m.name}</p>
                            <p class="text-[12px] text-on-surface-variant">${m.email || ''} · ${m.division} · ${m.team} · ${m.job || ''}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="approveMember(${m.id})" class="px-4 py-2 bg-primary text-white font-bold text-[13px] rounded-lg hover:bg-primary-dim transition-all shadow-sm">승인</button>
                        <button onclick="removeMember(${m.id})" class="px-4 py-2 bg-white border border-error text-error font-bold text-[13px] rounded-lg hover:bg-error/10 transition-colors shadow-sm">거부</button>
                    </div>
                </div>
            `).join('');

        container.innerHTML = `
            <div class="mb-5 flex items-center gap-3">
                <button onclick="STATE.membersView='list'; renderCurrentView();" class="flex items-center gap-1.5 text-[13px] font-bold text-on-surface-variant hover:text-primary transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                    구성원 목록으로
                </button>
                <span class="text-[14px] font-black text-on-surface">가입 대기자 (${pendingMembers.length}명)</span>
            </div>
            ${pendingHtml}
        `;
        return;
    }

    const showHidden = STATE.membersShowHidden || false;

    // 표시할 구성원 필터링 (승인된 구성원만)
    let visibleMembers = showHidden
        ? STATE.members.filter(m => m.is_hidden && m.is_approved !== false)
        : STATE.members.filter(m => !m.is_hidden && m.is_approved !== false);

    // 본부 필터
    if (STATE.membersDivisionFilter !== 'all') {
        visibleMembers = visibleMembers.filter(m => m.division === STATE.membersDivisionFilter);
    }
    // 팀 필터
    if (STATE.membersTeamFilter !== 'all') {
        visibleMembers = visibleMembers.filter(m => m.team === STATE.membersTeamFilter);
    }

    // 본부 필터에 따른 팀 목록
    const filteredTeamsForMembers = STATE.membersDivisionFilter === 'all'
        ? STATE.teams
        : STATE.teams.filter(t => t.division === STATE.membersDivisionFilter);

    const hiddenCount = STATE.members.filter(m => m.is_hidden && m.is_approved !== false).length;

    const rowsHtml = visibleMembers.map((member, i) => `
        <tr class="hover:bg-surface-container-lowest transition-colors border-b border-blue-50/50 ${member.is_hidden ? 'bg-gray-50/50 opacity-60' : ''}">
            <td class="py-5 px-4 text-center border-r border-blue-50/30 font-bold text-on-surface-variant text-[14px] w-12">${i+1}</td>
            <td class="py-5 px-6 border-r border-blue-50/30 w-[14%]">
                <input type="text" value="${member.name}" oninput="updateMemberField(${member.id}, 'name', this.value)" class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-bold text-on-surface outline-none focus:border-primary shadow-sm transition-all" placeholder="이름 입력">
            </td>
            <td class="py-5 px-6 border-r border-blue-50/30 w-[16%]">
                <select onchange="updateMemberField(${member.id}, 'team', this.value)" class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-medium text-on-surface outline-none focus:border-primary shadow-sm transition-all">
                    <option value="">팀 선택</option>
                    ${STATE.teams.map(team => `<option value="${team.name}" ${member.team === team.name ? 'selected' : ''}>${team.name}</option>`).join('')}
                </select>
            </td>
            <td class="py-5 px-6 border-r border-blue-50/30 w-[14%]">
                <input type="text" value="${member.job || ''}" oninput="updateMemberField(${member.id}, 'job', this.value)" class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-medium text-on-surface outline-none focus:border-primary shadow-sm transition-all" placeholder="직무 입력">
            </td>
            <td class="py-5 px-6 border-r border-blue-50/30 w-[14%]">
                <select onchange="updateMemberField(${member.id}, 'position', this.value)" class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-medium text-on-surface outline-none focus:border-primary shadow-sm transition-all" ${STATE.user.role !== 'admin' ? 'disabled' : ''}>
                    <option value="대표" ${member.position === '대표' ? 'selected' : ''}>대표</option>
                    <option value="CCO" ${member.position === 'CCO' ? 'selected' : ''}>CCO</option>
                    <option value="본부장" ${member.position === '본부장' ? 'selected' : ''}>본부장</option>
                    <option value="팀장" ${member.position === '팀장' ? 'selected' : ''}>팀장</option>
                    <option value="멤버" ${member.position === '멤버' ? 'selected' : ''}>멤버</option>
                </select>
            </td>
            <td class="py-5 px-6 border-r border-blue-50/30 w-[14%]">
                <input type="text" value="${member.user_id || ''}" oninput="updateMemberField(${member.id}, 'user_id', this.value)" class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-medium text-on-surface outline-none focus:border-primary shadow-sm transition-all" placeholder="아이디 입력" ${STATE.user.role !== 'admin' ? 'readonly' : ''}>
            </td>
            <td class="py-5 px-6 border-r border-blue-50/30 w-[14%]">
                <input type="password" value="${member.password || ''}" oninput="updateMemberField(${member.id}, 'password', this.value)" class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-medium text-on-surface outline-none focus:border-primary shadow-sm transition-all" placeholder="비밀번호 입력" ${STATE.user.role !== 'admin' ? 'readonly' : ''}>
            </td>
            <td class="py-5 px-6 text-center w-40">
                <div class="flex items-center justify-center gap-2">
                    <button onclick="toggleMemberHidden(${member.id})" class="px-3 py-2 bg-white border ${member.is_hidden ? 'border-primary text-primary' : 'border-blue-100 text-on-surface-variant'} font-bold text-[12px] rounded-lg hover:bg-blue-50 transition-colors shadow-sm" title="${member.is_hidden ? '숨김 해제' : '숨김'}">
                        ${member.is_hidden ? '숨김 해제' : '숨김'}
                    </button>
                    <button onclick="removeMember(${member.id})" class="px-3 py-2 bg-white border border-error text-error font-bold text-[12px] rounded-lg hover:bg-error/10 transition-colors shadow-sm">삭제</button>
                </div>
            </td>
        </tr>
    `).join('');

    container.innerHTML = `
        <div class="mb-4 w-full flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
            <div class="flex items-center gap-3">
                <div class="text-[14px] font-bold text-on-surface-variant">
                    총 <span class="text-primary font-black mx-1">${visibleMembers.length}</span>명${showHidden ? ' (숨김 구성원)' : ''}
                </div>
                <select onchange="setMembersDivisionFilter(this.value)" class="bg-white border border-blue-100 text-on-surface font-bold rounded-lg text-[13px] px-3 py-2 outline-none focus:border-primary shadow-sm transition-all">
                    <option value="all" ${STATE.membersDivisionFilter === 'all' ? 'selected' : ''}>전체 본부</option>
                    ${STATE.divisions.map(d => `<option value="${d.name}" ${STATE.membersDivisionFilter === d.name ? 'selected' : ''}>${d.name}</option>`).join('')}
                </select>
                <select onchange="setMembersTeamFilter(this.value)" class="bg-white border border-blue-100 text-on-surface font-bold rounded-lg text-[13px] px-3 py-2 outline-none focus:border-primary shadow-sm transition-all">
                    <option value="all" ${STATE.membersTeamFilter === 'all' ? 'selected' : ''}>전체 팀</option>
                    ${filteredTeamsForMembers.map(team => `<option value="${team.name}" ${STATE.membersTeamFilter === team.name ? 'selected' : ''}>${team.name}</option>`).join('')}
                </select>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
                <button onclick="openTeamManagement()" class="flex items-center gap-2 px-4 py-2 bg-white border border-blue-100 text-primary font-bold text-[13px] rounded-lg hover:bg-blue-50 transition-all shadow-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    팀 관리
                </button>
                <button onclick="toggleMembersShowHidden()" class="flex items-center gap-2 px-4 py-2 border font-bold text-[13px] rounded-lg transition-all shadow-sm ${showHidden ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-blue-100 text-on-surface-variant hover:bg-blue-50'}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${showHidden ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' : 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'}"></path></svg>
                    숨긴 구성원 보기${hiddenCount > 0 ? ` (${hiddenCount})` : ''}
                </button>
                ${canApprove && pendingMembers.length > 0 ? `<button onclick="STATE.membersView='pending'; renderCurrentView();" class="flex items-center gap-2 px-4 py-2 bg-warning/10 border border-warning text-warning font-bold text-[13px] rounded-lg hover:bg-warning/20 transition-all shadow-sm">가입 대기자 <span class="bg-error text-white text-[11px] font-black w-5 h-5 flex items-center justify-center rounded-full ml-1 shadow-sm">${pendingMembers.length}</span></button>` : ""}
                <button onclick="addMember()" class="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold text-[13px] rounded-lg hover:bg-primary-dim transition-all shadow-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    구성원 추가
                </button>
                <button onclick="saveAllMembers()" class="flex items-center gap-2 px-4 py-2 bg-success text-white font-bold text-[13px] rounded-lg hover:bg-success/90 transition-all shadow-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    저장
                </button>
            </div>
        </div>
        <div class="bg-white rounded-2xl border border-blue-50 shadow-sm w-full overflow-x-auto">
            <table class="w-full text-left table-auto min-w-[900px]">
                <thead class="bg-surface-container">
                    <tr class="text-[14px] text-on-surface-variant font-extrabold border-b border-blue-50">
                        <th class="py-4 px-4 text-center border-r border-blue-50/30">No.</th>
                        <th class="py-4 px-6 border-r border-blue-50/30">구성원</th>
                        <th class="py-4 px-6 border-r border-blue-50/30">팀명</th>
                        <th class="py-4 px-6 border-r border-blue-50/30">직무</th>
                        <th class="py-4 px-6 border-r border-blue-50/30">직책</th>
                        <th class="py-4 px-6 border-r border-blue-50/30">아이디</th>
                        <th class="py-4 px-6 border-r border-blue-50/30">비밀번호</th>
                        <th class="py-4 px-6 text-center">관리</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </div>
    `;
}

// --- Mobile Menu ---
window.toggleMobileMenu = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    
    if(sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
    }
};

// 모바일에서 메뉴 클릭 시 사이드바 닫기
function closeMobileMenuOnNavigate() {
    if(window.innerWidth < 1024) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobile-overlay');
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
    }
}


// Wrapper functions to detect mobile and render accordingly
const originalRenderGoalsSet = renderGoalsSet;
const originalRenderGoalsManage = renderGoalsManage;
const originalRenderRequests = renderRequests;
const originalRenderMembers = renderMembers;

renderGoalsSet = function(container) {
    const drafts = STATE.allGoals.filter(g => g.userId === STATE.user.id && g.periodType === STATE.goalsSetTab && g.periodValue === STATE.goalsSetPeriodValue);
    if(drafts.length === 0) {
        for(let i=0; i<3; i++) addOKR(i); 
        return;
    }
    
    const isMobile = window.innerWidth < 1024;
    
    let h = `
        <div class="flex items-center gap-4 lg:gap-8 border-b-2 border-blue-50 mb-6 px-2 w-full overflow-x-auto">
            <button onclick="setTab('goals_set', 'quarterly')" class="pb-3 text-sm lg:text-lg transition-all whitespace-nowrap ${STATE.goalsSetTab === 'quarterly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">분기별</button>
            <button onclick="setTab('goals_set', 'yearly')" class="pb-3 text-sm lg:text-lg transition-all whitespace-nowrap ${STATE.goalsSetTab === 'yearly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">연간</button>
        </div>
        <div class="mb-4 w-full">
            <div class="flex flex-col lg:flex-row justify-between items-stretch lg:items-start gap-3">
                <select onchange="setPeriod('goals_set', this.value)" class="w-full lg:w-auto bg-surface-container text-primary font-bold border border-blue-50 rounded-lg text-[13px] px-3 py-1.5 outline-none">
                    ${generatePeriodOptions(STATE.goalsSetTab, STATE.goalsSetPeriodValue)}
                </select>
                <button onclick="addOKR()" class="flex items-center justify-center gap-2 px-4 py-2 bg-primary lg:bg-white border border-primary lg:border-blue-100 text-white lg:text-primary font-bold text-[13px] rounded-lg hover:bg-primary-dim lg:hover:bg-blue-50 transition-all shadow-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    새 OKR 추가
                </button>
            </div>
        </div>
    `;
    
    if(isMobile) {
        h += renderGoalsSetMobile(drafts);
    } else {
        originalRenderGoalsSet(container);
        return;
    }
    
    container.innerHTML = h;
};

renderGoalsManage = function(container) {
    const items = STATE.allGoals.filter(g => g.userId === STATE.user.id && g.periodType === STATE.goalsManageTab && g.periodValue === STATE.goalsManagePeriodValue);
    const isMobile = window.innerWidth < 1024;
    
    let h = `
        <div class="flex items-center gap-4 lg:gap-8 border-b-2 border-blue-50 mb-6 px-2 w-full overflow-x-auto">
            <button onclick="setTab('goals_manage', 'quarterly')" class="pb-3 text-sm lg:text-lg transition-all whitespace-nowrap ${STATE.goalsManageTab === 'quarterly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">분기별</button>
            <button onclick="setTab('goals_manage', 'yearly')" class="pb-3 text-sm lg:text-lg transition-all whitespace-nowrap ${STATE.goalsManageTab === 'yearly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">연간</button>
        </div>
        <div class="mb-4 w-full flex items-center justify-between">
            <select onchange="setPeriod('goals_manage', this.value)" class="w-auto bg-surface-container text-primary font-bold border border-blue-50 rounded-lg text-[13px] px-3 py-1.5 outline-none">
                ${generatePeriodOptions(STATE.goalsManageTab, STATE.goalsManagePeriodValue, true)}
            </select>
            <button onclick="addOKR()" class="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold text-[13px] rounded-lg hover:bg-primary-dim transition-all shadow-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                새 OKR 추가
            </button>
        </div>
    `;
    
    if(isMobile) {
        h += renderGoalsManageMobile(items);
    } else {
        originalRenderGoalsManage(container);
        return;
    }
    
    container.innerHTML = h;
};

renderRequests = function(container) {
    const okrList = STATE.allGoals.filter(g => (g.requestType !== null || g.isProcessed === true || g.status === '거부') && g.periodType === STATE.requestsTab && g.periodValue === STATE.requestsPeriodValue);
    const rnrList = STATE.rnrData.filter(r => r.request_type !== null || r.status === '합의 완료' || r.status === '거부');
    
    // Combine OKR and R&R requests
    let combinedList = [
        ...okrList.map(g => ({ type: 'okr', data: g })),
        ...rnrList.map(r => ({ type: 'rnr', data: r }))
    ];
    
    // Apply status filter
    const filter = STATE.requestsFilter || 'pending';
    combinedList = combinedList.filter(item => {
        if (item.type === 'okr') {
            const g = item.data;
            if (filter === 'pending') return !g.isProcessed && g.status !== '거부';
            if (filter === 'approved') return g.isProcessed && g.status !== '거부';
            if (filter === 'rejected') return g.status === '거부';
        } else {
            const r = item.data;
            if (filter === 'pending') return r.status !== '합의 완료' && r.status !== '거부';
            if (filter === 'approved') return r.status === '합의 완료';
            if (filter === 'rejected') return r.status === '거부';
        }
        return true;
    });
    
    // Sort by processed status
    combinedList.sort((a, b) => {
        const aProcessed = a.type === 'okr' ? a.data.isProcessed : (a.data.status === '합의 완료');
        const bProcessed = b.type === 'okr' ? b.data.isProcessed : (b.data.status === '합의 완료');
        return (aProcessed === bProcessed) ? 0 : aProcessed ? 1 : -1;
    });

    // Apply division/team filter
    if (STATE.requestsDivisionFilter !== 'all' || STATE.requestsTeamFilter !== 'all') {
        combinedList = combinedList.filter(item => {
            const userId = item.type === 'okr' ? item.data.userId : item.data.user_id;
            const member = STATE.members.find(m => m.user_id === userId);
            if (!member) return true;
            if (STATE.requestsDivisionFilter !== 'all' && member.division !== STATE.requestsDivisionFilter) return false;
            if (STATE.requestsTeamFilter !== 'all' && member.team !== STATE.requestsTeamFilter) return false;
            return true;
        });
    }
    
    const isMobile = window.innerWidth < 1024;
    
    let h = `
        <div class="flex items-center justify-between border-b-2 border-blue-50 mb-6 px-2 w-full overflow-x-auto">
            <div class="flex items-center gap-4 lg:gap-8">
                <button onclick="setTab('requests', 'quarterly')" class="pb-3 text-sm lg:text-lg transition-all whitespace-nowrap ${STATE.requestsTab === 'quarterly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">분기별</button>
                <button onclick="setTab('requests', 'yearly')" class="pb-3 text-sm lg:text-lg transition-all whitespace-nowrap ${STATE.requestsTab === 'yearly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">연간</button>
            </div>
            <select onchange="setRequestsFilter(this.value)" class="bg-surface-container text-on-surface font-bold border border-blue-50 rounded-lg text-[13px] px-3 py-1.5 outline-none mb-1">
                <option value="pending" ${STATE.requestsFilter === 'pending' ? 'selected' : ''}>요청된 항목</option>
                <option value="approved" ${STATE.requestsFilter === 'approved' ? 'selected' : ''}>승인된 항목</option>
                <option value="rejected" ${STATE.requestsFilter === 'rejected' ? 'selected' : ''}>거부된 항목</option>
            </select>
        </div>
        <div class="mb-4 w-full">
            <select onchange="setPeriod('requests', this.value)" class="w-full lg:w-auto bg-surface-container text-primary font-bold border border-blue-50 rounded-lg text-[13px] px-3 py-1.5 outline-none">
                ${generatePeriodOptions(STATE.requestsTab, STATE.requestsPeriodValue)}
            </select>
        </div>
        <div class="mb-4 w-full flex items-center gap-3 flex-wrap">
            <select onchange="STATE.requestsDivisionFilter=this.value;STATE.requestsTeamFilter='all';renderCurrentView();" class="bg-surface-container text-on-surface font-bold border border-blue-50 rounded-lg text-[13px] px-3 py-1.5 outline-none">
                <option value="all" ${STATE.requestsDivisionFilter==='all'?'selected':''}>전체 본부</option>
                ${STATE.divisions.map(d=>'<option value="'+d.name+'" '+(STATE.requestsDivisionFilter===d.name?'selected':'')+'>'+d.name+'</option>').join('')}
            </select>
            <select onchange="STATE.requestsTeamFilter=this.value;renderCurrentView();" class="bg-surface-container text-on-surface font-bold border border-blue-50 rounded-lg text-[13px] px-3 py-1.5 outline-none">
                <option value="all" ${STATE.requestsTeamFilter==='all'?'selected':''}>전체 팀</option>
                ${(STATE.requestsDivisionFilter==='all'?STATE.teams:STATE.teams.filter(t=>t.division===STATE.requestsDivisionFilter)).map(t=>'<option value="'+t.name+'" '+(STATE.requestsTeamFilter===t.name?'selected':'')+'>'+t.name+'</option>').join('')}
            </select>
        </div>
    `;
    
    if(isMobile) {
        h += renderRequestsMobile(combinedList);
    } else {
        originalRenderRequests(container);
        return;
    }
    
    container.innerHTML = h;
};

renderMembers = function(container) {
    const isMobile = window.innerWidth < 1024;
    
    let h = `
        <div class="mb-4 w-full flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
            <div class="text-[14px] font-bold text-on-surface-variant">
                총 <span class="text-primary font-black mx-1">${STATE.members.length}</span>명의 구성원
            </div>
            <div class="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-3">
                <button onclick="openTeamManagement()" class="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-blue-100 text-primary font-bold text-[13px] rounded-lg hover:bg-blue-50 transition-all shadow-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    팀 관리
                </button>
                <button onclick="addMember()" class="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white font-bold text-[13px] rounded-lg hover:bg-primary-dim transition-all shadow-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    구성원 추가
                </button>
            </div>
        </div>
    `;
    
    if(isMobile) {
        h += renderMembersMobile(STATE.members, STATE.teams);
    } else {
        originalRenderMembers(container);
        return;
    }
    
    container.innerHTML = h;
};


// --- Feedback View ---

// 일반 구성원용 - 나에게 온 피드백 확인 (읽기 전용, Grade 비공개)
function renderMyReceivedFeedback(container) {
    const quarterlyOptions = [
        { value: '2026-Q2', label: '2026년 2분기' },
        { value: '2026-Q3', label: '2026년 3분기' },
        { value: '2026-Q4', label: '2026년 4분기' }
    ];
    const yearlyOptions = [
        { value: '2026', label: '2026년' },
        { value: '2027', label: '2027년' }
    ];
    const allPeriods = [...quarterlyOptions, ...yearlyOptions];

    // 현재 분기를 기본값으로 (이 화면 첫 진입 시)
    if (!STATE._myFeedbackPeriodInit) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
        let defaultPeriod = `${currentYear}-Q${currentQuarter}`;
        if (!allPeriods.find(p => p.value === defaultPeriod)) {
            defaultPeriod = quarterlyOptions[0].value;
        }
        STATE.feedbackPeriod = defaultPeriod;
        STATE._myFeedbackPeriodInit = true;
    }
    if (!STATE.feedbackPeriod || !allPeriods.find(p => p.value === STATE.feedbackPeriod)) {
        STATE.feedbackPeriod = quarterlyOptions[0].value;
    }
    const selectedPeriod = STATE.feedbackPeriod;

    // 나에게 온 피드백 데이터
    const myFeedbacks = (STATE.assessmentData || []).filter(a => a.target_id === STATE.user.id && a.period_value === selectedPeriod);

    // B Level / C Level 피드백 존재 여부 확인
    const bLevelFeedbacks = myFeedbacks.filter(f => {
        const reviewer = STATE.members.find(m => m.user_id === f.reviewer_id);
        return reviewer && reviewer.position === '팀장';
    });
    const cLevelFeedbacks = myFeedbacks.filter(f => {
        const reviewer = STATE.members.find(m => m.user_id === f.reviewer_id);
        return reviewer && (reviewer.position === '본부장' || reviewer.position === '대표');
    });
    const hasBLevel = bLevelFeedbacks.length > 0;
    const hasCLevel = cLevelFeedbacks.length > 0;

    // 피드백 열람 가능 여부: feedback_visible AND 현재 시각이 시작일~종료일 사이
    const periodSetting = (STATE.periodSettings || []).find(p => p.period_value === selectedPeriod);
    let isFeedbackVisible = false;
    if (periodSetting && periodSetting.feedback_visible) {
        const now = new Date();
        const openDate = periodSetting.feedback_open_date ? new Date(periodSetting.feedback_open_date) : null;
        const closeDate = periodSetting.feedback_cloase_date ? new Date(periodSetting.feedback_cloase_date) : null;
        const afterOpen = !openDate || now >= openDate;
        const beforeClose = !closeDate || now <= closeDate;
        isFeedbackVisible = afterOpen && beforeClose;
    }
    const feedbackUnlocked = isFeedbackVisible || STATE._feedbackPreviewUnlocked;

    // OKR 목록 (해당 기간)
    const isQuarterly = selectedPeriod.includes('Q');
    const myGoals = STATE.allGoals.filter(g =>
        g.userId === STATE.user.id &&
        g.status === '합의 완료' &&
        g.periodType === (isQuarterly ? 'quarterly' : 'yearly') &&
        g.periodValue === selectedPeriod
    );

    let h = '<div class="max-w-3xl mx-auto">';

    // 기간 선택
    h += '<div class="flex items-center justify-between mb-6 flex-wrap">';
    h += '<div class="flex items-center gap-3">';
    h += '<select onchange="STATE.feedbackPeriod = this.value; renderCurrentView();" class="bg-white border border-blue-100 text-on-surface font-bold rounded-lg text-[14px] px-4 py-2.5 outline-none focus:border-primary shadow-sm">';
    allPeriods.forEach(p => {
        h += `<option value="${p.value}" ${selectedPeriod === p.value ? 'selected' : ''}>${p.label}</option>`;
    });
    h += '</select>';
    if (feedbackUnlocked && myFeedbacks.length > 0) {
        h += `<span class="text-[13px] font-bold text-success bg-success/10 px-3 py-1.5 rounded-full">${myFeedbacks.length}건의 피드백</span>`;
    }
    h += '</div>';
    if (!feedbackUnlocked) {
        h += '<button onclick="promptFeedbackPreviewPassword()" class="px-4 py-2 bg-gray-700 text-white font-bold text-[12px] rounded-lg hover:bg-gray-800 transition-all">미리보기</button>';
    }
    h += '</div>';

    if (myGoals.length === 0) {
        h += '<div class="bg-white/50 border border-dashed border-blue-200 h-40 rounded-xl flex items-center justify-center text-on-surface-variant font-bold text-[13px]">해당 기간에 합의 완료된 OKR이 없습니다.</div>';
    } else if (myFeedbacks.length === 0) {
        h += '<div class="bg-white/50 border border-dashed border-blue-200 h-40 rounded-xl flex items-center justify-center text-on-surface-variant font-bold text-[13px]">아직 받은 피드백이 없습니다.</div>';
    } else if (!feedbackUnlocked) {
        // 조회 가능 기간 표시
        const openDateStr = periodSetting && periodSetting.feedback_open_date ? new Date(periodSetting.feedback_open_date).toLocaleString('ko-KR', {timeZone:'Asia/Seoul', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false}) : '미설정';
        const closeDateStr = periodSetting && periodSetting.feedback_cloase_date ? new Date(periodSetting.feedback_cloase_date).toLocaleString('ko-KR', {timeZone:'Asia/Seoul', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false}) : '미설정';
        const now = new Date();
        const isInPeriod = periodSetting && periodSetting.feedback_visible && 
            (!periodSetting.feedback_open_date || now >= new Date(periodSetting.feedback_open_date)) &&
            (!periodSetting.feedback_cloase_date || now <= new Date(periodSetting.feedback_cloase_date));

        // 기간 만료 여부 판단
        const isPeriodExpired = periodSetting && periodSetting.feedback_visible && periodSetting.feedback_cloase_date && now > new Date(periodSetting.feedback_cloase_date);
        const isNotYetOpen = periodSetting && periodSetting.feedback_visible && periodSetting.feedback_open_date && now < new Date(periodSetting.feedback_open_date);
        const isVisibleOff = !periodSetting || !periodSetting.feedback_visible;

        let lockIcon = '🔒';
        let lockMessage = '피드백이 아직 공개되지 않았습니다';
        if (isPeriodExpired) {
            lockIcon = '⏰';
            lockMessage = '조회가 마감된 기간입니다';
        } else if (isVisibleOff) {
            lockIcon = '🔒';
            lockMessage = '피드백 열람이 비공개 상태입니다';
        }

        h += `<div class="bg-white rounded-2xl border border-blue-50 shadow-sm p-8 text-center">
            <div class="text-[40px] mb-4">${lockIcon}</div>
            <p class="text-[15px] font-bold text-on-surface mb-5">${lockMessage}</p>
            <div class="inline-flex flex-col items-start gap-3 mb-5">
                <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full ${hasBLevel ? 'bg-green-500' : 'bg-gray-300'}"></span>
                    <span class="text-[13px] ${hasBLevel ? 'text-green-600 font-bold' : 'text-on-surface-variant'}">B Level (팀장) ${hasBLevel ? '완료' : '대기중'}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full ${hasCLevel ? 'bg-green-500' : 'bg-gray-300'}"></span>
                    <span class="text-[13px] ${hasCLevel ? 'text-green-600 font-bold' : 'text-on-surface-variant'}">C Level (본부장) ${hasCLevel ? '완료' : '대기중'}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full ${isInPeriod ? 'bg-green-500' : isPeriodExpired ? 'bg-red-400' : 'bg-gray-300'}"></span>
                    <span class="text-[13px] ${isInPeriod ? 'text-green-600 font-bold' : isPeriodExpired ? 'text-red-500 font-bold' : 'text-on-surface-variant'}">조회 가능 기간 (${openDateStr} ~ ${closeDateStr})${isPeriodExpired ? ' — 마감됨' : ''}</span>
                </div>
            </div>
        </div>`;
    } else {
        // OKR별로 피드백 그룹핑
        myGoals.forEach((g, i) => {
            const goalFeedbacks = myFeedbacks.filter(f => String(f.goal_id) == String(g.id));
            if (goalFeedbacks.length === 0) return;

            const okrAvg = g.keyResults.length > 0
                ? Math.round(g.keyResults.reduce((s, kr) => s + kr.progress, 0) / g.keyResults.length)
                : 0;

            h += `<div class="bg-white rounded-2xl border border-blue-50 shadow-sm p-6 mb-4">`;
            // OKR 헤더
            h += '<div class="flex items-start gap-3 mb-4">';
            h += `<span class="text-[11px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded flex-shrink-0 mt-1">O${i+1}</span>`;
            h += `<div class="flex-1">`;
            h += `<h4 class="text-[15px] font-bold text-on-surface leading-relaxed">${g.text}</h4>`;
            h += `<span class="text-[12px] text-on-surface-variant mt-1 inline-block">진척률 ${okrAvg}%</span>`;
            h += '</div>';
            h += '</div>';

            // Key Results 리스트
            if (g.keyResults.length > 0) {
                h += '<div class="mb-4 pl-1">';
                g.keyResults.forEach((kr, ki) => {
                    const krColor = kr.progress === 100 ? 'bg-green-500' : kr.progress >= 50 ? 'bg-primary' : 'bg-gray-300';
                    h += `<div class="flex items-center gap-3 bg-surface-container rounded-lg px-4 py-2.5 mb-2">`;
                    h += `<span class="text-[10px] font-black text-on-surface-variant bg-white rounded px-1.5 py-0.5 border border-blue-100 flex-shrink-0">KR${ki+1}</span>`;
                    h += `<p class="text-[12px] text-on-surface flex-1 leading-relaxed">${kr.text}</p>`;
                    h += `<div class="flex items-center gap-2 flex-shrink-0">`;
                    h += `<div class="w-16 h-1.5 bg-blue-100 rounded-full overflow-hidden"><div class="h-full ${krColor} rounded-full" style="width:${kr.progress}%"></div></div>`;
                    h += `<span class="text-[11px] font-black text-primary w-8 text-right">${kr.progress}%</span>`;
                    h += `</div></div>`;
                });
                h += '</div>';
            }

            // 피드백 목록
            goalFeedbacks.forEach(fb => {
                const reviewer = STATE.members.find(m => m.user_id === fb.reviewer_id);
                const reviewerName = reviewer ? reviewer.name : '관리자';
                const reviewerPosition = reviewer ? reviewer.position : '';
                const levelLabel = (reviewerPosition === '팀장') ? 'B Level' : 'C Level';
                const levelColor = (reviewerPosition === '팀장') ? 'text-green-600 bg-green-50' : 'text-purple-600 bg-purple-50';

                h += `<div class="bg-surface-container rounded-xl p-4 mb-3 last:mb-0">`;
                h += '<div class="flex items-center gap-2 mb-2">';
                h += `<span class="text-[11px] font-bold ${levelColor} px-2 py-0.5 rounded">${levelLabel}</span>`;
                h += `<span class="text-[12px] font-bold text-on-surface">${reviewerName}</span>`;
                h += `<span class="text-[11px] text-on-surface-variant">${reviewerPosition}</span>`;
                if (fb.created_at) {
                    const d = new Date(fb.created_at);
                    h += `<span class="text-[11px] text-on-surface-variant/60 ml-auto">${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}</span>`;
                }
                h += '</div>';
                h += `<p class="text-[13px] text-on-surface leading-relaxed whitespace-pre-wrap">${fb.feedback || '(피드백 내용 없음)'}</p>`;
                h += '</div>';
            });

            h += '</div>';
        });
    }

    h += '</div>';
    container.innerHTML = h;
}

function renderFeedback(container) {
    // 비밀번호 미리보기 함수
    window.promptFeedbackPreviewPassword = function() {
        const pw = prompt('미리보기 비밀번호를 입력하세요:');
        if (pw === 'dxpreview') {
            STATE._feedbackPreviewUnlocked = true;
            renderCurrentView();
        } else if (pw !== null) {
            alert('비밀번호가 틀렸습니다.');
        }
    };

    // 일반 구성원(user)은 "나에게 온 피드백" 뷰만 표시
    if (STATE.user.role !== 'admin') {
        renderMyReceivedFeedback(container);
        return;
    }

    // 피드백 대시보드
    if (STATE.feedbackView === 'dashboard') {
        renderFeedbackDashboard(container);
        return;
    }

    // 관리자도 나에게 온 피드백 확인
    if (STATE.feedbackView === 'myreceived') {
        renderMyReceivedFeedback(container);
        return;
    }

    // 진입 화면: 분기별 / 연간 선택
    if (!STATE.feedbackPeriodType) {
        container.innerHTML = `
            <div class="max-w-3xl mx-auto mt-8">
                <p class="text-[14px] text-on-surface-variant font-bold mb-8 text-center">피드백을 진행할 기간 유형을 선택하세요.</p>
                <div class="grid grid-cols-2 gap-6">
                    <button onclick="window.setFeedbackPeriodType('quarterly')"
                        class="group flex flex-col items-center justify-center gap-4 p-10 bg-white border-2 border-blue-100 rounded-2xl shadow-sm hover:border-primary hover:shadow-md transition-all">
                        <div class="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-all">
                            <svg class="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        </div>
                        <div class="text-center">
                            <div class="text-[18px] font-black text-on-surface mb-1">분기별 피드백</div>
                            <div class="text-[13px] text-on-surface-variant">2026년 2분기 · 3분기 · 4분기</div>
                        </div>
                    </button>
                    <button onclick="window.setFeedbackPeriodType('yearly')"
                        class="group flex flex-col items-center justify-center gap-4 p-10 bg-white border-2 border-blue-100 rounded-2xl shadow-sm hover:border-primary hover:shadow-md transition-all">
                        <div class="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center group-hover:bg-purple-500/20 transition-all">
                            <svg class="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                        </div>
                        <div class="text-center">
                            <div class="text-[18px] font-black text-on-surface mb-1">연간 피드백</div>
                            <div class="text-[13px] text-on-surface-variant">2026년 · 2027년</div>
                        </div>
                    </button>
                </div>
            </div>
        `;
        return;
    }

    // 분기별 / 연간 피드백 작성 화면
    const isQuarterly = STATE.feedbackPeriodType === 'quarterly';
    const quarterlyOptions = [
        { value: '2026-Q2', label: '2026년 2분기' },
        { value: '2026-Q3', label: '2026년 3분기' },
        { value: '2026-Q4', label: '2026년 4분기' }
    ];
    const yearlyOptions = [
        { value: '2026', label: '2026년' },
        { value: '2027', label: '2027년' }
    ];
    const periodOptions = isQuarterly ? quarterlyOptions : yearlyOptions;

    // 기간 초기값 설정
    if (!STATE.feedbackPeriod || !periodOptions.find(p => p.value === STATE.feedbackPeriod)) {
        STATE.feedbackPeriod = periodOptions[0].value;
    }

    const selectedPeriod = STATE.feedbackPeriod;
    const selectedMemberId = STATE.feedbackSelectedMember || '';
    const selectedMember = STATE.members.find(m => m.user_id === selectedMemberId);

    // 팀 접근 권한
    const myMemberInfo = STATE.members.find(m => m.user_id === STATE.user.id);
    const myPosition = myMemberInfo?.position || STATE.user.position || '';
    const myDivision = myMemberInfo?.division || STATE.user.division || '';
    const myTeam = myMemberInfo?.team || STATE.user.team || '';
    const isCEO = myPosition === '대표' || myPosition === 'CCO';
    const isDivisionHead = myPosition === '본부장';
    const isTeamLeader = myPosition === '팀장';
    const selectedTeam = STATE.feedbackTeamFilter || 'all';
    const selectedDivision = STATE.feedbackDivisionFilter || myDivision;

    // 본부 고정 로직: 대표는 전체 선택 가능, 본부장/팀장은 소속 본부 고정
    const effectiveDivision = isCEO ? selectedDivision : myDivision;
    const effectiveTeam = selectedTeam;

    // 본부/팀 드롭다운
    let divisionOptionsHtml = '';
    let teamOptionsHtml = '';
    if (isCEO) {
        // 대표: 전체 본부 선택 가능
        divisionOptionsHtml = `<option value="all" ${selectedDivision === 'all' ? 'selected' : ''}>전체 본부</option>` +
            STATE.divisions.map(d => `<option value="${d.name}" ${selectedDivision === d.name ? 'selected' : ''}>${d.name}</option>`).join('');
        const filteredTeamsForFeedback = selectedDivision === 'all' ? STATE.teams : STATE.teams.filter(t => t.division === selectedDivision);
        teamOptionsHtml = `<option value="all" ${effectiveTeam === 'all' ? 'selected' : ''}>전체 팀</option>` +
            filteredTeamsForFeedback.map(t => `<option value="${t.name}" ${effectiveTeam === t.name ? 'selected' : ''}>${t.name}</option>`).join('');
    } else {
        // 본부장/팀장: 소속 본부 고정, 본부 내 팀 선택 가능
        divisionOptionsHtml = `<option value="${myDivision}" selected>${myDivision}</option>`;
        const myDivisionTeams = STATE.teams.filter(t => t.division === myDivision);
        teamOptionsHtml = `<option value="all" ${effectiveTeam === 'all' ? 'selected' : ''}>전체 팀</option>` +
            myDivisionTeams.map(t => `<option value="${t.name}" ${effectiveTeam === t.name ? 'selected' : ''}>${t.name}</option>`).join('');
    }

    // 구성원 표시 (본부+팀 필터 적용)
    let filteredMembers = STATE.members.filter(m => !m.is_hidden && m.user_id !== STATE.user.id);
    if (effectiveDivision !== 'all') {
        filteredMembers = filteredMembers.filter(m => m.division === effectiveDivision);
    }
    if (effectiveTeam !== 'all') {
        filteredMembers = filteredMembers.filter(m => m.team === effectiveTeam);
    }
    const memberOptions = [...filteredMembers].sort((a, b) => a.name.localeCompare(b.name, 'ko')).map(m =>
        `<option value="${m.user_id}" ${selectedMemberId === m.user_id ? 'selected' : ''}>${m.name} (${m.position})</option>`
    ).join('');

    // OKR 목록
    let memberGoals = [];
    if (selectedMemberId) {
        memberGoals = STATE.allGoals.filter(g =>
            g.userId === selectedMemberId &&
            g.status === '합의 완료' &&
            g.periodType === (isQuarterly ? 'quarterly' : 'yearly') &&
            g.periodValue === selectedPeriod
        );
    }

    // 기존 피드백
    const existingFeedback = (STATE.assessmentData || []).filter(a =>
        a.reviewer_id === STATE.user.id && a.target_id === selectedMemberId && a.period_value === selectedPeriod
    );
    const hasUnreviewedGoals = memberGoals.some(g => !existingFeedback.find(a => a.goal_id == g.id));

    // 총 진척률
    const totalAvgProgress = memberGoals.length > 0
        ? Math.round(memberGoals.reduce((sum, g) => {
            const avg = g.keyResults.length > 0
                ? Math.round(g.keyResults.reduce((s, kr) => s + kr.progress, 0) / g.keyResults.length)
                : 0;
            return sum + avg;
          }, 0) / memberGoals.length)
        : 0;

    // OKR + KR 렌더링
    let goalsHtml = '';
    if (selectedMemberId && memberGoals.length > 0) {
        const totalProgressColor = totalAvgProgress === 100 ? '#22c55e' : totalAvgProgress >= 50 ? 'var(--color-primary,#3b82f6)' : '#9ca3af';
        const totalDash = totalAvgProgress * 1.76;

        goalsHtml += `
            <div class="bg-white rounded-2xl border border-blue-50 shadow-sm p-5 mb-6 flex items-center gap-6">
                <div class="flex-1">
                    <div class="text-[12px] font-bold text-on-surface-variant mb-1">총 진척률</div>
                    <div class="w-full bg-surface-container-low h-3 rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all" style="width:${totalAvgProgress}%; background:${totalProgressColor}"></div>
                    </div>
                </div>
                <div class="relative w-14 h-14 flex-shrink-0">
                    <svg class="w-14 h-14 transform -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="28" stroke="#eff4ff" stroke-width="6" fill="none"/>
                        <circle cx="32" cy="32" r="28" stroke="${totalProgressColor}" stroke-width="6" fill="none" stroke-dasharray="${totalDash} 176" stroke-linecap="round"/>
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center text-[13px] font-black text-on-surface">${totalAvgProgress}%</div>
                </div>
            </div>
        `;

        goalsHtml += memberGoals.map((g, i) => {
            const okrAvg = g.keyResults.length > 0
                ? Math.round(g.keyResults.reduce((s, kr) => s + kr.progress, 0) / g.keyResults.length)
                : 0;
            const existingForGoal = existingFeedback.find(a => a.goal_id == g.id);
            const isGoalReviewed = !!existingForGoal;
            const okrColor = okrAvg === 100 ? 'bg-success' : okrAvg >= 50 ? 'bg-primary' : 'bg-gray-400';
            const okrColorHex = okrAvg === 100 ? '#22c55e' : okrAvg >= 50 ? 'var(--color-primary,#3b82f6)' : '#9ca3af';

            return `
                <div class="bg-white rounded-2xl border ${isGoalReviewed ? 'border-success/30' : 'border-blue-50'} shadow-sm p-6 mb-4">
                    <!-- OKR 헤더 -->
                    <div class="flex items-start gap-4 mb-5">
                        <div class="flex-shrink-0 mt-1">
                            <div class="relative w-12 h-12">
                                <svg class="w-12 h-12 transform -rotate-90" viewBox="0 0 64 64">
                                    <circle cx="32" cy="32" r="28" stroke="#eff4ff" stroke-width="6" fill="none"/>
                                    <circle cx="32" cy="32" r="28" stroke="${okrColorHex}" stroke-width="6" fill="none" stroke-dasharray="${okrAvg*1.76} 176" stroke-linecap="round"/>
                                </svg>
                                <div class="absolute inset-0 flex items-center justify-center text-[11px] font-black text-on-surface">${okrAvg}%</div>
                            </div>
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1.5">
                                <span class="text-[11px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded flex-shrink-0">O${i+1}</span>
                                <h4 class="text-[15px] font-bold text-on-surface leading-relaxed">${g.text}</h4>
                            </div>
                        </div>
                    </div>

                    <!-- KR 목록 -->
                    ${g.keyResults.length > 0 ? `
                    <div class="space-y-2.5 mb-5 pl-1">
                        ${g.keyResults.map((kr, ki) => {
                            const krColor = kr.progress === 100 ? 'bg-success' : kr.progress >= 50 ? 'bg-primary' : 'bg-gray-300';
                            return `
                            <div class="flex items-center gap-3 bg-surface-container rounded-xl px-4 py-3">
                                <span class="text-[10px] font-black text-on-surface-variant bg-white rounded px-1.5 py-0.5 border border-blue-100 flex-shrink-0">KR${ki+1}</span>
                                <p class="text-[13px] text-on-surface flex-1 leading-relaxed">${kr.text}</p>
                                <div class="flex items-center gap-2 flex-shrink-0">
                                    <div class="w-24 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                                        <div class="h-full ${krColor} rounded-full transition-all" style="width:${kr.progress}%"></div>
                                    </div>
                                    <span class="text-[12px] font-black text-primary w-9 text-right">${kr.progress}%</span>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                    ` : ''}

                    <!-- 피드백 입력 -->
                    <div class="border-t border-blue-50 pt-4">
                        <label class="block text-[12px] font-bold text-on-surface-variant mb-2">${isGoalReviewed ? '작성된 피드백' : '피드백 작성'}</label>
                        <textarea id="feedback-${g.id}" rows="3" ${isGoalReviewed ? 'disabled' : ''} class="w-full bg-surface-container border border-blue-100 rounded-lg px-4 py-3 text-[13px] text-on-surface outline-none focus:border-primary resize-none leading-relaxed disabled:opacity-60" placeholder="이 OKR에 대한 피드백을 작성해 주세요...">${existingForGoal ? existingForGoal.feedback : (STATE.feedbackData && STATE.feedbackData[g.id] || '')}</textarea>
                    </div>
                </div>
            `;
        }).join('');

    } else if (selectedMemberId && memberGoals.length === 0) {
        goalsHtml = `<div class="bg-white/50 border border-dashed border-blue-200 h-40 rounded-xl flex items-center justify-center text-on-surface-variant font-bold text-[13px]">해당 기간에 합의 완료된 OKR이 없습니다.</div>`;
    } else {
        goalsHtml = `<div class="bg-white/50 border border-dashed border-blue-200 h-40 rounded-xl flex items-center justify-center text-on-surface-variant font-bold text-[13px]">구성원을 선택하면 해당 구성원의 OKR이 표시됩니다.</div>`;
    }

    container.innerHTML = `
        <div class="mb-6">
            <!-- 뒤로가기 + 타입 표시 -->
            <div class="flex items-center gap-3 mb-5">
                <button onclick="window.setFeedbackPeriodType('')" class="flex items-center gap-1.5 text-[13px] font-bold text-on-surface-variant hover:text-primary transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                    뒤로
                </button>
                <span class="text-[13px] font-bold ${isQuarterly ? 'text-primary' : 'text-purple-600'} bg-${isQuarterly ? 'primary' : 'purple-500'}/10 px-3 py-1 rounded-full">
                    ${isQuarterly ? '분기별 피드백' : '연간 피드백'}
                </span>
            </div>

            <!-- 컨트롤 바 -->
            <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                <div class="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 flex-wrap">
                    <select onchange="STATE.feedbackPeriod = this.value; STATE.feedbackSelectedMember=''; renderCurrentView();" class="w-full lg:w-auto bg-white border border-blue-100 text-on-surface font-bold rounded-lg text-[14px] px-4 py-2.5 outline-none focus:border-primary shadow-sm">
                        ${periodOptions.map(p => `<option value="${p.value}" ${selectedPeriod === p.value ? 'selected' : ''}>${p.label}</option>`).join('')}
                    </select>
                    ${!isCEO
                        ? `<select onchange="setFeedbackDivisionFilter(this.value);" class="w-full lg:w-auto bg-white border border-blue-100 text-on-surface font-bold rounded-lg text-[14px] px-4 py-2.5 outline-none focus:border-primary shadow-sm" ${!isCEO ? 'disabled' : ''}>${divisionOptionsHtml}</select>
                           <select onchange="STATE.feedbackTeamFilter = this.value; STATE.feedbackSelectedMember = ''; renderCurrentView();" class="w-full lg:w-auto bg-white border border-blue-100 text-on-surface font-bold rounded-lg text-[14px] px-4 py-2.5 outline-none focus:border-primary shadow-sm">${teamOptionsHtml}</select>`
                        : `<select onchange="setFeedbackDivisionFilter(this.value);" class="w-full lg:w-auto bg-white border border-blue-100 text-on-surface font-bold rounded-lg text-[14px] px-4 py-2.5 outline-none focus:border-primary shadow-sm">${divisionOptionsHtml}</select>
                           <select onchange="STATE.feedbackTeamFilter = this.value; STATE.feedbackSelectedMember = ''; renderCurrentView();" class="w-full lg:w-auto bg-white border border-blue-100 text-on-surface font-bold rounded-lg text-[14px] px-4 py-2.5 outline-none focus:border-primary shadow-sm">${teamOptionsHtml}</select>`
                    }
                    <select onchange="STATE.feedbackSelectedMember = this.value; renderCurrentView();" class="w-full lg:w-auto bg-white border border-blue-100 text-on-surface font-bold rounded-lg text-[14px] px-4 py-2.5 outline-none focus:border-primary shadow-sm">
                        <option value="">구성원 선택</option>
                        ${memberOptions}
                    </select>
                </div>
                ${selectedMemberId && memberGoals.length > 0 && !isCEO ? `
                    <div class="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mt-3 lg:mt-0">
                        ${hasUnreviewedGoals ? `
                            <div class="flex items-center gap-2">
                                <label class="text-[13px] font-bold text-on-surface-variant whitespace-nowrap">Grade</label>
                                <select id="feedback-score" class="bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-bold text-primary outline-none focus:border-primary shadow-sm">
                                    <option value="Excellent">Excellent</option>
                                    <option value="Very good">Very good</option>
                                    <option value="Good" selected>Good</option>
                                    <option value="Fair">Fair</option>
                                    <option value="Poor">Poor</option>
                                </select>
                            </div>
                            <button onclick="submitFeedback()" class="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white font-bold text-[13px] rounded-lg hover:bg-primary-dim transition-all shadow-sm">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                피드백 제출
                            </button>
                        ` : `
                            <span class="text-[13px] font-bold text-on-surface-variant">Grade: ${existingFeedback[0]?.score || '-'}</span>
                            <button disabled class="flex items-center justify-center gap-2 px-5 py-2.5 bg-surface-container text-on-surface-variant font-bold text-[13px] rounded-lg cursor-not-allowed shadow-sm border border-blue-100">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                피드백 완료
                            </button>
                        `}
                    </div>
                ` : ''}
            </div>
        </div>
        ${goalsHtml}
    `;
}

window.setFeedbackPeriodType = function(type) {
    STATE.feedbackPeriodType = type;
    STATE.feedbackSelectedMember = '';
    if (type === 'quarterly') STATE.feedbackPeriod = '2026-Q2';
    else if (type === 'yearly') STATE.feedbackPeriod = '2026';
    renderCurrentView();
};

function renderFeedbackDashboard(container) {
    const periodOptions = [
        { value: '2026', label: '2026년' },
        { value: '2027', label: '2027년' },
        { value: '2026-Q2', label: '2026년 2분기' },
        { value: '2026-Q3', label: '2026년 3분기' },
        { value: '2026-Q4', label: '2026년 4분기' }
    ];
    const selectedPeriod = STATE.feedbackDashPeriod || '2026-Q2';
    const assessments = STATE.assessmentData || [];

    let periodOptionsHtml = periodOptions.map(p => 
        `<option value="${p.value}" ${selectedPeriod === p.value ? 'selected' : ''}>${p.label}</option>`
    ).join('');

    const selectedDashTeam = STATE.feedbackDashTeamFilter || 'all';
    const selectedDashDivision = STATE.feedbackDashDivisionFilter || 'all';
    const filteredTeamsForDash = selectedDashDivision === 'all' ? STATE.teams : STATE.teams.filter(t => t.division === selectedDashDivision);
    let dashDivisionOptionsHtml = `<option value="all" ${selectedDashDivision === 'all' ? 'selected' : ''}>전체 본부</option>` +
        STATE.divisions.map(d => `<option value="${d.name}" ${selectedDashDivision === d.name ? 'selected' : ''}>${d.name}</option>`).join('');
    let dashTeamOptionsHtml = `<option value="all" ${selectedDashTeam === 'all' ? 'selected' : ''}>전체 팀</option>` +
        filteredTeamsForDash.map(t => `<option value="${t.name}" ${selectedDashTeam === t.name ? 'selected' : ''}>${t.name}</option>`).join('');


    // Build member rows
    const allMembers = [...STATE.members].filter(m => !m.is_hidden).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    let sortedMembers = selectedDashDivision !== "all" ? allMembers.filter(m => m.division === selectedDashDivision) : allMembers;
    if (selectedDashTeam !== "all") sortedMembers = sortedMembers.filter(m => m.team === selectedDashTeam);

    // 피드백/그레이드 공개 범위 권한 판단
    const dashMyInfo = STATE.members.find(mem => mem.user_id === STATE.user.id);
    const dashMyPosition = dashMyInfo?.position || '';
    const dashMyDivision = dashMyInfo?.division || '';
    const dashMyTeam = dashMyInfo?.team || '';
    const dashIsCEO = dashMyPosition === '대표' || dashMyPosition === 'CCO';
    const dashIsDivHead = dashMyPosition === '본부장';
    const dashIsTeamLeader = dashMyPosition === '팀장';

    function canViewFeedback(memberObj) {
        if (dashIsCEO) return true;
        if (dashIsDivHead) return memberObj.division === dashMyDivision;
        if (dashIsTeamLeader) return memberObj.team === dashMyTeam;
        return false;
    }

    let rowsHtml = sortedMembers.map((m, i) => {
        const memberAssessments = assessments.filter(a => a.target_id === m.user_id && a.period_value === selectedPeriod);
        
        // Separate by reviewer position (팀장 or 본부장/대표)
        const teamLeaderAssessments = memberAssessments.filter(a => {
            const reviewer = STATE.members.find(mem => mem.user_id === a.reviewer_id);
            return reviewer && reviewer.position === '팀장';
        });
        const directorAssessments = memberAssessments.filter(a => {
            const reviewer = STATE.members.find(mem => mem.user_id === a.reviewer_id);
            return reviewer && (reviewer.position === '본부장' || reviewer.position === '대표');
        });

        const tlScoreText = teamLeaderAssessments.length > 0 
            ? (teamLeaderAssessments[0].score || null)
            : null;
        const dirScoreText = directorAssessments.length > 0 
            ? (directorAssessments[0].score || null)
            : null;

        function getGradeColor(grade) {
            if (grade === 'Excellent') return 'text-blue-600 bg-blue-100';
            if (grade === 'Very good') return 'text-green-600 bg-green-100';
            if (grade === 'Good') return 'text-yellow-600 bg-yellow-100';
            if (grade === 'Fair') return 'text-purple-600 bg-purple-100';
            if (grade === 'Poor') return 'text-red-600 bg-red-100';
            return 'text-on-surface-variant bg-surface-container';
        }

        const tlCacheKey = `tl_${m.user_id}_${i}`;
        const dirCacheKey = `dir_${m.user_id}_${i}`;
        if (teamLeaderAssessments.length > 0) window._feedbackModalCache[tlCacheKey] = teamLeaderAssessments;
        if (directorAssessments.length > 0) window._feedbackModalCache[dirCacheKey] = directorAssessments;

        const canView = canViewFeedback(m);

        const tlFeedbackHtml = teamLeaderAssessments.length > 0 
            ? (canView 
                ? `<button onclick="showFeedbackModal('${m.name}', '팀장', '${tlCacheKey}')" class="text-[12px] font-bold text-white bg-gray-700 hover:bg-gray-800 px-3 py-1 rounded-full transition-all cursor-pointer">피드백 확인</button>`
                : `<span class="text-[12px] font-bold text-white bg-gray-700 px-3 py-1 rounded-full">피드백 완료</span>`)
            : `<span class="text-[12px] font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded-full">평가 전</span>`;
        const dirFeedbackHtml = directorAssessments.length > 0 
            ? (canView 
                ? `<button onclick="showFeedbackModal('${m.name}', '본부장', '${dirCacheKey}')" class="text-[12px] font-bold text-white bg-gray-700 hover:bg-gray-800 px-3 py-1 rounded-full transition-all cursor-pointer">피드백 확인</button>`
                : `<span class="text-[12px] font-bold text-white bg-gray-700 px-3 py-1 rounded-full">피드백 완료</span>`)
            : `<span class="text-[12px] font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded-full">평가 전</span>`;

        return `
            <tr class="hover:bg-surface-container-lowest transition-colors border-b border-blue-50/50">
                <td class="py-4 px-4 text-center text-[14px] font-bold text-on-surface-variant">${i + 1}</td>
                <td class="py-4 px-5">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[12px]">${m.name.charAt(0)}</div>
                        <div>
                            <p class="text-[14px] font-bold text-on-surface">${m.name}</p>
                            <p class="text-[11px] text-on-surface-variant">${m.team} · ${m.position}</p>
                        </div>
                    </div>
                </td>
                <td class="py-4 px-4 text-center">
                    ${tlFeedbackHtml}
                </td>
                <td class="py-4 px-4 text-center">
                    ${tlScoreText ? (canView ? `<span class="text-[12px] font-black ${getGradeColor(tlScoreText)} px-2.5 py-1 rounded-lg">${tlScoreText}</span>` : `<span class="text-[12px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">비공개</span>`) : `<span class="text-[14px] font-bold text-on-surface-variant">-</span>`}
                </td>
                <td class="py-4 px-4 text-center">
                    ${dirFeedbackHtml}
                </td>
                <td class="py-4 px-4 text-center">
                    ${dirScoreText ? (canView ? `<span class="text-[12px] font-black ${getGradeColor(dirScoreText)} px-2.5 py-1 rounded-lg">${dirScoreText}</span>` : `<span class="text-[12px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">비공개</span>`) : `<span class="text-[14px] font-bold text-on-surface-variant">-</span>`}
                </td>
            </tr>
        `;
    }).join('');

    // Mobile card view
    let mobileCardsHtml = sortedMembers.map((m, i) => {
        const memberAssessments = assessments.filter(a => a.target_id === m.user_id && a.period_value === selectedPeriod);
        const teamLeaderAssessments = memberAssessments.filter(a => {
            const reviewer = STATE.members.find(mem => mem.user_id === a.reviewer_id);
            return reviewer && reviewer.position === '팀장';
        });
        const directorAssessments = memberAssessments.filter(a => {
            const reviewer = STATE.members.find(mem => mem.user_id === a.reviewer_id);
            return reviewer && (reviewer.position === '본부장' || reviewer.position === '대표');
        });
        const tlGrade = teamLeaderAssessments.length > 0 ? (teamLeaderAssessments[0].score || null) : null;
        const dirGrade = directorAssessments.length > 0 ? (directorAssessments[0].score || null) : null;
        const tlCacheKey = `dash_tl_${m.user_id}_${i}`;
        const dirCacheKey = `dash_dir_${m.user_id}_${i}`;
        if (teamLeaderAssessments.length > 0) window._feedbackModalCache[tlCacheKey] = teamLeaderAssessments;
        if (directorAssessments.length > 0) window._feedbackModalCache[dirCacheKey] = directorAssessments;
        const canViewM = canViewFeedback(m);
        function getGradeColorM(g) { if(g==='Excellent') return 'text-blue-600 bg-blue-100'; if(g==='Very good') return 'text-green-600 bg-green-100'; if(g==='Good') return 'text-yellow-600 bg-yellow-100'; if(g==='Fair') return 'text-purple-600 bg-purple-100'; if(g==='Poor') return 'text-red-600 bg-red-100'; return 'text-on-surface-variant bg-surface-container'; }

        return `
            <div class="bg-white rounded-xl border border-blue-50 shadow-sm p-4 mb-3">
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[12px]">${m.name.charAt(0)}</div>
                    <div>
                        <p class="text-[14px] font-bold text-on-surface">${m.name}</p>
                        <p class="text-[11px] text-on-surface-variant">${m.team} · ${m.position}</p>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div class="bg-surface-container rounded-lg p-3 text-center">
                        <p class="text-[11px] font-bold text-on-surface-variant mb-1">팀장 피드백</p>
                        ${teamLeaderAssessments.length > 0 
                            ? (canViewM ? `<button onclick="showFeedbackModal('${m.name}', '팀장', '${tlCacheKey}')" class="text-[11px] font-bold text-white bg-gray-700 px-2 py-0.5 rounded-full">피드백 확인</button>` : `<span class="text-[11px] font-bold text-white bg-gray-700 px-2 py-0.5 rounded-full">피드백 완료</span>`)
                            : `<span class="text-[11px] text-on-surface-variant">평가 전</span>`}
                    </div>
                    <div class="bg-surface-container rounded-lg p-3 text-center">
                        <p class="text-[11px] font-bold text-on-surface-variant mb-1">B Level</p>
                        ${tlGrade ? (canViewM ? `<span class="text-[11px] font-black ${getGradeColorM(tlGrade)} px-2 py-0.5 rounded">${tlGrade}</span>` : `<span class="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">비공개</span>`) : `<span class="text-[11px] text-on-surface-variant">-</span>`}
                    </div>
                    <div class="bg-surface-container rounded-lg p-3 text-center">
                        <p class="text-[11px] font-bold text-on-surface-variant mb-1">본부장 피드백</p>
                        ${directorAssessments.length > 0 
                            ? (canViewM ? `<button onclick="showFeedbackModal('${m.name}', '본부장', '${dirCacheKey}')" class="text-[11px] font-bold text-white bg-gray-700 px-2 py-0.5 rounded-full">피드백 확인</button>` : `<span class="text-[11px] font-bold text-white bg-gray-700 px-2 py-0.5 rounded-full">피드백 완료</span>`)
                            : `<span class="text-[11px] text-on-surface-variant">평가 전</span>`}
                    </div>
                    <div class="bg-surface-container rounded-lg p-3 text-center">
                        <p class="text-[11px] font-bold text-on-surface-variant mb-1">C Level</p>
                        ${dirGrade ? (canViewM ? `<span class="text-[11px] font-black ${getGradeColorM(dirGrade)} px-2 py-0.5 rounded">${dirGrade}</span>` : `<span class="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">비공개</span>`) : `<span class="text-[11px] text-on-surface-variant">-</span>`}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div class="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                <select onchange="STATE.feedbackDashPeriod = this.value; renderCurrentView();" class="w-full lg:w-auto bg-white border border-blue-100 text-on-surface font-bold rounded-lg text-[14px] px-4 py-2.5 outline-none focus:border-primary shadow-sm">
                    ${periodOptionsHtml}
                </select>
                <select onchange="setFeedbackDashDivisionFilter(this.value);" class="w-full lg:w-auto bg-white border border-blue-100 text-on-surface font-bold rounded-lg text-[14px] px-4 py-2.5 outline-none focus:border-primary shadow-sm">
                    ${dashDivisionOptionsHtml}
                </select>
                <select onchange="STATE.feedbackDashTeamFilter = this.value; renderCurrentView();" class="w-full lg:w-auto bg-white border border-blue-100 text-on-surface font-bold rounded-lg text-[14px] px-4 py-2.5 outline-none focus:border-primary shadow-sm">
                    ${dashTeamOptionsHtml}
                </select>
            </div>
            <button onclick="STATE.feedbackView = 'input'; STATE.feedbackPeriodType = ''; renderCurrentView();" class="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-blue-100 text-primary font-bold text-[13px] rounded-lg hover:bg-blue-50 transition-all shadow-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                피드백 작성
            </button>
        </div>
        <!-- Desktop table -->
        <div class="hidden lg:block bg-white rounded-2xl border border-blue-50 shadow-sm max-w-4xl overflow-hidden">
            <table class="w-full text-left table-auto">
                <thead class="bg-surface-container">
                    <tr class="text-[13px] text-on-surface-variant font-extrabold border-b border-blue-50">
                        <th class="py-4 px-4 text-center w-12">No.</th>
                        <th class="py-4 px-5">구성원</th>
                        <th class="py-4 px-4 text-center">팀장 피드백</th>
                        <th class="py-4 px-4 text-center">B Level</th>
                        <th class="py-4 px-4 text-center">본부장 피드백</th>
                        <th class="py-4 px-4 text-center">C Level</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </div>
        <!-- Mobile cards -->
        <div class="lg:hidden">
            ${mobileCardsHtml}
        </div>
    `;
}

// Feedback state initialization
if (!STATE.feedbackSelectedMember) STATE.feedbackSelectedMember = '';
if (!STATE.feedbackData) STATE.feedbackData = {};
if (!STATE.feedbackPeriod) STATE.feedbackPeriod = '2026-Q2';
if (!STATE.feedbackView) STATE.feedbackView = 'dashboard';
if (!STATE.feedbackDashPeriod) STATE.feedbackDashPeriod = '2026-Q2';
if (!STATE.assessmentData) STATE.assessmentData = [];

// Load assessment data
async function loadAssessmentData() {
    try {
        const data = await AssessmentAPI.list();
        STATE.assessmentData = data;
    } catch (e) {
        console.warn('Failed to load assessment data:', e);
        STATE.assessmentData = [];
    }
}

window._feedbackModalCache = window._feedbackModalCache || {};

window.showFeedbackModal = function(memberName, reviewerType, encodedDataOrKey) {
    try {
        let assessments;
        if (window._feedbackModalCache[encodedDataOrKey]) {
            assessments = window._feedbackModalCache[encodedDataOrKey];
        } else {
            assessments = JSON.parse(decodeURIComponent(encodedDataOrKey));
        }
        
        function getGradeStyle(grade) {
            if (grade === 'Excellent') return 'text-blue-600 bg-blue-100';
            if (grade === 'Very good') return 'text-green-600 bg-green-100';
            if (grade === 'Good') return 'text-yellow-600 bg-yellow-100';
            if (grade === 'Fair') return 'text-purple-600 bg-purple-100';
            if (grade === 'Poor') return 'text-red-600 bg-red-100';
            return 'text-primary bg-primary/10';
        }
        
        function buildModalContent(items) {
            let c = `<div class="space-y-4 max-h-[70vh] overflow-y-auto custom-scroll">`;
            items.forEach(a => {
                const dateStr = a.created_at ? new Date(a.created_at).toLocaleString('ko-KR', {timeZone:'Asia/Seoul', year:'numeric', month:'2-digit', day:'2-digit'}) : '-';
                const isOwn = a.reviewer_id === STATE.user.id;
                c += `
                    <div class="bg-surface-container rounded-xl p-5 border border-blue-50" id="fb-item-${a.id}">
                        <div class="mb-3">
                            <p class="text-[13px] font-bold text-on-surface">${a.goal_text || 'OKR'}</p>
                        </div>
                        <div id="fb-content-${a.id}">
                            <p class="text-[13px] text-on-surface-variant leading-relaxed whitespace-pre-wrap break-all">${a.feedback || '피드백 없음'}</p>
                        </div>
                        <div class="flex items-center justify-between mt-3">
                            <p class="text-[11px] text-on-surface-variant">작성자: ${a.reviewer_name || '-'} | ${dateStr}</p>
                            ${isOwn ? `<div class="flex items-center gap-2">
                                <button onclick="inlineEditFeedback(${a.id})" class="text-[11px] font-bold text-primary hover:underline">수정</button>
                                <button onclick="inlineDeleteFeedback(${a.id}, '${memberName}', '${reviewerType}')" class="text-[11px] font-bold text-error hover:underline">삭제</button>
                            </div>` : ''}
                        </div>
                    </div>
                `;
            });
            c += `</div>`;
            return c;
        }

        // 그레이드는 첫 번째 assessment에서 가져옴 (전체 1개)
        const overallGrade = assessments.length > 0 ? (assessments[0].score || '-') : '-';
        const gradeClass = getGradeStyle(overallGrade);
        const content = buildModalContent(assessments);
        // Grade 뱃지 클릭 시 변경 가능 (본인 작성분만)
        const isOwnFeedback = assessments.length > 0 && assessments[0].reviewer_id === STATE.user.id;
        const gradeClickAttr = isOwnFeedback ? `onclick="changeGrade('${assessments[0].target_id}', '${assessments[0].period_value}', '${assessments[0].reviewer_id}')" style="cursor:pointer" title="클릭하여 Grade 변경"` : '';
        const headerHtml = `<div class="flex items-center justify-between w-full"><span>${memberName} - ${reviewerType} 피드백</span><span class="text-[16px] font-black ${gradeClass} px-4 py-1.5 rounded-xl ml-4" ${gradeClickAttr}>${overallGrade}</span></div>`;
        openModal(headerHtml, content, null, true);
    } catch (e) {
        console.error('Error showing feedback modal:', e);
    }
};

// 인라인 수정 - 모달 안에서 직접 편집
window.inlineEditFeedback = function(id) {
    const item = STATE.assessmentData.find(a => a.id === id);
    if (!item) return;
    const contentDiv = document.getElementById('fb-content-' + id);
    if (!contentDiv) return;
    
    contentDiv.innerHTML = `
        <textarea id="edit-fb-text-${id}" rows="3" class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[13px] text-on-surface outline-none focus:border-primary resize-none mb-2">${item.feedback || ''}</textarea>
        <div class="flex items-center gap-2">
            <button onclick="saveInlineEdit(${id})" class="px-3 py-1 bg-primary text-white font-bold text-[11px] rounded-lg">저장</button>
            <button onclick="cancelInlineEdit(${id})" class="px-3 py-1 bg-white border border-blue-100 text-on-surface-variant font-bold text-[11px] rounded-lg">취소</button>
        </div>
    `;
};

window.cancelInlineEdit = function(id) {
    const item = STATE.assessmentData.find(a => a.id === id);
    if (!item) return;
    const contentDiv = document.getElementById('fb-content-' + id);
    if (!contentDiv) {
        return;
    }
    contentDiv.innerHTML = `<p class="text-[13px] text-on-surface-variant leading-relaxed whitespace-pre-wrap break-all">${item.feedback || '피드백 없음'}</p>`;
};

window.saveInlineEdit = async function(id) {
    const textarea = document.getElementById('edit-fb-text-' + id);
    if (!textarea) return;
    const newText = textarea.value.trim();
    try {
        await AssessmentAPI.update(id, { feedback: newText });
        const idx = STATE.assessmentData.findIndex(a => a.id === id);
        if (idx !== -1) {
            STATE.assessmentData[idx].feedback = newText;
        }
        const contentDiv = document.getElementById('fb-content-' + id);
        if (contentDiv) {
            contentDiv.innerHTML = `<p class="text-[13px] text-on-surface-variant leading-relaxed whitespace-pre-wrap break-all">${newText || '피드백 없음'}</p>`;
        }
    } catch (e) { console.error(e); alert("수정 중 오류 발생"); }
};

// Grade 일괄 변경
window.changeGrade = function(targetId, periodValue, reviewerId) {
    const relatedItems = STATE.assessmentData.filter(a => 
        a.target_id === targetId && a.period_value === periodValue && a.reviewer_id === reviewerId
    );
    const currentGrade = relatedItems.length > 0 ? (relatedItems[0].score || 'Good') : 'Good';
    
    // 모달 헤더의 뱃지를 드롭다운으로 교체
    const modalHeader = document.querySelector('#app-modal h3');
    if (!modalHeader) return;
    const badge = modalHeader.querySelector('span:last-child');
    if (!badge) return;
    
    badge.outerHTML = `<select id="grade-select" onchange="confirmGradeChange('${targetId}','${periodValue}','${reviewerId}', this.value)" class="text-[14px] font-bold text-primary bg-white border border-blue-100 rounded-lg px-3 py-1.5 outline-none focus:border-primary ml-4">
        <option value="Excellent" ${currentGrade==='Excellent'?'selected':''}>Excellent</option>
        <option value="Very good" ${currentGrade==='Very good'?'selected':''}>Very good</option>
        <option value="Good" ${currentGrade==='Good'?'selected':''}>Good</option>
        <option value="Fair" ${currentGrade==='Fair'?'selected':''}>Fair</option>
        <option value="Poor" ${currentGrade==='Poor'?'selected':''}>Poor</option>
    </select>`;
};

window.confirmGradeChange = function(targetId, periodValue, reviewerId, newGrade) {
    const relatedItems = STATE.assessmentData.filter(a => 
        a.target_id === targetId && a.period_value === periodValue && a.reviewer_id === reviewerId
    );
    Promise.all(relatedItems.map(a => AssessmentAPI.update(a.id, { score: newGrade }))).then(() => {
        relatedItems.forEach(a => { a.score = newGrade; });
        closeModal();
        renderCurrentView();
    }).catch(e => { console.error(e); alert('Grade 변경 중 오류'); });
};

// 인라인 삭제 - 모달 안에서 항목 제거
window.inlineDeleteFeedback = async function(id, memberName, reviewerType) {
    if (!confirm("이 피드백을 삭제하시겠습니까?")) return;
    try {
        await AssessmentAPI.delete(id);
        STATE.assessmentData = STATE.assessmentData.filter(a => a.id !== id);
        // 모달에서 해당 항목 DOM 제거
        const itemDiv = document.getElementById('fb-item-' + id);
        if (itemDiv) {
            itemDiv.remove();
        }
        // 남은 항목 없으면 모달 닫기
        const modalContent = document.querySelector('.custom-scroll');
        if (modalContent && modalContent.children.length === 0) {
            closeModal();
        }
    } catch (e) { console.error(e); alert("삭제 중 오류 발생"); }
};

window.submitFeedback = async function() {
    const selectedMemberId = STATE.feedbackSelectedMember;
    const selectedPeriod = STATE.feedbackPeriod || '2026-Q2';
    const selectedMember = STATE.members.find(m => m.user_id === selectedMemberId);
    
    let memberGoals = [];
    if (selectedPeriod === '2026') {
        memberGoals = STATE.allGoals.filter(g => g.userId === selectedMemberId && g.status === '합의 완료' && g.periodType === 'yearly' && g.periodValue === '2026');
    } else {
        memberGoals = STATE.allGoals.filter(g => g.userId === selectedMemberId && g.status === '합의 완료' && g.periodType === 'quarterly' && g.periodValue === selectedPeriod);
    }
    
    if (!selectedMember) {
        alert('구성원을 선택해 주세요.');
        return;
    }

    const scoreInput = document.getElementById('feedback-score');
    const score = scoreInput ? scoreInput.value : '';
    
    const validScores = ['Excellent', 'Very good', 'Good', 'Fair', 'Poor'];
    if (!validScores.includes(score)) {
        alert('평가 등급을 선택해 주세요.');
        return;
    }

    let feedbackItems = [];
    const existingAssessments = STATE.assessmentData ? STATE.assessmentData.filter(a => 
        a.reviewer_id === STATE.user.id && a.target_id === selectedMemberId && a.period_value === selectedPeriod
    ) : [];
    
    // Generate assess_id: unique per reviewer + target + period
    const assessId = `${STATE.user.id}_${selectedMemberId}_${selectedPeriod}`;
    
    memberGoals.forEach(g => {
        // Only submit for goals that don't already have feedback
        const alreadyReviewed = existingAssessments.find(a => a.goal_id == g.id);
        if (alreadyReviewed) return;
        
        const textarea = document.getElementById('feedback-' + g.id);
        if (textarea && textarea.value.trim()) {
            feedbackItems.push({
                goalId: g.id,
                goalText: g.text,
                periodType: g.periodType,
                periodValue: g.periodValue,
                feedback: textarea.value.trim()
            });
        }
    });
    
    if (feedbackItems.length === 0) {
        alert('피드백이 작성되지 않은 OKR에 대해 피드백을 입력해 주세요.');
        return;
    }
    
    try {
        // Create new feedback rows with assess_id
        for (const item of feedbackItems) {
            await AssessmentAPI.create({
                assess_id: assessId,
                reviewer_id: STATE.user.id,
                reviewer_name: STATE.user.name,
                reviewer_position: STATE.user.position || STATE.members.find(m => m.user_id === STATE.user.id)?.position || '',
                target_id: selectedMemberId,
                target_name: selectedMember.name,
                goal_id: item.goalId,
                goal_text: item.goalText,
                period_type: item.periodType,
                period_value: item.periodValue,
                feedback: item.feedback,
                score: score,
                created_at: new Date().toISOString()
            });
        }
        
        // Update score on all existing rows with same assess_id
        for (const existing of existingAssessments) {
            if (parseFloat(existing.score) !== score) {
                await AssessmentAPI.update(existing.id, { score: score });
            }
        }
        
        alert('피드백이 제출되었습니다.');
        STATE.feedbackData = {};
        await loadAssessmentData();
        renderCurrentView();
    } catch (error) {
        console.error('Error submitting feedback:', error);
        alert('피드백 제출 중 오류가 발생했습니다.\n' + error.message);
    }
};

// --- OKR Guide View ---
function renderGuide(container) {
    const h = `
        <div class="max-w-5xl mx-auto py-6">
            <!-- OKR이란? 섹션 -->
            <div class="bg-white rounded-2xl border border-blue-50 shadow-sm p-8 mb-6">
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                    <h3 class="font-display text-xl font-bold text-on-surface">OKR이란?</h3>
                </div>
                
                <div class="bg-primary/5 rounded-xl p-6 border-2 border-primary/20 mb-6">
                    <div class="flex items-center gap-2 mb-4">
                        <div class="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                            <span class="text-primary font-black text-sm">OKR</span>
                        </div>
                        <h4 class="font-bold text-on-surface text-lg">Objectives and Key Results</h4>
                    </div>
                    <p class="text-on-surface text-[14px] leading-relaxed mb-4">
                        <strong>목표(Objectives)</strong>와 <strong>핵심 결과(Key Results)</strong>로 구성된 목표 관리 프레임워크입니다. 
                        도전적이고 야심찬 목표를 설정하고, 측정 가능한 핵심 결과를 통해 달성 여부를 추적합니다.
                    </p>
                    <div class="space-y-2">
                        <div class="flex items-start gap-2">
                            <div class="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                            <p class="text-[13px] text-on-surface"><strong>도전적 목표 :</strong> 현재 수준을 뛰어넘는 야심찬 목표 설정</p>
                        </div>
                        <div class="flex items-start gap-2">
                            <div class="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                            <p class="text-[13px] text-on-surface"><strong>측정 가능 :</strong> 정량적 지표로 진행 상황 추적</p>
                        </div>
                        <div class="flex items-start gap-2">
                            <div class="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                            <p class="text-[13px] text-on-surface"><strong>투명성 :</strong> 전체 조직이 목표를 공유하고 정렬</p>
                        </div>
                    </div>
                </div>

                <!-- 70-80% 달성률 강조 -->
                <div class="bg-gradient-to-r from-success/5 to-success/10 rounded-xl p-6 border-l-4 border-success">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-16 h-12 bg-success/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span class="text-success font-black text-[15px]">70-80%</span>
                        </div>
                        <h4 class="font-bold text-on-surface text-lg">도전적 목표와 실패 포용</h4>
                    </div>
                    <p class="text-on-surface text-[14px] leading-relaxed mb-2">
                        OKR은 <strong class="text-success">70~80% 달성률을 성공</strong>으로 간주합니다.
                    </p>
                    <p class="text-on-surface text-[14px] leading-relaxed mb-6">
                        이는 충분히 도전적인 목표를 설정했다는 의미이며, 실패를 두려워하지 않고 혁신을 추구하는 문화를 만듭니다.
                    </p>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div class="bg-white rounded-lg p-5 border border-success/20 text-center">
                            <div class="text-success font-black text-3xl mb-2">100%</div>
                            <p class="text-[13px] text-on-surface font-bold mb-1">목표가 너무 쉬움</p>
                            <p class="text-[12px] text-on-surface-variant">더 도전적인 목표 필요</p>
                        </div>
                        <div class="bg-success/10 rounded-lg p-5 border-2 border-success text-center">
                            <div class="text-success font-black text-3xl mb-2">70-80%</div>
                            <p class="text-[13px] text-on-surface font-bold mb-1">이상적인 달성률 ✓</p>
                            <p class="text-[12px] text-on-surface-variant">적절한 도전 수준</p>
                        </div>
                        <div class="bg-white rounded-lg p-5 border border-error/20 text-center">
                            <div class="text-error font-black text-3xl mb-2">&lt;50%</div>
                            <p class="text-[13px] text-on-surface font-bold mb-1">목표 재검토 필요</p>
                            <p class="text-[12px] text-on-surface-variant">전략 조정 고려</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- OKR 구조 섹션 -->
            <div class="bg-white rounded-2xl border border-blue-50 shadow-sm p-8 mb-6">
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
                    </div>
                    <h3 class="font-display text-xl font-bold text-on-surface">OKR 구조 이해하기</h3>
                </div>

                <div class="space-y-6">
                    <div class="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6 border-l-4 border-primary">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black text-sm">O</div>
                            <h4 class="font-bold text-on-surface text-lg">Objective (목표)</h4>
                        </div>
                        <p class="text-on-surface text-[13px] leading-relaxed mb-4">
                            <strong>정성적이고 영감을 주는 목표</strong>로, 팀이나 개인이 달성하고자 하는 방향성을 제시합니다. 
                            명확하고 동기부여가 되며, 실행 가능한 목표여야 합니다.
                        </p>
                        <div class="bg-white rounded-lg p-4 border border-blue-100">
                            <p class="text-[12px] text-on-surface-variant font-bold mb-2">✅ 좋은 예시</p>
                            <p class="text-[13px] text-on-surface font-medium">"고객 경험을 혁신하여 업계 최고 수준 달성"</p>
                            <p class="text-[13px] text-on-surface font-medium">"데이터 기반 의사결정 문화 정착"</p>
                        </div>
                    </div>

                    <div class="bg-gradient-to-r from-success/5 to-success/10 rounded-xl p-6 border-l-4 border-success">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-8 h-8 bg-success rounded-lg flex items-center justify-center text-white font-black text-sm">KR</div>
                            <h4 class="font-bold text-on-surface text-lg">Key Results (핵심 결과)</h4>
                        </div>
                        <p class="text-on-surface text-[13px] leading-relaxed mb-4">
                            <strong>정량적이고 측정 가능한 결과</strong>로, Objective 달성 여부를 판단하는 구체적인 지표입니다. 
                            각 OKR은 보통 2-5개의 Key Results를 가집니다.
                        </p>
                        
                        <!-- 조직별 OKR 예시 토글 -->
                        <div class="space-y-3">
                            <!-- 개발 조직 -->
                            <details class="bg-white rounded-lg border border-success/30 overflow-hidden">
                                <summary class="cursor-pointer p-4 hover:bg-success/5 transition-colors font-bold text-[13px] text-on-surface flex items-center justify-between">
                                    <span>💻 개발 조직 OKR 예시</span>
                                    <svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </summary>
                                <div class="p-4 pt-0 border-t border-success/10">
                                    <div class="bg-success/5 rounded p-3 mb-3">
                                        <p class="text-[11px] text-on-surface-variant font-bold mb-1">Objective</p>
                                        <p class="text-[14px] text-on-surface font-bold">"개발 효율성 향상 및 인프라 비용 최적화"</p>
                                    </div>
                                    <div class="space-y-2 ml-2">
                                        <div class="flex items-start gap-2">
                                            <div class="w-1.5 h-1.5 rounded-full bg-success mt-2 flex-shrink-0"></div>
                                            <p class="text-[13px] text-on-surface">클라우드 인프라 비용을 기존 대비 30% 절감</p>
                                        </div>
                                        <div class="flex items-start gap-2">
                                            <div class="w-1.5 h-1.5 rounded-full bg-success mt-2 flex-shrink-0"></div>
                                            <p class="text-[13px] text-on-surface">비용 효율화 관련 1 M/M 이상 프로젝트 3건 완료</p>
                                        </div>
                                        <div class="flex items-start gap-2">
                                            <div class="w-1.5 h-1.5 rounded-full bg-success mt-2 flex-shrink-0"></div>
                                            <p class="text-[13px] text-on-surface">코드 리뷰 완료 시간을 기존 대비 50% 단축</p>
                                        </div>
                                    </div>
                                </div>
                            </details>

                            <!-- 마케팅 조직 -->
                            <details class="bg-white rounded-lg border border-success/30 overflow-hidden">
                                <summary class="cursor-pointer p-4 hover:bg-success/5 transition-colors font-bold text-[13px] text-on-surface flex items-center justify-between">
                                    <span>📢 마케팅 조직 OKR 예시</span>
                                    <svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </summary>
                                <div class="p-4 pt-0 border-t border-success/10">
                                    <div class="bg-success/5 rounded p-3 mb-3">
                                        <p class="text-[11px] text-on-surface-variant font-bold mb-1">Objective</p>
                                        <p class="text-[14px] text-on-surface font-bold">"효율적인 마케팅으로 매출 성장 가속화"</p>
                                    </div>
                                    <div class="space-y-2 ml-2">
                                        <div class="flex items-start gap-2">
                                            <div class="w-1.5 h-1.5 rounded-full bg-success mt-2 flex-shrink-0"></div>
                                            <p class="text-[13px] text-on-surface">광고 ROAS를 기존 대비 60% 향상</p>
                                        </div>
                                        <div class="flex items-start gap-2">
                                            <div class="w-1.5 h-1.5 rounded-full bg-success mt-2 flex-shrink-0"></div>
                                            <p class="text-[13px] text-on-surface">신규 채널 확장 프로젝트 2건 이상 진행</p>
                                        </div>
                                        <div class="flex items-start gap-2">
                                            <div class="w-1.5 h-1.5 rounded-full bg-success mt-2 flex-shrink-0"></div>
                                            <p class="text-[13px] text-on-surface">신규 고객 전환율을 기존 대비 40% 증가</p>
                                        </div>
                                    </div>
                                </div>
                            </details>

                            <!-- 디자인 조직 -->
                            <details class="bg-white rounded-lg border border-success/30 overflow-hidden">
                                <summary class="cursor-pointer p-4 hover:bg-success/5 transition-colors font-bold text-[13px] text-on-surface flex items-center justify-between">
                                    <span>🎨 디자인 조직 OKR 예시</span>
                                    <svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </summary>
                                <div class="p-4 pt-0 border-t border-success/10">
                                    <div class="bg-success/5 rounded p-3 mb-3">
                                        <p class="text-[11px] text-on-surface-variant font-bold mb-1">Objective</p>
                                        <p class="text-[14px] text-on-surface font-bold">"디자인 시스템 효율화 및 일관성 확보"</p>
                                    </div>
                                    <div class="space-y-2 ml-2">
                                        <div class="flex items-start gap-2">
                                            <div class="w-1.5 h-1.5 rounded-full bg-success mt-2 flex-shrink-0"></div>
                                            <p class="text-[13px] text-on-surface">디자인 시스템 구축 프로젝트 1건 완료</p>
                                        </div>
                                        <div class="flex items-start gap-2">
                                            <div class="w-1.5 h-1.5 rounded-full bg-success mt-2 flex-shrink-0"></div>
                                            <p class="text-[13px] text-on-surface">도메인별 UX/UI 표준화 프로젝트 3건 진행</p>
                                        </div>
                                        <div class="flex items-start gap-2">
                                            <div class="w-1.5 h-1.5 rounded-full bg-success mt-2 flex-shrink-0"></div>
                                            <p class="text-[13px] text-on-surface">디자인 작업 소요 시간을 기존 대비 40% 단축</p>
                                        </div>
                                    </div>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 기간별 운영 가이드 -->
            <div class="bg-white rounded-2xl border border-blue-50 shadow-sm p-8 mb-6">
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                    <h3 class="font-display text-xl font-bold text-on-surface">기간별 OKR 가이드</h3>
                </div>

                <div class="space-y-6">
                    <!-- 분기별 OKR -->
                    <div class="border border-blue-100 rounded-xl p-6 hover:border-primary/30 transition-all">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <span class="text-primary font-black text-sm">분기</span>
                            </div>
                            <h4 class="font-bold text-on-surface text-lg">분기별 OKR</h4>
                        </div>
                        <div class="grid lg:grid-cols-2 gap-4">
                            <div class="bg-surface-container rounded-lg p-4">
                                <p class="text-[11px] font-bold text-on-surface-variant mb-2">📝 작성 시기</p>
                                <p class="text-[13px] text-on-surface font-medium">분기 시작 2주 전</p>
                                <p class="text-[12px] text-on-surface-variant mt-1">다음 분기 전략 수립</p>
                            </div>
                            <div class="bg-surface-container rounded-lg p-4">
                                <p class="text-[11px] font-bold text-on-surface-variant mb-2">✅ 리뷰 시기</p>
                                <p class="text-[13px] text-on-surface font-medium">분기 마지막 주</p>
                                <p class="text-[12px] text-on-surface-variant mt-1">분기 성과 회고</p>
                            </div>
                        </div>
                    </div>

                    <!-- 연간 OKR -->
                    <div class="border border-blue-100 rounded-xl p-6 hover:border-primary/30 transition-all">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                                <span class="text-purple-600 font-black text-sm">연간</span>
                            </div>
                            <h4 class="font-bold text-on-surface text-lg">연간 OKR</h4>
                        </div>
                        <div class="grid lg:grid-cols-2 gap-4">
                            <div class="bg-surface-container rounded-lg p-4">
                                <p class="text-[11px] font-bold text-on-surface-variant mb-2">📝 작성 시기</p>
                                <p class="text-[13px] text-on-surface font-medium">전년도 12월</p>
                                <p class="text-[12px] text-on-surface-variant mt-1">연간 비전 및 전략 수립</p>
                            </div>
                            <div class="bg-surface-container rounded-lg p-4">
                                <p class="text-[11px] font-bold text-on-surface-variant mb-2">✅ 리뷰 시기</p>
                                <p class="text-[13px] text-on-surface font-medium">12월 마지막 주</p>
                                <p class="text-[12px] text-on-surface-variant mt-1">연간 성과 종합 회고</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 분기별 피드백 안내 -->
            <div class="bg-white rounded-2xl border border-blue-50 shadow-sm p-8">
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h3 class="font-display text-xl font-bold text-on-surface">분기별 피드백 안내</h3>
                </div>

                <div class="space-y-5">
                    <div class="bg-surface-container rounded-xl p-5 border border-blue-50">
                        <h4 class="text-[14px] font-bold text-on-surface mb-3">피드백 목적</h4>
                        <p class="text-[13px] text-on-surface-variant leading-relaxed">OKR은 단순한 업무 관리 도구가 아닌, 구성원의 성장과 조직의 방향성을 정렬하는 프레임워크입니다. 분기별 피드백은 목표 달성 여부를 점검하는 것을 넘어, 구성원이 올바른 방향으로 성장하고 있는지 확인하고 건설적인 피드백을 통해 다음 분기의 도전을 설계하는 데 목적이 있습니다.</p>
                    </div>

                    <div class="grid lg:grid-cols-2 gap-4">
                        <div class="bg-surface-container rounded-xl p-5 border border-blue-50">
                            <h4 class="text-[14px] font-bold text-on-surface mb-3">피드백 시기 및 기간</h4>
                            <ul class="space-y-2 text-[13px] text-on-surface-variant">
                                <li class="flex items-start gap-2"><span class="text-primary font-bold">•</span>각 분기 종료 후 2주간 피드백 기간이 운영됩니다.</li>
                                <li class="flex items-start gap-2"><span class="text-primary font-bold">•</span>피드백 기간 내 팀장 및 본부장이 구성원별 피드백과 Grade를 작성합니다.</li>
                            </ul>
                        </div>
                        <div class="bg-surface-container rounded-xl p-5 border border-blue-50">
                            <h4 class="text-[14px] font-bold text-on-surface mb-3">그레이딩 구조</h4>
                            <ul class="space-y-2 text-[13px] text-on-surface-variant">
                                <li class="flex items-start gap-2"><span class="text-green-600 font-bold">B</span><span><strong>B Level 피드백 (팀장 회고):</strong> 팀장이 팀원의 OKR 달성도와 업무 기여도를 종합적으로 회고합니다.</span></li>
                                <li class="flex items-start gap-2"><span class="text-purple-600 font-bold">C</span><span><strong>C Level 피드백 (본부장 회고):</strong> 본부장이 조직 전체 관점에서 구성원의 성과와 성장 가능성을 회고합니다.</span></li>
                                <li class="flex items-start gap-2"><span class="text-primary font-bold">•</span>피드백 결과는 5단계 Grade로 부여됩니다.</li>
                            </ul>
                        </div>
                    </div>

                    <div class="bg-gradient-to-r from-green-50 to-green-50/50 rounded-xl p-5 border-l-4 border-green-500">
                        <h4 class="text-[14px] font-bold text-on-surface mb-3">공개 및 열람 정책</h4>
                        <ul class="space-y-2 text-[13px] text-on-surface-variant">
                            <li class="flex items-start gap-2"><span class="text-green-600 font-bold">✓</span>피드백 내용은 해당 구성원에게 공개되어 성장의 방향성을 제시합니다.</li>
                            <li class="flex items-start gap-2"><span class="text-primary font-bold">•</span>피드백 내용 전체(피드백 + Grade)는 C레벨에 한해 실시간 열람이 가능합니다.</li>
                            <li class="flex items-start gap-2"><span class="text-primary font-bold">•</span>제출된 피드백 자료는 연초 전사 인사 회고의 참고 자료로 활용될 수 있습니다.</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- 시스템 사용 가이드 -->
            <div class="bg-white rounded-2xl border border-blue-50 shadow-sm p-8">
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                    </div>
                    <h3 class="font-display text-xl font-bold text-on-surface">시스템 사용 워크플로우</h3>
                </div>

                <div class="space-y-4">
                    <div class="flex items-start gap-4 p-4 bg-surface-container rounded-xl">
                        <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black text-sm flex-shrink-0">1</div>
                        <div>
                            <h5 class="font-bold text-on-surface mb-1">목표 설정 및 합의</h5>
                            <p class="text-[13px] text-on-surface-variant leading-relaxed">
                                '목표 설정 및 합의' 메뉴에서 OKR을 작성하고 Key Results를 추가합니다. 
                                작성 완료 후 '승인 요청' 버튼을 클릭하여 관리자에게 승인을 요청하세요.
                            </p>
                        </div>
                    </div>

                    <div class="flex items-start gap-4 p-4 bg-surface-container rounded-xl">
                        <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black text-sm flex-shrink-0">2</div>
                        <div>
                            <h5 class="font-bold text-on-surface mb-1">관리자 승인</h5>
                            <p class="text-[13px] text-on-surface-variant leading-relaxed">
                                관리자는 '요청 관리' 메뉴에서 제출된 OKR을 검토하고 승인/반려합니다. 
                                승인된 OKR은 '합의 완료' 상태가 되어 진척률 관리가 가능해집니다.
                            </p>
                        </div>
                    </div>

                    <div class="flex items-start gap-4 p-4 bg-surface-container rounded-xl">
                        <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black text-sm flex-shrink-0">3</div>
                        <div>
                            <h5 class="font-bold text-on-surface mb-1">진척률 업데이트</h5>
                            <p class="text-[13px] text-on-surface-variant leading-relaxed">
                                '내 목표 관리' 메뉴에서 각 Key Result의 진척률을 슬라이더로 조정합니다. 
                                변경 사항은 '진척률 업데이트 요청' 버튼을 통해 관리자에게 승인 요청하세요.
                            </p>
                        </div>
                    </div>

                    <div class="flex items-start gap-4 p-4 bg-surface-container rounded-xl">
                        <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black text-sm flex-shrink-0">4</div>
                        <div>
                            <h5 class="font-bold text-on-surface mb-1">대시보드 모니터링</h5>
                            <p class="text-[13px] text-on-surface-variant leading-relaxed">
                                '대시보드' 메뉴에서 전체 팀원의 OKR 진행 상황을 한눈에 확인할 수 있습니다. 
                                월별/분기별/연간 탭을 전환하여 기간별 성과를 모니터링하세요.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- KPI 참고 섹션 -->
            <div class="bg-white rounded-2xl border border-blue-50 shadow-sm p-8">
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h3 class="font-display text-xl font-bold text-on-surface">다시 한번 체크하세요! KPI와의 차이점</h3>
                </div>

                <p class="text-on-surface-variant text-[14px] leading-relaxed mb-6">
                    OKR과 KPI는 모두 성과를 측정하지만, <strong class="text-on-surface">접근 방식과 목적</strong>이 다릅니다. 
                    아래 비교를 통해 차이점을 명확히 이해하세요.
                </p>

                <div class="grid lg:grid-cols-2 gap-6 mb-6">
                    <div class="bg-primary/5 rounded-xl p-6 border-2 border-primary/20">
                        <div class="flex items-center gap-2 mb-4">
                            <div class="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                                <span class="text-primary font-black text-sm">OKR</span>
                            </div>
                            <h4 class="font-bold text-on-surface text-lg">목표 지향적</h4>
                        </div>
                        <p class="text-[13px] text-on-surface-variant mb-4">
                            <strong class="text-on-surface">변화와 개선</strong>을 추구하며, 도전적인 목표 달성을 위한 구체적인 결과를 설정합니다.
                        </p>
                        <div class="bg-white rounded-lg p-4 border border-primary/30">
                            <p class="text-[12px] text-primary font-bold mb-3">✅ OKR 예시</p>
                            <div class="space-y-2">
                                <div class="bg-primary/5 rounded p-2">
                                    <p class="text-[11px] text-on-surface-variant font-bold mb-1">Objective</p>
                                    <p class="text-[13px] text-on-surface font-medium">"고객 경험 혁신"</p>
                                </div>
                                <div class="space-y-1.5 ml-2">
                                    <div class="flex items-start gap-2">
                                        <div class="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                                        <p class="text-[12px] text-on-surface">NPS를 65에서 80으로 향상</p>
                                    </div>
                                    <div class="flex items-start gap-2">
                                        <div class="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                                        <p class="text-[12px] text-on-surface">응답 시간을 24시간에서 4시간으로 단축</p>
                                    </div>
                                    <div class="flex items-start gap-2">
                                        <div class="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                                        <p class="text-[12px] text-on-surface">이탈률을 15%에서 8%로 감소</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="mt-3 flex items-center gap-2 text-[12px]">
                            <span class="text-primary font-bold">달성 기준 :</span>
                            <span class="text-on-surface-variant">70-80% 달성 시 성공</span>
                        </div>
                    </div>

                    <div class="bg-blue-50/50 rounded-xl p-6 border border-blue-200">
                        <div class="flex items-center gap-2 mb-4">
                            <div class="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                <span class="text-blue-600 font-black text-sm">KPI</span>
                            </div>
                            <h4 class="font-bold text-on-surface text-lg">지표 중심적</h4>
                        </div>
                        <p class="text-[13px] text-on-surface-variant mb-4">
                            <strong class="text-on-surface">현재 상태를 측정</strong>하고 모니터링하며, 일정 수준을 유지하는 데 초점을 둡니다.
                        </p>
                        <div class="bg-white rounded-lg p-4 border border-blue-300">
                            <p class="text-[12px] text-blue-600 font-bold mb-3">📊 KPI 예시</p>
                            <div class="space-y-2">
                                <div class="bg-blue-50/50 rounded p-2">
                                    <p class="text-[11px] text-on-surface-variant font-bold mb-1">측정 지표</p>
                                    <p class="text-[13px] text-on-surface font-medium">"고객 서비스 성과"</p>
                                </div>
                                <div class="space-y-1.5 ml-2">
                                    <div class="flex items-start gap-2">
                                        <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                                        <p class="text-[12px] text-on-surface-variant">월간 NPS 점수 200점</p>
                                    </div>
                                    <div class="flex items-start gap-2">
                                        <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                                        <p class="text-[12px] text-on-surface-variant">평균 응답 시간 100초 이내</p>
                                    </div>
                                    <div class="flex items-start gap-2">
                                        <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                                        <p class="text-[12px] text-on-surface-variant">월간 이탈률 5% 이내</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="mt-3 flex items-center gap-2 text-[12px]">
                            <span class="text-blue-600 font-bold">달성 기준 :</span>
                            <span class="text-on-surface-variant">100% 달성 목표</span>
                        </div>
                    </div>
                </div>

                <div class="bg-gradient-to-r from-orange-50 to-orange-50/50 rounded-xl p-5 border-l-4 border-orange-500">
                    <div class="flex items-start gap-3">
                        <div class="w-6 h-6 bg-orange-500 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span class="text-white font-black text-xs">!</span>
                        </div>
                        <div>
                            <p class="text-[13px] font-bold text-on-surface mb-2">핵심 차이점</p>
                            <p class="text-[13px] text-on-surface-variant leading-relaxed">
                                <strong class="text-on-surface">OKR</strong>은 "어디로 가고 싶은가?"에 답하며 변화를 추구합니다. 
                                <strong class="text-on-surface">KPI</strong>는 "현재 어디에 있는가?"를 측정하며 현상을 유지합니다. 
                                OKR은 70-80% 달성을 성공으로 보지만, KPI는 100% 달성을 목표로 합니다.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = h;
}


// --- Weekly Report View ---

// 주차 계산: 월요일 시작, 주차 소속은 그 주 월요일 기준 월
// 시작: 2026년 6월 4주차 (2026-06-22), 현재일 기준 3개월 후까지 자동 생성
function generateWeeklyPeriods() {
    const periods = [];
    const startMonday = new Date(2026, 5, 22); // 2026-06-22
    const now = new Date();
    const endRef = new Date(now.getFullYear(), now.getMonth() + 4, 0);
    let cursor = new Date(startMonday);
    while (cursor <= endRef) {
        const year = cursor.getFullYear();
        const month = cursor.getMonth() + 1;
        const firstOfMonth = new Date(year, month - 1, 1);
        const dow = firstOfMonth.getDay();
        const firstMonday = new Date(firstOfMonth);
        if (dow === 0) firstMonday.setDate(firstOfMonth.getDate() + 1);
        else if (dow !== 1) firstMonday.setDate(firstOfMonth.getDate() + (8 - dow));
        const weekNum = Math.round((cursor - firstMonday) / (7 * 24 * 60 * 60 * 1000)) + 1;
        const friday = new Date(cursor);
        friday.setDate(cursor.getDate() + 4);
        const fmt = d => `${d.getMonth() + 1}/${d.getDate()}`;
        periods.push({
            key: `${year}-${month}-${weekNum}`,
            year: String(year), month: String(month), week: String(weekNum),
            label: `${year}년 ${month}월 ${weekNum}주차`,
            dateRange: `${fmt(cursor)} ~ ${fmt(friday)}`,
            monthLabel: `${year}년 ${month}월`,
            mondayDate: new Date(cursor)
        });
        cursor.setDate(cursor.getDate() + 7);
    }
    return periods;
}

function getTodayWeekKey(periods) {
    const now = new Date(); now.setHours(0,0,0,0);
    const dow = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    for (const p of periods) {
        const pm = p.mondayDate;
        if (pm.getFullYear()===monday.getFullYear() && pm.getMonth()===monday.getMonth() && pm.getDate()===monday.getDate()) return p.key;
    }
    const past = [...periods].filter(p => p.mondayDate <= monday);
    return past.length ? past[past.length-1].key : (periods[0] ? periods[0].key : '');
}

function renderWeeklyReport(container) {
    const periods = generateWeeklyPeriods();
    const viewMode = STATE.weeklyReportViewMode || 'my';
    if (!STATE.weeklyReportSelectedWeek || !periods.find(p => p.key === STATE.weeklyReportSelectedWeek)) {
        STATE.weeklyReportSelectedWeek = getTodayWeekKey(periods);
    }
    const selectedPeriod = periods.find(p => p.key === STATE.weeklyReportSelectedWeek) || periods[0];
    const months = [...new Set(periods.map(p => p.monthLabel))];

    let h = '<div class="max-w-3xl mx-auto">';
    h += '<div class="flex items-center gap-3 mb-6">';
    h += `<button onclick="setWeeklyReportViewMode('my')" class="flex items-center gap-2 px-4 py-2.5 font-bold text-[13px] rounded-lg transition-all ${viewMode==='my' ? 'bg-primary text-white shadow-sm' : 'bg-white border border-blue-100 text-on-surface hover:bg-blue-50'}">`;
    h += '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>내 업무 공유</button>';
    h += `<button onclick="setWeeklyReportViewMode('all')" class="flex items-center gap-2 px-4 py-2.5 font-bold text-[13px] rounded-lg transition-all ${viewMode==='all' ? 'bg-primary text-white shadow-sm' : 'bg-white border border-blue-100 text-on-surface hover:bg-blue-50'}">`;
    h += '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>구성원 전체 현황</button>';
    h += '</div>';

    h += '<p style="font-size:12px;color:#DC2626;font-weight:600;margin-bottom:12px;animation:blink 1.5s ease-in-out infinite">주간업무는 해당주차 금요일 혹은 차주 월요일까지 입력하시는 것을 권장합니다.</p>';

    h += '<div class="bg-white rounded-2xl border border-blue-50 shadow-sm px-5 py-4 mb-6 flex items-center gap-3 flex-wrap">';
    h += '<svg class="w-4 h-4 text-on-surface-variant flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>';
    h += '<select onchange="setWeeklyReportMonth(this.value)" class="bg-surface-container text-on-surface font-bold border border-blue-100 rounded-lg text-[13px] px-3 py-2 outline-none focus:border-primary">';
    months.forEach(ml => {
        h += `<option value="${ml}" ${selectedPeriod && selectedPeriod.monthLabel===ml ? 'selected' : ''}>${ml}</option>`;
    });
    h += '</select>';
    const monthPeriods = selectedPeriod ? periods.filter(p => p.monthLabel===selectedPeriod.monthLabel) : [];
    h += '<select onchange="setWeeklyReportWeek(this.value)" class="bg-surface-container text-on-surface font-bold border border-blue-100 rounded-lg text-[13px] px-3 py-2 outline-none focus:border-primary">';
    monthPeriods.forEach(p => {
        h += `<option value="${p.key}" ${p.key===STATE.weeklyReportSelectedWeek ? 'selected' : ''}>${p.week}주차 (${p.dateRange})</option>`;
    });
    h += '</select>';
    if (selectedPeriod) {
        h += `<span class="text-[13px] text-primary font-black">${selectedPeriod.label}</span>`;
    }
    h += '</div>';
    h += viewMode==='my' ? renderWeeklyReportMyView(selectedPeriod) : renderWeeklyReportAllView(selectedPeriod);
    h += '</div>';
    container.innerHTML = h;
}

function renderWeeklyReportMyView(selectedPeriod) {
    const member = STATE.members.find(m => m.user_id === STATE.user.id) || {};
    const myReport = selectedPeriod ? STATE.weeklyReports.find(r =>
        r.user_id===STATE.user.id && r.year===selectedPeriod.year && r.month===selectedPeriod.month && r.week===selectedPeriod.week
    ) : null;
    const content = myReport ? (myReport.content || '') : '';
    let h = '<div class="bg-white rounded-2xl border border-blue-50 shadow-sm p-6 lg:p-8">';
    h += '<div class="grid grid-cols-3 gap-4 mb-6">';
    [['이름', member.name || STATE.user.name || ''], ['팀', member.team || ''], ['직책', member.position || '']].forEach(([label, val]) => {
        h += `<div><label class="block text-[12px] font-bold text-on-surface-variant mb-1.5">${label}</label>`;
        h += `<input type="text" value="${val}" disabled class="w-full bg-surface-container border border-blue-100 rounded-lg px-3 py-2 text-[13px] font-bold text-on-surface cursor-not-allowed"></div>`;
    });
    h += '</div>';
    h += '<div class="mb-5"><div class="flex items-center justify-between mb-2">';
    h += `<label class="text-[13px] font-bold text-on-surface-variant">${selectedPeriod ? selectedPeriod.label+' 업무공유' : '업무공유'}</label>`;
    if (myReport && myReport.updated_at) {
        const fmt = new Date(myReport.updated_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
        h += `<span class="text-[11px] text-on-surface-variant/60 font-medium">마지막 저장: ${fmt}</span>`;
    }
    h += '</div>';
    h += `<textarea id="weekly-report-content" rows="16" placeholder="이번 주 업무 내용을 자유롭게 작성해 주세요.&#10;&#10;예) 진행한 업무, 완료된 작업, 이슈 및 해결 방법, 다음 주 계획 등" class="w-full bg-white border border-blue-100 rounded-xl px-4 py-3 text-[13px] text-on-surface outline-none focus:border-primary resize-none leading-relaxed custom-scroll">${content}</textarea>`;
    h += '</div>';
    h += `<div class="flex justify-end"><button onclick="saveWeeklyReport('${STATE.weeklyReportSelectedWeek}')" class="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold text-[13px] rounded-lg hover:bg-primary-dim transition-all shadow-sm">`;
    h += '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>저장</button></div></div>';
    return h;
}

function renderWeeklyReportAllView(selectedPeriod) {
    const divSelected = STATE.weeklyReportDivisionFilter && STATE.weeklyReportDivisionFilter !== '';
    const teamSelected = STATE.weeklyReportTeamFilter && STATE.weeklyReportTeamFilter !== '';
    const targetMembers = teamSelected ? STATE.members.filter(m =>
        !m.is_hidden &&
        m.team!=='무소속(운영본부)' && m.team!=='CEO,CCO' &&
        m.team===STATE.weeklyReportTeamFilter
    ).sort((a,b) => a.name.localeCompare(b.name,'ko')) : [];

    // 본인을 최상단으로
    if (teamSelected) {
        const myIdx = targetMembers.findIndex(m => m.user_id === STATE.user.id);
        if (myIdx > 0) {
            const me = targetMembers.splice(myIdx, 1)[0];
            targetMembers.unshift(me);
        }
    }

    // 본부 기준 팀 필터
    const wrFilteredTeams = divSelected ? STATE.teams.filter(t => t.division === STATE.weeklyReportDivisionFilter) : STATE.teams;

    let h = '<div class="space-y-3">';

    // 본부 + 팀 필터
    h += '<div class="flex items-center gap-2 mb-2">';
    h += '<select onchange="setWeeklyReportDivisionFilter(this.value)" class="bg-white border border-blue-100 text-on-surface font-bold rounded-lg text-[13px] px-3 py-2 outline-none focus:border-primary shadow-sm">';
    h += `<option value="" ${!divSelected ? 'selected' : ''}>본부 선택</option>`;
    STATE.divisions.forEach(d => {
        h += `<option value="${d.name}" ${STATE.weeklyReportDivisionFilter===d.name ? 'selected' : ''}>${d.name}</option>`;
    });
    h += '</select>';
    h += `<select onchange="setWeeklyReportTeamFilter(this.value)" class="bg-white border border-blue-100 text-on-surface font-bold rounded-lg text-[13px] px-3 py-2 outline-none focus:border-primary shadow-sm" ${!divSelected ? 'disabled' : ''}>`;
    h += `<option value="" ${!teamSelected ? 'selected' : ''}>${divSelected ? '팀 선택' : '본부를 먼저 선택'}</option>`;
    wrFilteredTeams.forEach(t => {
        h += `<option value="${t.name}" ${STATE.weeklyReportTeamFilter===t.name ? 'selected' : ''}>${t.name}</option>`;
    });
    h += '</select></div>';

    if (!teamSelected) {
        return h + '<div class="bg-white/50 border border-dashed border-blue-200 h-32 rounded-xl flex items-center justify-center text-on-surface-variant font-bold text-[13px]">본부와 팀을 선택하면 구성원별 업무공유 현황이 표시됩니다.</div></div>';
    }
    if (!selectedPeriod || targetMembers.length===0) {
        return h + '<div class="bg-white/50 border border-dashed border-blue-200 h-32 rounded-xl flex items-center justify-center text-on-surface-variant font-bold text-[13px]">데이터가 없습니다.</div></div>';
    }
    const submittedCount = targetMembers.filter(m => STATE.weeklyReports.some(r =>
        r.user_id===m.user_id && r.year===selectedPeriod.year && r.month===selectedPeriod.month && r.week===selectedPeriod.week && r.content && r.content.trim()!==''
    )).length;
    h += '<div class="bg-white rounded-2xl border border-blue-50 shadow-sm px-5 py-4 mb-2 flex items-center gap-6">';
    h += '<div class="text-[13px] font-bold text-on-surface-variant">제출 현황</div>';
    h += `<div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-full bg-success"></div><span class="text-[13px] font-bold text-on-surface">제출완료 ${submittedCount}명</span></div>`;
    h += `<div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-full bg-surface-container-high border border-blue-100"></div><span class="text-[13px] font-bold text-on-surface-variant">미제출 ${targetMembers.length-submittedCount}명</span></div>`;
    h += '</div>';
    targetMembers.forEach((m, idx) => {
        const report = STATE.weeklyReports.find(r =>
            r.user_id===m.user_id && r.year===selectedPeriod.year && r.month===selectedPeriod.month && r.week===selectedPeriod.week && r.content && r.content.trim()!==''
        );
        const isMe = m.user_id===STATE.user.id;
        const submitted = !!report;
        h += `<div class="bg-white rounded-xl border ${submitted ? 'border-success/30' : 'border-blue-50'} shadow-sm overflow-hidden">`;
        h += `<div class="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-blue-50/40 transition-colors" onclick="document.getElementById('wr-detail-${idx}').classList.toggle('hidden')">`;
        h += '<div class="flex items-center gap-3">';
        if (submitted) {
            h += '<span class="flex items-center gap-1 px-2.5 py-1 bg-success/10 text-success text-[11px] font-bold rounded-full"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>제출완료</span>';
        } else {
            h += '<span class="px-2.5 py-1 bg-surface-container text-on-surface-variant text-[11px] font-bold rounded-full">미제출</span>';
        }
        h += `<div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[12px]">${m.name.charAt(0)}</div>`;
        h += `<div><span class="font-bold text-on-surface text-[14px]">${m.name}</span>`;
        if (isMe) h += '<span class="ml-2 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">나</span>';
        h += `<p class="text-[11px] text-on-surface-variant">${m.team||''} · ${m.position||''}</p></div></div>`;
        h += '<div class="flex items-center gap-3">';
        if (submitted && report.updated_at) {
            const fmt = new Date(report.updated_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
            h += `<span class="text-[11px] text-on-surface-variant/60 hidden lg:block">${fmt}</span>`;
        }
        if (isMe) {
            h += `<button onclick="event.stopPropagation();setWeeklyReportViewMode('my')" class="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white font-bold text-[12px] rounded-lg hover:bg-primary-dim transition-all shadow-sm">`;
            h += '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>작성하기</button>';
        }
        h += '<svg class="w-5 h-5 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>';
        h += '</div></div>';
        h += `<div id="wr-detail-${idx}" class="hidden border-t border-blue-50 px-5 py-4 bg-surface-container/30">`;
        if (submitted && report.content) {
            h += `<pre class="text-[13px] text-on-surface leading-relaxed whitespace-pre-wrap font-sans break-all">${report.content}</pre>`;
        } else {
            h += '<p class="text-[13px] text-on-surface-variant/60 font-medium">아직 작성된 업무공유가 없습니다.</p>';
        }
        h += '</div></div>';
    });
    h += '</div>';
    return h;
}

window.setWeeklyReportViewMode = function(mode) {
    STATE.weeklyReportViewMode = mode;
    renderCurrentView();
};

window.setWeeklyReportMonth = function(monthLabel) {
    const periods = generateWeeklyPeriods();
    const monthPeriods = periods.filter(p => p.monthLabel===monthLabel);
    if (monthPeriods.length > 0) {
        const already = monthPeriods.find(p => p.key===STATE.weeklyReportSelectedWeek);
        if (!already) STATE.weeklyReportSelectedWeek = monthPeriods[0].key;
    }
    renderCurrentView();
};

window.setWeeklyReportWeek = function(key) {
    STATE.weeklyReportSelectedWeek = key;
    renderCurrentView();
};

window.saveWeeklyReport = async function(periodKey) {
    const textarea = document.getElementById('weekly-report-content');
    if (!textarea) return;
    const content = textarea.value.trim();
    const periods = generateWeeklyPeriods();
    const period = periods.find(p => p.key===periodKey);
    if (!period) return;
    const member = STATE.members.find(m => m.user_id===STATE.user.id) || {};
    const now = new Date().toISOString();
    const existingReport = STATE.weeklyReports.find(r =>
        r.user_id===STATE.user.id && r.year===period.year && r.month===period.month && r.week===period.week
    );
    const btn = document.querySelector('[onclick*="saveWeeklyReport"]');
    if (btn) { btn.disabled=true; btn.textContent='저장 중...'; }
    try {
        if (existingReport) {
            await WeeklyReportAPI.update(existingReport.id, {content, updated_at: now});
            const idx = STATE.weeklyReports.findIndex(r => r.id===existingReport.id);
            if (idx !== -1) STATE.weeklyReports[idx] = {...existingReport, content, updated_at: now};
        } else {
            const created = await WeeklyReportAPI.create({
                report_id: 'wr-'+Date.now(), user_id: STATE.user.id,
                user_name: member.name||STATE.user.name||'', team: member.team||'', position: member.position||'',
                year: period.year, month: period.month, week: period.week,
                period_label: period.label, content, created_at: now, updated_at: now
            });
            STATE.weeklyReports.push({...created, content, updated_at: now});
        }
        renderCurrentView();
    } catch (error) {
        console.error('Error saving weekly report:', error);
        alert('저장 중 오류가 발생했습니다.');
        if (btn) { btn.disabled=false; btn.innerHTML='<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>저장'; }
    }
};

// --- Org Chart View ---
function renderOrgChart(container) {
    // divisions 기준으로 teams 그룹핑
    const divisions = STATE.divisions.filter(d => d.name !== '무소속');
    const teams = STATE.teams;
    const members = STATE.members.filter(m => !m.is_hidden);

    // CEO/CCO를 최상단에 표시
    const ceoMembers = members.filter(m => m.team === 'CEO,CCO' || m.position === '대표' || m.position === 'CCO');
    const ceoOnly = ceoMembers.filter(m => m.position === '대표');
    const ccoOnly = ceoMembers.filter(m => m.position === 'CCO');

    let h = '<div class="max-w-full mx-auto">';

    // CEO/CCO 최상단 - 별도 박스로 나란히
    if (ceoMembers.length > 0) {
        h += '<div class="flex justify-center items-center gap-6 mb-8">';
        // CEO 박스
        if (ceoOnly.length > 0) {
            h += '<div class="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-2xl px-8 py-5 text-center shadow-sm">';
            ceoOnly.forEach(m => {
                h += `<div class="text-[16px] font-black text-on-surface">${m.name}</div>`;
                h += `<div class="text-[12px] text-primary font-bold mt-1">${m.position} · ${m.job || ''}</div>`;
            });
            h += '</div>';
        }
        // 연결선 (가로)
        if (ceoOnly.length > 0 && ccoOnly.length > 0) {
            h += '<div class="w-8 h-px bg-blue-200"></div>';
        }
        // CCO 박스
        if (ccoOnly.length > 0) {
            h += '<div class="bg-gradient-to-br from-purple-50 to-purple-50/50 border-2 border-purple-200 rounded-2xl px-8 py-5 text-center shadow-sm">';
            ccoOnly.forEach(m => {
                h += `<div class="text-[16px] font-black text-on-surface">${m.name}</div>`;
                h += `<div class="text-[12px] text-purple-600 font-bold mt-1">${m.position} · ${m.job || ''}</div>`;
            });
            h += '</div>';
        }
        h += '</div>';
        // 연결선 (세로)
        h += '<div class="flex justify-center mb-4"><div class="w-px h-8 bg-blue-200"></div></div>';
    }

    // 본부별 가로 배치
    h += '<div class="grid grid-cols-1 lg:grid-cols-' + Math.min(divisions.length, 5) + ' gap-6">';

    divisions.forEach(div => {
        const divTeams = teams.filter(t => t.division === div.name && t.name !== div.name && t.name !== 'CEO,CCO');
        const divDirectMembers = members.filter(m => m.team === div.name && !ceoMembers.includes(m));

        h += '<div class="bg-white rounded-2xl border border-blue-50 shadow-sm overflow-hidden">';
        // 본부 헤더
        h += `<div class="bg-gradient-to-r from-primary/5 to-primary/10 px-5 py-4 border-b border-blue-50">`;
        h += `<div class="text-[15px] font-black text-on-surface">${div.name}</div>`;
        if (divDirectMembers.length > 0) {
            h += '<div class="mt-2 space-y-1">';
            divDirectMembers.forEach(m => {
                h += `<div class="text-[12px] text-on-surface-variant"><span class="font-bold text-on-surface">${m.name}</span> · ${m.position} · ${m.job || ''}</div>`;
            });
            h += '</div>';
        }
        h += '</div>';

        // 팀 목록
        if (divTeams.length > 0) {
            h += '<div class="p-4 space-y-3">';
            divTeams.forEach(t => {
                const teamMembers = members.filter(m => m.team === t.name && m.division === div.name);
                h += '<div class="bg-surface-container rounded-xl p-4 border border-blue-50">';
                h += `<div class="text-[13px] font-black text-primary mb-2">${t.name}</div>`;
                if (teamMembers.length > 0) {
                    h += '<div class="space-y-1.5">';
                    // 팀장 먼저, 멤버 나중에
                    const sorted = [...teamMembers].sort((a, b) => {
                        const order = { '대표': 0, '본부장': 1, '팀장': 2, '멤버': 3 };
                        return (order[a.position] || 9) - (order[b.position] || 9);
                    });
                    sorted.forEach(m => {
                        const posColor = m.position === '팀장' ? 'text-primary bg-primary/10' : 'text-on-surface-variant bg-surface-container-high';
                        h += `<div class="flex items-center gap-2">`;
                        h += `<span class="text-[10px] font-bold ${posColor} px-1.5 py-0.5 rounded">${m.position}</span>`;
                        h += `<span class="text-[13px] font-bold text-on-surface">${m.name}</span>`;
                        h += `<span class="text-[11px] text-on-surface-variant">${m.job || ''}</span>`;
                        h += '</div>';
                    });
                    h += '</div>';
                } else {
                    h += '<p class="text-[12px] text-on-surface-variant/60">구성원 없음</p>';
                }
                h += '</div>';
            });
            h += '</div>';
        } else {
            h += '<div class="p-4"><p class="text-[12px] text-on-surface-variant/60">팀 없음</p></div>';
        }
        h += '</div>';
    });

    h += '</div>'; // grid
    h += '</div>'; // max-w wrapper
    container.innerHTML = h;
}

// --- Admin Settings View ---
function renderAdminSettings(container) {
    const periods = STATE.periodSettings || [];
    const quarterlyPeriods = periods.filter(p => p.period_type === 'quarterly');
    const yearlyPeriods = periods.filter(p => p.period_type === 'yearly');

    function renderPeriodRow(p) {
        const openChecked = p.is_open ? 'checked' : '';
        const closedChecked = p.is_closed ? 'checked' : '';
        const statusText = !p.is_open && !p.is_closed ? '미오픈' : (p.is_open && !p.is_closed ? '입력 가능' : '마감');
        const statusColor = !p.is_open ? 'text-on-surface-variant bg-surface-container' : (p.is_closed ? 'text-error bg-error/10' : 'text-success bg-success/10');
        return `
            <div class="flex items-center justify-between bg-white rounded-xl border border-blue-50 shadow-sm px-5 py-4 mb-3">
                <div class="flex items-center gap-4">
                    <span class="text-[14px] font-bold text-on-surface min-w-[120px]">${p.label}</span>
                    <span class="text-[12px] font-bold ${statusColor} px-2.5 py-1 rounded-full">${statusText}</span>
                </div>
                <div class="flex items-center gap-6">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" ${openChecked} onchange="togglePeriodSetting(${p.id}, 'is_open', this.checked)" class="w-4 h-4 accent-primary">
                        <span class="text-[13px] font-bold text-on-surface-variant">시작</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" ${closedChecked} onchange="togglePeriodSetting(${p.id}, 'is_closed', this.checked)" class="w-4 h-4 accent-error">
                        <span class="text-[13px] font-bold text-on-surface-variant">마감</span>
                    </label>
                </div>
            </div>
        `;
    }

    let h = '<div class="max-w-3xl mx-auto">';
    h += '<div class="bg-white rounded-2xl border border-blue-50 shadow-sm p-6 mb-6">';
    h += '<h3 class="text-[16px] font-black text-on-surface mb-2">목표 입력 기간 관리</h3>';
    h += '<p class="text-[13px] text-on-surface-variant mb-6">시작 체크 시 구성원에게 해당 기간이 노출되며 입력 가능합니다. 마감 체크 시 조회만 가능하고 새 OKR 추가 및 체크인이 불가합니다.</p>';
    
    h += '<div class="mb-6">';
    h += '<h4 class="text-[14px] font-bold text-on-surface mb-3 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-primary"></span>분기별</h4>';
    h += quarterlyPeriods.map(renderPeriodRow).join('');
    h += '</div>';
    
    h += '<div>';
    h += '<h4 class="text-[14px] font-bold text-on-surface mb-3 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-purple-500"></span>연간</h4>';
    h += yearlyPeriods.map(renderPeriodRow).join('');
    h += '</div>';
    
    h += '</div>';

    // 피드백 열람 관리 박스
    h += '<div class="bg-white rounded-2xl border border-blue-50 shadow-sm p-6 mb-6">';
    h += '<h3 class="text-[16px] font-black text-on-surface mb-2">피드백 열람 관리</h3>';
    h += '<p class="text-[13px] text-on-surface-variant mb-6">구성원이 피드백을 열람할 수 있는 기간을 설정합니다. 열람 가능을 켜면 해당 기간의 피드백이 구성원에게 공개됩니다.</p>';

    function renderFeedbackRow(p) {
        const visibleChecked = p.feedback_visible ? 'checked' : '';
        const openDate = p.feedback_open_date ? p.feedback_open_date.slice(0, 16) : '';
        const closeDate = p.feedback_cloase_date ? p.feedback_cloase_date.slice(0, 16) : '';
        const statusText = p.feedback_visible ? '열람 가능' : '비공개';
        const statusColor = p.feedback_visible ? 'text-success bg-success/10' : 'text-on-surface-variant bg-surface-container';
        return `
            <div class="bg-white rounded-xl border border-blue-50 shadow-sm px-5 py-4 mb-3">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <span class="text-[14px] font-bold text-on-surface">${p.label}</span>
                        <span class="text-[12px] font-bold ${statusColor} px-2.5 py-1 rounded-full">${statusText}</span>
                    </div>
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" ${visibleChecked} onchange="toggleFeedbackVisible(${p.id}, this.checked)" class="w-4 h-4 accent-primary">
                        <span class="text-[13px] font-bold text-on-surface-variant">열람 가능</span>
                    </label>
                </div>
                <div class="flex items-center gap-4">
                    <div class="flex items-center gap-2">
                        <span class="text-[12px] text-on-surface-variant">시작</span>
                        <input type="datetime-local" value="${openDate}" onchange="updateFeedbackDate(${p.id}, 'feedback_open_date', this.value)" class="bg-surface-container border border-blue-50 rounded-lg px-3 py-1.5 text-[13px] text-on-surface outline-none focus:border-primary">
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-[12px] text-on-surface-variant">종료</span>
                        <input type="datetime-local" value="${closeDate}" onchange="updateFeedbackDate(${p.id}, 'feedback_cloase_date', this.value)" class="bg-surface-container border border-blue-50 rounded-lg px-3 py-1.5 text-[13px] text-on-surface outline-none focus:border-primary">
                    </div>
                </div>
            </div>
        `;
    }

    h += '<div class="mb-6">';
    h += '<h4 class="text-[14px] font-bold text-on-surface mb-3 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-primary"></span>분기별</h4>';
    h += quarterlyPeriods.map(renderFeedbackRow).join('');
    h += '</div>';

    h += '<div>';
    h += '<h4 class="text-[14px] font-bold text-on-surface mb-3 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-purple-500"></span>연간</h4>';
    h += yearlyPeriods.map(renderFeedbackRow).join('');
    h += '</div>';

    h += '</div>';

    h += '</div>';
    container.innerHTML = h;
}

window.togglePeriodSetting = async function(id, field, value) {
    try {
        const updateData = {};
        updateData[field] = value;
        await baserowFetch('/database/rows/table/2132/' + id + '/?user_field_names=true', {
            method: 'PATCH',
            body: JSON.stringify(updateData)
        });
        // STATE 업데이트
        const ps = STATE.periodSettings.find(p => p.id === id);
        if (ps) ps[field] = value;
        renderCurrentView();
    } catch (e) {
        console.error('Error updating period setting:', e);
        alert('설정 변경 중 오류가 발생했습니다.');
    }
};

window.toggleFeedbackVisible = async function(id, value) {
    try {
        await baserowFetch('/database/rows/table/2132/' + id + '/?user_field_names=true', {
            method: 'PATCH',
            body: JSON.stringify({ feedback_visible: value })
        });
        const ps = STATE.periodSettings.find(p => p.id === id);
        if (ps) ps.feedback_visible = value;
        renderCurrentView();
    } catch (e) {
        console.error('Error updating feedback visibility:', e);
        alert('피드백 열람 설정 변경 중 오류가 발생했습니다.');
    }
};

window.updateFeedbackDate = async function(id, field, value) {
    try {
        const updateData = {};
        updateData[field] = value ? new Date(value).toISOString() : null;
        await baserowFetch('/database/rows/table/2132/' + id + '/?user_field_names=true', {
            method: 'PATCH',
            body: JSON.stringify(updateData)
        });
        const ps = STATE.periodSettings.find(p => p.id === id);
        if (ps) ps[field] = value ? new Date(value).toISOString() : null;
    } catch (e) {
        console.error('Error updating feedback date:', e);
        alert('날짜 설정 변경 중 오류가 발생했습니다.');
    }
};

// --- R&R View ---
function renderRnR(container) {
    // If browse mode, render the browse view
    if (STATE.rnrViewMode === 'browse') {
        renderRnRBrowse(container);
        return;
    }
    
    // Get member info from STATE.members
    const memberInfo = STATE.members.find(m => m.name === STATE.user.name) || { name: STATE.user.name, team: '', position: '' };
    const myRnR = STATE.rnrData.find(r => r.user_id === STATE.user.id);
    
    const rnrStatus = myRnR ? myRnR.status : '작성중';
    const jobContent = myRnR ? (myRnR.job || '') : '';
    const rnrContent = myRnR ? (myRnR.rnr || myRnR.content || '') : '';
    const isAgreementComplete = rnrStatus === '합의 완료';
    const isPending = rnrStatus === '승인 대기중';
    const isRejected = myRnR && myRnR.reject_comment;
    
    let h = '<div class="max-w-4xl mx-auto">';
    
    // 페이지 헤더 with 구성원 JD/R&R 확인 버튼
    h += '<div class="flex items-center justify-between mb-6">';
    h += '<div></div>';
    h += '<button onclick="setRnrViewMode(\'browse\')" class="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold text-[13px] rounded-lg hover:bg-primary-dim transition-all shadow-sm">';
    h += '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>';
    h += '구성원 JD / R&R 확인하기';
    h += '</button>';
    h += '</div>';
    
    // 내 직무기술 & R&R 작성 섹션
    h += '<div class="bg-white rounded-2xl border border-blue-50 shadow-sm p-6 lg:p-8 mb-6">';
    h += '<div class="flex items-center gap-3 mb-6">';
    h += '<div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">';
    h += '<svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>';
    h += '</div>';
    h += '<h3 class="font-display text-xl font-bold text-on-surface">직무기술 / R&R 작성</h3>';
    h += '</div>';
    
    h += '<div class="space-y-4">';
    h += '<div class="grid lg:grid-cols-3 gap-4">';
    h += '<div>';
    h += '<label class="block text-[13px] font-bold text-on-surface-variant mb-2">이름</label>';
    h += '<input type="text" value="' + memberInfo.name + '" disabled class="w-full bg-surface-container border border-blue-100 rounded-lg px-4 py-2 text-[13px] text-on-surface cursor-not-allowed">';
    h += '</div>';
    h += '<div>';
    h += '<label class="block text-[13px] font-bold text-on-surface-variant mb-2">팀</label>';
    h += '<input type="text" value="' + memberInfo.team + '" disabled class="w-full bg-surface-container border border-blue-100 rounded-lg px-4 py-2 text-[13px] text-on-surface cursor-not-allowed">';
    h += '</div>';
    h += '<div>';
    h += '<label class="block text-[13px] font-bold text-on-surface-variant mb-2">직책</label>';
    h += '<input type="text" value="' + memberInfo.position + '" disabled class="w-full bg-surface-container border border-blue-100 rounded-lg px-4 py-2 text-[13px] text-on-surface cursor-not-allowed">';
    h += '</div>';
    h += '</div>';
    
    h += '<div>';
    h += '<div class="flex items-center gap-2 mb-2">';
    h += '<label class="block text-[13px] font-bold text-on-surface-variant">직무기술</label>';
    h += '<button onclick="showJobExample()" class="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold rounded-md transition-all border border-primary/20">예시 보기</button>';
    h += '</div>';
    h += '<textarea id="job-content" maxlength="2000" oninput="updateCharCount(\'job-content\', \'job-char-count\')" rows="6" class="w-full bg-white border border-blue-100 rounded-lg px-4 py-3 text-[13px] text-on-surface outline-none focus:border-primary resize-none leading-relaxed">' + jobContent + '</textarea>';
    h += '<div class="text-right mt-1 text-[11px] text-on-surface-variant" id="job-char-count">' + jobContent.length + ' / 2000</div>';
    h += '</div>';
    
    h += '<div>';
    h += '<div class="flex items-center gap-2 mb-2">';
    h += '<label class="block text-[13px] font-bold text-on-surface-variant">R&R</label>';
    h += '<button onclick="showRnRExample()" class="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold rounded-md transition-all border border-primary/20">예시 보기</button>';
    h += '</div>';
    h += '<textarea id="rnr-content" maxlength="2000" oninput="updateCharCount(\'rnr-content\', \'rnr-char-count\')" rows="6" class="w-full bg-white border border-blue-100 rounded-lg px-4 py-3 text-[13px] text-on-surface outline-none focus:border-primary resize-none leading-relaxed">' + rnrContent + '</textarea>';
    h += '<div class="text-right mt-1 text-[11px] text-on-surface-variant" id="rnr-char-count">' + rnrContent.length + ' / 2000</div>';
    h += '</div>';
    
    h += '<div class="flex justify-end gap-3">';
    if (isAgreementComplete) {
        h += '<button disabled class="bg-surface-container text-on-surface-variant px-6 py-2.5 rounded-lg font-bold text-[13px] cursor-not-allowed">합의 완료</button>';
        h += '<button onclick="requestRnRModification()" class="bg-primary text-white px-6 py-2.5 rounded-lg font-bold text-[13px] hover:bg-primary-dim transition-all shadow-sm">수정 요청</button>';
    } else if (isPending) {
        h += '<button disabled class="bg-surface-container text-on-surface-variant px-6 py-2.5 rounded-lg font-bold text-[13px] cursor-not-allowed">검토 중</button>';
        h += '<button onclick="cancelRnRRequest()" class="bg-error text-white px-6 py-2.5 rounded-lg font-bold text-[13px] hover:bg-error/90 transition-all shadow-sm">요청 취소</button>';
    } else if (isRejected) {
        h += '<button onclick="cancelRejectedRnRRequest()" class="bg-white border border-error text-error px-6 py-2.5 rounded-lg font-bold text-[13px] hover:bg-error/10 transition-all shadow-sm">요청 취소</button>';
        h += '<button onclick="requestRnRAgreement()" class="bg-primary text-white px-6 py-2.5 rounded-lg font-bold text-[13px] hover:bg-primary-dim transition-all shadow-sm">합의 요청</button>';
    } else {
        h += '<button onclick="requestRnRAgreement()" class="bg-primary text-white px-6 py-2.5 rounded-lg font-bold text-[13px] hover:bg-primary-dim transition-all shadow-sm">합의 요청</button>';
    }
    h += '</div>';
    
    // 거부 코멘트 표시
    if (isRejected) {
        h += '<div class="mt-4 bg-error/5 border border-error/20 rounded-lg p-4">';
        h += '<div class="flex items-start gap-3">';
        h += '<svg class="w-5 h-5 text-error flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
        h += '<div class="flex-1">';
        h += '<h4 class="font-bold text-error text-[14px] mb-2">요청이 거부되었습니다. 내용을 수정하여 다시 제출해 주세요.</h4>';
        h += '<p class="text-[13px] text-on-surface-variant font-bold mb-1">관리자 코멘트 :</p>';
        h += '<p class="text-[13px] text-on-surface leading-relaxed whitespace-pre-wrap">' + myRnR.reject_comment + '</p>';
        h += '</div>';
        h += '</div>';
        h += '</div>';
    }
    
    h += '</div>';
    h += '</div>';
    
    h += '</div>';
    container.innerHTML = h;
}

// R&R Browse View - 구성원 JD / R&R 확인하기
function renderRnRBrowse(container) {
    // 숨김 처리할 구성원 (베이스로우 데이터는 보존)
    const HIDDEN_MEMBERS = ['이다영', '이보란'];
    
    // Filter by team and exclude hidden/deleted members
    const activeUserIds = STATE.members.filter(m => !m.is_hidden).map(m => m.user_id);
    const filteredRnR = (STATE.rnrBrowseTeamFilter === 'all'
        ? STATE.rnrData
        : STATE.rnrData.filter(r => r.team === STATE.rnrBrowseTeamFilter))
        .filter(r => !HIDDEN_MEMBERS.includes(r.name) && activeUserIds.includes(r.user_id) && r.status === '합의 완료');
    
    let h = '<div class="max-w-4xl mx-auto">';
    
    // 헤더 with 돌아가기 버튼
    h += '<div class="flex items-center justify-between mb-6">';
    h += '<button onclick="setRnrViewMode(\'edit\')" class="flex items-center gap-2 px-4 py-2.5 bg-white border border-blue-100 text-on-surface font-bold text-[13px] rounded-lg hover:bg-blue-50 transition-all shadow-sm">';
    h += '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>';
    h += '내 JD / R&R 작성으로 돌아가기';
    h += '</button>';
    h += '<select onchange="setRnrBrowseTeamFilter(this.value)" class="bg-white border border-blue-100 text-on-surface font-bold rounded-lg text-[13px] px-3 py-2 outline-none focus:border-primary shadow-sm">';
    h += '<option value="all"' + (STATE.rnrBrowseTeamFilter === 'all' ? ' selected' : '') + '>전체 팀</option>';
    STATE.teams.forEach(function(team) { h += '<option value="' + team.name + '"' + (STATE.rnrBrowseTeamFilter === team.name ? ' selected' : '') + '>' + team.name + '</option>'; });
    h += '</select>';
    h += '</div>';
    
    // 구성원 목록
    h += '<div class="bg-white rounded-2xl border border-blue-50 shadow-sm p-6 lg:p-8">';
    h += '<div class="flex items-center justify-between mb-6">';
    h += '<div class="flex items-center gap-3">';
    h += '<div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">';
    h += '<svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>';
    h += '</div>';
    h += '<h3 class="font-display text-xl font-bold text-on-surface">구성원 JD / R&R 확인</h3>';
    h += '</div>';
    h += '<div class="text-[14px] font-bold text-on-surface-variant">총 <span class="text-primary font-black mx-1">' + filteredRnR.length + '</span>명</div>';
    h += '</div>';
    
    if (filteredRnR.length === 0) {
        h += '<div class="bg-white/50 border border-dashed border-blue-200 h-40 rounded-xl flex items-center justify-center text-on-surface-variant font-bold text-[13px] text-center p-4">해당 팀에 등록된 JD / R&R 데이터가 없습니다.</div>';
    } else {
        h += '<div class="space-y-4">';
        filteredRnR.forEach((rnr, idx) => {
            h += '<div class="bg-surface-container rounded-xl border border-blue-100 overflow-hidden">';
            h += '<div class="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-50/50 transition-colors" onclick="document.getElementById(\'rnr-browse-' + idx + '\').classList.toggle(\'hidden\')">';
            h += '<div class="flex items-center gap-3">';
            h += '<div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[14px]">' + rnr.name.charAt(0) + '</div>';
            h += '<div>';
            h += '<h4 class="font-bold text-on-surface text-[14px]">' + rnr.name + '</h4>';
            h += '<p class="text-[11px] text-on-surface-variant">' + (rnr.team || '') + ' · ' + (rnr.position || '') + '</p>';
            h += '</div>';
            h += '</div>';
            h += '<div class="flex items-center gap-2">';
            if (rnr.status === '합의 완료') {
                h += '<span class="px-3 py-1 bg-success/10 text-success text-[11px] font-bold rounded-full">합의 완료</span>';
            } else if (rnr.status === '승인 대기중') {
                h += '<span class="px-3 py-1 bg-warning/10 text-warning text-[11px] font-bold rounded-full">승인 대기중</span>';
            } else {
                h += '<span class="px-3 py-1 bg-surface-container-high text-on-surface-variant text-[11px] font-bold rounded-full">작성중</span>';
            }
            h += '<svg class="w-5 h-5 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>';
            h += '</div>';
            h += '</div>';
            h += '<div id="rnr-browse-' + idx + '" class="hidden px-4 pb-4">';
            
            if (rnr.job) {
                h += '<div class="mb-3">';
                h += '<label class="block text-[11px] font-bold text-on-surface-variant mb-1">직무기술</label>';
                h += '<div class="bg-white rounded-lg p-3 border border-blue-50">';
                h += '<p class="text-[13px] text-on-surface leading-relaxed whitespace-pre-wrap break-all">' + (rnr.job || '작성된 직무기술이 없습니다.') + '</p>';
                h += '</div>';
                h += '</div>';
            }
            
            h += '<div>';
            h += '<label class="block text-[11px] font-bold text-on-surface-variant mb-1">R&R</label>';
            h += '<div class="bg-white rounded-lg p-3 border border-blue-50">';
            h += '<p class="text-[13px] text-on-surface leading-relaxed whitespace-pre-wrap break-all">' + (rnr.rnr || rnr.content || '작성된 R&R이 없습니다.') + '</p>';
            h += '</div>';
            h += '</div>';
            h += '</div>';
            h += '</div>';
        });
        h += '</div>';
    }
    
    h += '</div>';
    h += '</div>';
    container.innerHTML = h;
}

// Update character count for textareas
window.updateCharCount = function(textareaId, counterId) {
    const textarea = document.getElementById(textareaId);
    const counter = document.getElementById(counterId);
    if (textarea && counter) {
        const length = textarea.value.length;
        counter.textContent = length + ' / 2000';
        
        // Change color based on length
        if (length < 300) {
            counter.classList.add('text-error');
            counter.classList.remove('text-on-surface-variant', 'text-success');
        } else if (length >= 300 && length < 2000) {
            counter.classList.add('text-success');
            counter.classList.remove('text-on-surface-variant', 'text-error');
        } else {
            counter.classList.add('text-on-surface-variant');
            counter.classList.remove('text-error', 'text-success');
        }
    }
};

// Show job description example
window.showJobExample = function() {
    const exampleContent = `
        <div class="space-y-5 max-h-[70vh] overflow-y-auto custom-scroll">
            <div class="bg-gradient-to-br from-primary/5 to-blue-50/50 rounded-xl p-5 border border-primary/10">
                <h4 class="font-bold text-on-surface text-[15px] mb-2">직무기술 작성 가이드</h4>
                <p class="text-[14px] text-on-surface-variant leading-relaxed">본인이 보유한 전문 역량과 실제 수행 가능한 업무의 범위를 구체적으로 작성해 주세요. 사용 가능한 툴과 숙련도를 포함하여 기술해 주시기 바랍니다.</p>
            </div>

            <div class="bg-white rounded-xl p-5 border border-blue-100">
                <h4 class="font-bold text-on-surface text-[15px] mb-4 flex items-center gap-2">
                    <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                    </svg>
                    백엔드 개발자 직무기술 예시
                </h4>

                <div class="mb-5">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="text-[13px] font-black text-white bg-primary px-3 py-1 rounded">핵심 기술 스택</span>
                    </div>
                    <div class="bg-surface-container rounded-lg p-4 text-[13px] text-on-surface leading-relaxed space-y-2">
                        <p>• <strong>백엔드 개발:</strong> Node.js(Express, NestJS), Python(FastAPI, Django), Java(Spring Boot) 기반 RESTful API 및 GraphQL 서버 설계 및 구축 가능</p>
                        <p>• <strong>데이터베이스:</strong> PostgreSQL, MySQL, MongoDB 등 관계형 및 NoSQL 데이터베이스 설계, 쿼리 최적화, 인덱싱 전략 수립 실무 경험 보유</p>
                        <p>• <strong>AWS 인프라:</strong> EC2, RDS, S3, Lambda, CloudFront, Route53, ECS/EKS 등 AWS 서비스를 활용한 클라우드 인프라 설계 및 운영 가능. Terraform을 통한 IaC(Infrastructure as Code) 구현 경험</p>
                    </div>
                </div>

                <div>
                    <div class="flex items-center gap-2 mb-3">
                        <span class="text-[13px] font-black text-white bg-success px-3 py-1 rounded">수행 가능 업무 범위</span>
                    </div>
                    <div class="bg-success/5 rounded-lg p-4 text-[13px] text-on-surface leading-relaxed space-y-2">
                        <p>• 마이크로서비스 아키텍처 설계 및 구현, Docker/Kubernetes 기반 컨테이너 오케스트레이션</p>
                        <p>• CI/CD 파이프라인 구축(GitHub Actions, Jenkins), 무중단 배포 전략 수립 및 실행</p>
                        <p>• 서버 모니터링 및 로깅 시스템 구축(CloudWatch, Datadog, ELK Stack)</p>
                        <p>• 보안 강화(JWT 인증, OAuth 2.0, API Rate Limiting, SQL Injection 방어)</p>
                        <p>• 성능 최적화(캐싱 전략, 쿼리 튜닝, 로드 밸런싱, CDN 활용)</p>
                        <p>• React, Vue.js를 활용한 풀스택 개발 가능, 프론트엔드와의 원활한 협업 및 API 문서화(Swagger, Postman)</p>
                    </div>
                </div>

                <p class="text-[11px] text-on-surface-variant mt-4 pt-3 border-t border-blue-100">
                    <strong>글자수:</strong> 약 820자 | 실무 수준의 기술 스택과 구체적인 업무 범위를 명시하여 작성
                </p>
            </div>
        </div>
    `;
    
    STATE.modalData = {
        title: '직무기술 작성 예시',
        content: exampleContent,
        onConfirm: null,
        isWide: true
    };
    renderModal(document.body);
};

// Show R&R example
window.showRnRExample = function() {
    const exampleContent = `
        <div class="space-y-5 max-h-[70vh] overflow-y-auto custom-scroll">
            <div class="bg-gradient-to-br from-primary/5 to-blue-50/50 rounded-xl p-5 border border-primary/10">
                <h4 class="font-bold text-on-surface text-[15px] mb-2">현재 vs 미래 구분 작성</h4>
                <p class="text-[14px] text-on-surface-variant leading-relaxed">이번 작성에서는 현재 수행 중인 과업과 앞으로 지향하는 목표를 아래와 같이 분리하여 입력해 주세요.</p>
                <div class="mt-3 space-y-2">
                    <div class="flex items-start gap-2">
                        <span class="text-[12px] font-black text-white bg-primary px-2 py-0.5 rounded flex-shrink-0">현재</span>
                        <p class="text-[13px] text-on-surface">지금 당장 내가 책임지고 수행하고 있는 실제 업무와 역할</p>
                    </div>
                    <div class="flex items-start gap-2">
                        <span class="text-[12px] font-black text-white bg-purple-600 px-2 py-0.5 rounded flex-shrink-0">미래</span>
                        <p class="text-[13px] text-on-surface">향후 도전하고 싶은 업무, 확장하고 싶은 전문성, 또는 본인의 커리어 목적성이 반영된 역할</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-xl p-5 border border-blue-100">
                <h4 class="font-bold text-on-surface text-[15px] mb-4 flex items-center gap-2">
                    <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    퍼포먼스 마케터 R&R 작성 예시
                </h4>

                <div class="mb-5">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="text-[13px] font-black text-white bg-primary px-3 py-1 rounded">현재 (As-Is)</span>
                    </div>
                    <div class="bg-surface-container rounded-lg p-4 text-[13px] text-on-surface leading-relaxed space-y-2">
                        <p><strong>1. 마케팅 믹스 전략 수립 및 예산 관리 (월 0.3 M/M)</strong></p>
                        <p>• 월간 마케팅 예산 배분 계획 수립 및 채널별 ROI 분석을 통한 최적 예산 분배</p>
                        <p>• 네이버 SA/DA, 메타, 구글 애즈 등 주요 매체별 예산 집행 및 성과 모니터링</p>
                        <p>• 주간 예산 소진율 및 CPA, ROAS 지표 추적, 월간 마케팅 성과 리포트 작성</p>
                        <p class="mt-3"><strong>2. 브랜드 캠페인 성과 관리 및 운영 (월 0.5 M/M)</strong></p>
                        <p>• 네이버 브랜드검색, 메타 브랜드 캠페인 기획 및 소재 제작 협업</p>
                        <p>• 주간 캠페인 성과 분석(CTR, CVR, CPC) 및 A/B 테스트를 통한 소재 최적화</p>
                        <p>• 실시간 입찰 전략 조정 및 타겟 오디언스 세그먼트 관리</p>
                        <p class="mt-3"><strong>3. 네이버 광고 운영 (SA/DA/쇼핑) (월 0.4 M/M)</strong></p>
                        <p>• 네이버 검색광고 키워드 발굴, 입찰가 조정, 품질지수 관리</p>
                        <p>• 네이버 디스플레이광고 소재 교체 및 타겟팅 최적화(주 2회)</p>
                        <p>• 네이버 쇼핑 광고 상품 등록 및 성과 개선</p>
                    </div>
                </div>

                <div>
                    <div class="flex items-center gap-2 mb-3">
                        <span class="text-[13px] font-black text-white bg-purple-600 px-3 py-1 rounded">미래 (To-Be)</span>
                    </div>
                    <div class="bg-purple-50/50 rounded-lg p-4 text-[13px] text-on-surface leading-relaxed space-y-2">
                        <p><strong>1. AI 기반 광고 자동화 시스템 구축 리드</strong></p>
                        <p>• AI 소재 생성 및 자동 최적화 파이프라인 설계, 크리에이티브 자동화 도입</p>
                        <p>• 예측 모델 기반 예산 자동 배분 시스템 기획 및 도입 주도</p>
                        <p class="mt-3"><strong>2. 그로스 마케팅 전략가로의 확장</strong></p>
                        <p>• 퍼포먼스 영역을 넘어 CRM, 리텐션 마케팅까지 포괄하는 풀퍼널 전략 수립</p>
                        <p>• 데이터 사이언스팀과 협업하여 고객 LTV 예측 모델 기반 마케팅 의사결정 체계 구축</p>
                        <p class="mt-3"><strong>3. 글로벌 마케팅 역량 확보</strong></p>
                        <p>• 해외 시장(중국, 동남아) 진출 시 현지 매체 운영 및 로컬라이징 전략 수립</p>
                        <p>• 글로벌 광고 플랫폼(TikTok Ads, WeChat 등) 운영 역량 확보</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    STATE.modalData = {
        title: 'R&R 작성 예시',
        content: exampleContent,
        onConfirm: null,
        isWide: true
    };
    renderModal(document.body);
};

window.requestRnRAgreement = async function() {
    const jobContent = document.getElementById('job-content').value.trim();
    const rnrContent = document.getElementById('rnr-content').value.trim();
    
    if (!jobContent && !rnrContent) {
        alert('직무기술 또는 R&R 내용을 입력해주세요.');
        return;
    }
    
    // Validate minimum character count
    if (jobContent && jobContent.length < 300) {
        alert('직무기술은 최소 300자 이상 입력해주세요.\n현재: ' + jobContent.length + '자');
        return;
    }
    
    if (rnrContent && rnrContent.length < 300) {
        alert('R&R은 최소 300자 이상 입력해주세요.\n현재: ' + rnrContent.length + '자');
        return;
    }
    
    // 코멘트 입력 모달 표시
    STATE.modalData = {
        title: '합의 요청',
        content: `
            <div class="space-y-4">
                <p class="text-[14px] text-on-surface-variant">합의 요청 시 추가할 코멘트를 입력하세요. (선택사항)</p>
                <textarea id="modal-comment" rows="4" class="w-full bg-white border border-blue-100 rounded-lg px-4 py-3 text-[13px] text-on-surface outline-none focus:border-primary resize-none" placeholder="코멘트 입력 (선택)"></textarea>
            </div>
        `,
        onConfirm: async () => {
            const comment = document.getElementById('modal-comment')?.value.trim() || '';
            
            try {
                const memberInfo = STATE.members.find(m => m.name === STATE.user.name) || { name: STATE.user.name, team: '', position: '' };
                const existingRnR = STATE.rnrData.find(r => r.user_id === STATE.user.id);
                
                // 직무기술 등록인지 R&R 등록인지 판단
                let requestType = '';
                if (jobContent && !rnrContent) requestType = '직무기술 등록';
                else if (!jobContent && rnrContent) requestType = 'R&R 등록';
                else requestType = '직무기술 & R&R 등록';
                
                if (existingRnR) {
                    // Update existing R&R
                    await RnRAPI.update(existingRnR.id, {
                        job: jobContent,
                        rnr: rnrContent,
                        content: rnrContent, // 하위 호환성
                        status: '승인 대기중',
                        request_type: requestType,
                        comment: comment,
                        reject_comment: null,
                        request_date: new Date().toISOString()
                    });
                    
                    existingRnR.job = jobContent;
                    existingRnR.rnr = rnrContent;
                    existingRnR.content = rnrContent;
                    existingRnR.status = '승인 대기중';
                    existingRnR.request_type = requestType;
                    existingRnR.comment = comment;
                    existingRnR.reject_comment = null;
                } else {
                    // Create new R&R
                    const newRnR = await RnRAPI.create({
                        user_id: STATE.user.id,
                        name: STATE.user.name,
                        team: memberInfo.team,
                        position: memberInfo.position,
                        job: jobContent,
                        rnr: rnrContent,
                        content: rnrContent,
                        status: '승인 대기중',
                        request_type: requestType,
                        temp_content: '',
                        comment: comment,
                        reject_comment: null,
                        request_date: new Date().toISOString()
                    });
                    
                    STATE.rnrData.push({
                        id: newRnR.id,
                        user_id: newRnR.user_id,
                        name: newRnR.name,
                        team: newRnR.team,
                        position: newRnR.position,
                        job: newRnR.job,
                        rnr: newRnR.rnr,
                        content: newRnR.content,
                        status: newRnR.status,
                        request_type: newRnR.request_type,
                        temp_content: newRnR.temp_content,
                        comment: newRnR.comment,
                        reject_comment: newRnR.reject_comment
                    });
                }
                
                STATE.modalData = null;
                alert('합의 요청이 제출되었습니다.');
                renderCurrentView();
            } catch (error) {
                console.error('Error submitting R&R:', error);
                alert('제출 중 오류가 발생했습니다.');
            }
        },
        isWide: false
    };
    renderCurrentView();
};

window.requestRnRModification = async function() {
    const newJobContent = document.getElementById('job-content').value.trim();
    const newRnRContent = document.getElementById('rnr-content').value.trim();
    
    if (!newJobContent && !newRnRContent) {
        alert('직무기술 또는 R&R 내용을 입력해주세요.');
        return;
    }
    
    // Validate minimum character count
    if (newJobContent && newJobContent.length < 300) {
        alert('직무기술은 최소 300자 이상 입력해주세요.\n현재: ' + newJobContent.length + '자');
        return;
    }
    
    if (newRnRContent && newRnRContent.length < 300) {
        alert('R&R은 최소 300자 이상 입력해주세요.\n현재: ' + newRnRContent.length + '자');
        return;
    }
    
    const existingRnR = STATE.rnrData.find(r => r.user_id === STATE.user.id);
    if (!existingRnR) return;
    
    if (existingRnR.job === newJobContent && (existingRnR.rnr || existingRnR.content) === newRnRContent) {
        alert('변경된 내용이 없습니다.');
        return;
    }
    
    // 코멘트 입력 모달 표시
    STATE.modalData = {
        title: '수정 요청',
        content: `
            <div class="space-y-4">
                <p class="text-[14px] text-on-surface-variant">수정 요청 시 추가할 코멘트를 입력하세요. (선택사항)</p>
                <textarea id="modal-comment" rows="4" class="w-full bg-white border border-blue-100 rounded-lg px-4 py-3 text-[13px] text-on-surface outline-none focus:border-primary resize-none" placeholder="코멘트 입력 (선택)"></textarea>
            </div>
        `,
        onConfirm: async () => {
            const comment = document.getElementById('modal-comment')?.value.trim() || '';
            
            try {
                // 직무기술 수정인지 R&R 수정인지 판단
                let requestType = '';
                const jobChanged = existingRnR.job !== newJobContent;
                const rnrChanged = (existingRnR.rnr || existingRnR.content) !== newRnRContent;
                
                if (jobChanged && !rnrChanged) requestType = '직무기술 수정';
                else if (!jobChanged && rnrChanged) requestType = 'R&R 수정';
                else requestType = '직무기술 & R&R 수정';
                
                // temp_content에 JSON 형태로 저장
                const tempData = JSON.stringify({
                    job: newJobContent,
                    rnr: newRnRContent
                });
                
                await RnRAPI.update(existingRnR.id, {
                    temp_content: tempData,
                    status: '승인 대기중',
                    request_type: requestType,
                    comment: comment,
                    reject_comment: null,
                    request_date: new Date().toISOString()
                });
                
                existingRnR.temp_content = tempData;
                existingRnR.status = '승인 대기중';
                existingRnR.request_type = requestType;
                existingRnR.comment = comment;
                existingRnR.reject_comment = null;
                
                STATE.modalData = null;
                alert('수정 요청이 제출되었습니다.');
                renderCurrentView();
            } catch (error) {
                console.error('Error requesting R&R modification:', error);
                alert('수정 요청 중 오류가 발생했습니다.');
            }
        },
        isWide: false
    };
    renderCurrentView();
};

window.cancelRnRRequest = async function() {
    if (!confirm('요청을 취소하시겠습니까?')) return;
    
    try {
        const existingRnR = STATE.rnrData.find(r => r.user_id === STATE.user.id);
        if (existingRnR) {
            if (existingRnR.request_type && existingRnR.request_type.includes('수정')) {
                // 수정 요청 취소 시 합의 완료 상태로 복귀
                await RnRAPI.update(existingRnR.id, {
                    status: '합의 완료',
                    request_type: null,
                    temp_content: '',
                    comment: '',
                    reject_comment: null
                });
                
                existingRnR.status = '합의 완료';
                existingRnR.request_type = null;
                existingRnR.temp_content = '';
                existingRnR.comment = '';
                existingRnR.reject_comment = null;
            } else {
                // 등록 요청 취소 시 R&R 삭제
                try {
                    await RnRAPI.delete(existingRnR.id);
                } catch (deleteError) {
                    // 이미 삭제된 경우 무시
                    if (!deleteError.message.includes('404') && !deleteError.message.includes('ERROR_ROW_DOES_NOT_EXIST')) {
                        throw deleteError;
                    }
                    console.log('R&R already deleted, continuing...');
                }
                
                // STATE에서도 제거
                STATE.rnrData = STATE.rnrData.filter(r => r.id !== existingRnR.id);
            }
            
            // Reload R&R data from Baserow to ensure state is fresh
            try {
                const rnrData = await RnRAPI.list();
                STATE.rnrData = rnrData.map(r => ({
                    id: r.id,
                    user_id: r.user_id,
                    name: r.name,
                    team: r.team,
                    position: r.position,
                    job: r.job,
                    rnr: r.rnr,
                    content: r.content,
                    status: r.status,
                    request_type: r.request_type,
                    temp_content: r.temp_content,
                    comment: r.comment,
                    reject_comment: r.reject_comment
                }));
            } catch (reloadError) {
                console.error('Error reloading R&R data:', reloadError);
            }
            
            alert('요청이 취소되었습니다.');
            renderCurrentView();
            updateNavigation();
        }
    } catch (error) {
        console.error('Error canceling R&R request:', error);
        alert('요청 취소 중 오류가 발생했습니다.');
    }
};

// Cancel rejected R&R request (delete from database)
window.cancelRejectedRnRRequest = async function() {
    if (!confirm('거부된 요청을 취소하시겠습니까?\n\n요청 데이터가 삭제되며, 처음부터 다시 작성해야 합니다.')) return;
    
    try {
        const existingRnR = STATE.rnrData.find(r => r.user_id === STATE.user.id);
        if (existingRnR) {
            // Delete R&R from Baserow
            try {
                await RnRAPI.delete(existingRnR.id);
            } catch (deleteError) {
                // 이미 삭제된 경우 무시
                if (!deleteError.message.includes('404') && !deleteError.message.includes('ERROR_ROW_DOES_NOT_EXIST')) {
                    throw deleteError;
                }
                console.log('R&R already deleted, continuing...');
            }
            
            // Remove from STATE
            STATE.rnrData = STATE.rnrData.filter(r => r.id !== existingRnR.id);
            
            // Reload R&R data from Baserow to ensure state is fresh
            try {
                const rnrData = await RnRAPI.list();
                STATE.rnrData = rnrData.map(r => ({
                    id: r.id,
                    user_id: r.user_id,
                    name: r.name,
                    team: r.team,
                    position: r.position,
                    job: r.job,
                    rnr: r.rnr,
                    content: r.content,
                    status: r.status,
                    request_type: r.request_type,
                    temp_content: r.temp_content,
                    comment: r.comment,
                    reject_comment: r.reject_comment,
                    request_date: r.request_date || null
                }));
            } catch (reloadError) {
                console.error('Error reloading R&R data:', reloadError);
            }
            
            alert('요청이 취소되었습니다.');
            renderCurrentView();
            updateNavigation();
        }
    } catch (error) {
        console.error('Error canceling rejected R&R request:', error);
        alert('요청 취소 중 오류가 발생했습니다.');
    }
};


// --- Initialize Login Page ---
async function initLoginPage() {
    try {
        console.log('Initializing login page...');
        
        // Check for existing session
        const sessionData = localStorage.getItem('okr_session');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                const sessionAge = Date.now() - session.timestamp;
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours
                
                // If session is valid (less than 24 hours old)
                if (sessionAge < maxAge && session.user) {
                    console.log('Restoring session for user:', session.user.name);
                    
                    // Restore user state
                    STATE.user = session.user;
                    
                    // Load data from Baserow
                    await loadDataFromBaserow();
                    // assessment already loaded inside loadDataFromBaserow
                    
                    // Update UI
                    document.getElementById('user-avatar').innerText = STATE.user.name.charAt(0);
                    document.getElementById('auth-user-name').innerText = STATE.user.name;
                    document.getElementById('division-label').innerText = '';
                    document.getElementById('login-view').classList.add('hidden');
                    document.getElementById('app-view').classList.remove('hidden');
                    
                    // Set default dashboard filter to user's division/team
                    if (STATE.user.division) STATE.dashboardDivisionFilter = STATE.user.division;
                    if (STATE.user.team) STATE.dashboardTeamFilter = STATE.user.team;
                    
                    // Handle initial route
                    handleInitialRoute();
                    
                    console.log('Session restored successfully');
                    return; // Skip login page initialization
                } else {
                    console.log('Session expired, clearing...');
                    localStorage.removeItem('okr_session');
                }
            } catch (sessionError) {
                console.error('Error restoring session:', sessionError);
                localStorage.removeItem('okr_session');
            }
        }
        
        // Load divisions for dropdown
        document.getElementById('login-view').classList.remove('hidden');
        const divisions = await DivisionsAPI.list();
        console.log('Loaded divisions for login:', divisions);
        
        const divisionSelect = document.getElementById('login-division');
        if (divisionSelect) {
            if (divisions && divisions.length > 0) {
                divisionSelect.innerHTML = divisions.map(div => 
                    `<option value="${div.name}">${div.name}</option>`
                ).join('');
                
                // Select first division by default
                divisionSelect.value = divisions[0].name;
                console.log('Divisions loaded successfully:', divisions.map(d => d.name).join(', '));
            } else {
                console.warn('No divisions found, using fallback');
                divisionSelect.innerHTML = '<option value="운영본부">운영본부</option><option value="경영지원본부">경영지원본부</option>';
            }
        }
    } catch (error) {
        console.error('Error loading divisions for login page:', error);
        // Use fallback divisions if API fails
        const divisionSelect = document.getElementById('login-division');
        if (divisionSelect) {
            divisionSelect.innerHTML = '<option value="운영본부">운영본부</option><option value="경영지원본부">경영지원본부</option>';
        }
    }
}

// Initialize login page when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoginPage);
} else {
    initLoginPage();
}


// --- AI Poll View ---
function renderAIPoll(container) {
    const h = `
        <div class="max-w-4xl mx-auto py-4 lg:py-6 px-2 lg:px-0">
            <div class="bg-white rounded-2xl border border-blue-50 shadow-sm p-4 lg:p-8">
                <div class="flex items-center gap-3 mb-4 lg:mb-6">
                    <div class="w-8 h-8 lg:w-10 lg:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg class="w-5 h-5 lg:w-6 lg:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                        </svg>
                    </div>
                    <h3 class="font-display text-lg lg:text-xl font-bold text-on-surface">AI 도구 활용 현황 설문</h3>
                </div>
                
                <p class="text-on-surface-variant text-[13px] lg:text-[14px] mb-2">
                    조직 내 AI 도구 활용 현황을 파악하여 더 나은 업무 환경을 만들기 위한 설문입니다.
                </p>
                
                <div class="bg-error/5 border border-error/20 rounded-lg p-3 lg:p-4 mb-4 lg:mb-6">
                    <p class="text-error text-[12px] lg:text-[13px] leading-relaxed">
                        현재 당사에는 <strong>Gemini, Google AI Studio, OpenAI, Midjourney</strong> 등 즉시 사용 가능한 환경이 구축되어 있습니다.<br/>
                        기존 구축된 환경 외에, 추가적으로 필요한 AI SaaS 서비스에 대해<br/>
                        필요도가 높은 실 사용자 대상으로 공동 구매 또는 세팅을 검토하고자 하오니 신중한 설문 부탁드립니다.
                    </p>
                </div>

                <form id="ai-poll-form" class="space-y-4 lg:space-y-6">
                    <!-- Q1: AI 도구 사용 빈도 -->
                    <div class="bg-surface-container rounded-xl p-4 lg:p-6">
                        <label class="block text-[13px] lg:text-[14px] font-bold text-on-surface mb-3">
                            Q1. 업무 중 AI 도구를 얼마나 자주 사용하고 계신가요? <span class="text-error">*</span>
                        </label>
                        <div class="space-y-2">
                            <label class="flex items-start gap-2 lg:gap-3 p-2.5 lg:p-3 bg-white rounded-lg border border-blue-100 hover:border-primary cursor-pointer transition-all">
                                <input type="radio" name="q1_frequency" value="거의 사용하지 않음" required class="w-4 h-4 text-primary mt-0.5 flex-shrink-0">
                                <span class="text-[13px] lg:text-[14px] text-on-surface">거의 사용하지 않음 (거의 다시 사용하지 않음)</span>
                            </label>
                            <label class="flex items-start gap-2 lg:gap-3 p-2.5 lg:p-3 bg-white rounded-lg border border-blue-100 hover:border-primary cursor-pointer transition-all">
                                <input type="radio" name="q1_frequency" value="월 1-2회" required class="w-4 h-4 text-primary mt-0.5 flex-shrink-0">
                                <span class="text-[14px] text-on-surface">월 1-2회 (특정 작업에만 활용)</span>
                            </label>
                            <label class="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-100 hover:border-primary cursor-pointer transition-all">
                                <input type="radio" name="q1_frequency" value="주 3-4회" required class="w-4 h-4 text-primary">
                                <span class="text-[14px] text-on-surface">주 3-4회 (필요한 경우에 적극적으로 활용)</span>
                            </label>
                            <label class="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-100 hover:border-primary cursor-pointer transition-all">
                                <input type="radio" name="q1_frequency" value="주 1-3회 이상" required class="w-4 h-4 text-primary">
                                <span class="text-[14px] text-on-surface">주 1-3회 이상 (거의 매일 사용)</span>
                            </label>
                            <label class="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-100 hover:border-primary cursor-pointer transition-all">
                                <input type="radio" name="q1_frequency" value="매일 지속적으로 사용" required class="w-4 h-4 text-primary">
                                <span class="text-[14px] text-on-surface">매일 지속적으로 사용</span>
                            </label>
                        </div>
                    </div>

                    <!-- Q2: 주로 사용하는 AI 도구 (복수 선택) -->
                    <!-- Q2: 주로 사용하는 AI 도구 (복수 선택) -->
                    <div class="bg-surface-container rounded-xl p-4 lg:p-6">
                        <label class="block text-[13px] lg:text-[14px] font-bold text-on-surface mb-3">
                            Q2. 업무에서 주로 활용하는 AI 도구는 무엇인가요? (복수 선택 가능) <span class="text-error">*</span>
                        </label>
                        <div class="space-y-2">
                            <label class="flex items-start gap-2 lg:gap-3 p-2.5 lg:p-3 bg-white rounded-lg border border-blue-100 hover:border-primary cursor-pointer transition-all">
                                <input type="checkbox" name="q2_tools" value="GPT, Gemini" class="w-4 h-4 text-primary rounded mt-0.5 flex-shrink-0">
                                <span class="text-[13px] lg:text-[14px] text-on-surface">GPT, Gemini : 문서 작성, 번역, 일반적인 질의응답</span>
                            </label>
                            <label class="flex items-start gap-2 lg:gap-3 p-2.5 lg:p-3 bg-white rounded-lg border border-blue-100 hover:border-primary cursor-pointer transition-all">
                                <input type="checkbox" name="q2_tools" value="Google AI Studio, Open AI" class="w-4 h-4 text-primary rounded mt-0.5 flex-shrink-0">
                                <span class="text-[13px] lg:text-[14px] text-on-surface">Google AI Studio, Open AI : 프롬프트 테스트, 더 깊은 활용</span>
                            </label>
                            <label class="flex items-start gap-2 lg:gap-3 p-2.5 lg:p-3 bg-white rounded-lg border border-blue-100 hover:border-primary cursor-pointer transition-all">
                                <input type="checkbox" name="q2_tools" value="Claude" class="w-4 h-4 text-primary rounded mt-0.5 flex-shrink-0">
                                <span class="text-[13px] lg:text-[14px] text-on-surface">Claude (Desktop/Code) : 멀티턴, 자료, 개발 환경 통합 및 활용</span>
                            </label>
                            <label class="flex items-start gap-2 lg:gap-3 p-2.5 lg:p-3 bg-white rounded-lg border border-blue-100 hover:border-primary cursor-pointer transition-all">
                                <input type="checkbox" name="q2_tools" value="Cursor, AmazonQ" class="w-4 h-4 text-primary rounded mt-0.5 flex-shrink-0">
                                <span class="text-[13px] lg:text-[14px] text-on-surface">Cursor, AmazonQ 등 : AI 기반 코드 작성 및 개발 생산성 향상</span>
                            </label>
                            <label class="flex items-start gap-2 lg:gap-3 p-2.5 lg:p-3 bg-white rounded-lg border border-blue-100 hover:border-primary cursor-pointer transition-all">
                                <input type="checkbox" name="q2_tools" value="Antigravity, Codex" class="w-4 h-4 text-primary rounded mt-0.5 flex-shrink-0">
                                <span class="text-[13px] lg:text-[14px] text-on-surface">Antigravity, Codex 등 : AI 기반 생산성 향상</span>
                            </label>
                            <div class="flex items-start gap-2 lg:gap-3 p-2.5 lg:p-3 bg-white rounded-lg border border-blue-100">
                                <input type="checkbox" name="q2_tools" value="기타" class="w-4 h-4 text-primary rounded mt-0.5 flex-shrink-0" id="q2_other_check">
                                <span class="text-[13px] lg:text-[14px] text-on-surface flex-shrink-0">기타:</span>
                                <input type="text" id="q2_other_text" placeholder="직접 입력"
                                    class="flex-1 min-w-0 bg-surface-container border border-blue-100 rounded px-2 lg:px-3 py-1 lg:py-1.5 text-[12px] lg:text-[13px] focus:outline-none focus:border-primary">
                            </div>
                        </div>
                    </div>

                    <!-- Q3: 배우고 싶은 AI 도구 -->
                    <div class="bg-surface-container rounded-xl p-4 lg:p-6">
                        <label class="block text-[13px] lg:text-[14px] font-bold text-on-surface mb-3">
                            Q3. 업무에 도입하면 즉각적으로 도움이 될 것 같아 배워서 빠르게 활용하고 싶은 AI 도구가 있다면 말씀해 주세요. <span class="text-error">*</span>
                        </label>
                        <input type="text" id="q3_wanttool" required
                            class="w-full bg-white border border-blue-100 rounded-lg px-3 lg:px-4 py-2.5 lg:py-3 text-[13px] lg:text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                            placeholder="예: Claude, Cursor, Notion AI 등" maxlength="100">
                    </div>

                    <!-- Q4: AI 도구 효과성 평가 (5점 척도) -->
                    <!-- Q4: AI 도구 효과성 평가 (5점 척도) -->
                    <div class="bg-surface-container rounded-xl p-4 lg:p-6">
                        <label class="block text-[13px] lg:text-[14px] font-bold text-on-surface mb-3">
                            Q4. 업무 중 사용한 AI 도구가 실제 효과적이라고 느끼는 정도는 어느 정도인가요? (5점 척도) <span class="text-error">*</span>
                        </label>
                        <div class="grid grid-cols-3 lg:flex lg:items-center lg:justify-between gap-2">
                            <label class="lg:flex-1 text-center cursor-pointer">
                                <input type="radio" name="q4_effectiveness" value="1" required class="peer sr-only">
                                <div class="p-2 lg:p-4 bg-white rounded-lg border-2 border-blue-100 peer-checked:border-primary peer-checked:bg-primary/5 transition-all">
                                    <div class="text-xl lg:text-2xl mb-1">😞</div>
                                    <div class="text-[10px] lg:text-[12px] font-bold text-on-surface leading-tight">전혀<br class="lg:hidden"/>효과<br class="lg:hidden"/>없음</div>
                                </div>
                            </label>
                            <label class="lg:flex-1 text-center cursor-pointer">
                                <input type="radio" name="q4_effectiveness" value="2" required class="peer sr-only">
                                <div class="p-2 lg:p-4 bg-white rounded-lg border-2 border-blue-100 peer-checked:border-primary peer-checked:bg-primary/5 transition-all">
                                    <div class="text-xl lg:text-2xl mb-1">😐</div>
                                    <div class="text-[10px] lg:text-[12px] font-bold text-on-surface">별로</div>
                                </div>
                            </label>
                            <label class="lg:flex-1 text-center cursor-pointer">
                                <input type="radio" name="q4_effectiveness" value="3" required class="peer sr-only">
                                <div class="p-2 lg:p-4 bg-white rounded-lg border-2 border-blue-100 peer-checked:border-primary peer-checked:bg-primary/5 transition-all">
                                    <div class="text-xl lg:text-2xl mb-1">😊</div>
                                    <div class="text-[10px] lg:text-[12px] font-bold text-on-surface">보통</div>
                                </div>
                            </label>
                            <label class="lg:flex-1 text-center cursor-pointer">
                                <input type="radio" name="q4_effectiveness" value="4" required class="peer sr-only">
                                <div class="p-2 lg:p-4 bg-white rounded-lg border-2 border-blue-100 peer-checked:border-primary peer-checked:bg-primary/5 transition-all">
                                    <div class="text-xl lg:text-2xl mb-1">😄</div>
                                    <div class="text-[10px] lg:text-[12px] font-bold text-on-surface">효과적</div>
                                </div>
                            </label>
                            <label class="lg:flex-1 text-center cursor-pointer">
                                <input type="radio" name="q4_effectiveness" value="5" required class="peer sr-only">
                                <div class="p-2 lg:p-4 bg-white rounded-lg border-2 border-blue-100 peer-checked:border-primary peer-checked:bg-primary/5 transition-all">
                                    <div class="text-xl lg:text-2xl mb-1">🤩</div>
                                    <div class="text-[10px] lg:text-[12px] font-bold text-on-surface leading-tight">매우<br class="lg:hidden"/>효과적</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Q4: AI 도구 활용 시 가장 큰 장점 -->
                    <!-- Q5: AI 도구 활용 시 가장 큰 장점 -->
                    <div class="bg-surface-container rounded-xl p-4 lg:p-6">
                        <label class="block text-[13px] lg:text-[14px] font-bold text-on-surface mb-3">
                            Q5. AI 도구 활용 시 느끼는 가장 큰 장점이나 개선점은 무엇인가요? (복수 선택 가능) <span class="text-error">*</span>
                        </label>
                        <div class="space-y-2">
                            <label class="flex items-start gap-2 lg:gap-3 p-2.5 lg:p-3 bg-white rounded-lg border border-blue-100 hover:border-primary cursor-pointer transition-all">
                                <input type="checkbox" name="q5_benefit" value="시간 및 비용 절감" class="w-4 h-4 text-primary rounded mt-0.5 flex-shrink-0">
                                <span class="text-[13px] lg:text-[14px] text-on-surface">시간 및 비용 절감 : 반복 작업을 빠르게 처리할 수 있어 효율 향상</span>
                            </label>
                            <label class="flex items-start gap-2 lg:gap-3 p-2.5 lg:p-3 bg-white rounded-lg border border-blue-100 hover:border-primary cursor-pointer transition-all">
                                <input type="checkbox" name="q5_benefit" value="정보의 정확성" class="w-4 h-4 text-primary rounded mt-0.5 flex-shrink-0">
                                <span class="text-[13px] lg:text-[14px] text-on-surface">정보의 정확성 : 환각(Hallucination) 문제가 있지만 대체로 신뢰할 만함</span>
                            </label>
                            <label class="flex items-start gap-2 lg:gap-3 p-2.5 lg:p-3 bg-white rounded-lg border border-blue-100 hover:border-primary cursor-pointer transition-all">
                                <input type="checkbox" name="q5_benefit" value="접근 및 사용성" class="w-4 h-4 text-primary rounded mt-0.5 flex-shrink-0">
                                <span class="text-[13px] lg:text-[14px] text-on-surface">접근 및 사용성 : 무료 버전(Pro/Team 등) 사용 가능 편리</span>
                            </label>
                            <label class="flex items-start gap-2 lg:gap-3 p-2.5 lg:p-3 bg-white rounded-lg border border-blue-100 hover:border-primary cursor-pointer transition-all">
                                <input type="checkbox" name="q5_benefit" value="업무 범위 확장" class="w-4 h-4 text-primary rounded mt-0.5 flex-shrink-0">
                                <span class="text-[13px] lg:text-[14px] text-on-surface">업무 범위 확장 : 프로젝트 작성이나 더 활용도가 높은 업무</span>
                            </label>
                            <label class="flex items-start gap-2 lg:gap-3 p-2.5 lg:p-3 bg-white rounded-lg border border-blue-100 hover:border-primary cursor-pointer transition-all">
                                <input type="checkbox" name="q5_benefit" value="기술적 한계" class="w-4 h-4 text-primary rounded mt-0.5 flex-shrink-0">
                                <span class="text-[13px] lg:text-[14px] text-on-surface">기술적 한계 : 복잡한 반복 시스템과의 통합 불가</span>
                            </label>
                        </div>
                    </div>

                    <!-- Q6: 향후 확대 희망 분야 (복수 선택) -->
                    <div class="bg-surface-container rounded-xl p-4 lg:p-6">
                        <label class="block text-[13px] lg:text-[14px] font-bold text-on-surface mb-3">
                            Q6. 향후 어떤 분야에서 AI 도구 활용이 확대되기를 원하시나요? (복수 선택 가능) <span class="text-error">*</span>
                        </label>
                        <div class="space-y-2">
                            <label class="flex items-start gap-2 lg:gap-3 p-2.5 lg:p-3 bg-white rounded-lg border border-blue-100 hover:border-primary cursor-pointer transition-all">
                                <input type="checkbox" name="q6_expansion" value="개발자 환경 통합 도구" class="w-4 h-4 text-primary rounded mt-0.5 flex-shrink-0">
                                <span class="text-[13px] lg:text-[14px] text-on-surface">개발자 환경 통합 도구 (클라우드 코드 등)</span>
                            </label>
                            <label class="flex items-start gap-2 lg:gap-3 p-2.5 lg:p-3 bg-white rounded-lg border border-blue-100 hover:border-primary cursor-pointer transition-all">
                                <input type="checkbox" name="q6_expansion" value="RAG 시스템 도입" class="w-4 h-4 text-primary rounded mt-0.5 flex-shrink-0">
                                <span class="text-[13px] lg:text-[14px] text-on-surface">RAG 시스템 도입 : 우리 회사 데이터를 학습하는 AI</span>
                            </label>
                            <label class="flex items-start gap-2 lg:gap-3 p-2.5 lg:p-3 bg-white rounded-lg border border-blue-100 hover:border-primary cursor-pointer transition-all">
                                <input type="checkbox" name="q6_expansion" value="교육 및 워크숍" class="w-4 h-4 text-primary rounded mt-0.5 flex-shrink-0">
                                <span class="text-[13px] lg:text-[14px] text-on-surface">교육 및 워크숍 : 정기 교육을 프로젝트 진행하여 활용</span>
                            </label>
                            <label class="flex items-start gap-2 lg:gap-3 p-2.5 lg:p-3 bg-white rounded-lg border border-blue-100 hover:border-primary cursor-pointer transition-all">
                                <input type="checkbox" name="q6_expansion" value="업무 자동화 도구" class="w-4 h-4 text-primary rounded mt-0.5 flex-shrink-0">
                                <span class="text-[13px] lg:text-[14px] text-on-surface">업무 자동화 도구 : AI가 단순 반복 작업을 대신 처리하는 워크플로우 구축</span>
                            </label>
                            <div class="flex items-start gap-2 lg:gap-3 p-2.5 lg:p-3 bg-white rounded-lg border border-blue-100">
                                <input type="checkbox" name="q6_expansion" value="기타" class="w-4 h-4 text-primary rounded mt-0.5 flex-shrink-0" id="q6_other_check">
                                <span class="text-[13px] lg:text-[14px] text-on-surface flex-shrink-0">기타:</span>
                                <input type="text" id="q6_other_text" placeholder="직접 입력"
                                    class="flex-1 min-w-0 bg-surface-container border border-blue-100 rounded px-2 lg:px-3 py-1 lg:py-1.5 text-[12px] lg:text-[13px] focus:outline-none focus:border-primary">
                            </div>
                        </div>
                    </div>

                    <!-- Q7: 업무 프로세스 AI 도입 의견 -->
                    <div class="bg-surface-container rounded-xl p-4 lg:p-6">
                        <label class="block text-[13px] lg:text-[14px] font-bold text-on-surface mb-3">
                            Q7. 현재 업무 프로세스 중 "이 부분은 AI가 도입되면 훨씬 좋겠다"는 생각이 드는 부분이 있다면 구체적으로 말씀해주세요. <span class="text-error">*</span>
                        </label>
                        <textarea id="q7_process" required rows="4"
                            class="w-full bg-white border border-blue-100 rounded-lg px-3 lg:px-4 py-2.5 lg:py-3 text-[13px] lg:text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                            placeholder="예: 반복적인 데이터 입력 작업, 고객 문의 응답 자동화 등" maxlength="500"></textarea>
                        <div class="text-right text-[11px] lg:text-[12px] text-on-surface-variant mt-1">최대 500자</div>
                    </div>

                    <!-- Q8: 추가 의견 -->
                    <div class="bg-surface-container rounded-xl p-4 lg:p-6">
                        <label class="block text-[13px] lg:text-[14px] font-bold text-on-surface mb-3">
                            Q8. 향후 팀 AI 활용 활성화를 위해 회사 차원에서 지원해주었으면 하는 것이 있다면 자유롭게 의견을 남겨주세요. <span class="text-error">*</span>
                        </label>
                        <textarea id="q8_suggestion" required rows="4"
                            class="w-full bg-white border border-blue-100 rounded-lg px-3 lg:px-4 py-2.5 lg:py-3 text-[13px] lg:text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                            placeholder="예: 유료 AI 도구 구독 지원, 정기 교육 프로그램 등" maxlength="500"></textarea>
                        <div class="text-right text-[11px] lg:text-[12px] text-on-surface-variant mt-1">최대 500자</div>
                    </div>

                    <!-- 제출 버튼 -->
                    <div class="flex gap-3 pt-2 lg:pt-4">
                        <button type="submit" class="flex-1 bg-gradient-to-br from-primary to-primary-dim text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity text-[13px] lg:text-[14px]">
                            설문 제출하기
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    container.innerHTML = h;
    
    // Form submission handler
    const form = document.getElementById('ai-poll-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitAIPoll();
    });
    
    // Handle "기타" checkbox for Q2
    const q2OtherCheck = document.getElementById('q2_other_check');
    const q2OtherText = document.getElementById('q2_other_text');
    q2OtherCheck.addEventListener('change', () => {
        if (!q2OtherCheck.checked) {
            q2OtherText.value = '';
        }
    });
    
    // Handle "기타" checkbox for Q6
    const q6OtherCheck = document.getElementById('q6_other_check');
    const q6OtherText = document.getElementById('q6_other_text');
    q6OtherCheck.addEventListener('change', () => {
        if (!q6OtherCheck.checked) {
            q6OtherText.value = '';
        }
    });
}

// Submit AI Poll
async function submitAIPoll() {
    try {
        // Collect form data
        const q1_frequency = document.querySelector('input[name="q1_frequency"]:checked')?.value;
        
        // Q2: Collect all checked tools
        const q2_tools_checkboxes = document.querySelectorAll('input[name="q2_tools"]:checked');
        let q2_tools = Array.from(q2_tools_checkboxes).map(cb => cb.value);
        
        // Add "기타" text if checked
        const q2_other_check = document.getElementById('q2_other_check');
        const q2_other_text = document.getElementById('q2_other_text').value.trim();
        if (q2_other_check.checked && q2_other_text) {
            q2_tools = q2_tools.filter(t => t !== '기타');
            q2_tools.push(`기타: ${q2_other_text}`);
        }
        
        const q3_wanttool = document.getElementById('q3_wanttool').value.trim();
        const q4_effectiveness = document.querySelector('input[name="q4_effectiveness"]:checked')?.value;
        
        // Q5: Collect all checked benefits
        const q5_benefit_checkboxes = document.querySelectorAll('input[name="q5_benefit"]:checked');
        let q5_benefit = Array.from(q5_benefit_checkboxes).map(cb => cb.value);
        
        // Q6: Collect all checked expansion areas
        const q6_expansion_checkboxes = document.querySelectorAll('input[name="q6_expansion"]:checked');
        let q6_expansion = Array.from(q6_expansion_checkboxes).map(cb => cb.value);
        
        // Add "기타" text if checked
        const q6_other_check = document.getElementById('q6_other_check');
        const q6_other_text = document.getElementById('q6_other_text').value.trim();
        if (q6_other_check.checked && q6_other_text) {
            q6_expansion = q6_expansion.filter(t => t !== '기타');
            q6_expansion.push(`기타: ${q6_other_text}`);
        }
        
        const q7_process = document.getElementById('q7_process').value.trim();
        const q8_suggestion = document.getElementById('q8_suggestion').value.trim();
        
        // Validation
        if (!q1_frequency) {
            alert('AI 도구 사용 빈도를 선택해주세요.');
            return;
        }
        if (q2_tools.length === 0) {
            alert('주로 사용하는 AI 도구를 하나 이상 선택해주세요.');
            return;
        }
        if (!q3_wanttool) {
            alert('배우고 싶은 AI 도구를 입력해주세요.');
            return;
        }
        if (!q4_effectiveness) {
            alert('AI 도구 효과성을 평가해주세요.');
            return;
        }
        if (q5_benefit.length === 0) {
            alert('AI 도구 활용 시 가장 큰 장점을 하나 이상 선택해주세요.');
            return;
        }
        if (q6_expansion.length === 0) {
            alert('향후 확대 희망 분야를 하나 이상 선택해주세요.');
            return;
        }
        if (!q7_process) {
            alert('업무 프로세스 AI 도입 의견을 입력해주세요.');
            return;
        }
        if (!q8_suggestion) {
            alert('추가 의견을 입력해주세요.');
            return;
        }
        
        // Create poll data
        const pollData = {
            user_id: STATE.user.id,
            user_name: STATE.user.name,
            team: STATE.user.team,
            frequency: q1_frequency,
            tools: q2_tools.join(', '),
            wanttool: q3_wanttool,
            effectiveness: parseInt(q4_effectiveness),
            benefit: q5_benefit.join(', '),
            expansion: q6_expansion.join(', '),
            process_opinion: q7_process,
            suggestion: q8_suggestion,
            submitted_at: new Date().toISOString()
        };
        
        // Debug logging
        console.log('STATE.user:', STATE.user);
        console.log('Poll data being submitted:', pollData);
        
        // Submit to Baserow
        await PollAPI.create(pollData);
        
        alert('설문이 성공적으로 제출되었습니다. 감사합니다!');
        
        // Reset form
        document.getElementById('ai-poll-form').reset();
        
    } catch (error) {
        console.error('Error submitting AI poll:', error);
        alert('설문 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}


// Show/Hide signup view
window.showSignupView = async function() {
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('signup-view').classList.remove('hidden');
    
    // Load divisions and teams for signup
    try {
        // Load divisions
        if (STATE.divisions.length === 0) {
            STATE.divisions = await DivisionsAPI.list();
        }
        
        // Load teams
        if (STATE.teams.length === 0) {
            STATE.teams = await TeamsAPI.list();
        }
        
        // Populate division dropdown
        const divisionSelect = document.getElementById('signup-division');
        divisionSelect.innerHTML = '<option value="">본부 선택</option>' + 
            STATE.divisions.map(division => `<option value="${division.name}">${division.name}</option>`).join('');
        
        const teamSelect = document.getElementById('signup-team');
        
        // Add event listener for division change to filter teams
        divisionSelect.addEventListener('change', function() {
            const selectedDivision = this.value;
            
            if (!selectedDivision) {
                teamSelect.innerHTML = '<option value="">팀 선택</option>';
                teamSelect.disabled = true;
                return;
            }
            
            // Filter teams by selected division
            const filteredTeams = STATE.teams.filter(team => team.division === selectedDivision);
            
            teamSelect.innerHTML = '<option value="">팀 선택</option>' + 
                filteredTeams.map(team => `<option value="${team.name}">${team.name}</option>`).join('');
            teamSelect.disabled = false;
        });
        
        // Initialize team select as disabled
        teamSelect.innerHTML = '<option value="">팀 선택</option>';
        teamSelect.disabled = true;
        
    } catch (error) {
        console.error('Error loading divisions and teams:', error);
    }
};

window.showLoginView = function() {
    document.getElementById('signup-view').classList.add('hidden');
    document.getElementById('login-view').classList.remove('hidden');
};

// Signup form submission
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const passwordConfirm = document.getElementById('signup-password-confirm').value;
    const division = document.getElementById('signup-division').value;
    const team = document.getElementById('signup-team').value;
    const job = document.getElementById('signup-job').value.trim();
    
    // Validation
    if (!name || !email || !password || !passwordConfirm || !division || !team || !job) {
        alert('모든 필드를 입력해주세요.');
        return;
    }
    
    if (password !== passwordConfirm) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }
    
    if (password.length < 4) {
        alert('비밀번호는 최소 4자 이상이어야 합니다.');
        return;
    }
    
    // Extract user_id from email (part before @)
    const emailParts = email.split('@');
    if (emailParts.length !== 2) {
        alert('올바른 이메일 형식이 아닙니다.');
        return;
    }
    const user_id = emailParts[0];
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = '가입 처리 중...';
    submitBtn.disabled = true;
    
    try {
        // Check if user_id already exists
        if (STATE.members.length === 0) {
            STATE.members = await MembersAPI.list();
        }
        
        const existingMember = STATE.members.find(m => m.user_id === user_id);
        if (existingMember) {
            alert('이미 사용 중인 아이디입니다. 다른 이메일을 사용해주세요.');
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
            return;
        }
        
        // Create new member
        const newMember = {
            name: name,
            email: email,
            user_id: user_id,
            password: password,
            division: division,
            team: team,
            job: job,
            position: '멤버',
            is_approved: false,
            is_hidden: false
        };
        
        await MembersAPI.create(newMember);
        
        alert('회원가입 신청이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.');
        
        // Reset form and go back to login
        document.getElementById('signup-form').reset();
        showLoginView();
        
        // Pre-fill login form
        document.getElementById('login-id').value = user_id;
        document.getElementById('login-division').value = division;
        
    } catch (error) {
        console.error('Signup error:', error);
        alert('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
});
