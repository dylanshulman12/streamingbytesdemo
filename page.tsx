"use client";

import { useRef } from "react";
import { sha256 } from "js-sha256"; //import incremental hash lib

// const chunkSize = 5 * 1024 * 1024; //this is 5 MiB so lets try something a bit more...
const chunkSize = 50 * 1024 * 1024; 



// My algorithm!

// 0: 0 -> chunksize, 1: 1*chunksize, 1*chunksize + chunksize, 2: 2*chunksize, 2*chunksize + chunksize,
//but overflow
//lets say 10 bytes in total, each chunk is 3
// if last chunk; totalChunks == currentChunk, first 0,3; 3,6; 6,9; lastchunk 9,fileSize?
//algorithm:

//filesize / chunksize. math.isnotint(answ) ex. 10/3 = 3.333 then total chunks = math.floor(answ) + 1
// for int i = 0; < totalchunks; i++
//if i == totalchunks-1: sliceandsend(i*chunksize, filesize) else
// sliceandsend(i*chunksize, i*chunksize+chunksize)

type fileState = {
  file: File;
  name: string;
  id: string;
  size: number;
  currentChunk: number;
  totalChunks: number;
};

export default function Home() {
  


const fileRef = useRef<fileState | null>(null);
const fileHash = useRef<Promise <String> | null>(null);


async function getHash(file: fileState)  {
 
  const hash = sha256.create();
  // console.log(hash);
  //hash 10 mib at once
  for (let i = 0; i < file.size; i+=10*1024*1024) { //10mib at once!
    
    const stuff = file.slice(i,i+10*1024*1024) // not read over errors as slice just gives you whatever is left on the tailend!

    const stuffArray = new Uint8Array (await stuff.arrayBuffer() )
    // console.log(stuff.size)
    hash.update(stuffArray)
    
    // console.log(hash)
  
  }

  


  return hash.hex()
}

async function createFile(file: fileState, fileHash: string) {
    const response = await fetch("http://localhost:8000/start-upload/", {
      
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: file.name,
        size: file.size,
        totalChunks: file.totalChunks,
        fileHash: fileHash
      }),
    });
    const data = await response.json()

    return data
  }


const setFile = async (event) => {
  const file = event.target.files?.[0];
  const division = file.size / chunkSize;
  let totalChunks: number;

  if (Number.isInteger(division)) {
    totalChunks = division;
  } else {
    totalChunks = Math.floor(division) + 1;
  }

  
  console.log(file.name);
  console.log(file.size);
  console.log(file.type);
  console.log("chunks!");
  console.log(totalChunks);
   
  // Since the object fileRef is originally null, we must ASSIGN IT ALL AT ONCE!!! But we dont know id yet so..
  fileRef.current = {
    file: file,
    name: file.name,
    id: "",
    size: file.size,
    currentChunk: 0,
    totalChunks: totalChunks,
  };

   fileHash.current = getHash(file)
  
};

const sendFile = async () => {
 
  
  if (fileRef.current) {
    const file = fileRef.current.file
    const hash = await fileHash.current
    const data = await createFile(fileRef.current, hash)
    console.log(data.status);
    fileRef.current.id = data.file_id



    const current = fileRef.current
    for (let i = 0; i < current.totalChunks; i++) {
      if (i === current.totalChunks - 1) {
        const chunk = current.file.slice(
          i * chunkSize,
          current.size,
        );



        const response = await fetch("http://localhost:8000/upload/", {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "name": String(current.name),
            "file-id": String(fileRef.current.id),
            "Current-Chunk": String(i),
            "chunk-end": String(current.size),
            "end": String(true)
          },
          body: chunk,
        });

        const data = await response.json();
        if (!response.ok) {
          console.log("an error occured");
          console.log(data);
        }
      } else {
        const chunk = current.file.slice(
          i * chunkSize,
          i * chunkSize + chunkSize,
        );
        const response = await fetch("http://localhost:8000/upload/", {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "name": String(current.name),
            "file-id": String(current.id),
            "current-chunk": String(i),
            "chunk-end": String(i * chunkSize + chunkSize),
            "end": "false"
          },
          body: chunk,
        }
      )

        const data = await response.json();
        if (!response.ok) {
          console.log("an error occured");
          console.log(data);
        }

      }
    }
  } else {
    console.log("No file selected!");
  }

};


  return (
    <div>
      <p>upload a folder</p>
      <input type="file" multiple {...({ webkitdirectory: "" })} onChange={(event) => setFile(event)} />
      <button onClick={() => sendFile()}>Start upload</button>


      <p>upload files</p>
      <input type="file" multiple onChange={(event) => setFile(event)} />
      <button onClick={() => sendFile()}>Start upload</button>
    </div>
  );
}

// fetch(url, { method: "POST", headers: { "Upload-ID": uploadId, "Upload-Offset": String(offset), "Content-Type": "application/octet-stream" }, body: chunk });

