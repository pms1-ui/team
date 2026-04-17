// --- State & Config ---
const STATE = {
    user: null, // { id: 'master'|'member', name: '...', role: 'admin'|'user' }
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
    
    // Teams Data
    teams: [
        { id: 1, name: 'DT전략팀' },
        { id: 2, name: '개발팀' },
        { id: 3, name: '디자인팀' },
        { id: 4, name: '마케팅팀' }
    ],
    
    // Members Data
    members: [
        { id: 1, name: '김전략', team: 'DT전략팀', position: '팀장', email: 'kim.strategy@childy.com' },
        { id: 2, name: '박성공', team: 'DT전략팀', position: '팀원', email: 'park.success@childy.com' },
        { id: 3, name: '이혁신', team: '개발팀', position: '팀장', email: 'lee.innovation@childy.com' },
        { id: 4, name: '최효율', team: '개발팀', position: '팀원', email: 'choi.efficiency@childy.com' }
    ],
    
    // All Goals Data
    allGoals: [
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
            id: 102, 
            userId: 'member', 
            periodType: 'monthly', 
            periodValue: '2026-04', 
            text: '퍼포먼스 시스템 고도화', 
            keyResults: [
                { id: 'kr102-1', text: 'API 응답 속도 200ms 이하 단축', progress: 60 }
            ],
            tempKeyResults: [
                { id: 'kr102-1', text: 'API 응답 속도 200ms 이하 단축', progress: 80 }
            ],
            status: '승인 대기중', 
            requestType: '진척률', 
            comment: '최적화 작업 진행 중', 
            isProcessed: false 
        },
        { 
            id: 103, 
            userId: 'member', 
            periodType: 'monthly', 
            periodValue: '2026-04', 
            text: '데이터 분석 역량 강화', 
            keyResults: [
                { id: 'kr103-1', text: '실시간 대시보드 구축 완료', progress: 75 },
                { id: 'kr103-2', text: '데이터 파이프라인 안정성 99% 달성', progress: 85 }
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
                { id: 'kr201-2', text: '고객 만족도 점수 4.2 이상 달성', progress: 65 },
                { id: 'kr201-3', text: '재구매율 15% 증가', progress: 45 }
            ],
            status: '합의 완료', 
            requestType: null, 
            comment: '', 
            isProcessed: true 
        },
        { 
            id: 202, 
            userId: 'member2', 
            periodType: 'monthly', 
            periodValue: '2026-04', 
            text: '마케팅 캠페인 효율화', 
            keyResults: [
                { id: 'kr202-1', text: 'ROI 25% 개선', progress: 70 },
                { id: 'kr202-2', text: '신규 고객 유입 1000명 달성', progress: 80 }
            ],
            status: '합의 완료', 
            requestType: null, 
            comment: '', 
            isProcessed: true 
        },
        { 
            id: 203, 
            userId: 'member2', 
            periodType: 'monthly', 
            periodValue: '2026-04', 
            text: '운영 프로세스 자동화', 
            keyResults: [
                { id: 'kr203-1', text: '반복 업무 자동화율 60% 달성', progress: 40 },
                { id: 'kr203-2', text: '업무 처리 시간 50% 단축', progress: 35 }
            ],
            tempKeyResults: [
                { id: 'kr203-1', text: '반복 업무 자동화율 70% 달성', progress: 50 },
                { id: 'kr203-2', text: '업무 처리 시간 50% 단축', progress: 45 }
            ],
            status: '승인 대기중', 
            requestType: 'KR 내용 변경,진척률 보고', 
            comment: '자동화 도구 추가 도입으로 목표 상향 조정 필요', 
            isProcessed: false 
        },
        { 
            id: 204, 
            userId: 'member2', 
            periodType: 'monthly', 
            periodValue: '2026-04', 
            text: '팀 협업 문화 개선', 
            keyResults: [
                { id: 'kr204-1', text: '주간 회의 참여율 95% 이상', progress: 90 },
                { id: 'kr204-2', text: '크로스 팀 프로젝트 3건 이상 진행', progress: 100 }
            ],
            tempKeyResults: [
                { id: 'kr204-1', text: '주간 회의 참여율 95% 이상', progress: 95 },
                { id: 'kr204-2', text: '크로스 팀 프로젝트 3건 이상 진행', progress: 100 },
                { id: 'kr204-3', text: '팀 만족도 조사 4.0 이상', progress: 0 }
            ],
            status: '승인 대기중', 
            requestType: 'KR 항목 증감,진척률 보고', 
            comment: '팀 만족도 측정 지표 추가 요청', 
            isProcessed: false 
        }
    ]
};

