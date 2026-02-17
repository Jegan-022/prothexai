from pydantic import BaseModel, Field, EmailStr, ConfigDict, GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import core_schema
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
from enum import Enum

class UserRole(str, Enum):
    patient = "patient"
    admin = "admin"

class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, _source_type: Any, _handler: Any
    ) -> core_schema.CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(cls.validate),
                ]),
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x), 
                when_used='always'
            ),
        )

    @classmethod
    def validate(cls, v) -> ObjectId:
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(
        cls, _core_schema: core_schema.CoreSchema, handler: GetJsonSchemaHandler
    ) -> JsonSchemaValue:
        return handler(core_schema.str_schema())

class User(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    email: EmailStr
    hashed_password: str
    role: UserRole
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PatientFeedback(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    patient_id: PyObjectId # References patient_profiles._id
    issue_type: str
    description: str
    status: str = "open" # open, in_progress, resolved
    admin_response: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class PatientProfile(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: PyObjectId # Link to User._id
    name: str = "Unknown"
    email: Optional[str] = None
    age: int = 0
    gender: str = "Unknown"
    height_cm: float = 0.0
    weight_kg: float = 0.0
    bmi: float = 0.0
    blood_pressure_systolic: int = 0
    blood_pressure_diastolic: int = 0
    blood_sugar_mg_dl: int = 0
    medical_conditions: List[str] = []
    baseline_score: float = 50.0
    amputation_level: Optional[str] = None
    device_type: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DailyRecord(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    patient_id: PyObjectId
    date: str
    step_length_cm: float
    cadence_spm: float
    walking_speed_mps: float
    gait_symmetry_index: float
    skin_temperature_c: float
    skin_moisture: float
    pressure_distribution_index: float
    daily_wear_hours: float
    gait_abnormality: str # "Normal/Abnormal"
    skin_risk: str # "Low/Medium/High"
    prosthetic_health_score: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SensorUpload(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    patient_id: PyObjectId
    sensor_data: List[Dict[str, Any]] # Time-series data
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AnalysisResult(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    record_id: PyObjectId
    patient_id: PyObjectId
    gait_abnormality: str # "Normal" or "Abnormal"
    skin_risk: str # "Low", "Medium", "High"
    prosthetic_health_score: float # 0-100
    overall_clinical_risk: str = "Low" # "Low", "Moderate", "High"
    recommendations: List[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WeeklyReport(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    patient_id: PyObjectId
    start_date: datetime
    end_date: datetime
    avg_symmetry: float
    avg_prosthetic_health_score: float
    health_score_delta: float = 0.0  # Week-over-week change for triage tracking
    abnormal_count: int
    high_skin_risk_count: int
    pdf_path: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

