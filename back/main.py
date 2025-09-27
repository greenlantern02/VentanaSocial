from fastapi import FastAPI, File, UploadFile, HTTPException, Query, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pymongo import MongoClient
from bson import ObjectId
import hashlib
import time
import os
import uuid
import json
import base64
import requests
import math
import re
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from datetime import datetime
from urllib.parse import unquote

load_dotenv()

# ---- MongoDB Setup ----
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = MongoClient(MONGO_URL)
db = client["windows_app"]
windows_collection = db["windows"]

# ---- FastAPI App ----
app = FastAPI(title="Windows API")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ---- CORS ----
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

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
ALLOWED_MIME_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}

# Security helpers


def is_allowed_file_type(filename: str, content_type: str = None) -> bool:
    """Check if file type is allowed"""
    ext = os.path.splitext(filename.lower())[-1]
    if ext not in ALLOWED_EXTENSIONS:
        return False
    if content_type and content_type not in ALLOWED_MIME_TYPES:
        return False
    return True

def sanitize_string(value: str, max_length: int = 100) -> str:
    """Sanitize string input for MongoDB queries"""
    if not value:
        return ""
    # Remove special regex chars and limit length
    sanitized = re.sub(r'[^\w\s-]', '', value)[:max_length]
    return sanitized.strip()

# ---- Helpers ----
def hash_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def call_ollama_stub(image_path: str):
    api_key = os.getenv("OLLAMA_API_KEY")
    if not api_key:
        return {
            "description": "Window detected - analysis unavailable", 
            "structured_data": {
                "daytime": "unknown", "location": "unknown", "type": "unknown",
                "material": "unknown", "panes": "unknown", "covering": "unknown", "openState": "unknown"
            }
        }
    
    try:
        # Validate image path is within UPLOAD_DIR
        image_path = os.path.abspath(image_path)
        upload_dir = os.path.abspath(UPLOAD_DIR)
        if not image_path.startswith(upload_dir):
            raise ValueError("Invalid image path")
            
        with open(image_path, "rb") as f:
            base64_image = base64.b64encode(f.read()).decode("utf-8")
        
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
            },
            timeout=30  # Add timeout
        )
        if response.status_code == 200:
            content = (response.json()["choices"][0]["message"]["content"]).split("json")[-1].strip().strip("'").strip("```").strip()
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                pass
    except Exception as e:
        # Don't expose internal error details
        print(f"AI analysis error: {e}")

    # fallback
    return {
        "description": "Window detected - analysis unavailable",
        "structured_data": {
            "daytime": "unknown", "location": "unknown", "type": "unknown",
            "material": "unknown", "panes": "unknown", "covering": "unknown", "openState": "unknown"
        }
    }

# ---- Routes ----
@app.post("/api/windows")
async def upload_window(file: UploadFile = File(...)):
    # Security validations
    if not file.filename:
        raise HTTPException(status_code=400, detail="Nombre de archivo requerido")
    
    if not is_allowed_file_type(file.filename, file.content_type):
        raise HTTPException(status_code=400, detail="Tipo de archivo no permitido")
    
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Archivo vacío no permitido")
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Archivo excede tamaño máximo")

    file_hash = hash_bytes(data)

    # Check duplicates by hash
    existing = windows_collection.find_one({"hash": file_hash})
    is_duplicate = existing is not None

    if is_duplicate:
        filename = os.path.basename(existing["imageUrl"])
        description = existing.get("description", "")
        structured = existing.get("structured_data", {})
    else:
        file_id = str(uuid.uuid4())
        ext = os.path.splitext(file.filename.lower())[-1] or ".jpg"
        if ext not in ALLOWED_EXTENSIONS:
            ext = ".jpg"
        filename = f"{file_id}{ext}"
        path = os.path.join(UPLOAD_DIR, filename)

        with open(path, "wb") as f:
            f.write(data)

        # AI analysis
        ai_response = call_ollama_stub(path)
        description = ai_response.get("description", "")[:500]  # Limit description length
        structured = ai_response.get("structured_data", {})

    # Build document
    doc = {
        "_id": str(uuid.uuid4()),
        "hash": file_hash,
        "isDuplicate": is_duplicate,
        "createdAt": int(time.time()),
        "imageUrl": f"http://localhost:8000/uploads/{filename}",
        "description": description,
        "structured_data": {
            "daytime": structured.get("daytime"),
            "location": structured.get("location"),
            "type": structured.get("type"),
            "material": structured.get("material"),
            "panes": structured.get("panes"),
            "covering": structured.get("covering"),
            "openState": structured.get("openState"),
        }
    }

    windows_collection.insert_one(doc)
    return JSONResponse(content=doc)

