// src/app/api/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { prisma } from '@/lib/prisma';

// Cloudinary v2 SDK (install via: npm install cloudinary)
import { v2 as cloudinary } from 'cloudinary';

// Allowed image MIME types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
];

// Max file size: 10MB (increased for high-quality images)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Get Cloudinary credentials from database settings
 */
async function getCloudinaryConfig() {
  try {
    const restaurant = await prisma.restaurant.findFirst({
      select: {
        id: true,
      },
    });

    if (!restaurant) return null;

    const settings = await prisma.setting.findMany({
      where: {
        restaurantId: restaurant.id,
        key: {
          in: ['cloudinaryCloudName', 'cloudinaryApiKey', 'cloudinaryApiSecret', 'cloudinaryAutoOptimize', 'cloudinaryAutoFormat'],
        },
      },
    });

    const config: any = {};
    settings.forEach((s) => {
      try {
        config[s.key] = JSON.parse(s.value);
      } catch {
        config[s.key] = s.value;
      }
    });

    if (config.cloudinaryCloudName && config.cloudinaryApiKey && config.cloudinaryApiSecret) {
      cloudinary.config({
        cloud_name: config.cloudinaryCloudName,
        api_key: config.cloudinaryApiKey,
        api_secret: config.cloudinaryApiSecret,
      });
      return config;
    }

    return null;
  } catch (error) {
    console.error('Failed to load Cloudinary config:', error);
    return null;
  }
}

/**
 * Upload to Cloudinary with auto-optimization
 */
async function uploadToCloudinary(file: File, folder: string, config: any) {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert buffer to base64 data URI
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    // Build transformation options
    const uploadOptions: any = {
      folder: `restaurant/${folder}`,
      resource_type: 'auto',
    };

    // Auto-optimize (default: enabled)
    if (config.cloudinaryAutoOptimize !== false) {
      uploadOptions.quality = 'auto:best';
    }

    // Auto-format (default: enabled)
    if (config.cloudinaryAutoFormat !== false) {
      uploadOptions.fetch_format = 'auto';
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, uploadOptions);

    return {
      success: true,
      data: {
        url: result.secure_url,
        path: result.public_id,
        fileName: result.public_id.split('/').pop(),
        size: result.bytes,
        type: file.type,
        width: result.width,
        height: result.height,
      },
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new Error(error.message || 'Cloudinary upload failed');
  }
}

/**
 * Fallback: Upload to local storage
 */
async function uploadToLocal(file: File, folder: string) {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = file.name.split('.').pop() || 'jpg';
  const fileName = `${timestamp}-${randomString}.${fileExtension}`;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = join(process.cwd(), 'public', 'uploads', folder);
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const filepath = join(uploadDir, fileName);
  await writeFile(filepath, buffer);

  const publicUrl = `/uploads/${folder}/${fileName}`;

  return {
    success: true,
    data: {
      url: publicUrl,
      path: publicUrl,
      fileName: fileName,
      size: file.size,
      type: file.type,
    },
  };
}

/**
 * Upload file to Cloudinary or local storage
 * POST /api/upload
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'menu';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Only images are allowed (JPEG, PNG, GIF, WebP, SVG)',
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // Try Cloudinary first
    const cloudinaryConfig = await getCloudinaryConfig();

    if (cloudinaryConfig) {
      try {
        const result = await uploadToCloudinary(file, folder, cloudinaryConfig);
        return NextResponse.json(
          {
            ...result,
            message: 'File uploaded successfully to Cloudinary',
            storage: 'cloudinary',
          },
          { status: 201 }
        );
      } catch (cloudinaryError: any) {
        console.error('Cloudinary failed, falling back to local:', cloudinaryError);
        // Fallback to local storage
      }
    }

    // Fallback to local storage
    const result = await uploadToLocal(file, folder);
    return NextResponse.json(
      {
        ...result,
        message: 'File uploaded successfully to local storage',
        storage: 'local',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Upload failed',
        message: process.env.NODE_ENV === 'production'
          ? 'File upload failed'
          : error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Delete file from storage
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'File path is required' },
        { status: 400 }
      );
    }

    // Check if Cloudinary
    const cloudinaryConfig = await getCloudinaryConfig();
    
    if (cloudinaryConfig && path.includes('cloudinary')) {
      // Extract public_id from URL
      const publicId = path.split('/upload/')[1]?.split('.')[0];
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    } else {
      // Local storage
      const { unlink } = await import('fs/promises');
      const filepath = join(process.cwd(), 'public', path);
      if (existsSync(filepath)) {
        await unlink(filepath);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
      data: { path },
    });
  } catch (error: any) {
    console.error('Delete file API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Deletion failed', 
        message: process.env.NODE_ENV === 'production'
          ? 'File deletion failed'
          : error.message 
      },
      { status: 500 }
    );
  }
}