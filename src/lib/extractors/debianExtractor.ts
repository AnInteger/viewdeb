import { exec } from 'child_process';
import { mkdir, readFile, readdir, stat, lstat } from 'fs/promises';
import { join, relative } from 'path';
import { open } from 'fs/promises';
import type {
  IExtractor,
  DebianPackageMetadata,
  FileInfo,
  ELFInfo,
  DesktopInfo,
  Scripts,
  FileContentResult,
} from '@/types';
import { ParseError } from '@/types';

// Helper to execute shell commands
function execCommand(command: string, timeout = 30000): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      command,
      { timeout },
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      }
    );
  });
}

export class DebianExtractor implements IExtractor {
  name = 'Debian';
  supportedExtensions = ['.deb', '.udeb'];

  private static isELF(buffer: Buffer): boolean {
    // ELF magic number: 0x7F 'E' 'L' 'F'
    return buffer.length >= 4 && 
           buffer[0] === 0x7F && 
           buffer[1] === 0x45 && 
           buffer[2] === 0x4C && 
           buffer[3] === 0x46;
  }

  async extract(tempDir: string, debPath: string): Promise<void> {
    try {
      // Create temp directory
      await mkdir(tempDir, { recursive: true });

      // Extract using dpkg -x
      const extractPath = join(tempDir, 'extracted');
      await mkdir(extractPath, { recursive: true });

      const controlPath = join(tempDir, 'control');
      await mkdir(controlPath, { recursive: true });

      // Extract data files
      try {
        await execCommand(`dpkg -x "${debPath}" "${extractPath}"`, 60000);
      } catch (error: any) {
        throw new ParseError(
          'Failed to extract package data',
          'EXTRACT_ERROR',
          error.message
        );
      }

      // Extract control info
      try {
        await execCommand(`dpkg -e "${debPath}" "${controlPath}"`, 30000);
      } catch (error: any) {
        throw new ParseError(
          'Failed to extract control information',
          'CONTROL_EXTRACT_ERROR',
          error.message
        );
      }
    } catch (error: any) {
      throw error;
    }
  }

  async parseMetadata(controlPath: string): Promise<DebianPackageMetadata> {
    try {
      const controlFile = join(controlPath, 'control');
      const content = await readFile(controlFile, 'utf-8');
      const metadata: DebianPackageMetadata = {
        Package: '',
        Version: '',
        Architecture: '',
      };

      const lines = content.split('\n');
      let currentKey = '';
      for (const line of lines) {
        if (line.trim() === '') {
          currentKey = '';
          continue;
        }

        if (line.startsWith(' ') || line.startsWith('\t')) {
          // Continuation line
          if (currentKey && metadata[currentKey as keyof DebianPackageMetadata] !== undefined) {
            metadata[currentKey as keyof DebianPackageMetadata] += '\n' + line.trim();
          }
        } else {
          // New field
          const [key, ...valueParts] = line.split(':');
          currentKey = key.trim();
          const value = valueParts.join(':').trim();
          metadata[currentKey as keyof DebianPackageMetadata] = value;
        }
      }

      return metadata;
    } catch (error: any) {
      throw new ParseError(
        'Failed to parse metadata',
        'METADATA_PARSE_ERROR',
        error.message
      );
    }
  }

  async listFiles(extractPath: string): Promise<FileInfo[]> {
    const files: FileInfo[] = [];

    async function walk(dir: string) {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = relative(extractPath, fullPath);

        // Skip symlinks for now
        if (entry.isSymbolicLink()) continue;

        const stats = await lstat(fullPath);
        const isDirectory = entry.isDirectory();
        const isFile = entry.isFile();

        let type: 'file' | 'directory' | 'symlink' | 'elf' | 'desktop' = 'file';
        let isELF = false;
        let isDesktop = false;

        if (isDirectory) {
          type = 'directory';
        } else if (isFile) {
          type = 'file';
          
          // Check if ELF file
          try {
            const buffer = Buffer.alloc(Math.min(stats.size, 512));
            const fd = await open(fullPath, 'r');
            await fd.read(buffer, 0, buffer.length, 0);
            await fd.close();

            if (DebianExtractor.isELF(buffer)) {
              type = 'elf';
              isELF = true;
            }
          } catch {}

          // Check if .desktop file
          if (relativePath.endsWith('.desktop')) {
            type = 'desktop';
            isDesktop = true;
          }
        }

        const fileInfo: FileInfo = {
          path: relativePath,
          size: stats.size,
          mode: stats.mode.toString(8).slice(-4),
          uid: stats.uid,
          gid: stats.gid,
          mtime: stats.mtime.toISOString(),
          type,
          isELF,
          isDesktop,
        };

        files.push(fileInfo);

        if (isDirectory) {
          await walk(fullPath);
        }
      }
    }

