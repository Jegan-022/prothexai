from fastapi import APIRouter, Depends, HTTPException
from app.core.dependencies import get_current_user
from app.database import get_db
from app.services.ai_engine import ai_engine
from app.models.database_models import AnalysisResult
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/analysis", tags=["analysis"])

@router.post("/run/{record_id}")
async def run_analysis(record_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    # 1. Find the patient profile
    user_id = current_user["_id"]
    profile = await db["patient_profiles"].find_one({
        "$or": [
            {"user_id": user_id},
            {"user_id": str(user_id)}
        ]
    })
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # 2. Find the record and verify ownership
    record = await db["daily_metrics"].find_one({
        "_id": ObjectId(record_id),
        "patient_id": profile["_id"]
    })
    if not record:
        raise HTTPException(status_code=404, detail="Record not found or access denied")
    
    # 3. Biomechanical analysis
    # Prepare metrics with profile for the engine
    record_with_profile = {**record, "profile": profile}
    
    gait_abnormality = ai_engine.analyze_gait(record)
    skin_risk = ai_engine.analyze_skin_risk(record)
    health_score = ai_engine.calculate_prosthetic_health_score(record_with_profile)
    clinical_risk = ai_engine.determine_overall_risk(record_with_profile)
    
    # Recommendations logic
    recommendations = []
    if gait_abnormality == "Abnormal":
        recommendations.append("Significant gait asymmetry detected. Clinical gait analysis recommended.")
    if skin_risk == "High":
        recommendations.append("Critical skin irritation risk. Inspect residual limb and socket immediately.")
    if record.get("walking_speed_mps", 0) < 0.6:
        recommendations.append("Low walking speed detected. Consider prosthetic alignment check.")
    if record.get("pressure_distribution_index", 1.0) < 0.6:
        recommendations.append("Load imbalance detected. Check socket padding and alignment.")
    
    # Systemic recommendations
    if profile.get("bmi", 0) > 30:
        recommendations.append("High BMI detected. Weight management may improve prosthetic comfort.")
    if profile.get("blood_pressure_systolic", 0) > 140:
        recommendations.append("Hypertension detected. Consult clinical team regarding cardiovascular stress.")
    
    if health_score < 60:
        recommendations.append("Overall prosthetic health score is moderate. Consultation with a prosthetist advised.")

    analysis_res = AnalysisResult(
        record_id=ObjectId(record_id),
        patient_id=profile["_id"],
        gait_abnormality=gait_abnormality,
        skin_risk=skin_risk,
        prosthetic_health_score=health_score,
        overall_clinical_risk=clinical_risk,
        recommendations=recommendations
    ).model_dump(by_alias=True, exclude_none=True)
    
    await db["analysis_results"].insert_one(analysis_res)
    
    # Clean output for client
    analysis_res["id"] = str(analysis_res["_id"])
    analysis_res.pop("_id", None)
    analysis_res.pop("patient_id", None)
    analysis_res.pop("record_id", None)
    
    # Add clinical indicators for doctor view convenience
    analysis_res["clinical_indicators"] = {
        "bmi": profile.get("bmi"),
        "bp": f"{profile.get('blood_pressure_systolic')}/{profile.get('blood_pressure_diastolic')}",
        "sugar": profile.get("blood_sugar_mg_dl")
    }
    
    return analysis_res
