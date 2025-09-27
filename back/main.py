from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.responses import JSONResponse
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
from typing import Optional
from dotenv import load_dotenv
from datetime import datetime

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

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

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

# ---- Helpers ----
def hash_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def call_ollama_stub(image_path: str):
    api_key = os.getenv("OLLAMA_API_KEY")
    if not api_key:
        raise ValueError("OLLAMA_API_KEY is not set in environment variables")
    
    try:
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
            }
        )
        if response.status_code == 200:
            content = (response.json()["choices"][0]["message"]["content"]).split("json")[-1].strip().strip("'").strip("```").strip()
            try:
                return json.loads(content)
            except:
                pass
    except Exception as e:
        print(f"OpenAI API error: {e}")

    # fallback
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

# ---- Routes ----
@app.post("/api/windows")
async def upload_window(file: UploadFile = File(...)):
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Archivo vacío no permitido.")
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Archivo excede tamaño máximo.")

    file_hash = hash_bytes(data)

    # Check duplicates by hash
    existing = windows_collection.find_one({"hash": file_hash})
    is_duplicate = existing is not None

    # Save file
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[-1] or ".jpg"
    filename = f"{file_id}{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(data)

    # AI analysis
    ai_response = call_ollama_stub(path)
    description = ai_response.get("description", "")
    structured = ai_response.get("structured_data", {})

    doc = {
        "_id": file_id,
        "hash": file_hash,
        "isDuplicate": is_duplicate,
        "createdAt": int(time.time()),
        "imageUrl": f"http://localhost:8000/{UPLOAD_DIR}/{filename}",
        "description": description,
        "daytime": structured.get("daytime"),
        "location": structured.get("location"),
        "window_type": structured.get("type"),
        "material": structured.get("material"),
        "panes": structured.get("panes"),
        "covering": structured.get("covering"),
        "open_state": structured.get("openState"),
    }

    windows_collection.insert_one(doc)
    return JSONResponse(content=doc)

@app.get("/api/windows")
def get_all(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    daytime: Optional[str] = None,
    location: Optional[str] = None,
    type: Optional[str] = None,
    openState: Optional[str] = None,
    material: Optional[str] = None,
    panes: Optional[str] = None,
    covering: Optional[str] = None,
    isDuplicate: Optional[bool] = None,
    search: Optional[str] = None,
):
    query = {}
    if isDuplicate is not None:
        query["isDuplicate"] = isDuplicate
    if daytime: query["daytime"] = daytime
    if location: query["location"] = location
    if type: query["window_type"] = type
    if openState: query["open_state"] = openState
    if material: query["material"] = material
    if panes: query["panes"] = panes
    if covering: query["covering"] = covering
    if search:
        query["description"] = {"$regex": search, "$options": "i"}

    total = windows_collection.count_documents(query)
    cursor = windows_collection.find(query).sort("createdAt", -1).skip((page - 1) * limit).limit(limit)
    results = list(cursor)

    return {
        "data": results,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": math.ceil(total / limit) if total > 0 else 1,
    }

@app.get("/api/windows/{id}")
def get_one(id: str):
    doc = windows_collection.find_one({"_id": id})
    if not doc:
        raise HTTPException(status_code=404, detail="No encontrado")
    return doc

@app.get("/api/windows/{id}/duplicates")
def get_dupes(id: str):
    doc = windows_collection.find_one({"_id": id})
    if not doc:
        raise HTTPException(status_code=404, detail="No encontrado")
    duplicates = list(windows_collection.find({"hash": doc["hash"], "_id": {"$ne": id}}))
    return duplicates

@app.get("/health")
def health():
    return {"status": "ok"}
