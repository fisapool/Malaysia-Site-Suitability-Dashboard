# Product Demo Screenshots

This guide explains how to generate product demo screenshots of the GeoIntel dashboard.

## Quick Start

### Option 1: Manual Server Start (Recommended)

1. **Start the development server** in one terminal:
   ```bash
   npm run dev
   ```

2. **Run the screenshot script** in another terminal:
   ```bash
   npm run screenshots
   ```

### Option 2: Automatic Server Start

The script can automatically start and stop the dev server:

```bash
npm run screenshots:auto
```

## Prerequisites

- Node.js installed
- Dependencies installed (`npm install`)
- Puppeteer will be installed automatically as a dev dependency

## What Gets Captured

The script captures the following screenshots:

1. **Overview** - Default view (Population Density, District boundary)
2. **Data Layers** - Each data layer with District boundary:
   - Population Density
   - Average Income
   - Competitor Density
   - Site Suitability Score
   - Night Lights Intensity
   - Public Services
3. **Boundary Types** - Site Suitability Score with each boundary:
   - District
   - Parliament
   - DUN
4. **Feature Selection** - Map with info panel showing selected feature
5. **Zoom Levels** - Different zoom levels of the map
6. **Hero Shot** - Best-looking combination (Site Suitability Score, District)

## Output Location

All screenshots are saved to the `screenshots/` directory in the project root.

## Screenshot Naming Convention

- `00-hero-*.png` - Hero/featured screenshot
- `01-overview-*.png` - Overview screenshots
- `02-layer-*.png` - Data layer screenshots
- `03-boundary-*.png` - Boundary type screenshots
- `04-feature-*.png` - Feature selection screenshots
- `05-zoom-*.png` - Zoom level screenshots

## Configuration

You can customize the script by editing `scripts/take-screenshots.js`:

- **Viewport size**: Change `VIEWPORT_WIDTH` and `VIEWPORT_HEIGHT`
- **App URL**: Set `APP_URL` environment variable or modify the default
- **Screenshot directory**: Change `SCREENSHOT_DIR`
- **Wait times**: Adjust timeouts for slower connections

## Troubleshooting

### Server Not Starting

If the automatic server start fails:
- Use Option 1 (manual start) instead
- Check that port 5173 is available
- Ensure `npm run dev` works manually

### Screenshots Are Empty/Black

- Ensure the dev server is fully loaded before running the script
- Increase wait times in the script if you have a slow connection
- Check browser console for errors

### Map Not Loading

- Verify that GeoJSON files exist in `public/data/`
- Check browser console for data loading errors
- Ensure the app loads correctly in a manual browser test

## Tips for Best Results

1. **Run during off-peak hours** - Map tile loading can be slower during peak times
2. **Stable internet connection** - Required for loading map tiles
3. **Consistent environment** - Run from the same location for consistent results
4. **Review screenshots** - Check the output and re-run if needed

## Customization

To add custom screenshots:

1. Edit `scripts/take-screenshots.js`
2. Add your screenshot logic in the `captureScreenshots()` function
3. Use the helper functions:
   - `setDataLayer(page, layerId)` - Change data layer
   - `setBoundaryType(page, boundaryId)` - Change boundary type
   - `clickMapFeature(page)` - Click on a map feature
   - `takeScreenshot(page, filename)` - Take a screenshot
   - `waitForMapLoad(page)` - Wait for map to load

Example:
```javascript
// Custom screenshot
await setDataLayer(page, 'population');
await setBoundaryType(page, 'parliament');
await page.waitForTimeout(2000);
await takeScreenshot(page, 'custom-population-parliament.png');
```

