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

    let h = `
        <div class="flex items-center justify-between mb-8">
            <h3 class="font-display text-lg font-semibold">구성원 OKR 달성 현황</h3>
            <div class="flex items-center gap-2">
                <select onchange="setPeriod('dashboard', this.value)" class="bg-surface-container text-primary font-bold border border-blue-50 rounded-lg text-sm px-4 py-2 outline-none cursor-pointer">
                    ${generatePeriodOptions(STATE.dashboardTab, STATE.dashboardPeriodValue)}
                </select>
                <div class="flex items-center bg-white border border-blue-50 rounded-lg p-1 shadow-sm ml-4">
                    <button onclick="setTab('dashboard', 'monthly')" class="px-5 py-1.5 rounded-md text-[13px] transition-all ${STATE.dashboardTab === 'monthly' ? 'bg-primary text-white font-bold shadow-sm' : 'text-on-surface-variant font-medium hover:bg-surface-container'}">월간</button>
                    <button onclick="setTab('dashboard', 'quarterly')" class="px-5 py-1.5 rounded-md text-[13px] transition-all ${STATE.dashboardTab === 'quarterly' ? 'bg-primary text-white font-bold shadow-sm' : 'text-on-surface-variant font-medium hover:bg-surface-container'}">분기</button>
                    <button onclick="setTab('dashboard', 'yearly')" class="px-5 py-1.5 rounded-md text-[13px] transition-all ${STATE.dashboardTab === 'yearly' ? 'bg-primary text-white font-bold shadow-sm' : 'text-on-surface-variant font-medium hover:bg-surface-container'}">연간</button>
                </div>
            </div>
        </div>
    `;

    if(Object.keys(users).length === 0) {
        h += `<div class="bg-white/50 border border-dashed border-blue-200 h-64 rounded-2xl flex items-center justify-center text-on-surface-variant font-bold text-[13px]">표시할 목표 데이터가 없습니다.</div>`;
    } else {
        for(let uid in users) {
            const name = USER_NAMES[uid] || uid;
            const uGoals = users[uid];
            h += `
                <div class="mb-10">
                    <div class="flex items-center gap-3 mb-4 ml-2">
                        <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shadow-sm">${name.charAt(0)}</div>
                        <span class="font-extrabold text-on-surface text-[14px]">${name}</span>
                    </div>
                    <div class="bg-white rounded-2xl border border-blue-50 shadow-sm overflow-hidden w-full">
                        <table class="w-full text-left table-auto">
                            <thead class="bg-surface-container">
                                <tr class="text-[14px] text-on-surface-variant font-extrabold border-b border-blue-50">
                                    <th class="py-4 px-6 border-r border-blue-50/30 w-1/3">OKR</th>
                                    <th class="py-4 px-6 border-r border-blue-50/30 w-1/2">Key Results</th>
                                    <th class="py-4 px-6 text-center w-24">진척률</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-blue-50/30">
            `;
            uGoals.forEach(g => {
                h += `
                    <tr>
                        <td class="py-4 px-6 align-top">
                            <span class="font-bold text-on-surface text-[13px] leading-relaxed block mt-1 break-keep">${g.text}</span>
                        </td>
                        <td class="py-4 px-6 border-x border-blue-50/20">
                            <div class="flex flex-col gap-5">
                                ${g.keyResults.map(kr => `
                                    <div class="flex flex-col gap-2">
                                        <div class="text-[13px] font-medium text-on-surface">${kr.text}</div>
                                        <div class="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden shadow-inner">
                                            <div class="bg-primary h-full transition-all" style="width: ${kr.progress}%"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </td>
                        <td class="py-4 px-6 text-center align-top">
                            <div class="flex flex-col gap-5">
                                ${g.keyResults.map(kr => `
                                    <div class="text-primary font-black text-[13px] h-7 flex items-end justify-center">${kr.progress}%</div>
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
        <div class="mb-4 flex justify-between items-center w-full">
            <select onchange="setPeriod('goals_set', this.value)" class="bg-surface-container text-primary font-bold border border-blue-50 rounded-lg text-[13px] px-3 py-1.5 outline-none">
                ${generatePeriodOptions(STATE.goalsSetTab, STATE.goalsSetPeriodValue)}
            </select>
            <button onclick="addOKR()" class="flex items-center gap-2 px-4 py-2 bg-white border border-blue-100 text-primary font-bold text-[13px] rounded-lg hover:bg-blue-50 transition-all shadow-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                새 OKR 추가
            </button>
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
const today = new Date();
document.getElementById('current-date').innerText = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
