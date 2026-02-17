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
    
    return {
        "total_patients": total_patients,
        "total_feedback": total_feedback,
        "open_issues": open_issues,
        "resolved_issues": resolved_issues
    }

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
