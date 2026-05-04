// --- State & Config ---
const STATE = {
    user: null, // { id: 'master'|'member', name: '...', role: 'admin'|'user', division: '운영본부' }
    currentView: 'dashboard',
    
    // Tab states
    dashboardTab: 'monthly',
    dashboardPeriodValue: '',
    
    goalsSetTab: 'monthly',
    goalsSetPeriodValue: '',
    
    goalsManageTab: 'monthly',
    goalsManagePeriodValue: '',
    
    requestsTab: 'monthly',
    requestsPeriodValue: '',
    
    // Modal State
    modalData: null, // { title: '', content: '', onConfirm: null, isWide: false }
    
    // Members filter state
    membersTeamFilter: 'all', // 'all' or team name
    
    // Divisions Data (loaded from Baserow)
    divisions: [],
    
    // Teams Data (loaded from Baserow)
    teams: [],
    
    // Members Data (loaded from Baserow)
    members: [],
    
    // R&R Data (loaded from Baserow)
    rnrData: [],
    
    // All Goals Data (loaded from Baserow)
    allGoals: [],
    
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
async function loadDataFromBaserow() {
    try {
        console.log('Loading data from Baserow...');
        
        // Load divisions
        try {
            STATE.divisions = await DivisionsAPI.list();
            console.log('Loaded divisions:', STATE.divisions.length, STATE.divisions);
        } catch (error) {
            console.error('Error loading divisions:', error);
            console.warn('Using fallback divisions data');
            STATE.divisions = [{ id: 1, name: '운영본부' }];
        }
        
        // Load teams
        try {
            STATE.teams = await TeamsAPI.list();
            console.log('Loaded teams:', STATE.teams.length, STATE.teams);
        } catch (error) {
            console.error('Error loading teams:', error);
            console.warn('Using fallback teams data');
            STATE.teams = [
                { id: 1, name: 'DX팀' },
                { id: 2, name: 'MD팀' },
                { id: 3, name: 'CX팀' },
                { id: 4, name: '디자인팀' },
                { id: 5, name: '물류팀' }
            ];
        }
        
        // Load members
        try {
            STATE.members = await MembersAPI.list();
            console.log('Loaded members:', STATE.members.length, STATE.members);
        } catch (error) {
            console.error('Error loading members:', error);
            console.warn('Using fallback members data');
            STATE.members = [
                { id: 1, name: '김전략', division: '운영본부', team: 'DX팀', position: '리더', email: 'kim.strategy@childy.com', user_id: 'member', password: '1111' },
                { id: 2, name: '박성공', division: '운영본부', team: 'DX팀', position: '멤버', email: 'park.success@childy.com', user_id: 'member2', password: '1111' },
                { id: 3, name: '이혁신', division: '운영본부', team: 'MD팀', position: '리더', email: 'lee.innovation@childy.com', user_id: 'member3', password: '1111' },
                { id: 4, name: '최효율', division: '운영본부', team: 'MD팀', position: '멤버', email: 'choi.efficiency@childy.com', user_id: 'member4', password: '1111' }
            ];
        }
        
        // Load R&R
        try {
            const rnrList = await RnRAPI.list();
            STATE.rnrData = rnrList.map(rnr => ({
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
            console.log('Loaded R&R:', STATE.rnrData.length, STATE.rnrData);
        } catch (error) {
            console.error('Error loading R&R:', error);
            console.warn('Using fallback R&R data (empty)');
            STATE.rnrData = [];
        }
        
        // Load goals
        // Load goals
        try {
            const goals = await GoalsAPI.list();
            console.log('Loaded goals:', goals.length, goals);
            
            // Load key results for each goal
            STATE.allGoals = [];
            for (const goal of goals) {
                try {
                    const keyResults = await KeyResultsAPI.listByGoalId(goal.id);
                    console.log(`Loaded ${keyResults.length} key results for goal ${goal.id}`);
                    
                    // Parse temp_kr if it exists
                    let tempKeyResults = undefined;
                    if (goal.temp_kr) {
                        try {
                            tempKeyResults = JSON.parse(goal.temp_kr);
                        } catch (e) {
                            console.error('Error parsing temp_kr:', e);
                        }
                    }
                    
                    STATE.allGoals.push({
                        id: goal.id,
                        userId: goal.user_id,
                        periodType: goal.period_type,
                        periodValue: goal.period_value,
                        text: goal.OKR || '',  // Use OKR field from goals table
                        keyResults: keyResults.map(kr => ({
                            id: kr.kr_id,
                            text: kr.KR || '',  // Use KR field from key_results table
                            progress: parseInt(kr.progress) || 0
                        })),
                        status: goal.status,
                        requestType: goal.request_type || null,
                        comment: goal.comment || '',
                        isProcessed: goal.is_processed || false,
                        tempText: goal.temp_text || undefined,
                        tempKeyResults: tempKeyResults,
                        reject_comment: goal.reject_comment || null,
                        request_date: goal.request_date || null
                    });
                } catch (error) {
                    console.error(`Error loading key results for goal ${goal.id}:`, error);
                }
            }
        } catch (error) {
            console.error('Error loading goals:', error);
            console.warn('Using fallback goals data');
            STATE.allGoals = [
                { 
                    id: 101, 
                    userId: 'member', 
                    periodType: 'monthly', 
                    periodValue: '2026-04', 
                    text: '전사 UI/UX 품질 혁신', 
                    keyResults: [
                        { id: 'kr101-1', text: '핵심 화면 모듈화 100% 달성', progress: 40 },
                        { id: 'kr101-2', text: '사용자 피드백 만족도 4.5 이상 확보', progress: 20 }
                    ],
                    status: '합의 완료', 
                    requestType: null, 
                    comment: '', 
                    isProcessed: true 
                },
                { 
                    id: 201, 
                    userId: 'member2', 
                    periodType: 'monthly', 
                    periodValue: '2026-04', 
                    text: '고객 만족도 향상 프로젝트', 
                    keyResults: [
                        { id: 'kr201-1', text: 'CS 응답 시간 30% 단축', progress: 55 },
                        { id: 'kr201-2', text: '고객 만족도 점수 4.2 이상 달성', progress: 65 }
                    ],
                    status: '합의 완료', 
                    requestType: null, 
                    comment: '', 
                    isProcessed: true 
                }
            ];
        }
        
        console.log('All data loaded successfully');
        console.log('Final STATE:', {
            divisions: STATE.divisions.length,
            teams: STATE.teams.length,
            members: STATE.members.length,
            rnrData: STATE.rnrData.length,
            allGoals: STATE.allGoals.length
        });
        STATE.isLoading = false;
        
    } catch (error) {
        console.error('Critical error loading data from Baserow:', error);
        console.error('Error details:', error.message, error.stack);
        
        // Use complete fallback data
        console.warn('Using complete fallback data due to critical error');
        STATE.divisions = [{ id: 1, name: '운영본부' }];
        STATE.teams = [
            { id: 1, name: 'DT전략팀' },
            { id: 2, name: '개발팀' },
            { id: 3, name: '디자인팀' },
            { id: 4, name: '마케팅팀' }
        ];
        STATE.members = [
            { id: 1, name: '김전략', division: '운영본부', team: 'DX팀', position: '리더', email: 'kim.strategy@childy.com', user_id: 'member', password: '1111' },
            { id: 2, name: '박성공', division: '운영본부', team: 'DX팀', position: '멤버', email: 'park.success@childy.com', user_id: 'member2', password: '1111' },
            { id: 3, name: '이혁신', division: '운영본부', team: 'MD팀', position: '리더', email: 'lee.innovation@childy.com', user_id: 'member3', password: '1111' },
            { id: 4, name: '최효율', division: '운영본부', team: 'MD팀', position: '멤버', email: 'choi.efficiency@childy.com', user_id: 'member4', password: '1111' }
        ];
        STATE.rnrData = [];
        STATE.allGoals = [
            { 
                id: 101, 
                userId: 'member', 
                periodType: 'monthly', 
                periodValue: '2026-04', 
                text: '전사 UI/UX 품질 혁신', 
                keyResults: [
                    { id: 'kr101-1', text: '핵심 화면 모듈화 100% 달성', progress: 40 },
                    { id: 'kr101-2', text: '사용자 피드백 만족도 4.5 이상 확보', progress: 20 }
                ],
                status: '합의 완료', 
                requestType: null, 
                comment: '', 
                isProcessed: true 
            }
        ];
        
        STATE.isLoading = false;
        alert('Baserow 연결 실패. 임시 데이터로 작동합니다.\n\n오류: ' + error.message + '\n\n브라우저 콘솔을 확인해주세요.');
    }
}

// --- Initialization ---
function getDefaultPeriodValue(type) {
    const d = new Date();
    const currYear = d.getFullYear() > 2025 ? d.getFullYear() : 2026;
    if(type === 'monthly') return `${currYear}-${String(d.getMonth()+1).padStart(2, '0')}`;
    if(type === 'quarterly') return `${currYear}-Q${Math.floor(d.getMonth()/3)+1}`;
    return `${currYear}`;
}

function initDates() {
    STATE.dashboardPeriodValue = getDefaultPeriodValue('monthly');
    STATE.goalsSetPeriodValue = getDefaultPeriodValue('monthly');
    STATE.goalsManagePeriodValue = getDefaultPeriodValue('monthly');
    STATE.requestsPeriodValue = getDefaultPeriodValue('monthly');
}
initDates();

// --- Helpers ---
function getPeriodLabel(type, value) {
    if(!value) return '알 수 없음';
    if (type === 'monthly') return `${value.split('-')[0]}년 ${value.split('-')[1]}월`;
    if (type === 'quarterly') return `${value.split('-')[0]}년 ${value.split('-')[1]}분기`;
    if (type === 'yearly') return `${value}년`;
    return value;
}

// Ensure temp structures exist for Manage tab
function ensureTempStructures(goal) {
    if(goal.status === '합의 완료' && !goal.tempKeyResults) {
        goal.tempKeyResults = JSON.parse(JSON.stringify(goal.keyResults));
    }
}

// --- Menu Configuration ---
const MENU_ITEMS = [
    { id: 'dashboard', label: '대시보드', icon: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['admin', 'user'], path: '/dashboard' },
    { id: 'goals_manage', label: '내 목표 관리', icon: '<path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['user', 'admin'], path: '/goals-manage' },
    { id: 'goals_set', label: '목표 설정 및 합의', icon: '<path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['user', 'admin'], path: '/goals-set' },
    { id: 'rnr', label: '직무기술 / R&R', icon: '<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['user', 'admin'], path: '/rnr' },
    { id: 'requests', label: '요청 관리', icon: '<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['admin'], path: '/requests' },
    { id: 'members', label: '구성원 관리', icon: '<path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['admin'], path: '/members' },
    { id: 'guide', label: 'OKR 가이드', icon: '<path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['admin', 'user'], path: '/guide' },
    { id: 'ai_poll', label: '설문조사', icon: '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['admin', 'user'], path: '/ai-poll' }
];

// --- URL Routing ---
function navigateTo(viewId, updateHistory = true) {
    const menuItem = MENU_ITEMS.find(m => m.id === viewId);
    if (!menuItem) {
        console.error('Invalid view:', viewId);
        return;
    }
    
    // Check if user has permission
    if (STATE.user && !menuItem.roles.includes(STATE.user.role)) {
        console.warn('User does not have permission for view:', viewId);
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

window.openModal = function(title, content, onConfirmAction = null, isWide = false) {
    STATE.modalData = { title, content, onConfirmAction, isWide };
    renderCurrentView();
};
window.closeModal = function() {
    STATE.modalData = null;
    renderCurrentView();
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
        if(isTempObj) {
            ensureTempStructures(goal); // Ensure temp structures exist
            const kr = goal.tempKeyResults.find(k => k.id === krId);
            if(kr) kr.text = val;
        } else {
            const kr = goal.keyResults.find(k => k.id === krId);
            if(kr) kr.text = val;
        }
    }
};

window.updateKRProgress = function(okrId, krId, val) {
    const goal = STATE.allGoals.find(g => g.id == okrId); // Use == for type coercion
    if(goal) {
        ensureTempStructures(goal); // Ensure temp structures exist
        if(goal.tempKeyResults) {
            const kr = goal.tempKeyResults.find(k => k.id === krId);
            if(kr) {
                kr.progress = parseInt(val);
                const el = document.getElementById(`kr-prog-val-${krId}`);
                if(el) el.innerText = val + '%';
            }
        }
    }
};

window.addKR = function(okrId, isTempObj = false) {
    const goal = STATE.allGoals.find(g => g.id === okrId);
    if(goal) {
        if(isTempObj) {
            ensureTempStructures(goal);
            goal.tempKeyResults.push({ id: 'kr-' + Date.now() + Math.random().toString(36), text: '', progress: 0 });
        } else {
            goal.keyResults.push({ id: 'kr-' + Date.now() + Math.random().toString(36), text: '', progress: 0 });
        }
        renderCurrentView();
    }
};

window.removeKR = function(okrId, krId, isTempObj = false) {
    const goal = STATE.allGoals.find(g => g.id === okrId);
    if(goal) {
        if(isTempObj) {
            ensureTempStructures(goal);
            if(goal.tempKeyResults.length > 1) {
                goal.tempKeyResults = goal.tempKeyResults.filter(k => k.id !== krId);
            }
        } else {
            if(goal.keyResults.length > 1) {
                goal.keyResults = goal.keyResults.filter(k => k.id !== krId);
            }
        }
        renderCurrentView();
    }
};

window.addOKR = function(timestamp_salt = 0) {
    // Create OKR only in local STATE, not in Baserow yet
    const newId = 'temp-' + Date.now() + timestamp_salt;
    
    STATE.allGoals.push({
        id: newId,
        userId: STATE.user.id,
        periodType: STATE.goalsSetTab,
        periodValue: STATE.goalsSetPeriodValue,
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
    if(goal.keyResults.some(k => !k.text.trim())) { alert('모든 Key Results 내용을 입력하세요.'); return; }
    
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
                const existingKR = existingKRs.find(k => k.kr_id === kr.id);
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
                if (!goal.keyResults.find(k => k.id === existingKR.kr_id)) {
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
        const oKr = oldKRs.find(k => k.id === nKr.id);
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

    if(edits.length === 0) { alert('변경사항이 없습니다.'); return; }

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
            }
            
            await GoalsAPI.update(id, updateData);
            
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
            await GoalsAPI.update(id, {
                OKR: goal.text,  // Save OKR to goals table
                status: '합의 완료',
                temp_text: null,  // Clear temp_text
                temp_kr: null,  // Clear temp_kr
                is_processed: true,
                request_type: null,
                reject_comment: null,
                comment: goal.comment || ''
            });
            
            // Update key results in Baserow - use the UPDATED goal.keyResults
            const existingKRs = await KeyResultsAPI.listByGoalId(id);
            
            // Update or create each KR
            for (const kr of goal.keyResults) {
                const existingKR = existingKRs.find(k => k.kr_id === kr.id);
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
                if (!goal.keyResults.find(k => k.id === existingKR.kr_id)) {
                    await KeyResultsAPI.delete(existingKR.id);
                }
            }
            
            // Clear temp data
            goal.tempText = undefined;
            goal.tempKeyResults = undefined;
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
                        // For new requests, delete from Baserow and revert to local-only
                        const krs = await KeyResultsAPI.listByGoalId(id);
                        for (const kr of krs) {
                            await KeyResultsAPI.delete(kr.id);
                        }
                        await GoalsAPI.delete(id);
                        
                        // Revert to local-only state
                        goal.id = 'temp-' + Date.now();
                        goal.isLocalOnly = true;
                        goal.status = '작성중';
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

window.undoApproval = function(id) {
    const goal = STATE.allGoals.find(g => g.id === id);
    if(goal) {
        // Need to undo? Technically complex since data was overwritten.
        // As a mock feature, we just mark it unprocessed. In real DB, we'd need history.
        goal.isProcessed = false;
        renderCurrentView();
        updateNavigation();
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
                        // For new requests, delete the entry but keep reject comment
                        await RnRAPI.update(id, {
                            status: '작성중',
                            request_type: null,
                            temp_content: '',
                            comment: '',
                            reject_comment: rejectComment
                        });
                        
                        rnr.status = '작성중';
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

    MENU_ITEMS.forEach(item => {
        if (!item.roles.includes(STATE.user.role)) return;
        
        let badgeHtml = '';
        if(item.id === 'requests' && pendingReqCount > 0) {
            badgeHtml = `<span class="bg-error text-white text-[11px] font-black w-5 h-5 flex items-center justify-center rounded-full ml-auto shadow-sm">${pendingReqCount}</span>`;
        }

        const btn = document.createElement('button');
        const isActive = STATE.currentView === item.id;
        btn.className = `flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-bold transition-all w-full ${isActive ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container'}`;
        btn.innerHTML = `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">${item.icon}</svg> ${item.label} ${badgeHtml}`;
        btn.onclick = () => navigateTo(item.id);
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
    
    if (STATE.currentView === 'dashboard') renderDashboard(content);
    else if (STATE.currentView === 'goals_set') renderGoalsSet(content);
    else if (STATE.currentView === 'goals_manage') renderGoalsManage(content);
    else if (STATE.currentView === 'requests') renderRequests(content);
    else if (STATE.currentView === 'members') renderMembers(content);
    else if (STATE.currentView === 'rnr') renderRnR(content);
    else if (STATE.currentView === 'guide') renderGuide(content);
    else if (STATE.currentView === 'ai_poll') renderAIPoll(content);
    
    if (STATE.modalData) renderModal(document.body);
    else {
        const modal = document.getElementById('app-modal');
        if(modal) modal.remove();
    }
}

function generatePeriodOptions(tab, selectedValue) {
    let html = '';
    const d = new Date();
    const currYear = d.getFullYear() > 2025 ? d.getFullYear() : 2026;
    if (tab === 'monthly') {
        const startMonth = STATE.currentView === 'dashboard' ? 1 : (d.getMonth() + 1);
        for(let m = startMonth; m <= 12; m++) {
            let val = `${currYear}-${String(m).padStart(2, '0')}`;
            html += `<option value="${val}" ${selectedValue === val ? 'selected' : ''}>${currYear}년 ${m}월</option>`;
        }
    } else if (tab === 'quarterly') {
        const startQ = STATE.currentView === 'dashboard' ? 1 : (Math.floor(d.getMonth()/3)+1);
        for(let q = startQ; q <= 4; q++) html += `<option value="${currYear}-Q${q}" ${selectedValue === `${currYear}-Q${q}` ? 'selected' : ''}>${currYear}년 ${q}분기</option>`;
    } else if (tab === 'yearly') {
        html += `<option value="${currYear}" ${selectedValue === String(currYear) ? 'selected':''}>${currYear}년</option><option value="${currYear+1}" ${selectedValue === String(currYear+1) ? 'selected':''}>${currYear+1}년</option>`;
    }
    return html;
}

// Rendering Views
function renderDashboard(container) {
    const relevantGoals = STATE.allGoals.filter(g => g.periodType === STATE.dashboardTab && g.periodValue === STATE.dashboardPeriodValue && g.status !== '작성중');
    let users = {};
    relevantGoals.forEach(g => { if(!users[g.userId]) users[g.userId] = []; users[g.userId].push(g); });
    if(STATE.user.role !== 'admin') {
        const filtered = {};
        if(users[STATE.user.id]) filtered[STATE.user.id] = users[STATE.user.id];
        users = filtered;
    }

    const isMobile = window.innerWidth < 1024;
    
    let h = '<div class="flex items-center gap-4 lg:gap-8 border-b-2 border-blue-50 mb-6 px-2 w-full overflow-x-auto">';
    h += '<button onclick="setTab(\'dashboard\', \'monthly\')" class="pb-3 text-sm lg:text-lg transition-all whitespace-nowrap ' + (STATE.dashboardTab === 'monthly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary') + '">월별</button>';
    h += '<button onclick="setTab(\'dashboard\', \'quarterly\')" class="pb-3 text-sm lg:text-lg transition-all whitespace-nowrap ' + (STATE.dashboardTab === 'quarterly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary') + '">분기별</button>';
    h += '<button onclick="setTab(\'dashboard\', \'yearly\')" class="pb-3 text-sm lg:text-lg transition-all whitespace-nowrap ' + (STATE.dashboardTab === 'yearly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary') + '">연간</button>';
    h += '</div>';
    h += '<div class="mb-4 w-full flex items-center justify-between gap-3">';
    h += '<select onchange="setPeriod(\'dashboard\', this.value)" class="w-full lg:w-auto bg-surface-container text-primary font-bold border border-blue-50 rounded-lg text-[13px] px-3 py-1.5 outline-none">';
    h += generatePeriodOptions(STATE.dashboardTab, STATE.dashboardPeriodValue);
    h += '</select>';
    h += '<div class="flex items-center gap-2">';
    h += '<button onclick="toggleAllDashboardOKRs(true)" class="px-4 py-1.5 bg-white border border-blue-100 text-primary font-bold text-[13px] rounded-lg hover:bg-blue-50 transition-all shadow-sm whitespace-nowrap">모두 열기</button>';
    h += '<button onclick="toggleAllDashboardOKRs(false)" class="px-4 py-1.5 bg-white border border-blue-100 text-primary font-bold text-[13px] rounded-lg hover:bg-blue-50 transition-all shadow-sm whitespace-nowrap">모두 닫기</button>';
    h += '</div>';
    h += '</div>';

    if(Object.keys(users).length === 0) {
        h += '<div class="bg-white/50 border border-dashed border-blue-200 h-40 lg:h-64 rounded-xl lg:rounded-2xl flex items-center justify-center text-on-surface-variant font-bold text-[12px] lg:text-[13px] text-center p-4">표시할 목표 데이터가 없습니다.</div>';
    } else if(isMobile) {
        h += renderDashboardMobile(container, users);
    } else {
        for(let uid in users) {
            const name = USER_NAMES[uid] || uid;
            const uGoals = users[uid];
            h += '<div class="mb-10"><div class="flex items-center gap-3 mb-4 ml-2">';
            h += '<div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shadow-sm">' + name.charAt(0) + '</div>';
            h += '<span class="font-extrabold text-on-surface text-[14px]">' + name + '</span></div>';
            
            uGoals.forEach(g => {
                const avgProgress = Math.round(g.keyResults.reduce((sum, kr) => sum + kr.progress, 0) / g.keyResults.length);
                const progressColor = avgProgress === 100 ? 'bg-success' : avgProgress >= 50 ? 'bg-primary' : 'bg-gray-400';
                
                h += '<div class="bg-white rounded-2xl border border-blue-50 shadow-sm overflow-hidden mb-4">';
                h += '<div class="bg-gradient-to-r from-primary/5 to-primary/10 px-6 py-4 border-b border-blue-50 cursor-pointer hover:bg-primary/10 transition-colors" onclick="toggleDashboardOKR(' + g.id + ')">';
                h += '<div class="flex items-center justify-between">';
                h += '<div class="flex items-center gap-3 flex-1">';
                h += '<svg id="toggle-icon-' + g.id + '" class="w-5 h-5 text-primary transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>';
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
                h += '</div></div></div>';
            });
            
            h += '</div>';
        }
    }
    container.innerHTML = h;
}

window.toggleDashboardOKR = function(okrId) {
    const content = document.getElementById('okr-content-' + okrId);
    const icon = document.getElementById('toggle-icon-' + okrId);
    if (content && icon) {
        content.classList.toggle('hidden');
        icon.classList.toggle('rotate-180');
    }
};

window.toggleAllDashboardOKRs = function(open) {
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
            icon.classList.add('rotate-180');
        } else {
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
        const isEditable = g.status === '작성중';
        const isPending = g.status.includes('대기중');

        let opHtml = '';
        if(isEditable) {
            opHtml = `
                <div class="flex flex-col items-center gap-2 px-1">
                    <button onclick="submitOKRRequest('${g.id}')" class="w-full bg-primary text-white py-2 px-2 rounded-lg text-[13px] font-bold shadow-sm hover:scale-[1.02] transition-transform">승인 요청</button>
                    <button onclick="removeOKR('${g.id}')" class="w-full bg-surface-container text-on-surface-variant py-2 px-2 rounded-lg text-[13px] font-bold hover:bg-error hover:text-white transition-colors border border-blue-50">삭제</button>
                </div>
            `;
        } else if(isPending) {
            opHtml = `
                <div class="flex flex-col items-center gap-2 px-1">
                    <span class="text-on-surface-variant text-[13px] font-bold">승인 대기중</span>
                    <button onclick="cancelOKRRequest('${g.id}')" class="w-full text-error border border-error hover:bg-error/10 py-1.5 rounded-lg text-[12px] font-bold transition-colors">요청 취소</button>
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
                    <div class="flex flex-col gap-3">
                        ${g.keyResults.map((kr, kri) => `
                            <div class="flex group items-center gap-2">
                                <input type="text" value="${kr.text}" oninput="updateKRTitle('${g.id}', '${kr.id}', this.value)" ${!isEditable?'disabled':''} class="flex-1 bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-medium text-on-surface outline-none focus:border-primary disabled:bg-surface-container-low shadow-sm transition-all">
                                ${isEditable && g.keyResults.length > 1 ? `<button onclick="removeKR('${g.id}', '${kr.id}')" class="text-error opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-error/10 rounded-md"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>` : ''}
                            </div>
                        `).join('')}
                        ${isEditable ? `<button onclick="addKR('${g.id}')" class="text-primary font-bold text-[12px] flex items-center gap-1 hover:bg-primary/5 py-1 px-2 rounded-md w-max transition-colors mt-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> 추가</button>` : ''}
                    </div>
                </td>
                <td class="py-5 px-6 text-center align-middle w-28">
                    ${opHtml}
                </td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <div class="flex items-center gap-8 border-b-2 border-blue-50 mb-6 px-2 w-full">
            <button onclick="setTab('goals_set', 'monthly')" class="pb-3 text-lg transition-all ${STATE.goalsSetTab === 'monthly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">월별</button>
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
    const items = STATE.allGoals.filter(g => g.userId === STATE.user.id && g.periodType === STATE.goalsManageTab && g.periodValue === STATE.goalsManagePeriodValue && g.status !== '작성중');
    
    let rowsHtml = '';
    if(items.length === 0) {
        rowsHtml = `<tr><td colspan="5" class="py-20 text-center text-on-surface-variant text-[13px] font-bold">합의되거나 요청 진행 중인 목표가 없습니다.</td></tr>`;
    } else {
        rowsHtml = items.map((g, i) => {
            const isPending = g.status.includes('대기중');
            
            ensureTempStructures(g);
            
            const krsToRender = g.tempKeyResults || g.keyResults;
            const cTitle = g.tempText !== undefined ? g.tempText : g.text;

            let mainRow = `
                <tr class="hover:bg-surface-container-lowest/50 transition-colors ${g.reject_comment ? '' : 'border-b border-blue-50/50'}">
                    <td class="py-6 px-4 text-center border-r border-blue-50/30 font-bold text-on-surface-variant text-[14px] w-12 align-top">${i+1}</td>
                    <td class="py-6 px-6 w-[25%] border-r border-blue-50/30 align-top">
                        <textarea rows="3" oninput="updateOKRTitle('${g.id}', this.value)" ${isPending ? 'disabled':''} class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-bold text-on-surface focus:border-primary outline-none shadow-sm disabled:bg-surface-container-low resize-none">${cTitle}</textarea>
                    </td>
                    <td class="py-6 px-6 w-[35%] border-r border-blue-50/30 align-top">
                        <div class="flex flex-col gap-4">
                            ${krsToRender.map(kr => `
                                <div class="flex group items-center gap-2 h-[44px]">
                                    <input type="text" value="${kr.text}" oninput="updateKRTitle('${g.id}', '${kr.id}', this.value, true)" ${isPending?'disabled':''} class="h-full w-full bg-white border border-blue-100 rounded-lg px-3 text-[14px] font-medium text-on-surface focus:border-primary outline-none shadow-sm disabled:bg-surface-container-low transition-all">
                                    ${!isPending && krsToRender.length > 1 ? `<button onclick="removeKR('${g.id}', '${kr.id}', true)" class="h-full px-2 text-error opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/10 rounded-md shrink-0 flex items-center justify-center"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>` : ''}
                                </div>
                            `).join('')}
                            ${!isPending ? `<button onclick="addKR('${g.id}', true)" class="text-primary font-bold text-[12px] flex items-center gap-1 hover:bg-primary/5 py-1 px-2 rounded-md w-max transition-colors"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> 추가</button>` : ''}
                        </div>
                    </td>
                    <td class="py-6 px-4 w-[25%] border-r border-blue-50/30 align-top">
                        <div class="flex flex-col gap-4">
                            ${krsToRender.map(kr => {
                                return `
                                    <div class="flex items-center justify-between px-4 h-[44px] bg-surface-container-lowest rounded-xl border border-blue-50 shadow-inner">
                                        <input type="range" min="0" max="100" value="${kr.progress}" oninput="updateKRProgress('${g.id}', '${kr.id}', this.value)" ${isPending?'disabled':''} class="w-full accent-primary h-1.5 bg-blue-100 rounded-full appearance-none cursor-pointer mr-4">
                                        <span id="kr-prog-val-${kr.id}" class="text-primary font-black text-[14px] w-10 text-right shrink-0">${kr.progress}%</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </td>
                    <td class="py-6 px-4 text-center align-middle w-28">
                        <div class="flex flex-col items-center gap-3">
                            <span class="text-[13px] font-black ${isPending?'text-warning':'text-success'}">${g.status}</span>
                            ${isPending ? 
                                `<button onclick="console.log('Cancel clicked for:', '${g.id}'); cancelOKRRequest('${g.id}')" class="w-full border border-error text-error hover:bg-error/10 py-2 rounded-lg text-[13px] font-bold shadow-sm transition-all">요청 취소</button>` : 
                                `<button onclick="console.log('Modify clicked for:', '${g.id}'); submitModifyRequest('${g.id}')" class="w-full bg-primary text-white py-2 rounded-lg text-[13px] font-bold hover:bg-primary-dim shadow transition-all">수정 요청</button>`
                            }
                        </div>
                    </td>
                </tr>
            `;
            
            let rejectRow = '';
            if (g.reject_comment) {
                rejectRow = `
                    <tr class="border-b border-blue-50/50">
                        <td colspan="5" class="px-6 pb-6">
                            <div class="bg-error/5 border border-error/20 rounded-lg p-4">
                                <div class="flex items-start gap-3">
                                    <svg class="w-5 h-5 text-error flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <div class="flex-1">
                                        <p class="font-bold text-error text-[14px] mb-2">요청이 거부되었습니다. 내용을 수정하여 다시 제출해 주세요.</p>
                                        <p class="text-[13px] text-on-surface-variant font-bold mb-1">리더 코멘트 :</p>
                                        <p class="text-[13px] text-on-surface leading-relaxed whitespace-pre-wrap">${g.reject_comment}</p>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            }
            
            return mainRow + rejectRow;
        }).join('');
    }

    container.innerHTML = `
        <div class="flex items-center gap-8 border-b-2 border-blue-50 mb-6 px-2 w-full">
            <button onclick="setTab('goals_manage', 'monthly')" class="pb-3 text-lg transition-all ${STATE.goalsManageTab === 'monthly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">월별</button>
            <button onclick="setTab('goals_manage', 'quarterly')" class="pb-3 text-lg transition-all ${STATE.goalsManageTab === 'quarterly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">분기별</button>
            <button onclick="setTab('goals_manage', 'yearly')" class="pb-3 text-lg transition-all ${STATE.goalsManageTab === 'yearly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">연간</button>
        </div>
        <div class="mb-4 w-full">
            <select onchange="setPeriod('goals_manage', this.value)" class="bg-surface-container text-primary font-bold border border-blue-50 rounded-lg text-[13px] px-3 py-1.5 outline-none">
                ${generatePeriodOptions(STATE.goalsManageTab, STATE.goalsManagePeriodValue)}
            </select>
        </div>
        <div class="bg-white rounded-2xl border border-blue-50 shadow-sm w-full overflow-hidden">
            <table class="w-full text-left table-auto">
                <thead class="bg-surface-container">
                    <tr class="text-[14px] text-on-surface-variant font-extrabold border-b border-blue-50">
                        <th class="py-4 px-4 text-center border-r border-blue-50/30">No.</th>
                        <th class="py-4 px-6 border-r border-blue-50/30">Objective</th>
                        <th class="py-4 px-6 border-r border-blue-50/30">Key Results</th>
                        <th class="py-4 px-6 border-r border-blue-50/30 text-center">진척률 조정</th>
                        <th class="py-4 px-4 text-center">상태</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </div>
    `;
}

function renderRequests(container) {
    const okrList = STATE.allGoals.filter(g => (g.requestType !== null || g.isProcessed === true) && g.periodType === STATE.requestsTab && g.periodValue === STATE.requestsPeriodValue);
    const rnrList = STATE.rnrData.filter(r => r.request_type !== null);
    
    // Combine OKR and R&R requests
    const combinedList = [
        ...okrList.map(g => ({ type: 'okr', data: g })),
        ...rnrList.map(r => ({ type: 'rnr', data: r }))
    ];
    
    // Sort by processed status
    combinedList.sort((a, b) => {
        const aProcessed = a.type === 'okr' ? a.data.isProcessed : (a.data.status === '합의 완료');
        const bProcessed = b.type === 'okr' ? b.data.isProcessed : (b.data.status === '합의 완료');
        return (aProcessed === bProcessed) ? 0 : aProcessed ? 1 : -1;
    });

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
                    
                    diffHtml = `
                        <div class="space-y-6 max-h-[75vh] overflow-y-auto px-2 custom-scroll py-2">
                            ${tempData.job !== r.job ? `
                            <div class="flex flex-col gap-2">
                                <div class="text-[14px] font-black text-on-surface-variant uppercase tracking-wider pl-1 font-display">직무기술 수정</div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="p-5 bg-error/5 text-error text-[13px] rounded-xl border border-error/10 relative">
                                        <span class="absolute top-0 right-0 bg-error text-white text-[11px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-xl">AS-IS</span>
                                        <pre class="font-sans leading-relaxed whitespace-pre-wrap">${r.job || '없음'}</pre>
                                    </div>
                                    <div class="p-5 bg-success/5 text-success text-[13px] font-bold rounded-xl border border-success/20 relative shadow-sm">
                                        <span class="absolute top-0 right-0 bg-success text-white text-[11px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-xl">TO-BE</span>
                                        <pre class="font-sans leading-relaxed whitespace-pre-wrap">${tempData.job}</pre>
                                    </div>
                                </div>
                            </div>
                            ` : ''}
                            ${tempData.rnr !== (r.rnr || r.content) ? `
                            <div class="flex flex-col gap-2">
                                <div class="text-[14px] font-black text-on-surface-variant uppercase tracking-wider pl-1 font-display">R&R 수정</div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="p-5 bg-error/5 text-error text-[13px] rounded-xl border border-error/10 relative">
                                        <span class="absolute top-0 right-0 bg-error text-white text-[11px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-xl">AS-IS</span>
                                        <pre class="font-sans leading-relaxed whitespace-pre-wrap">${r.rnr || r.content || '없음'}</pre>
                                    </div>
                                    <div class="p-5 bg-success/5 text-success text-[13px] font-bold rounded-xl border border-success/20 relative shadow-sm">
                                        <span class="absolute top-0 right-0 bg-success text-white text-[11px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-xl">TO-BE</span>
                                        <pre class="font-sans leading-relaxed whitespace-pre-wrap">${tempData.rnr}</pre>
                                    </div>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    `.replace(/"/g, '&quot;').replace(/\n/g, '');
                } else {
                    diffHtml = `
                        <div class="space-y-6 max-h-[75vh] overflow-y-auto px-2 custom-scroll py-2">
                            ${r.job ? `
                            <div class="flex flex-col gap-2">
                                <div class="text-[14px] font-black text-on-surface-variant uppercase tracking-wider pl-1 font-display">직무기술</div>
                                <div class="p-5 text-on-surface text-[13px] bg-white rounded-xl border border-blue-100 shadow-sm">
                                    <pre class="font-sans leading-relaxed whitespace-pre-wrap">${r.job}</pre>
                                </div>
                            </div>
                            ` : ''}
                            ${r.rnr || r.content ? `
                            <div class="flex flex-col gap-2">
                                <div class="text-[14px] font-black text-on-surface-variant uppercase tracking-wider pl-1 font-display">R&R</div>
                                <div class="p-5 text-on-surface text-[13px] bg-white rounded-xl border border-blue-100 shadow-sm">
                                    <pre class="font-sans leading-relaxed whitespace-pre-wrap">${r.rnr || r.content}</pre>
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
                const assignee = USER_NAMES[g.userId] || g.userId;
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
        <div class="flex items-center gap-8 border-b-2 border-blue-50 mb-6 px-2 w-full">
            <button onclick="setTab('requests', 'monthly')" class="pb-3 text-lg transition-all ${STATE.requestsTab === 'monthly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">월별</button>
            <button onclick="setTab('requests', 'quarterly')" class="pb-3 text-lg transition-all ${STATE.requestsTab === 'quarterly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">분기별</button>
            <button onclick="setTab('requests', 'yearly')" class="pb-3 text-lg transition-all ${STATE.requestsTab === 'yearly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">연간</button>
        </div>
        <div class="mb-4 w-full">
            <select onchange="setPeriod('requests', this.value)" class="bg-surface-container text-primary font-bold border border-blue-50 rounded-lg text-[13px] px-3 py-1.5 outline-none">
                ${generatePeriodOptions(STATE.requestsTab, STATE.requestsPeriodValue)}
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
            <div>
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
    `;

    const krsToRender = g.tempKeyResults || g.keyResults;
    
    krsToRender.forEach((kr, i) => {
        const oldKr = g.keyResults.find(k => k.id === kr.id);
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
            if(!g.tempKeyResults.find(k => k.id === oldKr.id)) {
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
            </div>
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
    const division = document.getElementById('login-division').value;
    
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
        
        // Find member in loaded data (including master account)
        const member = STATE.members.find(m => m.user_id === id && m.division === division);
        
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
        
        // Debug logging
        console.log('Login - member data:', member);
        console.log('Login - member.team:', member.team);
        
        // Set user with member data
        STATE.user = {
            id: member.user_id,
            name: member.name,
            role: member.position === '리더' ? 'admin' : 'user',
            division: member.division,
            team: member.team,
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
        document.getElementById('division-label').innerText = '[' + STATE.user.division + ']';
        document.getElementById('login-view').classList.add('hidden');
        document.getElementById('app-view').classList.remove('hidden');
        
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
        
        for (const member of STATE.members) {
            if (member._modified) {
                // Update in Baserow
                const updateData = {};
                for (const field in member._modified) {
                    updateData[field] = member[field];
                }
                
                await MembersAPI.update(member.id, updateData);
                delete member._modified;
                updateCount++;
            }
        }
        
        if (updateCount > 0) {
            alert(`${updateCount}명의 구성원 정보가 저장되었습니다.`);
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

window.removeMember = async function(id) {
    if(STATE.members.length > 1) {
        try {
            await MembersAPI.delete(id);
            STATE.members = STATE.members.filter(m => m.id !== id);
            renderCurrentView();
        } catch (error) {
            console.error('Error removing member:', error);
            alert('구성원 삭제 중 오류가 발생했습니다.');
        }
    } else {
        alert('최소 1명의 구성원이 필요합니다.');
    }
};
function renderMembers(container) {
    const teamOptions = STATE.teams.map(team => 
        `<option value="${team.name}">${team.name}</option>`
    ).join('');

    // Filter members by team
    const filteredMembers = STATE.membersTeamFilter === 'all' 
        ? STATE.members 
        : STATE.members.filter(m => m.team === STATE.membersTeamFilter);

    let rowsHtml = filteredMembers.map((member, i) => {
        return `
            <tr class="hover:bg-surface-container-lowest transition-colors border-b border-blue-50/50">
                <td class="py-5 px-4 text-center border-r border-blue-50/30 font-bold text-on-surface-variant text-[14px] w-12">${i+1}</td>
                <td class="py-5 px-6 border-r border-blue-50/30 w-[10%]">
                    <input type="text" value="${member.name}" oninput="updateMemberField(${member.id}, 'name', this.value)" class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-bold text-on-surface outline-none focus:border-primary shadow-sm transition-all" placeholder="이름 입력">
                </td>
                <td class="py-5 px-6 border-r border-blue-50/30 w-[18%]">
                    <input type="email" value="${member.email || ''}" oninput="updateMemberField(${member.id}, 'email', this.value)" class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-medium text-on-surface outline-none focus:border-primary shadow-sm transition-all" placeholder="이메일 입력">
                </td>
                <td class="py-5 px-6 border-r border-blue-50/30 w-[14%]">
                    <select onchange="updateMemberField(${member.id}, 'team', this.value)" class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-medium text-on-surface outline-none focus:border-primary shadow-sm transition-all">
                        <option value="">팀 선택</option>
                        ${STATE.teams.map(team => `<option value="${team.name}" ${member.team === team.name ? 'selected' : ''}>${team.name}</option>`).join('')}
                    </select>
                </td>
                <td class="py-5 px-6 border-r border-blue-50/30 w-[12%]">
                    <input type="text" value="${member.job || ''}" oninput="updateMemberField(${member.id}, 'job', this.value)" class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-medium text-on-surface outline-none focus:border-primary shadow-sm transition-all" placeholder="직무 입력">
                </td>
                <td class="py-5 px-6 border-r border-blue-50/30 w-[10%]">
                    <select onchange="updateMemberField(${member.id}, 'position', this.value)" class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-medium text-on-surface outline-none focus:border-primary shadow-sm transition-all" ${STATE.user.role !== 'admin' && STATE.user.id !== member.user_id ? 'disabled' : ''}>
                        <option value="리더" ${member.position === '리더' ? 'selected' : ''}>리더</option>
                        <option value="멤버" ${member.position === '멤버' ? 'selected' : ''}>멤버</option>
                    </select>
                </td>
                <td class="py-5 px-6 border-r border-blue-50/30 w-[12%]">
                    <input type="text" value="${member.user_id || ''}" oninput="updateMemberField(${member.id}, 'user_id', this.value)" class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-medium text-on-surface outline-none focus:border-primary shadow-sm transition-all" placeholder="아이디 입력" ${STATE.user.role !== 'admin' ? 'readonly' : ''}>
                </td>
                <td class="py-5 px-6 border-r border-blue-50/30 w-[12%]">
                    <input type="password" value="${member.password || ''}" oninput="updateMemberField(${member.id}, 'password', this.value)" class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-medium text-on-surface outline-none focus:border-primary shadow-sm transition-all" placeholder="비밀번호 입력" ${STATE.user.role !== 'admin' ? 'readonly' : ''}>
                </td>
                <td class="py-5 px-6 text-center w-24">
                    <button onclick="removeMember(${member.id})" class="px-4 py-2 bg-white border border-error text-error font-bold text-[13px] rounded-lg hover:bg-error/10 transition-colors shadow-sm">삭제</button>
                </td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <div class="mb-4 w-full flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
            <div class="flex items-center gap-3">
                <div class="text-[14px] font-bold text-on-surface-variant">
                    총 <span class="text-primary font-black mx-1">${filteredMembers.length}</span>명의 구성원
                    ${STATE.membersTeamFilter !== 'all' ? `<span class="text-on-surface-variant/60 ml-1">(${STATE.membersTeamFilter})</span>` : ''}
                </div>
                <select onchange="setMembersTeamFilter(this.value)" class="bg-white border border-blue-100 text-on-surface font-bold rounded-lg text-[13px] px-3 py-2 outline-none focus:border-primary shadow-sm transition-all">
                    <option value="all" ${STATE.membersTeamFilter === 'all' ? 'selected' : ''}>전체 팀</option>
                    ${STATE.teams.map(team => `<option value="${team.name}" ${STATE.membersTeamFilter === team.name ? 'selected' : ''}>${team.name}</option>`).join('')}
                </select>
            </div>
            <div class="flex items-center gap-3">
                <button onclick="openTeamManagement()" class="flex items-center gap-2 px-4 py-2 bg-white border border-blue-100 text-primary font-bold text-[13px] rounded-lg hover:bg-blue-50 transition-all shadow-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    팀 관리
                </button>
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
        <div class="bg-white rounded-2xl border border-blue-50 shadow-sm w-full overflow-hidden">
            <table class="w-full text-left table-auto">
                <thead class="bg-surface-container">
                    <tr class="text-[14px] text-on-surface-variant font-extrabold border-b border-blue-50">
                        <th class="py-4 px-4 text-center border-r border-blue-50/30">No.</th>
                        <th class="py-4 px-6 border-r border-blue-50/30">구성원</th>
                        <th class="py-4 px-6 border-r border-blue-50/30">이메일</th>
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
            <button onclick="setTab('goals_set', 'monthly')" class="pb-3 text-sm lg:text-lg transition-all whitespace-nowrap ${STATE.goalsSetTab === 'monthly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">월별</button>
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
    const items = STATE.allGoals.filter(g => g.userId === STATE.user.id && g.periodType === STATE.goalsManageTab && g.periodValue === STATE.goalsManagePeriodValue && g.status !== '작성중');
    const isMobile = window.innerWidth < 1024;
    
    let h = `
        <div class="flex items-center gap-4 lg:gap-8 border-b-2 border-blue-50 mb-6 px-2 w-full overflow-x-auto">
            <button onclick="setTab('goals_manage', 'monthly')" class="pb-3 text-sm lg:text-lg transition-all whitespace-nowrap ${STATE.goalsManageTab === 'monthly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">월별</button>
            <button onclick="setTab('goals_manage', 'quarterly')" class="pb-3 text-sm lg:text-lg transition-all whitespace-nowrap ${STATE.goalsManageTab === 'quarterly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">분기별</button>
            <button onclick="setTab('goals_manage', 'yearly')" class="pb-3 text-sm lg:text-lg transition-all whitespace-nowrap ${STATE.goalsManageTab === 'yearly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">연간</button>
        </div>
        <div class="mb-4 w-full">
            <select onchange="setPeriod('goals_manage', this.value)" class="w-full lg:w-auto bg-surface-container text-primary font-bold border border-blue-50 rounded-lg text-[13px] px-3 py-1.5 outline-none">
                ${generatePeriodOptions(STATE.goalsManageTab, STATE.goalsManagePeriodValue)}
            </select>
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
    const okrList = STATE.allGoals.filter(g => (g.requestType !== null || g.isProcessed === true) && g.periodType === STATE.requestsTab && g.periodValue === STATE.requestsPeriodValue);
    const rnrList = STATE.rnrData.filter(r => r.request_type !== null);
    
    // Combine OKR and R&R requests
    const combinedList = [
        ...okrList.map(g => ({ type: 'okr', data: g })),
        ...rnrList.map(r => ({ type: 'rnr', data: r }))
    ];
    
    // Sort by processed status
    combinedList.sort((a, b) => {
        const aProcessed = a.type === 'okr' ? a.data.isProcessed : (a.data.status === '합의 완료');
        const bProcessed = b.type === 'okr' ? b.data.isProcessed : (b.data.status === '합의 완료');
        return (aProcessed === bProcessed) ? 0 : aProcessed ? 1 : -1;
    });
    
    const isMobile = window.innerWidth < 1024;
    
    let h = `
        <div class="flex items-center gap-4 lg:gap-8 border-b-2 border-blue-50 mb-6 px-2 w-full overflow-x-auto">
            <button onclick="setTab('requests', 'monthly')" class="pb-3 text-sm lg:text-lg transition-all whitespace-nowrap ${STATE.requestsTab === 'monthly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">월별</button>
            <button onclick="setTab('requests', 'quarterly')" class="pb-3 text-sm lg:text-lg transition-all whitespace-nowrap ${STATE.requestsTab === 'quarterly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">분기별</button>
            <button onclick="setTab('requests', 'yearly')" class="pb-3 text-sm lg:text-lg transition-all whitespace-nowrap ${STATE.requestsTab === 'yearly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">연간</button>
        </div>
        <div class="mb-4 w-full">
            <select onchange="setPeriod('requests', this.value)" class="w-full lg:w-auto bg-surface-container text-primary font-bold border border-blue-50 rounded-lg text-[13px] px-3 py-1.5 outline-none">
                ${generatePeriodOptions(STATE.requestsTab, STATE.requestsPeriodValue)}
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
                    <h3 class="font-display text-xl font-bold text-on-surface">기간별 OKR 운영 가이드</h3>
                </div>

                <div class="space-y-6">
                    <!-- 월간 OKR -->
                    <div class="border border-blue-100 rounded-xl p-6 hover:border-primary/30 transition-all">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                <span class="text-blue-600 font-black text-sm">월간</span>
                            </div>
                            <h4 class="font-bold text-on-surface text-lg">월간 OKR</h4>
                        </div>
                        <div class="grid lg:grid-cols-3 gap-4 mb-4">
                            <div class="bg-surface-container rounded-lg p-4">
                                <p class="text-[11px] font-bold text-on-surface-variant mb-2">📝 작성 시기</p>
                                <p class="text-[13px] text-on-surface font-medium">매월 마지막 주</p>
                                <p class="text-[12px] text-on-surface-variant mt-1">다음 달 목표 설정</p>
                            </div>
                            <div class="bg-surface-container rounded-lg p-4">
                                <p class="text-[11px] font-bold text-on-surface-variant mb-2">🔄 체크인 주기</p>
                                <p class="text-[13px] text-on-surface font-medium">주 1회 (매주 금요일)</p>
                                <p class="text-[12px] text-on-surface-variant mt-1">진척률 업데이트</p>
                            </div>
                            <div class="bg-surface-container rounded-lg p-4">
                                <p class="text-[11px] font-bold text-on-surface-variant mb-2">✅ 리뷰 시기</p>
                                <p class="text-[13px] text-on-surface font-medium">매월 마지막 날</p>
                                <p class="text-[12px] text-on-surface-variant mt-1">달성도 평가 및 회고</p>
                            </div>
                        </div>
                        <div class="bg-blue-50/50 rounded-lg p-4">
                            <p class="text-[12px] font-bold text-on-surface mb-2">💡 운영 팁</p>
                            <p class="text-[13px] text-on-surface-variant leading-relaxed">
                                단기 실행 과제에 집중하세요. 구체적이고 즉시 실행 가능한 목표를 설정하고, 
                                주간 체크인을 통해 빠르게 방향을 조정할 수 있습니다.
                            </p>
                        </div>
                    </div>

                    <!-- 분기별 OKR -->
                    <div class="border border-blue-100 rounded-xl p-6 hover:border-primary/30 transition-all">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <span class="text-primary font-black text-sm">분기</span>
                            </div>
                            <h4 class="font-bold text-on-surface text-lg">분기별 OKR</h4>
                        </div>
                        <div class="grid lg:grid-cols-3 gap-4 mb-4">
                            <div class="bg-surface-container rounded-lg p-4">
                                <p class="text-[11px] font-bold text-on-surface-variant mb-2">📝 작성 시기</p>
                                <p class="text-[13px] text-on-surface font-medium">분기 시작 2주 전</p>
                                <p class="text-[12px] text-on-surface-variant mt-1">다음 분기 전략 수립</p>
                            </div>
                            <div class="bg-surface-container rounded-lg p-4">
                                <p class="text-[11px] font-bold text-on-surface-variant mb-2">🔄 체크인 주기</p>
                                <p class="text-[13px] text-on-surface font-medium">월 1회 (매월 말)</p>
                                <p class="text-[12px] text-on-surface-variant mt-1">월간 진척 점검</p>
                            </div>
                            <div class="bg-surface-container rounded-lg p-4">
                                <p class="text-[11px] font-bold text-on-surface-variant mb-2">✅ 리뷰 시기</p>
                                <p class="text-[13px] text-on-surface font-medium">분기 마지막 주</p>
                                <p class="text-[12px] text-on-surface-variant mt-1">분기 성과 리뷰</p>
                            </div>
                        </div>
                        <div class="bg-primary/5 rounded-lg p-4">
                            <p class="text-[12px] font-bold text-on-surface mb-2">💡 운영 팁</p>
                            <p class="text-[13px] text-on-surface-variant leading-relaxed">
                                전략적 프로젝트와 중기 목표에 적합합니다. 월간 OKR보다 도전적인 목표를 설정하고, 
                                월별 체크인을 통해 진행 상황을 모니터링하세요.
                            </p>
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
                        <div class="grid lg:grid-cols-3 gap-4 mb-4">
                            <div class="bg-surface-container rounded-lg p-4">
                                <p class="text-[11px] font-bold text-on-surface-variant mb-2">📝 작성 시기</p>
                                <p class="text-[13px] text-on-surface font-medium">전년도 12월</p>
                                <p class="text-[12px] text-on-surface-variant mt-1">연간 비전 및 전략 수립</p>
                            </div>
                            <div class="bg-surface-container rounded-lg p-4">
                                <p class="text-[11px] font-bold text-on-surface-variant mb-2">🔄 체크인 주기</p>
                                <p class="text-[13px] text-on-surface font-medium">분기 1회</p>
                                <p class="text-[12px] text-on-surface-variant mt-1">분기별 진척 점검</p>
                            </div>
                            <div class="bg-surface-container rounded-lg p-4">
                                <p class="text-[11px] font-bold text-on-surface-variant mb-2">✅ 리뷰 시기</p>
                                <p class="text-[13px] text-on-surface font-medium">12월 마지막 주</p>
                                <p class="text-[12px] text-on-surface-variant mt-1">연간 성과 종합 평가</p>
                            </div>
                        </div>
                        <div class="bg-purple-50/50 rounded-lg p-4">
                            <p class="text-[12px] font-bold text-on-surface mb-2">💡 운영 팁</p>
                            <p class="text-[13px] text-on-surface-variant leading-relaxed">
                                조직의 비전과 장기 전략에 연결된 목표를 설정하세요. 야심차고 도전적인 목표를 세우되, 
                                분기별 체크인을 통해 방향성을 유지하고 필요시 조정합니다.
                            </p>
                        </div>
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


// --- R&R View ---
function renderRnR(container) {
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
    h += '<textarea id="job-content" maxlength="2000" oninput="updateCharCount(\'job-content\', \'job-char-count\')" rows="6" class="w-full bg-white border border-blue-100 rounded-lg px-4 py-3 text-[13px] text-on-surface outline-none focus:border-primary resize-none leading-relaxed" placeholder="본인이 보유한 디자인 전문 역량과 실제 수행 가능한 업무의 범위를 상세히 작성해 주세요. ex) 사용 가능한 툴(Figma, Adobe Creative Cloud, Framer, Protopie 등)과 각 툴의 숙련도를 포함하여, UI/UX 설계, 브랜드 시스템 구축, 프로토타이핑, 또는 GUI 디자인 등 본인이 결과물을 만들어낼 수 있는 구체적인 직무 영역을 기술해 주시기 바랍니다. 예를 들어 &#39;Figma를 활용한 컴포넌트 기반의 디자인 시스템 구축 및 고도화가 가능하며, AOS/iOS 가이드라인에 맞춘 모바일 앱 UI 설계와 웹 반응형 디자인을 실무 수준에서 완행할 수 있음&#39;과 같이 본인의 기술적 스택과 업무 범위를 연결하여 작성해 주세요.">' + jobContent + '</textarea>';
    h += '<div class="text-right mt-1 text-[11px] text-on-surface-variant" id="job-char-count">' + jobContent.length + ' / 2000</div>';
    h += '</div>';
    
    h += '<div>';
    h += '<div class="flex items-center gap-2 mb-2">';
    h += '<label class="block text-[13px] font-bold text-on-surface-variant">R&R</label>';
    h += '<button onclick="showRnRExample()" class="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold rounded-md transition-all border border-primary/20">예시 보기</button>';
    h += '</div>';
    h += '<textarea id="rnr-content" maxlength="2000" oninput="updateCharCount(\'rnr-content\', \'rnr-char-count\')" rows="6" class="w-full bg-white border border-blue-100 rounded-lg px-4 py-3 text-[13px] text-on-surface outline-none focus:border-primary resize-none leading-relaxed" placeholder="현재 담당하고 있는 업무와 프로젝트별 상세 과업, 그리고 각 업무에 투입되는 실제 소요 시간을 구체적으로 작성해 주세요. 주 단위 또는 월 단위로 반복되는 루틴 업무를 기재하고, 참고할 수 있는 대시보드나 리포트 링크를 반드시 첨부해 주시기 바랍니다. 특히 전체 업무 비중을 고려하여 각 항목별로 소요되는 리소스를 M/D 혹은 M/M 단위로 산정해 주세요.\n\n[마케팅 직무 작성 예시]\n- 진행 중인 캠페인의 성과 관리 및 매체 최적화(SA/DA), 데이터 추출 및 리포트 작성\n- 예: &#39;주간 매체 효율 최적화 및 소재 교체 작업에 주 2일(월 0.4 M/M)을 투입하며, 신규 프로모션 기획 및 성과 분석 리포트 작성에 월 0.3 M/M를 사용함&#39;">' + rnrContent + '</textarea>';
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
        h += '<p class="text-[13px] text-on-surface-variant font-bold mb-1">리더 코멘트 :</p>';
        h += '<p class="text-[13px] text-on-surface leading-relaxed whitespace-pre-wrap">' + myRnR.reject_comment + '</p>';
        h += '</div>';
        h += '</div>';
        h += '</div>';
    }
    
    h += '</div>';
    h += '</div>';
    
    // 관리자만 볼 수 있는 구성원 직무기술 & R&R 확인 섹션
    if (STATE.user.role === 'admin') {
        h += '<div class="bg-white rounded-2xl border border-blue-50 shadow-sm p-6 lg:p-8">';
        h += '<div class="flex items-center justify-between mb-6">';
        h += '<div class="flex items-center gap-3">';
        h += '<div class="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">';
        h += '<svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>';
        h += '</div>';
        h += '<h3 class="font-display text-xl font-bold text-on-surface">구성원 입력 정보 확인</h3>';
        h += '</div>';
        h += '<div class="text-[14px] font-bold text-on-surface-variant">총 <span class="text-primary font-black mx-1">' + STATE.rnrData.length + '</span>명</div>';
        h += '</div>';
        
        h += '<div class="space-y-4">';
        STATE.rnrData.forEach(rnr => {
            h += '<div class="bg-surface-container rounded-xl p-5 border border-blue-100">';
            h += '<div class="flex items-start justify-between mb-4">';
            h += '<div class="flex items-center gap-3">';
            h += '<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">' + rnr.name.charAt(0) + '</div>';
            h += '<div>';
            h += '<h4 class="font-bold text-on-surface text-[15px]">' + rnr.name + '</h4>';
            h += '<p class="text-[12px] text-on-surface-variant">' + rnr.team + ' · ' + rnr.position + '</p>';
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
            h += '</div>';
            h += '</div>';
            
            if (rnr.job) {
                h += '<div class="mb-3">';
                h += '<label class="block text-[11px] font-bold text-on-surface-variant mb-1">직무기술</label>';
                h += '<div class="bg-white rounded-lg p-3 border border-blue-50">';
                h += '<p class="text-[13px] text-on-surface leading-relaxed whitespace-pre-wrap">' + (rnr.job || '작성된 직무기술이 없습니다.') + '</p>';
                h += '</div>';
                h += '</div>';
            }
            
            h += '<div>';
            h += '<label class="block text-[11px] font-bold text-on-surface-variant mb-1">R&R</label>';
            h += '<div class="bg-white rounded-lg p-3 border border-blue-50">';
            h += '<p class="text-[13px] text-on-surface leading-relaxed whitespace-pre-wrap">' + (rnr.rnr || rnr.content || '작성된 R&R이 없습니다.') + '</p>';
            h += '</div>';
            h += '</div>';
            h += '</div>';
        });
        h += '</div>';
        h += '</div>';
    }
    
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
        if (length < 500) {
            counter.classList.add('text-error');
            counter.classList.remove('text-on-surface-variant', 'text-success');
        } else if (length >= 500 && length < 2000) {
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
        <div class="space-y-4 max-h-[70vh] overflow-y-auto custom-scroll">
            <div class="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                <h4 class="font-bold text-on-surface text-[15px] mb-3 flex items-center gap-2">
                    <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                    </svg>
                    백엔드 개발자 직무기술 예시
                </h4>
                <div class="bg-white rounded-lg p-4 text-[13px] text-on-surface leading-relaxed space-y-3">
                    <p class="font-bold text-primary">[ 핵심 기술 스택 ]</p>
                    <p>• <strong>백엔드 개발:</strong> Node.js(Express, NestJS), Python(FastAPI, Django), Java(Spring Boot) 기반 RESTful API 및 GraphQL 서버 설계 및 구축 가능</p>
                    <p>• <strong>데이터베이스:</strong> PostgreSQL, MySQL, MongoDB 등 관계형 및 NoSQL 데이터베이스 설계, 쿼리 최적화, 인덱싱 전략 수립 실무 경험 보유</p>
                    <p>• <strong>AWS 인프라:</strong> EC2, RDS, S3, Lambda, CloudFront, Route53, ECS/EKS 등 AWS 서비스를 활용한 클라우드 인프라 설계 및 운영 가능. Terraform을 통한 IaC(Infrastructure as Code) 구현 경험</p>
                    
                    <p class="font-bold text-primary mt-4">[ 수행 가능 업무 범위 ]</p>
                    <p>• 마이크로서비스 아키텍처 설계 및 구현, Docker/Kubernetes 기반 컨테이너 오케스트레이션</p>
                    <p>• CI/CD 파이프라인 구축(GitHub Actions, Jenkins), 무중단 배포 전략 수립 및 실행</p>
                    <p>• 서버 모니터링 및 로깅 시스템 구축(CloudWatch, Datadog, ELK Stack)</p>
                    <p>• 보안 강화(JWT 인증, OAuth 2.0, API Rate Limiting, SQL Injection 방어)</p>
                    <p>• 성능 최적화(캐싱 전략, 쿼리 튜닝, 로드 밸런싱, CDN 활용)</p>
                    <p>• React, Vue.js를 활용한 풀스택 개발 가능, 프론트엔드와의 원활한 협업 및 API 문서화(Swagger, Postman)</p>
                    
                    <p class="text-[11px] text-on-surface-variant mt-4 pt-3 border-t border-blue-100">
                        <strong>글자수:</strong> 약 820자 | 실무 수준의 기술 스택과 구체적인 업무 범위를 명시하여 작성
                    </p>
                </div>
            </div>
        </div>
    `;
    
    STATE.modalData = {
        title: '직무기술 작성 예시',
        content: exampleContent,
        onConfirm: null,
        isWide: true
    };
    renderCurrentView();
};

// Show R&R example
window.showRnRExample = function() {
    const exampleContent = `
        <div class="space-y-4 max-h-[70vh] overflow-y-auto custom-scroll">
            <div class="bg-purple-50/50 rounded-xl p-5 border border-purple-100">
                <h4 class="font-bold text-on-surface text-[15px] mb-3 flex items-center gap-2">
                    <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    퍼포먼스 마케터 R&R 예시
                </h4>
                <div class="bg-white rounded-lg p-4 text-[13px] text-on-surface leading-relaxed space-y-3">
                    <p class="font-bold text-primary">[ 주요 담당 업무 ]</p>
                    
                    <p><strong>1. 마케팅 믹스 전략 수립 및 예산 관리 (월 0.3 M/M)</strong></p>
                    <p>• 월간 마케팅 예산 배분 계획 수립 및 채널별 ROI 분석을 통한 최적 예산 분배</p>
                    <p>• 네이버 SA/DA, 메타(Facebook/Instagram), 구글 애즈 등 주요 매체별 예산 집행 및 성과 모니터링</p>
                    <p>• 주간 예산 소진율 및 CPA, ROAS 지표 추적, 월간 마케팅 성과 리포트 작성</p>
                    
                    <p><strong>2. 차일디 브랜드 캠페인 성과 관리 및 운영 (월 0.5 M/M)</strong></p>
                    <p>• 네이버 브랜드검색, 메타 브랜드 캠페인 기획 및 소재 제작 협업(디자인팀)</p>
                    <p>• 주간 캠페인 성과 분석(CTR, CVR, CPC) 및 A/B 테스트를 통한 소재 최적화</p>
                    <p>• 실시간 입찰 전략 조정 및 타겟 오디언스 세그먼트 관리</p>
                    <p>• 참고 대시보드: https://analytics.childy.com/campaign-dashboard</p>
                    
                    <p><strong>3. 네이버 광고 운영 (SA/DA/쇼핑) (월 0.4 M/M)</strong></p>
                    <p>• 네이버 검색광고(SA) 키워드 발굴, 입찰가 조정, 품질지수 관리</p>
                    <p>• 네이버 디스플레이광고(DA) 소재 교체 및 타겟팅 최적화(주 2회)</p>
                    <p>• 네이버 쇼핑 광고 상품 등록 및 성과 개선, 월간 매출 기여도 분석</p>
                    
                    <p><strong>4. 메타 광고 운영 및 최적화 (월 0.3 M/M)</strong></p>
                    <p>• Facebook/Instagram 광고 캠페인 세팅, 픽셀 이벤트 추적 및 전환 최적화</p>
                    <p>• 오디언스 네트워크 확장 및 리타겟팅 캠페인 운영</p>
                    <p>• 주간 광고 소재 성과 분석 및 크리에이티브 개선 제안</p>
                    
                    <p><strong>5. 데이터 분석 및 리포팅 (월 0.2 M/M)</strong></p>
                    <p>• Google Analytics, 네이버 애널리틱스 데이터 추출 및 인사이트 도출</p>
                    <p>• 월간 마케팅 성과 리포트 작성(매출 기여도, CAC, LTV 분석)</p>
                    <p>• 경쟁사 벤치마킹 및 시장 트렌드 분석 자료 정리</p>
                    
                    <p class="text-[11px] text-on-surface-variant mt-4 pt-3 border-t border-purple-100">
                        <strong>글자수:</strong> 약 850자 | <strong>총 리소스:</strong> 1.7 M/M | 구체적인 업무 내용과 소요 시간을 M/M 단위로 명시
                    </p>
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
    renderCurrentView();
};

window.requestRnRAgreement = async function() {
    const jobContent = document.getElementById('job-content').value.trim();
    const rnrContent = document.getElementById('rnr-content').value.trim();
    
    if (!jobContent && !rnrContent) {
        alert('직무기술 또는 R&R 내용을 입력해주세요.');
        return;
    }
    
    // Validate minimum character count
    if (jobContent && jobContent.length < 500) {
        alert('직무기술은 최소 500자 이상 입력해주세요.\n현재: ' + jobContent.length + '자');
        return;
    }
    
    if (rnrContent && rnrContent.length < 500) {
        alert('R&R은 최소 500자 이상 입력해주세요.\n현재: ' + rnrContent.length + '자');
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
    if (newJobContent && newJobContent.length < 500) {
        alert('직무기술은 최소 500자 이상 입력해주세요.\n현재: ' + newJobContent.length + '자');
        return;
    }
    
    if (newRnRContent && newRnRContent.length < 500) {
        alert('R&R은 최소 500자 이상 입력해주세요.\n현재: ' + newRnRContent.length + '자');
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
                    
                    // Update UI
                    document.getElementById('user-avatar').innerText = STATE.user.name.charAt(0);
                    document.getElementById('auth-user-name').innerText = STATE.user.name;
                    document.getElementById('division-label').innerText = '[' + STATE.user.division + ']';
                    document.getElementById('login-view').classList.add('hidden');
                    document.getElementById('app-view').classList.remove('hidden');
                    
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
                                <span class="text-[13px] lg:text-[14px] text-on-surface">Claude (Desktop/Code) : 멀티턴, 자료크, 개발 환경 통합 및 활용</span>
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
            position: '멤버'
        };
        
        await MembersAPI.create(newMember);
        
        alert('회원가입이 완료되었습니다! 로그인해주세요.');
        
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
