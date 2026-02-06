import asyncio
from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field, PrivateAttr, computed_field, model_validator
from pydantic_ai import Agent, AgentRunResult
from pydantic_ai.models import Model
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.providers.groq import GroqProvider
from pydantic_ai.models.groq import GroqModel
from plugins.anylogmcp.agents.visualization.tables.sys_prompt import TABULAR_PROMPT
from pydantic_ai.providers.google import GoogleProvider
from pydantic_ai.models.google import GoogleModel
import os
from dotenv import load_dotenv

load_dotenv('/Users/khanna/Documents/UCSC/CSE_115B/Remote-GUI/CLI/local-cli-backend/plugins/anylogmcp/.env')

default_model = OpenAIChatModel(
    # 'qwen/qwen3-14b',
    # 'zai-org/glm-4.7-flash',
    # 'openai/gpt-oss-20b',
    'qwen/qwen3-30b-a3b-2507',
    provider=OpenAIProvider(
        base_url='http://100.127.214.126:1234/v1',
        api_key="lm-studio"
    ),
)

class GenerateTableRequest(BaseModel):
    table_title: str
    data_to_tabulate: str


class TableColumnInfoResponse(BaseModel):
    label: str
    is_numeric: bool
    id: int

class TableEntryResponse(BaseModel):
    row_key: str
    value: Union[str, int, float, None]

class TableRowResponse(BaseModel):
    entries: List[TableEntryResponse]

class TableOutputResponse(BaseModel):
    column_info: List[TableColumnInfoResponse]
    rows: List[TableRowResponse]
    title: str

# Internal AI output structure
class TableColumnInfo(BaseModel):
    key: str = Field(description="A unique, lowercase_snake_case identifier for the column (e.g., 'hp', 'length_in').")
    label: str = Field(description="The human-readable label with units normalized (e.g., 'Horsepower (hp)').")
    is_numeric: bool = Field(description="True if the column contains numeric values.")

    _id: Optional[int] = PrivateAttr(default=None)

    @computed_field
    def id(self) -> Optional[int]:
        return self._id

    def set_id(self, val: int):
        self._id = val


# Internal AI output structure
class TableRow(BaseModel):
    row_data: Dict[str, Union[str, int, float, None]] = Field(
        description="A map where keys MUST match the 'key' field in column_info."
    )

# Internal AI output structure
class TableOutput(BaseModel):
    title: str
    column_info: List[TableColumnInfo]
    rows: List[TableRow]
    entity_column_key: str = Field(
        description="The 'key' from column_info that represents the name of the entity (e.g., 'vehicle_name')."
    )

    @model_validator(mode='after')
    def validate_column_alignment(self) -> 'TableOutput':
        column_keys = {col.key for col in self.column_info}
        
        if self.entity_column_key not in column_keys:
            raise ValueError(f"entity_column_key '{self.entity_column_key}' not found in columns.")

        for i, row in enumerate(self.rows):
            row_keys = set(row.row_data.keys())
            if row_keys != column_keys:
                missing = column_keys - row_keys
                extra = row_keys - column_keys
                raise ValueError(f"Row {i} mismatch. Missing: {missing}, Extra: {extra}")
        return self
    

class TabularAgent(Agent):
    def __init__(self, custom_model: Model | None, custom_guidelines: Optional[str]):
        super().__init__(
            model=custom_model if custom_model else default_model,
            system_prompt=custom_guidelines if custom_guidelines else TABULAR_PROMPT,
            output_type=TableOutput #type:ignore
        )
    
    async def generate_table(self, prompt) -> TableOutputResponse:
        print(f"TABLE REQUEST: {prompt}")
        response: AgentRunResult[TableOutput] = await self.run(prompt, output_type=TableOutput)
        for idx, col in enumerate(response.output.column_info):
            col.set_id(idx)
        
        print(f"TABLE PROMPT: {prompt}")

        response = self.__convert_from_internal_table(response.output) 

        return response
    
    def __convert_from_internal_table(self, old_table: TableOutput) -> TableOutputResponse:
        new_columns: List[TableColumnInfoResponse] = []
        for idx, col in enumerate(old_table.column_info):
            new_columns.append(TableColumnInfoResponse(label=col.label, is_numeric=col.is_numeric, id=idx))

        new_rows = []
        for old_row in old_table.rows:
            new_entries = []
            
            for col in old_table.column_info:
                val = old_row.row_data.get(col.key)
                new_entries.append(
                    # TableEntryResponse(row_key=col.key, value=val)
                    TableEntryResponse(row_key=col.label, value=val)
                )
            
            new_rows.append(TableRowResponse(entries=new_entries))

        return TableOutputResponse(
            title=old_table.title,
            column_info=new_columns,
            rows=new_rows
        )

def create_tabular_agent(custom_model: Model | None = None, custom_guidelines: str | None = None) -> TabularAgent:
    agent = TabularAgent(custom_model = custom_model if custom_model else default_model, custom_guidelines=custom_guidelines if custom_guidelines else TABULAR_PROMPT)

    return agent
