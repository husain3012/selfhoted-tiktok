from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os, random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

VIDEO_DIR = "/videos"
app.mount("/videos", StaticFiles(directory=VIDEO_DIR), name="videos")

@app.get("/api/videos")
def get_videos():
    files = [f"/videos/{f}" for f in os.listdir(VIDEO_DIR) if f.lower().endswith((".mp4",".webm",".mov"))]
    random.shuffle(files)
    return {"videos": files}
