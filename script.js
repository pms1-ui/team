// --- State & Config ---
const CONFIG = {
    BASEROW_TOKEN: 'YOUR_BASEROW_TOKEN',
    BASEROW_TASKS_TABLE_ID: 'YOUR_TASKS_TABLE_ID', // Table for standard M/D tasks
    BASEROW_LOGS_TABLE_ID: 'YOUR_LOGS_TABLE_ID', // Table for daily work logs
};

const STATE = {
    user: null, // { id: 'master'|'member', name: '...', role: 'admin'|'user' }
    currentView: 'dashboard',
    dashboardTab: 'weekly', // 'weekly' or 'monthly'
    standardTasks: [], // Fetched Standard M/D tasks
    workLogs: [], // Mocked or fetched logs
    goals: [ { id: 1, text: '' }, { id: 2, text: '' }, { id: 3, text: '' } ] // Default 3 goals
};

// --- Helper variable for user names ---
const USER_NAMES = { 'master': '마스터 관리자', 'member': '일반 구성원' };

// --- Dummy Data (Fallback if Baserow config is empty) ---
const DUMMY_TASKS = [
    { id: 1, category: '디자인', name: '배너 디자인', standardMD: 0.1 },
    { id: 2, category: '디자인', name: '메인 페이지 레이아웃', standardMD: 1.0 },
    { id: 3, category: '개발', name: 'API 연동', standardMD: 0.5 },
];

const DUMMY_LOGS = [
    { id: 1, userId: 'member', date: '2026-04-15', taskId: 1, actualTime: 1.5, standardMD: 0.1, summary: '봄맞이 프로모션 배너 디자인 완료' },
    { id: 2, userId: 'member', date: '2026-04-16', taskId: 2, actualTime: 8.0, standardMD: 1.0, summary: '메인 대시보드 레이아웃 초안 작업' },
];

// --- Baserow API Helpers ---
async function fetchStandardTasks() {
    if (CONFIG.BASEROW_TOKEN === 'YOUR_BASEROW_TOKEN') {
        STATE.standardTasks = DUMMY_TASKS;
        return;
    }
    try {
        const res = await fetch(`https://api.baserow.io/api/database/rows/table/${CONFIG.BASEROW_TASKS_TABLE_ID}/?user_field_names=true`, {
            headers: { 'Authorization': `Token ${CONFIG.BASEROW_TOKEN}` }
        });
        const data = await res.json();
        STATE.standardTasks = data.results.map(r => ({
            id: r.id, category: r.Category, name: r.TaskName, standardMD: parseFloat(r.StandardMD)
        }));
    } catch (e) {
        console.error('Baserow fetch failed', e);
        STATE.standardTasks = DUMMY_TASKS;
    }
}

