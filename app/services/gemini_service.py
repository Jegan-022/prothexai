from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Defer heavy model initialization
_model = None

def _get_model():
    global _model
    if _model is None:
        import google.generativeai as genai
        logger.info("Initializing Gemini AI model...")
        genai.configure(api_key=settings.GEMINI_API_KEY)
        _model = genai.GenerativeModel("gemini-2.0-flash")
    return _model

async def generate_medical_analysis(prompt: str) -> str:
    try:
        model = _get_model()
        # Using generate_content_async for better integration with FastAPI
        response = await model.generate_content_async(prompt)
        if not response or not response.text:
            raise Exception("Empty response from Gemini API - Check API Key/Quota")
        return response.text
    except Exception as e:
        logger.error(f"GEMINI CRITICAL ERROR: {str(e)}")
        raise e
