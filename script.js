// --- State & Config ---
const STATE = {
    user: null, // { id: 'master'|'member', name: '...', role: 'admin'|'user' }
    currentView: 'dashboard',
    
    // Tab states
    dashboardTab: 'monthly', // 'monthly', 'quarterly', 'yearly'
    goalsSetTab: 'monthly', // 'monthly', 'quarterly', 'yearly'
    goalsManageTab: 'monthly',
    
    // Current draft goals for submission
    activeGoalsDraft: [ { id: 1, text: '', actionPlan: '' }, { id: 2, text: '', actionPlan: '' }, { id: 3, text: '', actionPlan: '' } ],
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

// --- Helpers ---
function getPeriodLabel(type, value) {
    if(!value) return '알 수 없음';
    if (type === 'monthly') return `${value.split('-')[0]}년 ${value.split('-')[1]}월`;
    if (type === 'quarterly') return `${value.split('-')[0]}년 ${value.split('-')[1]}분기`;
    if (type === 'yearly') return `${value}년`;
    return value;
}

function getCurrentPeriodLabel(type) {
    const d = new Date();
    if(type === 'monthly') return `${d.getFullYear()}년 ${d.getMonth()+1}월`;
    if(type === 'quarterly') return `${d.getFullYear()}년 ${Math.floor(d.getMonth()/3)+1}분기`;
    return `${d.getFullYear()}년`;
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
    if (view === 'dashboard') STATE.dashboardTab = tab;
    if (view === 'goals_set') { STATE.goalsSetTab = tab; STATE.draftSubmitted = false; }
    if (view === 'goals_manage') STATE.goalsManageTab = tab;
    
    renderCurrentView();
};

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
    if (STATE.activeGoalsDraft.length > 3) {
        STATE.activeGoalsDraft = STATE.activeGoalsDraft.filter(g => g.id !== id);
        renderCurrentView();
    } else {
        alert('최소 3개의 목표는 설정해야 합니다.');
    }
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
        alert('모든 목표 내용을 입력해주세요.');
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
            requestType: 'new' // 'new', 'update'
        });
    });
    
    STATE.draftSubmitted = true;
    renderCurrentView();
};

window.updateProgress = function(goalId, newProgress) {
    const goal = STATE.submittedGoals.find(g => g.id == goalId);
    if(goal) goal.progress = parseInt(newProgress);
    // document update manually or via render
    document.getElementById(`prog-val-${goalId}`).innerText = newProgress + '%';
};

