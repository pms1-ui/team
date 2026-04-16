// --- State & Config ---
const STATE = {
    user: null, // { id: 'master'|'member', name: '...', role: 'admin'|'user' }
    currentView: 'dashboard',
    
    // Tab states
    dashboardTab: 'monthly', // 'monthly', 'quarterly', 'yearly'
    dashboardPeriodValue: '', // '2026-04', '2026-Q2', '2026'
    
    goalsSetTab: 'monthly',
    goalsManageTab: 'monthly',
    
    // Current draft goals for submission
    activeGoalsDraft: [ { id: 1, text: '', actionPlan: '' } ],
    draftSubmitted: false, // UI state to show '승인 대기'
    
    // Submitted Goals Data
    submittedGoals: [
        { id: 101, userId: 'member', periodType: 'monthly', periodValue: '2026-04', text: '기존 시스템 UI/UX 전면 개편 및 컴포넌트화', actionPlan: '1. 피그마 디자인 완료\n2. 공통 컴포넌트 분리', progress: 40, status: '승인 완료', requestType: null },
        { id: 102, userId: 'member', periodType: 'monthly', periodValue: '2026-04', text: '주요 지표 시각화 및 대시보드 구조 설계', actionPlan: 'Chart.js 붙이기\n더미 데이터 연동', progress: 85, status: '승인 완료', requestType: 'update' },
        { id: 103, userId: 'member', periodType: 'quarterly', periodValue: '2026-Q2', text: 'DT 전략 기반 신규 프레임워크 1.0 론칭', actionPlan: '기획서 검토', progress: 20, status: '합의 대기', requestType: 'new' }
    ]
};

const USER_NAMES = {
    'master': '마스터 관리자',
    'member': '김전략 (팀원)',
    'member2': '이개발 (팀원)'
};

