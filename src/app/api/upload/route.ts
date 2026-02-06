// src/app/api/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Allowed image MIME types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Upload file to local storage
 * POST /api/upload
 * Body: multipart/form-data with 'file' field
 * Optional: 'folder' field for organizing uploads
 */
export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'menu';

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No file provided' 
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Only images are allowed (JPEG, PNG, GIF, WebP)',
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // Validate folder (allow any folder, create if doesn't exist)
    // const validFolders = ['menu', 'categories', 'profiles', 'logos'];
    // Allow folder even if not in list - we'll create it

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', folder);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Write file to disk
    const filepath = join(uploadDir, fileName);
    await writeFile(filepath, buffer);

    // Generate public URL
    const publicUrl = `/uploads/${folder}/${fileName}`;

    // Return success response with file URL
    return NextResponse.json(
      {
        success: true,
        data: {
          url: publicUrl,
          path: publicUrl,
          fileName: fileName,
          size: file.size,
          type: file.type,
        },
        message: 'File uploaded successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload API error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Upload failed',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during file upload',
      },
      { status: 500 }
    );
  }
}

/**
 * Delete file from storage (optional endpoint)
 * DELETE /api/upload?path=...
 */
export async function DELETE(request: NextRequest) {
  try {
    const { unlink } = await import('fs/promises');
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        {
          success: false,
          error: 'File path is required',
        },
        { status: 400 }
      );
    }

    // Delete file from local storage
    const filepath = join(process.cwd(), 'public', path);
    
    if (existsSync(filepath)) {
      await unlink(filepath);
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
      data: {
        path: path,
      },
    });
  } catch (error) {
    console.error('Delete file API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during file deletion',
      },
      { status: 500 }
    );
  }
}