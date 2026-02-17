from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from typing import Dict, Any
import os

class ReportService:
    def __init__(self, report_dir: str = "reports"):
        self.report_dir = report_dir
        if not os.path.exists(self.report_dir):
            os.makedirs(self.report_dir)

    def generate_weekly_report(self, patient_id: str, patient_name: str, report_data: Dict[str, Any]) -> str:
        """
        Generates a PDF report for a patient.
        """
        filename = f"weekly_report_{patient_id}_{report_data['start_date'].strftime('%Y%m%d')}.pdf"
        filepath = os.path.join(self.report_dir, filename)
        
        c = canvas.Canvas(filepath, pagesize=letter)
        c.setFont("Helvetica-Bold", 18)
        c.drawString(100, 750, "Weekly Biomechanical Analysis Report")
        
        c.setFont("Helvetica", 12)
        c.drawString(100, 720, f"Patient: {patient_name}")
        c.drawString(100, 700, f"Period: {report_data['start_date'].date()} to {report_data['end_date'].date()}")
        
        c.setFont("Helvetica-Bold", 14)
        c.drawString(100, 660, "Biomechanical Averages:")
        c.setFont("Helvetica", 12)
        c.drawString(100, 640, f"- Average Gait Symmetry: {report_data['avg_symmetry']:.2f}")
        c.drawString(100, 620, f"- Average Walking Speed: {report_data['avg_walking_speed']:.2f} m/s")
        c.drawString(100, 600, f"- Average Prosthetic Health Score: {report_data['avg_health_score']:.1f}/100")
        
        c.setFont("Helvetica-Bold", 14)
        c.drawString(100, 560, "Weekly Incident Summary:")
        c.setFont("Helvetica", 12)
        c.drawString(100, 540, f"- Gait Abnormality Events: {report_data['abnormal_count']}")
        c.drawString(100, 520, f"- High Skin Risk Alerts: {report_data['high_skin_risk_count']}")
        
        c.setFont("Helvetica-Oblique", 10)
        c.drawString(100, 480, "Clinical Note: Consistently low gait symmetry may indicate need for socket adjustment.")
            
        c.showPage()
        c.save()
        
        return filepath

report_service = ReportService()
