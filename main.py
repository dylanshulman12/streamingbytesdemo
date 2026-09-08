import os
import tempfile
import json
import re
from pathlib import Path
from uuid import uuid4
from fastapi import FastAPI, Request, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse

import requests
from pydantic import BaseModel




class Data(BaseModel):
    filename: str
    size: int
    totalChunks: int



app = FastAPI()
# os.makedirs("video", exist_ok=True)
# app.mount("/video", StaticFiles(directory="video"), name="video")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://192.168.7.206:3000"],  # React app origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    
)

files = []

@app.post("/start-upload/")
def start_upload(file: Data):
    print(file.filename)
    print(
    f"{file.size} bytes, "
    f"{file.size/1024} KiB, "
    f"{file.size/1024**2} MiB, "
    f"{file.size/1024**3} GiB"
    )    

    files.append({
        "name": file.filename, "size": file.size, "totalChunks": file.totalChunks
    })
    print(f"total chunks: {type(file.totalChunks)}")
    #Create file ...
    with open(f"uploads/{file.filename}", "wb"):
        pass
    
    return {"id": uuid4(), "totalChunks": file.totalChunks}





@app.post("/upload/")
async def upload(
    request: Request,
    name: str = Header(),
    Current_Chunk: int = Header(),
    chunk_end: int = Header(),
):
    chunk = await request.body()

    print(name)
    print(Current_Chunk)
    print(chunk_end)
    print(len(chunk))

    with open(f"uploads/{name}", "r+b") as file:        
        file.seek(Current_Chunk*(5*1024*1024))
        file.write(chunk)
        
    if Current_Chunk == files[0]["totalChunks"]-1:
        print("file transfered successfully!")
    # with open(name)


            
