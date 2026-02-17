/**
 * ProthexaI Route Guard
 * Protects clinical dashboard routes from unauthorized access.
 */
(function () {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const path = window.location.pathname;

    // 1. Authentication Check
    if (!token && !path.includes('auth.html')) {
        console.warn('Unauthorized access detected. Redirecting to clinical gateway.');
        window.location.href = 'auth.html';
        return;
    }

    // 2. Role-Based Access Control (RBAC)
    if (token) {
        // Prevent logged-in users from going back to auth page
        if (path.includes('auth.html')) {
            if (role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
            return;
        }

        // Admin-only page protection
        if (path.includes('admin.html') && role !== 'admin') {
            console.error('Access Denied: Administrative privileges required.');
            window.location.href = 'dashboard.html';
        }

        // Patient-only page protection (if applicable)
        if (path.includes('dashboard.html') && role === 'admin') {
            // Admin might want to see dashboard, but usually they have their own admin view
            // For now, allow or redirect to admin.html
            // window.location.href = 'admin.html';
        }
    }
})();
