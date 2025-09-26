from pydantic import BaseModel

class Window(BaseModel):
    id: str
    hash: str
    isDuplicate: bool
    createdAt: int
    ai: str
    imageUrl: str

    class Config:
        from_attributes=True
