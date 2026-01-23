import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, stat, rmdir, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { debianExtractor } from '@/lib/extractors/debianExtractor';
import type { ParseResult, ControlFiles } from '@/types';

// Maximum file size: 500MB
const MAX_FILE_SIZE = 500 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.deb', '.udeb'];

// Cleanup helper
async function cleanupTempDir(tempDir: string): Promise<void> {
  try {
    const fs = await import('fs/promises');
    const { rm } = fs;
    await rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.error('Error cleaning up temp directory:', error);
  }
}

// POST /api/parse
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const tempDir = join(tmpdir(), `viewdeb_${randomBytes(8).toString('hex')}`);

  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided', code: 'NO_FILE' },
        { status: 400 }
      );
    }

    // Validate file extension
    const filename = file.name;
    const extension = filename.toLowerCase().slice(filename.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { 
          error: `Invalid file type. Only ${ALLOWED_EXTENSIONS.join(', ')} files are supported`,
          code: 'INVALID_FILE_TYPE',
          details: { filename, extension }
        },
        { status: 400 }
      );
    }

    // Validate file size
    const fileSize = file.size;
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
          code: 'FILE_TOO_LARGE',
          details: { size: fileSize, limit: MAX_FILE_SIZE }
        },
        { status: 413 }
      );
    }

    // Save uploaded file to temp location (ensure temp directory exists)
    await mkdir(tempDir, { recursive: true });
    const uploadedFilePath = join(tempDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(uploadedFilePath, buffer);

    const originalSize = buffer.length;

    // Extract package
    await debianExtractor.extract(tempDir, uploadedFilePath);

    const controlPath = join(tempDir, 'control');
    const extractPath = join(tempDir, 'extracted');

    // Parse metadata
    const metadata = await debianExtractor.parseMetadata(controlPath);

    // List files
    const files = await debianExtractor.listFiles(extractPath);

    // Parse scripts
    const scripts = await debianExtractor.parseScripts(extractPath);

    // Read control file
    const controlContent = await import('fs/promises').then(fs => 
      fs.readFile(join(controlPath, 'control'), 'utf-8')
    );

    // Read md5sums if exists
    let md5sums: string | undefined;
    try {
      const md5sumsPath = join(extractPath, 'DEBIAN/md5sums');
      const stats = await stat(md5sumsPath);
      if (stats.isFile()) {
        md5sums = await import('fs/promises').then(fs => 
          fs.readFile(md5sumsPath, 'utf-8')
        );
      }
    } catch {}

    // Read conffiles if exists
    let conffiles: string | undefined;
    try {
      const conffilesPath = join(extractPath, 'DEBIAN/conffiles');
      const stats = await stat(conffilesPath);
      if (stats.isFile()) {
        conffiles = await import('fs/promises').then(fs => 
          fs.readFile(conffilesPath, 'utf-8')
        );
      }
    } catch {}

    const controlFiles: ControlFiles = {
      control: controlContent,
      md5sums,
      conffiles,
    };

    // Analyze ELF files (limit to first 20 to save time)
    const elfFiles = files.filter(f => f.isELF).slice(0, 20);
    const elfInfo: Record<string, any> = {};
    
    for (const file of elfFiles) {
      try {
        const fullPath = join(extractPath, file.path);
        elfInfo[file.path] = await debianExtractor.analyzeELF(fullPath);
      } catch (error: any) {
        console.error('Error analyzing ELF file:', file.path, error.message);
      }
    }

    // Analyze desktop files
    const desktopFiles = files.filter(f => f.isDesktop);
    const desktopInfo: Record<string, any> = {};

    for (const file of desktopFiles) {
      try {
        const fullPath = join(extractPath, file.path);
        desktopInfo[file.path] = await debianExtractor.analyzeDesktop(fullPath);
      } catch (error: any) {
        console.error('Error analyzing desktop file:', file.path, error.message);
      }
    }

    // Calculate extracted size
    let extractedSize = 0;
    for (const file of files) {
      if (file.type !== 'directory' && file.type !== 'symlink') {
        extractedSize += file.size;
      }
    }

    const parseTime = Date.now() - startTime;

    const result: ParseResult = {
      metadata,
      files,
      scripts,
      controlFiles,
      elfInfo: Object.keys(elfInfo).length > 0 ? elfInfo : undefined,
      desktopInfo: Object.keys(desktopInfo).length > 0 ? desktopInfo : undefined,
      stats: {
        parseTime,
        originalSize,
        extractedSize,
        fileCount: files.length,
        elfCount: files.filter(f => f.isELF).length,
        desktopCount: files.filter(f => f.isDesktop).length,
      },
    };

    // Cleanup temp directory in background
    cleanupTempDir(tempDir).catch(console.error);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Parse error:', error);

    // Cleanup temp directory
    await cleanupTempDir(tempDir);

    return NextResponse.json(
      {
        error: error.message || '解析文件失败',
      },
      { status: 500 }
    );
  }
}