@app.get("/uploads/{filename}")
async def serve_upload(
    filename: str,
    w: Optional[int] = Query(None, ge=1, le=2000, description="Width for image resizing"),
    h: Optional[int] = Query(None, ge=1, le=2000, description="Height for image resizing"), 
    q: Optional[int] = Query(None, ge=1, le=100, description="Image quality")
):
    filename = unquote(filename)

    if not filename or '..' in filename or '/' in filename or '\\' in filename or not bool(re.match(r'^[a-zA-Z0-9._-]+$', filename)):
        print("security vulnerability")
        raise HTTPException(status_code=404, detail="File not found")
    
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    try:
        file_path = os.path.abspath(file_path)
        upload_dir = os.path.abspath(UPLOAD_DIR)
        if not file_path.startswith(upload_dir) or not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path)

@app.get("/api/windows")
def get_all(
    page: int = Query(1, ge=1, le=1000),
    limit: int = Query(12, ge=1, le=100),
    daytime: Optional[str] = Query(None, max_length=20),
    location: Optional[str] = Query(None, max_length=20),
    type: Optional[str] = Query(None, max_length=20),
    openState: Optional[str] = Query(None, max_length=20),
    material: Optional[str] = Query(None, max_length=20),
    panes: Optional[str] = Query(None, max_length=10),
    covering: Optional[str] = Query(None, max_length=20),
    isDuplicate: Optional[bool] = None,
    search: Optional[str] = Query(None, max_length=100),
):
    query = {}
    if isDuplicate is not None:
        query["isDuplicate"] = isDuplicate
    
    # Sanitize and validate inputs
    valid_values = {
        'daytime': ['day', 'night', 'unknown'],
        'location': ['interior', 'exterior', 'unknown'],
        'type': ['fixed', 'sliding', 'casement', 'awning', 'hung', 'pivot', 'unknown'],
        'material': ['wood', 'aluminum', 'pvc', 'unknown'],
        'panes': ['1', '2', '3', 'unknown'],
        'covering': ['curtains', 'blinds', 'none', 'unknown'],
        'openState': ['open', 'closed', 'ajar', 'unknown']
    }
    
    # Build query with validation
    if daytime and daytime in valid_values['daytime']:
        query["structured_data.daytime"] = daytime
    if location and location in valid_values['location']:
        query["structured_data.location"] = location
    if type and type in valid_values['type']:
        query["structured_data.type"] = type
    if openState and openState in valid_values['openState']:
        query["structured_data.openState"] = openState
    if material and material in valid_values['material']:
        query["structured_data.material"] = material
    if panes and panes in valid_values['panes']:
        query["structured_data.panes"] = panes
    if covering and covering in valid_values['covering']:
        query["structured_data.covering"] = covering
    
    if search:
        sanitized_search = sanitize_string(search)
        if sanitized_search:
            query["description"] = {"$regex": sanitized_search, "$options": "i"}

    try:
        total = windows_collection.count_documents(query)
        cursor = windows_collection.find(query).sort("createdAt", -1).skip((page - 1) * limit).limit(limit)
        results = list(cursor)
    except Exception as e:
        print(f"Database query error: {e}")
        raise HTTPException(status_code=500, detail="Database error")

    return {
        "data": results,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": math.ceil(total / limit) if total > 0 else 1,
    }

@app.get("/api/windows/{id}")
def get_one(id: str):
    # Validate ID format (UUID)
    try:
        uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    try:
        doc = windows_collection.find_one({"_id": id})
        if not doc:
            raise HTTPException(status_code=404, detail="No encontrado")
        return doc
    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.get("/api/windows/{id}/duplicates")
def get_dupes(id: str):
    # Validate ID format (UUID)
    try:
        uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    try:
        doc = windows_collection.find_one({"_id": id})
        if not doc:
            raise HTTPException(status_code=404, detail="No encontrado")
        duplicates = list(windows_collection.find({"hash": doc["hash"], "_id": {"$ne": id}}))
        return duplicates
    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.get("/health")
def health():
    return {"status": "ok"}