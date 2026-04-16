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
    modalData: null, // { title: '', content: '', onConfirm: null }
    
    // All Goals Data (Structure Update: nested keyResults)
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
            status: '승인 완료', 
            requestType: null, 
            comment: '', 
            isProcessed: false 
        },
        { 
            id: 102, 
            userId: 'member', 
            periodType: 'monthly', 
            periodValue: '2026-04', 
            text: '퍼포먼스 시스템 고도화', 
            keyResults: [
                { id: 'kr102-1', text: 'API 응답 속도 200ms 이하 단축', progress: 60, tempProgress: 80 }
            ],
            status: '승인 대기중', 
            requestType: '진척률', 
            comment: '최적화 작업 진행 중', 
            isProcessed: false 
        }
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

// --- Menu Configuration ---
const MENU_ITEMS = [
    { id: 'dashboard', label: '대시보드', icon: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['admin', 'user'] },
    { id: 'goals_set', label: '목표 설정 및 합의', icon: '<path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['user', 'admin'] },
    { id: 'goals_manage', label: '목표 관리', icon: '<path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['user', 'admin'] },
    { id: 'requests', label: '요청 관리', icon: '<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['admin'] }
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

window.openModal = function(title, content, onConfirmAction = null, allowHtml = true) {
    STATE.modalData = { title, content, onConfirmAction, allowHtml };
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
        if(goal.status === '승인 완료') goal.tempText = val;
        else goal.text = val;
    }
};

window.updateKRTitle = function(okrId, krId, val) {
    const goal = STATE.allGoals.find(g => g.id === okrId);
    if(goal) {
        const kr = goal.keyResults.find(k => k.id === krId);
        if(kr) {
            if(goal.status === '승인 완료') kr.tempText = val;
            else kr.text = val;
        }
    }
};

window.updateKRProgress = function(okrId, krId, val) {
    const goal = STATE.allGoals.find(g => g.id === okrId);
    if(goal) {
        const kr = goal.keyResults.find(k => k.id === krId);
        if(kr) {
            kr.tempProgress = parseInt(val);
            const el = document.getElementById(`kr-prog-val-${krId}`);
            if(el) el.innerText = val + '%';
        }
    }
};

window.addKR = function(okrId) {
    const goal = STATE.allGoals.find(g => g.id === okrId);
    if(goal) {
        goal.keyResults.push({ id: 'kr-' + Date.now(), text: '', progress: 0 });
        renderCurrentView();
    }
};

window.removeKR = function(okrId, krId) {
    const goal = STATE.allGoals.find(g => g.id === okrId);
    if(goal && goal.keyResults.length > 1) {
        goal.keyResults = goal.keyResults.filter(k => k.id !== krId);
        renderCurrentView();
    }
};

window.addOKR = function() {
    STATE.allGoals.push({
        id: Date.now(), userId: STATE.user.id, periodType: STATE.goalsSetTab, periodValue: STATE.goalsSetPeriodValue,
        text: '', keyResults: [{ id: 'kr-' + Date.now(), text: '', progress: 0 }],
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
    renderCurrentView();
};

window.cancelOKRRequest = function(id) {
    const goal = STATE.allGoals.find(g => g.id === id);
    if(goal) {
        if(goal.requestType === '신규 수립') {
            goal.status = '작성중';
            goal.requestType = null;
        } else {
            goal.status = '승인 완료';
            goal.requestType = null;
            // Clear all temp
            goal.tempText = undefined;
            goal.keyResults.forEach(k => {
                k.tempText = undefined;
                k.tempProgress = undefined;
            });
        }
        renderCurrentView();
    }
};

window.submitModifyRequest = function(id) {
    const goal = STATE.allGoals.find(g => g.id === id);
    if(!goal) return;

    let edits = [];
    if(goal.tempText !== undefined && goal.tempText !== goal.text) edits.push('OKR');
    if(goal.keyResults.some(k => k.tempText !== undefined && k.tempText !== k.text)) edits.push('KR 내용');
    if(goal.keyResults.some(k => k.tempProgress !== undefined && k.tempProgress !== k.progress)) edits.push('진척률');

    if(edits.length === 0) { alert('변경사항이 없습니다.'); return; }

    const mBody = `
        <div class="mb-3 text-[13px] font-bold">수정 요약: <span class="text-primary">${edits.join(', ')}</span></div>
        <textarea id="modify-comment" class="w-full bg-surface-container border border-blue-50 rounded px-3 py-2 text-[13px] outline-none min-h-[80px]" placeholder="수정 사유를 입력하세요..."></textarea>
    `;
    openModal('수정/진척률 승인 요청', mBody, () => {
        const comment = document.getElementById('modify-comment').value;
        goal.status = '승인 대기중';
        goal.requestType = edits.join(',');
        goal.comment = comment;
        closeModal();
        renderCurrentView();
    });
};

window.approveAdminRequest = function(id) {
    const goal = STATE.allGoals.find(g => g.id === id);
    if(goal) {
        if(goal.tempText !== undefined) goal.text = goal.tempText;
        goal.keyResults.forEach(k => {
            if(k.tempText !== undefined) k.text = k.tempText;
            if(k.tempProgress !== undefined) k.progress = k.tempProgress;
            k.tempText = undefined;
            k.tempProgress = undefined;
        });
        goal.tempText = undefined;
        goal.status = '승인 완료';
        goal.requestType = null;
        goal.isProcessed = true;
        renderCurrentView();
    }
};

// Navigation
function updateNavigation() {
    const nav = document.getElementById('nav-menu');
    nav.innerHTML = '';
    MENU_ITEMS.forEach(item => {
        if (!item.roles.includes(STATE.user.role)) return;
        const btn = document.createElement('button');
        const isActive = STATE.currentView === item.id;
        btn.className = `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container'}`;
        btn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">${item.icon}</svg> ${item.label}`;
        btn.onclick = () => { STATE.currentView = item.id; updateNavigation(); renderCurrentView(); };
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
    
    if (STATE.modalData) renderModal(document.body);
    else {
        const modal = document.getElementById('app-modal');
        if(modal) modal.remove();
    }
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

    let h = `
        <div class="flex items-center justify-between mb-8">
            <h3 class="font-display text-lg font-semibold">구성원 OKR 달성 현황</h3>
            <div class="flex items-center gap-2">
                <select onchange="setPeriod('dashboard', this.value)" class="bg-surface-container text-primary font-bold border border-blue-50 rounded-lg text-sm px-4 py-2 outline-none cursor-pointer">
                    ${generatePeriodOptions(STATE.dashboardTab, STATE.dashboardPeriodValue)}
                </select>
                <div class="flex items-center bg-white border border-blue-50 rounded-lg p-1 shadow-sm ml-4">
                    <button onclick="setTab('dashboard', 'monthly')" class="px-5 py-1.5 rounded-md text-sm transition-all ${STATE.dashboardTab === 'monthly' ? 'bg-primary text-white font-medium shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'}">월간</button>
                    <button onclick="setTab('dashboard', 'quarterly')" class="px-5 py-1.5 rounded-md text-sm transition-all ${STATE.dashboardTab === 'quarterly' ? 'bg-primary text-white font-medium shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'}">분기</button>
                    <button onclick="setTab('dashboard', 'yearly')" class="px-5 py-1.5 rounded-md text-sm transition-all ${STATE.dashboardTab === 'yearly' ? 'bg-primary text-white font-medium shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'}">연간</button>
                </div>
            </div>
        </div>
    `;

    if(Object.keys(users).length === 0) {
        h += `<div class="bg-white/50 border border-dashed border-blue-200 h-64 rounded-2xl flex items-center justify-center text-on-surface-variant">표시할 목표 데이터가 없습니다.</div>`;
    } else {
        for(let uid in users) {
            const name = USER_NAMES[uid] || uid;
            const uGoals = users[uid];
            h += `
                <div class="mb-10">
                    <div class="flex items-center gap-3 mb-4 ml-2">
                        <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">${name.charAt(0)}</div>
                        <span class="font-bold text-on-surface text-[15px]">${name}</span>
                    </div>
                    <div class="bg-white rounded-2xl border border-blue-50 shadow-sm overflow-hidden w-full">
                        <table class="w-full text-left table-auto">
                            <thead>
                                <tr class="bg-surface-container-low text-on-surface-variant border-b border-blue-50 text-[13px] font-bold">
                                    <th class="py-3 px-6 w-1/3">OKR 목표</th>
                                    <th class="py-3 px-6 w-1/2">Key Results 리스트</th>
                                    <th class="py-3 px-6 text-center w-24">진척률</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-blue-50/30">
            `;
            uGoals.forEach(g => {
                h += `
                    <tr>
                        <td class="py-4 px-6 align-top">
                            <span class="font-bold text-on-surface text-[13px] leading-relaxed block mt-1">${g.text}</span>
                        </td>
                        <td class="py-4 px-6 border-x border-blue-50/20">
                            <div class="flex flex-col gap-5">
                                ${g.keyResults.map(kr => `
                                    <div class="flex flex-col gap-2">
                                        <div class="text-[12px] font-medium text-on-surface">${kr.text}</div>
                                        <div class="w-full bg-surface-container h-1 rounded-full overflow-hidden shadow-inner">
                                            <div class="bg-primary h-full transition-all" style="width: ${kr.progress}%"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </td>
                        <td class="py-4 px-6 text-center align-top">
                            <div class="flex flex-col gap-5">
                                ${g.keyResults.map(kr => `
                                    <div class="text-primary font-black text-[12px] h-7 flex items-center justify-center">${kr.progress}%</div>
                                `).join('')}
                            </div>
                        </td>
                    </tr>
                `;
            });
            h += `</tbody></table></div></div>`;
        }
    }
    container.innerHTML = h;
}

function renderGoalsSet(container) {
    const drafts = STATE.allGoals.filter(g => g.userId === STATE.user.id && g.periodType === STATE.goalsSetTab && g.periodValue === STATE.goalsSetPeriodValue);
    if(drafts.length === 0) {
        for(let i=0; i<3; i++) addOKR(); 
        return;
    }

    let itemsHtml = drafts.map((g, i) => {
        const isEditable = g.status === '작성중';
        const isPending = g.status.includes('대기중');

        let opHtml = '';
        if(isEditable) {
            opHtml = `
                <div class="flex items-center gap-2">
                    <button onclick="submitOKRRequest(${g.id})" class="bg-primary text-white py-1.5 px-4 rounded text-[13px] font-bold shadow hover:bg-primary-dim transition-colors">승인 요청</button>
                    <button onclick="removeOKR(${g.id})" class="bg-error text-white py-1.5 px-3 rounded text-[13px] font-bold hover:bg-error/90 transition-colors">삭제</button>
                </div>
            `;
        } else if(isPending) {
            opHtml = `
                <div class="flex items-center gap-2">
                    <span class="text-on-surface-variant text-[12px] font-bold">승인 대기중</span>
                    <button onclick="cancelOKRRequest(${g.id})" class="text-error border border-error hover:bg-error/10 py-1 px-3 rounded text-[12px] font-bold transition-colors">취소</button>
                </div>
            `;
        } else {
            opHtml = `<span class="text-success font-black text-[13px]">승인 완료</span>`;
        }

        return `
            <tr class="hover:bg-surface-container-lowest transition-colors border-b border-blue-50/50">
                <td class="py-5 px-4 text-center border-r border-blue-50/30 font-bold text-on-surface-variant text-[13px] w-12">${i+1}</td>
                <td class="py-5 px-6 border-r border-blue-50/30 w-[35%] align-top">
                    <input type="text" value="${g.text}" oninput="updateOKRTitle(${g.id}, this.value)" ${!isEditable?'disabled':''} class="w-full bg-white border border-blue-100 rounded px-3 py-2 text-[13px] font-bold text-on-surface outline-none focus:border-primary disabled:bg-surface-container shadow-sm" placeholder="OKR 목표를 입력하세요">
                </td>
                <td class="py-5 px-6 border-r border-blue-50/30 w-[40%] align-top">
                    <div class="flex flex-col gap-3">
                        ${g.keyResults.map((kr, kri) => `
                            <div class="flex group items-center gap-2">
                                <input type="text" value="${kr.text}" oninput="updateKRTitle(${g.id}, '${kr.id}', this.value)" ${!isEditable?'disabled':''} class="flex-1 bg-surface-container-low border border-blue-50 rounded px-2 py-1.5 text-[12px] text-on-surface outline-none focus:bg-white focus:border-primary transition-all shadow-inner" placeholder="Key Result ${kri+1} 내용을 입력하세요">
                                ${isEditable && g.keyResults.length > 1 ? `<button onclick="removeKR(${g.id}, '${kr.id}')" class="text-error opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-error/10 rounded"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>` : ''}
                            </div>
                        `).join('')}
                        ${isEditable ? `<button onclick="addKR(${g.id})" class="text-primary font-bold text-[11px] flex items-center gap-1 hover:underline mt-1">+ Key Result 추가</button>` : ''}
                    </div>
                </td>
                <td class="py-5 px-6 text-center align-middle">
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
        <div class="mb-4 flex justify-between items-center w-full">
            <select onchange="setPeriod('goals_set', this.value)" class="bg-surface-container text-primary font-bold border border-blue-50 rounded text-[13px] px-3 py-1.5 outline-none">
                ${generatePeriodOptions(STATE.goalsSetTab, STATE.goalsSetPeriodValue)}
            </select>
            <button onclick="addOKR()" class="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-100 text-primary font-bold text-[13px] rounded hover:bg-blue-50 transition-all shadow-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                OKR 추가
            </button>
        </div>
        <div class="bg-white rounded-2xl border border-blue-50 shadow-sm w-full overflow-hidden">
            <table class="w-full text-left table-auto">
                <thead>
                    <tr class="text-[14px] text-on-surface-variant font-extrabold bg-surface-container border-b border-blue-50">
                        <th class="py-4 px-4 text-center border-r border-blue-50/30">No.</th>
                        <th class="py-4 px-4 text-center border-r border-blue-50/30">OKR</th>
                        <th class="py-4 px-4 text-center border-r border-blue-50/30">Key Results</th>
                        <th class="py-4 px-4 text-center">조작</th>
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
        rowsHtml = `<tr><td colspan="5" class="py-20 text-center text-on-surface-variant text-[13px] font-bold">관리 가능한 목표가 없습니다.</td></tr>`;
    } else {
        rowsHtml = items.map((g, i) => {
            const isPending = g.status.includes('대기중');
            const cTitle = (g.tempText !== undefined) ? g.tempText : g.text;

            return `
                <tr class="hover:bg-surface-container-lowest/50 transition-colors border-b border-blue-50/50">
                    <td class="py-6 px-4 text-center border-r border-blue-50/30 font-bold text-on-surface-variant text-[13px] w-12 align-top">${i+1}</td>
                    <td class="py-6 px-6 w-[25%] border-r border-blue-50/30 align-top">
                        <input type="text" value="${cTitle}" oninput="updateOKRTitle(${g.id}, this.value)" ${isPending ? 'disabled':''} class="w-full bg-white border border-blue-100 rounded px-2 py-2 text-[13px] font-extrabold text-on-surface focus:border-primary outline-none shadow-sm disabled:bg-surface-container">
                    </td>
                    <td class="py-6 px-6 w-[35%] border-r border-blue-50/30 align-top">
                        <div class="flex flex-col gap-4">
                            ${g.keyResults.map(kr => `
                                <input type="text" value="${kr.tempText !== undefined ? kr.tempText : kr.text}" oninput="updateKRTitle(${g.id}, '${kr.id}', this.value)" ${isPending?'disabled':''} class="bg-surface-container-low border border-blue-50 rounded px-2 py-1.5 text-[12px] text-on-surface focus:bg-white focus:border-primary outline-none shadow-sm disabled:bg-surface-container-low">
                            `).join('')}
                        </div>
                    </td>
                    <td class="py-6 px-6 w-[25%] border-r border-blue-50/30 align-top">
                        <div class="flex flex-col gap-4">
                            ${g.keyResults.map(kr => {
                                const val = (kr.tempProgress !== undefined) ? kr.tempProgress : kr.progress;
                                return `
                                    <div class="flex items-center gap-3 bg-surface-container-lowest border border-blue-50 p-2 rounded-lg shadow-inner">
                                        <span id="kr-prog-val-${kr.id}" class="text-primary font-black text-[13px] w-8 text-right">${val}%</span>
                                        <input type="range" min="0" max="100" value="${val}" oninput="updateKRProgress(${g.id}, '${kr.id}', this.value)" ${isPending?'disabled':''} class="flex-1 accent-primary h-1 bg-blue-100 rounded appearance-none cursor-pointer">
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </td>
                    <td class="py-6 px-4 text-center align-middle w-32">
                        <div class="flex flex-col items-center gap-2">
                            <span class="text-[12px] font-black ${isPending?'text-warning':'text-success'} mb-1">${g.status}</span>
                            ${isPending ? 
                                `<button onclick="cancelOKRRequest(${g.id})" class="w-full border border-error text-error hover:bg-error/10 py-1.5 rounded text-[12px] font-bold shadow-sm transition-all">취소</button>` : 
                                `<button onclick="submitModifyRequest(${g.id})" class="w-full bg-primary text-white py-2 rounded text-[12px] font-bold hover:bg-primary-dim shadow transition-all">수정 요청</button>`
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
            <select onchange="setPeriod('goals_manage', this.value)" class="bg-surface-container text-primary font-bold border border-blue-50 rounded text-[13px] px-3 py-1.5 outline-none">
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
                        <th class="py-4 px-6 border-r border-blue-50/30 text-center">진척률 조절</th>
                        <th class="py-4 px-4 text-center">조작</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </div>
    `;
}

function renderRequests(container) {
    const list = STATE.allGoals.filter(g => (g.requestType || g.isProcessed) && g.periodType === STATE.requestsTab && g.periodValue === STATE.requestsPeriodValue);
    list.sort((a,b) => (a.isProcessed === b.isProcessed) ? 0 : a.isProcessed ? 1 : -1);

    let rowsHtml = '';
    if(list.length === 0) {
        rowsHtml = `<tr><td colspan="7" class="py-20 text-center text-on-surface-variant font-bold text-[13px]">요청 데이터가 없습니다.</td></tr>`;
    } else {
        rowsHtml = list.map(g => {
            const assignee = USER_NAMES[g.userId] || g.userId;
            const period = getPeriodLabel(g.periodType, g.periodValue);
            
            let types = (g.requestType || '신규 수립').split(',');
            let tagsHtml = `<div class="flex flex-col gap-1 items-center justify-center">` + types.map(t => {
                let c = 'bg-surface-container text-on-surface-variant';
                const s = t.trim();
                if(s === '신규 수립') c = 'bg-primary/10 text-primary';
                else if(s === '진척률') c = 'bg-[#f59e0b]/10 text-[#d97706]';
                else if(s === 'OKR') c = 'bg-[#10b981]/10 text-[#047857]';
                else if(s === 'KR 내용') c = 'bg-purple-100 text-purple-700';
                return `<span class="px-2 py-0.5 ${c} text-[10px] font-bold rounded block w-full text-center">${s}</span>`;
            }).join('') + `</div>`;

            const hasComment = !!g.comment;
            const diffHtml = createDiffContent(g);

            return `
                <tr class="border-b border-blue-50/50 hover:bg-surface-container-lowest transition-colors ${g.isProcessed ? 'opacity-70 grayscale-[30%]':''}">
                    <td class="py-5 px-3 font-bold text-on-surface text-[13px] text-center w-24">${assignee}</td>
                    <td class="py-5 px-3 text-center text-on-surface-variant text-[12px] border-x border-blue-50/30">${period}</td>
                    <td class="py-5 px-3 border-r border-blue-50/30 w-24 align-middle text-center">
                        ${g.isProcessed ? `<span class="px-2 py-1 bg-surface-container text-on-surface-variant text-[10px] font-black rounded block text-center">결재 완료</span>` : tagsHtml}
                    </td>
                    <td class="py-5 px-4 border-r border-blue-50/30 text-center">
                        <button onclick="openModal('상세 내역 확인 및 전후 비교', \`${diffHtml}\` )" class="px-4 py-2 bg-white border border-blue-100 text-primary font-bold text-[12px] rounded hover:bg-blue-50 shadow-sm transition-all mx-auto block">상세 내용 확인</button>
                    </td>
                    <td class="py-5 px-3 border-r border-blue-50/30 text-center w-24">
                        ${hasComment ? `<button onclick="openModal('요청 코멘트', '${g.comment.replace(/\n/g, '<br/>')}')" class="text-on-surface-variant text-[11px] font-bold underline hover:text-primary">코멘트 보기</button>` : `<span class="text-[11px] text-on-surface-variant/30 font-bold">없음</span>`}
                    </td>
                    <td class="py-5 px-3 border-r border-blue-50/30 text-center w-36">
                        <div class="flex flex-col gap-2">
                            ${g.keyResults.map(kr => {
                                const p = (kr.tempProgress !== undefined && !g.isProcessed) ? 
                                    `<div class="flex items-center gap-1"><span class="line-through text-[10px] text-on-surface-variant/50">${kr.progress}%</span><svg class="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg><span class="text-primary text-[13px]">${kr.tempProgress}%</span></div>` : 
                                    `<span class="text-on-surface font-black text-[13px]">${kr.progress}%</span>`;
                                return `<div class="h-6 flex items-center justify-center">${p}</div>`;
                            }).join('')}
                        </div>
                    </td>
                    <td class="py-5 px-4 text-center w-28 align-middle">
                        ${g.isProcessed ? 
                            `<button onclick="undoApproval(${g.id})" class="w-full py-2 bg-success text-white font-black text-[12px] rounded shadow hover:opacity-90 transition-all">완료</button>` : 
                            `<button onclick="approveAdminRequest(${g.id})" class="w-full py-2 bg-primary text-white font-black text-[12px] rounded shadow-lg hover:scale-[1.03] transition-all">승인 처리</button>`
                        }
                    </td>
                </tr>
            `;
        }).join('');
    }

    container.innerHTML = `
        <div class="flex items-center gap-8 border-b-2 border-blue-50 mb-6 px-2 w-full">
            <button onclick="setTab('requests', 'monthly')" class="pb-3 text-lg transition-all ${STATE.requestsTab === 'monthly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">월별 요청</button>
            <button onclick="setTab('requests', 'quarterly')" class="pb-3 text-lg transition-all ${STATE.requestsTab === 'quarterly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">분기별 요청</button>
            <button onclick="setTab('requests', 'yearly')" class="pb-3 text-lg transition-all ${STATE.requestsTab === 'yearly' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}">연간 요청</button>
        </div>
        <div class="mb-4 w-full">
            <select onchange="setPeriod('requests', this.value)" class="bg-surface-container text-primary font-bold border border-blue-50 rounded text-[13px] px-3 py-1.5 outline-none">
                ${generatePeriodOptions(STATE.requestsTab, STATE.requestsPeriodValue)}
            </select>
        </div>
        <div class="bg-white rounded-2xl border border-blue-50 shadow-sm w-full overflow-hidden">
            <table class="w-full text-left table-auto">
                <thead class="bg-surface-container">
                    <tr class="text-[14px] text-on-surface-variant font-extrabold border-b border-blue-50">
                        <th class="py-4 px-3 text-center">기안자</th>
                        <th class="py-4 px-3 text-center border-x border-blue-50/30">기간</th>
                        <th class="py-4 px-3 text-center border-r border-blue-50/30">성격</th>
                        <th class="py-4 px-5 text-center border-r border-blue-50/30">상세 내용</th>
                        <th class="py-4 px-3 text-center border-r border-blue-50/30">코멘트</th>
                        <th class="py-4 px-3 text-center border-r border-blue-50/30">진척률 현황</th>
                        <th class="py-4 px-4 text-center">처리 조작</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </div>
    `;
}

function createDiffContent(g) {
    let diff = `
        <div class="space-y-6 max-h-[70vh] overflow-y-auto px-1 custom-scroll">
            <!-- OKR Diff -->
            <div class="p-4 bg-surface-container-lowest rounded-xl border border-blue-50">
                <div class="text-[12px] font-black text-on-surface-variant uppercase tracking-wider mb-2">OKR 목표</div>
                ${g.tempText !== undefined && g.tempText !== g.text ? `
                    <div class="space-y-2">
                        <div class="p-2 bg-error/5 text-error text-[13px] rounded border border-error/10 line-through">(기전) ${g.text}</div>
                        <div class="p-2 bg-success/5 text-success text-[13px] font-bold rounded border border-success/10">(변경) ${g.tempText}</div>
                    </div>
                ` : `<div class="p-2 text-on-surface font-bold text-[13px] bg-white rounded border border-blue-50 shadow-sm">${g.text}</div>`}
            </div>
            <!-- KR Diff -->
            <div class="p-4 bg-surface-container-lowest rounded-xl border border-blue-50">
                <div class="text-[12px] font-black text-on-surface-variant uppercase tracking-wider mb-3">Key Results 상세 내역</div>
                <div class="space-y-4">
    `;

    g.keyResults.forEach((kr, i) => {
        const hasTextDiff = kr.tempText !== undefined && kr.tempText !== kr.text;
        const hasProgDiff = kr.tempProgress !== undefined && kr.tempProgress !== kr.progress;

        diff += `<div class="p-3 bg-white rounded-lg border border-blue-50/50 shadow-sm">
                    <div class="text-[11px] font-bold text-primary mb-2">Key Result #${i+1}</div>`;
        if(hasTextDiff) {
            diff += `<div class="space-y-1 mb-2">
                        <div class="text-[12px] text-on-surface-variant/50 line-through">${kr.text}</div>
                        <div class="text-[13px] text-success font-bold">${kr.tempText}</div>
                    </div>`;
        } else {
            diff += `<div class="text-[13px] text-on-surface font-medium mb-2">${kr.text}</div>`;
        }
        
        if(hasProgDiff) {
            diff += `<div class="flex items-center gap-2 text-[12px] bg-surface-container-low p-2 rounded">
                        <span class="text-on-surface-variant/40 line-through">${kr.progress}%</span>
                        <svg class="w-2 h-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                        <span class="text-primary font-black">${kr.tempProgress}% (진척률 변경 요청)</span>
                    </div>`;
        } else {
            diff += `<div class="text-[11px] text-on-surface-variant/60 font-medium">현재 진척률: ${kr.progress}%</div>`;
        }
        diff += `</div>`;
    });

    diff += `</div></div></div>`;
    return diff.replace(/"/g, '&quot;').replace(/\n/g, '');
}

function renderModal(container) {
    if(!STATE.modalData) return;
    const hasAction = typeof STATE.modalData.onConfirmAction === 'function';
    const mHtml = `
        <div id="app-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="closeModal()"></div>
            <div class="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 transform transition-all border border-blue-100 overflow-hidden">
                <div class="flex justify-between items-center mb-6 pb-4 border-b border-blue-50">
                    <h3 class="font-display font-black text-[18px] text-primary tracking-tight">${STATE.modalData.title}</h3>
                    <button onclick="closeModal()" class="text-on-surface-variant hover:text-error transition-colors p-2 rounded-full hover:bg-error/10"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                </div>
                <div class="text-on-surface text-[14px] mb-8 leading-relaxed">
                    ${STATE.modalData.content}
                </div>
                <div class="flex justify-end gap-3 mt-4">
                    <button onclick="closeModal()" class="px-6 py-2.5 bg-surface-container hover:bg-blue-100 text-on-surface font-black text-[13px] rounded-xl transition-all h-11">닫기</button>
                    ${hasAction ? `<button id="modal-confirm-btn" class="px-7 py-2.5 bg-primary hover:bg-primary-dim text-white font-black text-[13px] rounded-xl shadow-lg transition-all h-11">확인</button>` : ''}
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
const today = new Date();
document.getElementById('current-date').innerText = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
