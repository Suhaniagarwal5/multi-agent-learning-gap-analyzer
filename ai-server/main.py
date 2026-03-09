from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import socketio
import json
import os
from typing import List

from core.hints import get_level_hint 
from core.search import perform_fuzzy_search, fuzzy_match_strings

app = FastAPI()

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class SearchRequest(BaseModel):
    query: str
    topic: str

class StringMatchRequest(BaseModel):
    query: str
    targets: List[str]

# 1. API FOR QUESTIONS (Page 3)
@app.post("/api/search")
async def search_endpoint(req: SearchRequest):
    try:
        file_path = os.path.join(os.path.dirname(__file__), "problems.json")
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        results = perform_fuzzy_search(req.query, req.topic, data)
        return {"results": results}
    except Exception as e:
        return {"error": str(e), "results": []}

# 2. NAYI API FOR COURSES & CATEGORIES (Page 1 & 2)
@app.post("/api/match-strings")
async def match_strings_endpoint(req: StringMatchRequest):
    # Frontend se aayi list of strings ko Levenshtein logic se filter karega
    results = fuzzy_match_strings(req.query, req.targets)
    return {"results": results}

@sio.on("join_problem")
async def handle_join(sid, data):
    room = data['problemId']
    sio.enter_room(sid, room)

@sio.on("lens_frame")
async def handle_lens_frame(sid, data):
    frame = data['frame']
    problem_id = data['problemId']
    hint = get_level_hint(1, "", "Visual Analysis", "User shared a frame", frame)
    await sio.emit("lens_hint", {"hint": hint}, room=problem_id)

app.mount("/ws", socket_app)


# Run command terminal ke liye:
# uvicorn main:app --host 0.0.0.0 --port 8000 --reload