# Product Requirements Document (PRD)
## Prosthetic Biomechanical Analysis System (ProthexaI)

---

## 📋 Document Information

| Field | Value |
|-------|-------|
| **Product Name** | ProthexaI - Prosthetic Biomechanical Analysis System |
| **Version** | 1.0.0 |
| **Document Date** | February 17, 2026 |
| **Status** | Active Development |
| **Owner** | Backend Engineering Team |

---

## 🎯 Executive Summary

**ProthexaI** is a medical-grade backend system designed to collect, analyze, and interpret biomechanical data from prosthetic limb users. The system provides real-time gait analysis, skin health monitoring, and AI-powered clinical insights to improve patient outcomes and enable proactive intervention by healthcare providers.

### Vision
To become the industry-standard platform for prosthetic health monitoring, enabling data-driven clinical decisions and improving quality of life for prosthetic users.

### Mission
Deliver a secure, scalable, and intelligent backend infrastructure that transforms raw sensor data into actionable medical insights through advanced analytics and AI interpretation.

---

## 🔍 Problem Statement

### Current Challenges
1. **Reactive Care Model**: Prosthetic users typically seek medical attention only after complications arise (skin irritation, gait abnormalities, socket misalignment)
2. **Limited Monitoring**: No continuous, objective tracking of prosthetic performance between clinical visits
3. **Data Fragmentation**: Biomechanical data, when collected, is often siloed and not integrated with patient health profiles
4. **Manual Analysis**: Healthcare providers lack automated tools to identify trends and risk factors from gait data
5. **Delayed Intervention**: Without real-time alerts, minor issues escalate into serious complications

### Impact
- Increased risk of skin breakdown and ulcers
- Suboptimal gait patterns leading to secondary musculoskeletal issues
- Higher healthcare costs due to preventable complications
- Reduced patient satisfaction and quality of life

---

## 👥 Target Users

### Primary Users

#### 1. **Prosthetic Users (Patients)**
- **Demographics**: Adults (18-80+) with lower limb prosthetics
- **Technical Proficiency**: Low to Medium
- **Goals**:
  - Monitor daily prosthetic health
  - Receive early warnings about potential issues
  - Track progress over time
  - Access personalized recommendations
- **Pain Points**:
  - Uncertainty about prosthetic fit and function
  - Fear of complications
  - Limited communication with healthcare providers between visits

#### 2. **Prosthetists & Physicians (Doctors)**
- **Demographics**: Licensed healthcare professionals specializing in prosthetics/orthopedics
- **Technical Proficiency**: Medium to High
- **Goals**:
  - Monitor multiple patients efficiently
  - Identify high-risk patients requiring intervention
  - Access comprehensive patient history and trends
  - Generate clinical reports for insurance/documentation
- **Pain Points**:
  - Time-consuming manual data review
  - Difficulty identifying subtle trends
  - Limited objective data between appointments

### Secondary Users

#### 3. **System Administrators**
- **Role**: Manage user accounts, system configuration, data integrity
- **Technical Proficiency**: High
- **Goals**: Ensure system uptime, security, and compliance

---

## 🎨 Product Overview

### What We Do

ProthexaI is a **FastAPI-based backend system** that:

1. **Collects Biomechanical Data**
   - Accepts daily gait metrics from wearable sensors or manual input
   - Stores time-series data in MongoDB Atlas
   - Supports bulk CSV uploads for historical data

2. **Performs Medical-Grade Analysis**
   - **Gait Abnormality Detection**: Rule-based algorithms identify deviations in step length, cadence, walking speed, symmetry, and pressure distribution
   - **Skin Risk Assessment**: Evaluates temperature, moisture, and wear duration to predict irritation risk
   - **Prosthetic Health Scoring**: Composite score (0-100) integrating biomechanical and systemic health factors

