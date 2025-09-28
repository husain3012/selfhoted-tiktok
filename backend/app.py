from fastapi import FastAPI, Query
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

# Pre-scan filenames once on startup, store in memory as index
all_videos = [f for f in os.listdir(VIDEO_DIR) if f.lower().endswith((".mp4", ".webm", ".mov"))]

@app.get("/api/videos")
def get_videos(offset: int = 0, limit: int = 50):
    """
    Return a random chunk of videos
    - offset: ignored here (placeholder for future pagination if needed)
    - limit: number of videos to return
    """
    # Randomly pick `limit` videos
    if limit > len(all_videos):
        limit = len(all_videos)
    random_chunk = random.sample(all_videos, limit)
    return {"videos": [f"/videos/{v}" for v in random_chunk]}
