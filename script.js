// --- State & Config ---
const STATE = {
    user: null, // { id: 'master'|'member', name: '...', role: 'admin'|'user' }
    currentView: 'dashboard',
    
    // Tab states
    dashboardTab: 'monthly', // 'monthly', 'quarterly', 'yearly'
    dashboardPeriodValue: '', // '2026-04', '2026-Q2', '2026'
    
    goalsSetTab: 'monthly',
    goalsSetPeriodValue: '',
    
    goalsManageTab: 'monthly',
    goalsManagePeriodValue: '',
    
    // All Goals Data
    allGoals: [
        { id: 101, userId: 'member', periodType: 'monthly', periodValue: '2026-04', text: '기존 시스템 UI/UX 개편', actionPlan: '공통 컴포넌트 분리', progress: 40, status: '승인 완료', requestType: null, comment: '' },
        { id: 102, userId: 'member', periodType: 'monthly', periodValue: '2026-04', text: '주요 지표 시각화 설계', actionPlan: 'Chart.js 연동', progress: 85, status: '진척률 승인 대기', requestType: 'progress-update', comment: '디자인 적용 완료' },
        { id: 103, userId: 'member', periodType: 'monthly', periodValue: '2026-04', text: '모니터링 알림 연동', actionPlan: '슬랙 웹훅 연결', progress: 0, status: '승인 대기', requestType: 'new', comment: '' }
    ]
};

const USER_NAMES = {
    'master': '마스터 관리자',
    'member': '김전략 (팀원)',
    'member2': '이개발 (팀원)'
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
    if (view === 'goals_set') {
        STATE.goalsSetTab = tab;
        STATE.goalsSetPeriodValue = getDefaultPeriodValue(tab);
    }
    if (view === 'goals_manage') {
        STATE.goalsManageTab = tab;
        STATE.goalsManagePeriodValue = getDefaultPeriodValue(tab);
    }
    renderCurrentView();
};

window.setPeriod = function(view, val) {
    if(view === 'dashboard') STATE.dashboardPeriodValue = val;
    if(view === 'goals_set') STATE.goalsSetPeriodValue = val;
    if(view === 'goals_manage') STATE.goalsManagePeriodValue = val;
    renderCurrentView();
};

// Goals Set Logic
window.addGoalRow = function() {
    STATE.allGoals.push({
        id: Date.now() + Math.random(),
        userId: STATE.user.id,
        periodType: STATE.goalsSetTab,
        periodValue: STATE.goalsSetPeriodValue,
        text: '',
        actionPlan: '',
        progress: 0,
        status: '작성중',
        requestType: null,
        comment: ''
    });
    renderCurrentView();
};

window.removeGoalRow = function(id) {
    STATE.allGoals = STATE.allGoals.filter(g => g.id !== id);
    renderCurrentView();
};

window.updateGoalField = function(id, field, value) {
    const goal = STATE.allGoals.find(g => g.id === id);
    if(goal) goal[field] = value;
};

window.requestGoalApproval = function(id) {
    const goal = STATE.allGoals.find(g => g.id === id);
    if(goal) {
        if(!goal.text.trim()) { alert('핵심 달성 목표를 입력해주세요.'); return; }
        goal.status = '승인 대기';
        goal.requestType = 'new';
        renderCurrentView();
    }
};

window.cancelGoalApproval = function(id) {
    const goal = STATE.allGoals.find(g => g.id === id);
    if(goal) {
        goal.status = '작성중';
        goal.requestType = null;
        renderCurrentView();
    }
};

// Goals Manage Logic
window.requestProgressApproval = function(id) {
    const goal = STATE.allGoals.find(g => g.id === id);
    if(goal) {
        goal.status = '진척률 승인 대기';
        goal.requestType = 'progress-update';
        alert('진척률 승인 요청이 전송되었습니다.');
        renderCurrentView();
    }
};

