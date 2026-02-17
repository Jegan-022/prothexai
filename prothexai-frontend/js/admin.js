import { apiRequest } from './api.js';

// ---- CONFIG & STATE ----
const COLORS = {
    primary: '#2563EB',
    green: '#16A34A',
    amber: '#F59E0B',
    red: '#DC2626',
    slate: '#94A3B8',
    card: '#1E293B'
};

let currentModule = 'dashboard';
let allPatients = [];
let allFeedback = [];
let broadcastCategory = 'system';
let charts = {
    risk: null,
    latency: null,
    db: null
};

// ---- INITIALIZATION ----
async function init() {
    setupLogout();
    setupBroadcast();

    // Initial Load
    await switchModule('dashboard');

    // Auto-refresh stats every 60s
    setInterval(() => {
        if (currentModule === 'dashboard') loadDashboardData();
    }, 60000);
}

// ---- NAVIGATION & ROUTING ----
window.switchModule = async function (moduleId) {
    currentModule = moduleId;

    // Update Sidebar UI
    document.querySelectorAll('.sidebar-link').forEach(el => {
        el.classList.remove('active', 'text-text-primary');
        el.classList.add('text-text-secondary');
    });
    const activeLink = document.getElementById(`nav-${moduleId}`);
    if (activeLink) activeLink.classList.add('active', 'text-text-primary');

    // Update Header
    const titles = {
        dashboard: { main: 'Dashboard Overview', sub: 'Population Health Analytics' },
        patients: { main: 'Patient Registry', sub: 'Clinical Risk Triage' },
        feedback: { main: 'Issue Management', sub: 'User Reports & Feedback' },
        broadcast: { main: 'Outreach & Broadcast', sub: 'System-wide Communications' },
        system: { main: 'System Operations', sub: 'Real-time Infrastructure Health' }
    };
    document.querySelector('#module-title h2').textContent = titles[moduleId].main;
    document.querySelector('#module-title span').textContent = titles[moduleId].sub;

    // Show/Hide Modules
    document.querySelectorAll('#module-container > div').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(`module-${moduleId}`);
    if (target) target.classList.remove('hidden');

    // Load Data for specific module
    switch (moduleId) {
        case 'dashboard': await loadDashboardData(); break;
        case 'patients': await loadPatients(); break;
        case 'feedback': await loadFeedback(); break;
        case 'system': initSystemMonitor(); break;
    }
};

// ---- MODULE: DASHBOARD ----
async function loadDashboardData() {
    try {
        const stats = await apiRequest('/admin/dashboard');

        // KPI Cards
        document.getElementById('kpi-patients').textContent = stats.total_patients;
        document.getElementById('kpi-active').textContent = stats.total_patients > 0 ? Math.floor(stats.total_patients * 0.85) : 0; // Mock active for now
        document.getElementById('kpi-feedback').textContent = stats.open_issues;
        document.getElementById('kpi-critical').textContent = stats.risk_distribution.high;

        renderRiskChart(stats.risk_distribution);

        // Load top 5 feedback
        const feedback = await apiRequest('/admin/feedback');
        renderDashboardFeedback(feedback.slice(0, 5));

    } catch (e) {
        console.error("Dashboard data load failed", e);
    }
}

function renderRiskChart(dist) {
    const ctx = document.getElementById('risk-chart').getContext('2d');
    if (charts.risk) charts.risk.destroy();

    charts.risk = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Stable', 'Moderate', 'High Risk', 'No Data'],
            datasets: [{
                data: [dist.stable, dist.moderate, dist.high, dist.no_data],
                backgroundColor: [COLORS.green, COLORS.amber, COLORS.red, '#334155'],
                borderWidth: 0,
                cutout: '80%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: COLORS.slate, font: { weight: 'bold', size: 10 } }
                }
            }
        }
    });
}

function renderDashboardFeedback(items) {
    const list = document.getElementById('dashboard-feedback-list');
    list.innerHTML = '';

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'p-3 rounded-xl border border-border-dark flex gap-3 hover:bg-white/5 transition-all cursor-pointer';
        div.innerHTML = `
            <div class="size-2 rounded-full mt-1.5 shrink-0 ${item.status === 'open' ? 'bg-accent-amber' : 'bg-accent-green'}"></div>
            <div class="flex-1 overflow-hidden">
                <p class="text-[11px] font-bold text-text-primary line-clamp-1">${item.description}</p>
                <div class="flex justify-between items-center mt-1">
                    <span class="text-[9px] text-text-secondary font-bold uppercase">${item.patient_name}</span>
                    <span class="text-[8px] text-text-secondary opacity-50 font-bold">${new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>
        `;
        list.appendChild(div);
    });
}