3. **Generates AI-Powered Clinical Insights**
   - Integrates with **Google Gemini API** for natural language medical interpretation
   - Contextualizes metrics with patient clinical profile (BMI, blood pressure, blood sugar)
   - Provides biomechanical assessment, systemic health influence, socket load interpretation, and clinical recommendations

4. **Delivers Actionable Reports**
   - **Weekly Automated Reports**: PDF summaries generated via APScheduler
   - **Real-Time Dashboard**: Patient and doctor views with trend visualization
   - **Alert System**: Flags high-risk conditions (load imbalance, abnormal gait, high skin risk)

5. **Ensures Security & Compliance**
   - **JWT-based authentication** with role-based access control (RBAC)
   - **Argon2 password hashing** for enhanced security
   - **HIPAA-ready architecture** with encrypted data transmission

---

## 🏗️ System Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend Framework** | FastAPI | Asynchronous REST API |
| **Database** | MongoDB Atlas | NoSQL document storage for flexible schema |
| **Database Driver** | Motor | Async MongoDB driver |
| **Authentication** | JWT + python-jose | Stateless token-based auth |
| **Password Hashing** | Argon2 + Bcrypt | Secure credential storage |
| **Scheduler** | APScheduler | Weekly report generation |
| **PDF Generation** | ReportLab | Clinical report PDFs |
| **AI/ML** | Scikit-learn (Isolation Forest) | Anomaly detection (future use) |
| **AI Interpretation** | Google Gemini API | Natural language medical analysis |
| **Data Processing** | Pandas, NumPy | Metric aggregation and computation |
| **Validation** | Pydantic | Request/response schema validation |

### High-Level Architecture

```
┌─────────────────┐
│  Client Apps    │ (Future: Mobile/Web Frontend)
│  (API Consumers)│
└────────┬────────┘
         │ HTTPS/JWT
         ▼
┌─────────────────────────────────────────────────┐
│           FastAPI Backend (ProthexaI)           │
├─────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │   Auth   │  │ Patient  │  │  Doctor  │     │
│  │  Routes  │  │  Routes  │  │  Routes  │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Analysis │  │  Report  │  │   Cron   │     │
│  │  Routes  │  │  Routes  │  │   Jobs   │     │
│  └──────────┘  └──────────┘  └──────────┘     │
├─────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐  │
│  │         Services Layer                   │  │
│  │  • AI Engine (Rule-based Analysis)       │  │
│  │  • Analysis Engine (Gemini Integration)  │  │
│  │  • Triage Service (Clinical Intelligence)│  │
│  │  • PDF Service (Report Generation)       │  │
│  │  • Gemini Service (AI Interpretation)    │  │
│  └──────────────────────────────────────────┘  │
├─────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐  │
│  │         Core Layer                       │  │
│  │  • Security (JWT, Password Hashing)      │  │
│  │  • Dependencies (Auth Middleware)        │  │
│  │  • Config (Environment Variables)        │  │
│  └──────────────────────────────────────────┘  │
└────────┬────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│           MongoDB Atlas (Cloud)                 │
├─────────────────────────────────────────────────┤
│  Collections:                                   │
│  • users                                        │
│  • patient_profiles                             │
│  • daily_metrics                                │
│  • sensor_uploads                               │
│  • analysis_results                             │
│  • weekly_reports                               │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│        External Services                        │
├─────────────────────────────────────────────────┤
│  • Google Gemini API (AI Analysis)              │
└─────────────────────────────────────────────────┘
```

---

## 📊 Data Models

### Collections

#### 1. **users**
Stores authentication credentials and role information.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `email` | EmailStr | Unique user email |
| `hashed_password` | str | Argon2/Bcrypt hash |
| `role` | UserRole | Enum: `patient`, `doctor`, `admin` |
| `is_active` | bool | Account status |
| `created_at` | datetime | Registration timestamp |

