"use client";

import { useRef } from "react";

const chunkSize = 5 * 1024 * 1024;

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

  

  const response = await fetch("http://localhost:8000/start-upload/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filename: file.name,
      size: file.size,
      totalChunks: totalChunks,
    }),
  });



  console.log(response.status);
  const data = await response.json()
  console.log(data);

  // Since the object fileRef is originally null, we must ASSIGN IT ALL AT ONCE!!!
  fileRef.current = {
    file: file,
    name: file.name,
    id: data.id,
    size: file.size,
    currentChunk: 0,
    totalChunks: totalChunks,
  };
};

const sendFile = async () => {
  if (fileRef.current) {
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
            "Current-Chunk": String(i),
            "chunk-end": String(current.size),
          },
          body: chunk,
        });

        const data = await response.json();
        if (!response.ok) {
          console.log("an error occured");
          console.log(response);
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
            "Current-Chunk": String(i),
            "chunk-end": String(i * chunkSize + chunkSize)
          },
          body: chunk,
        });

        const data = await response.json();
        if (!response.ok) {
          console.log("an error occured");
          console.log(response);
        }
      }
    }
  } else {
    console.log("No file selected!");
  }
};


  return (
    <div>
      <p>yo</p>
      <input type="file" onChange={(event) => setFile(event)} />
      <button onClick={() => sendFile()}>Start upload</button>
    </div>
  );
}

// fetch(url, { method: "POST", headers: { "Upload-ID": uploadId, "Upload-Offset": String(offset), "Content-Type": "application/octet-stream" }, body: chunk });
