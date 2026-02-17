import { apiRequest } from './api.js';

const form = document.getElementById('profile-form');
const heightInput = document.getElementById('height');
const weightInput = document.getElementById('weight');
const bmiDisplay = document.getElementById('bmi-display');

function calculateBMI() {
    const h = parseFloat(heightInput.value) / 100; // cm to m
    const w = parseFloat(weightInput.value);

    if (h > 0 && w > 0) {
        const bmi = (w / (h * h)).toFixed(1);
        bmiDisplay.textContent = bmi;

        // Color feedback
        if (bmi < 18.5 || bmi > 30) {
            bmiDisplay.style.color = 'var(--red)';
        } else if (bmi >= 25) {
            bmiDisplay.style.color = '#EAB308'; // Yellow
        } else {
            bmiDisplay.style.color = 'var(--green)';
        }
    } else {
        bmiDisplay.textContent = '--';
    }
}

heightInput.addEventListener('input', calculateBMI);
weightInput.addEventListener('input', calculateBMI);

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Add loading state
    const btn = form.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const payload = {
        name: document.getElementById('name').value,
        age: parseInt(document.getElementById('age').value),
        gender: document.getElementById('gender').value,
        height_cm: parseFloat(heightInput.value),
        weight_kg: parseFloat(weightInput.value),
        // Defaults for required fields not in wizard to simplify
        email: "user@example.com", // Backend should probably use token email? 
        // Wait, the backend profile create requires email. 
        // We typically extract from token or ask user. 
        // For now, I'll decode token to get email.
        blood_pressure_systolic: 120, // Default
        blood_pressure_diastolic: 80,
        blood_sugar_mg_dl: 90,
        medical_conditions: [],
        baseline_score: 50
    };

    // Helper to get email from token
    const token = localStorage.getItem('token');
    if (token) {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        payload.email = decoded.sub;
    }

    try {
        await apiRequest('/patient/profile', 'POST', payload);
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert("Failed to save profile: " + error.message);
        btn.disabled = false;
        btn.textContent = 'Save Profile';
    }
});