#### 2. **patient_profiles**
Clinical and demographic information for patients.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `user_id` | ObjectId | Foreign key to `users._id` |
| `doctor_id` | ObjectId | Assigned doctor (optional) |
| `name` | str | Patient name |
| `email` | str | Contact email |
| `age` | int | Patient age |
| `gender` | str | Gender |
| `height_cm` | float | Height in centimeters |
| `weight_kg` | float | Weight in kilograms |
| `bmi` | float | Body Mass Index |
| `blood_pressure_systolic` | int | Systolic BP (mmHg) |
| `blood_pressure_diastolic` | int | Diastolic BP (mmHg) |
| `blood_sugar_mg_dl` | int | Fasting blood sugar (mg/dL) |
| `medical_conditions` | List[str] | Comorbidities |
| `baseline_score` | float | Initial health score |
| `created_at` | datetime | Profile creation timestamp |

#### 3. **daily_metrics**
Daily biomechanical measurements and computed outputs.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `patient_id` | ObjectId | Foreign key to `patient_profiles._id` |
| `date` | str | Date of measurement (YYYY-MM-DD) |
| `step_length_cm` | float | Average step length (cm) |
| `cadence_spm` | float | Steps per minute |
| `walking_speed_mps` | float | Walking speed (m/s) |
| `gait_symmetry_index` | float | Symmetry ratio (0-1) |
| `skin_temperature_c` | float | Skin temperature (°C) |
| `skin_moisture` | float | Moisture percentage (%) |
| `pressure_distribution_index` | float | Load balance (0-1) |
| `daily_wear_hours` | float | Prosthetic wear duration (hours) |
| `gait_abnormality` | str | Classification: `Normal` / `Abnormal` |
| `skin_risk` | str | Risk level: `Low` / `Medium` / `High` |
| `prosthetic_health_score` | float | Composite score (0-100) |
| `created_at` | datetime | Record timestamp |

#### 4. **sensor_uploads**
Raw time-series data from wearable sensors (future use).

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `patient_id` | ObjectId | Foreign key to `patient_profiles._id` |
| `sensor_data` | List[Dict] | Array of timestamped sensor readings |
| `created_at` | datetime | Upload timestamp |

#### 5. **analysis_results**
Stored analysis outputs for historical tracking.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `record_id` | ObjectId | Foreign key to `daily_metrics._id` |
| `patient_id` | ObjectId | Foreign key to `patient_profiles._id` |
| `gait_abnormality` | str | Gait classification |
| `skin_risk` | str | Skin risk level |
| `prosthetic_health_score` | float | Health score (0-100) |
| `overall_clinical_risk` | str | Composite risk: `Low` / `Moderate` / `High` |
| `recommendations` | List[str] | Clinical recommendations |
| `created_at` | datetime | Analysis timestamp |

#### 6. **weekly_reports**
Metadata for generated PDF reports.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `patient_id` | ObjectId | Foreign key to `patient_profiles._id` |
| `start_date` | datetime | Report period start |
| `end_date` | datetime | Report period end |
| `avg_symmetry` | float | Weekly average gait symmetry |
| `avg_prosthetic_health_score` | float | Weekly average health score |
| `health_score_delta` | float | Week-over-week change for triage tracking (default: 0.0) |
| `abnormal_count` | int | Number of abnormal gait days |
| `high_skin_risk_count` | int | Number of high skin risk days |
| `pdf_path` | str | File path to generated PDF |
| `created_at` | datetime | Report generation timestamp |

---

## ⚙️ Core Features

### 1. Authentication & Authorization

#### User Registration
- **Endpoint**: `POST /auth/register`
- **Input**: Email, password (min 8 chars), role (`patient` / `doctor` / `admin`)
- **Process**:
  1. Validate email uniqueness
  2. Hash password with Argon2
  3. Create user record in `users` collection
- **Output**: User ID, email, role, creation timestamp

#### User Login
- **Endpoint**: `POST /auth/login`
- **Input**: Email, password
- **Process**:
  1. Verify email exists
  2. Validate password against hash (supports Argon2 and Bcrypt for backward compatibility)
  3. Generate JWT token with 60-minute expiration
