# 🧪 Master Test Plan: Triage System & Reporting

## 📋 Scope
This test plan validates the following recently implemented features:
1.  **Clinical Risk Triage System** (`/doctor/triage`)
2.  **Automated Escalation Detection** (4 Rules)
3.  **Advanced Metrics** (Health Score Delta, Stability Index, Adherence)
4.  **PDF Report Enhancements** (Logo Integration)

---

## 🛠️ Prerequisites
- **Server Running**: `uvicorn app.main:app --reload`
- **Database**: MongoDB instance active with sample data
- **Tools**: `curl` or Postman, PDF Viewer

---

## 1️⃣ Triage System Testing

### 🟢 Test Case 1.1: Triage Endpoint Response
**Objective**: Verify the `/doctor/triage` endpoint returns the correct structure.

**Steps**:
1. Login as a Doctor to get a JWT token.
2. Call `GET /doctor/triage`.

**Curl Command**:
```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "doctor@example.com", "password": "password"}' | jq -r '.access_token')

# 2. Get Triage Data
curl -X GET http://localhost:8000/doctor/triage \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Result**:
- Status Code: `200 OK`
- JSON Response contains:
  ```json
  {
    "total_patients": <int>,
    "escalated_patients": <int>,
    "high_risk_patients": <int>,
    "low_adherence_patients": <int>,
    "patients": [ ... ]
  }
  ```

### 🟢 Test Case 1.2: Escalation Logic Verification
**Objective**: Confirm escalation flags are triggered correctly by specific conditions.

| Scenario | Condition | Expected Output |
| :--- | :--- | :--- |
| **Deterioration** | `health_score_delta` < -15 | `escalation_flag: true`<br>`reason: "Significant health score decline"` |
| **Gait Issue** | 3 consecutive days "Abnormal" | `escalation_flag: true`<br>`reason: "3+ consecutive abnormal gait days"` |
| **Pressure Issue** | 2 consecutive days `< 0.5` | `escalation_flag: true`<br>`reason: "Low pressure distribution"` |
| **Skin Risk** | 2 consecutive days "High" | `escalation_flag: true`<br>`reason: "High skin risk"` |
| **Healthy Patient** | None of the above | `escalation_flag: false` |

**Validation Method**:
- Inspect the `patients` array in the response.
- Find a patient matching the condition (you may need to seed database with specific daily metrics).
- Verify `escalation_reasons` array content.

### 🟢 Test Case 1.3: Sorting & Prioritization
**Objective**: Verify the patient list is sorted by clinical urgency.

**Steps**:
1. Retrieve the `patients` list.
2. Verify the order follows this priority:
   1. **Escalated Patients** (First)
   2. **High Risk** (Second)
   3. **Moderate Risk** (Third)
   4. **Low Risk** (Last)
3. Check tie-breaker: Within the same risk group, are patients with more negative `health_score_delta` listed first?

---

## 2️⃣ Metric Calculation Testing

### 🟢 Test Case 2.1: Health Score Delta
**Objective**: Verify the week-over-week change calculation.

**Formula**: `Delta = (Current Week Avg) - (Previous Week Avg)`

**Validation**:
- Manually calculate averages from the last 14 days of `daily_metrics` for a specific patient.
- Compare with `health_score_delta` in the API response.
- **Pass Criteria**: Value matches within ±0.1 precision.

### 🟢 Test Case 2.2: Stability Index
**Objective**: Verify gait consistency tracking.

**Formula**: Standard deviation of `gait_symmetry_index` over last 7 days.

**Validation**:
- If a patient has consistent symmetry (e.g., 0.8, 0.81, 0.79), `stability_index` should be low (< 0.05), status `Stable`.
- If a patient has erratic symmetry (e.g., 0.8, 0.5, 0.9), `stability_index` should be high (> 0.12), status `Unstable`.

### 🟢 Test Case 2.3: Adherence Score
**Objective**: Verify compliance percentage.

**Formula**: `(Uploads in Last 7 Days / 7) * 100`

**Validation**:
- 7 uploads = 100% (Good)
- 3 uploads = ~43% (Moderate)
- 1 upload = ~14% (Low)

---

## 3️⃣ PDF Report & Logo Testing

### 🟢 Test Case 3.1: Logo Presence verification
**Objective**: Ensure the company logo appears on generated PDF reports.

**Steps**:
1. Login as a Doctor.
2. Trigger a manual report generation (or wait for weekly cron if accessible):
   ```bash
   # Generate Report
   curl -X POST http://localhost:8000/report/generate/{patient_id} \
     -H "Authorization: Bearer $TOKEN" \
     --output report_test.pdf
   ```
   *(Note: Ensure endpoint matches your `report.py` implementation)*

3. **Or unit test the service directly**:
   Create a temporary script `test_pdf.py`:
   ```python
   from app.services.pdf_service import generate_medical_pdf
   
   mock_data = {
       "patient_name": "Test User",
       "patient_age": 45,
       "clinical_profile": {},
       "metrics": {},
       "classification": {},
       "analysis": "Test AI analysis content."
   }
   
   buffer = generate_medical_pdf(mock_data)
   with open("test_logo_report.pdf", "wb") as f:
       f.write(buffer.getbuffer())
   print("PDF generated: test_logo_report.pdf")
   ```
4. **Visual Inspection**:
   - Open the PDF.
   - **Check**: Is the logo in the **Top-Left** corner?
   - **Check**: Is it above the title?
   - **Check**: Is the title right-aligned (preserving original style)?
   - **Check**: Is spacing correct (no overlap)?

---

## 4️⃣ Regression & Safety Testing

### 🟢 Test Case 4.1: Empty Data Handling
**Objective**: Ensure system doesn't crash for new patients with no data.

**Steps**:
1. Create a new patient profile.
2. Do NOT upload any metrics.
3. Call `/doctor/triage`.

**Expected Result**:
- `latest_health_score`: 0 (or N/A)
- `health_score_delta`: 0.0
- `stability_classification`: "N/A" or "Stable" (default)
- `escalation_flag`: false
- **NO 500 ERROR**.

### 🟢 Test Case 4.2: Unauthorized Access
**Trigger**: Access `/doctor/triage` with a **Patient** role token.

**Expected Result**: `403 Forbidden`.

---

## 📝 Success Checklist

| Feature | Pass Criteria | Status |
| :--- | :--- | :--- |
| **Triage List** | Returns JSON with correct structure | ⬜ |
| **Prioritization** | Escalated patients appear at top | ⬜ |
| **Escalation Rules** | Flags trigger correctly on mock data | ⬜ |
| **Stability Index** | Correctly identifies Unstable vs Stable | ⬜ |
| **PDF Logo** | Logo visible, top-left, proper layout | ⬜ |
| **Error Handling** | New patients handle gracefully (no crash) | ⬜ |

---

## 🔍 Troubleshooting

- **500 Error on Triage**: Likely a missing field in `daily_metrics`. Check if `triage_service.py` handles `None` values correctly.
- **Logo Not Showing**: Verify `logo/logo.png` exists. Check `pdf_service.py` paths.
- **Wrong Sort Order**: Verify `_risk_priority` mapping: High=0, Moderate=1, Low=2.