async function postWorkLog(logData) {
    if (CONFIG.BASEROW_TOKEN === 'YOUR_BASEROW_TOKEN') {
        DUMMY_LOGS.push({ id: Date.now(), ...logData });
        return true;
    }
    try {
        const res = await fetch(`https://api.baserow.io/api/database/rows/table/${CONFIG.BASEROW_LOGS_TABLE_ID}/?user_field_names=true`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${CONFIG.BASEROW_TOKEN}`
            },
            body: JSON.stringify(logData)
        });
        return res.ok;
    } catch (e) {
        return false;
    }
}

// --- Logic calculations ---
function calculateOperationRate(userId, days = 5) {
    const logs = DUMMY_LOGS.filter(l => l.userId === userId);
    const totalMD = logs.reduce((sum, log) => sum + log.standardMD, 0);
    const expectedMD = days * 1.0; 
    return Math.round((totalMD / expectedMD) * 100);
}

// --- UI Rendering ---

const VIEWS = {
    dashboard: renderDashboard,
    worklog: renderWorkLog,
    goals: renderGoals,
    admin: renderAdmin
};

const MENU_ITEMS = [
    { id: 'dashboard', label: '대시보드', icon: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['admin', 'user'] },
    { id: 'goals', label: '목표 설정', icon: '<path d="M13 10V3L4 14h7v7l9-11h-7z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['user', 'admin'] },
    { id: 'worklog', label: '업무 일지', icon: '<path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['user', 'admin'] },
    { id: 'admin', label: '리소스 모니터링', icon: '<path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['admin'] }
];

// Made globally accessible for inline onclick
window.setDashboardTab = function(tab) {
    STATE.dashboardTab = tab;
    renderCurrentView();
};

window.addGoalRow = function() {
    if (STATE.goals.length < 10) {
        STATE.goals.push({ id: Date.now(), text: '' });
        renderCurrentView();
    } else {
        alert('목표는 최대 10개까지만 설정 가능합니다.');
    }
};

window.removeGoalRow = function(id) {
    if (STATE.goals.length > 3) {
        STATE.goals = STATE.goals.filter(g => g.id !== id);
        renderCurrentView();
    } else {
        alert('최소 3개의 목표는 설정해야 합니다.');
    }
};

window.updateGoalText = function(id, value) {
    const goal = STATE.goals.find(g => g.id === id);
    if(goal) goal.text = value;
};

window.submitGoals = function() {
    alert('팀장에게 목표 합의 요청이 전송되었습니다!');
    STATE.currentView = 'dashboard';
    updateNavigation();
    renderCurrentView();
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
    
    VIEWS[STATE.currentView](content);
}

// --- Specific Views ---

function renderDashboard(container) {
    // Days logic based on tab
    const days = STATE.dashboardTab === 'weekly' ? 5 : 20;
    const rate = calculateOperationRate(STATE.user.id, days);
    
    // Admin sees team avg, user sees personal
    const teamRate = calculateOperationRate('member', days); // mock team avg
    
    // Tab active classes
    const activeTabCls = "bg-primary text-white font-medium shadow-sm";
    const inactiveTabCls = "text-on-surface-variant hover:bg-surface-container";

    let html = `
        <div class="flex items-center justify-between mb-6">
            <h3 class="font-display text-lg font-semibold">가동률 현황</h3>
            <div class="flex items-center bg-white border border-blue-50 rounded-lg p-1">
                <button onclick="setDashboardTab('weekly')" class="px-4 py-1.5 rounded-md text-sm transition-all ${STATE.dashboardTab === 'weekly' ? activeTabCls : inactiveTabCls}">주간 (월~금)</button>
                <button onclick="setDashboardTab('monthly')" class="px-4 py-1.5 rounded-md text-sm transition-all ${STATE.dashboardTab === 'monthly' ? activeTabCls : inactiveTabCls}">월간</button>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-6 mb-8">
            <div class="bg-white rounded-xl p-6 kpi-card border border-blue-50">
                <p class="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">나의 M/D 가동률 (${STATE.dashboardTab === 'weekly' ? '주간' : '월간'})</p>
                <div class="flex items-end gap-3"><h3 class="text-4xl font-display font-bold text-on-surface">${rate}%</h3></div>
                <div class="w-full bg-surface-container h-2 rounded-full mt-4"><div class="bg-primary h-2 rounded-full" style="width: ${rate > 100 ? 100 : rate}%"></div></div>
            </div>
            <div class="bg-white rounded-xl p-6 kpi-card border border-blue-50">
                <p class="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">팀 평균 가동률 (${STATE.dashboardTab === 'weekly' ? '주간' : '월간'})</p>
                <div class="flex items-end gap-3"><h3 class="text-4xl font-display font-bold text-on-surface">${teamRate}%</h3></div>
                <div class="w-full bg-surface-container h-2 rounded-full mt-4"><div class="bg-outline h-2 rounded-full" style="width: ${teamRate > 100 ? 100 : teamRate}%"></div></div>
            </div>
        </div>
        
        <h3 class="font-display text-lg font-semibold mb-4">최근 업무 로그</h3>
        <div class="bg-white rounded-xl border border-blue-50 overflow-hidden">
            <table class="w-full text-left border-collapse text-sm">
                <thead>
                    <tr class="bg-surface-container-low text-on-surface-variant border-b border-blue-50/50">
                        <th class="py-3 px-6 font-semibold">담당자명</th>
                        <th class="py-3 px-6 font-semibold">일자</th>
                        <th class="py-3 px-6 font-semibold">업무명</th>
                        <th class="py-3 px-6 font-semibold">표준 M/D (환산)</th>
                        <th class="py-3 px-6 font-semibold">실제 투입</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-blue-50/50">
                    ${DUMMY_LOGS.filter(l => STATE.user.role === 'admin' || l.userId === STATE.user.id).map(log => {
                        const task = DUMMY_TASKS.find(t => t.id === log.taskId);
                        const standardHours = (log.standardMD * 8).toFixed(1);
                        const assignee = USER_NAMES[log.userId] || '알 수 없음';
                        return `
                        <tr class="hover:bg-surface-container-low/50 transition-colors">
                            <td class="py-3 px-6 font-medium text-primary">${assignee}</td>
                            <td class="py-3 px-6 text-on-surface-variant">${log.date}</td>
                            <td class="py-3 px-6 font-medium">${task ? task.name : '알 수 없음'}</td>
                            <td class="py-3 px-6">${log.standardMD} M/D <span class="text-on-surface-variant text-xs">(${standardHours}h)</span></td>
                            <td class="py-3 px-6">${log.actualTime}h</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    container.innerHTML = html;
}

function renderGoals(container) {
    let rowsHtml = STATE.goals.map((g, index) => {
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

    let html = `
        <div class="max-w-4xl bg-white rounded-xl p-8 border border-blue-50 shadow-sm">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h3 class="font-display text-xl font-bold">목표 설정 (OKR)</h3>
                    <p class="text-sm text-on-surface-variant mt-1">월간/분기/연간 목표를 수립하고 팀장 합의를 요청하세요. (최소 3개, 최대 10개)</p>
                </div>
                <button onclick="addGoalRow()" class="flex items-center gap-2 px-4 py-2 bg-surface-container text-primary font-semibold rounded-lg hover:bg-primary/20 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    목표 추가
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
    `;
    container.innerHTML = html;
}

function renderWorkLog(container) {
    let options = STATE.standardTasks.map(t => `<option value="${t.id}">${t.category} - ${t.name} (표준 M/D: ${t.standardMD})</option>`).join('');
    
    let html = `
        <div class="max-w-3xl bg-white rounded-xl p-8 border border-blue-50 shadow-sm">
            <h3 class="font-display text-xl font-bold mb-6">새 업무 기록하기</h3>
            <form id="worklog-form" class="space-y-6">
                <div>
                    <label class="block text-sm font-semibold mb-2 text-on-surface-variant">표준 업무 선택</label>
                    <select id="task-select" class="w-full bg-surface-container-lowest border border-blue-100 rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none">
                        ${options}
                    </select>
                </div>
                <div class="grid grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-semibold mb-2 text-on-surface-variant">실제 투입 시간 (시간)</label>
                        <input type="number" step="0.5" id="actual-time" class="w-full bg-surface-container-lowest border border-blue-100 rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none" placeholder="예: 4.5" required>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-2 text-on-surface-variant">산출물 URL</label>
                        <input type="url" id="task-url" class="w-full bg-surface-container-lowest border border-blue-100 rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none" placeholder="https://...">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2 text-on-surface-variant">오늘의 성과 요약</label>
                    <textarea id="task-summary" rows="3" class="w-full bg-surface-container-lowest border border-blue-100 rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none" placeholder="결과물을 간략하게 설명해주세요..."></textarea>
                </div>
                <div class="flex justify-end pt-4">
                    <button type="submit" class="bg-gradient-to-br from-primary to-primary-dim text-white px-6 py-2.5 rounded-lg shadow-md hover:opacity-90 font-medium">업무 등록하기</button>
                </div>
            </form>
        </div>
    `;
    container.innerHTML = html;
    
    document.getElementById('worklog-form').onsubmit = async (e) => {
        e.preventDefault();
        const taskId = parseInt(document.getElementById('task-select').value);
        const taskObj = STATE.standardTasks.find(t => t.id === taskId);
        const newLog = {
            userId: STATE.user.id,
            date: new Date().toISOString().split('T')[0],
            taskId: taskId,
            standardMD: taskObj ? taskObj.standardMD : 0,
            actualTime: parseFloat(document.getElementById('actual-time').value) || 0,
            summary: document.getElementById('task-summary').value,
            url: document.getElementById('task-url').value
        };
        const success = await postWorkLog(newLog);
        if(success) {
            alert('업무 일지가 성공적으로 등록되었습니다!');
            STATE.currentView = 'dashboard';
            updateNavigation();
            renderCurrentView();
        }
    };
}

function renderAdmin(container) {
    const members = [
        { name: '일반 구성원', rate: 110 },
        { name: '구성원 B', rate: 95 },
        { name: '구성원 C', rate: 60 } // Red flag
    ];
    
    let rows = members.map(m => {
        const flag = m.rate < 80 ? `<span class="px-3 py-1 bg-error/10 text-error rounded-full text-xs font-bold whitespace-nowrap">미달 (Red Flag)</span>` : `<span class="px-3 py-1 bg-success/10 text-success rounded-full text-xs font-bold whitespace-nowrap">정상 궤도</span>`;
        return `
        <tr class="border-b border-blue-50/50">
            <td class="py-3 px-6 font-medium">${m.name}</td>
            <td class="py-3 px-6 font-display font-bold ${m.rate < 80 ? 'text-error' : 'text-primary'}">${m.rate}%</td>
            <td class="py-3 px-6">${flag}</td>
        </tr>
        `;
    }).join('');

    container.innerHTML = `
        <div class="grid grid-cols-2 gap-6 mb-8">
            <div class="bg-white rounded-xl p-6 border border-blue-50 shadow-sm">
                <h3 class="font-display font-bold text-lg mb-4">리소스 밀도 랭킹 (구성원 전체)</h3>
                <table class="w-full text-left bg-surface-container-lowest">
                    <thead>
                        <tr class="text-xs text-on-surface-variant uppercase tracking-wider bg-surface-container-low border-b border-blue-50">
                            <th class="py-3 px-6">이름</th>
                            <th class="py-3 px-6">M/D 가동률</th>
                            <th class="py-3 px-6">상태</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
            <div class="bg-white rounded-xl p-6 border border-blue-50 shadow-sm flex flex-col items-center justify-center text-center">
                <h3 class="font-display font-bold text-lg mb-2">투자 대비 생산성 (ROI) 평가</h3>
                <p class="text-sm text-on-surface-variant border border-dashed border-blue-200 p-8 rounded-lg w-full bg-surface mt-2">
                    [차트 위치 영억]<br><br>가동률 대비 인건비 생산성 비교 그래프
                </p>
            </div>
        </div>
    `;
}

// --- App Initialization & Login ---

document.getElementById('btn-login').addEventListener('click', async () => {
    const id = document.getElementById('login-id').value;
    const pw = document.getElementById('login-pw').value;

    if(pw !== '1111') {
        alert('비밀번호가 올바르지 않습니다.');
        return;
    }

    if(id === 'master') {
        STATE.user = { id: 'master', name: '마스터 관리자', role: 'admin' };
    } else if (id === 'member') {
        STATE.user = { id: 'member', name: '일반 구성원', role: 'user' };
    } else {
        alert('존재하지 않는 사용자 ID입니다.');
        return;
    }
    
    // Init app
    await fetchStandardTasks();
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