    await walk(extractPath);
    return files;
  }

  async parseScripts(extractPath: string): Promise<Scripts> {
    const scripts: Scripts = {};
    const scriptNames = ['preinst', 'postinst', 'prerm', 'postrm', 'config', 'templates'];

    const controlDir = join(extractPath, '../control');

    for (const scriptName of scriptNames) {
      const scriptPath = join(controlDir, scriptName);
      try {
        const content = await readFile(scriptPath, 'utf-8');
        scripts[scriptName as keyof Scripts] = content;
      } catch {
        // Script doesn't exist, skip
      }
    }

    return scripts;
  }

  async analyzeELF(filePath: string): Promise<ELFInfo> {
    const info: ELFInfo = {
      type: 'unknown',
      machine: 'unknown',
      entry: '0x0',
      programHeaders: [],
      sectionHeaders: [],
    };

    try {
      // Use readelf command with English locale for consistent parsing
      const stdout = await execCommand(`LC_ALL=C readelf -h "${filePath}"`, 5000);
      const lines = stdout.split('\n');

      for (const line of lines) {
        if (line.includes('Type:')) {
          info.type = line.split(':')[1]?.trim() || 'unknown';
        }
        if (line.includes('Machine:')) {
          info.machine = line.split(':')[1]?.trim() || 'unknown';
        }
        if (line.includes('Entry point')) {
          info.entry = line.split(':')[1]?.trim() || '0x0';
        }
      }

      // Get program headers
      try {
        const phOutput = await execCommand(`LC_ALL=C readelf -l "${filePath}"`, 5000);
        const phLines = phOutput.split('\n');
        let inProgramHeaders = false;
        for (const line of phLines) {
          if (line.includes('Program Headers:')) {
            inProgramHeaders = true;
          } else if (inProgramHeaders && line.trim() !== '' && !line.includes('Type')) {
            if (line.startsWith('  ')) {
              info.programHeaders.push(line.trim());
            } else {
              inProgramHeaders = false;
            }
          }
        }
      } catch {}

      // Get section headers
      try {
        const shOutput = await execCommand(`LC_ALL=C readelf -S "${filePath}"`, 5000);
        const shLines = shOutput.split('\n');
        let inSectionHeaders = false;
        for (const line of shLines) {
          if (line.includes('Section Headers:') || line.includes('Nr]')) {
            inSectionHeaders = true;
          } else if (inSectionHeaders && line.trim() !== '') {
            if (line.match(/^\s*\d/)) {
              info.sectionHeaders.push(line.trim());
            }
          }
        }
      } catch {}

      // Get dynamic dependencies
      try {
        const dynOutput = await execCommand(`LC_ALL=C readelf -d "${filePath}"`, 5000);
        const deps: string[] = [];
        const dynLines = dynOutput.split('\n');
        for (const line of dynLines) {
          if (line.includes('NEEDED')) {
            const match = line.match(/\[([^\]]+)\]/);
            if (match) {
              deps.push(match[1]);
            }
          }
        }
        if (deps.length > 0) {
          info.dependencies = deps;
        }
      } catch {}

      // Get interpreter
      try {
        const interpOutput = await execCommand(`LC_ALL=C readelf -l "${filePath}"`, 5000);
        const match = interpOutput.match(/INTERP.*\[([^\]]+)\]/s);
        if (match) {
          info.interpreter = match[1];
        }
      } catch {}

    } catch (error: any) {
      console.error('Error analyzing ELF:', error.message);
    }

    return info;
  }

  async analyzeDesktop(filePath: string): Promise<DesktopInfo> {
    const info: DesktopInfo = {};

    try {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      let inDesktopEntry = false;

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed === '[Desktop Entry]') {
          inDesktopEntry = true;
          continue;
        }

        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          // Skip other sections
          break;
        }

        if (inDesktopEntry && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          info[key.trim()] = valueParts.join('=').trim();
        }
      }
    } catch (error: any) {
      console.error('Error analyzing desktop file:', error.message);
    }

    return info;
  }

  async readFileContent(filePath: string, maxLines = 1000): Promise<FileContentResult> {
    try {
      const stats = await stat(filePath);

      // Check if likely text file
      const fd = await open(filePath, 'r');
      const buffer = Buffer.alloc(Math.min(stats.size, 8192));
      await fd.read(buffer, 0, buffer.length, 0);
      await fd.close();

      const isBinary = DebianExtractor.isBinary(buffer);
      
      if (isBinary) {
        return {
          path: filePath,
          content: '<binary file>',
          isText: false,
          isTruncated: false,
          size: stats.size,
        };
      }

      // Read as text
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      if (lines.length <= maxLines) {
        return {
          path: filePath,
          content,
          isText: true,
          isTruncated: false,
          size: stats.size,
        };
      }

      // Truncate large files
      const truncated = lines.slice(0, maxLines).join('\n') + 
        `\n\n... (${lines.length - maxLines} more lines truncated, total ${lines.length} lines)`;

      return {
        path: filePath,
        content: truncated,
        isText: true,
        isTruncated: true,
        size: stats.size,
      };
    } catch (error: any) {
      throw new ParseError(
        'Failed to read file content',
        'READ_ERROR',
        error.message
      );
    }
  }

  private static isBinary(buffer: Buffer): boolean {
    // Simple heuristic: check for null bytes
    for (let i = 0; i < Math.min(buffer.length, 512); i++) {
      if (buffer[i] === 0) {
        return true;
      }
    }
    return false;
  }

  async calculateDirectorySize(dirPath: string): Promise<number> {
    let total = 0;

    async function walk(path: string) {
      const entries = await readdir(path, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(path, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else {
          const stats = await stat(fullPath);
          total += stats.size;
        }
      }
    }

    await walk(dirPath);
    return total;
  }
}

export const debianExtractor = new DebianExtractor();
