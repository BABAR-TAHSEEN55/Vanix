// self.onmessage = (event) => {
//   console.log(`Message received from the worker..`);
//
//   const result = event.data * 2;

//   self.postMessage(result);

let chunks: Uint8Array<ArrayBuffer>[] = [];
let startTime: number;
let fileSize;
const chunkSize = 40000;
let currentChunk = 0;
// let totalChunks: any;
// const currentProgress = 0;
// const prevProgress = 0;

self.addEventListener("message", (e) => {
  if (e.data.status == "file-info") {
    fileSize = e.data.fileSize;
    console.log(fileSize);
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
