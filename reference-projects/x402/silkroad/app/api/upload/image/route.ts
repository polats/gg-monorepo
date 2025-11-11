import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config/constants';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // Get wallet from query params (frontend should pass this)
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get('wallet');

    if (wallet) {
      // ANTI-SPAM: Rate limit uploads (5 per 10 minutes)
      const rateLimit = await checkRateLimit(wallet, RATE_LIMITS.IMAGE_UPLOAD);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { 
            error: rateLimit.message,
            resetAt: rateLimit.resetAt,
            remaining: rateLimit.remaining
          },
          { status: 429 }
        );
      }
    }

    // ============================================
    // MOCK MODE (return placeholder image)
    // ============================================
    if (CONFIG.MOCK_MODE) {
      
      // Return a random unsplash image
      const mockImages = [
        'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop',
      ];
      
      const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)];

      return NextResponse.json({
        success: true,
        imageUrl: randomImage,
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE (Cloudinary upload)
    // ============================================
    const formData = await req.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image must be less than 5MB' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type)) {
      return NextResponse.json(
        { error: 'Image must be JPEG, PNG, or WebP' },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const cloudinary = require('cloudinary').v2;
    
    // Use CLOUDINARY_URL if set, otherwise use individual variables
    if (CONFIG.CLOUDINARY_URL) {
      cloudinary.config({
        cloudinary_url: CONFIG.CLOUDINARY_URL,
      });
    } else {
    cloudinary.config({
      cloud_name: CONFIG.CLOUDINARY_CLOUD_NAME,
      api_key: CONFIG.CLOUDINARY_API_KEY,
      api_secret: CONFIG.CLOUDINARY_API_SECRET,
    });
    }

    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'silkroadx402',
          transformation: [
            { width: 800, height: 600, crop: 'fill' },
            { quality: 'auto' },
          ],
        },
        (error: any, result: any) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({
      success: true,
      imageUrl: (result as any).secure_url,
    });
  } catch (error: any) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

