from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

class AIEngine:
    def __init__(self):
        self._abnormality_detector = None
        self._skin_risk_model = None
        self._initialized = False

    def _ensure_initialized(self):
        if not self._initialized:
            # Heavy imports inside to avoid slowing down app loading
            import pandas as pd
            import numpy as np
            from sklearn.ensemble import IsolationForest, GradientBoostingClassifier
            
            logger.info("Initializing ML models in AI Engine...")
            self._abnormality_detector = IsolationForest(contamination=0.1)
            self._skin_risk_model = GradientBoostingClassifier()
            self._initialized = True

    def analyze_gait(self, metrics: Dict[str, Any]) -> str:
        # Simple rule-based logic doesn't strictly need the ML model yet, 
        # but we ensure initialization if we use it later.
        # self._ensure_initialized() 
        
        symmetry = metrics.get("gait_symmetry_index", 1.0)
        speed = metrics.get("walking_speed_mps", 1.0)
        step = metrics.get("step_length_cm", 50)
        cadence = metrics.get("cadence_spm", 100)
        pressure = metrics.get("pressure_distribution_index", 1.0)

        if symmetry < 0.75 or speed < 0.7 or step < 30 or cadence < 70 or pressure < 0.6:
            return "Abnormal"
        return "Normal"

    def analyze_skin_risk(self, metrics: Dict[str, Any]) -> str:
        temp = metrics.get("skin_temperature_c", 30)
        moisture = metrics.get("skin_moisture", 50)
        wear = metrics.get("daily_wear_hours", 8)

        risk_score = 0
        if temp > 34: risk_score += 1
        if moisture > 70: risk_score += 1
        if wear > 12: risk_score += 1

        if risk_score <= 1: return "Low"
        if risk_score == 2: return "Medium"
        return "High"

    def calculate_prosthetic_health_score(self, metrics: Dict[str, Any]) -> float:
        symmetry = metrics.get("gait_symmetry_index", 1.0)
        pressure = metrics.get("pressure_distribution_index", 1.0)
        speed = metrics.get("walking_speed_mps", 0.7)
        moisture = metrics.get("skin_moisture", 70)
        
        profile = metrics.get("profile", {})
        bmi = profile.get("bmi", 22)
        bp_sys = profile.get("blood_pressure_systolic", 120)
        sugar = profile.get("blood_sugar_mg_dl", 90)

        score = 100
        score -= (1 - symmetry) * 40
        score -= max(0, 0.8 - pressure) * 30
        score -= max(0, 0.7 - speed) * 25
        score -= max(0, moisture - 70) * 0.5
        
        # Systemic Penalties
        if bmi > 30:
            score -= 10
        if bp_sys > 140:
            score -= 10
        if sugar > 180:
            score -= 15

        return round(min(max(float(score), 0.0), 100.0), 2)

    def determine_overall_risk(self, metrics: Dict[str, Any]) -> str:
        gait = self.analyze_gait(metrics)
        skin = self.analyze_skin_risk(metrics)
        pressure = metrics.get("pressure_distribution_index", 1.0)
        
        profile = metrics.get("profile", {})
        bmi = profile.get("bmi", 22)
        bp_sys = profile.get("blood_pressure_systolic", 120)
        sugar = profile.get("blood_sugar_mg_dl", 90)
        
        risk_points = 0
        if gait == "Abnormal": risk_points += 2
        if skin == "High": risk_points += 2
        elif skin == "Medium": risk_points += 1
        if pressure < 0.6: risk_points += 2
        
        if bmi > 30: risk_points += 1
        if bp_sys > 140 or sugar > 180: risk_points += 1
        
        if risk_points >= 4: return "High"
        if risk_points >= 2: return "Moderate"
        return "Low"

# Global singleton is fine, but it won't load ML models until first use or manual init
ai_engine = AIEngine()
