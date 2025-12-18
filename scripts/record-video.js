/**
 * Screen Recording Demo Video Script
 * 
 * Records a 15-second demo video of the GeoIntel dashboard in Facebook video size.
 * 
 * Usage:
 *   npm run dev          # Start dev server in one terminal
 *   node scripts/record-video.js  # Run this script in another terminal
 * 
 * Or with auto-start:
 *   node scripts/record-video.js --start-server
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Simple debug logging function
 */
function debugLog(context, message, data = {}, level = 'I') {
  if (process.env.DEBUG || level === 'A') {
    console.log(`[${context}] ${message}`, data);
  }
}

// Configuration
const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const VIDEO_DIR = path.join(__dirname, '..', 'screenshots');
const VIDEO_DURATION = 15000; // 15 seconds in milliseconds
// Facebook video size: 1280 x 720 pixels (16:9 aspect ratio, landscape)
const VIEWPORT_WIDTH = 1280;
const VIEWPORT_HEIGHT = 720;

// Create video directory
if (!fs.existsSync(VIDEO_DIR)) {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
}

/**
 * Helper function for delays
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for map to fully load
 */
async function waitForMapLoad(page) {
  // Wait for the map container to be visible
  await page.waitForSelector('.leaflet-container', { timeout: 30000 });
  
  // Wait for loading spinner to disappear
  await page.waitForFunction(
    () => {
      const spinner = document.querySelector('.animate-spin');
      return !spinner || spinner.offsetParent === null;
    },
    { timeout: 30000 }
  );
  
  // Additional wait for map tiles to load
  await delay(1000);
}

/**
 * Change data layer via sidebar (radio buttons)
 */
