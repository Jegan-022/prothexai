from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.core.dependencies import get_current_user, check_role
from app.schemas.api_schemas import DailyInput, GaitUploadResponse, DashboardSummary, PatientProfileCreate, PatientProfileOut, FeedbackCreate
from app.database import get_db
from app.models.database_models import DailyRecord, SensorUpload, PatientFeedback
from bson import ObjectId
import csv
import io
from datetime import datetime, timezone

router = APIRouter(prefix="/patient", tags=["patient"])

@router.post("/upload-gait", response_model=GaitUploadResponse)
async def upload_gait(
    file: UploadFile = File(...),
    current_user: dict = Depends(check_role("patient"))
):
    if not file.filename.endswith(('.csv', '.txt')):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    db = get_db()
    
    # 1. Resolve identity internally
    profile = await db["patient_profiles"].find_one({"user_id": current_user["_id"]})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please create your profile first.")
    
    patient_id = profile["_id"]
    
    contents = await file.read()
    decoded = contents.decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))
    
    sensor_data = []
    for row in reader:
        sensor_data.append(row)
    
    record = SensorUpload(
        patient_id=patient_id,
        sensor_data=sensor_data
    ).model_dump(by_alias=True, exclude_none=True)
    
    result = await db["sensor_uploads"].insert_one(record)
    
    return {"message": "Upload successful", "record_id": str(result.inserted_id)}

@router.get("/profile", response_model=PatientProfileOut)
async def get_profile(current_user: dict = Depends(check_role("patient"))):
    db = get_db()
    user_id = current_user["_id"]
    profile = await db["patient_profiles"].find_one({
        "$or": [
            {"user_id": user_id},
            {"user_id": str(user_id)}
        ]
    })
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # helper for Pydantic (id and user_id are ObjectId or str)
    profile["id"] = str(profile["_id"])
    if "user_id" in profile:
        profile["user_id"] = str(profile["user_id"])
        
    return profile

@router.post("/profile")
async def create_or_update_profile(
    data: PatientProfileCreate,
    current_user: dict = Depends(check_role("patient"))
):
    from app.models.database_models import PatientProfile
    db = get_db()
    
    user_id = current_user["_id"]
    
    # Check if profile already exists
    existing = await db["patient_profiles"].find_one({
        "$or": [
            {"user_id": user_id},
            {"user_id": str(user_id)}
        ]
    })
    
    # Prepare update data
    update_data = data.model_dump(exclude_unset=True)
    
    # Calculate BMI if height and weight are provided
    # Fallback to existing values if update doesn't have them
    h = update_data.get("height_cm")
    w = update_data.get("weight_kg")
    
    if existing:
        if h is None: h = existing.get("height_cm")
        if w is None: w = existing.get("weight_kg")
    
    if h and w and h > 0:
        bmi = w / ((h / 100) ** 2)
        update_data["bmi"] = round(bmi, 2)
        
    if existing:
        # UPDATE
        await db["patient_profiles"].update_one(
            {"_id": existing["_id"]},
            {"$set": update_data}
        )
        return {"message": "Profile updated successfully"}
    else:
        # CREATE
        # Ensure we have minimums if creating new, though schema might enforce basics
        # Add user_id
        update_data["user_id"] = ObjectId(user_id)
        
        # Use defaults for missing fields if creating (Pydantic model would usually handle this but we used exclude_unset)
        # So manually instantiate model to get defaults then update with our data?
        # Or just let Pydantic handle it.
        # Ideally: new_profile = PatientProfile(user_id=user_id, **data.model_dump())
        # But data is a Subset schema now. 
        # Let's just insert what we have, plus defaults from DB model.
        
        # DB Model defaults:
        default_profile = PatientProfile(
            user_id=user_id,
            email=data.email or current_user.get("email"),
            **update_data
        )
        
        start_doc = default_profile.model_dump(by_alias=True, exclude_none=True)
        # Ensure user_id is ObjectId
        start_doc["user_id"] = ObjectId(start_doc["user_id"])
        
        await db["patient_profiles"].insert_one(start_doc)
        return {"message": "Profile created successfully"}

@router.post("/feedback")
async def submit_feedback(
    feedback: FeedbackCreate,
    current_user: dict = Depends(check_role("patient"))
):
    db = get_db()
    
    # 1. Resolve Patient Profile
    user_id = current_user["_id"]
    profile = await db["patient_profiles"].find_one({
        "$or": [
            {"user_id": user_id},
            {"user_id": str(user_id)}
        ]
    })
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please create your profile first.")
    
    patient_id = profile["_id"]
    
    # 2. Save Feedback
    new_feedback = PatientFeedback(
        patient_id=patient_id,
        issue_type=feedback.issue_type,
        description=feedback.description
    ).model_dump(by_alias=True, exclude_none=True)
    
    # Ensure ObjectId
    new_feedback["patient_id"] = ObjectId(new_feedback["patient_id"])
    
    await db["patient_feedback"].insert_one(new_feedback)
    
    return {"message": "Feedback submitted successfully. Admin will review it shortly."}

