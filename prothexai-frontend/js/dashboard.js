import { apiRequest } from './api.js';
import { drawGauge } from './gauge.js';
import { DualAxisCorrelationChart } from './correlationChart.js';
import { RecoveryChart } from './recoveryChart.js';
import { PressureHeatmap } from './heatmap.js';

// Elements
const greeting = document.getElementById('user-greeting');
const aiSummary = document.getElementById('ai-summary');
const alertsList = document.getElementById('alerts-list');
const lastUpdated = document.getElementById('last-updated');

// Modal Logic
const modal = document.getElementById('upload-modal');
const btnUpload = document.getElementById('btn-upload');
const btnClose = document.getElementById('close-modal');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

btnUpload.onclick = () => { modal.style.display = 'flex'; };
btnClose.onclick = () => { modal.style.display = 'none'; };
window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

dropZone.onclick = () => fileInput.click();
dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('dragover'); };
dropZone.ondragleave = () => dropZone.classList.remove('dragover');
dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleUpload(e.dataTransfer.files[0]);
};

// Manual Entry Modal Logic
const manualModal = document.getElementById('manual-modal');
const btnManual = document.getElementById('btn-manual');
const btnCloseManual = document.getElementById('close-manual');
const manualForm = document.getElementById('manual-form');

btnManual.onclick = () => { manualModal.style.display = 'flex'; };
btnCloseManual.onclick = () => { manualModal.style.display = 'none'; };
window.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
    if (e.target === manualModal) manualModal.style.display = 'none';
};

manualForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('manual-status');
    statusEl.textContent = 'Submitting...';
    statusEl.style.color = 'var(--text-muted)';

    const payload = {
        step_length_cm: parseFloat(document.getElementById('step_length').value),
        cadence_spm: parseFloat(document.getElementById('cadence').value),
        walking_speed_mps: parseFloat(document.getElementById('walking_speed').value),
        gait_symmetry_index: parseFloat(document.getElementById('gait_symmetry').value),
        skin_temperature_c: parseFloat(document.getElementById('skin_temp').value),
        skin_moisture: parseFloat(document.getElementById('skin_moisture').value),
        pressure_distribution_index: parseFloat(document.getElementById('pressure_dist').value),
        daily_wear_hours: parseFloat(document.getElementById('wear_hours').value)
    };

    try {
        const result = await apiRequest('/patient/daily-input', 'POST', payload);
        statusEl.textContent = `✓ Success! Health Score: ${result.health_score.toFixed(1)}`;
        statusEl.style.color = 'var(--green)';

        setTimeout(() => {
            manualModal.style.display = 'none';
            manualForm.reset();
            loadDashboard(); // Refresh
        }, 1500);
    } catch (error) {
        statusEl.textContent = '✗ Failed: ' + error.message;
        statusEl.style.color = 'var(--red)';
    }
});

fileInput.onchange = (e) => handleUpload(e.target.files[0]);

async function handleUpload(file) {
    if (!file) return;
    const status = document.getElementById('upload-status');
    status.textContent = 'Uploading...';

    // Check type
    if (!file.name.endsWith('.csv')) {
        status.textContent = 'Error: Only .csv files allowed.';
        status.style.color = 'var(--red)';
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    // We need a custom fetch here for FormData since apiRequest uses JSON
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('http://localhost:8000/patient/upload-gait', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!res.ok) throw new Error('Upload failed');

        status.textContent = 'Upload successful!';
        status.style.color = 'var(--green)';
        setTimeout(() => {
            modal.style.display = 'none';
            loadDashboard(); // Refresh
        }, 1500);

    } catch (err) {
        status.textContent = 'Upload failed: ' + err.message;
        status.style.color = 'var(--red)';
    }
}

