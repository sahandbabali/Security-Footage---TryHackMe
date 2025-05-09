const fs = require("fs");
const path = require("path");
const PcapParser = require("pcap-parser");
const { exec } = require("child_process");

const parser = PcapParser.parse(
  fs.createReadStream("security-footage-1648933966395.pcap")
);
let tcpData = Buffer.alloc(0);

parser.on("packet", (packet) => {
  // Only consider TCP packets
  if (!packet.data) return;

  // Ethernet header: 14 bytes
  // IP header: typically 20 bytes (without options)
  // TCP header: typically 20 bytes (without options)
  const ethHeaderLen = 14;
  const ipHeaderLen = (packet.data[ethHeaderLen] & 0x0f) * 4;
  const tcpHeaderOffset = ethHeaderLen + ipHeaderLen;
  const tcpHeaderLen = ((packet.data[tcpHeaderOffset + 12] & 0xf0) >> 4) * 4;

  const payloadOffset = ethHeaderLen + ipHeaderLen + tcpHeaderLen;
  const payload = packet.data.slice(payloadOffset);

  if (payload.length > 0) {
    tcpData = Buffer.concat([tcpData, payload]);
  }
});

parser.on("end", () => {
  console.log("Finished reading PCAP. Processing MJPEG stream...");
  extractFramesFromBuffer(tcpData);
});

function extractFramesFromBuffer(buffer) {
  const boundary = "--BoundaryString";
  const boundaryBuf = Buffer.from(boundary);
  let frameCount = 0;
  let offset = 0;

  while ((offset = buffer.indexOf(boundaryBuf, offset)) !== -1) {
    const nextBoundary = buffer.indexOf(
      boundaryBuf,
      offset + boundaryBuf.length
    );
    if (nextBoundary === -1) break;

    const part = buffer.slice(offset, nextBoundary);
    const contentLengthMatch = part
      .toString()
      .match(/Content-Length:\s*(\d+)/i);
    if (!contentLengthMatch) {
      offset = nextBoundary;
      continue;
    }

    const contentLength = parseInt(contentLengthMatch[1], 10);
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) {
      offset = nextBoundary;
      continue;
    }

    const jpegStart = offset + headerEnd + 4;
    const jpegEnd = jpegStart + contentLength;
    const jpegData = buffer.slice(jpegStart, jpegEnd);

    const filename = path.join(
      __dirname,
      `frame_${frameCount.toString().padStart(4, "0")}.jpg`
    );
    fs.writeFileSync(filename, jpegData);
    console.log(`Saved frame ${frameCount}`);
    frameCount++;

    offset = nextBoundary;
  }

  console.log(`Extraction complete: ${frameCount} frames saved.`);
  createVideoFromFrames();
}

function createVideoFromFrames() {
  const fps = 10; // Change FPS to match your stream's real rate
  const outputFile = "output_video.mp4";

  const cmd = `ffmpeg -y -framerate ${fps} -i frame_%04d.jpg -c:v libx264 -pix_fmt yuv420p ${outputFile}`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ FFmpeg error: ${error.message}`);
      return;
    }
    console.log(`🎞️ Video created successfully: ${outputFile}`);
  });
}
