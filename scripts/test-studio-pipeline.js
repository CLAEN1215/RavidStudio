const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const VISUAL_STANDARD = {
  canvasWidth: 1024,
  canvasHeight: 1024,
  baselineY: 805,
  maxProductHeight: 430,
  maxProductWidth: 560,
  watermarkX: 880,
  watermarkY: 20,
};

function generateShadowSvg(width, height, baselineY, productWidth, intensity = 0.75) {
  const shadowWidth = Math.round(productWidth * 0.92);
  const shadowHeight = Math.round(Math.max(14, productWidth * 0.12));
  const centerX = width / 2;
  const shadowY = baselineY + 2;

  const occlusionOpacity = (0.75 * intensity).toFixed(2);
  const ambientOpacity = (0.32 * intensity).toFixed(2);

  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="ambientBlur" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="9" />
      </filter>
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
    <ellipse cx="${centerX + 4}" cy="${shadowY + 5}" rx="${shadowWidth * 0.52}" ry="${shadowHeight * 0.6}" 
             fill="url(#ambientGrad)" filter="url(#ambientBlur)" />
    <ellipse cx="${centerX}" cy="${shadowY}" rx="${shadowWidth * 0.44}" ry="${shadowHeight * 0.28}" 
             fill="url(#occlusionGrad)" filter="url(#occlusionBlur)" />
  </svg>
  `;
  return Buffer.from(svg);
}

async function runTest() {
  const assetsDir = path.join(__dirname, '..', 'public', 'studio-assets');
  const bgPath = path.join(assetsDir, 'background-master.png');
  const wmPath = path.join(assetsDir, 'watermark.png');
  const testDir = path.join(assetsDir, 'test-samples');
  const outDir = path.join(assetsDir, 'test-outputs');
  fs.mkdirSync(outDir, { recursive: true });

  const testFiles = [
    'sample-1-ceramic-bowl.jpg',
    'sample-2-ceramic-cup.jpg',
    'sample-3-kitchen-accessory.jpg',
    'sample-4-home-decor.jpg'
  ];

  for (const file of testFiles) {
    const inputPath = path.join(testDir, file);
    if (!fs.existsSync(inputPath)) continue;

    console.log(`Processing test: ${file}...`);
    const inputBuf = fs.readFileSync(inputPath);

    // Segment
    const { data, info } = await sharp(inputBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const bgR = data[0], bgG = data[1], bgB = data[2];
    const outBuffer = Buffer.from(data);
    for (let i = 0; i < outBuffer.length; i += 4) {
      const dist = Math.sqrt(Math.pow(outBuffer[i] - bgR, 2) + Math.pow(outBuffer[i+1] - bgG, 2) + Math.pow(outBuffer[i+2] - bgB, 2));
      if (dist < 28) outBuffer[i+3] = 0;
      else if (dist < 46) outBuffer[i+3] = Math.round(((dist - 28) / 18) * 255);
    }
    const segmentedBuf = await sharp(outBuffer, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();

    // Trim
    const trimmedBuf = await sharp(segmentedBuf).trim().toBuffer();
    const meta = await sharp(trimmedBuf).metadata();

    const aspectRatio = meta.width / meta.height;
    let scale = 1.0;
    if (aspectRatio > 1.3) {
      scale = 520 / meta.width;
    } else if (aspectRatio < 0.8) {
      scale = 410 / meta.height;
    } else {
      scale = Math.min(450 / meta.width, 450 / meta.height);
    }

    const scaledWidth = Math.round(meta.width * scale);
    const scaledHeight = Math.round(meta.height * scale);

    const resizedBuf = await sharp(trimmedBuf).resize(scaledWidth, scaledHeight, { kernel: 'lanczos3' }).toBuffer();
    const productTop = VISUAL_STANDARD.baselineY - scaledHeight;
    const productLeft = Math.round((VISUAL_STANDARD.canvasWidth - scaledWidth) / 2);

    const shadowSvg = generateShadowSvg(1024, 1024, VISUAL_STANDARD.baselineY, scaledWidth, 0.75);
    const bgBuf = fs.readFileSync(bgPath);
    const wmBuf = fs.readFileSync(wmPath);

    const finalBuf = await sharp(bgBuf).composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: resizedBuf, top: Math.max(0, productTop), left: Math.max(0, productLeft) },
      { input: wmBuf, top: VISUAL_STANDARD.watermarkY, left: VISUAL_STANDARD.watermarkX }
    ]).jpeg({ quality: 95 }).toBuffer();

    const outName = file.replace('.jpg', '-finished-etsy.jpg');
    fs.writeFileSync(path.join(outDir, outName), finalBuf);
    console.log(`✓ Completed: ${outName} (size=${finalBuf.length} bytes)`);
  }
}

runTest();
