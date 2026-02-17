import { apiRequest } from './api.js';

const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitBtn = document.querySelector('.btn-auth');
const toggleLink = document.getElementById('toggle-auth');
const errorMsg = document.getElementById('error-message');

let isLogin = true;

toggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;

    // Update UI
    document.querySelector('.auth-header p').textContent = isLogin ? 'Sign in to your account' : 'Create a new account';
    submitBtn.textContent = isLogin ? 'Sign In' : 'Create Account';
    toggleLink.textContent = isLogin ? 'Register' : 'Sign In';
    document.querySelector('.auth-footer p').firstChild.textContent = isLogin ? "Don't have an account? " : "Already have an account? ";
    errorMsg.textContent = '';
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';

    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        if (isLogin) {
            // LOGIN FLOW
            const data = await apiRequest('/auth/login', 'POST', { email, password });
            if (data) {
                localStorage.setItem('token', data.access_token);
                // Decode JWT to get role (simple implementation)
                const payload = JSON.parse(atob(data.access_token.split('.')[1]));
                localStorage.setItem('role', payload.role);

                // Smart Redirect
                if (payload.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    // Check if profile exists? Backend doesn't return this in login response based on PRD
                    // We will try to fetch profile, if 404, go to profile page
                    // But simpler: go to dashboard, dashboard guard/logic handles 404 or missing profile?
                    // PRD says: "Patient & profile incomplete → profile.html"
                    // We need to check profile existance. 

                    try {
                        // Quick check
                        await apiRequest('/patient/dashboard');
                        window.location.href = 'dashboard.html';
                    } catch (err) {
                        // If dashboard fails (likely 404 profile), go to profile
                        window.location.href = 'profile.html';
                    }
                }
            }
        } else {
            // REGISTER FLOW
            const data = await apiRequest('/auth/register', 'POST', {
                email,
                password,
                role: 'patient' // Default
            });

            // Auto login after register
            const loginData = await apiRequest('/auth/login', 'POST', { email, password });
            localStorage.setItem('token', loginData.access_token);
            const payload = JSON.parse(atob(loginData.access_token.split('.')[1]));
            localStorage.setItem('role', payload.role);

            window.location.href = 'profile.html';
        }
    } catch (error) {
        errorMsg.textContent = error.message || 'Authentication failed';
    } finally {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
    }
});
