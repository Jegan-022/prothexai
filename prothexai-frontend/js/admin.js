import { apiRequest } from './api.js';

// Logout
document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});

async function loadStats() {
    try {
        const stats = await apiRequest('/admin/dashboard');
        document.getElementById('stat-patients').textContent = stats.total_patients;
        document.getElementById('stat-feedback').textContent = stats.total_feedback;
        document.getElementById('stat-open').textContent = stats.open_issues;
        document.getElementById('stat-resolved').textContent = stats.resolved_issues;
    } catch (error) {
        console.error("Stats error", error);
    }
}

async function loadFeedback() {
    const list = document.getElementById('feedback-list');
    list.innerHTML = '';

    try {
        const feedback = await apiRequest('/admin/feedback');

        feedback.forEach(item => {
            const div = document.createElement('div');
            div.className = 'feedback-item';

            const isResolved = item.status === 'resolved';
            const statusClass = isResolved ? 'status-resolved' : 'status-open';
            const btnText = isResolved ? 'Re-open' : 'Mark Resolved';

            div.innerHTML = `
                <div class="feedback-content">
                    <h4>${item.issue_type} <span class="text-muted" style="font-size:0.75rem; font-weight:400;">by ${item.patient_name}</span></h4>
                    <p>${item.description}</p>
                    <small class="text-muted">${new Date(item.created_at).toLocaleDateString()}</small>
                </div>
                <div>
                   <button class="status-toggle ${statusClass}" data-id="${item.id}" data-status="${item.status}">
                     ${item.status.toUpperCase()}
                   </button>
                </div>
            `;
            list.appendChild(div);
        });

        // Event Delegation for toggles
        list.querySelectorAll('.status-toggle').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                const currentStatus = e.target.dataset.status;
                const newStatus = currentStatus === 'open' ? 'resolved' : 'open';

                await apiRequest(`/admin/feedback/${id}`, 'PATCH', {
                    status: newStatus,
                    admin_response: "Status updated by admin"
                });

                loadFeedback(); // Reload
                loadStats();
            });
        });

    } catch (error) {
        console.error("Feedback error", error);
    }
}

// Init
loadStats();
loadFeedback();
