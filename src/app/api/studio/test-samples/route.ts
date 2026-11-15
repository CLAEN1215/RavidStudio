import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const assetsDir = path.join(process.cwd(), 'public', 'studio-assets', 'test-samples');
    const referencesDir = path.join(process.cwd(), 'public', 'references');

    const sampleFiles = [
      {
        id: 'sample-1',
        name: 'Ceramic Matcha Bowl (Supplier White Studio)',
        category: 'Bowls',
        filename: 'sample-1-ceramic-bowl.jpg',
        url: '/studio-assets/test-samples/sample-1-ceramic-bowl.jpg',
      },
      {
        id: 'sample-2',
        name: 'Ceramic Whisk Holder / Cup',
        category: 'Cups',
        filename: 'sample-2-ceramic-cup.jpg',
        url: '/studio-assets/test-samples/sample-2-ceramic-cup.jpg',
      },
      {
        id: 'sample-3',
        name: 'Bamboo Whisk & Scoop Tool',
        category: 'Kitchen Accessories',
        filename: 'sample-3-kitchen-accessory.jpg',
        url: '/studio-assets/test-samples/sample-3-kitchen-accessory.jpg',
      },
      {
        id: 'sample-4',
        name: 'Ceramic Flower Vase / Bud Vessel',
        category: 'Home Decor',
        filename: 'sample-4-home-decor.jpg',
        url: '/studio-assets/test-samples/sample-4-home-decor.jpg',
      },
    ];

    // Reference files
    const referenceFiles = [
      {
        name: 'Etsy Reference: Ceramic Green Chawan Set',
        url: '/references/listing-green-set-full.jpg',
      },
      {
        name: 'Etsy Reference: Plum Blossom Chawan Set',
        url: '/references/listing-plum-set-full.jpg',
      },
      {
        name: 'Etsy Reference: Single Whisk Holder (Variant A)',
        url: '/references/listing-green-variant-a-holder.jpg',
      },
      {
        name: 'Etsy Reference: Single Bowl (Variant B)',
        url: '/references/listing-green-variant-b-bowl.jpg',
      },
      {
        name: 'Etsy Reference: Duo Presentation (Variant C)',
        url: '/references/listing-green-variant-c-duo.jpg',
      },
    ];

    return NextResponse.json({
      success: true,
      samples: sampleFiles,
      references: referenceFiles,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load samples';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
