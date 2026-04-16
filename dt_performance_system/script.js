// --- State & Config ---
const CONFIG = {
    BASEROW_TOKEN: 'YOUR_BASEROW_TOKEN',
    BASEROW_TASKS_TABLE_ID: 'YOUR_TASKS_TABLE_ID', // Table for standard M/D tasks
    BASEROW_LOGS_TABLE_ID: 'YOUR_LOGS_TABLE_ID', // Table for daily work logs
};

const STATE = {
    user: null, // { id: 'master'|'member', name: '...', role: 'admin'|'user' }
    currentView: 'dashboard',
    standardTasks: [], // Fetched Standard M/D tasks
    workLogs: [] // Mocked or fetched logs
};

// --- Dummy Data (Fallback if Baserow config is empty) ---
const DUMMY_TASKS = [
    { id: 1, category: 'Design', name: 'Banner Design', standardMD: 0.1 },
    { id: 2, category: 'Design', name: 'Page Layout', standardMD: 1.0 },
    { id: 3, category: 'Dev', name: 'API Integration', standardMD: 0.5 },
];

const DUMMY_LOGS = [
    { id: 1, userId: 'member', date: '2026-04-15', taskId: 1, actualTime: 1.5, standardMD: 0.1, status: 'Completed', summary: 'Designed spring promo banner' },
    { id: 2, userId: 'member', date: '2026-04-16', taskId: 2, actualTime: 8.0, standardMD: 1.0, status: 'In Progress', summary: 'Drafted main dashboard layout' },
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
        STATE.standardTasks = DUMMY_TASKS; // fallback
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
        console.error('Baserow post failed', e);
        return false;
    }
}

// --- Logic calculations ---
// Calculate Operation Rate (가동률)
// Formula: (Sum of Standard M/D for tasks performed) / (Working days * 1.0 M/D per day)
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
    report: renderReport,
    admin: renderAdmin
};

const MENU_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['admin', 'user'] },
    { id: 'worklog', label: 'Task Log', icon: '<path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['user', 'admin'] },
    { id: 'report', label: 'Performance Report', icon: '<path d="M9 17v-2m4 2v-4m4 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['user', 'admin'] },
    { id: 'admin', label: 'Resource Monitoring', icon: '<path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>', roles: ['admin'] }
];

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
    title.innerText = menuItem ? menuItem.label : 'Dashboard';
    
    VIEWS[STATE.currentView](content);
}

// --- Specific Views ---

function renderDashboard(container) {
    const rate = calculateOperationRate(STATE.user.id);
    
    // Admin sees team avg, user sees personal
    const teamRate = calculateOperationRate('member', 5); // mock team avg
    
    let html = `
        <div class="grid grid-cols-3 gap-6 mb-8">
            <div class="bg-white rounded-xl p-6 kpi-card border border-blue-50">
                <p class="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">My M/D Operation Rate</p>
                <div class="flex items-end gap-3"><h3 class="text-4xl font-display font-bold text-on-surface">${rate}%</h3></div>
                <div class="w-full bg-surface-container h-2 rounded-full mt-4"><div class="bg-primary h-2 rounded-full" style="width: ${rate}%"></div></div>
            </div>
            <div class="bg-white rounded-xl p-6 kpi-card border border-blue-50">
                <p class="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Team Average M/D</p>
                <div class="flex items-end gap-3"><h3 class="text-4xl font-display font-bold text-on-surface">${teamRate}%</h3></div>
                <div class="w-full bg-surface-container h-2 rounded-full mt-4"><div class="bg-outline h-2 rounded-full" style="width: ${teamRate}%"></div></div>
            </div>
            <div class="bg-white rounded-xl p-6 kpi-card border border-blue-50">
                <p class="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Pending Approvals</p>
                <div class="flex items-end gap-3"><h3 class="text-4xl font-display font-bold text-error">2</h3></div>
                <p class="text-sm text-on-surface-variant mt-2">Requires admin review</p>
            </div>
        </div>
        
        <h3 class="font-display text-lg font-semibold mb-4">Recent Task Log</h3>
        <div class="bg-white rounded-xl border border-blue-50 overflow-hidden">
            <table class="w-full text-left border-collapse text-sm">
                <thead>
                    <tr class="bg-surface-container-low text-on-surface-variant border-b border-blue-50/50">
                        <th class="py-3 px-6 font-semibold">Date</th>
                        <th class="py-3 px-6 font-semibold">Task</th>
                        <th class="py-3 px-6 font-semibold">Standard M/D</th>
                        <th class="py-3 px-6 font-semibold">Actual H.</th>
                        <th class="py-3 px-6 font-semibold">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-blue-50/50">
                    ${DUMMY_LOGS.filter(l => STATE.user.role === 'admin' || l.userId === STATE.user.id).map(log => {
                        const task = DUMMY_TASKS.find(t => t.id === log.taskId);
                        const statusColor = log.status === 'Completed' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary';
                        return `
                        <tr class="hover:bg-surface-container-low/50 transition-colors">
                            <td class="py-3 px-6 text-on-surface-variant">${log.date}</td>
                            <td class="py-3 px-6 font-medium">${task ? task.name : 'Unknown'}</td>
                            <td class="py-3 px-6">${log.standardMD} M/D</td>
                            <td class="py-3 px-6">${log.actualTime}h</td>
                            <td class="py-3 px-6"><span class="px-2 py-1 rounded-full text-[11px] font-bold tracking-wide ${statusColor}">${log.status}</span></td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    container.innerHTML = html;
}