@router.post("/daily-input")
async def daily_input(
    data: DailyInput,
    current_user: dict = Depends(check_role("patient"))
):
    from app.services.ai_engine import ai_engine
    from app.models.database_models import DailyRecord
    db = get_db()
    
    # 1. Resolve identity internally from JWT
    user_id = current_user["_id"]
    profile = await db["patient_profiles"].find_one({
        "$or": [
            {"user_id": user_id},
            {"user_id": str(user_id)}
        ]
    })
    
    if not profile:
        raise HTTPException(
            status_code=404, 
            detail="Patient profile not found."
        )
    
    patient_id = profile["_id"]
    
    # Calculate biomechanical metrics
    metrics_dict = data.model_dump()
    
    # Add profile data for health score calculation
    metrics_plus_profile = {**metrics_dict, "profile": profile}
    
    gait_abnormality = ai_engine.analyze_gait(metrics_dict)
    skin_risk = ai_engine.analyze_skin_risk(metrics_dict)
    health_score = ai_engine.calculate_prosthetic_health_score(metrics_plus_profile)
    
    # Insert daily record
    record = DailyRecord(
        patient_id=patient_id,
        date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        **metrics_dict,
        gait_abnormality=gait_abnormality,
        skin_risk=skin_risk,
        prosthetic_health_score=health_score
    ).model_dump(by_alias=True, exclude_none=True)
    
    # Store patient_id as ObjectId explicitly and ensure created_at is UTC datetime
    record["patient_id"] = ObjectId(record["patient_id"])
    record["created_at"] = datetime.now(timezone.utc)
    
    await db["daily_metrics"].insert_one(record)
    return {
        "message": "Metrics submitted successfully", 
        "gait_abnormality": gait_abnormality,
        "skin_risk": skin_risk,
        "health_score": health_score
    }

@router.get("/dashboard", response_model=DashboardSummary)
async def get_dashboard(current_user: dict = Depends(check_role("patient"))):
    db = get_db()
    
    # Resolve identity internally
    user_id = current_user["_id"]
    profile = await db["patient_profiles"].find_one({
        "$or": [
            {"user_id": user_id},
            {"user_id": str(user_id)}
        ]
    })
    
    if not profile:
        raise HTTPException(
            status_code=404, 
            detail="Patient profile not found."
        )
    
    patient_id = profile["_id"]
    
    # Fetch latest daily record
    # Fetch latest daily record (Valid data only)
    latest_record = await db["daily_metrics"].find_one(
        {
            "patient_id": patient_id,
            "walking_speed_mps": {"$gt": 0}
        },
        sort=[("created_at", -1)]
    )
    
    # Fetch last 7 records for trends (Valid data only)
    history = await db["daily_metrics"].find(
        {
            "patient_id": patient_id,
            "walking_speed_mps": {"$gt": 0}
        }
    ).sort("created_at", -1).limit(7).to_list(7)
    
    history.reverse()
    
    from app.schemas.api_schemas import TrendData
    trends = TrendData(
        health_score=[r["prosthetic_health_score"] for r in history],
        symmetry=[r["gait_symmetry_index"] for r in history],
        walking_speed=[r["walking_speed_mps"] for r in history],
        skin_temp=[r["skin_temperature_c"] for r in history],
        moisture=[r["skin_moisture"] for r in history],
        pressure_distribution=[r.get("pressure_distribution_index", 0) for r in history]
    )

    alerts = []
    if latest_record:
        if latest_record["gait_abnormality"] == "Abnormal":
            alerts.append("Significant gait abnormality detected.")
        if latest_record["skin_risk"] == "High":
            alerts.append("High risk of skin irritation. Check socket fit.")
        if latest_record.get("pressure_distribution_index", 1.0) < 0.6:
            alerts.append("Load Imbalance Detected.")

    return {
        "patient_name": profile.get("name", profile["email"]),
        "latest_health_score": latest_record["prosthetic_health_score"] if latest_record else None,
        "gait_abnormality": latest_record["gait_abnormality"] if latest_record else "No Data Available",
        "skin_risk": latest_record["skin_risk"] if latest_record else "No Data Available",
        "trends": trends,
        "recent_alerts": alerts
    }

@router.get("/history")
async def get_history(
    days: int = 7,
    current_user: dict = Depends(check_role("patient"))
):
    db = get_db()
    
    # Resolve identity internally (handle both ObjectId and legacy string)
    user_id = current_user["_id"]
    profile = await db["patient_profiles"].find_one({
        "$or": [
            {"user_id": user_id},
            {"user_id": str(user_id)}
        ]
    })
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    patient_id = profile["_id"]
    
    # DEBUG LOGGING (Temporary)
    print("JWT user ID:", user_id)
    print("Resolved patient_id:", patient_id)
    
    # Query using patient_id ObjectId - Renamed to daily_metrics
    records = await db["daily_metrics"].find(
        {"patient_id": patient_id}
    ).sort("created_at", -1).limit(days).to_list(days)
    
    print("Records found:", len(records))
    
    if not records:
        return []

    for r in records:
        r["id"] = str(r["_id"])
        # Do NOT return patient_id to client
        r.pop("patient_id", None)
        r.pop("_id")
    
    return records

@router.get("/weekly-report/{id}")
async def get_report_metadata(id: str, current_user: dict = Depends(check_role("patient"))):
    db = get_db()
    user_id = current_user["_id"]
    profile = await db["patient_profiles"].find_one({
        "$or": [
            {"user_id": user_id},
            {"user_id": str(user_id)}
        ]
    })
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    report = await db["weekly_reports"].find_one({"_id": ObjectId(id), "patient_id": profile["_id"]})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report["id"] = str(report["_id"])
    return report

@router.get("/download-report/{id}")
async def download_report(id: str, current_user: dict = Depends(check_role("patient"))):
    db = get_db()
    user_id = current_user["_id"]
    profile = await db["patient_profiles"].find_one({
        "$or": [
            {"user_id": user_id},
            {"user_id": str(user_id)}
        ]
    })
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    report = await db["weekly_reports"].find_one({"_id": ObjectId(id), "patient_id": profile["_id"]})
    if not report or not report.get("pdf_path"):
        raise HTTPException(status_code=404, detail="Report PDF not found")
    
    from fastapi.responses import FileResponse
    return FileResponse(report["pdf_path"], media_type='application/pdf', filename=f"report_{id}.pdf")
