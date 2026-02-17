# IMP_PRD: Prosthetic Gait Analysis Frontend

## 1. Project Overview
**ProthexaI** is a sophisticated web application designed to empower prosthetic users and clinicians with real-time biomechanical analysis. The frontend serves as the interactive layer for visualizing complex gait data, skin health risks, and AI-driven insights. 

**Core Value Proposition**: A "Medical-grade" interface that meets high-end consumer aesthetics ("Apple Health met Sci-Fi"), providing functionality without overwhelming complexity.

## 2. Technology Stack
*   **Structure**: Semantic HTML5 (Single Page Application architecture or Multi-page with shared nav).
*   **Styling**: **TailwindCSS** (via CDN or PostCSS) to replicate the **Shadcn/UI** aesthetic (clean, minimalist, token-based design).
*   **Logic**: Vanilla JavaScript (ES6+ Modules).
*   **3D Visualization**: **Three.js** to render interactive 3D prosthetic models in the Hero section and Analysis view.
*   **Data Visualization**: **D3.js** for precise, custom biomechanical charts (Gait Symmetry, Step Length, Pressure).
*   **Animations**: **GSAP (GreenSock)** for high-performance timeline animations, staggered entry effects, and smooth page transitions.

## 3. Design Aesthetic (Shadcn-Inspired)
*   **Theme**: "Clinical Dark Mode" or "Clean Slate". 
    *   *Backgrounds*: `bg-zinc-950` (dark) or `bg-white` (light).
    *   *Surfaces*: `bg-zinc-900/50` with `backdrop-blur`.
    *   *Borders*: Subtle `border-zinc-800`.
    *   *Accents*: Primary brand color `#0EA5E9` (Sky Blue) or `#10B981` (Emerald) for health.
*   **Typography**: **Inter** or **Geist Sans**. Crisp, legible, variable weight.
*   **Motion**: 
    *   Elements should "slide up and fade in" upon load.
    *   Hover states should be instantaneous but smooth (scale 1.02, subtle glow).
    *   Charts should animate data entry (lines drawing themselves).

## 4. User Journeys & Pages

### A. Public Interface
#### 1. Landing Page (`index.html`)
*   **Hero Section**:
    *   **Left**: Large, bold typography ("Next-Gen Prosthetic Intelligence").
    *   **Right/Background**: **Three.js Canvas**. A wireframe/holographic prosthetic leg that rotates on scroll or follows the mouse.
    *   **CTA**: "Start Analysis" (Pulsing button).
*   **Features Grid**: 3 Cards (Glassmorphism) detailing:
    *   *Gait Analysis* (Icon: Walking figure).
    *   *Skin Health* (Icon: Shield).
    *   *AI Insights* (Icon: Brain/Sparkles).

### B. Authentication
#### 2. Login / Register (`auth.html`)
*   **Layout**: Split screen. 
    *   Left: Form (Email/Password).
    *   Right: Abstract data visualization or 3D visual.
*   **Logic**: JWT stored in `localStorage`. Redirects to Dashboard.

### C. Patient Experience
#### 3. Onboarding / Profile (`profile.html`)
*   **Purpose**: First-time setup.
*   **Fields**: Height, Weight (auto-BMI calc on frontend for feedback), Age, Amputation Level.
*   **Interaction**: Step-by-step wizard format to reduce cognitive load.

#### 4. Patient Dashboard (`dashboard.html`)
*   **Top Bar**: "Welcome, [Name]". Status indicator (connected/offline).
*   **Main Grid**:
    *   **Health Score (The "Gauge" )**: A large D3.js radial gauge showing the implementation of `prosthetic_health_score`.
    *   **AI Insight**: The text summary from the backend (2-3 lines) displayed in a highlighted "Insight" card with a typewriter effect interaction.
    *   **Biomechanical Trends**: A D3.js multi-line chart showing `gait_symmetry_index` vs `walking_speed_mps` over the last 7 days.
    *   **Daily Input / Upload**:
        *   Button to trigger a modal form for Manual Data Entry.
        *   Drag-and-drop zone for CSV Gait Data upload.
*   **Alerts Section**:
    *   Red/Yellow pills for "High Skin Risk" or "Abnormal Gait".

#### 5. Reports & History (`history.html`)
*   **Table View**: List of past analysis records.
*   **Download**: Button to fetch the PDF report (`/report/patient/download-report`).

### D. Admin Experience
#### 6. Admin Panel (`admin.html`)
*   **Overview**: Total Patients, Feedback Stats.
*   **Feedback Management**: A data table showing user feedback issues. Status toggle (Open -> Resolved).

## 5. API Integration Requirements
The frontend must interact with the following endpoint implementations:

| Page | Action | Method | Endpoint |
|---|---|---|---|
| Auth | Login | POST | `/auth/login` |
| Auth | Register | POST | `/auth/register` |
| Profile | Create | POST | `/patient/profile` |
| Dashboard | Get Summary | GET | `/patient/dashboard` |
| Dashboard | Upload CSV | POST | `/patient/upload-gait` |
| Dashboard | Manual Entry| POST | `/patient/daily-input` |
| Reports | Download PDF | GET | `/report/patient/download-report` |

## 6. Implementation Plan
1.  **Skeleton**: Set up HTML structure with Tailwind CDN.
2.  **API Layer**: Create a `api.js` helper class to handle Fetch requests and Auth headers.
3.  **Auth Flow**: Build Login/Register and Token management.
4.  **Dashboard UI**: Build the static layout first.
5.  **Visualizations**: 
    *   Implement Three.js scene (Hero).
    *   Implement D3.js charts (Dashboard).
6.  **Integration**: Connect Dashboard charts to `/patient/dashboard` and `/patient/history` data.
7.  **Polish**: Add GSAP animations for "Wow" factor.
