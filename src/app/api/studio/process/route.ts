import { NextRequest, NextResponse } from 'next/server';
import {
  removeProductBackground,
  compositeProductOnVisualStandard,
} from '@/lib/studio/image-pipeline';
import { StudioOptions } from '@/lib/studio/types';

export const maxDuration = 60; // Up to 60s for high-res operations

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const contentType = req.headers.get('content-type') || '';
    let imageBuffer: Buffer;
    let options: StudioOptions = {};
    let filename = 'product.jpg';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
      }

      filename = file.name;
      const arrayBuffer = await file.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);

      const optionsJson = formData.get('options') as string | null;
      if (optionsJson) {
        try {
          options = JSON.parse(optionsJson);
        } catch {
          // ignore
        }
      }
    } else {
      // JSON body with base64
      const body = await req.json();
      if (!body.image) {
        return NextResponse.json({ error: 'No image provided' }, { status: 400 });
      }

      filename = body.filename || 'product.jpg';
      const base64Data = body.image.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
      options = body.options || {};
    }

    // 1. Isolate product background (Photoroom or smart fallback)
    const { buffer: isolatedBuffer, usedPhotoroom } = await removeProductBackground(imageBuffer, options.apiKey);

    // 2. Composite onto the reference-derived visual standard
    const { buffer: processedBuffer, width, height } = await compositeProductOnVisualStandard(
      isolatedBuffer,
      options
    );

    const processingTimeMs = Date.now() - startTime;
    const mimeType = options.outputFormat === 'png' ? 'image/png' : 'image/jpeg';
    const processedDataUrl = `data:${mimeType};base64,${processedBuffer.toString('base64')}`;

    return NextResponse.json({
      success: true,
      filename,
      processedDataUrl,
      width,
      height,
      processingTimeMs,
      usedPhotoroom,
    });
  } catch (error: unknown) {
    console.error('Error processing product image:', error);
    const message = error instanceof Error ? error.message : 'Internal image processing error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
