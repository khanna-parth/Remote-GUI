import asyncio
from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field, PrivateAttr, computed_field, model_validator
from pydantic_ai import Agent, AgentRunResult
from pydantic_ai.models import Model

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