function renderWorkLog(container) {
    let options = STATE.standardTasks.map(t => `<option value="${t.id}">${t.category} - ${t.name} (표준 M/D: ${t.standardMD})</option>`).join('');
    
    let html = `
        <div class="max-w-3xl bg-white rounded-xl p-8 border border-blue-50 shadow-sm">
            <h3 class="font-display text-xl font-bold mb-6">Log New Task</h3>
            <form id="worklog-form" class="space-y-6">
                <div>
                    <label class="block text-sm font-semibold mb-2 text-on-surface-variant">Select Standard Task</label>
                    <select id="task-select" class="w-full bg-surface-container-lowest border border-blue-100 rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none">
                        ${options}
                    </select>
                </div>
                <div class="grid grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-semibold mb-2 text-on-surface-variant">Actual Time Spend (Hours)</label>
                        <input type="number" step="0.5" id="actual-time" class="w-full bg-surface-container-lowest border border-blue-100 rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none" placeholder="e.g. 4.5">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-2 text-on-surface-variant">Deliverable URL</label>
                        <input type="url" id="task-url" class="w-full bg-surface-container-lowest border border-blue-100 rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none" placeholder="https://...">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2 text-on-surface-variant">Today's Performance Summary</label>
                    <textarea id="task-summary" rows="3" class="w-full bg-surface-container-lowest border border-blue-100 rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none" placeholder="Briefly describe outputs..."></textarea>
                </div>
                <div class="flex justify-end pt-4">
                    <button type="submit" class="bg-gradient-to-br from-primary to-primary-dim text-white px-6 py-2.5 rounded-lg shadow-md hover:opacity-90 font-medium">Request Approval (Save)</button>
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
            url: document.getElementById('task-url').value,
            status: 'Pending Review'
        };
        const success = await postWorkLog(newLog);
        if(success) {
            alert('Task logged successfully!');
            STATE.currentView = 'dashboard';
            updateNavigation();
            renderCurrentView();
        }
    };
}

function renderReport(container) {
    container.innerHTML = `
        <div class="bg-white rounded-xl p-8 border border-blue-50 shadow-sm text-center py-20">
            <div class="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m4 2v-4m4 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <h3 class="font-display text-xl font-bold mb-2">Weekly/Monthly Performance Report</h3>
            <p class="text-on-surface-variant max-w-md mx-auto mb-6">Select a period to view your standardized M/D achievements aligned with OKRs.</p>
            <div class="flex justify-center gap-4">
                <button class="px-4 py-2 border border-blue-100 rounded-lg text-sm font-medium hover:bg-surface-container">Export PDF</button>
                <button class="px-4 py-2 border border-blue-100 rounded-lg text-sm font-medium hover:bg-surface-container">Export CSV</button>
            </div>
        </div>
    `;
}

function renderAdmin(container) {
    const members = [
        { name: 'Member A', rate: 110 },
        { name: 'Member B', rate: 95 },
        { name: 'Member C', rate: 60 } // Red flag
    ];
    
    let rows = members.map(m => {
        const flag = m.rate < 80 ? `<span class="px-2 py-1 bg-error/10 text-error rounded-full text-xs font-bold">Red Flag</span>` : `<span class="px-2 py-1 bg-success/10 text-success rounded-full text-xs font-bold">On Track</span>`;
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
                <h3 class="font-display font-bold text-lg mb-4">Resource Operation Ranking</h3>
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-xs text-on-surface-variant uppercase tracking-wider">
                            <th class="pb-2 px-6">Member</th>
                            <th class="pb-2 px-6">M/D Rate</th>
                            <th class="pb-2 px-6">Status</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
            <div class="bg-white rounded-xl p-6 border border-blue-50 shadow-sm flex flex-col items-center justify-center text-center">
                <h3 class="font-display font-bold text-lg mb-2">ROI Analytics</h3>
                <p class="text-sm text-on-surface-variant border border-dashed border-blue-200 p-8 rounded-lg w-full bg-surface">
                    [Chart Placeholder]<br>Productivity vs Personnel Cost
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
        alert('Invalid password');
        return;
    }

    if(id === 'master') {
        STATE.user = { id: 'master', name: 'Master Admin', role: 'admin' };
    } else if (id === 'member') {
        STATE.user = { id: 'member', name: 'General Member', role: 'user' };
    } else {
        alert('Unknown User ID');
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
document.getElementById('current-date').innerText = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric'
});
