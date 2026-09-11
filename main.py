import os
import tempfile
import json
import re
from pathlib import Path
from uuid import uuid4
from fastapi import FastAPI, Request, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
import hashlib
import requests
from pydantic import BaseModel




class Data(BaseModel):
    filename: str
    size: int
    totalChunks: int
    fileHash: str
    
CHUNK_SIZE = 50 * 1024 * 1024


os.makedirs("uploads", exist_ok=True)

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

uploading = []





# retry function, check if id exists, if not just start upload again!

def checkUploadIntegrity(id):


    not_recieved = []
    directory = ""
    filename = ""
    userFileHashValue = ""
    chunks_recieved = []
    total_chunks = 0

    for upload in uploading:
        if upload["file_id"] == id:
            filename = upload["name"]
            userFileHashValue = upload["hash"]
            chunks_recieved = upload["received_chunks"]
            total_chunks = upload["total_chunks"]

    print(filename)       
    for i in range(total_chunks):
        if i not in chunks_recieved:
            not_recieved.append(i)
    
    if not_recieved != []:


        return not_recieved
    else:



        


        #better version
        #Search uploaded files!

        hasher = hashlib.sha256()
        #Currently working on hashes, then do concurrent uploads!
        with open(f"uploads/{filename}", "rb") as file:
            while chunk := file.read(1024 * 1024): #cool walrus operator
                hasher.update(chunk)

        hash_value = hasher.hexdigest()


        if hash_value == userFileHashValue:
            print("same file")
        

        
    
    

@app.post("/start-upload/")
def start_upload(file: Data):
    file_id = str(uuid4())


    print(
    f"{file.size} bytes, "
    f"{file.size/1024} KiB, "
    f"{file.size/1024**2} MiB, "
    f"{file.size/1024**3} GiB"
    )    
    
    uploading.append({
        "file_id": file_id, "name": file.filename, "size": file.size, "total_chunks": file.totalChunks, "received_chunks": [], "hash": file.fileHash
    })

    #Create file ...
    with open(f"uploads/{file.filename}", "wb"):
        pass
    
    return {
        "file_id": file_id, "name": file.filename, "size": file.size, "total_chunks": file.totalChunks, "received_chunks": [], "hash": file.fileHash
    }





@app.post("/upload/")
async def upload(
    request: Request,
    name: str = Header(),
    file_id: str = Header(),
    Current_Chunk: int = Header(),
    chunk_end: int = Header(),
    end: bool = Header()
):
    chunk = await request.body()

    # print(name)
    # print(Current_Chunk)
    # print(chunk_end)
    # print(len(chunk))

    recieved = []
    for upload in uploading:
            if upload["file_id"] == file_id:
                upload["received_chunks"].append(Current_Chunk)  
                recieved = upload["received_chunks"]          
    print(recieved)            
    with open(f"uploads/{name}", "r+b") as file:        
        file.seek(Current_Chunk*CHUNK_SIZE)
        file.write(chunk)
    

    print(file_id)                
    if end == True:
        print("file end!")
        
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
    # with open(name)


            # path.mkdir(parents=True, exist_ok=True)
            
#Bad for larger files as this can load a 30gb file into memory!!!!
# import hashlib

# with open("example.pdf", "rb") as file:
#     data = file.read()

# hash_value = hashlib.sha256(data).hexdigest() Convert into human readable letters...

# print(hash_value)