async function setDataLayer(page, layerId) {
  try {
    // Find the radio input by value
    const radioSelector = `input[type="radio"][name="dataLayer"][value="${layerId}"]`;
    const radio = await page.$(radioSelector);
    
    if (radio) {
      await radio.click();
      await delay(1000); // Wait for layer to update
      await waitForMapLoad(page);
      return true;
    } else {
      // Fallback: find by label text
      const layerNames = {
        population: 'Population Density',
        avg_income: 'Average Income',
        competitors: 'Competitor Density',
        site_suitability_score: 'Site Suitability Score',
        night_lights: 'Night Lights Intensity',
        public_services: 'Public Services'
      };
      
      const labels = await page.$$('label');
      for (const label of labels) {
        const text = await page.evaluate(el => el.textContent?.trim(), label);
        if (text === layerNames[layerId]) {
          await label.click();
          await delay(1000);
          await waitForMapLoad(page);
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    console.warn(`Error setting layer ${layerId}:`, error.message);
    return false;
  }
}

/**
 * Change boundary type via sidebar
 */
async function setBoundaryType(page, boundaryId) {
  // Find button by text content matching boundary name
  const boundaryNames = {
    district: 'District',
    parliament: 'Parliament',
    dun: 'DUN'
  };
  
  const buttons = await page.$$('button');
  for (const button of buttons) {
    const text = await page.evaluate(el => el.textContent?.trim(), button);
    if (text === boundaryNames[boundaryId]) {
      await button.click();
      await delay(2000); // Wait for boundary data to load
      await waitForMapLoad(page);
      return;
    }
  }
  
  console.warn(`Could not find boundary button for: ${boundaryId}`);
}

/**
 * Click on a DUN boundary/polygon on the map to show info panel
 * Finds actual DUN polygon elements and clicks on them
 */
async function clickMapFeature(page, attempt = 0) {
  try {
    // Wait for map to be fully loaded
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    await delay(500);
    
    // Find DUN polygon elements (Leaflet renders GeoJSON as SVG paths)
    const clicked = await page.evaluate(() => {
      // Find all SVG paths that represent map features (DUN boundaries)
      const paths = document.querySelectorAll('svg.leaflet-zoom-animated path');
      
      if (paths.length === 0) {
        return { success: false, message: 'No map paths found' };
      }
      
      // Get visible paths (filter out hidden ones)
      const visiblePaths = Array.from(paths).filter(path => {
        const style = window.getComputedStyle(path);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      });
      
      if (visiblePaths.length === 0) {
        return { success: false, message: 'No visible map paths found' };
      }
      
      // Get a random visible path (or try different ones)
      const randomIndex = Math.floor(Math.random() * visiblePaths.length);
      const targetPath = visiblePaths[randomIndex];
      
      // Get the bounding box of the path
      const bbox = targetPath.getBBox();
      if (!bbox || bbox.width === 0 || bbox.height === 0) {
        return { success: false, message: 'Path has invalid bounding box' };
      }
      
      // Get the SVG element to convert coordinates
      const svg = targetPath.closest('svg');
      if (!svg) {
        return { success: false, message: 'Could not find SVG element' };
      }
      
      // Get the point in the center of the path's bounding box
      const point = svg.createSVGPoint();
      point.x = bbox.x + bbox.width / 2;
      point.y = bbox.y + bbox.height / 2;
      
      // Convert to screen coordinates
      const screenPoint = point.matrixTransform(svg.getScreenCTM());
      
      return {
        success: true,
        x: screenPoint.x,
        y: screenPoint.y,
        pathIndex: randomIndex,
        totalPaths: visiblePaths.length
      };
    });
    
    if (!clicked.success) {
      // Fallback to coordinate-based clicking if we can't find paths
      if (attempt < 3) {
        console.warn(`Could not find DUN paths (attempt ${attempt + 1}/3), trying fallback...`);
        const mapContainer = await page.$('.leaflet-container');
        if (mapContainer) {
          const box = await mapContainer.boundingBox();
          if (box) {
            // Try different coordinates
            const xPercent = 0.4 + (attempt * 0.1);
            const yPercent = 0.35 + (attempt * 0.1);
            const clickX = box.x + box.width * xPercent;
            const clickY = box.y + box.height * yPercent;
            
            await page.mouse.move(clickX, clickY);
            await delay(200);
            await page.mouse.click(clickX, clickY);
            await delay(800);
            return;
          }
        }
      }
      console.warn(`Could not click DUN feature: ${clicked.message}`);
      return;
    }
    
    // Move mouse to the DUN polygon center and click
    await page.mouse.move(clicked.x, clicked.y);
    await delay(300); // Pause to show mouse movement
    await page.mouse.click(clicked.x, clicked.y);
    await delay(1000); // Wait for info panel to appear
    
    console.log(`✓ Clicked on DUN polygon ${clicked.pathIndex + 1}/${clicked.totalPaths}`);
    
  } catch (error) {
    console.warn('Could not click map feature:', error.message);
    // Fallback to simple coordinate click
    const mapContainer = await page.$('.leaflet-container');
    if (mapContainer) {
      const box = await mapContainer.boundingBox();
      if (box) {
        await page.mouse.click(
          box.x + box.width * 0.5,
          box.y + box.height * 0.4
        );
        await delay(800);
      }
    }
  }
}

/**
 * Click on multiple DUN boundaries to show different info panels
 */
async function clickMultipleMapFeatures(page) {
  try {
    // Click on 3 different DUN boundaries
    for (let i = 0; i < 3; i++) {
      await clickMapFeature(page, i);
      await delay(800); // Brief pause between clicks to show different popups
    }
  } catch (error) {
    console.warn('Could not click multiple map features:', error.message);
  }
}

/**
 * Zoom in on the map
 */
async function zoomInMap(page) {
  try {
    const mapContainer = await page.$('.leaflet-container');
    if (mapContainer) {
      const box = await mapContainer.boundingBox();
      if (box) {
        // Double-click to zoom in
        const centerX = box.x + box.width * 0.5;
        const centerY = box.y + box.height * 0.5;
        await page.mouse.click(centerX, centerY, { clickCount: 2 });
        await delay(1000); // Wait for zoom animation
      }
    }
  } catch (error) {
    console.warn('Could not zoom in:', error.message);
  }
}

/**
 * Zoom out on the map
 */
async function zoomOutMap(page) {
  try {
    const mapContainer = await page.$('.leaflet-container');
    if (mapContainer) {
      const box = await mapContainer.boundingBox();
      if (box) {
        // Use Ctrl+click to zoom out
        const centerX = box.x + box.width * 0.5;
        const centerY = box.y + box.height * 0.5;
        await page.keyboard.down('Control');
        await page.mouse.click(centerX, centerY);
        await page.keyboard.up('Control');
        await delay(1000); // Wait for zoom animation
      }
    }
  } catch (error) {
    console.warn('Could not zoom out:', error.message);
  }
}

/**
 * Create video from frames using FFmpeg
 */
async function createVideoFromFrames(framesDir, fps) {
  const outputVideo = path.join(VIDEO_DIR, 'demo-video.mp4');
  
  // Use forward slashes for Windows compatibility
  const framesPattern = path.join(framesDir, 'frame-%05d.png').replace(/\\/g, '/');
  const outputPath = outputVideo.replace(/\\/g, '/');
  
  const ffmpegCommand = `ffmpeg -r ${fps} -i "${framesPattern}" -c:v libx264 -pix_fmt yuv420p -y "${outputPath}"`;
  
  try {
    console.log('⏳ Running FFmpeg...');
    const { stdout, stderr } = await execAsync(ffmpegCommand);
    
    if (fs.existsSync(outputVideo)) {
      const stats = fs.statSync(outputVideo);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`\n✅ Video created successfully!`);
      console.log(`📁 Location: ${outputVideo}`);
      console.log(`📊 Size: ${fileSizeMB} MB`);
      console.log(`📹 Format: MP4 (H.264, ${fps}fps, ${VIEWPORT_WIDTH}x${VIEWPORT_HEIGHT})`);
      console.log(`\n🎉 Ready for Facebook posting!\n`);
    } else {
      console.error('❌ Error: Video file was not created');
      console.error('   Check FFmpeg output above for errors.\n');
      throw new Error('Video creation failed');
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('\n❌ Error: FFmpeg not found!');
      console.error('\n📥 Please install FFmpeg:');
      console.error('   Windows: Download from https://ffmpeg.org/download.html');
      console.error('   macOS:   brew install ffmpeg');
      console.error('   Linux:   sudo apt install ffmpeg (or equivalent)');
      console.error('\n   After installing, make sure FFmpeg is in your PATH.');
      console.error('\n   You can still create the video manually by running:');
      console.error(`   ffmpeg -r ${fps} -i "${framesPattern}" -c:v libx264 -pix_fmt yuv420p -y "${outputPath}"\n`);
    } else {
      console.error('❌ Error creating video:', error.message);
      if (error.stderr) {
        console.error('\nFFmpeg error output:');
        console.error(error.stderr);
      }
      console.error('\n   You can try creating the video manually:');
      console.error(`   ffmpeg -r ${fps} -i "${framesPattern}" -c:v libx264 -pix_fmt yuv420p -y "${outputPath}"\n`);
    }
    throw error;
  }
}

/**
 * Check if server is reachable
 */
async function checkServerReachable(url, retryCount = 0, maxRetries = 0) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch (error) {
    if (retryCount < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return checkServerReachable(url, retryCount + 1, maxRetries);
    }
    return false;
  }
}

/**
 * Main video recording function
 * Records by taking screenshots at 30fps and combining them into a video
 */
async function recordVideo(serverUrl = null) {
  const urlToUse = serverUrl || APP_URL;
  console.log('🎬 Starting video recording...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });
  
  const page = await browser.newPage();
  
  // Set viewport for Facebook video size
  await page.setViewport({
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT
  });
  
  try {
    // Check if server is reachable before attempting navigation
    const shouldStartServer = process.argv.includes('--start-server');
    const maxRetries = shouldStartServer ? 10 : 0;
    const serverReachable = await checkServerReachable(urlToUse, 0, maxRetries);
    
    if (!serverReachable) {
      const errorMessage = `
❌ ERROR: Development server is not running at ${urlToUse}

To fix this, you have two options:

Option 1: Start the server manually (recommended)
  1. Open a new terminal
  2. Run: npm run dev
  3. Wait for the server to start
  4. Then run: node scripts/record-video.js

Option 2: Auto-start the server
  Run: node scripts/record-video.js --start-server
  (This will start and stop the server automatically)

The server must be running before recording video.
`;
      console.error(errorMessage);
      throw new Error(`Server not reachable at ${urlToUse}. Please start the development server first.`);
    }
    
    console.log(`📡 Navigating to ${urlToUse}...`);
    
    await page.goto(urlToUse, { 
      waitUntil: 'networkidle0',
      timeout: 60000 
    });
    
    console.log('⏳ Waiting for application to load...');
    await waitForMapLoad(page);
    console.log('✓ Application loaded\n');
    
    // Create frames directory
    const framesDir = path.join(VIDEO_DIR, 'video-frames');
    if (!fs.existsSync(framesDir)) {
      fs.mkdirSync(framesDir, { recursive: true });
    }
    
    // Recording parameters
    const FPS = 30; // 30 frames per second
    const FRAME_INTERVAL = 1000 / FPS; // ~33ms between frames
    const TOTAL_FRAMES = Math.ceil((VIDEO_DURATION / 1000) * FPS); // 450 frames for 15 seconds
    
    console.log(`🎥 Recording ${TOTAL_FRAMES} frames at ${FPS}fps (15 seconds)...\n`);
    const startTime = Date.now();
    let frameCount = 0;
    
    // Function to capture a frame
    const captureFrame = async (frameNum) => {
      const framePath = path.join(framesDir, `frame-${String(frameNum).padStart(5, '0')}.png`);
      await page.screenshot({
        path: framePath,
        fullPage: false
      });
    };
    
    // Segment 1: Default view with map interaction (2.5 seconds = 75 frames)
    console.log('📹 Segment 1/5: Default overview with map click (2.5s)...');
    const segment1Frames = 45; // Show default for 1.5s
    for (let i = 0; i < segment1Frames; i++) {
      await captureFrame(frameCount++);
      await delay(FRAME_INTERVAL);
    }
    // Click on map to show interaction
    await clickMapFeature(page, 0.5, 0.4);
    const segment1bFrames = 30; // Show clicked state for 1s
    for (let i = 0; i < segment1bFrames; i++) {
      await captureFrame(frameCount++);
      await delay(FRAME_INTERVAL);
    }
    
    // Segment 2: Change to Site Suitability Score (2.5 seconds = 75 frames)
    console.log('📹 Segment 2/5: Changing to Site Suitability Score (2.5s)...');
    await setDataLayer(page, 'site_suitability_score');
    const segment2Frames = 75;
    for (let i = 0; i < segment2Frames; i++) {
      await captureFrame(frameCount++);
      await delay(FRAME_INTERVAL);
    }
    
    // Segment 3: Change boundary to Parliament (2.5 seconds = 75 frames)
    console.log('📹 Segment 3/5: Changing boundary to Parliament (2.5s)...');
    await setBoundaryType(page, 'parliament');
    const segment3Frames = 75;
    for (let i = 0; i < segment3Frames; i++) {
      await captureFrame(frameCount++);
      await delay(FRAME_INTERVAL);
    }
    
    // Segment 4: Click multiple DUN boundaries (3 seconds = 90 frames)
    console.log('📹 Segment 4/5: Clicking multiple DUN boundaries (3s)...');
    await setBoundaryType(page, 'dun'); // Set to DUN so boundaries are visible
    await delay(1000); // Wait for DUN boundaries to load
    // Click on first DUN
    await clickMapFeature(page, 0);
    const segment4aFrames = 30; // Show first click for 1s
    for (let i = 0; i < segment4aFrames; i++) {
      await captureFrame(frameCount++);
      await delay(FRAME_INTERVAL);
    }
    // Click on second DUN
    await clickMapFeature(page, 1);
    const segment4bFrames = 30; // Show second click for 1s
    for (let i = 0; i < segment4bFrames; i++) {
      await captureFrame(frameCount++);
      await delay(FRAME_INTERVAL);
    }
    // Click on third DUN
    await clickMapFeature(page, 2);
    const segment4cFrames = 30; // Show third click for 1s
    for (let i = 0; i < segment4cFrames; i++) {
      await captureFrame(frameCount++);
      await delay(FRAME_INTERVAL);
    }
    
    // Segment 5: Zoom interaction (2 seconds = 60 frames)
    console.log('📹 Segment 5/5: Zooming in on map (2s)...');
    await zoomInMap(page);
    const segment5Frames = 60;
    for (let i = 0; i < segment5Frames; i++) {
      await captureFrame(frameCount++);
      await delay(FRAME_INTERVAL);
    }
    
    // Fill remaining frames to reach exactly 15 seconds
    const remainingFrames = TOTAL_FRAMES - frameCount;
    if (remainingFrames > 0) {
      console.log(`⏱️  Adding ${remainingFrames} frames to reach exactly 15 seconds...`);
      for (let i = 0; i < remainingFrames; i++) {
        await captureFrame(frameCount++);
        await delay(FRAME_INTERVAL);
      }
    }
    
    await browser.close();
    
    const elapsed = (Date.now() - startTime) / 1000;
    console.log(`\n✅ Captured ${frameCount} frames in ${elapsed.toFixed(1)}s`);
    console.log(`📁 Frames saved to: ${framesDir}`);
    
    // Automatically create video using FFmpeg
    console.log(`\n🎬 Creating video with FFmpeg...`);
    await createVideoFromFrames(framesDir, FPS);
    
  } catch (error) {
    console.error('❌ Error recording video:', error);
    await browser.close();
    throw error;
  }
}

/**
 * Start dev server if requested
 * Returns { server, url } where url is the actual server URL parsed from output
 */
async function startDevServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting development server...');
    
    const devServer = spawn('npm', ['run', 'dev'], {
      shell: true,
      stdio: 'pipe'
    });
    
    let serverReady = false;
    let detectedUrl = null;
    const startTime = Date.now();
    
    devServer.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      
      if (!serverReady && (output.includes('Local:') || output.includes('localhost'))) {
        // Parse the actual URL from Vite output
        const strippedOutput = output.replace(/\u001b\[[0-9;]*m/g, '');
        const urlMatch = strippedOutput.match(/http:\/\/localhost:(\d+)/);
        if (urlMatch) {
          const port = urlMatch[1];
          detectedUrl = `http://localhost:${port}`;
        }
        
        serverReady = true;
        console.log('\n⏳ Waiting for server to be ready...');
        setTimeout(() => {
          resolve({ server: devServer, url: detectedUrl || APP_URL });
        }, 3000);
      }
    });
    
    devServer.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    devServer.on('error', (error) => {
      reject(error);
    });
    
    // Timeout after 60 seconds
    setTimeout(() => {
      if (!serverReady) {
        console.warn('⚠ Server may not be ready, proceeding anyway...');
        resolve({ server: devServer, url: APP_URL });
      }
    }, 60000);
  });
}

// Main execution
(async () => {
  const args = process.argv.slice(2);
  const shouldStartServer = args.includes('--start-server');
  
  let devServer = null;
  
  try {
    let serverUrl = null;
    if (shouldStartServer) {
      const serverInfo = await startDevServer();
      devServer = serverInfo.server;
      serverUrl = serverInfo.url;
    }
    
    await recordVideo(serverUrl);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    if (devServer) {
      console.log('\n🛑 Stopping development server...');
      devServer.kill();
    }
  }
})();

