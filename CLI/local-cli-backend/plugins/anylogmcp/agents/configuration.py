import asyncio
import os
from dataclasses import dataclass, field
from enum import Enum
from typing import Callable, Optional
from uuid import UUID, uuid4

from dotenv import load_dotenv
from fastapi import WebSocket
from pydantic import BaseModel, Field, PrivateAttr, model_validator
from pydantic_ai.models import Model
from pydantic_ai.models.anthropic import AnthropicModel
from pydantic_ai.models.groq import GroqModel
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.anthropic import AnthropicProvider
from pydantic_ai.providers.groq import GroqProvider
from pydantic_ai.providers.openai import OpenAIProvider

load_dotenv(
    "/Users/khanna/Documents/UCSC/CSE_115B/Remote-GUI/CLI/local-cli-backend/plugins/anylogmcp/.env"
)


class LLMProvider(str, Enum):
    openai = "openai"
    anthropic = "anthropic"
    groq = "groq"
    gemini = "gemini"


class LLMRole(str, Enum):
    planning = "planning"
    charting = "charting"
    tabulating = "tabulating"
    mcp = "mcp"


class LLMSettings(BaseModel):
    provider: LLMProvider = Field(..., description="LLM Provider")
    model: str = Field(..., description="Model name from provider")
    api_key: str = Field(..., description="Provider API Key")

    base_url: Optional[str] = Field(
        default=None,
        description="Custom base URL (OpenAI-compatible)",
    )

    @model_validator(mode="after")
    def validate_provider(self) -> "LLMSettings":
        if not self.base_url or not self.api_key or not self.model:
            raise ValueError("LLM configuration requires: model, base_url, api_key")
        return self

    def build_model(self) -> Model:
        try:
            return _PROVIDERS[self.provider](self)
        except KeyError:
            raise ValueError(f"Unsupported provider: {self.provider}")

    @classmethod
    def openai_default(cls) -> "LLMSettings":
        return cls(
            provider=LLMProvider.openai,
            model="qwen3-30b-a3b-2507",
            api_key="lm-studio",
            base_url="http://100.127.214.126:1234/v1",
        )

    @classmethod
    def anthropic_default(cls) -> "LLMSettings":
        return cls(
            provider=LLMProvider.anthropic,
            model="claude-3-5-sonnet-20240620",
            api_key="ANTHROPIC_KEY",
            base_url="https://api.anthropic.com",
        )

    @classmethod
    def groq_default(cls) -> "LLMSettings":
        return cls(
            provider=LLMProvider.anthropic,
            model="openai/gpt-oss-20b",
            api_key=os.getenv("GROQ_API_KEY", ""),
            base_url="https://api.groq.com/openai/v1",
        )


_PROVIDERS: dict[LLMProvider, Callable[[LLMSettings], Model]] = {
    LLMProvider.openai: lambda s: OpenAIChatModel(
        s.model,
        provider=OpenAIProvider(
            base_url=s.base_url,
            api_key=s.api_key,
        ),
    ),
    LLMProvider.anthropic: lambda s: AnthropicModel(
        s.model,
        provider=AnthropicProvider(
            api_key=s.api_key,
        ),
    ),
    LLMProvider.groq: lambda s: GroqModel(
        s.model, provider=GroqProvider(api_key=s.api_key)
    ),
}


@dataclass(slots=True)
class UserRuntimeState:
    conn: Optional[WebSocket] = None
    tasks: list[asyncio.Task] = field(default_factory=list)


class User(BaseModel):
    conn_id: UUID = Field(default_factory=uuid4)

    config_id: Optional[UUID] = None

    llms: dict[LLMRole, LLMSettings]

    _models: dict[LLMRole, Model] = PrivateAttr(default_factory=dict)

    _state: UserRuntimeState = PrivateAttr(default_factory=UserRuntimeState)

    @classmethod
    def from_defaults(
        cls,
        conn_id: Optional[UUID] = None,
        provider: Optional[LLMProvider] = None,
    ) -> "User":
        match provider:
            case LLMProvider.groq:
                default = LLMSettings.groq_default()
            case LLMProvider.openai:
                default = LLMSettings.openai_default()
            case LLMProvider.anthropic:
                default = LLMSettings.anthropic_default()
            case _:
                default = LLMSettings.openai_default()

        return cls(
            conn_id=conn_id or uuid4(),
            llms={role: default.model_copy() for role in LLMRole},
        )

    def set_llm(self, role: LLMRole, settings: LLMSettings) -> None:
        self.llms[role] = settings
        self._models.pop(role, None)

    def get_model(self, role: LLMRole) -> Model:
        if role not in self._models:
            self._models[role] = self.llms[role].build_model()
        return self._models[role]

    def planning_model(self) -> Model:
        return self.get_model(LLMRole.planning)

    def charting_model(self) -> Model:
        return self.get_model(LLMRole.charting)

    def tabulating_model(self) -> Model:
        return self.get_model(LLMRole.tabulating)

    def mcp_model(self) -> Model:
        return self.get_model(LLMRole.mcp)