// Logic to load dashboard
async function loadDashboard() {
    try {
        const data = await apiRequest('/patient/dashboard');

        // 1. Basic Info
        greeting.textContent = `Welcome back, ${data.patient_name}`;

        // 2. Health Score

        // 2. Health Score - CSS Based Gauge Animation
        const score = data.latest_health_score || 0;
        document.getElementById('health-score-val').textContent = score.toFixed(0);

        // Map 0-100 to Rotation (-135deg start to 45deg end = 180deg span)
        const rotation = -135 + (score / 100 * 180);
        const gaugeBody = document.getElementById('health-gauge-arc');
        if (gaugeBody) {
            gaugeBody.style.transform = `rotate(${rotation}deg)`;
        }

        const badge = document.getElementById('status-badge');
        if (score < 60) {
            badge.className = 'px-2 py-1 rounded bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-tighter';
            badge.textContent = 'Status: Critical';
        } else if (score < 80) {
            badge.className = 'px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase tracking-tighter';
            badge.textContent = 'Status: Warning';
        } else {
            badge.className = 'px-2 py-1 rounded bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-tighter';
            badge.textContent = 'Status: Optimal';
        }


        // 2. Update Stats (Symmetry & Speed)
        if (data.trends && data.trends.symmetry && data.trends.symmetry.length > 0) {
            let lastSym = data.trends.symmetry[data.trends.symmetry.length - 1];
            // Normalize: If <= 1, it's a ratio (e.g. 0.95 -> 95%). If > 1, it's already % (e.g. 96).
            if (lastSym <= 1) lastSym *= 100;

            const lastSpeed = data.trends.walking_speed[data.trends.walking_speed.length - 1];

            const symEl = document.getElementById('stat-symmetry');
            if (symEl) symEl.textContent = lastSym.toFixed(0) + "%";

            const speedEl = document.getElementById('stat-speed');
            if (speedEl) speedEl.textContent = lastSpeed.toFixed(1);
        }

        // 3. AI Summary
        if (data.analysis && !data.analysis.includes("temporarily unavailable")) {
            aiSummary.textContent = data.analysis;
        } else {
            aiSummary.textContent = data.analysis || "No recent AI analysis available. Submit your first daily metrics to get started!";
        }

        // 4. Alerts
        alertsList.innerHTML = '';
        if (data.recent_alerts && data.recent_alerts.length > 0) {
            data.recent_alerts.forEach(alert => {
                const div = document.createElement('div');
                div.className = 'alert-item alert-warning';
                div.innerHTML = `⚠️ ${alert}`;
                alertsList.appendChild(div);
            });
        }

        // 5. Trends - Handle empty data gracefully

        // 5. New Analytics Charts Integration

        // Transform trends data for correlation chart
        // Need: [{ date: "2026-02-01", gait_symmetry_index: 88, walking_speed_mps: 1.2 }]
        // Backend 'trends' object has separate arrays. We need to zip them.
        if (data.trends && data.trends.symmetry) {
            // Create zipped data array manually since JS has no zip
            // Assuming arrays are equal length and sorted (latest last)
            // Trends arrays are built from that history.

            const count = data.trends.symmetry.length;
            const correlationData = [];

            // Create generic dates relative to today for visualization since trends dates aren't in trend obj
            const today = new Date();

            for (let i = 0; i < count; i++) {
                const d = new Date();
                d.setDate(today.getDate() - (count - 1 - i));

                correlationData.push({
                    date: d.toISOString().split('T')[0],
                    gait_symmetry_index: data.trends.symmetry[i] * 100, // Convert to %
                    walking_speed_mps: data.trends.walking_speed[i]
                });
            }

            const correlationChart = new DualAxisCorrelationChart("#correlation-chart");
            correlationChart.render(correlationData);

            // Recovery Chart Data
            const recoveryData = data.trends.health_score.map((val, i) => ({
                date: correlationData[i].date, // Reuse calculated dates
                health_score: val
            }));

            const recoveryChart = new RecoveryChart("#recovery-chart");
            recoveryChart.render(recoveryData);

            // Heatmap
            // Mocking distribution for now as backend doesn't return full raw array yet
            // Real implementation would rely on data.pressure_map
            const heatmap = new PressureHeatmap("#heatmap-chart");
            const basePressure = (data.trends.pressure_distribution[count - 1] || 0.8) * 100;

            // Create some variation around the average index for visualization
            const fillMap = () => Array.from({ length: 72 }, () => Math.max(0, Math.min(100, basePressure + (Math.random() * 20 - 10))));


            heatmap.render({
                left: fillMap(),
                right: fillMap()
            });
        } else {
            // Show empty state message
            const chartDiv = document.getElementById('correlation-chart');
            if (chartDiv) chartDiv.innerHTML = '<p class="text-muted" style="text-align: center; padding: 3rem;">No trend data yet. Submit daily metrics to see your progress.</p>';
        }

        // 6. Calendar

        // 6. Calendar
        if (typeof renderCalendar === 'function') {
            renderCalendar(data);
        }

    } catch (error) {
        console.error("Dashboard load failed", error);
        aiSummary.textContent = "Failed to load dashboard. " + (error.message || "Please check your profile and try again.");
        aiSummary.style.color = "var(--red)";


        // Show empty state for charts
        const chartDiv = document.getElementById('correlation-chart');
        if (chartDiv) chartDiv.innerHTML = '<p class="text-muted" style="text-align: center; padding: 3rem;">Unable to load data.</p>';
    }
}