- **Output**: Access token, token type

#### Role-Based Access Control (RBAC)
- **Middleware**: `check_role(required_role)`
- **Enforcement**: All protected endpoints verify JWT and role before execution
- **Roles**:
  - `patient`: Access own data, upload metrics, view dashboard
  - `doctor`: Access assigned patients, view all patient data, generate reports
  - `admin`: System-wide access (future use)

---

### 2. Patient Profile Management

#### Create Patient Profile
- **Endpoint**: `POST /patient/profile`
- **Authorization**: Patient role
- **Input**: Name, email, age, gender, height, weight, blood pressure, blood sugar, medical conditions
- **Process**:
  1. Check for existing profile (prevents duplicates)
  2. Calculate BMI from height/weight
  3. Link profile to authenticated user via `user_id`
  4. Store in `patient_profiles` collection
- **Output**: Profile ID, confirmation message

#### Retrieve Patient Profile
- **Endpoint**: `GET /patient/profile` (patient), `GET /doctor/patient/{id}` (doctor)
- **Authorization**: Patient (own profile) or Doctor (assigned patients)
- **Output**: Full patient profile with clinical data

---

### 3. Daily Metric Input

#### Manual Data Entry
- **Endpoint**: `POST /patient/daily`
- **Authorization**: Patient role
- **Input**:
  - `step_length_cm`: Average step length
  - `cadence_spm`: Steps per minute
  - `walking_speed_mps`: Walking speed
  - `gait_symmetry_index`: Symmetry ratio (0-1)
  - `skin_temperature_c`: Skin temperature
  - `skin_moisture`: Moisture percentage
  - `pressure_distribution_index`: Load balance (0-1)
  - `daily_wear_hours`: Wear duration (default: 8)
- **Process**:
  1. Validate input ranges (Pydantic schema)
  2. Fetch patient profile for systemic health data
  3. **Run AI Engine Analysis**:
     - **Gait Abnormality**: Classify as `Normal` or `Abnormal` based on thresholds
     - **Skin Risk**: Classify as `Low`, `Medium`, or `High`
     - **Prosthetic Health Score**: Calculate composite score (0-100)
  4. Store record in `daily_metrics` collection
  5. Store analysis in `analysis_results` collection
- **Output**: Record ID, gait abnormality, skin risk, health score, recommendations

#### Bulk CSV Upload
- **Endpoint**: `POST /patient/upload-gait`
- **Authorization**: Patient role
- **Input**: CSV file with columns matching daily metrics
- **Process**:
  1. Parse CSV and validate format
  2. Process each row as individual daily record
  3. Run AI analysis for each entry
  4. Batch insert into `daily_metrics`
- **Output**: Upload confirmation, number of records processed

---

### 4. AI-Powered Analysis

#### Rule-Based Analysis Engine (`ai_engine.py`)

##### Gait Abnormality Detection
**Logic**: Classify as `Abnormal` if ANY of the following conditions are met:
- Gait symmetry index < 0.75
- Walking speed < 0.7 m/s
- Step length < 30 cm
- Cadence < 70 spm
- Pressure distribution index < 0.6

**Output**: `Normal` or `Abnormal`

##### Skin Risk Assessment
**Logic**: Calculate risk score based on:
- +1 if skin temperature > 34°C
- +1 if skin moisture > 70%
- +1 if daily wear hours > 12

**Classification**:
- 0-1 points → `Low`
- 2 points → `Medium`
- 3 points → `High`

**Output**: `Low`, `Medium`, or `High`

##### Prosthetic Health Score
**Formula**:
```
score = 100
  - ((1 - gait_symmetry) × 40)
  - (max(0, 0.8 - pressure_distribution) × 30)
  - (max(0, 0.7 - walking_speed) × 25)
  - (max(0, skin_moisture - 70) × 0.5)
```

**Systemic Health Penalties**:
- BMI > 30: -10 points
- Systolic BP > 140 mmHg: -10 points
- Blood sugar > 180 mg/dL: -15 points

