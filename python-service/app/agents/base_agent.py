from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from agents import Agent, Runner
from app.config.settings import settings
import os


class AgentContext:
    """Context for agent execution"""
    def __init__(self, input_data: Any, metadata: Optional[Dict[str, Any]] = None):
        self.input = input_data
        self.metadata = metadata or {}


class AgentResult:
    """Result from agent execution"""
    def __init__(self, output: Any, metadata: Optional[Dict[str, Any]] = None):
        self.output = output
        self.metadata = metadata or {}


class BaseAgent(ABC):
    """Base class for all agents using OpenAI Agents SDK"""
    
    def __init__(self, name: str, instructions: str, tools: Optional[list] = None, model: Optional[str] = None):
        self.name = name
        self.instructions = instructions
        self.tools = tools or []
        # Use model from parameter, or fall back to settings (which reads from .env)
        self.model = model or settings.ai_model
        self._agent: Optional[Agent] = None
        
        # Ensure OpenAI API key is set before creating agent
        self._ensure_openai_api_key()
    
    def _ensure_openai_api_key(self):
        """Ensure OPENAI_API_KEY is set for the Agents SDK"""
        # The SDK reads from OPENAI_API_KEY environment variable
        if not os.getenv("OPENAI_API_KEY") and settings.ai_api_key:
            os.environ["OPENAI_API_KEY"] = settings.ai_api_key
    
    def _get_agent(self) -> Agent:
        """Get or create agent instance using OpenAI Agents SDK"""
        if not self._agent:
            # Ensure API key is set
            self._ensure_openai_api_key()
            
            # Create agent with name, instructions, tools, and model
            # According to official docs: https://openai.github.io/openai-agents-python/
            # Model and API key are read from environment variables by the SDK
            agent_kwargs = {
                "name": self.name,
                "instructions": self.instructions,
            }
            
            # Add tools if provided
            if self.tools:
                agent_kwargs["tools"] = self.tools
            
            # Add model from settings (.env file)
            # The SDK will use this model with the API key from OPENAI_API_KEY env var
            if self.model:
                agent_kwargs["model"] = self.model
            
            self._agent = Agent(**agent_kwargs)
        return self._agent
    
    async def _call_agent(self, input_data: Any, metadata: Optional[Dict[str, Any]] = None) -> Any:
        """Call agent with input using OpenAI Agents SDK Runner"""
        agent = self._get_agent()
        
        # Convert input to string
        if isinstance(input_data, dict):
            import json
            input_str = json.dumps(input_data, indent=2)
        else:
            input_str = str(input_data)
        
        # Add metadata to context if provided
        if metadata:
            import json
            input_str += f"\n\nContext: {json.dumps(metadata, indent=2)}"
        
        # Run the agent using Runner.run() (async)
        # According to official docs: https://openai.github.io/openai-agents-python/
        result = await Runner.run(agent, input_str)
        return result.final_output
    
    @abstractmethod
    async def run(self, context: AgentContext) -> AgentResult:
        """Run the agent"""
        pass