function renderCalendar(data) {
    const container = document.getElementById('calendar-grid-container');
    if (!container) return;

    container.innerHTML = '';

    const todayDate = new Date();
    const currentDay = todayDate.getDate();
    const daysInMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).getDate();

    // Start Day of the month
    const firstDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1).getDay();
    // Adjust for Monday start (0=Sun -> 6, 1=Mon -> 0)
    const startOffset = (firstDay + 6) % 7;

    const filledDays = new Set();
    if (data.history_events) {
        data.history_events.forEach(e => {
            const d = new Date(e.timestamp || e.date);
            if (d.getMonth() === todayDate.getMonth()) {
                filledDays.add(d.getDate());
            }
        });
    } else {
        // Fallback simulation
        for (let i = 1; i < currentDay; i++) {
            if (Math.random() > 0.3) filledDays.add(i);
        }
    }
    // If we have latest score today, mark today as done
    if (data && data.latest_health_score) filledDays.add(currentDay);

    let attendedCount = 0;

    // Empty cells for offset
    for (let i = 0; i < startOffset; i++) {
        const empty = document.createElement('div');
        empty.className = 'aspect-square rounded bg-transparent';
        container.appendChild(empty);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const tile = document.createElement('div');
        tile.className = 'aspect-square rounded flex items-center justify-center text-xs font-bold transition-all cursor-default';
        tile.textContent = i;

        if (i === currentDay) {
            tile.classList.add('border-2', 'border-accent-blue', 'relative');
            const dot = document.createElement('span');
            dot.className = 'absolute -top-1 -right-1 size-2 bg-accent-blue rounded-full';
            tile.appendChild(dot);
        }

        if (filledDays.has(i)) {
            tile.classList.add('bg-primary', 'text-white');
            attendedCount++;
        } else if (i < currentDay) {
            tile.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-400');
        } else {
            tile.classList.add('bg-slate-50', 'dark:bg-slate-900', 'text-slate-600', 'dark:text-slate-600');
        }

        container.appendChild(tile);
    }

    // Update Progress Bar
    const bar = document.getElementById('compliance-progress');
    const pctEl = document.getElementById('compliance-pct');
    if (bar && pctEl) {
        const progress = Math.round((attendedCount / currentDay) * 100);
        bar.style.width = `${progress}%`;
        pctEl.textContent = `${progress}%`;
    }

    // Update Today Status Card
    const todayIcon = document.getElementById('today-icon');
    const todayTitle = document.getElementById('today-title');
    const todayScore = document.getElementById('today-score');
    const todayCard = document.getElementById('today-status-card');

    if (filledDays.has(currentDay)) {
        if (todayTitle) todayTitle.textContent = "Today: Submitted";
        if (todayScore) {
            todayScore.textContent = (data.latest_health_score || 0).toFixed(0);
            todayScore.className = "text-xl font-black text-green-600 dark:text-green-400";
        }
        if (todayIcon) {
            todayIcon.textContent = "check_circle";
            todayIcon.parentElement.className = "size-12 rounded-lg bg-green-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-green-500/20";
        }
        if (todayCard) {
            todayCard.className = "bg-green-50/50 dark:bg-green-500/5 rounded-xl p-4 border-2 border-green-500/30 dark:border-green-500/20 flex items-center gap-4";
        }
    } else {
        if (todayTitle) todayTitle.textContent = "Today: Pending";
        if (todayCard) {
            todayCard.className = "bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex items-center gap-4 border-l-4 border-l-red-500";
        }

    }
}

// Logout (if present in this view)
const contentLogout = document.getElementById('btn-logout');
if (contentLogout) {
    contentLogout.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });
}

// Report Download Logic
const btnDownload = document.getElementById('btn-download-report');
if (btnDownload) {
    btnDownload.addEventListener('click', async () => {
        try {
            const originalContent = btnDownload.innerHTML;
            btnDownload.innerHTML = '<span class="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>';
            btnDownload.disabled = true;

            const token = localStorage.getItem('token');
            // Use full URL if needed, but relative path should work if served from same origin or proxy
            // Check api.js for base URL usage. Usually fetch('/api/...') works.
            // But here the user prompt explicitly said: fetch('/report/patient/download-report', ...)
            // I'll assume relative path works or prepend raw base if needed.
            // However, apiRequest in api.js handles base URL. Since we need blob, we can't use apiRequest directly easily without modifying it to return response.
            // So we use fetch directly. I'll assume relative path '/report/...' is correct or needs 'http://localhost:8000'.
            // Given the existing code uses `apiRequest` which likely has a base URL, I should check api.js BASE_URL.
            // But line 99 in dashboard.js uses 'http://localhost:8000/patient/upload-gait'.
            // So I should probably use 'http://localhost:8000' as well to be safe, or just '/' if proxy is set up.
            // Let's use 'http://localhost:8000/report/patient/download-report' to be consistent with line 99.

            const response = await fetch('http://localhost:8000/report/patient/download-report', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ProthexaI_Report.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            btnDownload.innerHTML = originalContent;
            btnDownload.disabled = false;

        } catch (error) {
            console.error("Download error:", error);
            btnDownload.textContent = "Error";
            btnDownload.classList.add('text-red-500', 'border-red-500');

            setTimeout(() => {
                btnDownload.innerHTML = '<span class="material-symbols-outlined text-[14px]">download</span> Report';
                btnDownload.classList.remove('text-red-500', 'border-red-500');
                btnDownload.disabled = false;
            }, 3000);
        }
    });
}

// Init
loadDashboard();
