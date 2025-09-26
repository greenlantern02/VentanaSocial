from sqlalchemy import Column, String, Integer, Boolean, Text
from database import Base

class WindowDB(Base):
    __tablename__ = "windows"

    id = Column(String, primary_key=True, index=True)
    hash = Column(String, index=True, nullable=False)
    isDuplicate = Column(Boolean, default=False, nullable=False)
    createdAt = Column(Integer, nullable=False)
    ai = Column(Text, nullable=False)  # JSON almacenado como string
    imageUrl = Column(String, nullable=False)