**Output**: Score clamped to 0-100 range

##### Overall Clinical Risk
**Logic**: Calculate risk points based on:
- Abnormal gait: +2 points
- High skin risk: +2 points
- Medium skin risk: +1 point
- Pressure distribution < 0.6: +2 points
- BMI > 30: +1 point
- Systolic BP > 140 OR blood sugar > 180: +1 point

**Classification**:
- ≥4 points → `High`
- 2-3 points → `Moderate`
- 0-1 points → `Low`

**Output**: `Low`, `Moderate`, or `High`

---

#### AI Interpretation Engine (`analysis_engine.py`)

##### Gemini API Integration
**Purpose**: Generate natural language medical interpretation of biomechanical data

**Process**:
1. Fetch patient profile and last 100 daily records (currently no date filter for debugging)
2. Calculate weekly averages for all metrics
3. Construct structured prompt with:
   - Clinical profile (gender, BMI, BP, blood sugar)
   - Weekly biomechanical averages
   - Request for: biomechanical assessment, systemic health influence, socket load interpretation, clinical recommendations
4. Call Gemini API with 15-second timeout
5. Handle errors gracefully (return fallback message on failure)
6. Combine AI text with rule-based analysis outputs

**Output**: Comprehensive health summary with:
- Averaged metrics
- Classifications (gait abnormality, skin risk, health score, overall risk)
- Clinical profile
- AI-generated analysis text
- Recent alerts (e.g., "Load Imbalance Detected" if pressure < 0.6)

---

### 5. Dashboard & Visualization

#### Patient Dashboard
- **Endpoint**: `GET /patient/dashboard`
- **Authorization**: Patient role
- **Output**:
  - Latest health score
  - Current gait abnormality status
  - Current skin risk level
  - Trend data (last 7 days):
    - Health scores
    - Gait symmetry
    - Walking speed
    - Skin temperature
    - Skin moisture
    - Pressure distribution
  - Recent alerts

#### Clinical Risk Triage System (Doctor Dashboard)
- **Endpoint**: `GET /doctor/triage`
- **Authorization**: Doctor role
- **Purpose**: Intelligent patient prioritization based on clinical urgency

**Computed Metrics (per patient)**:
1. **Health Score Tracking**
   - `latest_health_score`: Most recent prosthetic health score
   - `weekly_avg_health_score`: Average for last 7 days
   - `previous_week_avg_health_score`: Average for days 8-14
   - `health_score_delta`: Week-over-week change (current - previous)

2. **Risk Classification**
   - `overall_clinical_risk`: Composite risk level (High/Moderate/Low)

3. **Escalation Detection**
   - `escalation_flag`: Boolean indicating urgent attention needed
   - `escalation_reasons`: Array of triggered conditions:
     - Health score delta < -15
     - 3+ consecutive abnormal gait days
     - Pressure distribution < 0.5 for 2+ consecutive days
     - High skin risk for 2+ consecutive days

4. **Gait Stability Analysis**
   - `stability_index`: Standard deviation of gait symmetry (last 7 days)
   - `stability_classification`:
     - Stable (< 0.05)
     - Moderate Variability (0.05-0.12)
     - Unstable (> 0.12)

5. **Activity Metrics**
   - `abnormal_days_last_7`: Count of abnormal gait days
   - `high_skin_risk_days_last_7`: Count of high skin risk days

6. **Adherence Tracking**
   - `last_upload_date`: Timestamp of most recent data upload
   - `adherence_score`: (uploads / 7 days) × 100
   - `adherence_status`:
     - Good Compliance (≥70%)
     - Moderate Compliance (40-69%)
     - Low Compliance (<40%)

**Sorting Priority**:
1. Escalation flag (true first)
2. Overall clinical risk (High > Moderate > Low)
3. Health score delta (most negative first)