// Admin Requests Logic
window.approveRequest = function(id) {
    const goal = STATE.allGoals.find(g => g.id === id);
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

function generatePeriodOptions(tab, selectedValue) {
    let html = '';
    const d = new Date();
    const currYear = d.getFullYear() > 2025 ? d.getFullYear() : 2026;
    
    if (tab === 'monthly') {
        const startMonth = STATE.currentView === 'dashboard' ? 1 : (d.getMonth() + 1);
        for(let m = startMonth; m <= 12; m++) {
            let val = `${currYear}-${String(m).padStart(2, '0')}`;
            let sel = selectedValue === val ? 'selected' : '';
            html += `<option value="${val}" ${sel}>${currYear}년 ${m}월</option>`;
        }
    } else if (tab === 'quarterly') {
        const startQ = STATE.currentView === 'dashboard' ? 1 : (Math.floor(d.getMonth()/3)+1);
        for(let q = startQ; q <= 4; q++) {
            let val = `${currYear}-Q${q}`;
            let sel = selectedValue === val ? 'selected' : '';
            html += `<option value="${val}" ${sel}>${currYear}년 ${q}분기</option>`;
        }
    } else if (tab === 'yearly') {
        html += `<option value="${currYear}" ${selectedValue === String(currYear) ? 'selected':''}>${currYear}년</option>`;
        html += `<option value="${currYear+1}" ${selectedValue === String(currYear+1) ? 'selected':''}>${currYear+1}년</option>`;
    }
    return html;
}

function renderDashboard(container) {
    const activeTabCls = "bg-primary text-white font-medium shadow-sm";
    const inactiveTabCls = "text-on-surface-variant hover:bg-surface-container";

    const relevantGoals = STATE.allGoals.filter(g => g.periodType === STATE.dashboardTab && g.periodValue === STATE.dashboardPeriodValue && g.status !== '작성중');
    
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
                <h3 class="font-display text-lg font-semibold">구성원 목표 현황</h3>
                <select onchange="setPeriod('dashboard', this.value)" class="bg-surface-container text-primary font-bold border border-blue-50 rounded-lg text-sm px-4 py-2 outline-none cursor-pointer">
                    ${generatePeriodOptions(STATE.dashboardTab, STATE.dashboardPeriodValue)}
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
            <p>조회된 목표가 없습니다.</p>
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

    // Ensure 3 default rows if none exist for current user & tab & period
    let myDrafts = STATE.allGoals.filter(g => g.userId === STATE.user.id && g.periodType === STATE.goalsSetTab && g.periodValue === STATE.goalsSetPeriodValue);
    
    if (myDrafts.length === 0) {
        for(let i=0; i<3; i++) {
            STATE.allGoals.push({
                id: Date.now() + i,
                userId: STATE.user.id,
                periodType: STATE.goalsSetTab,
                periodValue: STATE.goalsSetPeriodValue,
                text: '',
                actionPlan: '',
                progress: 0,
                status: '작성중',
                requestType: null,
                comment: ''
            });
        }
        myDrafts = STATE.allGoals.filter(g => g.userId === STATE.user.id && g.periodType === STATE.goalsSetTab && g.periodValue === STATE.goalsSetPeriodValue);
    }
    
    let rowsHtml = myDrafts.map((g, index) => {
        const isEditable = g.status === '작성중';
        const isPending = g.status === '승인 대기';
        const isApproved = g.status === '승인 완료';

        let buttonsHtml = '';
        if (isEditable) {
            buttonsHtml = `<button onclick="requestGoalApproval(${g.id})" class="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-primary-dim transition-colors">승인 요청</button>`;
        } else if (isPending) {
            buttonsHtml = `
                <button onclick="cancelGoalApproval(${g.id})" class="text-error border border-error/50 hover:bg-error/10 px-4 py-2 rounded-lg text-sm font-bold transition-colors">요청 취소</button>
                <button disabled class="bg-surface-container text-on-surface-variant px-4 py-2 rounded-lg text-sm font-bold cursor-not-allowed">승인 대기중</button>
            `;
        } else if (isApproved) {
            buttonsHtml = `<button disabled class="bg-success/10 text-success border border-success/30 px-4 py-2 rounded-lg text-sm font-bold">승인 완료</button>`;
        }

        return `
            <div class="bg-surface-container-lowest border border-blue-50 rounded-2xl p-6 relative shadow-sm group mb-6">
                <div class="flex items-center justify-between mb-5">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-sm">${index + 1}</div>
                        <h5 class="text-sm font-bold text-on-surface">목표 기재란</h5>
                    </div>
                    <div class="flex items-center gap-2">
                        ${buttonsHtml}
                        ${isEditable ? `
                        <button onclick="removeGoalRow(${g.id})" class="text-error/70 hover:text-error hover:bg-error/10 px-2 py-2 rounded-lg transition-colors ml-2" title="항목 삭제">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>` : ''}
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-6">
                    <div>
                        <label class="block text-[13px] font-extrabold text-on-surface mb-2 tracking-wide">핵심 달성 목표</label>
                        <input type="text" value="${g.text}" oninput="updateGoalField(${g.id}, 'text', this.value)" ${!isEditable?'disabled':''} class="w-full bg-white border border-blue-100 rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-1 transition-all shadow-sm font-bold text-sm text-on-surface placeholder:text-on-surface-variant/40" placeholder="목표 1줄 요약">
                    </div>
                    <div>
                        <label class="block text-[13px] font-extrabold text-on-surface mb-2 tracking-wide">세부 액션 플랜</label>
                        <textarea rows="3" oninput="updateGoalField(${g.id}, 'actionPlan', this.value)" ${!isEditable?'disabled':''} class="w-full bg-white border border-blue-100 rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-1 transition-all text-sm font-medium text-on-surface resize-none shadow-sm placeholder:text-on-surface-variant/40 leading-relaxed" placeholder="세부 내용 기재"></textarea>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    let html = `
        <div class="flex items-center gap-8 border-b-2 border-blue-50 mb-8 px-2 max-w-5xl mx-auto">
            <button onclick="setTab('goals_set', 'monthly')" class="pb-3 text-lg transition-all ${STATE.goalsSetTab === 'monthly' ? activeTabCls : inactiveTabCls}">월별 목표</button>
            <button onclick="setTab('goals_set', 'quarterly')" class="pb-3 text-lg transition-all ${STATE.goalsSetTab === 'quarterly' ? activeTabCls : inactiveTabCls}">분기별 목표</button>
            <button onclick="setTab('goals_set', 'yearly')" class="pb-3 text-lg transition-all ${STATE.goalsSetTab === 'yearly' ? activeTabCls : inactiveTabCls}">연간 목표</button>
        </div>

        <div class="max-w-5xl mx-auto mb-6 flex items-center justify-between">
            <select onchange="setPeriod('goals_set', this.value)" class="bg-surface-container text-primary font-bold border border-blue-50 rounded-lg text-sm px-4 py-2 outline-none cursor-pointer">
                ${generatePeriodOptions(STATE.goalsSetTab, STATE.goalsSetPeriodValue)}
            </select>
            <button onclick="addGoalRow()" class="flex items-center gap-2 px-4 py-2 bg-white border border-blue-100 text-primary font-bold text-sm rounded-lg hover:bg-blue-50 transition-all">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                항목 추가
            </button>
        </div>

        <div class="max-w-5xl mx-auto">
            ${rowsHtml}
        </div>
    `;
    container.innerHTML = html;
}

function renderGoalsManage(container) {
    const activeTabCls = "border-b-2 border-primary text-primary font-bold";
    const inactiveTabCls = "text-on-surface-variant hover:text-primary transition-colors";

    // Show only approved goals to manage their progress
    const myGoals = STATE.allGoals.filter(g => g.userId === STATE.user.id && g.periodType === STATE.goalsManageTab && g.periodValue === STATE.goalsManagePeriodValue && (g.status === '승인 완료' || g.status === '진척률 승인 대기'));
    
    let contentHtml = `
        <div class="flex flex-col items-center justify-center bg-white py-20 rounded-xl border border-dashed border-blue-100 text-on-surface-variant">
            <p>승인 완료된 목표가 없습니다.</p>
        </div>`;
        
    if(myGoals.length > 0) {
        contentHtml = myGoals.map(g => {
            const isPending = g.status === '진척률 승인 대기';
            return `
            <div class="bg-white rounded-2xl p-6 border border-blue-50 shadow-sm mb-6">
                <!-- Goal Description -->
                <div class="mb-5 pb-5 border-b border-blue-50/50">
                    <h4 class="font-extrabold text-lg text-on-surface mb-2">${g.text}</h4>
                    <p class="whitespace-pre-line text-sm text-on-surface-variant bg-surface-container-lowest p-3 border border-blue-50 rounded-lg leading-relaxed">${g.actionPlan}</p>
                </div>
                
                <!-- Progress Updater -->
                <div class="bg-surface-container-lowest p-5 rounded-xl border ${isPending?'border-warning/30':'border-blue-100'}">
                    <div class="flex items-center gap-6">
                        <div class="flex-1">
                            <div class="flex justify-between items-center mb-2 font-bold text-sm">
                                <span>진척률</span>
                                <span id="prog-val-${g.id}" class="text-primary text-lg">${g.progress}%</span>
                            </div>
                            <input type="range" min="0" max="100" value="${g.progress}" onchange="updateGoalField(${g.id}, 'progress', parseInt(this.value))" oninput="document.getElementById('prog-val-${g.id}').innerText=this.value+'%'" ${isPending?'disabled':''} class="w-full accent-primary h-2 bg-blue-50 rounded-lg appearance-none cursor-pointer">
                        </div>
                        <div class="flex-1">
                            <label class="block mb-2 font-bold text-sm text-on-surface">코멘트</label>
                            <input type="text" value="${g.comment}" oninput="updateGoalField(${g.id}, 'comment', this.value)" ${isPending?'disabled':''} placeholder="진척률 변경 사유 및 내용" class="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
                        </div>
                        <div class="pt-6">
                            ${isPending ? 
                            `<button disabled class="px-5 py-2.5 bg-surface-container text-on-surface-variant font-bold rounded-xl text-sm border border-blue-50 whitespace-nowrap">승인 대기중</button>` : 
                            `<button onclick="requestProgressApproval(${g.id})" class="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow hover:bg-primary-dim transition-all whitespace-nowrap text-sm">승인 요청</button>`}
                        </div>
                    </div>
                </div>
            </div>
        `}).join('');
    }

    let html = `
        <div class="flex items-center gap-8 border-b-2 border-blue-50 mb-8 px-2 max-w-4xl mx-auto">
            <button onclick="setTab('goals_manage', 'monthly')" class="pb-3 text-lg transition-all ${STATE.goalsManageTab === 'monthly' ? activeTabCls : inactiveTabCls}">월별 목표 관리</button>
            <button onclick="setTab('goals_manage', 'quarterly')" class="pb-3 text-lg transition-all ${STATE.goalsManageTab === 'quarterly' ? activeTabCls : inactiveTabCls}">분기별 목표 관리</button>
            <button onclick="setTab('goals_manage', 'yearly')" class="pb-3 text-lg transition-all ${STATE.goalsManageTab === 'yearly' ? activeTabCls : inactiveTabCls}">연간 목표 관리</button>
        </div>

        <div class="max-w-4xl mx-auto mb-6">
            <select onchange="setPeriod('goals_manage', this.value)" class="bg-surface-container text-primary font-bold border border-blue-50 rounded-lg text-sm px-4 py-2 outline-none cursor-pointer">
                ${generatePeriodOptions(STATE.goalsManageTab, STATE.goalsManagePeriodValue)}
            </select>
        </div>

        <div class="max-w-4xl mx-auto">
            ${contentHtml}
        </div>
    `;
    container.innerHTML = html;
}

function renderRequests(container) {
    const list = STATE.allGoals.filter(g => g.requestType !== null);
    
    let rowsHtml = '';
    if(list.length === 0) {
        rowsHtml = `<tr><td colspan="5" class="p-10 text-center text-on-surface-variant font-medium">현재 대기 중인 요청이 없습니다.</td></tr>`;
    } else {
        rowsHtml = list.map(g => {
            const assignee = USER_NAMES[g.userId] || g.userId;
            let reqTypeLabel = g.requestType === 'new' ? '신규 목표 승인' : '진척률 승인';

            return `
            <tr class="border-b border-blue-50/50 hover:bg-surface-container-lowest transition-colors">
                <td class="py-5 px-6 font-bold text-on-surface">${assignee}</td>
                <td class="py-5 px-6">
                    <span class="font-bold text-xs text-on-surface-variant block mb-1">${getPeriodLabel(g.periodType, g.periodValue)} - ${reqTypeLabel}</span>
                    <div class="text-sm font-bold w-64 truncate">${g.text}</div>
                </td>
                <td class="py-5 px-6">
                    <div class="font-display font-black text-xl text-primary">${g.progress}%</div>
                    ${g.comment ? `<div class="text-[11px] mt-1 text-on-surface-variant max-w-xs truncate">${g.comment}</div>` : ''}
                </td>
                <td class="py-5 px-6">
                    <span class="text-xs font-bold text-on-surface-variant border border-blue-100 bg-white px-3 py-1.5 rounded-md shadow-sm">${g.status}</span>
                </td>
                <td class="py-5 px-6 text-right">
                    <button onclick="approveRequest(${g.id})" class="px-5 py-2 bg-primary text-white font-bold text-sm rounded-lg hover:bg-primary-dim transition-all">승인</button>
                </td>
            </tr>
            `;
        }).join('');
    }

    container.innerHTML = `
        <h3 class="font-display font-bold text-2xl mb-6 pl-2">요청 관리</h3>
        <div class="bg-white rounded-2xl border border-blue-50 shadow-sm w-full overflow-hidden">
            <table class="w-full text-left">
                <thead>
                    <tr class="text-xs text-on-surface-variant font-bold bg-surface-container-low border-b border-blue-50">
                        <th class="py-4 px-6 w-1/6">기안자</th>
                        <th class="py-4 px-6 w-2/6">내용</th>
                        <th class="py-4 px-6 w-1/6">지표 및 코멘트</th>
                        <th class="py-4 px-6 w-1/6">상태</th>
                        <th class="py-4 px-6 w-1/6">처리</th>
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
