from pydantic import BaseModel
from typing import Optional

class WindowStructuredData(BaseModel):
    daytime: Optional[str] = None
    location: Optional[str] = None
    type: Optional[str] = None
    material: Optional[str] = None
    panes: Optional[str] = None
    covering: Optional[str] = None
    openState: Optional[str] = None

class Window(BaseModel):
    id: str
    hash: str
    isDuplicate: bool
    createdAt: int
    imageUrl: str
    description: Optional[str] = None
    structured_data: WindowStructuredData
    
    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm(cls, window_db):
        return cls(
            id=window_db.id,
            hash=window_db.hash,
            isDuplicate=window_db.isDuplicate,
            createdAt=window_db.createdAt,
            imageUrl=window_db.imageUrl,
            description=window_db.description,
            structured_data=WindowStructuredData(
                daytime=window_db.daytime,
                location=window_db.location,
                type=window_db.window_type,
                material=window_db.material,
                panes=window_db.panes,
                covering=window_db.covering,
                openState=window_db.open_state
            )
        )