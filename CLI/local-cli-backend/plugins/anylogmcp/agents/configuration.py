import asyncio
from typing import List, Optional, Self
from uuid import UUID
from fastapi import WebSocket
from pydantic import BaseModel
from pydantic_ai.models import Model
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

class LLMConfiguration(BaseModel):
    base_url: str
    model: str
    api_key: str

    @classmethod
    def from_default(cls) -> Self:
        return cls(base_url='http://100.127.214.126:1234/v1', model='qwen/qwen3-30b-a3b-2507', api_key="lm-studio")

    def to_pydantic_ai_model(self) -> Model:
        model = OpenAIChatModel(
            self.model,
            provider=OpenAIProvider(
                base_url=self.base_url,
                api_key=self.api_key
            )
        )
        return model

class UserModelSettingsRequest(BaseModel):
    planning: LLMConfiguration
    charting: LLMConfiguration
    tabulating: LLMConfiguration
    mcp: LLMConfiguration


    @classmethod
    def from_defaults(cls) -> Self:
        return cls(
            planning=LLMConfiguration.from_default(),
            charting=LLMConfiguration.from_default(),
            tabulating=LLMConfiguration.from_default(),
            mcp=LLMConfiguration.from_default(),
        )

    def to_model_settings(self) -> 'UserModelSettings':
        return UserModelSettings(
            planning=self.planning.to_pydantic_ai_model(),
            charting=self.charting.to_pydantic_ai_model(),
            tabulating=self.tabulating.to_pydantic_ai_model(),
            mcp=self.mcp.to_pydantic_ai_model(),
        )


class UserModelSettings(BaseModel):
    planning: Model
    charting: Model
    tabulating: Model
    mcp: Model

    @classmethod
    def from_defaults(cls) -> Self:
        return UserModelSettingsRequest.from_defaults().to_model_settings()

class UserSettings(BaseModel):
    models: UserModelSettings

    @classmethod
    def from_defaults(cls) -> Self:
        return UserSettings(models=UserModelSettings.from_defaults())

class UserDetails(BaseModel):
    settings: UserSettings
    uuid: UUID
    conn: Optional[WebSocket]
    tasks: List[asyncio.Task]
    

    @classmethod
    def new(cls, uuid: UUID, settings: Optional[UserSettings] = None) -> Self:
        details = cls(
            settings=settings if settings else UserSettings.from_defaults(),
            uuid=uuid,
            conn=None,
            tasks=[]
        )

        return details