**Response Summary**:
- `total_patients`: Total assigned patients
- `escalated_patients`: Count with escalation flags
- `high_risk_patients`: Count with high clinical risk
- `low_adherence_patients`: Count with adherence < 40%

**Clinical Decision Support**:
- Enables proactive intervention before complications escalate
- Identifies deteriorating patients via health score delta
- Flags unstable gait patterns requiring socket adjustment
- Tracks patient compliance for follow-up prioritization

#### Patient History
- **Endpoint**: `GET /patient/history?days=7`
- **Authorization**: Patient role
- **Parameters**: `days` (default: 7)
- **Output**: Array of daily records with full metrics and classifications

---

### 6. Report Generation

#### Weekly Automated Reports
- **Trigger**: APScheduler cron job (every Monday at 00:00)
- **Process** (`weekly_job.py`):
  1. Fetch all active patients
  2. For each patient:
     - Query last 7 days of `daily_metrics`
     - Calculate weekly averages
     - Count abnormal gait days
     - Count high skin risk days
     - Generate PDF report via `pdf_service.py`
     - Store metadata in `weekly_reports` collection
- **Output**: PDF file saved to `reports/` directory

#### Manual Report Generation
- **Endpoint**: `POST /report/generate/{patient_id}` (doctor only)
- **Authorization**: Doctor role
- **Process**: Same as automated, but on-demand
- **Output**: Report ID, PDF path

#### Report Download
- **Endpoint**: `GET /patient/reports/{id}/download`
- **Authorization**: Patient (own reports) or Doctor (assigned patients)
- **Output**: PDF file stream

---

## 🔒 Security & Compliance

### Authentication
- **JWT Tokens**: HS256 algorithm, 60-minute expiration
- **Password Hashing**: Argon2 (primary), Bcrypt (backward compatibility)
- **Token Validation**: Middleware verifies signature and expiration on every protected request

### Authorization
- **Role-Based Access Control (RBAC)**: Enforced via `check_role()` dependency
- **Data Isolation**: Patients can only access their own data; doctors can access assigned patients

### Data Protection
- **HTTPS**: All API communication encrypted in transit (production deployment)
- **Environment Variables**: Sensitive credentials (MongoDB URI, JWT secret, Gemini API key) stored in `.env`
- **Input Validation**: Pydantic schemas enforce type safety and range constraints

### HIPAA Readiness
- **Audit Logging**: All data access logged with timestamps (future enhancement)
- **Data Encryption**: MongoDB Atlas supports encryption at rest
- **Access Controls**: Granular permissions via RBAC
- **Data Retention**: Configurable retention policies (future enhancement)

---

## 🚀 API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | None | Register new user |
| POST | `/auth/login` | None | Login and receive JWT |

### Patient
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/patient/profile` | Patient | Create patient profile |
| GET | `/patient/profile` | Patient | Get own profile |
| POST | `/patient/daily` | Patient | Submit daily metrics |
| POST | `/patient/upload-gait` | Patient | Upload CSV of metrics |
| GET | `/patient/dashboard` | Patient | Get dashboard summary |
| GET | `/patient/history?days=7` | Patient | Get historical records |
| GET | `/patient/reports` | Patient | List available reports |
| GET | `/patient/reports/{id}` | Patient | Get report metadata |
| GET | `/patient/reports/{id}/download` | Patient | Download PDF report |

### Doctor
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/doctor/triage` | Doctor | **Get clinical risk triage dashboard** (prioritized patient list) |
| GET | `/doctor/patients` | Doctor | List all patients (basic info) |
| GET | `/doctor/patient/{id}` | Doctor | Get patient profile |
| GET | `/doctor/patient/{id}/dashboard` | Doctor | Get patient dashboard |
| GET | `/doctor/patient/{id}/history?days=7` | Doctor | Get patient history |

### Analysis
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/analysis/summary/{patient_id}` | Doctor | Get AI-generated health summary |

### Report
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/report/generate/{patient_id}` | Doctor | Manually generate weekly report |

