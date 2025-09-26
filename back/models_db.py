from sqlalchemy import Column, String, Integer, Boolean, Text
from database import Base

class WindowDB(Base):
    __tablename__ = "windows"
    
    id = Column(String, primary_key=True, index=True)
    hash = Column(String, index=True, nullable=False)
    isDuplicate = Column(Boolean, default=False, nullable=False)
    createdAt = Column(Integer, nullable=False)
    imageUrl = Column(String, nullable=False)
    
    # AI Analysis fields
    description = Column(Text, nullable=True)
    daytime = Column(String, nullable=True)  # day/night/unknown
    location = Column(String, nullable=True)  # interior/exterior/unknown
    window_type = Column(String, nullable=True)  # fixed/sliding/casement/etc
    material = Column(String, nullable=True)  # wood/aluminum/pvc/unknown
    panes = Column(String, nullable=True)  # 1/2/3/unknown
    covering = Column(String, nullable=True)  # curtains/blinds/none/unknown
    open_state = Column(String, nullable=True)  # open/closed/ajar/unknown
