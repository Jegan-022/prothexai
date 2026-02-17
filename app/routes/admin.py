from fastapi import APIRouter, Depends, HTTPException
from app.core.dependencies import check_role
from app.database import get_db
from app.schemas.api_schemas import AdminDashboardSummary, FeedbackOut, FeedbackUpdate
from datetime import datetime, timezone
from bson import ObjectId

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/dashboard", response_model=AdminDashboardSummary)
async def admin_dashboard(current_user: dict = Depends(check_role("admin"))):
    db = get_db()
    
    total_patients = await db["patient_profiles"].count_documents({})
    total_feedback = await db["patient_feedback"].count_documents({})
    open_issues = await db["patient_feedback"].count_documents({"status": "open"})
    resolved_issues = await db["patient_feedback"].count_documents({"status": "resolved"})
    
    # Calculate risk distribution
    profiles = await db["patient_profiles"].find().to_list(None)
    risk_stats = {"stable": 0, "moderate": 0, "high": 0, "no_data": 0}
    
    for p in profiles:
        latest = await db["daily_metrics"].find_one(
            {"patient_id": p["_id"]},
            sort=[("created_at", -1)]
        )
        if not latest:
            risk_stats["no_data"] += 1
            continue
            
        score = latest.get("prosthetic_health_score", 0)
        if score >= 85: risk_stats["stable"] += 1
        elif score >= 60: risk_stats["moderate"] += 1
        else: risk_stats["high"] += 1
    
    return {
        "total_patients": total_patients,
        "total_feedback": total_feedback,
        "open_issues": open_issues,
        "resolved_issues": resolved_issues,
        "risk_distribution": risk_stats
    }

@router.get("/patients")
async def list_patients(current_user: dict = Depends(check_role("admin"))):
    db = get_db()
    profiles = await db["patient_profiles"].find().to_list(100)
    
    result = []
    for p in profiles:
        latest = await db["daily_metrics"].find_one(
            {"patient_id": p["_id"]},
            sort=[("created_at", -1)]
        )
        
        result.append({
            "id": str(p["_id"]),
            "name": p.get("name", "Unknown"),
            "device_type": p.get("device_type", "N/A"),
            "health_score": latest["prosthetic_health_score"] if latest else 0,
            "skin_risk": latest["skin_risk"] if latest else "No Data",
            "gait_status": latest["gait_abnormality"] if latest else "No Data",
            "last_active": latest["date"] if latest else "Never"
        })
    return result

@router.get("/patients/{patient_id}")
async def get_patient_detail(patient_id: str, current_user: dict = Depends(check_role("admin"))):
    db = get_db()
    try:
        oid = ObjectId(patient_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid Patient ID")
        
    profile = await db["patient_profiles"].find_one({"_id": oid})
    if not profile:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    # Get history
    history = await db["daily_metrics"].find({"patient_id": oid}).sort("created_at", -1).limit(30).to_list(30)
    
    # Clean up for JSON
    profile["id"] = str(profile["_id"])
    profile.pop("_id")
    profile["user_id"] = str(profile["user_id"])
    
    for h in history:
        h["id"] = str(h["_id"])
        h.pop("_id")
        h.pop("patient_id")
        
    return {
        "profile": profile,
        "history": history
    }

@router.post("/notifications")
async def create_notification(data: dict, current_user: dict = Depends(check_role("admin"))):
    db = get_db()
    target = data.get("target") 
    
    new_note_base = {
        "title": data.get("title"),
        "message": data.get("message"),
        "category": data.get("category", "system"), 
        "is_read": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    if target == "all":
        patients = await db["patient_profiles"].find().to_list(None)
        to_insert = [ {**new_note_base, "patient_id": p["_id"]} for p in patients]
        if to_insert:
            await db["notifications"].insert_many(to_insert)
    else:
        try:
            p_oid = ObjectId(target)
            await db["notifications"].insert_one({**new_note_base, "patient_id": p_oid})
        except:
             raise HTTPException(status_code=400, detail="Invalid Target ID")
        
    return {"message": "Notification sent"}

@router.get("/feedback", response_model=list[FeedbackOut])
async def get_all_feedback(current_user: dict = Depends(check_role("admin"))):
    db = get_db()
    feedback_list = await db["patient_feedback"].find().sort("created_at", -1).to_list(100)
    
    result = []
    for f in feedback_list:
        patient = await db["patient_profiles"].find_one({"_id": f["patient_id"]})
        result.append({
            "id": str(f["_id"]),
            "patient_id": str(f["patient_id"]),
            "patient_name": patient.get("name", "Unknown") if patient else "Unknown",
            "issue_type": f["issue_type"],
            "description": f["description"],
            "status": f["status"],
            "admin_response": f.get("admin_response"),
            "created_at": f["created_at"],
            "updated_at": f.get("updated_at")
        })
    return result

@router.patch("/feedback/{feedback_id}")
async def update_feedback(feedback_id: str, update: FeedbackUpdate, current_user: dict = Depends(check_role("admin"))):
    db = get_db()
    
    try:
        oid = ObjectId(feedback_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID")
        
    result = await db["patient_feedback"].update_one(
        {"_id": oid},
        {"$set": {
            "status": update.status,
            "admin_response": update.admin_response,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Feedback not found")
        
    return {"message": "Feedback updated successfully"}
