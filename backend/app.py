from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os, random

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_methods=["*"],
    allow_headers=["*"],
)

# Video/Media directory
VIDEO_DIR = "/videos"
app.mount("/videos", StaticFiles(directory=VIDEO_DIR), name="videos")

# Pre-scan filenames once on startup
# Include videos, gifs, images
all_media = [
    f
    for f in os.listdir(VIDEO_DIR)
    if f.lower().endswith((".mp4", ".webm", ".mov", ".gif", ".jpg", ".jpeg", ".png"))
]

@app.get("/api/videos")
def get_videos(offset: int = 0, limit: int = 50):
    """
    Return a random chunk of media files
    - offset: ignored (placeholder for future pagination)
    - limit: number of files to return
    """
    count = len(all_media)
    if count == 0:
        return {"videos": []}

    if limit > count:
        limit = count

    random_chunk = random.sample(all_media, limit)
    return {"videos": [f"/videos/{v}" for v in random_chunk]}
