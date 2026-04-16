// --- State & Config ---
const STATE = {
    user: null, // { id: 'master'|'member', name: '...', role: 'admin'|'user' }
    currentView: 'dashboard',
    
    // Tab states
    dashboardTab: 'monthly', // 'monthly', 'quarterly', 'yearly'
    goalsTab: 'monthly', // 'monthly', 'quarterly', 'yearly'
    
    // Current draft goals for submission
    activeGoalsDraft: [ { id: 1, text: '' }, { id: 2, text: '' }, { id: 3, text: '' } ],
    
    // Submitted Goals Data
    submittedGoals: [
        { id: 101, userId: 'member', periodType: 'monthly', periodValue: '2026-04', text: '기존 시스템 UI/UX 전면 개편 및 컴포넌트화', progress: 40, status: '합의 완료', history: [] },
        { id: 102, userId: 'member', periodType: 'monthly', periodValue: '2026-04', text: '주요 지표 시각화 및 대시보드 구조 설계', progress: 85, status: '합의 완료', history: [] },
        { id: 103, userId: 'member', periodType: 'quarterly', periodValue: '2026-Q2', text: 'DT 전략 기반 신규 프레임워크 1.0 론칭', progress: 20, status: '합의 완료', history: [] },
        { id: 104, userId: 'member2', periodType: 'monthly', periodValue: '2026-04', text: '서버 아키텍처 개선 및 AWS 마이그레이션 착수', progress: 60, status: '합의 완료', history: [] },
    ]
};

const USER_NAMES = {
    'master': '마스터 관리자',
    'member': '김전략 (팀원)',
    'member2': '이개발 (팀원)'
};

// --- Helpers ---
function getPeriodLabel(type, value) {
    if (type === 'monthly') return `${value.split('-')[0]}년 ${value.split('-')[1]}월`;
    if (type === 'quarterly') return `${value.split('-')[0]}년 ${value.split('-')[1]}분기`;
    if (type === 'yearly') return `${value}년`;
    return value;
}

