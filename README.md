# Prosthetic Gait Analysis Backend (FastAPI)

## 🚀 Overview
Secure, scalable backend system for collecting prosthetic gait data, performing medical-grade analysis, and generating reports.

## 🛠 Tech Stack
- **Backend:** FastAPI (Asynchronous)
- **Database:** MongoDB Atlas (Motor driver)
- **Auth:** JWT + bcrypt
- **Scheduler:** APScheduler (Weekly reports)
- **PDF Generation:** ReportLab
- **AI/ML:** Isolation Forest (Anomaly Detection), Weighted Composite Scoring

## 📂 Structure
- `app/core/`: Security and dependencies
- `app/routes/`: API endpoints (Auth, Patient, Doctor, Analysis)
- `app/services/`: AI Engine and Report Service
- `app/models/`: MongoDB Pydantic models
- `app/cron/`: Weekly background jobs

## 🚦 Getting Started
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Configure `.env` with your MongoDB URI and JWT secrets.
3. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

## 🔐 Key Features
- **JWT-Based RBAC:** Separate access for Patients and Doctors.
- **Gait Analysis:** isolation forest for abnormality detection.
- **Skin Risk Scoring:** Weighted index for irritation risk.
- **Weekly Reports:** Automated PDF generation via cron.
