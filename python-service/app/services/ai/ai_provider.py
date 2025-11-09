from abc import ABC, abstractmethod
from typing import Any, Optional
from openai import OpenAI
from app.config.settings import settings


class AIProvider(ABC):
    """Abstract base class for AI providers"""
    
    @abstractmethod
    async def generate_text(self, prompt: str) -> str:
        """Generate text from prompt"""
        pass
    
    @abstractmethod
    async def generate_json(self, prompt: str) -> Any:
        """Generate JSON from prompt"""
        pass


class OpenAIProvider(AIProvider):
    """OpenAI provider implementation"""
    
    def __init__(self, api_key: str, model: str = "gpt-4o-mini", base_url: Optional[str] = None):
        config = {"apiKey": api_key}
        if base_url:
            config["baseURL"] = base_url
        
        self.client = OpenAI(**config)
        self.model = model
    
    async def generate_text(self, prompt: str) -> str:
        """Generate text from prompt"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")
    
    async def generate_json(self, prompt: str) -> Any:
        """Generate JSON from prompt"""
        try:
            # Check if model supports JSON mode
            supports_json_mode = any(
                x in self.model for x in ["gpt-4", "gpt-3.5", "o1", "o3"]
            )
            
            messages = [
                {
                    "role": "system",
                    "content": "You are a helpful assistant. Always respond with valid JSON only. Do not include any explanatory text, only the JSON object or array."
                },
                {"role": "user", "content": f"{prompt}\n\nRespond with valid JSON only."}
            ]
            
            request_options = {
                "model": self.model,
                "messages": messages
            }
            
            if supports_json_mode:
                request_options["response_format"] = {"type": "json_object"}
            
            response = self.client.chat.completions.create(**request_options)
            text = response.choices[0].message.content or "{}"
            
            # Clean JSON text
            json_text = text.strip()
            if json_text.startswith("```"):
                json_text = json_text.replace("```json", "").replace("```", "").strip()
            
            # Try to extract JSON
            import json
            import re
            
            # Find JSON object or array
            json_match = re.search(r'(\[[\s\S]*\]|{[\s\S]*})', json_text)
            if json_match:
                try:
                    return json.loads(json_match.group(0))
                except:
                    pass
            
            # Final attempt
            return json.loads(json_text)
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")


def create_ai_provider() -> AIProvider:
    """Create AI provider based on settings"""
    if settings.ai_provider == "openai":
        return OpenAIProvider(
            api_key=settings.ai_api_key,
            model=settings.ai_model,
            base_url=settings.ai_base_url
        )
    else:
        raise ValueError(f"Unsupported AI provider: {settings.ai_provider}")

