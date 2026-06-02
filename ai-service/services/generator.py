import os
import json
from typing import List
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

# Pydantic models matching the expected Java backend schema
class AiQuestion(BaseModel):
    question: str = Field(description="The question text")
    options: List[str] = Field(description="Exactly 4 possible answers", min_length=4, max_length=4)
    correctAnswer: int = Field(description="Index of the correct answer in the options array (0-3)", ge=0, le=3)
    confidence: float = Field(description="Confidence score between 0.0 and 100.0", ge=0.0, le=100.0)

class AiParseResponse(BaseModel):
    questions: List[AiQuestion] = Field(description="List of generated questions")

async def generate_questions_from_text(text: str) -> AiParseResponse:
    """Generate quiz questions from raw text.
    Tries Google Gemini first; if it fails, falls back to Grok API.
    """
    # Helper to call Gemini
    def _gemini(text: str) -> AiParseResponse:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        client = genai.Client(api_key=api_key)
        prompt = f"""
You are a quiz generation assistant. Generate multiple-choice quiz questions based on the following text.

RULES:
- Generate AT LEAST 5 questions, ideally 8-10 if the content supports it.
- If the text is short, create variations: ask about the same fact in different ways, ask "which of these is FALSE", ask about implications, etc.
- Each question must have EXACTLY 4 answer options.
- Only 1 option should be correct.
- Make wrong options plausible but clearly incorrect to someone who knows the material.
- Set confidence to 100.0 for all questions.

TEXT:
{text[:30000]}
"""
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AiParseResponse,
            ),
        )
        result_json = json.loads(response.text)
        return AiParseResponse(**result_json)

    # Helper to call Grok (fallback) - synchronous request wrapped for async use
    def _grok(text: str) -> AiParseResponse:
        api_key = os.environ.get("GROK_API_KEY")
        if not api_key:
            raise ValueError("GROK_API_KEY environment variable is not set for fallback")
        endpoint = "https://api.x.ai/v1/chat/completions"
        system_prompt = "You are a quiz generation assistant. Generate multiple-choice quiz questions in JSON matching the schema: {\"questions\":[{\"question\":...,\"options\":[...],\"correctAnswer\":0,\"confidence\":100.0}]}"
        user_prompt = f"Generate at least 5 questions from the following text. Ensure each has exactly 4 options and one correct answer. Return only the JSON.\n\n{text[:30000]}"
        payload = {
            "model": "grok-beta",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.7,
        }
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        resp = requests.post(endpoint, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        # Extract the assistant message content which should be JSON
        content = data.get("choices", [])[0].get("message", {}).get("content", "")
        result_json = json.loads(content)
        return AiParseResponse(**result_json)

    # Try Gemini first, then fallback to Grok
    try:
        return _gemini(text)
    except Exception as e:
        print(f"Gemini generation failed ({e}), falling back to Grok API")
        try:
            return _grok(text)
        except Exception as e2:
            print(f"Grok generation also failed: {e2}")
            raise Exception(f"Both Gemini and Grok generation failed: {e2}")
