import { apiRequest } from './api.js';

const tbody = document.getElementById('history-body');
const emptyState = document.getElementById('empty-state');

async function loadHistory() {
    try {
        const records = await apiRequest('/patient/history?days=30'); // Fetch last 30 days

        if (!records || records.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        records.forEach(record => {
            const tr = document.createElement('tr');

            // Date Format
            const date = new Date(record.created_at).toLocaleDateString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric'
            });

            // Status Badge Logic
            let statusClass = 'text-green';
            let statusText = 'Normal';
            if (record.gait_abnormality === 'Abnormal') {
                statusClass = 'text-red';
                statusText = 'Abnormal';
            }

            // Skin Risk Logic
            let skinClass = 'text-green';
            if (record.skin_risk === 'High') skinClass = 'text-red';
            else if (record.skin_risk === 'Medium') skinClass = 'text-muted'; // Yellowish/Muted

            tr.innerHTML = `
                <td>${date}</td>
                <td style="font-weight: bold;">${record.prosthetic_health_score.toFixed(1)}</td>
                <td class="${statusClass}">${statusText}</td>
                <td class="${skinClass}">${record.skin_risk}</td>
                <td>
                    <button class="btn-text" onclick="window.open('http://localhost:8000/report/patient/download-report', '_blank')">
                        Download PDF
                    </button>
                    <!-- Note: The backend /report/patient/download-report downloads TODAY's report logic. 
                       History download might need specific ID if backend supports it. -->
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error(error);
        emptyState.textContent = 'Failed to load history.';
        emptyState.style.display = 'block';
    }
}

loadHistory();
