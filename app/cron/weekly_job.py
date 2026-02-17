from app.database import db_instance
from app.services.report_service import report_service
from datetime import datetime, timedelta, timezone
import logging

logger = logging.getLogger(__name__)

async def generate_weekly_reports():
    """
    Weekly cron job to aggregate data and generate PDF reports.
    """
    db = db_instance.db
    if db is None:
        logger.error("Database connection not established for cron job.")
        return

    # Time window: last 7 days
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=7)
    
    # 1. Get all patients
    patients = await db["patient_profiles"].find().to_list(1000)
    
    for patient in patients:
        patient_id = patient["_id"]
        
        # 2. Aggregation Pipeline for biomechanical metrics
        pipeline = [
            {
                "$match": {
                    "patient_id": patient_id,
                    "created_at": {"$gte": start_date, "$lt": end_date}
                }
            },
            {
                "$group": {
                    "_id": "$patient_id",
                    "avg_health_score": {"$avg": "$prosthetic_health_score"},
                    "avg_symmetry": {"$avg": "$gait_symmetry_index"},
                    "avg_walking_speed": {"$avg": "$walking_speed_mps"},
                    "abnormal_count": {"$sum": {"$cond": [{"$eq": ["$gait_abnormality", "Abnormal"]}, 1, 0]}},
                    "high_skin_risk_count": {"$sum": {"$cond": [{"$eq": ["$skin_risk", "High"]}, 1, 0]}}
                }
            }
        ]
        
        # Aggregate from daily_metrics collection
        cursor = db["daily_metrics"].aggregate(pipeline)
        result_list = await cursor.to_list(length=1)
        
        if result_list:
            stats = result_list[0]
            report_data = {
                "start_date": start_date,
                "end_date": end_date,
                "avg_symmetry": stats.get("avg_symmetry", 0.0),
                "avg_health_score": stats.get("avg_health_score", 0.0),
                "avg_walking_speed": stats.get("avg_walking_speed", 0.0),
                "abnormal_count": stats.get("abnormal_count", 0),
                "high_skin_risk_count": stats.get("high_skin_risk_count", 0)
            }
            
            # Generate PDF
            pdf_path = report_service.generate_weekly_report(str(patient_id), patient.get("name", "Unknown"), report_data)
            
            # Store report metadata
            report_doc = {
                "patient_id": patient_id,
                "start_date": start_date,
                "end_date": end_date,
                "avg_symmetry": stats.get("avg_symmetry", 0.0),
                "avg_prosthetic_health_score": stats.get("avg_health_score", 0.0),
                "abnormal_count": stats.get("abnormal_count", 0),
                "high_skin_risk_count": stats.get("high_skin_risk_count", 0),
                "pdf_path": pdf_path,
                "created_at": datetime.now(timezone.utc)
            }
            await db["weekly_reports"].insert_one(report_doc)
            logger.info(f"Generated weekly biomechanical report for patient {patient_id}")