window.requestProgressUpdate = function(goalId) {
    const goal = STATE.submittedGoals.find(g => g.id == goalId);
    if(goal) {
        goal.status = '확인 대기(진척률)';
        goal.requestType = 'update';
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

    const relevantGoals = STATE.submittedGoals.filter(g => g.periodType === STATE.dashboardTab);
    
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
                <span class="px-3 py-1 bg-surface-container-low text-primary text-sm font-bold rounded-lg">${getCurrentPeriodLabel(STATE.dashboardTab)}</span>
            </div>
            <div class="flex items-center bg-white border border-blue-50 rounded-lg p-1">
                <button onclick="setTab('dashboard', 'monthly')" class="px-5 py-1.5 rounded-md text-sm transition-all ${STATE.dashboardTab === 'monthly' ? activeTabCls : inactiveTabCls}">월간</button>
                <button onclick="setTab('dashboard', 'quarterly')" class="px-5 py-1.5 rounded-md text-sm transition-all ${STATE.dashboardTab === 'quarterly' ? activeTabCls : inactiveTabCls}">분기</button>
                <button onclick="setTab('dashboard', 'yearly')" class="px-5 py-1.5 rounded-md text-sm transition-all ${STATE.dashboardTab === 'yearly' ? activeTabCls : inactiveTabCls}">연간</button>
            </div>
        </div>
    `;

    if(Object.keys(membersWithGoals).length === 0) {
        dashboardHtml += `<div class="bg-white p-10 text-center rounded-xl border border-blue-50 text-on-surface-variant">해당 기간(탭)에 설정된 목표가 없습니다.</div>`;
    } else {
        dashboardHtml += `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">`;
        
        for(let userId in membersWithGoals) {
            const mGoals = membersWithGoals[userId];
            const name = USER_NAMES[userId] || userId;
            
            const goalsListHtml = mGoals.map(g => `
                <div class="mb-4 last:mb-0">
                    <div class="flex justify-between items-start mb-1.5">
                        <p class="text-sm font-medium leading-snug">${g.text}</p>
                        <span class="text-xs font-bold ${g.progress >= 100 ? 'text-success' : 'text-primary'} ml-3 whitespace-nowrap">${g.progress}%</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                            <div class="${g.progress >= 100 ? 'bg-success' : 'bg-primary'} h-full rounded-full transition-all" style="width: ${g.progress}%"></div>
                        </div>
                    </div>
                </div>
            `).join('');
            
            const avgProgress = mGoals.length > 0 ? Math.round(mGoals.reduce((s, g) => s + g.progress, 0) / mGoals.length) : 0;
            
            dashboardHtml += `
                <div class="bg-white rounded-xl border border-blue-50 shadow-sm p-6 flex flex-col h-full">
                    <div class="flex items-center gap-3 mb-5 pb-4 border-b border-blue-50/50">
                        <div class="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary font-bold text-sm">
                            ${name.charAt(0)}
                        </div>
                        <div>
                            <h4 class="font-bold text-on-surface">${name}</h4>
                            <p class="text-[11px] text-on-surface-variant mt-0.5">평균 진척률: <span class="font-bold">${avgProgress}%</span></p>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto">
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
    const currYear = date.getFullYear() >= 2026 ? date.getFullYear() : 2026;
    
    if (STATE.goalsSetTab === 'monthly') {
        for(let m=1; m<=12; m++) {
            let val = `${currYear}-${String(m).padStart(2, '0')}`;
            periodOptionsHtml += `<option value="${val}">${currYear}년 ${m}월</option>`;
        }
    } else if (STATE.goalsSetTab === 'quarterly') {
        for(let q=1; q<=4; q++) {
            let val = `${currYear}-Q${q}`;
            periodOptionsHtml += `<option value="${val}">${currYear}년 ${q}분기</option>`;
        }
    } else if (STATE.goalsSetTab === 'yearly') {
        periodOptionsHtml += `<option value="${currYear}">${currYear}년</option>`;
        periodOptionsHtml += `<option value="${currYear+1}">${currYear+1}년</option>`;
    }

    let guideHtml = '';
    if(STATE.goalsSetTab === 'monthly') guideHtml = '해당 월이 도래하기 1주일 전에 해당 월 목표를 입력해야 합니다.';
    if(STATE.goalsSetTab === 'quarterly') guideHtml = '해당 분기가 도래하기 1개월 전에 해당 분기 목표를 입력해야 합니다.';
    if(STATE.goalsSetTab === 'yearly') guideHtml = '연도가 넘어가기 1개월 전에 해당 연도 목표를 입력해야 합니다.';

    let rowsHtml = STATE.activeGoalsDraft.map((g, index) => {
        return `
            <div class="flex gap-4 p-4 border border-blue-50/50 rounded-xl bg-surface-container-lowest">
                <span class="text-sm font-bold text-on-surface-variant w-8 aspect-square flex items-center justify-center bg-surface-container rounded-full shrink-0">${index + 1}</span>
                <div class="flex-1 space-y-3">
                    <input type="text" value="${g.text}" oninput="updateGoalText(${g.id}, this.value)" ${STATE.draftSubmitted?'disabled':''} class="w-full bg-white border border-blue-100/80 rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 transition-all" placeholder="측정 가능한 OKR 및 달성 목표 (한 줄 요약)">
                    <textarea rows="2" oninput="updateGoalPlan(${g.id}, this.value)" ${STATE.draftSubmitted?'disabled':''} class="w-full bg-white border border-blue-100/80 rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 transition-all text-sm resize-none" placeholder="세부 액션 플랜 입력 (여러 줄 작성 가능)...">${g.actionPlan}</textarea>
                </div>
                ${!STATE.draftSubmitted ? `
                <button onclick="removeGoalRow(${g.id})" class="p-2 text-error hover:bg-error/10 hover:shadow-sm rounded-lg h-fit transition-all" title="삭제">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
                ` : ''}
            </div>
        `;
    }).join('');

    let btnHtml = STATE.draftSubmitted 
        ? `<button disabled class="bg-surface-container text-on-surface-variant px-8 py-3 rounded-lg font-medium tracking-wide shadow-inner">승인 대기 중</button>`
        : `<button onclick="submitGoals()" class="bg-gradient-to-br from-primary to-primary-dim text-white px-8 py-3 rounded-lg shadow-md hover:opacity-90 font-medium tracking-wide transition-opacity">합의 요청</button>`;

    let html = `
        <div class="flex items-center gap-8 border-b border-blue-100 mb-8 px-4">
            <button onclick="setTab('goals_set', 'monthly')" class="pb-3 text-lg transition-all ${STATE.goalsSetTab === 'monthly' ? activeTabCls : inactiveTabCls}">월별 목표</button>
            <button onclick="setTab('goals_set', 'quarterly')" class="pb-3 text-lg transition-all ${STATE.goalsSetTab === 'quarterly' ? activeTabCls : inactiveTabCls}">분기별 목표</button>
            <button onclick="setTab('goals_set', 'yearly')" class="pb-3 text-lg transition-all ${STATE.goalsSetTab === 'yearly' ? activeTabCls : inactiveTabCls}">연간 목표</button>
        </div>

        <div class="bg-error/10 border-l-4 border-error p-4 rounded-r-lg mb-8">
            <p class="text-sm font-medium text-error flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                ${guideHtml}
            </p>
        </div>

        <div class="bg-white rounded-xl p-8 border border-blue-50 shadow-sm max-w-4xl">
            <div class="flex items-center justify-between mb-8 pb-4 border-b border-blue-50/50">
                <div class="flex items-center gap-4">
                    <h3 class="font-display text-xl font-bold">새로운 목표 수립</h3>
                    <select id="period-selector" ${STATE.draftSubmitted?'disabled':''} class="bg-surface-container-lowest border border-blue-100 rounded text-sm px-3 py-1.5 focus:border-primary focus:ring-1 outline-none font-bold text-primary">
                        ${periodOptionsHtml}
                    </select>
                </div>
                ${!STATE.draftSubmitted ? `
                <button onclick="addGoalRow()" class="flex items-center gap-2 px-4 py-2 bg-surface-container text-primary font-semibold rounded-lg hover:bg-primary/20 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    줄 추가
                </button>
                ` : ''}
            </div>
            
            <div class="space-y-4 mb-8">
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
    
    let contentHtml = '<p class="text-sm text-on-surface-variant bg-white p-8 rounded-xl border border-blue-50 shadow-sm text-center">해당 기간에 조회할 목표가 없습니다.</p>';
    if(myGoals.length > 0) {
        contentHtml = myGoals.map(g => `
            <div class="bg-white rounded-xl p-6 border border-blue-50 shadow-sm mb-4">
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <span class="px-2 py-1 bg-surface-container text-primary rounded font-bold text-xs mb-2 inline-block">${getPeriodLabel(g.periodType, g.periodValue)}</span>
                        <h4 class="font-bold text-lg text-on-surface">${g.text}</h4>
                        ${g.actionPlan ? `<p class="whitespace-pre-line text-sm text-on-surface-variant mt-2 border-l-2 border-blue-100 pl-3 leading-relaxed">${g.actionPlan}</p>` : ''}
                    </div>
                    <span class="px-3 py-1 bg-surface-container-low rounded-full text-xs font-bold ${g.status.includes('승인 완료')?'text-success':'text-on-surface-variant'}">${g.status}</span>
                </div>
                
                <div class="flex items-center gap-6 bg-surface-container-lowest p-4 rounded-lg mt-4 border border-blue-50/50">
                    <div class="flex-1">
                        <div class="flex justify-between text-sm mb-1 font-bold"><span>진척률 업데이트</span><span id="prog-val-${g.id}" class="text-primary">${g.progress}%</span></div>
                        <input type="range" min="0" max="100" value="${g.progress}" onchange="updateProgress(${g.id}, this.value)" class="w-full accent-primary">
                    </div>
                    <div>
                        <button onclick="requestProgressUpdate(${g.id})" class="px-4 py-2 border border-primary text-primary font-bold rounded-lg hover:bg-primary/5 transition-colors whitespace-nowrap text-sm">확인 요청</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    let html = `
        <div class="flex items-center gap-8 border-b border-blue-100 mb-8 px-4">
            <button onclick="setTab('goals_manage', 'monthly')" class="pb-3 text-lg transition-all ${STATE.goalsManageTab === 'monthly' ? activeTabCls : inactiveTabCls}">월별 목표 관리</button>
            <button onclick="setTab('goals_manage', 'quarterly')" class="pb-3 text-lg transition-all ${STATE.goalsManageTab === 'quarterly' ? activeTabCls : inactiveTabCls}">분기별 목표 관리</button>
            <button onclick="setTab('goals_manage', 'yearly')" class="pb-3 text-lg transition-all ${STATE.goalsManageTab === 'yearly' ? activeTabCls : inactiveTabCls}">연간 목표 관리</button>
        </div>
        <div class="max-w-4xl">
            ${contentHtml}
        </div>
    `;
    container.innerHTML = html;
}

function renderRequests(container) {
    const list = STATE.submittedGoals.filter(g => g.requestType !== null);
    
    let rowsHtml = '';
    if(list.length === 0) {
        rowsHtml = `<tr><td colspan="5" class="p-8 text-center text-on-surface-variant font-medium">대기 중인 요청이 없습니다.</td></tr>`;
    } else {
        rowsHtml = list.map(g => {
            const assignee = USER_NAMES[g.userId] || g.userId;
            const reqBadge = g.requestType === 'new' ? '<span class="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded">신규 목표</span>' : '<span class="px-2 py-0.5 bg-[#f59e0b]/10 text-[#d97706] text-[10px] font-bold rounded">진척률 업데이트</span>';
            return `
            <tr class="border-b border-blue-50/50 hover:bg-surface-container-low/50 transition-colors">
                <td class="py-4 px-6 font-medium">${assignee}</td>
                <td class="py-4 px-6">
                    <div class="mb-1">${reqBadge} <span class="font-bold text-xs text-on-surface ml-1">${getPeriodLabel(g.periodType, g.periodValue)}</span></div>
                    <div class="text-sm font-medium w-64 truncate">${g.text}</div>
                </td>
                <td class="py-4 px-6">
                    <div class="font-display font-bold text-lg ${g.progress === 100 ? 'text-success' : 'text-primary'}">${g.progress}%</div>
                </td>
                <td class="py-4 px-6">
                    <span class="text-xs font-bold text-on-surface-variant border border-blue-100 bg-white px-2 py-1 rounded">${g.status}</span>
                </td>
                <td class="py-4 px-6 text-right">
                    <button onclick="approveRequest(${g.id})" class="px-4 py-2 bg-gradient-to-br from-primary to-primary-dim text-white font-bold text-xs rounded-lg shadow-sm hover:shadow-md transition-all">승인하기</button>
                </td>
            </tr>
            `;
        }).join('');
    }

    container.innerHTML = `
        <div class="bg-white rounded-xl border border-blue-50 shadow-sm max-w-5xl overflow-hidden">
            <h3 class="font-display font-bold text-lg p-6 border-b border-blue-50 bg-surface/30">실시간 결재 / 요청 관리</h3>
            <table class="w-full text-left">
                <thead>
                    <tr class="text-xs text-on-surface-variant uppercase tracking-wider bg-surface-container-lowest border-b border-blue-50/50">
                        <th class="py-3 px-6">기안자</th>
                        <th class="py-3 px-6">요청 유형 및 목표</th>
                        <th class="py-3 px-6">최신 진척률</th>
                        <th class="py-3 px-6">상태</th>
                        <th class="py-3 px-6"></th>
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
