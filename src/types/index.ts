// Debian 包元数据
export interface DebianPackageMetadata {
  Package: string;
  Version: string;
  Architecture: string;
  Maintainer?: string;
  InstalledSize?: string;
  Section?: string;
  Priority?: string;
  Homepage?: string;
  Description?: string;
  Depends?: string;
  'Pre-Depends'?: string;
  Recommends?: string;
  Suggests?: string;
  Conflicts?: string;
  Breaks?: string;
  Replaces?: string;
  MultiArch?: string;
  Uploaders?: string;
  StandardsVersion?: string;
  VcsBrowser?: string;
  VcsGit?: string;
  VcsSvn?: string;
  PackageType?: string;
  Source?: string;
}

// 文件信息
export interface FileInfo {
  path: string;
  size: number;
  mode: string;
  uid: number;
  gid: number;
  mtime: string;
  type: 'file' | 'directory' | 'symlink' | 'elf' | 'desktop';
  isElf: boolean;
  isDesktop: boolean;
}

// ELF 文件信息
export interface ELFInfo {
  type: string;
  machine: string;
  entry: string;
  programHeaders: string[];
  sectionHeaders: string[];
  dependencies?: string[];
  dynamicLibraries?: string[];
  interpreter?: string;
}

// Desktop 文件信息
export interface DesktopInfo {
  Name?: string;
  GenericName?: string;
  Comment?: string;
  Icon?: string;
  Exec?: string;
  Terminal?: string;
  Type?: string;
  Categories?: string;
  Keywords?: string;
  NoDisplay?: string;
  Hidden?: string;
  OnlyShowIn?: string;
  NotShowIn?: string;
  MimeType?: string;
  [key: string]: string | undefined;
}

// 脚本内容
export interface Scripts {
  preinst?: string;
  postinst?: string;
  prerm?: string;
  postrm?: string;
  config?: string;
  templates?: string;
}

// 控制文件内容
export interface ControlFiles {
  control: string;
  md5sums?: string;
  conffiles?: string;
}

// 解析结果
export interface ParseResult {
  metadata: DebianPackageMetadata;
  files: FileInfo[];
  scripts?: Scripts;
  controlFiles: ControlFiles;
  elfInfo?: Record<string, ELFInfo>;
  desktopInfo?: Record<string, DesktopInfo>;
  stats: {
    parseTime: number; // 解析耗时（毫秒）
    originalSize: number; // 原始大小（字节）
    extractedSize: number; // 解压后大小（字节）
    fileCount: number;
    elfCount: number;
    desktopCount: number;
  };
}

// 文件内容查看结果
export interface FileContentResult {
  path: string;
  content: string;
  isText: boolean;
  isTruncated: boolean;
  size: number;
}

// 文件类型筛选
export type FileTypeFilter = 'all' | 'elf' | 'desktop' | 'other';

// 错误类型
export class ParseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: string
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

// 解析器接口
export interface IExtractor {
  name: string;
  supportedExtensions: string[];
  extract(tempDir: string, debPath: string): Promise<void>;
  parseMetadata(controlPath: string): Promise<DebianPackageMetadata>;
  listFiles(extractPath: string): Promise<FileInfo[]>;
  parseScripts(extractPath: string): Promise<Scripts>;
  analyzeELF(filePath: string): Promise<ELFInfo>;
  analyzeDesktop(filePath: string): Promise<DesktopInfo>;
  readFileContent(filePath: string, maxLines?: number): Promise<FileContentResult>;
}