// --- Menu Configuration ---
const MENU_ITEMS = [
    { id: 'dashboard', label: '대시보드', icon: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['admin', 'user'] },
    { id: 'goals', label: '목표 설정 및 관리', icon: '<path d="M13 10V3L4 14h7v7l9-11h-7z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['user', 'admin'] },
    { id: 'admin', label: '리소스 모니터링', icon: '<path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['admin'] }
];

// --- Global Dispatchers ---
window.setTab = function(view, tab) {
    if (view === 'dashboard') STATE.dashboardTab = tab;
    if (view === 'goals') STATE.goalsTab = tab;
    renderCurrentView();
};

window.addGoalRow = function() {
    if (STATE.activeGoalsDraft.length < 10) {
        STATE.activeGoalsDraft.push({ id: Date.now(), text: '' });
        renderCurrentView();
    } else {
        alert('목표는 최대 10개까지만 설정 가능합니다.');
    }
};

window.removeGoalRow = function(id) {
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

window.submitGoals = function() {
    const periodValue = document.getElementById('period-selector').value;
    
    let isAllFilled = STATE.activeGoalsDraft.every(g => g.text.trim() !== '');
    if(!isAllFilled) {
        alert('모든 목표 내용을 입력해주세요.');
        return;
    }
    
    // Add to submitted goals
    STATE.activeGoalsDraft.forEach(g => {
        STATE.submittedGoals.push({
            id: Date.now() + Math.random(),
            userId: STATE.user.id,
            periodType: STATE.goalsTab,
            periodValue: periodValue,
            text: g.text,
            progress: 0,
            status: '합의 대기중',
            history: []
        });
    });
    
    alert('팀장에게 목표 합의 요청이 성공적으로 전송되었습니다!');
    // Reset draft
    STATE.activeGoalsDraft = [ { id: 1, text: '' }, { id: 2, text: '' }, { id: 3, text: '' } ];
    renderCurrentView();
};

window.updateProgress = function(goalId, newProgress) {
    const goal = STATE.submittedGoals.find(g => g.id == goalId);
    if(goal) goal.progress = parseInt(newProgress);
    renderCurrentView();
};

window.addComment = function(goalId) {
    const goal = STATE.submittedGoals.find(g => g.id == goalId);
    let msg = prompt('진척 상황에 대한 상세 내용이나 코멘트를 입력하세요:');
    if(msg && msg.trim() !== '') {
        const dateStr = new Date().toLocaleDateString('ko-KR');
        goal.history.push(`[${dateStr}] ${msg}`);
        alert('코멘트가 추가되었습니다.');
        renderCurrentView();
    }
};

window.requestEdit = function(goalId) {
    const goal = STATE.submittedGoals.find(g => g.id == goalId);
    let msg = prompt('목표 수정을 요청하시겠습니까? 수정 사유를 입력해주세요:');
    if(msg && msg.trim() !== '') {
        goal.status = '수정 요청됨';
        const dateStr = new Date().toLocaleDateString('ko-KR');
        goal.history.push(`[${dateStr} - 수정 요청] ${msg}`);
        alert('수정 요청이 전송되었습니다.');
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
    else if (STATE.currentView === 'goals') renderGoals(content);
    else if (STATE.currentView === 'admin') renderAdmin(content);
}

// --- Specific Views ---

function renderDashboard(container) {
    const activeTabCls = "bg-primary text-white font-medium shadow-sm";
    const inactiveTabCls = "text-on-surface-variant hover:bg-surface-container";

    // Filter goals based on selected tab period type
    const relevantGoals = STATE.submittedGoals.filter(g => g.periodType === STATE.dashboardTab);
    
    // Group goals by Member
    let membersWithGoals = {};
    if(STATE.user.role === 'admin') {
        relevantGoals.forEach(g => {
            if(!membersWithGoals[g.userId]) membersWithGoals[g.userId] = [];
            membersWithGoals[g.userId].push(g);
        });
    } else {
        // user only sees theirs
        membersWithGoals[STATE.user.id] = relevantGoals.filter(g => g.userId === STATE.user.id);
    }

    let dashboardHtml = `
        <div class="flex items-center justify-between mb-8">
            <h3 class="font-display text-lg font-semibold">전체 구성원 목표 달성 현황</h3>
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
            const name = USER_NAMES[userId] || '알 수 없음';
            
            // Render specific member card
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
                    <p class="text-[10px] text-on-surface-variant/70 mt-1">${getPeriodLabel(g.periodType, g.periodValue)}</p>
                </div>
            `).join('');
            
            // Average completion
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

function renderGoals(container) {
    const activeTabCls = "border-b-2 border-primary text-primary font-bold";
    const inactiveTabCls = "text-on-surface-variant hover:text-primary transition-colors";
    
    // Generate valid period options
    let periodOptionsHtml = '';
    const date = new Date();
    const currYear = date.getFullYear() >= 2026 ? date.getFullYear() : 2026;
    
    if (STATE.goalsTab === 'monthly') {
        for(let m=1; m<=12; m++) {
            let val = `${currYear}-${String(m).padStart(2, '0')}`;
            periodOptionsHtml += `<option value="${val}">${currYear}년 ${m}월</option>`;
        }
    } else if (STATE.goalsTab === 'quarterly') {
        for(let q=1; q<=4; q++) {
            let val = `${currYear}-Q${q}`;
            periodOptionsHtml += `<option value="${val}">${currYear}년 ${q}분기</option>`;
        }
    } else if (STATE.goalsTab === 'yearly') {
        periodOptionsHtml += `<option value="${currYear}">${currYear}년</option>`;
        periodOptionsHtml += `<option value="${currYear+1}">${currYear+1}년</option>`;
    }

    // Guide texts
    let guideHtml = '';
    if(STATE.goalsTab === 'monthly') guideHtml = '해당 월이 도래하기 1주일 전에 해당 월 목표를 입력 및 합의 요청해야 합니다.';
    if(STATE.goalsTab === 'quarterly') guideHtml = '해당 분기가 도래하기 1개월 전에 해당 분기 목표를 입력 및 합의 요청해야 합니다.';
    if(STATE.goalsTab === 'yearly') guideHtml = '연도가 넘어가기 1개월 전에 해당 연도 목표를 입력 및 합의 요청해야 합니다.';

    // Draft Input Rows
    let rowsHtml = STATE.activeGoalsDraft.map((g, index) => {
        return `
            <div class="flex items-center gap-3">
                <span class="text-sm font-bold text-on-surface-variant w-8 aspect-square flex items-center justify-center bg-surface-container rounded-full">${index + 1}</span>
                <input type="text" value="${g.text}" oninput="updateGoalText(${g.id}, this.value)" class="flex-1 bg-surface-container-lowest border border-blue-100 rounded-lg px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" placeholder="측정 가능한 OKR 및 달성 목표를 입력하세요...">
                <button onclick="removeGoalRow(${g.id})" class="p-2 text-error hover:bg-error/10 rounded-lg transition-colors" title="삭제">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        `;
    }).join('');

    // My Submitted Goals for this tab
    const mySubmitted = STATE.submittedGoals.filter(g => g.userId === STATE.user.id && g.periodType === STATE.goalsTab);
    let mySubmittedHtml = '<p class="text-sm text-on-surface-variant mb-4">현재 탭에 등록된 체결 목표가 없습니다.</p>';
    if (mySubmitted.length > 0) {
        mySubmittedHtml = `
            <table class="w-full text-left border-collapse bg-white rounded-xl overflow-hidden border border-blue-50 text-sm">
                <thead>
                    <tr class="bg-surface-container-low text-on-surface-variant border-b border-blue-50/50">
                        <th class="py-3 px-6 font-semibold w-1/4">대상 기간</th>
                        <th class="py-3 px-6 font-semibold w-1/2">목표 내용</th>
                        <th class="py-3 px-6 font-semibold">진척률</th>
                        <th class="py-3 px-6 font-semibold text-center">액션</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-blue-50/50">
                    ${mySubmitted.map(g => `
                    <tr class="hover:bg-surface-container-low/30 transition-colors">
                        <td class="py-4 px-6 text-primary font-bold tracking-wide">${getPeriodLabel(g.periodType, g.periodValue)}</td>
                        <td class="py-4 px-6">
                            <p class="font-medium mb-1">${g.text}</p>
                            ${g.history.length > 0 ? `<p class="text-xs text-on-surface-variant bg-surface-container-low p-2 rounded mt-2">${g.history[g.history.length-1]}</p>` : ''}
                        </td>
                        <td class="py-4 px-6">
                            <div class="flex items-center gap-3">
                                <input type="range" min="0" max="100" value="${g.progress}" onchange="updateProgress(${g.id}, this.value)" class="w-24 accent-primary">
                                <span class="font-bold w-10 text-right">${g.progress}%</span>
                            </div>
                        </td>
                        <td class="py-4 px-6">
                            <div class="flex items-center justify-center gap-2">
                                <button onclick="addComment(${g.id})" class="px-3 py-1.5 bg-surface-container text-primary rounded text-xs font-semibold hover:bg-primary/20">상세 남기기</button>
                                <button onclick="requestEdit(${g.id})" class="px-3 py-1.5 bg-error/10 text-error rounded text-xs font-semibold hover:bg-error/20">수정 요청</button>
                            </div>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    let html = `
        <!-- Tabs -->
        <div class="flex items-center gap-8 border-b border-blue-100 mb-8 px-4">
            <button onclick="setTab('goals', 'monthly')" class="pb-3 text-lg transition-all ${STATE.goalsTab === 'monthly' ? activeTabCls : inactiveTabCls}">월별 목표</button>
            <button onclick="setTab('goals', 'quarterly')" class="pb-3 text-lg transition-all ${STATE.goalsTab === 'quarterly' ? activeTabCls : inactiveTabCls}">분기별 목표</button>
            <button onclick="setTab('goals', 'yearly')" class="pb-3 text-lg transition-all ${STATE.goalsTab === 'yearly' ? activeTabCls : inactiveTabCls}">연간 목표</button>
        </div>

        <div class="bg-error/10 border-l-4 border-error p-4 rounded-r-lg mb-8">
            <p class="text-sm font-medium text-error flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                ${guideHtml}
            </p>
        </div>

        <div class="bg-white rounded-xl p-8 border border-blue-50 shadow-sm mb-10">
            <div class="flex items-center justify-between mb-8">
                <div class="flex items-center gap-4">
                    <h3 class="font-display text-xl font-bold">새로운 목표 수립</h3>
                    <select id="period-selector" class="bg-surface-container-lowest border border-blue-100 rounded text-sm px-3 py-1.5 focus:border-primary focus:ring-1 outline-none">
                        ${periodOptionsHtml}
                    </select>
                </div>
                <button onclick="addGoalRow()" class="flex items-center gap-2 px-4 py-2 bg-surface-container text-primary font-semibold rounded-lg hover:bg-primary/20 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    목표 줄 추가
                </button>
            </div>
            
            <div class="space-y-4 mb-8">
                ${rowsHtml}
            </div>
            
            <div class="flex justify-end pt-6 border-t border-blue-50/50">
                <button onclick="submitGoals()" class="bg-gradient-to-br from-primary to-primary-dim text-white px-8 py-3 rounded-lg shadow-md hover:opacity-90 font-medium tracking-wide">
                    팀장 합의 요청
                </button>
            </div>
        </div>

        <h3 class="font-display text-lg font-semibold mb-4 px-2">나의 ${STATE.goalsTab === 'monthly' ? '월간' : STATE.goalsTab === 'quarterly' ? '분기별' : '연간'} 체결 목표</h3>
        ${mySubmittedHtml}
    `;
    container.innerHTML = html;
}

function renderAdmin(container) {
    const list = STATE.submittedGoals;
    
    let rowsHtml = '';
    if(list.length === 0) {
        rowsHtml = `<tr><td colspan="4" class="p-6 text-center text-on-surface-variant">현재 제출된 목표가 없습니다.</td></tr>`;
    } else {
        rowsHtml = list.map(g => {
            const assignee = USER_NAMES[g.userId] || g.userId;
            return `
            <tr class="border-b border-blue-50/50 hover:bg-surface-container-low/50">
                <td class="py-3 px-6 font-medium">${assignee}</td>
                <td class="py-3 px-6 text-primary font-bold text-xs">${getPeriodLabel(g.periodType, g.periodValue)}</td>
                <td class="py-3 px-6 align-middle">
                    <div class="truncate max-w-xs text-sm">${g.text}</div>
                </td>
                <td class="py-3 px-6 font-display font-bold ${g.progress < 50 ? 'text-error' : g.progress === 100 ? 'text-success' : 'text-primary'}">${g.progress}%</td>
                <td class="py-3 px-6"><span class="px-2 py-1 bg-surface-container rounded font-bold text-[10px] text-on-surface-variant">${g.status}</span></td>
            </tr>
            `;
        }).join('');
    }

    container.innerHTML = `
        <div class="bg-white rounded-xl p-6 border border-blue-50 shadow-sm mb-6">
            <h3 class="font-display font-bold text-lg mb-4">전사 리소스 목표 관리 체계</h3>
            <table class="w-full text-left bg-surface-container-lowest">
                <thead>
                    <tr class="text-xs text-on-surface-variant uppercase tracking-wider bg-surface-container-low border-b border-blue-50">
                        <th class="py-3 px-6">구성원</th>
                        <th class="py-3 px-6">대상 단위</th>
                        <th class="py-3 px-6 max-w-xs">핵심 내용</th>
                        <th class="py-3 px-6">진척률</th>
                        <th class="py-3 px-6">상태</th>
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
    
    // Init app
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
