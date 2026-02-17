from app.database import get_db
from app.services.gemini_service import generate_medical_analysis
from datetime import datetime, timedelta, timezone
from bson import ObjectId

async def get_patient_health_summary(patient_id: ObjectId):
    db = get_db()
    
    # 1. Fetch patient profile
    profile = await db["patient_profiles"].find_one({"_id": patient_id})
    if not profile:
        return None
    
    # 2. Fetch daily_metrics (Temporarily remove date filter to verify retrieval)
    # seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    daily_records = await db["daily_metrics"].find({
        "patient_id": patient_id,
        # "created_at": {"$gte": seven_days_ago}
    }).limit(100).to_list(100)
    
    # 3. Compute biomechanical averages
    if daily_records:
        avg_step_length_cm = sum(r.get("step_length_cm", 0) for r in daily_records) / len(daily_records)
        avg_cadence_spm = sum(r.get("cadence_spm", 0) for r in daily_records) / len(daily_records)
        avg_walking_speed_mps = sum(r.get("walking_speed_mps", 0) for r in daily_records) / len(daily_records)
        avg_gait_symmetry = sum(r.get("gait_symmetry_index", 0) for r in daily_records) / len(daily_records)
        avg_skin_temp = sum(r.get("skin_temperature_c", 0) for r in daily_records) / len(daily_records)
        avg_skin_moisture = sum(r.get("skin_moisture", 0) for r in daily_records) / len(daily_records)
        avg_pressure_distribution = sum(r.get("pressure_distribution_index", 0) for r in daily_records) / len(daily_records)
        avg_health_score = sum(r.get("prosthetic_health_score", 0) for r in daily_records) / len(daily_records)
        
        last_record = daily_records[-1]
        gait_abnormality = last_record.get("gait_abnormality", "Normal")
        skin_risk = last_record.get("skin_risk", "Low")
    else:
        avg_step_length_cm = avg_cadence_spm = avg_walking_speed_mps = avg_gait_symmetry = avg_skin_temp = avg_skin_moisture = avg_pressure_distribution = avg_health_score = 0
        gait_abnormality = "No Data"
        skin_risk = "No Data"
    
    # 4. Prepare improved structured prompt
    cli = {
        "gender": profile.get("gender", "Unknown"),
        "bmi": profile.get("bmi", 0),
        "bp": f"{profile.get('blood_pressure_systolic', 0)}/{profile.get('blood_pressure_diastolic', 0)}",
        "sugar": profile.get("blood_sugar_mg_dl", 0)
    }
    
    prompt = f"""
You are a prosthetic biomechanics specialist.

Patient Clinical Profile:
Gender: {cli['gender']}
BMI: {cli['bmi']}
Blood Pressure: {cli['bp']}
Blood Sugar: {cli['sugar']} mg/dL

Biomechanical Metrics (Weekly Averages):
Step Length: {avg_step_length_cm:.1f} cm
Cadence: {avg_cadence_spm:.1f} spm
Walking Speed: {avg_walking_speed_mps:.2f} m/s
Gait Symmetry: {avg_gait_symmetry:.2f}
Pressure Distribution: {avg_pressure_distribution:.2f}
Skin Temperature: {avg_skin_temp:.1f} °C
Skin Moisture: {avg_skin_moisture:.1f} %

Analyze the patient's prosthetic health based on the above metrics. Write strictly 2-3 lines of paragraph summarizing the key gait issues, stability, and clinical risks. Do not use bullet points.
"""

    try:
        import asyncio
        # Add a 15-second timeout for the AI call
        analysis_text = await asyncio.wait_for(generate_medical_analysis(prompt), timeout=15.0)
    except Exception as e:
        error_msg = str(e)
        print(f"AI ENGINE ERROR: {error_msg}")
        
        if "429" in error_msg or "Quota exceeded" in error_msg:
             analysis_text = "AI Clinical Interpretation based on patient health temporarily unavailable due to high usage. Please try again later."
        else:
             analysis_text = f"AI interpretation failed to generate. Error: {error_msg}. Please check system logs and API key configuration."
    
    print("--- GENERATING AI ANALYSIS ---")
    print(analysis_text)
    print("------------------------------")
    
    from app.services.ai_engine import ai_engine
    composite_metrics = {
        "gait_symmetry_index": avg_gait_symmetry,
        "pressure_distribution_index": avg_pressure_distribution,
        "skin_temperature_c": avg_skin_temp,
        "skin_moisture": avg_skin_moisture,
        "profile": profile
    }
    clinical_risk = ai_engine.determine_overall_risk(composite_metrics)

    summary_data = {
        "metrics": {
            "avg_step_length_cm": round(avg_step_length_cm, 2),
            "avg_cadence_spm": round(avg_cadence_spm, 2),
            "avg_walking_speed_mps": round(avg_walking_speed_mps, 2),
            "avg_gait_symmetry_index": round(avg_gait_symmetry, 2),
            "avg_pressure_distribution_index": round(avg_pressure_distribution, 2),
            "avg_skin_temperature_c": round(avg_skin_temp, 2),
            "avg_skin_moisture": round(avg_skin_moisture, 2),
        },
        "classification": {
            "gait_abnormality": gait_abnormality,
            "skin_risk": skin_risk,
            "prosthetic_health_score": round(avg_health_score, 2),
            "overall_clinical_risk": clinical_risk
        },
        "clinical_profile": {
            "gender": cli["gender"],
            "height_cm": profile.get("height_cm"),
            "weight_kg": profile.get("weight_kg"),
            "bmi": cli["bmi"],
            "blood_pressure": cli["bp"],
            "blood_sugar_mg_dl": cli["sugar"],
            "medical_conditions": profile.get("medical_conditions", [])
        },
        "analysis": analysis_text,
        "patient_name": profile.get('name', 'Unknown'),
        "patient_age": profile.get('age', 0),
        "recent_alerts": []
    }

    if avg_pressure_distribution < 0.6:
        summary_data["recent_alerts"].append("Load Imbalance Detected")
    
    return summary_data