const USER_NAMES = {
    'master': '마스터 관리자',
    'member': '김전략',
    'member2': '박성공'
};

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
    { id: 'dashboard', label: '대시보드', icon: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['admin', 'user'] },
    { id: 'goals_set', label: '목표 설정 및 합의', icon: '<path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['user', 'admin'] },
    { id: 'goals_manage', label: '내 목표 관리', icon: '<path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['user', 'admin'] },
    { id: 'requests', label: '요청 관리', icon: '<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['admin'] },
    { id: 'members', label: '구성원 관리', icon: '<path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['admin'] },
    { id: 'guide', label: 'OKR 가이드', icon: '<path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['admin', 'user'] }
];

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
    const goal = STATE.allGoals.find(g => g.id === id);
    if(goal) {
        if(goal.status === '합의 완료' || goal.status === '승인 대기중') goal.tempText = val;
        else goal.text = val;
    }
};

window.updateKRTitle = function(okrId, krId, val, isTempObj = false) {
    const goal = STATE.allGoals.find(g => g.id === okrId);
    if(goal) {
        if(isTempObj) {
            const kr = goal.tempKeyResults.find(k => k.id === krId);
            if(kr) kr.text = val;
        } else {
            const kr = goal.keyResults.find(k => k.id === krId);
            if(kr) kr.text = val;
        }
    }
};

window.updateKRProgress = function(okrId, krId, val) {
    const goal = STATE.allGoals.find(g => g.id === okrId);
    if(goal && goal.tempKeyResults) {
        const kr = goal.tempKeyResults.find(k => k.id === krId);
        if(kr) {
            kr.progress = parseInt(val);
            const el = document.getElementById(`kr-prog-val-${krId}`);
            if(el) el.innerText = val + '%';
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
    STATE.allGoals.push({
        id: Date.now() + timestamp_salt, userId: STATE.user.id, periodType: STATE.goalsSetTab, periodValue: STATE.goalsSetPeriodValue,
        text: '', keyResults: [{ id: 'kr-' + (Date.now() + timestamp_salt), text: '', progress: 0 }],
        status: '작성중', requestType: null, comment: '', isProcessed: false
    });
    renderCurrentView();
};

window.removeOKR = function(id) {
    STATE.allGoals = STATE.allGoals.filter(g => g.id !== id);
    renderCurrentView();
};

// Requests
window.submitOKRRequest = function(id) {
    const goal = STATE.allGoals.find(g => g.id === id);
    if(!goal) return;
    if(!goal.text.trim()) { alert('OKR 목표를 입력하세요.'); return; }
    if(goal.keyResults.some(k => !k.text.trim())) { alert('모든 Key Results 내용을 입력하세요.'); return; }
    
    goal.status = '승인 대기중';
    goal.requestType = '신규 수립';
    goal.isProcessed = false;
    renderCurrentView();
    updateNavigation();
};

window.cancelOKRRequest = function(id) {
    const goal = STATE.allGoals.find(g => g.id === id);
    if(goal) {
        if(goal.requestType === '신규 수립') {
            goal.status = '작성중';
            goal.requestType = null;
        } else {
            goal.status = '합의 완료';
            goal.requestType = null;
            goal.tempText = undefined;
            goal.tempKeyResults = undefined;
        }
        renderCurrentView();
        updateNavigation();
    }
};

window.submitModifyRequest = function(id) {
    const goal = STATE.allGoals.find(g => g.id === id);
    if(!goal) return;

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
    openModal('수정/진척률 승인 요청하기', mBody, () => {
        const comment = document.getElementById('modify-comment').value;
        goal.status = '승인 대기중';
        goal.requestType = edits.join(',');
        goal.comment = comment;
        goal.isProcessed = false;
        closeModal();
        renderCurrentView();
        updateNavigation();
    }, false);
};

window.approveAdminRequest = function(id) {
    const goal = STATE.allGoals.find(g => g.id === id);
    if(goal) {
        if(goal.tempText !== undefined) goal.text = goal.tempText;
        if(goal.tempKeyResults) {
            goal.keyResults = JSON.parse(JSON.stringify(goal.tempKeyResults));
        }
        goal.tempText = undefined;
        goal.tempKeyResults = undefined;
        goal.status = '합의 완료';
        // Note: Keep requestType untouched visually in requests board
        goal.isProcessed = true;
        renderCurrentView();
        updateNavigation();
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

// Navigation
function updateNavigation() {
    const nav = document.getElementById('nav-menu');
    nav.innerHTML = '';

    const pendingReqCount = STATE.allGoals.filter(g => g.requestType !== null && !g.isProcessed && g.status !== '작성중').length;

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
        btn.onclick = () => { STATE.currentView = item.id; updateNavigation(); renderCurrentView(); closeMobileMenuOnNavigate(); };
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
    else if (STATE.currentView === 'guide') renderGuide(content);
    
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
    h += '<div class="mb-4 w-full">';
    h += '<select onchange="setPeriod(\'dashboard\', this.value)" class="w-full lg:w-auto bg-surface-container text-primary font-bold border border-blue-50 rounded-lg text-[13px] px-3 py-1.5 outline-none">';
    h += generatePeriodOptions(STATE.dashboardTab, STATE.dashboardPeriodValue);
    h += '</select></div>';

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
                h += '<div class="bg-gradient-to-r from-primary/5 to-primary/10 px-6 py-4 border-b border-blue-50">';
                h += '<div class="flex items-center justify-between">';
                h += '<h3 class="font-bold text-on-surface text-[15px] leading-relaxed break-keep flex-1">' + g.text + '</h3>';
                h += '<div class="flex items-center gap-3 ml-4">';
                h += '<div class="text-right"><div class="text-[11px] text-on-surface-variant font-bold mb-0.5">평균 진척률</div>';
                h += '<div class="text-primary font-black text-[16px]">' + avgProgress + '%</div></div>';
                h += '<div class="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center">';
                h += '<svg class="w-16 h-16 transform -rotate-90"><circle cx="32" cy="32" r="28" stroke="#eff4ff" stroke-width="6" fill="none"/>';
                h += '<circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="6" fill="none" class="' + progressColor + '" stroke-dasharray="' + (avgProgress * 1.76) + ' 176" stroke-linecap="round"/></svg>';
                h += '</div></div></div></div>';
                
                h += '<div class="px-6 py-5"><div class="space-y-4">';
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
                    <button onclick="submitOKRRequest(${g.id})" class="w-full bg-primary text-white py-2 px-2 rounded-lg text-[13px] font-bold shadow-sm hover:scale-[1.02] transition-transform">승인 요청</button>
                    <button onclick="removeOKR(${g.id})" class="w-full bg-surface-container text-on-surface-variant py-2 px-2 rounded-lg text-[13px] font-bold hover:bg-error hover:text-white transition-colors border border-blue-50">삭제</button>
                </div>
            `;
        } else if(isPending) {
            opHtml = `
                <div class="flex flex-col items-center gap-2 px-1">
                    <span class="text-on-surface-variant text-[13px] font-bold">승인 대기중</span>
                    <button onclick="cancelOKRRequest(${g.id})" class="w-full text-error border border-error hover:bg-error/10 py-1.5 rounded-lg text-[12px] font-bold transition-colors">요청 취소</button>
                </div>
            `;
        } else {
            opHtml = `<span class="text-success font-black text-[14px]">합의 완료</span>`;
        }

        return `
            <tr class="hover:bg-surface-container-lowest transition-colors border-b border-blue-50/50">
                <td class="py-5 px-4 text-center border-r border-blue-50/30 font-bold text-on-surface-variant text-[14px] w-12">${i+1}</td>
                <td class="py-5 px-6 border-r border-blue-50/30 w-[35%] align-top">
                    <textarea rows="3" oninput="updateOKRTitle(${g.id}, this.value)" ${!isEditable?'disabled':''} class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-bold text-on-surface outline-none focus:border-primary disabled:bg-surface-container-low shadow-sm resize-none">${g.text}</textarea>
                </td>
                <td class="py-5 px-6 border-r border-blue-50/30 w-[40%] align-top">
                    <div class="flex flex-col gap-3">
                        ${g.keyResults.map((kr, kri) => `
                            <div class="flex group items-center gap-2">
                                <input type="text" value="${kr.text}" oninput="updateKRTitle(${g.id}, '${kr.id}', this.value)" ${!isEditable?'disabled':''} class="flex-1 bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-medium text-on-surface outline-none focus:border-primary disabled:bg-surface-container-low shadow-sm transition-all">
                                ${isEditable && g.keyResults.length > 1 ? `<button onclick="removeKR(${g.id}, '${kr.id}')" class="text-error opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-error/10 rounded-md"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>` : ''}
                            </div>
                        `).join('')}
                        ${isEditable ? `<button onclick="addKR(${g.id})" class="text-primary font-bold text-[12px] flex items-center gap-1 hover:bg-primary/5 py-1 px-2 rounded-md w-max transition-colors mt-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> 추가</button>` : ''}
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
                        <th class="py-4 px-6 border-r border-blue-50/30">OKR</th>
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

            return `
                <tr class="hover:bg-surface-container-lowest/50 transition-colors border-b border-blue-50/50">
                    <td class="py-6 px-4 text-center border-r border-blue-50/30 font-bold text-on-surface-variant text-[14px] w-12 align-top">${i+1}</td>
                    <td class="py-6 px-6 w-[25%] border-r border-blue-50/30 align-top">
                        <textarea rows="3" oninput="updateOKRTitle(${g.id}, this.value)" ${isPending ? 'disabled':''} class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-bold text-on-surface focus:border-primary outline-none shadow-sm disabled:bg-surface-container-low resize-none">${cTitle}</textarea>
                    </td>
                    <td class="py-6 px-6 w-[35%] border-r border-blue-50/30 align-top">
                        <div class="flex flex-col gap-4">
                            ${krsToRender.map(kr => `
                                <div class="flex group items-center gap-2 h-[44px]">
                                    <input type="text" value="${kr.text}" oninput="updateKRTitle(${g.id}, '${kr.id}', this.value, true)" ${isPending?'disabled':''} class="h-full w-full bg-white border border-blue-100 rounded-lg px-3 text-[14px] font-medium text-on-surface focus:border-primary outline-none shadow-sm disabled:bg-surface-container-low transition-all">
                                    ${!isPending && krsToRender.length > 1 ? `<button onclick="removeKR(${g.id}, '${kr.id}', true)" class="h-full px-2 text-error opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/10 rounded-md shrink-0 flex items-center justify-center"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>` : ''}
                                </div>
                            `).join('')}
                            ${!isPending ? `<button onclick="addKR(${g.id}, true)" class="text-primary font-bold text-[12px] flex items-center gap-1 hover:bg-primary/5 py-1 px-2 rounded-md w-max transition-colors"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> 추가</button>` : ''}
                        </div>
                    </td>
                    <td class="py-6 px-4 w-[25%] border-r border-blue-50/30 align-top">
                        <div class="flex flex-col gap-4">
                            ${krsToRender.map(kr => {
                                return `
                                    <div class="flex items-center justify-between px-4 h-[44px] bg-surface-container-lowest rounded-xl border border-blue-50 shadow-inner">
                                        <input type="range" min="0" max="100" value="${kr.progress}" oninput="updateKRProgress(${g.id}, '${kr.id}', this.value)" ${isPending?'disabled':''} class="w-full accent-primary h-1.5 bg-blue-100 rounded-full appearance-none cursor-pointer mr-4">
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
                                `<button onclick="cancelOKRRequest(${g.id})" class="w-full border border-error text-error hover:bg-error/10 py-2 rounded-lg text-[13px] font-bold shadow-sm transition-all">요청 취소</button>` : 
                                `<button onclick="submitModifyRequest(${g.id})" class="w-full bg-primary text-white py-2 rounded-lg text-[13px] font-bold hover:bg-primary-dim shadow transition-all">수정 요청</button>`
                            }
                        </div>
                    </td>
                </tr>
            `;
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
                        <th class="py-4 px-6 border-r border-blue-50/30">OKR</th>
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
    const list = STATE.allGoals.filter(g => (g.requestType !== null || g.isProcessed === true) && g.periodType === STATE.requestsTab && g.periodValue === STATE.requestsPeriodValue);
    list.sort((a,b) => (a.isProcessed === b.isProcessed) ? 0 : a.isProcessed ? 1 : -1);

    let rowsHtml = '';
    if(list.length === 0) {
        rowsHtml = `<tr><td colspan="7" class="py-24 text-center text-on-surface-variant font-bold text-[14px]">불러올 수 있는 요청 데이터가 없습니다.</td></tr>`;
    } else {
        rowsHtml = list.map(g => {
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
                    <td class="py-6 px-5 text-center w-36 align-middle">
                        ${g.isProcessed ? 
                            `<button onclick="undoApproval(${g.id})" class="w-full py-2.5 bg-white text-error font-extrabold text-[14px] rounded-lg shadow-sm hover:bg-error/5 transition-all border border-error">취소</button>` : 
                            `<button onclick="approveAdminRequest(${g.id})" class="w-full py-2.5 bg-primary text-white font-extrabold text-[14px] rounded-lg shadow-md hover:scale-[1.04] transition-all border border-primary-dim">승인 처리</button>`
                        }
                    </td>
                </tr>
            `;
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
        <div class="space-y-6 max-h-[75vh] overflow-y-auto px-2 custom-scroll py-2">
            <!-- OKR Diff Container -->
            <div class="flex flex-col gap-2">
                <div class="text-[14px] font-black text-on-surface-variant uppercase tracking-wider pl-1 font-display">Target OKR</div>
                ${g.tempText !== undefined && g.tempText !== g.text ? `
                    <div class="grid grid-cols-2 gap-4">
                        <div class="p-5 bg-error/5 text-error text-[15px] rounded-xl border border-error/10 relative">
                            <span class="absolute top-0 right-0 bg-error text-white text-[11px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-xl">AS-IS</span>
                            <span class="line-through font-medium leading-relaxed">${g.text}</span>
                        </div>
                        <div class="p-5 bg-success/5 text-success text-[15px] font-extrabold rounded-xl border border-success/20 relative shadow-sm">
                            <span class="absolute top-0 right-0 bg-success text-white text-[11px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-xl">TO-BE</span>
                            <span class="leading-relaxed">${g.tempText}</span>
                        </div>
                    </div>
                ` : `<div class="p-5 text-on-surface font-extrabold text-[15px] bg-white rounded-xl border border-blue-100 shadow-sm leading-relaxed">${g.text}</div>`}
            </div>
            
            <div class="h-px bg-blue-100/50 w-full my-6"></div>

            <!-- KR Diff Container -->
            <div class="flex flex-col gap-4">
                <div class="text-[14px] font-black text-on-surface-variant uppercase tracking-wider pl-1 font-display mb-1">Key Results Data</div>
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

        let bgClass = "bg-surface-container-lowest";
        if(isNew) bgClass = "bg-[#ecfdf5] border-[#10b981]/20";

        diff += `<div class="p-6 ${bgClass} rounded-2xl border border-blue-50 shadow-sm relative overflow-hidden">
                    ${isNew ? '<div class="absolute right-4 top-4 bg-success text-white text-[10px] font-bold px-2 py-1 rounded">신규 추가 항목</div>' : ''}
                    <div class="absolute left-0 top-0 bottom-0 w-1.5 ${isNew ? 'bg-success' : 'bg-primary/30'}"></div>
                    <div class="text-[13px] font-extrabold ${isNew ? 'text-success' : 'text-primary'} mb-4 uppercase tracking-widest pl-1">KR #${i+1}</div>`;
        
        // Text Comparison
        if(hasTextDiff) {
            diff += `
                <div class="grid grid-cols-2 gap-4 mb-5">
                    <div class="p-4 bg-error/5 text-error text-[14px] rounded-lg border border-error/10 font-medium line-through">${oldKr.text}</div>
                    <div class="p-4 bg-success/5 text-success text-[14px] font-extrabold rounded-lg border border-success/20 shadow-sm">${kr.text}</div>
                </div>
            `;
        } else {
            diff += `<div class="text-[15px] text-on-surface font-bold mb-5 bg-white p-4 border border-blue-50 rounded-xl">${kr.text}</div>`;
        }
        
        // Progress Comparison
        if(hasProgDiff) {
            diff += `
                <div class="flex items-center gap-4 text-[14px] bg-white p-3.5 rounded-xl border border-blue-50 w-max shadow-sm">
                    <span class="text-on-surface-variant font-bold">진척률 변동현황</span>
                    <span class="text-on-surface-variant/40 line-through font-medium ml-2">${oldKr.progress}%</span>
                    <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    <span class="text-primary font-black text-[18px]">${kr.progress}%</span>
                </div>
            `;
        } else {
            diff += `<div class="text-[13px] text-on-surface-variant font-bold bg-white w-max px-4 py-2.5 rounded-xl border border-blue-50">현재 유지 진척률: <span class="text-on-surface ml-1 text-[14px] font-black">${kr.progress}%</span></div>`;
        }
        diff += `</div>`;
    });
    
    // Check for deleted items
    if(g.tempKeyResults) {
        g.keyResults.forEach(oldKr => {
            if(!g.tempKeyResults.find(k => k.id === oldKr.id)) {
                diff += `<div class="p-6 bg-error/5 rounded-2xl border border-error/20 shadow-sm relative overflow-hidden opacity-80">
                            <div class="absolute right-4 top-4 bg-error text-white text-[10px] font-bold px-2 py-1 rounded">삭제 요청 항목</div>
                            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-error/50"></div>
                            <div class="text-[13px] font-extrabold text-error mb-4 uppercase tracking-widest pl-1">KR (삭제됨)</div>
                            <div class="text-[14px] text-error font-medium mb-3 bg-white/50 p-4 border border-error/20 rounded-xl line-through">${oldKr.text}</div>
                            <div class="text-[13px] text-error font-bold bg-white/50 w-max px-4 py-2 rounded-xl border border-error/20">삭제 당시 진척률: <span class="ml-1 text-[14px] font-black">${oldKr.progress}%</span></div>
                        </div>`;
            }
        });
    }

    diff += `</div></div>`;
    return diff.replace(/"/g, '&quot;').replace(/\n/g, '');
}

function renderModal(container) {
    if(!STATE.modalData) return;
    const hasAction = typeof STATE.modalData.onConfirmAction === 'function';
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
                    ${hasAction ? `<button id="modal-confirm-btn" class="px-10 py-3.5 bg-primary hover:bg-primary-dim text-white font-black text-[14px] rounded-xl shadow-xl transition-all">확인 결정</button>` : ''}
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', mHtml);
    if(hasAction) document.getElementById('modal-confirm-btn').onclick = () => STATE.modalData.onConfirmAction();
}

// Auth
document.getElementById('btn-login').addEventListener('click', () => {
    const id = document.getElementById('login-id').value;
    const pw = document.getElementById('login-pw').value;
    if(pw !== '1111') { alert('비밀번호가 틀렸습니다.'); return; }
    if(id === 'master') STATE.user = { id: 'master', name: USER_NAMES.master, role: 'admin' };
    else if(id === 'member') STATE.user = { id: 'member', name: USER_NAMES.member, role: 'user' };
    else { alert('유효하지 않은 계정'); return; }
    document.getElementById('user-avatar').innerText = STATE.user.name.charAt(0);
    document.getElementById('auth-user-name').innerText = STATE.user.name;
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('app-view').classList.remove('hidden');
    STATE.currentView = 'dashboard';
    updateNavigation();
    renderCurrentView();
});
document.getElementById('btn-logout').addEventListener('click', () => {
    STATE.user = null;
    document.getElementById('login-view').classList.remove('hidden');
    document.getElementById('app-view').classList.add('hidden');
});

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
window.updateMemberField = function(id, field, value) {
    const member = STATE.members.find(m => m.id === id);
    if(member) {
        member[field] = value;
    }
};

window.addMember = function() {
    const newId = Math.max(...STATE.members.map(m => m.id)) + 1;
    STATE.members.push({
        id: newId,
        name: '',
        team: STATE.teams.length > 0 ? STATE.teams[0].name : '',
        position: '팀원',
        email: ''
    });
    renderCurrentView();
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

window.addTeam = function() {
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
    const newId = Math.max(...STATE.teams.map(t => t.id), 0) + 1;
    STATE.teams.push({ id: newId, name: teamName });
    closeModal();
    openTeamManagement();
};

window.updateTeamName = function(id) {
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
    
    // 구성원의 팀명도 업데이트
    STATE.members.forEach(member => {
        if(member.team === oldName) {
            member.team = newName;
        }
    });
    
    team.name = newName;
    closeModal();
    openTeamManagement();
};

window.deleteTeam = function(id) {
    const team = STATE.teams.find(t => t.id === id);
    if(!team) return;
    
    // 해당 팀에 속한 구성원이 있는지 확인
    const membersInTeam = STATE.members.filter(m => m.team === team.name);
    if(membersInTeam.length > 0) {
        alert(`${team.name}에 ${membersInTeam.length}명의 구성원이 있습니다. 구성원을 먼저 다른 팀으로 이동하거나 삭제해주세요.`);
        return;
    }
    
    if(confirm(`'${team.name}' 팀을 삭제하시겠습니까?`)) {
        STATE.teams = STATE.teams.filter(t => t.id !== id);
        closeModal();
        openTeamManagement();
    }
};

window.removeMember = function(id) {
    if(STATE.members.length > 1) {
        STATE.members = STATE.members.filter(m => m.id !== id);
        renderCurrentView();
    } else {
        alert('최소 1명의 구성원이 필요합니다.');
    }
};

function renderMembers(container) {
    const teamOptions = STATE.teams.map(team => 
        `<option value="${team.name}">${team.name}</option>`
    ).join('');

    let rowsHtml = STATE.members.map((member, i) => {
        return `
            <tr class="hover:bg-surface-container-lowest transition-colors border-b border-blue-50/50">
                <td class="py-5 px-4 text-center border-r border-blue-50/30 font-bold text-on-surface-variant text-[14px] w-12">${i+1}</td>
                <td class="py-5 px-6 border-r border-blue-50/30 w-[20%]">
                    <input type="text" value="${member.name}" oninput="updateMemberField(${member.id}, 'name', this.value)" class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-bold text-on-surface outline-none focus:border-primary shadow-sm transition-all" placeholder="이름 입력">
                </td>
                <td class="py-5 px-6 border-r border-blue-50/30 w-[20%]">
                    <select onchange="updateMemberField(${member.id}, 'team', this.value)" class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-medium text-on-surface outline-none focus:border-primary shadow-sm transition-all">
                        <option value="">팀 선택</option>
                        ${STATE.teams.map(team => `<option value="${team.name}" ${member.team === team.name ? 'selected' : ''}>${team.name}</option>`).join('')}
                    </select>
                </td>
                <td class="py-5 px-6 border-r border-blue-50/30 w-[15%]">
                    <select onchange="updateMemberField(${member.id}, 'position', this.value)" class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-medium text-on-surface outline-none focus:border-primary shadow-sm transition-all">
                        <option value="팀장" ${member.position === '팀장' ? 'selected' : ''}>팀장</option>
                        <option value="팀원" ${member.position === '팀원' ? 'selected' : ''}>팀원</option>
                    </select>
                </td>
                <td class="py-5 px-6 border-r border-blue-50/30 w-[30%]">
                    <input type="email" value="${member.email}" oninput="updateMemberField(${member.id}, 'email', this.value)" class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-[14px] font-medium text-on-surface outline-none focus:border-primary shadow-sm transition-all" placeholder="이메일 입력">
                </td>
                <td class="py-5 px-6 text-center w-24">
                    <button onclick="removeMember(${member.id})" class="px-4 py-2 bg-white border border-error text-error font-bold text-[13px] rounded-lg hover:bg-error/10 transition-colors shadow-sm">삭제</button>
                </td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <div class="mb-4 w-full flex justify-between items-center">
            <div class="text-[14px] font-bold text-on-surface-variant">
                총 <span class="text-primary font-black mx-1">${STATE.members.length}</span>명의 구성원
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
            </div>
        </div>
        <div class="bg-white rounded-2xl border border-blue-50 shadow-sm w-full overflow-hidden">
            <table class="w-full text-left table-auto">
                <thead class="bg-surface-container">
                    <tr class="text-[14px] text-on-surface-variant font-extrabold border-b border-blue-50">
                        <th class="py-4 px-4 text-center border-r border-blue-50/30">No.</th>
                        <th class="py-4 px-6 border-r border-blue-50/30">구성원</th>
                        <th class="py-4 px-6 border-r border-blue-50/30">팀명</th>
                        <th class="py-4 px-6 border-r border-blue-50/30">직책</th>
                        <th class="py-4 px-6 border-r border-blue-50/30">이메일</th>
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
    const list = STATE.allGoals.filter(g => (g.requestType !== null || g.isProcessed === true) && g.periodType === STATE.requestsTab && g.periodValue === STATE.requestsPeriodValue);
    list.sort((a,b) => (a.isProcessed === b.isProcessed) ? 0 : a.isProcessed ? 1 : -1);
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
        h += renderRequestsMobile(list);
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
            <!-- 헤더 섹션 -->
            <div class="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8 mb-8 border border-blue-50">
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                        <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    </div>
                    <div>
                        <h2 class="font-display text-2xl font-bold text-on-surface mb-1">OKR 가이드</h2>
                        <p class="text-on-surface-variant text-sm">목표 설정부터 관리까지, OKR 시스템 완벽 가이드</p>
                    </div>
                </div>
            </div>

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
                                            <p class="text-[13px] text-on-surface">클라우드 인프라 비용을 월 500만원에서 350만원으로 절감</p>
                                        </div>
                                        <div class="flex items-start gap-2">
                                            <div class="w-1.5 h-1.5 rounded-full bg-success mt-2 flex-shrink-0"></div>
                                            <p class="text-[13px] text-on-surface">현업 업무 효율성 향상을 위한 1 M/M 이상 프로젝트 3건 완료</p>
                                        </div>
                                        <div class="flex items-start gap-2">
                                            <div class="w-1.5 h-1.5 rounded-full bg-success mt-2 flex-shrink-0"></div>
                                            <p class="text-[13px] text-on-surface">코드 리뷰 완료 시간을 48시간에서 24시간으로 단축</p>
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
                                            <p class="text-[13px] text-on-surface">검색 광고 CPC를 1,200원에서 800원으로 절감</p>
                                        </div>
                                        <div class="flex items-start gap-2">
                                            <div class="w-1.5 h-1.5 rounded-full bg-success mt-2 flex-shrink-0"></div>
                                            <p class="text-[13px] text-on-surface">광고 ROAS를 250%에서 400%로 향상</p>
                                        </div>
                                        <div class="flex items-start gap-2">
                                            <div class="w-1.5 h-1.5 rounded-full bg-success mt-2 flex-shrink-0"></div>
                                            <p class="text-[13px] text-on-surface">신규 고객 전환율을 2.5%에서 4%로 증가</p>
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
                                            <p class="text-[13px] text-on-surface">디자인 시스템 컴포넌트 라이브러리 80개 구축 완료</p>
                                        </div>
                                        <div class="flex items-start gap-2">
                                            <div class="w-1.5 h-1.5 rounded-full bg-success mt-2 flex-shrink-0"></div>
                                            <p class="text-[13px] text-on-surface">도메인별 UX/UI 표준화 가이드 5건 작성 및 배포</p>
                                        </div>
                                        <div class="flex items-start gap-2">
                                            <div class="w-1.5 h-1.5 rounded-full bg-success mt-2 flex-shrink-0"></div>
                                            <p class="text-[13px] text-on-surface">디자인 작업 소요 시간을 평균 5일에서 3일로 단축</p>
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
                                        <p class="text-[12px] text-on-surface-variant">월간 NPS 점수</p>
                                    </div>
                                    <div class="flex items-start gap-2">
                                        <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                                        <p class="text-[12px] text-on-surface-variant">평균 응답 시간</p>
                                    </div>
                                    <div class="flex items-start gap-2">
                                        <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                                        <p class="text-[12px] text-on-surface-variant">월간 이탈률</p>
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
