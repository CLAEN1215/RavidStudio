import path from 'path';
import fs from 'fs/promises';
import sharp, { OverlayOptions } from 'sharp';
import { StudioOptions } from './types';

// Default Visual Standard Configuration derived from reference photos
export const VISUAL_STANDARD = {
  canvasWidth: 1024,
  canvasHeight: 1024,
  baselineY: 805, // Where product sits on woven runner
  maxProductHeight: 430, // Preserves elegant upper wall negative space
  maxProductWidth: 560, // Preserves natural framing on the runner
  watermarkX: 860,
  watermarkY: 24,
  badgeX: 32,
  badgeY: 32,
  badgeDiameter: 140,
};

/**
 * Remove background using Photoroom API or intelligent local segmentation fallback
 */
export async function removeProductBackground(
  imageBuffer: Buffer,
  apiKey?: string
): Promise<{ buffer: Buffer; usedPhotoroom: boolean }> {
  // 1. If image is already transparent (from client-side AI neural remover or transparent PNG)
  const meta = await sharp(imageBuffer).metadata();
  if (meta.hasAlpha) {
    return { buffer: imageBuffer, usedPhotoroom: true };
  }

  const activeKey = apiKey || process.env.PHOTOROOM_API_KEY;

  if (activeKey) {
    try {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/jpeg' });
      formData.append('image_file', blob, 'product.jpg');
      formData.append('format', 'png');

      const response = await fetch('https://sdk.photoroom.com/v1/segment', {
        method: 'POST',
        headers: {
          'x-api-key': activeKey,
        },
        body: formData,
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return { buffer: Buffer.from(arrayBuffer), usedPhotoroom: true };
      } else {
        const errText = await response.text();
        console.warn(`Photoroom API returned ${response.status}: ${errText}. Falling back to smart segmentation.`);
      }
    } catch (err) {
      console.warn('Photoroom API call failed, falling back to local segmentation:', err);
    }
  }

  // Fallback: Smart local segmentation
  const fallbackBuffer = await smartLocalSegmentation(imageBuffer);
  return { buffer: fallbackBuffer, usedPhotoroom: false };
}

/**
 * Smart local background segmentation:
 * Handles images with pre-existing alpha or segments foreground from white/light studio background
 */
async function smartLocalSegmentation(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  // If already transparent PNG with alpha
  if (metadata.hasAlpha && metadata.format === 'png') {
    return imageBuffer;
  }

  // Extract raw RGB pixels to compute background color from corners
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;

  // Sample corner pixels to determine background color
  const cornerCoords = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
    [Math.floor(width / 2), 2],
  ];

  let bgR = 0, bgG = 0, bgB = 0;
  for (const [x, y] of cornerCoords) {
    const idx = (y * width + x) * 4;
    bgR += data[idx];
    bgG += data[idx + 1];
    bgB += data[idx + 2];
  }
  bgR /= cornerCoords.length;
  bgG /= cornerCoords.length;
  bgB /= cornerCoords.length;

  const outBuffer = Buffer.from(data);

  // Soft threshold distance
  const threshold = 28;
  const feather = 18;

  for (let i = 0; i < outBuffer.length; i += 4) {
    const r = outBuffer[i];
    const g = outBuffer[i + 1];
    const b = outBuffer[i + 2];

    const dist = Math.sqrt(
      Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
    );

    if (dist < threshold) {
      outBuffer[i + 3] = 0; // Transparent
    } else if (dist < threshold + feather) {
      const alphaFraction = (dist - threshold) / feather;
      outBuffer[i + 3] = Math.round(alphaFraction * 255);
    }
  }

  return await sharp(outBuffer, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();
}

/**
 * Generate realistic contact & ambient shadow SVG matching the reference photos
 */
function generateShadowSvg(
  width: number,
  height: number,
  baselineY: number,
  productWidth: number,
  intensity: number = 0.75
): Buffer {
  const shadowWidth = Math.round(productWidth * 0.92);
  const shadowHeight = Math.round(Math.max(14, productWidth * 0.12));
  const centerX = width / 2;
  const shadowY = baselineY + 2;

  // Dual-layer shadow:
  // 1) Tight dark occlusion shadow right at the contact seam (warm umber)
  // 2) Diffused ambient shadow spreading onto the woven runner
  const occlusionOpacity = (0.75 * intensity).toFixed(2);
  const ambientOpacity = (0.32 * intensity).toFixed(2);

  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Ambient soft shadow -->
      <filter id="ambientBlur" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="9" />
      </filter>
      <!-- Tight contact occlusion shadow -->
      <filter id="occlusionBlur" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
      
      <radialGradient id="occlusionGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#21150C" stop-opacity="${occlusionOpacity}" />
        <stop offset="70%" stop-color="#342114" stop-opacity="${(Number(occlusionOpacity) * 0.6).toFixed(2)}" />
        <stop offset="100%" stop-color="#342114" stop-opacity="0" />
      </radialGradient>
      
      <radialGradient id="ambientGrad" cx="52%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#3F2B1D" stop-opacity="${ambientOpacity}" />
        <stop offset="60%" stop-color="#4B3322" stop-opacity="${(Number(ambientOpacity) * 0.4).toFixed(2)}" />
        <stop offset="100%" stop-color="#4B3322" stop-opacity="0" />
      </radialGradient>
    </defs>
    
    <!-- Ambient Shadow Layer (slightly offset to front-right) -->
    <ellipse cx="${centerX + 4}" cy="${shadowY + 5}" rx="${shadowWidth * 0.52}" ry="${shadowHeight * 0.6}" 
             fill="url(#ambientGrad)" filter="url(#ambientBlur)" />
             
    <!-- Deep Occlusion Seam Layer -->
    <ellipse cx="${centerX}" cy="${shadowY}" rx="${shadowWidth * 0.44}" ry="${shadowHeight * 0.28}" 
             fill="url(#occlusionGrad)" filter="url(#occlusionBlur)" />
  </svg>
  `;

  return Buffer.from(svg);
}

/**
 * Generate variant badge SVG (white circle with letter A, B, C, D)
 */
function generateVariantBadgeSvg(
  badge: 'A' | 'B' | 'C' | 'D',
  size: number = 140
): Buffer {
  const svg = `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="#FFFFFF" />
    <text x="${size / 2}" y="${size / 2 + size * 0.16}" 
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
          font-size="${size * 0.52}" 
          font-weight="700" 
          fill="#111827" 
          text-anchor="middle" 
          dominant-baseline="central">${badge}</text>
  </svg>
  `;
  return Buffer.from(svg);
}

/**
 * Main Studio Composite Pipeline
 * Transforms isolated product into reference-matched Etsy photograph
 */
export async function compositeProductOnVisualStandard(
  isolatedProductBuffer: Buffer,
  options: StudioOptions = {}
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const {
    baselineY = VISUAL_STANDARD.baselineY,
    includeWatermark = true,
    variantBadge = 'none',
    shadowIntensity = 0.75,
    customOffsetX = 0,
    outputFormat = 'jpeg',
    outputResolution = 1024,
  } = options;

  // 1. Trim empty transparent edges to get exact product bounding box
  const trimmedImage = sharp(isolatedProductBuffer).trim();
  const trimmedBuffer = await trimmedImage.toBuffer();
  const trimmedMeta = await sharp(trimmedBuffer).metadata();

  const origWidth = trimmedMeta.width || 400;
  const origHeight = trimmedMeta.height || 400;
  const aspectRatio = origWidth / origHeight;

  // 2. Compute proportional scaling based on reference design specifications
  let scale = 1.0;
  if (aspectRatio > 1.3) {
    // Wide products (bowls, platters): limit by width ~520px
    const targetW = Math.min(520, VISUAL_STANDARD.maxProductWidth);
    scale = targetW / origWidth;
  } else if (aspectRatio < 0.8) {
    // Tall products (cups, whisks, vases): limit by height ~400px
    const targetH = Math.min(410, VISUAL_STANDARD.maxProductHeight);
    scale = targetH / origHeight;
  } else {
    // Compact / square products
    const maxDim = 450;
    scale = Math.min(maxDim / origWidth, maxDim / origHeight);
  }

  // Cap to max bounds
  const scaledWidth = Math.round(origWidth * scale);
  const scaledHeight = Math.round(origHeight * scale);

  // Resize product cleanly with Lanczos3
  const resizedProductBuffer = await sharp(trimmedBuffer)
    .resize(scaledWidth, scaledHeight, {
      fit: 'fill',
      kernel: 'lanczos3',
    })
    .toBuffer();

  // 3. Compute coordinates
  // Product baseline touches baselineY (805px on woven runner)
  const productTop = baselineY - scaledHeight;
  const productLeft = Math.round((VISUAL_STANDARD.canvasWidth - scaledWidth) / 2) + customOffsetX;

  // 4. Load master background template
  const assetsDir = path.join(process.cwd(), 'public', 'studio-assets');
  const bgPath = path.join(assetsDir, 'background-master.png');
  let backgroundBuffer: Buffer;
  try {
    backgroundBuffer = await fs.readFile(bgPath);
  } catch {
    throw new Error('Master background template not found at ' + bgPath);
  }

  // 5. Generate realistic contact shadow
  const shadowSvg = generateShadowSvg(
    VISUAL_STANDARD.canvasWidth,
    VISUAL_STANDARD.canvasHeight,
    baselineY,
    scaledWidth,
    shadowIntensity
  );

  // 6. Build Composite Layers
  const compositeLayers: OverlayOptions[] = [
    // Layer 1: Shadow
    {
      input: shadowSvg,
      top: 0,
      left: 0,
    },
    // Layer 2: Product
    {
      input: resizedProductBuffer,
      top: Math.max(0, productTop),
      left: Math.max(0, productLeft),
    },
  ];

  // Layer 3: Watermark (if enabled)
  if (includeWatermark) {
    const wmFileName = options.watermarkStyle === 'ceramic-cosmic' ? 'watermark.png' : 'watermark-ravidstudio.png';
    const wmPath = path.join(assetsDir, wmFileName);
    try {
      const wmBuffer = await fs.readFile(wmPath);
      compositeLayers.push({
        input: wmBuffer,
        top: VISUAL_STANDARD.watermarkY,
        left: VISUAL_STANDARD.watermarkX,
      });
    } catch (e) {
      console.warn('Watermark asset not found, skipping watermark:', e);
    }
  }

  // Layer 4: Variant Badge (if enabled)
  if (variantBadge && variantBadge !== 'none') {
    const badgeSvg = generateVariantBadgeSvg(variantBadge, VISUAL_STANDARD.badgeDiameter);
    compositeLayers.push({
      input: badgeSvg,
      top: VISUAL_STANDARD.badgeY,
      left: VISUAL_STANDARD.badgeX,
    });
  }

  // 7. Render Base 1024x1024 Composite
  let compositeInstance = sharp(backgroundBuffer).composite(compositeLayers);

  // 8. Scale to requested resolution (1024 or 2048)
  if (outputResolution === 2048) {
    compositeInstance = compositeInstance.resize(2048, 2048, {
      kernel: 'lanczos3',
    });
  }

  // 9. Format output
  let finalBuffer: Buffer;
  if (outputFormat === 'png') {
    finalBuffer = await compositeInstance.png({ quality: 95 }).toBuffer();
  } else {
    finalBuffer = await compositeInstance.jpeg({ quality: 95, mozjpeg: true }).toBuffer();
  }

  return {
    buffer: finalBuffer,
    width: outputResolution,
    height: outputResolution,
  };
}
