from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import hashlib
import time
import os
import uuid
import json
import base64
import requests
import math
from typing import Optional
from dotenv import load_dotenv

from database import Base, engine, SessionLocal
from models_db import WindowDB
from schemas import Window
from fastapi.staticfiles import StaticFiles

load_dotenv()

# Crear tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Windows API")

UPLOAD_DIR = "uploads"

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Solo permitir Next.js y Ollama
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:11434",
    "http://127.0.0.1:11434",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(UPLOAD_DIR, exist_ok=True)
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def hash_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def call_ollama_stub(image_path: str):
    api_key = os.getenv("OLLAMA_API_KEY")

    if not api_key:
        raise ValueError("OLLAMA_API_KEY is not set in environment variables")
    
    try:
        # Encode image
        with open(image_path, "rb") as f:
            base64_image = base64.b64encode(f.read()).decode('utf-8')
        
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": "gpt-4o-mini",
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Analyze this window image. Return JSON with: description (short text) and structured_data with fields: daytime (day/night/unknown), location (interior/exterior/unknown), type (fixed/sliding/casement/awning/hung/pivot/unknown), material (wood/aluminum/pvc/unknown), panes (1/2/3/unknown), covering (curtains/blinds/none/unknown), openState (open/closed/ajar/unknown)"},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ]
                }],
                "max_tokens": 300
            }
        )
        
        if response.status_code == 200:
            content = (response.json()['choices'][0]['message']['content']).split("json")[1].strip().strip("'").strip("```").strip()
            # Try to parse JSON from response
            try:
                return json.loads(content)
            except:
                pass
                
    except Exception as e:
        print(f"OpenAI API error: {e}")
    
    # Fallback response
    return {
        "description": "Window detected - analysis unavailable", 
        "structured_data": {
            "daytime": "unknown",
            "location": "unknown",
            "type": "unknown",
            "material": "unknown", 
            "panes": "unknown",
            "covering": "unknown",
            "openState": "unknown",
        },
    }

@app.post("/api/windows")
async def upload_window(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    data = await file.read()

    if not data:
        raise HTTPException(status_code=400, detail="Archivo vacío no permitido.")
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Archivo excede tamaño máximo.")

    file_hash = hash_bytes(data)

    # Buscar duplicados
    duplicates = db.query(WindowDB).filter(WindowDB.hash == file_hash).all()
    is_duplicate = len(duplicates) > 0

    # Guardar archivo en disco
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[-1] or ".jpg"
    filename = f"{file_id}{ext}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as f:
        f.write(data)

    # Llamar IA
    ai_response = call_ollama_stub(path)
    
    # Extract structured data
    description = ai_response.get("description", "")
    structured_data = ai_response.get("structured_data", {})

    window_db = WindowDB(
        id=file_id,
        hash=file_hash,
        isDuplicate=is_duplicate,
        createdAt=int(time.time()),
        imageUrl=f"http://localhost:8000/{UPLOAD_DIR}/{filename}",
        description=description,
        daytime=structured_data.get("daytime"),
        location=structured_data.get("location"),
        window_type=structured_data.get("type"),
        material=structured_data.get("material"),
        panes=structured_data.get("panes"),
        covering=structured_data.get("covering"),
        open_state=structured_data.get("openState"),
    )

    db.add(window_db)
    db.commit()
    db.refresh(window_db)

    return JSONResponse(content=Window.from_orm(window_db).dict())

@app.get("/api/windows")
def get_all(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(12, ge=1, le=100, description="Items per page"),

    # Filters
    daytime: Optional[str] = Query(None, description="Filter by daytime"),
    location: Optional[str] = Query(None, description="Filter by location"),
    type: Optional[str] = Query(None, description="Filter by window type"),
    openState: Optional[str] = Query(None, description="Filter by open state"),
    material: Optional[str] = Query(None, description="Filter by material"),
    panes: Optional[str] = Query(None, description="Filter by panes"),
    covering: Optional[str] = Query(None, description="Filter by covering"),
    isDuplicate: Optional[bool] = Query(None, description="Filter by duplicate status"),
    search: Optional[str] = Query(None, description="Search in descriptions")
):
    query = db.query(WindowDB)
    
    # Apply database-level filters
    if isDuplicate is not None:
        query = query.filter(WindowDB.isDuplicate == isDuplicate)
    
    if daytime:
        query = query.filter(WindowDB.daytime == daytime)
    
    if location:
        query = query.filter(WindowDB.location == location)
    
    if type:
        query = query.filter(WindowDB.window_type == type)
    
    if openState:
        query = query.filter(WindowDB.open_state == openState)
   
    if material:
        query = query.filter(WindowDB.material == material)

    if panes:
        query = query.filter(WindowDB.panes == panes)

    if covering:
        query = query.filter(WindowDB.covering == covering)
    
    if search:
        query = query.filter(WindowDB.description.ilike(f"%{search}%"))
    
    # Get total count for pagination
    total = query.count()
    
    # Apply pagination
    windows = query.order_by(WindowDB.createdAt.desc())\
                  .offset((page - 1) * limit)\
                  .limit(limit)\
                  .all()
    
    return {
        "data": [Window.from_orm(w).dict() for w in windows],
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": math.ceil(total / limit) if total > 0 else 1
    }

@app.get("/api/windows/{id}")
def get_one(id: str, db: Session = Depends(get_db)):
    w = db.query(WindowDB).filter(WindowDB.id == id).first()
    if not w:
        raise HTTPException(status_code=404, detail="No encontrado")
    return Window.from_orm(w).dict()

@app.get("/api/windows/{id}/duplicates")
def get_dupes(id: str, db: Session = Depends(get_db)):
    w = db.query(WindowDB).filter(WindowDB.id == id).first()
    if not w:
        raise HTTPException(status_code=404, detail="No encontrado")
    duplicates = db.query(WindowDB).filter(WindowDB.hash == w.hash, WindowDB.id != id).all()
    return [Window.from_orm(d).dict() for d in duplicates]

@app.get("/health")
def health():
    return {"status": "ok"}