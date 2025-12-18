/**
 * Create video from frames using FFmpeg
 * 
 * This script combines the captured frames into an MP4 video file.
 * Requires FFmpeg to be installed and available in PATH.
 * 
 * Usage:
 *   npm run create-video
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRAMES_DIR = path.join(__dirname, '..', 'screenshots', 'video-frames');
const OUTPUT_VIDEO = path.join(__dirname, '..', 'screenshots', 'demo-video.mp4');
const FPS = 30;

async function createVideo() {
  console.log('🎬 Creating video from frames...\n');
  
  // Check if frames directory exists
  if (!fs.existsSync(FRAMES_DIR)) {
    console.error(`❌ Error: Frames directory not found: ${FRAMES_DIR}`);
    console.error('   Please run "npm run record-video" first to capture frames.\n');
    process.exit(1);
  }
  
  // Check if frames exist
  const frames = fs.readdirSync(FRAMES_DIR).filter(f => f.endsWith('.png'));
  if (frames.length === 0) {
    console.error(`❌ Error: No frames found in ${FRAMES_DIR}`);
    console.error('   Please run "npm run record-video" first to capture frames.\n');
    process.exit(1);
  }
  
  console.log(`📁 Found ${frames.length} frames`);
  console.log(`📹 Creating video at ${FPS}fps...\n`);
  
  // FFmpeg command
  // Use forward slashes for Windows compatibility in the pattern
  const framesPattern = path.join(FRAMES_DIR, 'frame-%05d.png').replace(/\\/g, '/');
  const outputPath = OUTPUT_VIDEO.replace(/\\/g, '/');
  
  const ffmpegCommand = `ffmpeg -r ${FPS} -i "${framesPattern}" -c:v libx264 -pix_fmt yuv420p -y "${outputPath}"`;
  
  try {
    console.log('⏳ Running FFmpeg...');
    const { stdout, stderr } = await execAsync(ffmpegCommand);
    
    if (stderr && !stderr.includes('frame=')) {
      console.warn('⚠️  FFmpeg warnings:', stderr);
    }
    
    if (fs.existsSync(OUTPUT_VIDEO)) {
      const stats = fs.statSync(OUTPUT_VIDEO);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`\n✅ Video created successfully!`);
      console.log(`📁 Location: ${OUTPUT_VIDEO}`);
      console.log(`📊 Size: ${fileSizeMB} MB`);
      console.log(`📹 Format: MP4 (H.264, ${FPS}fps, 1280x720)\n`);
    } else {
      console.error('❌ Error: Video file was not created');
      console.error('   Check FFmpeg output above for errors.\n');
      process.exit(1);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('❌ Error: FFmpeg not found!');
      console.error('\n📥 Please install FFmpeg:');
      console.error('   Windows: Download from https://ffmpeg.org/download.html');
      console.error('   macOS:   brew install ffmpeg');
      console.error('   Linux:   sudo apt install ffmpeg (or equivalent)\n');
      console.error('   After installing, make sure FFmpeg is in your PATH.\n');
    } else {
      console.error('❌ Error creating video:', error.message);
      if (error.stderr) {
        console.error('\nFFmpeg error output:');
        console.error(error.stderr);
      }
      console.error();
    }
    process.exit(1);
  }
}

createVideo();

