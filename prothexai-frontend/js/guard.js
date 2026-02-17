// 5️⃣ ROUTE GUARD (guard.js)
// This script checks if the user is authenticated. 
// Include this in the <head> of PROTECTED pages (Dashboard, Profile, History, Admin).

(function () {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // Redirect to auth if no token
    if (!token) {
        window.location.href = "auth.html";
        return;
    }

    // Admin page protection
    if (window.location.pathname.endsWith("admin.html")) {
        if (role !== "admin") {
            window.location.href = "dashboard.html";
        }
    }
})();
