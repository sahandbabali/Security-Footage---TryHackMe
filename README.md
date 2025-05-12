# Security Footage Extractor

A Node.js utility that extracts MJPEG frames from PCAP network capture files and converts them into a video.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or newer)
- [FFmpeg](https://ffmpeg.org/download.html) installed and available in your system PATH

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

## Usage

1. Place your PCAP file in the project directory or update the script to point to your file location
2. Run the script:

```bash
node script.js
```

3. The script will:
   - Extract individual JPEG frames from the MJPEG stream in the PCAP file
   - Save frames as sequential JPG files
   - Combine frames into an MP4 video

## Output

- Individual frames will be saved as `frame_XXXX.jpg` 
- The final video will be saved as `output_video.mp4` 