// ---- MODULE: PATIENTS ----
async function loadPatients() {
    try {
        allPatients = await apiRequest('/admin/patients');
        renderPatientTable(allPatients);

        // Setup Search/Filter
        document.getElementById('patient-search').oninput = filterPatients;
        document.getElementById('filter-risk').onchange = filterPatients;
    } catch (e) {
        console.error(e);
    }
}

function filterPatients() {
    const query = document.getElementById('patient-search').value.toLowerCase();
    const risk = document.getElementById('filter-risk').value;

    const filtered = allPatients.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(query);
        let matchRisk = true;

        if (risk === 'high') matchRisk = p.health_score < 60;
        else if (risk === 'moderate') matchRisk = p.health_score >= 60 && p.health_score < 85;
        else if (risk === 'stable') matchRisk = p.health_score >= 85;

        return matchSearch && matchRisk;
    });

    renderPatientTable(filtered);
}

function renderPatientTable(patients) {
    const tbody = document.getElementById('patient-table-body');
    tbody.innerHTML = '';

    patients.forEach(p => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-white/5 transition-all';

        let riskClass = 'text-accent-green';
        if (p.health_score < 60) riskClass = 'text-accent-red';
        else if (p.health_score < 85) riskClass = 'text-accent-amber';

        row.innerHTML = `
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                        ${p.name.charAt(0)}
                    </div>
                    <span class="text-xs font-bold">${p.name}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-center text-[11px] font-bold text-text-secondary uppercase">${p.device_type}</td>
            <td class="px-6 py-4 text-center">
                <span class="text-xs font-black ${riskClass}">${p.health_score}</span>
            </td>
            <td class="px-6 py-4 text-center">
                <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border border-white/10 ${p.skin_risk === 'High' ? 'text-accent-red' : 'text-text-secondary'}">
                    ${p.skin_risk}
                </span>
            </td>
             <td class="px-6 py-4 text-center">
                <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border border-white/10 ${p.gait_status === 'Abnormal' ? 'text-accent-red' : 'text-text-secondary'}">
                    ${p.gait_status}
                </span>
            </td>
            <td class="px-6 py-4 text-center text-[10px] text-text-secondary font-bold">${p.last_active}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="viewPatientDetail('${p.id}')" class="px-4 py-1.5 rounded-lg border border-border-dark text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Clinical</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ---- MODULE: PATIENT DETAIL ----
window.viewPatientDetail = async function (pid) {
    const overlay = document.getElementById('patient-detail-overlay');
    const content = document.getElementById('patient-detail-content');
    overlay.classList.remove('hidden');
    content.innerHTML = '<p class="text-center py-20 animate-pulse text-text-secondary uppercase font-bold tracking-widest">Constructing Comprehensive Clinical Profile...</p>';

    try {
        const data = await apiRequest(`/admin/patients/${pid}`);
        const p = data.profile;
        const history = data.history;

        content.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <!-- Patient Info -->
                <div class="space-y-6">
                    <div class="glass-card p-8 rounded-[2rem] text-center border-t-8 border-t-primary">
                        <div class="size-24 rounded-3xl bg-primary/20 mx-auto flex items-center justify-center text-primary mb-6">
                            <span class="material-symbols-outlined text-[48px]">person</span>
                        </div>
                        <h2 class="text-2xl font-black">${p.name}</h2>
                        <p class="text-xs font-bold text-text-secondary uppercase tracking-widest mt-1">${p.amputation_level || 'Patient'} • ${p.age} years</p>
                        
                        <div class="mt-8 grid grid-cols-2 gap-4">
                             <div class="p-4 bg-background-dark rounded-2xl">
                                <p class="text-[9px] text-text-secondary font-black uppercase">Device</p>
                                <p class="text-xs font-bold mt-1">${p.device_type || 'N/A'}</p>
                             </div>
                             <div class="p-4 bg-background-dark rounded-2xl">
                                <p class="text-[9px] text-text-secondary font-black uppercase">Status</p>
                                <p class="text-xs font-bold mt-1 text-accent-green">Active</p>
                             </div>
                        </div>
                    </div>

                    <div class="glass-card p-6 rounded-2xl space-y-4">
                        <h4 class="text-[10px] font-black uppercase tracking-widest text-text-secondary">Vital Stats</h4>
                        <div class="space-y-3">
                             <div class="flex justify-between items-center text-xs font-bold">
                                <span>BMI Index</span>
                                <span class="text-primary">${p.bmi.toFixed(1)}</span>
                             </div>
                             <div class="flex justify-between items-center text-xs font-bold">
                                <span>Blood Pressure</span>
                                <span class="text-text-primary ${p.blood_pressure_systolic > 140 ? 'text-accent-red' : ''}">${p.blood_pressure_systolic}/${p.blood_pressure_diastolic}</span>
                             </div>
                              <div class="flex justify-between items-center text-xs font-bold">
                                <span>Blood Sugar</span>
                                <span class="text-text-primary">${p.blood_sugar_mg_dl} mg/dL</span>
                             </div>
                        </div>
                    </div>
                </div>

                <!-- Metrics Detail -->
                <div class="lg:col-span-2 space-y-8">
                    <div class="glass-card p-8 rounded-[2rem]">
                        <h4 class="text-sm font-black uppercase tracking-widest text-text-secondary mb-8">Clinical Wear History</h4>
                        <div class="h-64 relative">
                            <canvas id="patient-trend-chart"></canvas>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="glass-card p-6 rounded-2xl">
                             <h4 class="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-4">Baseline Comparison</h4>
                             <div class="flex items-end gap-3 h-24">
                                <div class="flex-1 bg-white/5 rounded-t-lg relative group">
                                    <div class="absolute bottom-0 inset-x-0 bg-text-secondary/20 h-[50%]"></div>
                                    <span class="absolute -top-6 inset-x-0 text-center text-[9px] font-bold">50.0</span>
                                    <span class="absolute -bottom-6 inset-x-0 text-center text-[9px] font-bold text-text-secondary uppercase">Baseline</span>
                                </div>
                                <div class="flex-1 bg-primary/20 rounded-t-lg relative group">
                                    <div class="absolute bottom-0 inset-x-0 bg-primary h-[${history[0]?.prosthetic_health_score || 0}%]"></div>
                                    <span class="absolute -top-6 inset-x-0 text-center text-[9px] font-black text-primary">${history[0]?.prosthetic_health_score || 0}</span>
                                    <span class="absolute -bottom-6 inset-x-0 text-center text-[9px] font-bold text-text-secondary uppercase">Current</span>
                                </div>
                             </div>
                        </div>
                        <div class="glass-card p-6 rounded-2xl">
                             <h4 class="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-4">Clinical Alerts</h4>
                             <div class="space-y-2">
                                ${history.filter(h => h.skin_risk === 'High' || h.gait_abnormality === 'Abnormal').slice(0, 3).map(h => `
                                    <div class="flex items-center gap-2 p-2 bg-accent-red/5 rounded-lg border border-accent-red/20 text-[10px] text-accent-red font-bold">
                                        <span class="material-symbols-outlined text-[14px]">warning</span>
                                        ${h.date}: ${h.skin_risk === 'High' ? 'Skin Irritation' : 'Gait Asymmetry'} Detected
                                    </div>
                                `).join('') || '<p class="text-[10px] font-bold text-accent-green uppercase tracking-widest text-center py-4">No critical alerts detected</p>'}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        renderPatientTrend(history);

    } catch (e) {
        console.error(e);
        content.innerHTML = '<p class="text-center text-accent-red py-20 font-bold uppercase tracking-widest">Failed to load clinical profile</p>';
    }
}

window.closePatientDetail = function () {
    document.getElementById('patient-detail-overlay').classList.add('hidden');
};

function renderPatientTrend(history) {
    const ctx = document.getElementById('patient-trend-chart').getContext('2d');
    const data = history.slice().reverse();

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(h => h.date.split('-').slice(1).join('/')),
            datasets: [{
                label: 'Health Score',
                data: data.map(h => h.prosthetic_health_score),
                borderColor: COLORS.primary,
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { min: 0, max: 100, ticks: { color: COLORS.slate, font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { ticks: { color: COLORS.slate, font: { size: 9 } }, grid: { display: false } }
            }
        }
    });
}

// ---- MODULE: FEEDBACK ----
async function loadFeedback() {
    try {
        allFeedback = await apiRequest('/admin/feedback');
        renderFeedbackTable(allFeedback);
    } catch (e) {
        console.error(e);
    }
}

function renderFeedbackTable(items) {
    const tbody = document.getElementById('feedback-table-body');
    tbody.innerHTML = '';

    items.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-white/5 transition-all text-center';

        row.innerHTML = `
            <td class="px-6 py-4">
                <p class="text-xs font-bold text-text-primary whitespace-nowrap">${item.patient_name}</p>
            </td>
            <td class="px-6 py-4">
                <span class="px-2 py-0.5 rounded-lg border border-white/5 text-[9px] font-black uppercase tracking-tighter ${item.issue_type === 'Bug' ? 'text-accent-red' : 'text-accent-blue'}">${item.issue_type}</span>
            </td>
            <td class="px-6 py-4 min-w-[200px]">
                <p class="text-[11px] text-text-secondary leading-tight text-left italic">"${item.description}"</p>
                ${item.admin_response ? `<p class="mt-2 p-2 bg-accent-green/10 text-[10px] text-accent-green rounded-lg border border-accent-green/20 text-left">Resp: ${item.admin_response}</p>` : ''}
            </td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.status === 'open' ? 'bg-accent-amber/10 text-accent-amber' : 'bg-accent-green/10 text-accent-green'}">
                    ${item.status}
                </span>
            </td>
            <td class="px-6 py-4 text-[10px] text-text-secondary whitespace-nowrap">${new Date(item.created_at).toLocaleDateString()}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="respondToFeedback('${item.id}', '${item.status}')" class="px-4 py-1.5 rounded-lg border border-border-dark text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Resolve</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

window.respondToFeedback = async function (id, status) {
    const response = prompt("Enter administrative response / resolution notes:");
    if (response === null) return;

    try {
        await apiRequest(`/admin/feedback/${id}`, 'PATCH', {
            status: 'resolved',
            admin_response: response || "Resolved"
        });
        await loadFeedback();
    } catch (e) {
        alert("Failed to update feedback");
    }
};

// ---- MODULE: BROADCAST ----
function setupBroadcast() {
    const titleInput = document.getElementById('broadcast-title');
    const msgInput = document.getElementById('broadcast-message');
    const previewTitle = document.getElementById('preview-title');
    const previewMsg = document.getElementById('preview-message');

    titleInput.oninput = () => previewTitle.textContent = titleInput.value || 'Notification Title';
    msgInput.oninput = () => previewMsg.textContent = msgInput.value || 'Message content will appear here...';

    window.setCategory = (btn, cat) => {
        broadcastCategory = cat;
        document.querySelectorAll('.cat-btn').forEach(el => {
            el.classList.remove('active', 'bg-accent-blue/10', 'text-accent-blue', 'bg-accent-amber/10', 'text-accent-amber', 'bg-accent-red/10', 'text-accent-red');
            el.classList.add('text-text-secondary');
        });

        btn.classList.add('active');
        btn.classList.remove('text-text-secondary');
        const color = cat === 'system' ? 'blue' : cat === 'admin' ? 'amber' : 'red';
        btn.classList.add(`bg-accent-${color}/10`, `text-accent-${color}`);

        const previewBox = document.getElementById('preview-box');
        previewBox.classList.remove('border-l-primary', 'border-l-accent-amber', 'border-l-accent-red');
        const borderClass = cat === 'system' ? 'border-l-primary' : cat === 'admin' ? 'border-l-accent-amber' : 'border-l-accent-red';
        previewBox.classList.add(borderClass);
    };

    document.getElementById('btn-send-broadcast').onclick = async () => {
        const title = titleInput.value;
        const message = msgInput.value;
        const target = document.getElementById('broadcast-target').value;

        if (!title || !message) return alert("Please fill all fields");

        try {
            await apiRequest('/admin/notifications', 'POST', {
                target,
                title,
                message,
                category: broadcastCategory
            });
            alert("Broadcast sent successfully!");
            titleInput.value = '';
            msgInput.value = '';
            previewTitle.textContent = 'Notification Title';
            previewMsg.textContent = 'Message content will appear here...';
        } catch (e) {
            alert("Broadcast failed: " + e.message);
        }
    };
}

// ---- MODULE: SYSTEM ----
function initSystemMonitor() {
    loadSystemHealth();
    // Auto-refresh monitor
    const interval = setInterval(() => {
        if (currentModule === 'system') loadSystemHealth();
        else clearInterval(interval);
    }, 5000);
}

async function loadSystemHealth() {
    try {
        const data = await apiRequest('/system/health');
        renderLatencyChart(data);
        renderDBChart(data);
    } catch (e) {
        console.error(e);
    }
}

function renderLatencyChart(data) {
    const ctx = document.getElementById('latency-chart').getContext('2d');
    if (charts.latency) charts.latency.destroy();

    // For demo, we create a shifting buffer
    const labels = Array(12).fill('');
    const points = Array(12).fill(0).map(() => data.server_response_ms + (Math.random() * 20 - 10));

    charts.latency = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Latency',
                data: points,
                borderColor: COLORS.primary,
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(37, 99, 235, 0.05)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: COLORS.slate, font: { size: 9 } } },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderDBChart(data) {
    const ctx = document.getElementById('db-chart').getContext('2d');
    if (charts.db) charts.db.destroy();

    charts.db = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Success Rate (%)', 'Conn. Pool', 'Uptime (%)'],
            datasets: [{
                data: [99.9, 85, data.uptime_pct],
                backgroundColor: [COLORS.green, COLORS.primary, COLORS.amber]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: COLORS.slate, font: { size: 9 } } },
                x: { grid: { display: false }, ticks: { color: COLORS.slate, font: { size: 9 } } }
            }
        }
    });
}

// ---- HELPERS ----
function setupLogout() {
    document.getElementById('btn-logout').addEventListener('click', () => {
        if (confirm("Disconnect Admin secure terminal?")) {
            localStorage.clear();
            window.location.href = 'index.html';
        }
    });
}

init();