---

## 📈 Success Metrics

### Technical Metrics
- **API Response Time**: <500ms for 95th percentile
- **Uptime**: 99.5% availability
- **Error Rate**: <1% of requests
- **Database Query Performance**: <100ms for dashboard queries
- **Triage Query Performance**: <2 seconds for full patient cohort analysis

### Clinical Metrics
- **Early Detection Rate**: % of complications identified before clinical visit
- **Escalation Detection Accuracy**: % of escalations confirmed as clinically significant
- **Alert Accuracy**: Precision/recall of abnormality detection
- **Report Adoption**: % of doctors reviewing weekly reports
- **Patient Engagement**: % of patients uploading data ≥3 times/week
- **Average Response Time to High-Risk Patients**: Time from escalation flag to doctor intervention
- **Health Score Delta Monitoring**: % of patients with declining trends (delta < -10) receiving proactive care

### Triage System Metrics
- **Escalation Rate**: % of patients flagged for urgent attention
- **False Positive Rate**: % of escalations not requiring intervention
- **Adherence Improvement**: % increase in compliance after low-adherence flagging
- **Stability Index Correlation**: Correlation between unstable gait and socket adjustments

### Business Metrics
- **User Growth**: Monthly active patients and doctors
- **Data Volume**: Daily metric uploads per patient
- **Report Generation**: Weekly reports generated on time
- **Doctor Efficiency**: Average time spent per patient review (target: <5 min with triage system)

---

## 🛣️ Roadmap

### Phase 1: MVP (Current)
✅ Core authentication and RBAC  
✅ Patient profile management  
✅ Daily metric input (manual + CSV)  
✅ Rule-based AI analysis  
✅ Gemini API integration for clinical interpretation  
✅ Dashboard APIs  
✅ Weekly report generation  
✅ **Clinical Risk Triage System** (intelligent patient prioritization with escalation detection)  

### Phase 2: Enhanced Analytics (Q2 2026)
- [ ] Machine learning model training (Isolation Forest for anomaly detection)
- [ ] Real-time sensor data ingestion (WebSocket support)
- [ ] Advanced trend analysis (seasonal patterns, long-term degradation)
- [ ] Predictive modeling (forecast future health scores)

### Phase 3: Clinical Integration (Q3 2026)
- [ ] HL7/FHIR integration for EHR systems
- [ ] Telemedicine integration (video consultations)
- [ ] Prescription management (socket adjustments, therapy recommendations)
- [ ] Insurance claim support (automated documentation)

### Phase 4: Mobile & Wearables (Q4 2026)
- [ ] Mobile app (iOS/Android) for patients
- [ ] Wearable sensor SDK (integrate with commercial gait sensors)
- [ ] Offline data sync
- [ ] Push notifications for alerts

### Phase 5: Platform Expansion (2027)
- [ ] Multi-language support
- [ ] White-label solution for clinics
- [ ] Research data export (anonymized datasets for studies)
- [ ] AI model marketplace (custom analysis algorithms)

---

## 🧪 Testing Strategy

### Unit Tests
- **Coverage Target**: 80%
- **Focus Areas**: AI engine logic, authentication, data validation

### Integration Tests
- **Database Operations**: CRUD operations on all collections
- **API Endpoints**: Request/response validation
- **External Services**: Gemini API integration (mocked)

### Performance Tests
- **Load Testing**: Simulate 1000 concurrent users
- **Stress Testing**: Identify breaking points
- **Endurance Testing**: 24-hour sustained load

### Security Tests
- **Penetration Testing**: Identify vulnerabilities
- **Authentication Bypass**: Attempt unauthorized access
- **SQL Injection**: Validate input sanitization (NoSQL injection for MongoDB)

---

## 📦 Deployment

### Environment Configuration
**Required Environment Variables** (`.env`):
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=<secure-random-string>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
GEMINI_API_KEY=<google-gemini-api-key>
```

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload
```