// --- Initializing dynamic dates ---
function initDates() {
    const d = new Date();
    const currYear = d.getFullYear() > 2025 ? d.getFullYear() : 2026;
    const currMonth = d.getMonth() + 1;
    STATE.dashboardPeriodValue = `${currYear}-${String(currMonth).padStart(2, '0')}`;
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

function getDefaultPeriodValue(type) {
    const d = new Date();
    const currYear = d.getFullYear() > 2025 ? d.getFullYear() : 2026;
    if(type === 'monthly') return `${currYear}-${String(d.getMonth()+1).padStart(2, '0')}`;
    if(type === 'quarterly') return `${currYear}-Q${Math.floor(d.getMonth()/3)+1}`;
    return `${currYear}`;
}

// --- Menu Configuration ---
const MENU_ITEMS = [
    { id: 'dashboard', label: '대시보드', icon: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['admin', 'user'] },
    { id: 'goals_set', label: '목표 설정 및 수정', icon: '<path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['user', 'admin'] },
    { id: 'goals_manage', label: '목표 관리', icon: '<path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['user', 'admin'] },
    { id: 'requests', label: '요청 관리', icon: '<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['admin'] }
];

// --- Global Dispatchers ---
window.setTab = function(view, tab) {
    if (view === 'dashboard') {
        STATE.dashboardTab = tab;
        STATE.dashboardPeriodValue = getDefaultPeriodValue(tab);
    }
    if (view === 'goals_set') { STATE.goalsSetTab = tab; STATE.draftSubmitted = false; }
    if (view === 'goals_manage') STATE.goalsManageTab = tab;
    renderCurrentView();
};

window.setDashboardPeriod = function(val) {
    STATE.dashboardPeriodValue = val;
    renderCurrentView();
};

// Goals Set Logic
window.addGoalRow = function() {
    if (STATE.draftSubmitted) return;
    if (STATE.activeGoalsDraft.length < 10) {
        STATE.activeGoalsDraft.push({ id: Date.now(), text: '', actionPlan: '' });
        renderCurrentView();
    } else {
        alert('목표는 최대 10개까지만 설정 가능합니다.');
    }
};

window.removeGoalRow = function(id) {
    if (STATE.draftSubmitted) return;
    STATE.activeGoalsDraft = STATE.activeGoalsDraft.filter(g => g.id !== id);
    if(STATE.activeGoalsDraft.length === 0) window.addGoalRow();
    else renderCurrentView();
};

window.updateGoalText = function(id, value) {
    const goal = STATE.activeGoalsDraft.find(g => g.id === id);
    if(goal) goal.text = value;
};
window.updateGoalPlan = function(id, value) {
    const goal = STATE.activeGoalsDraft.find(g => g.id === id);
    if(goal) goal.actionPlan = value;
};

window.submitGoals = function() {
    const periodValue = document.getElementById('period-selector').value;
    
    let isAllFilled = STATE.activeGoalsDraft.every(g => g.text.trim() !== '');
    if(!isAllFilled) {
        alert('핵심 목표 내용을 모두 입력해주세요.');
        return;
    }
    if(STATE.activeGoalsDraft.length < 3) {
        alert('최소 3개의 목표를 입력해야 합니다.');
        return;
    }
    
    STATE.activeGoalsDraft.forEach(g => {
        STATE.submittedGoals.push({
            id: Date.now() + Math.random(),
            userId: STATE.user.id,
            periodType: STATE.goalsSetTab,
            periodValue: periodValue,
            text: g.text,
            actionPlan: g.actionPlan,
            progress: 0,
            status: '합의 대기',
            requestType: 'new' // 'new', 'update', 'content-update'
        });
    });
    
    STATE.draftSubmitted = true;
    renderCurrentView();
};

// Goals Manage Details Edit
window.updateManageGoalText = function(id, value) {
    const goal = STATE.submittedGoals.find(g => g.id == id);
    if(goal) goal.text = value; // Direct update for now, will request separately
};
window.updateManageGoalPlan = function(id, value) {
    const goal = STATE.submittedGoals.find(g => g.id == id);
    if(goal) goal.actionPlan = value;
};
window.updateProgress = function(goalId, newProgress) {
    const goal = STATE.submittedGoals.find(g => g.id == goalId);
    if(goal) goal.progress = parseInt(newProgress);
    const label = document.getElementById(`prog-val-${goalId}`);
    if(label) label.innerText = newProgress + '%';
};

window.requestContentUpdate = function(goalId) {
    const goal = STATE.submittedGoals.find(g => g.id == goalId);
    if(goal) {
        if(!goal.text.trim()) { alert('목표 내용을 입력하세요.'); return; }
        goal.status = '내용 수정 대기';
        goal.requestType = 'content-update';
        alert('목표 내용 수정 요청이 팀장에게 전송되었습니다.');
        renderCurrentView();
    }
};

window.requestProgressUpdate = function(goalId) {
    const goal = STATE.submittedGoals.find(g => g.id == goalId);
    if(goal) {
        goal.status = '진척률 확인 대기';
        goal.requestType = 'progress-update';
        alert('진척률 업데이트 확인 요청이 전송되었습니다.');
        renderCurrentView();
    }
};

window.approveRequest = function(goalId) {
    const goal = STATE.submittedGoals.find(g => g.id == goalId);
    if(goal) {
        goal.status = '승인 완료';
        goal.requestType = null;
        renderCurrentView();
    }
};

function updateNavigation() {
    const nav = document.getElementById('nav-menu');
    nav.innerHTML = '';
    MENU_ITEMS.forEach(item => {
        if (!item.roles.includes(STATE.user.role)) return;
        
        const btn = document.createElement('button');
        const isActive = STATE.currentView === item.id;
        btn.className = `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container'}`;
        btn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">${item.icon}</svg> ${item.label}`;
        btn.onclick = () => {
            STATE.currentView = item.id;
            updateNavigation();
            renderCurrentView();
        };
        nav.appendChild(btn);
    });
}

function renderCurrentView() {
    const content = document.getElementById('content-area');
    content.innerHTML = '';
    const title = document.getElementById('page-title');
    const menuItem = MENU_ITEMS.find(m => m.id === STATE.currentView);
    title.innerText = menuItem ? menuItem.label : '대시보드';
    
    if (STATE.currentView === 'dashboard') renderDashboard(content);
    else if (STATE.currentView === 'goals_set') renderGoalsSet(content);
    else if (STATE.currentView === 'goals_manage') renderGoalsManage(content);
    else if (STATE.currentView === 'requests') renderRequests(content);
}

// --- Specific Views ---

function renderDashboard(container) {
    const activeTabCls = "bg-primary text-white font-medium shadow-sm";
    const inactiveTabCls = "text-on-surface-variant hover:bg-surface-container";

    // Dropdown for period
    let periodOptionsHtml = '';
    const d = new Date();
    const currYear = d.getFullYear() > 2025 ? d.getFullYear() : 2026;
    if (STATE.dashboardTab === 'monthly') {
        for(let m=1; m<=12; m++) {
            let val = `${currYear}-${String(m).padStart(2, '0')}`;
            let sel = STATE.dashboardPeriodValue === val ? 'selected' : '';
            periodOptionsHtml += `<option value="${val}" ${sel}>${currYear}년 ${m}월</option>`;
        }
    } else if (STATE.dashboardTab === 'quarterly') {
        for(let q=1; q<=4; q++) {
            let val = `${currYear}-Q${q}`;
            let sel = STATE.dashboardPeriodValue === val ? 'selected' : '';
            periodOptionsHtml += `<option value="${val}" ${sel}>${currYear}년 ${q}분기</option>`;
        }
    } else if (STATE.dashboardTab === 'yearly') {
        periodOptionsHtml += `<option value="${currYear}" ${STATE.dashboardPeriodValue === String(currYear) ? 'selected':''}>${currYear}년</option>`;
        periodOptionsHtml += `<option value="${currYear+1}" ${STATE.dashboardPeriodValue === String(currYear+1) ? 'selected':''}>${currYear+1}년</option>`;
    }

    const relevantGoals = STATE.submittedGoals.filter(g => g.periodType === STATE.dashboardTab && g.periodValue === STATE.dashboardPeriodValue);
    
    let membersWithGoals = {};
    if(STATE.user.role === 'admin') {
        relevantGoals.forEach(g => {
            if(!membersWithGoals[g.userId]) membersWithGoals[g.userId] = [];
            membersWithGoals[g.userId].push(g);
        });
    } else {
        membersWithGoals[STATE.user.id] = relevantGoals.filter(g => g.userId === STATE.user.id);
    }

    let dashboardHtml = `
        <div class="flex items-center justify-between mb-8">
            <div class="flex items-center gap-4">
                <h3 class="font-display text-lg font-semibold">전체 구성원 목표 달성 현황</h3>
                <select id="dash-period-selector" onchange="setDashboardPeriod(this.value)" class="bg-surface-container text-primary font-bold border border-blue-50 rounded-lg text-sm px-4 py-2 outline-none">
                    ${periodOptionsHtml}
                </select>
            </div>
            <div class="flex items-center bg-white border border-blue-50 rounded-lg p-1 shadow-sm">
                <button onclick="setTab('dashboard', 'monthly')" class="px-5 py-1.5 rounded-md text-sm transition-all ${STATE.dashboardTab === 'monthly' ? activeTabCls : inactiveTabCls}">월간</button>
                <button onclick="setTab('dashboard', 'quarterly')" class="px-5 py-1.5 rounded-md text-sm transition-all ${STATE.dashboardTab === 'quarterly' ? activeTabCls : inactiveTabCls}">분기</button>
                <button onclick="setTab('dashboard', 'yearly')" class="px-5 py-1.5 rounded-md text-sm transition-all ${STATE.dashboardTab === 'yearly' ? activeTabCls : inactiveTabCls}">연간</button>
            </div>
        </div>
    `;

    if(Object.keys(membersWithGoals).length === 0) {
        dashboardHtml += `
        <div class="flex flex-col items-center justify-center bg-white h-64 rounded-xl border border-dashed border-blue-100 text-on-surface-variant">
            <svg class="w-12 h-12 mb-3 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
            <p>해당 기간에 조회할 체결 목표가 없습니다.</p>
        </div>`;
    } else {
        dashboardHtml += `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">`;
        
        for(let userId in membersWithGoals) {
            const mGoals = membersWithGoals[userId];
            const name = USER_NAMES[userId] || userId;
            
            const goalsListHtml = mGoals.map(g => `
                <div class="mb-5 last:mb-0 bg-surface-container-lowest p-4 rounded-xl border border-blue-50/50">
                    <div class="flex justify-between items-start mb-2">
                        <p class="text-sm font-semibold leading-snug">${g.text}</p>
                        <span class="text-xs font-black ${g.progress >= 100 ? 'text-success' : 'text-primary'} ml-3 whitespace-nowrap bg-blue-50 px-2 py-0.5 rounded">${g.progress}%</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-full bg-surface-container h-2 rounded-full overflow-hidden border border-black/5">
                            <div class="${g.progress >= 100 ? 'bg-success' : 'bg-primary'} h-full transition-all" style="width: ${g.progress}%"></div>
                        </div>
                    </div>
                </div>
            `).join('');
            
            const avgProgress = mGoals.length > 0 ? Math.round(mGoals.reduce((s, g) => s + g.progress, 0) / mGoals.length) : 0;
            
            dashboardHtml += `
                <div class="bg-white rounded-2xl border border-blue-50 shadow-sm p-6 flex flex-col h-full kpi-card">
                    <div class="flex items-center gap-4 mb-6 pb-5 border-b border-blue-50/50">
                        <div class="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-primary font-bold text-lg border border-blue-100">
                            ${name.charAt(0)}
                        </div>
                        <div>
                            <h4 class="font-bold text-on-surface text-lg">${name}</h4>
                            <p class="text-[11px] text-on-surface-variant mt-0.5 bg-surface-container inline-block px-2 py-0.5 rounded-full font-semibold">평균 진척률: <span class="text-primary font-black">${avgProgress}%</span></p>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto pr-2">
                        ${goalsListHtml}
                    </div>
                </div>
            `;
        }
        
        dashboardHtml += `</div>`;
    }
    
    container.innerHTML = dashboardHtml;
}

function renderGoalsSet(container) {
    const activeTabCls = "border-b-2 border-primary text-primary font-bold";
    const inactiveTabCls = "text-on-surface-variant hover:text-primary transition-colors";
    
    let periodOptionsHtml = '';
    const date = new Date();
    const currYear = date.getFullYear() > 2025 ? date.getFullYear() : 2026;
    const currMonth = date.getMonth() + 1;
    const currQ = Math.floor((currMonth - 1) / 3) + 1;
    
    if (STATE.goalsSetTab === 'monthly') {
        for(let m=currMonth; m<=12; m++) {
            let val = `${currYear}-${String(m).padStart(2, '0')}`;
            periodOptionsHtml += `<option value="${val}">${currYear}년 ${m}월</option>`;
        }
    } else if (STATE.goalsSetTab === 'quarterly') {
        for(let q=currQ; q<=4; q++) {
            let val = `${currYear}-Q${q}`;
            periodOptionsHtml += `<option value="${val}">${currYear}년 ${q}분기</option>`;
        }
    } else if (STATE.goalsSetTab === 'yearly') {
        periodOptionsHtml += `<option value="${currYear}">${currYear}년</option>`;
        periodOptionsHtml += `<option value="${currYear+1}">${currYear+1}년</option>`;
    }

    let guideHtml = '';
    if(STATE.goalsSetTab === 'monthly') guideHtml = '현재 월부터 설정 가능합니다. 가급적 해당 월이 시작되기 전에 목표를 제출해 주세요.';
    if(STATE.goalsSetTab === 'quarterly') guideHtml = '현재 분기부터 설정 가능합니다. 명확하고 구체적인 분기 OKR을 작성해 주세요.';
    if(STATE.goalsSetTab === 'yearly') guideHtml = '연간 목표는 조직의 큰 방향성과 얼라인 되어야 합니다.';

    let rowsHtml = STATE.activeGoalsDraft.map((g, index) => {
        return `
            <div class="bg-surface-container-lowest border border-blue-100 rounded-xl p-5 relative shadow-sm hover:shadow-md transition-shadow group">
                <div class="flex justify-between items-start mb-4">
                    <h5 class="text-xs font-bold text-on-surface-variant uppercase tracking-wider bg-surface-container px-2 py-1 rounded">목표 #${index + 1}</h5>
                    ${!STATE.draftSubmitted ? `
                    <button onclick="removeGoalRow(${g.id})" class="text-error hover:bg-error/10 p-1.5 rounded transition-colors opacity-50 group-hover:opacity-100" title="삭제">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                    ` : ''}
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-on-surface mb-1.5 ml-1">핵심 달성 목표 (1줄 요약)</label>
                        <input type="text" value="${g.text}" oninput="updateGoalText(${g.id}, this.value)" ${STATE.draftSubmitted?'disabled':''} class="w-full bg-white border border-blue-200 rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 transition-all shadow-sm font-medium" placeholder="예: MAU 20% 증가 달성">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-on-surface mb-1.5 ml-1">세부 액션 플랜 (멀티 라인 작성)</label>
                        <textarea rows="3" oninput="updateGoalPlan(${g.id}, this.value)" ${STATE.draftSubmitted?'disabled':''} class="w-full bg-white border border-blue-200 rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 transition-all text-sm resize-none shadow-sm" placeholder="액션 아이템 1...&#10;액션 아이템 2...&#10;액션 아이템 3...">${g.actionPlan}</textarea>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    let btnHtml = STATE.draftSubmitted 
        ? `<button disabled class="bg-surface-container text-on-surface-variant px-10 py-3.5 rounded-xl font-bold tracking-wide shadow-inner cursor-not-allowed border border-blue-100">승인 대기 중</button>`
        : `<button onclick="submitGoals()" class="bg-gradient-to-br from-primary to-primary-dim text-white px-10 py-3.5 rounded-xl shadow-[0_4px_14px_rgba(0,83,219,0.3)] hover:shadow-[0_6px_20px_rgba(0,83,219,0.4)] font-bold tracking-wide transition-all translate-y-0 hover:-translate-y-0.5">합의 요청하기</button>`;

    let html = `
        <!-- Tabs -->
        <div class="flex items-center gap-8 border-b-2 border-blue-50 mb-8 px-2">
            <button onclick="setTab('goals_set', 'monthly')" class="pb-3 text-lg transition-all ${STATE.goalsSetTab === 'monthly' ? activeTabCls : inactiveTabCls}">월별 목표 설정</button>
            <button onclick="setTab('goals_set', 'quarterly')" class="pb-3 text-lg transition-all ${STATE.goalsSetTab === 'quarterly' ? activeTabCls : inactiveTabCls}">분기별 목표 설정</button>
            <button onclick="setTab('goals_set', 'yearly')" class="pb-3 text-lg transition-all ${STATE.goalsSetTab === 'yearly' ? activeTabCls : inactiveTabCls}">연간 목표 설정</button>
        </div>

        <div class="bg-blue-50 border-l-4 border-primary p-4 rounded-r-xl mb-8 flex items-start gap-3">
            <svg class="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p class="text-sm font-medium text-on-surface">${guideHtml}</p>
        </div>

        <div class="bg-white rounded-2xl p-8 border border-blue-50 shadow-sm max-w-4xl mx-auto glass-panel">
            <div class="flex items-center justify-between mb-8 pb-5 border-b border-blue-50/50">
                <div class="flex items-center gap-4">
                    <h3 class="font-display text-2xl font-bold">🎯 목표 생성</h3>
                    <select id="period-selector" ${STATE.draftSubmitted?'disabled':''} class="bg-surface-container-lowest border-2 border-blue-100 rounded-lg text-sm px-4 py-2 focus:border-primary outline-none font-extrabold text-primary shadow-sm cursor-pointer">
                        ${periodOptionsHtml}
                    </select>
                </div>
                ${!STATE.draftSubmitted ? `
                <button onclick="addGoalRow()" class="flex items-center gap-2 px-5 py-2.5 bg-surface-container text-primary font-bold text-sm rounded-xl hover:bg-primary/10 transition-colors border border-blue-100">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    목표 추가하기
                </button>
                ` : ''}
            </div>
            
            <div class="space-y-6 mb-10">
                ${rowsHtml}
            </div>
            
            <div class="flex justify-end pt-6 border-t border-blue-50/50">
                ${btnHtml}
            </div>
        </div>
    `;
    container.innerHTML = html;
}

function renderGoalsManage(container) {
    const activeTabCls = "border-b-2 border-primary text-primary font-bold";
    const inactiveTabCls = "text-on-surface-variant hover:text-primary transition-colors";

    const myGoals = STATE.submittedGoals.filter(g => g.userId === STATE.user.id && g.periodType === STATE.goalsManageTab);
    
    let contentHtml = `
        <div class="flex flex-col items-center justify-center bg-white h-64 rounded-xl border border-dashed border-blue-100 text-on-surface-variant">
            <svg class="w-12 h-12 mb-3 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            <p>해당 기간에 등록된 목표가 없습니다.</p>
        </div>`;
        
    if(myGoals.length > 0) {
        contentHtml = myGoals.map(g => `
            <div class="bg-white rounded-2xl p-6 border border-blue-50 shadow-sm mb-6 kpi-card">
                <div class="flex items-start justify-between mb-4 pb-4 border-b border-blue-50/50">
                    <span class="px-3 py-1 bg-surface-container text-primary rounded-full font-black text-xs">${getPeriodLabel(g.periodType, g.periodValue)}</span>
                    <span class="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-xs font-bold text-on-surface">${g.status}</span>
                </div>
                
                <!-- Edit Content Section -->
                <div class="mb-6 space-y-4">
                    <div>
                        <label class="block text-[11px] font-bold text-on-surface-variant uppercase mb-1 ml-1">목표 핵심 텍스트</label>
                        <input type="text" value="${g.text}" onchange="updateManageGoalText(${g.id}, this.value)" class="w-full bg-surface-container-lowest border border-blue-100 rounded-lg px-4 py-2 text-sm font-semibold text-on-surface outline-none focus:border-primary focus:ring-1">
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-on-surface-variant uppercase mb-1 ml-1">액션 플랜 수정</label>
                        <textarea rows="2" onchange="updateManageGoalPlan(${g.id}, this.value)" class="w-full bg-surface-container-lowest border border-blue-100 rounded-lg px-4 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 resize-y">${g.actionPlan}</textarea>
                    </div>
                    <div class="flex justify-end mt-2">
                        <button onclick="requestContentUpdate(${g.id})" class="px-4 py-1.5 bg-surface-container text-primary font-bold text-xs rounded-lg hover:bg-primary/20 transition-colors shadow-sm">내용 수정 요청</button>
                    </div>
                </div>
                
                <!-- Details Update Section -->
                <div class="bg-surface-container-lowest p-5 rounded-xl border border-blue-100 flex items-center gap-8">
                    <div class="flex-1">
                        <div class="flex items-center justify-between font-bold text-sm mb-3">
                            <span class="text-on-surface">진척률 업데이트</span>
                            <span id="prog-val-${g.id}" class="text-primary text-xl font-black bg-blue-50 px-2 py-0.5 rounded">${g.progress}%</span>
                        </div>
                        <input type="range" min="0" max="100" value="${g.progress}" onchange="updateProgress(${g.id}, this.value)" oninput="document.getElementById('prog-val-${g.id}').innerText=this.value+'%'" class="w-full accent-primary h-2 bg-blue-50 rounded-lg appearance-none cursor-pointer">
                    </div>
                    <div class="border-l border-blue-100 pl-8">
                        <button onclick="requestProgressUpdate(${g.id})" class="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow hover:shadow-md hover:bg-primary-dim transition-all whitespace-nowrap text-sm flex items-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            진척률 확인 요청
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    let html = `
        <!-- Tabs -->
        <div class="flex items-center gap-8 border-b-2 border-blue-50 mb-8 px-2">
            <button onclick="setTab('goals_manage', 'monthly')" class="pb-3 text-lg transition-all ${STATE.goalsManageTab === 'monthly' ? activeTabCls : inactiveTabCls}">월별 목표 관리</button>
            <button onclick="setTab('goals_manage', 'quarterly')" class="pb-3 text-lg transition-all ${STATE.goalsManageTab === 'quarterly' ? activeTabCls : inactiveTabCls}">분기별 목표 관리</button>
            <button onclick="setTab('goals_manage', 'yearly')" class="pb-3 text-lg transition-all ${STATE.goalsManageTab === 'yearly' ? activeTabCls : inactiveTabCls}">연간 목표 관리</button>
        </div>
        
        <div class="bg-blue-50 border-l-4 border-primary p-4 rounded-r-xl mb-8 flex items-start gap-3">
            <svg class="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            <p class="text-sm font-medium text-on-surface">입력된 필드를 수정하고 <b>[내용 수정 요청]</b> 버튼을 누르면 목표 내용이 변경 승인 요청되며, 바(Bar)를 움직여 <b>[진척률 확인 요청]</b>을 클릭하면 실시간 퍼센테이지가 업데이트 됩니다.</p>
        </div>

        <div class="max-w-4xl mx-auto">
            ${contentHtml}
        </div>
    `;
    container.innerHTML = html;
}

function renderRequests(container) {
    const list = STATE.submittedGoals.filter(g => g.requestType !== null);
    
    let rowsHtml = '';
    if(list.length === 0) {
        rowsHtml = `<tr><td colspan="5" class="p-10 text-center text-on-surface-variant font-medium">현재 결재를 대기 중인 요청이 없습니다. 🎉</td></tr>`;
    } else {
        rowsHtml = list.map(g => {
            const assignee = USER_NAMES[g.userId] || g.userId;
            let reqBadge = '';
            if(g.requestType === 'new') reqBadge = '<span class="px-2.5 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded uppercase tracking-wider">신규</span>';
            else if(g.requestType === 'update' || g.requestType === 'progress-update') reqBadge = '<span class="px-2.5 py-1 bg-[#f59e0b]/10 text-[#d97706] text-[11px] font-bold rounded uppercase tracking-wider">진척률</span>';
            else if(g.requestType === 'content-update') reqBadge = '<span class="px-2.5 py-1 bg-[#8b5cf6]/10 text-[#6d28d9] text-[11px] font-bold rounded uppercase tracking-wider">내용 수정</span>';

            return `
            <tr class="border-b border-blue-50/50 hover:bg-surface-container-lowest transition-colors">
                <td class="py-5 px-6 font-bold text-on-surface">${assignee}</td>
                <td class="py-5 px-6">
                    <div class="flex items-center gap-2 mb-2">
                        ${reqBadge} 
                        <span class="font-extrabold text-xs text-on-surface-variant">${getPeriodLabel(g.periodType, g.periodValue)}</span>
                    </div>
                    <div class="text-sm font-bold w-64 truncate leading-relaxed">${g.text}</div>
                    ${g.actionPlan ? `<div class="text-[11px] font-medium text-on-surface-variant truncate w-64 mt-1 border-l-2 border-blue-100 pl-2">${g.actionPlan.replace(/\n/g, ' ')}</div>` : ''}
                </td>
                <td class="py-5 px-6">
                    <div class="font-display font-black text-2xl ${g.progress === 100 ? 'text-success' : 'text-primary'}">${g.progress}%</div>
                </td>
                <td class="py-5 px-6">
                    <span class="text-xs font-bold text-on-surface-variant border border-blue-100 bg-white px-3 py-1.5 rounded-md shadow-sm">${g.status}</span>
                </td>
                <td class="py-5 px-6 text-right">
                    <button onclick="approveRequest(${g.id})" class="px-6 py-2.5 bg-gradient-to-br from-primary to-primary-dim text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">승인 처리</button>
                </td>
            </tr>
            `;
        }).join('');
    }

    container.innerHTML = `
        <h3 class="font-display font-bold text-2xl mb-6">결재함 (요청 관리)</h3>
        <div class="bg-white rounded-2xl border border-blue-50 shadow-sm max-w-5xl overflow-hidden glass-panel">
            <table class="w-full text-left">
                <thead>
                    <tr class="text-xs text-on-surface-variant font-bold bg-surface-container-low border-b border-blue-50">
                        <th class="py-4 px-6 w-1/5">기안자</th>
                        <th class="py-4 px-6 w-2/5">요청 정보 (유형/내용)</th>
                        <th class="py-4 px-6">지표</th>
                        <th class="py-4 px-6">현재 상태</th>
                        <th class="py-4 px-6">진행</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </div>
    `;
}

// --- App Initialization & Login ---

document.getElementById('btn-login').addEventListener('click', () => {
    const id = document.getElementById('login-id').value;
    const pw = document.getElementById('login-pw').value;

    if(pw !== '1111') {
        alert('비밀번호가 올바르지 않습니다.');
        return;
    }

    if(id === 'master') {
        STATE.user = { id: 'master', name: USER_NAMES.master, role: 'admin' };
    } else if (id === 'member') {
        STATE.user = { id: 'member', name: USER_NAMES.member, role: 'user' };
    } else {
        alert('존재하지 않는 사용자 ID입니다. (테스트: master 또는 member)');
        return;
    }
    
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
    document.getElementById('login-id').value = '';
    document.getElementById('login-pw').value = '';
});

// Set current date in header
const today = new Date();
document.getElementById('current-date').innerText = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
