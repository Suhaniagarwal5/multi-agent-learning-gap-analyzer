import socketio
import json
import os
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from core.ai_tutor import get_level_hint
from core.search import perform_fuzzy_search, fuzzy_match_strings

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
fastapi_app = FastAPI()

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchRequest(BaseModel):
    query: str
    topic: str

class StringMatchRequest(BaseModel):
    query: str
    targets: List[str]

class HintRequest(BaseModel):
    level: int = 1
    code: str = ""
    problem: str = ""
    description: str = ""
    voice_query: str = "" 

@fastapi_app.post("/ai/hint")
async def ai_hint(req: HintRequest):
    hint = get_level_hint(
        level=req.level, 
        code=req.code, 
        problem_title=req.problem, 
        description=req.description,
        voice_query=req.voice_query # Pass it to ai_tutor
    )
    return {"hint": hint}

@fastapi_app.post("/api/search")
async def search_endpoint(req: SearchRequest):
    try:
        file_path = os.path.join(os.path.dirname(__file__), "problems.json")
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        results = perform_fuzzy_search(req.query, req.topic, data)
        return {"results": results}
    except Exception as e:
        return {"error": str(e), "results": []}

@fastapi_app.post("/api/match-strings")
async def match_strings_endpoint(req: StringMatchRequest):
    results = fuzzy_match_strings(req.query, req.targets)
    return {"results": results}

@fastapi_app.get("/health")
async def health():
    return {"status": "ok"}

@sio.on("connect")
async def handle_connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.on("disconnect")
async def handle_disconnect(sid):
    print(f"Client disconnected: {sid}")

@sio.on("join_problem")
async def handle_join(sid, data):
    room = data['problemId']
    await sio.enter_room(sid, room)
    print(f"Client {sid} joined room: {room}")

@sio.on("lens_frame")
async def handle_lens_frame(sid, data):
    frame = data['frame']
    problem_id = data['problemId']
    hint = get_level_hint(
        level=1,
        code="",
        problem_title="Visual Analysis",
        description="User shared a frame via Sutra Lens",
        image_data=frame
    )
    await sio.emit("lens_hint", {"hint": hint}, room=problem_id)

app = socketio.ASGIApp(
    sio,
    other_asgi_app=fastapi_app,
    socketio_path='/ws/socket.io'
)
# Terminal mein run karne ke liye:
# cd ai-server
# uvicorn main:app --reload

# for ip config
# uvicorn main:app --host 0.0.0.0 --port 8000 --reload