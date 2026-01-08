// self.onmessage = (event) => {
//   console.log(`Message received from the worker..`);
//
//   const result = event.data * 2;
//   TODO : Give it proper types
//   self.postMessage(result);

let chunks: any = [];
let startTime: number;
let fileSize;
let chunkSize = 40000;
let currentChunk = 0;
let totalChunks: any;
let currentProgress = 0;
let prevProgress = 0;

self.addEventListener("message", (e) => {
  if (e.data.status == "file-info") {
    fileSize = e.data.fileSize;
  } else if (e.data.status == "file-complete") {
    const blob = new Blob(chunks, { type: "application/octet-stream" });
    self.postMessage({
      blob: blob,
    });
    chunks = [];
    currentChunk = 0;

    // Handling chunking
  } else {
    console.log("hey");
    if (!startTime) {
      startTime = performance.now();
    }
    chunks.push(new Uint8Array(e.data.data));

    currentChunk++;
  }
});