### Production Deployment (Recommended: Render/AWS/GCP)
- **Platform**: Render, AWS ECS, Google Cloud Run
- **Database**: MongoDB Atlas (M10+ cluster for production)
- **Environment**: Set environment variables in platform dashboard
- **HTTPS**: Enable SSL/TLS certificates
- **Monitoring**: Integrate with Sentry, Datadog, or CloudWatch

---

## 🔧 Configuration

### Scheduler Configuration
- **Weekly Reports**: Runs every Monday at 00:00 UTC
- **Customization**: Modify `app/cron/weekly_job.py` and `app/main.py` (line 21)

### AI Engine Tuning
- **Thresholds**: Adjust in `app/services/ai_engine.py`
  - Gait abnormality thresholds (symmetry, speed, step, cadence, pressure)
  - Skin risk thresholds (temperature, moisture, wear hours)
  - Health score penalties (BMI, BP, blood sugar)

### Gemini API Configuration
- **Timeout**: 15 seconds (configurable in `app/services/analysis_engine.py`, line 78)
- **Prompt Engineering**: Modify prompt template in `analysis_engine.py` (lines 48-73)

---

## 📚 Dependencies

### Core Dependencies
```
fastapi                  # Web framework
uvicorn[standard]        # ASGI server
motor                    # Async MongoDB driver
pydantic[email]          # Data validation
pydantic-settings        # Environment variable management
python-dotenv            # .env file support
passlib[bcrypt,argon2]   # Password hashing
python-jose[cryptography] # JWT handling
reportlab                # PDF generation
apscheduler              # Task scheduling
pandas                   # Data processing
scikit-learn             # ML algorithms
python-multipart         # File upload support
argon2-cffi              # Argon2 hashing
google-generativeai      # Gemini API client
```

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **No Date Filtering**: `analysis_engine.py` currently fetches all records (up to 100) instead of last 7 days (commented out for debugging)
2. **Mock ML Models**: Isolation Forest and GradientBoostingClassifier are instantiated but not trained
3. **Single-Tenant Architecture**: No multi-clinic support
4. **No Real-Time Alerts**: Alerts only visible in dashboard (no push notifications)
5. **Limited Error Handling**: Gemini API failures return generic fallback message

### Planned Fixes
- Re-enable 7-day date filter after validation
- Train ML models on production data
- Implement WebSocket for real-time alerts
- Add comprehensive error logging and monitoring

---

## 🤝 Support & Maintenance

### Contact
- **Technical Support**: [Insert contact email]
- **Documentation**: [Insert docs URL]
- **Issue Tracking**: [Insert GitHub/Jira URL]

### Maintenance Windows
- **Scheduled Maintenance**: First Sunday of each month, 02:00-04:00 UTC
- **Emergency Patches**: As needed with 24-hour notice

---

## 📄 License & Compliance

### License
Proprietary software. All rights reserved.

### Compliance
- **HIPAA**: Architecture designed for HIPAA compliance (requires additional operational controls)
- **GDPR**: Data export and deletion capabilities (future enhancement)
- **FDA**: Not a medical device (decision support tool only)

---

## 📝 Changelog

### Version 1.0.0 (February 2026)
- Initial release
- Core authentication and RBAC
- Patient profile management
- Daily metric input and analysis
- AI-powered clinical interpretation (Gemini API)
- Weekly report generation
- Dashboard APIs

---

## 🎓 Glossary

| Term | Definition |
|------|------------|
| **Gait Symmetry Index** | Ratio of left/right step characteristics (0-1, where 1 is perfect symmetry) |
| **Cadence** | Steps per minute during walking |
| **Pressure Distribution Index** | Measure of load balance across prosthetic socket (0-1) |
| **Prosthetic Health Score** | Composite metric (0-100) integrating biomechanical and systemic health factors |
| **Socket** | Interface between residual limb and prosthetic device |
| **Residual Limb** | Remaining portion of amputated limb |

---

**Document End**
