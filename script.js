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
    
    // Modal State
    modalData: null, // { title: '', content: '', onConfirm: null }
    
    // All Goals Data
    allGoals: [
        { id: 101, userId: 'member', periodType: 'monthly', periodValue: '2026-04', text: '기존 시스템 UI/UX 개편', actionPlan: '공통 컴포넌트 분리\n신규 라우팅 적용', progress: 40, status: '승인 완료', requestType: null, comment: '', isProcessed: false },
        { id: 102, userId: 'member', periodType: 'monthly', periodValue: '2026-04', text: '주요 지표 시각화 설계', actionPlan: 'Chart.js 연동', progress: 40, tempProgress: 85, status: '진척률 승인 대기', requestType: 'progress-update', comment: '디자인 적용 완료', isProcessed: false },
        { id: 103, userId: 'member', periodType: 'monthly', periodValue: '2026-04', text: '모니터링 알림 연동', actionPlan: '슬랙 웹훅 연결', progress: 0, status: '승인 대기', requestType: 'new', comment: '', isProcessed: false }
    ]
};

const USER_NAMES = {
    'master': '마스터 관리자',
    'member': '김전략',
    'member2': '이개발'
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
    { id: 'goals_set', label: '목표 설정 및 합의', icon: '<path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['user', 'admin'] },
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

window.openModal = function(title, content, onConfirmAction = null) {
    STATE.modalData = { title, content, onConfirmAction };
    renderCurrentView();
};
window.closeModal = function() {
    STATE.modalData = null;
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
        comment: '',
        isProcessed: false
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

// Setting new goals
window.requestGoalApproval = function(id) {
    const goal = STATE.allGoals.find(g => g.id === id);
    if(goal) {
        if(!goal.text.trim()) { alert('달성 목표를 입력해주세요.'); return; }
        goal.status = '승인 대기중';
        goal.requestType = 'new';
        goal.isProcessed = false;
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

// Goals Manage Logic (Edits & Progress)
window.requestContentUpdate = function(id) {
    const goal = STATE.allGoals.find(g => g.id === id);
    if(goal) {
        goal.status = '내용 수정 대기중';
        goal.requestType = 'content-update';
        goal.isProcessed = false;
        renderCurrentView();
    }
};

window.updateTempProgress = function(id, val) {
    const goal = STATE.allGoals.find(g => g.id === id);
    if(goal) {
        goal.tempProgress = parseInt(val);
        document.getElementById(`prog-val-${id}`).innerText = val + '%';
    }
};

window.requestProgressApproval = function(id) {
    const goal = STATE.allGoals.find(g => g.id === id);
    if(goal) {
        if(goal.tempProgress === undefined) goal.tempProgress = goal.progress;
        goal.status = '진척률 승인 대기중';
        goal.requestType = 'progress-update';
        goal.isProcessed = false;
        renderCurrentView();
    }
};

// Admin Requests Logic
window.approveRequest = function(id) {
    const goal = STATE.allGoals.find(g => g.id === id);
    if(goal) {
        goal.status = '승인 완료';
        if(goal.requestType === 'progress-update' && goal.tempProgress !== undefined) {
            goal.progress = goal.tempProgress;
        }
        goal.requestType = null;
        goal.isProcessed = true;
        renderCurrentView();
    }
};

window.undoApproval = function(id) {
    openModal('승인 취소', '승인 내역을 취소하시겠습니까?', () => {
        const goal = STATE.allGoals.find(g => g.id === id);
        if(goal) {
            goal.isProcessed = false;
            // Restore proper status based on context to allow admin to see it again.
            // But actually we have no "previous status" stored if it was fully cleared.
            // Oh, requestType is null when approved... Let's just make it 'new' if we undo, or we should keep requestType when approving.
            // Let's modify approveRequest to preserve requestType for undo context.
            goal.status = '승인 대기중';
            goal.requestType = goal.requestType || 'new'; // fallback
            closeModal();
            renderCurrentView();
        }
    });
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
    
    if (STATE.modalData) renderModal(document.body);
    else {
        const modal = document.getElementById('app-modal');
        if(modal) modal.remove();
    }
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
        dashboardHtml += `
        <div class="bg-white rounded-2xl border border-blue-50 shadow-sm overflow-hidden w-full">
            <table class="w-full text-left text-sm">
                <thead>
                    <tr class="bg-surface-container-low text-on-surface-variant border-b border-blue-50">
                        <th class="py-3 px-6 font-semibold w-40 text-center">이름</th>
                        <th class="py-3 px-6 font-semibold w-1/3 text-center">달성 목표</th>
                        <th class="py-3 px-6 font-semibold w-1/3 text-center">진척률 현황</th>
                        <th class="py-3 px-6 font-semibold text-center w-24">수치</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-blue-50/50">
        `;
        
        for(let userId in membersWithGoals) {
            const mGoals = membersWithGoals[userId];
            const name = USER_NAMES[userId] || userId;
            const avgProgress = mGoals.length > 0 ? Math.round(mGoals.reduce((s, g) => s + g.progress, 0) / mGoals.length) : 0;

            mGoals.forEach((g, idx) => {
                const isFirst = idx === 0;
                dashboardHtml += `
                    <tr class="hover:bg-surface-container-lowest/50 transition-colors">
                        ${isFirst ? `<td class="py-3 px-6 align-top border-r border-blue-50/30" rowspan="${mGoals.length}">
                            <div class="flex flex-col items-center gap-1.5">
                                <div class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary font-bold text-xs">${name.charAt(0)}</div>
                                <div class="text-center">
                                    <div class="font-bold text-on-surface text-xs">${name}</div>
                                    <div class="text-[10px] text-on-surface-variant mt-0.5">평균: <span class="font-bold text-primary">${avgProgress}%</span></div>
                                </div>
                            </div>
                        </td>` : ''}
                        <td class="py-3 px-6">
                            <p class="font-medium text-on-surface text-[13px] leading-relaxed">${g.text}</p>
                        </td>
                        <td class="py-3 px-6 align-middle">
                            <div class="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                                <div class="${g.progress >= 100 ? 'bg-success' : 'bg-primary'} h-full transition-all" style="width: ${g.progress}%"></div>
                            </div>
                        </td>
                        <td class="py-3 px-6 text-center">
                            <span class="font-black text-[11px] ${g.progress >= 100 ? 'text-success' : 'text-primary'}">${g.progress}%</span>
                        </td>
                    </tr>
                `;
            });
        }
        dashboardHtml += `</tbody></table></div>`;
    }
    container.innerHTML = dashboardHtml;
}

function renderGoalsSet(container) {
    const activeTabCls = "border-b-2 border-primary text-primary font-bold";
    const inactiveTabCls = "text-on-surface-variant hover:text-primary transition-colors";

    let myDrafts = STATE.allGoals.filter(g => g.userId === STATE.user.id && g.periodType === STATE.goalsSetTab && g.periodValue === STATE.goalsSetPeriodValue);
    if (myDrafts.length === 0) {
        for(let i=0; i<3; i++) {
            STATE.allGoals.push({
                id: Date.now() + i, userId: STATE.user.id, periodType: STATE.goalsSetTab, periodValue: STATE.goalsSetPeriodValue,
                text: '', actionPlan: '', progress: 0, status: '작성중', requestType: null, comment: '', isProcessed: false
            });
        }
        myDrafts = STATE.allGoals.filter(g => g.userId === STATE.user.id && g.periodType === STATE.goalsSetTab && g.periodValue === STATE.goalsSetPeriodValue);
    }
    
    let rowsHtml = myDrafts.map((g, index) => {
        const isEditable = g.status === '작성중';
        const isPending = g.status.includes('대기중');
        const isApproved = g.status === '승인 완료';

        let actionHtml = '';
        if (isEditable) {
            actionHtml = `
                <div class="flex items-center justify-center gap-2">
                    <button onclick="requestGoalApproval(${g.id})" class="bg-primary text-white py-1.5 px-4 rounded text-[13px] font-bold shadow hover:bg-primary-dim transition-colors whitespace-nowrap">승인 요청</button>
                    <button onclick="removeGoalRow(${g.id})" class="bg-error text-white border border-error hover:bg-error/90 py-1.5 px-3 rounded transition-colors text-[13px] font-bold whitespace-nowrap shadow-sm" title="삭제">삭제</button>
                </div>
            `;
        } else if (isPending) {
            actionHtml = `
                <div class="flex flex-col gap-1.5 items-center">
                    <button onclick="cancelGoalApproval(${g.id})" class="w-full text-error border border-error hover:bg-error/10 py-1.5 px-3 rounded text-[13px] font-bold transition-colors whitespace-nowrap">요청 취소</button>
                    <span class="text-on-surface-variant text-[12px] font-bold">승인 대기중</span>
                </div>
            `;
        } else if (isApproved) {
            actionHtml = `<span class="text-success font-extrabold text-[13px]">승인 완료</span>`;
        }

        return `
            <tr class="hover:bg-surface-container-lowest transition-colors border-b border-blue-50/50">
                <td class="py-3 px-4 text-center font-bold text-on-surface-variant text-[13px] border-r border-blue-50/30 w-12">${index + 1}</td>
                <td class="py-3 px-4 w-5/12 border-r border-blue-50/30">
                    <input type="text" value="${g.text}" oninput="updateGoalField(${g.id}, 'text', this.value)" ${!isEditable?'disabled':''} class="w-full bg-white border border-blue-100 rounded px-3 py-2 outline-none focus:border-primary focus:ring-1 transition-all text-[13px] font-bold text-on-surface disabled:bg-surface-container-lowest">
                </td>
                <td class="py-3 px-4 w-5/12 border-r border-blue-50/30">
                    <textarea rows="2" oninput="updateGoalField(${g.id}, 'actionPlan', this.value)" ${!isEditable?'disabled':''} class="w-full bg-white border border-blue-100 rounded px-3 py-2 outline-none focus:border-primary focus:ring-1 transition-all text-[13px] font-medium text-on-surface resize-none leading-relaxed disabled:bg-surface-container-lowest"></textarea>
                </td>
                <td class="py-3 px-4 text-center w-2/12 align-middle">
                    ${actionHtml}
                </td>
            </tr>
        `;
    }).join('');

    let html = `
        <div class="flex items-center gap-8 border-b-2 border-blue-50 mb-6 px-2 w-full">
            <button onclick="setTab('goals_set', 'monthly')" class="pb-3 text-lg transition-all ${STATE.goalsSetTab === 'monthly' ? activeTabCls : inactiveTabCls}">월별</button>
            <button onclick="setTab('goals_set', 'quarterly')" class="pb-3 text-lg transition-all ${STATE.goalsSetTab === 'quarterly' ? activeTabCls : inactiveTabCls}">분기별</button>
            <button onclick="setTab('goals_set', 'yearly')" class="pb-3 text-lg transition-all ${STATE.goalsSetTab === 'yearly' ? activeTabCls : inactiveTabCls}">연간</button>
        </div>

        <div class="mb-4 flex items-center justify-between w-full">
            <select onchange="setPeriod('goals_set', this.value)" class="bg-surface-container text-primary font-bold border border-blue-50 rounded text-[13px] px-3 py-1.5 outline-none cursor-pointer">
                ${generatePeriodOptions(STATE.goalsSetTab, STATE.goalsSetPeriodValue)}
            </select>
            <button onclick="addGoalRow()" class="flex items-center gap-1 px-3 py-1.5 bg-white border border-blue-100 text-primary font-bold text-[13px] rounded hover:bg-blue-50 transition-all shadow-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                항목 추가
            </button>
        </div>

        <div class="bg-white rounded-2xl border border-blue-50 shadow-sm w-full overflow-hidden">
            <table class="w-full text-left table-auto">
                <thead>
                    <tr class="text-[14px] text-on-surface-variant font-extrabold bg-surface-container-low border-b border-blue-50">
                        <th class="py-4 px-4 text-center border-r border-blue-50/30">No.</th>
                        <th class="py-4 px-4 text-center border-r border-blue-50/30">목표 (OKR)</th>
                        <th class="py-4 px-4 text-center border-r border-blue-50/30">세부 지표 (KPI)</th>
                        <th class="py-4 px-4 text-center">요청 관리</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        </div>
    `;
    container.innerHTML = html;
}

function renderGoalsManage(container) {
    const activeTabCls = "border-b-2 border-primary text-primary font-bold";
    const inactiveTabCls = "text-on-surface-variant hover:text-primary transition-colors";

    const myGoals = STATE.allGoals.filter(g => g.userId === STATE.user.id && g.periodType === STATE.goalsManageTab && g.periodValue === STATE.goalsManagePeriodValue && (g.status === '승인 완료' || g.status.includes('대기중')));
    
    let rowsHtml = '';
    if(myGoals.length === 0) {
        rowsHtml = `<tr><td colspan="4" class="p-10 text-center text-on-surface-variant text-sm font-medium">관리 가능한 합의 목표가 없습니다.</td></tr>`;
    } else {
        rowsHtml = myGoals.map(g => {
            const isContentPending = g.requestType === 'content-update';
            const isProgressPending = g.requestType === 'progress-update';
            const valProgress = (g.tempProgress !== undefined) ? g.tempProgress : g.progress;

            return `
            <tr class="hover:bg-surface-container-lowest/50 transition-colors border-b border-blue-50/50">
                <td class="py-4 px-4 w-4/12 border-r border-blue-50/30 align-top">
                    <div class="flex flex-col gap-2">
                        <input type="text" value="${g.text}" oninput="updateGoalField(${g.id}, 'text', this.value)" ${isContentPending?'disabled':''} class="w-full bg-white border border-blue-100 rounded px-2 py-2 text-[13px] font-bold text-on-surface outline-none focus:border-primary disabled:bg-surface-container-lowest shadow-sm mb-1">
                        <textarea rows="2" oninput="updateGoalField(${g.id}, 'actionPlan', this.value)" ${isContentPending?'disabled':''} class="w-full bg-white border border-blue-100 rounded px-2 py-2 text-[13px] text-on-surface outline-none focus:border-primary resize-y disabled:bg-surface-container-lowest shadow-sm leading-relaxed"></textarea>
                        ${isContentPending ? 
                        `<span class="text-[12px] font-bold text-on-surface-variant border border-blue-50 px-2 py-1.5 rounded bg-surface-container text-center mt-2 block">수정 대기중</span>` : 
                        `<button onclick="requestContentUpdate(${g.id})" class="mt-2 w-full py-1.5 bg-surface-container hover:bg-blue-100 border border-blue-50 text-on-surface font-bold text-[13px] rounded transition-colors shadow-sm">내용 수정 요청</button>`}
                    </div>
                </td>
                <td class="py-4 px-4 w-6/12 border-r border-blue-50/30 align-top">
                    <div class="flex flex-col gap-3">
                        <div class="flex items-center gap-4 mt-1 bg-surface-container-lowest p-3 rounded-xl border border-blue-50">
                            <input type="range" min="0" max="100" value="${valProgress}" oninput="updateTempProgress(${g.id}, this.value)" ${isProgressPending?'disabled':''} class="w-full accent-primary h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer">
                            <span id="prog-val-${g.id}" class="text-primary text-[15px] font-black w-12 text-right">${valProgress}%</span>
                        </div>
                        ${isProgressPending ? 
                        `<span class="text-[12px] font-bold text-on-surface-variant border border-blue-50 px-2 py-1.5 rounded bg-surface-container text-center block w-full mt-2">진척률 대기중</span>` : 
                        `<button onclick="requestProgressApproval(${g.id})" class="mt-2 w-full py-1.5 bg-primary text-white font-bold text-[13px] rounded shadow-sm hover:bg-primary-dim transition-colors">진척률 반영 요청</button>`}
                    </div>
                </td>
                <td class="py-4 px-4 w-2/12 align-middle text-center">
                    <span class="text-[14px] font-extrabold ${g.status.includes('대기중') ? 'text-warning' : 'text-success'}">${g.status}</span>
                </td>
            </tr>
            `;
        }).join('');
    }

    let html = `
        <div class="flex items-center gap-8 border-b-2 border-blue-50 mb-7 px-2 w-full">
            <button onclick="setTab('goals_manage', 'monthly')" class="pb-3 text-lg transition-all ${STATE.goalsManageTab === 'monthly' ? activeTabCls : inactiveTabCls}">월별</button>
            <button onclick="setTab('goals_manage', 'quarterly')" class="pb-3 text-lg transition-all ${STATE.goalsManageTab === 'quarterly' ? activeTabCls : inactiveTabCls}">분기별</button>
            <button onclick="setTab('goals_manage', 'yearly')" class="pb-3 text-lg transition-all ${STATE.goalsManageTab === 'yearly' ? activeTabCls : inactiveTabCls}">연간</button>
        </div>

        <div class="mb-4 w-full">
            <select onchange="setPeriod('goals_manage', this.value)" class="bg-surface-container text-primary font-bold border border-blue-50 rounded text-[13px] px-3 py-1.5 outline-none cursor-pointer">
                ${generatePeriodOptions(STATE.goalsManageTab, STATE.goalsManagePeriodValue)}
            </select>
        </div>

        <div class="bg-white rounded-2xl border border-blue-50 shadow-sm w-full overflow-hidden">
            <table class="w-full text-left table-auto">
                <thead>
                    <tr class="text-[14px] text-on-surface-variant font-extrabold bg-surface-container-low border-b border-blue-50">
                        <th class="py-4 px-4 text-center border-r border-blue-50/30">목표 및 속성 수정</th>
                        <th class="py-4 px-4 text-center border-r border-blue-50/30">진척률 (%) 리포트</th>
                        <th class="py-4 px-4 text-center">현재 상태</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        </div>
    `;
    container.innerHTML = html;
}

function renderRequests(container) {
    const list = STATE.allGoals.filter(g => g.requestType !== null || g.isProcessed);
    list.sort((a,b) => (a.isProcessed === b.isProcessed) ? 0 : a.isProcessed ? 1 : -1);
    
    let rowsHtml = '';
    if(list.length === 0) {
        rowsHtml = `<tr><td colspan="6" class="p-10 text-center text-on-surface-variant font-medium text-sm">기록이 없습니다.</td></tr>`;
    } else {
        rowsHtml = list.map(g => {
            const assignee = USER_NAMES[g.userId] || g.userId;
            
            let reqTypeLabel = '결재 적용';
            let typeColor = 'text-on-surface-variant bg-surface-container';
            
            // Revert requestType display based on processed state dynamically or current requestType
            const effectiveRequestType = g.requestType || (g.status === '승인 완료' ? 'approved' : 'new'); 

            if(!g.isProcessed) {
                if(effectiveRequestType === 'new') { reqTypeLabel = '신규 수립'; typeColor = 'bg-primary/10 text-primary'; }
                else if(effectiveRequestType === 'progress-update') { reqTypeLabel = '진척률'; typeColor = 'bg-[#f59e0b]/10 text-[#d97706]'; }
                else if(effectiveRequestType === 'content-update') { reqTypeLabel = '내용 수정'; typeColor = 'bg-[#8b5cf6]/10 text-[#6d28d9]'; }
            }

            let progressHtml = `<div class="font-display font-black text-[15px] text-primary text-center">${g.progress}%</div>`;
            if (effectiveRequestType === 'progress-update' && g.tempProgress !== undefined && !g.isProcessed) {
                progressHtml = `
                    <div class="flex items-center justify-center gap-1.5 text-[13px] font-bold">
                        <span class="text-on-surface-variant line-through">${g.progress}%</span>
                        <svg class="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        <span class="text-primary text-[15px]">${g.tempProgress}%</span>
                    </div>
                `;
            }

            const safePlan = g.actionPlan.replace(/'/g, "\\'").replace(/\n/g, "<br/>");
            
            return `
            <tr class="border-b border-blue-50/50 hover:bg-surface-container-lowest transition-colors ${g.isProcessed ? 'opacity-60 grayscale-[30%]':''}">
                <td class="py-4 px-3 font-bold text-on-surface whitespace-nowrap text-[13px] text-center w-24">${assignee}</td>
                <td class="py-4 px-3 whitespace-nowrap text-[13px] font-semibold text-center text-on-surface-variant w-28 border-x border-blue-50/30">
                    ${getPeriodLabel(g.periodType, g.periodValue)}
                </td>
                <td class="py-4 px-3 text-center whitespace-nowrap w-24 border-r border-blue-50/30">
                    <span class="px-2 py-1 ${typeColor} text-[11px] font-bold rounded block w-full">${reqTypeLabel}</span>
                </td>
                <td class="py-4 px-5 text-left border-r border-blue-50/30">
                    <div class="text-[13px] font-bold text-on-surface mb-1">${g.text}</div>
                    <button onclick="openModal('세부 액션 플랜 상세보기', '${safePlan}')" class="text-primary hover:text-primary-dim font-bold text-[11px] transition-colors underline underline-offset-2">세부 액션 플랜(KPI) 보기</button>
                </td>
                <td class="py-4 px-3 text-center w-36 border-r border-blue-50/30">
                    ${progressHtml}
                </td>
                <td class="py-4 px-4 text-center whitespace-nowrap w-32">
                    ${g.isProcessed 
                        ? `<button onclick="undoApproval(${g.id})" class="px-4 py-1.5 bg-surface-container text-on-surface-variant hover:text-error hover:bg-error/10 font-bold text-[12px] rounded-lg border border-blue-50 transition-colors">완료 (클릭 시 취소)</button>` 
                        : `<button onclick="approveRequest(${g.id})" class="px-5 py-2 bg-gradient-to-br from-primary to-primary-dim text-white font-bold text-[12px] rounded-xl shadow hover:scale-[1.02] transition-transform">승인 처리</button>`
                    }
                </td>
            </tr>
            `;
        }).join('');
    }

    container.innerHTML = `
        <div class="bg-white rounded-2xl border border-blue-50 shadow-sm w-full overflow-hidden">
            <table class="w-full text-left table-auto">
                <thead>
                    <tr class="text-[14px] text-on-surface-variant font-extrabold bg-surface-container border-b border-blue-50">
                        <th class="py-4 px-3 text-center">기안자</th>
                        <th class="py-4 px-3 text-center border-x border-blue-50/30">기간</th>
                        <th class="py-4 px-3 text-center border-r border-blue-50/30">성격</th>
                        <th class="py-4 px-5 text-center border-r border-blue-50/30">목표(OKR) 내용</th>
                        <th class="py-4 px-3 text-center border-r border-blue-50/30">진척률 현황</th>
                        <th class="py-4 px-4 text-center">처리</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </div>
    `;
}

function renderModal(container) {
    if(!STATE.modalData) return;
    
    // Confirm Style vs Info Style
    const hasAction = typeof STATE.modalData.onConfirmAction === 'function';

    const modalHtml = `
        <div id="app-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" onclick="closeModal()"></div>
            <div class="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 transform transition-all border border-blue-100">
                <div class="flex justify-between items-center mb-4 pb-3 border-b border-blue-50">
                    <h3 class="font-display font-bold text-[16px] text-primary">${STATE.modalData.title}</h3>
                    <button onclick="closeModal()" class="text-on-surface-variant hover:text-error transition-colors p-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                </div>
                <div class="text-on-surface text-[14px] leading-relaxed whitespace-normal min-h-[50px] mb-6 font-medium">
                    ${STATE.modalData.content || ''}
                </div>
                <div class="flex justify-end gap-3">
                    <button onclick="closeModal()" class="px-5 py-2 bg-surface-container hover:bg-blue-100 text-on-surface font-bold text-[13px] rounded-lg transition-colors">닫기 ${hasAction ? '(취소)' : ''}</button>
                    ${hasAction ? `<button id="modal-confirm-btn" class="px-5 py-2 bg-primary hover:bg-primary-dim text-white font-bold text-[13px] rounded-lg transition-colors shadow">확인</button>` : ''}
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', modalHtml);

    if (hasAction) {
        document.getElementById('modal-confirm-btn').onclick = () => {
            STATE.modalData.onConfirmAction();
        };
    }
}

// --- App Initialization & Login ---
// (Unchanged logic omitted for brevity, but full file included to ensure it parses)

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
