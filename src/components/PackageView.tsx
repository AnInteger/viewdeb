import { useState, useMemo } from 'react';
import { useLocale, useI18n } from '@/lib/i18n';
import { ArrowLeft, Package, Clock, HardDrive, File, Cpu, Monitor, Search, Filter, ChevronDown, ChevronRight, FileText, Code2, Terminal, X } from 'lucide-react';
import type { ParseResult, FileTypeFilter, ELFInfo, DesktopInfo } from '@/types';

interface PackageViewProps {
  result: ParseResult;
  onNewUpload: () => void;
}

type FileNode = {
  path: string;
  name: string;
  depth: number;
  isElf?: boolean;
  isDesktop?: boolean;
  size: number;
  type: 'file' | 'directory' | 'symlink' | 'elf' | 'desktop';
  children?: FileNode[];
};

export default function PackageView({ result, onNewUpload }: PackageViewProps) {
  const { locale } = useLocale();
  const { t } = useI18n(locale);
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'scripts' | 'control'>('overview');
  const [fileFilter, setFileFilter] = useState<FileTypeFilter>('all');
  const [fileSearch, setFileSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  // Build file tree structure from source files
  const fileTree = useMemo(() => {
    const root: FileNode = { path: '/', name: '/', depth: 0, size: 0, type: 'directory', children: [] };
    const nodeMap = new Map<string, FileNode>();
    nodeMap.set('/', root);

    result.files.forEach((file) => {
      if (file.type === 'symlink') return;

      const parts = file.path.split('/').filter(Boolean);
      let currentPath = '/';

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        currentPath = currentPath === '/' ? '' : currentPath + '/';
        currentPath += part;

        let node = nodeMap.get(currentPath);

        if (!node) {
          const isLastPart = i === parts.length - 1;
          const type = isLastPart && backendTypeToFileType(file.type, file.isElf, file.isDesktop) || 'directory';

          node = {
            path: currentPath,
            name: part,
            depth: i + 1,
            size: isLastPart ? file.size : 0,
            type: type as 'file' | 'directory' | 'elf' | 'desktop',
            isElf: file.isElf,
            isDesktop: file.isDesktop,
            children: type === 'directory' ? [] : undefined,
          };
          nodeMap.set(currentPath, node);
        } else {
          const isLastPart = i === parts.length - 1;
          if (isLastPart) {
            node.size = file.size;
            node.isElf = file.isElf;
            node.isDesktop = file.isDesktop;
            const backendType = backendTypeToFileType(file.type, file.isElf, file.isDesktop);
            if (backendType && backendType !== 'directory') {
              node.type = backendType as 'file' | 'elf' | 'desktop';
            }
          }
        }
      }
    });

    nodeMap.forEach((node, path) => {
      if (path === '/') return;
      const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
      const parent = nodeMap.get(parentPath);

      if (parent && parent !== node) {
        if (!parent.children) {
          parent.children = [];
        }
        if (!parent.children.find(c => c.path === path)) {
          parent.children.push(node);
        }
      }
    });

    return root;
  }, [result.files]);

  function backendTypeToFileType(backendType: string, isElf?: boolean, isDesktop?: boolean) {
    if (isElf) return 'elf';
    if (isDesktop) return 'desktop';
    if (backendType === 'file') return 'file';
    if (backendType === 'directory') return 'directory';
    return null;
  }

  const visibleFiles = useMemo(() => {
    const files: FileNode[] = [];

    function traverse(node: FileNode, parentExpanded: boolean, isRootChildren = false) {
      if (node.path === '/') {
        if (node.children) {
          const sortedChildren = [...node.children].sort((a, b) => {
            if (a.type === 'directory' && b.type !== 'directory') return -1;
            if (a.type !== 'directory' && b.type === 'directory') return 1;
            return a.name.localeCompare(b.name);
          });
          sortedChildren.forEach(child => traverse(child, true, true));
        }
        return;
      }

      const isExpanded = expandedPaths.has(node.path);
      const show = parentExpanded || isRootChildren;
      const matchesSearch = !fileSearch || node.path.toLowerCase().includes(fileSearch.toLowerCase());

      if (show && matchesSearch) {
        files.push(node);
      }

      if (node.children && isExpanded && show) {
        const sortedChildren = [...node.children].sort((a, b) => {
          if (a.type === 'directory' && b.type !== 'directory') return -1;
          if (a.type !== 'directory' && b.type === 'directory') return 1;
          return a.name.localeCompare(b.name);
        });
        sortedChildren.forEach(child => traverse(child, true));
      }
    }

    traverse(fileTree, true, false);
    return files;
  }, [fileTree, expandedPaths, fileSearch]);

  const filteredFiles = useMemo(() => {
    return visibleFiles.filter(file => {
      if (file.type === 'directory') return true;
      if (fileFilter === 'elf' && !file.isElf) return false;
      if (fileFilter === 'desktop' && !file.isDesktop) return false;
      if (fileFilter === 'other' && (file.isElf || file.isDesktop)) return false;
      if (fileSearch) {
        const search = fileSearch.toLowerCase();
        if (!file.path.toLowerCase().includes(search)) return false;
      }
      return true;
    });
  }, [visibleFiles, fileFilter, fileSearch]);

  const toggleFolder = (path: string) => {
    setExpandedPaths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) newSet.delete(path);
      else newSet.add(path);
      return newSet;
    });
  };

  const handleFileClick = (file: FileNode) => {
    if (file.type === 'directory') toggleFolder(file.path);
    else setSelectedFile(file);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getFileIcon = (file: FileNode, isExpanded: boolean) => {
    if (file.isElf) return <Cpu className="w-4 h-4 text-red-400" />;
    if (file.isDesktop) return <Monitor className="w-4 h-4 text-green-400" />;
    if (file.type === 'directory') {
      return isExpanded ? <ChevronDown className="w-4 h-4 text-blue-400" /> : <ChevronRight className="w-4 h-4 text-blue-400" />;
    }
    return <File className="w-4 h-4 text-slate-400" />;
  };

  const allDirectoryPaths = useMemo(() => {
    const paths: string[] = [];
    function collectPaths(node: FileNode) {
      if (node.children) {
        node.children.forEach(child => {
          if (child.type === 'directory') {
            paths.push(child.path);
            collectPaths(child);
          }
        });
      }
    }
    collectPaths(fileTree);
    return paths;
  }, [fileTree]);

  const toggleExpandAll = () => {
    setExpandedPaths(new Set(allDirectoryPaths));
  };

  const collapseAll = () => {
    setExpandedPaths(new Set());
  };

  const toggleExpandCollapseAll = () => {
    const isAllExpanded = expandedPaths.size === allDirectoryPaths.length;
    if (isAllExpanded) collapseAll();
    else toggleExpandAll();
  };

  const expandButtonLabel = expandedPaths.size === allDirectoryPaths.length
    ? t('files.collapseAll')
    : t('files.expandAll');

  return (
    <div className="w-full">
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 dark:bg-slate-800/50 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onNewUpload}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('common.uploadNew')}
          </button>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
              <Clock className="w-4 h-4" />
              {t('common.parseTime')}: {formatDuration(result.stats.parseTime)}
            </span>
            <span className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
              <HardDrive className="w-4 h-4" />
              {t('common.compressionRate')}: {result.stats.originalSize > 0
                ? ((1 - result.stats.originalSize / result.stats.extractedSize) * 100).toFixed(1)
                : 0}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{result.metadata.Package}</h2>
            <p className="text-gray-500 dark:text-slate-400">{result.metadata.Version}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <TabButton active={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setSelectedFile(null); }}>
          <Package className="w-4 h-4" />
          {t('tabs.overview')}
        </TabButton>
        <TabButton active={activeTab === 'files'} onClick={() => { setActiveTab('files'); setSelectedFile(null); }}>
          <File className="w-4 h-4" />
          {t('tabs.files')} ({result.stats.fileCount})
        </TabButton>
        <TabButton active={activeTab === 'scripts'} onClick={() => { setActiveTab('scripts'); setSelectedFile(null); }}>
          <Terminal className="w-4 h-4" />
          {t('tabs.scripts')} ({result.scripts ? Object.keys(result.scripts).length : 0})
        </TabButton>
        <TabButton active={activeTab === 'control'} onClick={() => { setActiveTab('control'); setSelectedFile(null); }}>
          <Code2 className="w-4 h-4" />
          {t('tabs.control')}
        </TabButton>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden dark:bg-slate-800/50 dark:border-slate-700 shadow-sm">
        {activeTab === 'overview' && <OverviewTab result={result} />}
        {activeTab === 'files' && (
          <FilesTab
            files={filteredFiles}
            fileFilter={fileFilter}
            setFileFilter={setFileFilter}
            fileSearch={fileSearch}
            setFileSearch={setFileSearch}
            expandedPaths={expandedPaths}
            setExpandedPaths={setExpandedPaths}
            handleFileClick={handleFileClick}
            getFileIcon={getFileIcon}
            formatFileSize={formatFileSize}
            elfCount={result.stats.elfCount}
            desktopCount={result.stats.desktopCount}
            toggleExpandAll={toggleExpandCollapseAll}
            expandButtonLabel={expandButtonLabel}
          />
        )}
        {activeTab === 'scripts' && <ScriptsTab result={result} />}
        {activeTab === 'control' && <ControlTab result={result} />}
      </div>

      {selectedFile && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setSelectedFile(null)}>
          <div className="bg-white border border-gray-200 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden dark:bg-slate-800 dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-3 min-w-0">
                {getFileIcon(selectedFile, false)}
                <span className="font-mono text-sm truncate text-gray-900 dark:text-white">{selectedFile.path}</span>
              </div>
              <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {selectedFile.isElf && result.elfInfo?.[selectedFile.path] && (
                <ELFInfoPanel elfInfo={result.elfInfo[selectedFile.path] as ELFInfo} />
              )}
              {selectedFile.isDesktop && result.desktopInfo?.[selectedFile.path] && (
                <DesktopInfoPanel desktopInfo={result.desktopInfo[selectedFile.path] as DesktopInfo} />
              )}
              {!selectedFile.isElf && !selectedFile.isDesktop && selectedFile.size < 1024 * 1024 && (
                <div className="text-gray-600 text-sm dark:text-slate-400">
                  {t('common.fileSize')}: {formatFileSize(selectedFile.size)}
                  <p className="mt-4 text-gray-500 dark:text-slate-500">{t('common.filePreview')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
      }`}
    >
      {children}
    </button>
  );
}

function ELFInfoPanel({ elfInfo }: { elfInfo: ELFInfo }) {
  const { locale } = useLocale();
  const { t } = useI18n(locale);
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
        <Cpu className="w-5 h-5 text-red-400" />
        {t('elfInfo.title')}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <InfoItem label={t('elfInfo.type')} value={elfInfo.type} />
        <InfoItem label={t('elfInfo.machine')} value={elfInfo.machine} />
        <InfoItem label={t('elfInfo.entry')} value={elfInfo.entry} />
        {elfInfo.interpreter && <InfoItem label={t('elfInfo.interpreter')} value={elfInfo.interpreter} />}
      </div>
      {elfInfo.dependencies && elfInfo.dependencies.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2 text-gray-900 dark:text-white">{t('elfInfo.dynamicDeps')} ({elfInfo.dependencies.length})</h4>
          <div className="bg-slate-900 rounded-lg p-3 max-h-48 overflow-y-auto">
            {elfInfo.dependencies.map((dep, i) => (
              <div key={i} className="text-xs font-mono text-slate-300 py-1">{dep}</div>
            ))}
          </div>
        </div>
      )}
      {elfInfo.sectionHeaders && elfInfo.sectionHeaders.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2 text-gray-900 dark:text-white">{t('elfInfo.sections')}</h4>
          <div className="bg-slate-900 rounded-lg p-3 max-h-48 overflow-y-auto">
            {elfInfo.sectionHeaders.slice(0, 10).map((header, i) => (
              <div key={i} className="text-xs font-mono text-slate-300 py-1">{header}</div>
            ))}
            {elfInfo.sectionHeaders.length > 10 && (
              <div className="text-xs text-slate-500 py-1">{t('elfInfo.moreSections').replace('{count}', String(elfInfo.sectionHeaders.length - 10))}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DesktopInfoPanel({ desktopInfo }: { desktopInfo: DesktopInfo }) {
  const { locale } = useLocale();
  const { t } = useI18n(locale);
  const fields = [
    { key: 'Name', label: t('desktopInfo.name') },
    { key: 'GenericName', label: t('desktopInfo.genericName') },
    { key: 'Comment', label: t('desktopInfo.comment') },
    { key: 'Icon', label: t('desktopInfo.icon') },
    { key: 'Exec', label: t('desktopInfo.exec') },
    { key: 'Terminal', label: t('desktopInfo.terminal') },
    { key: 'Type', label: t('desktopInfo.type') },
    { key: 'Categories', label: t('desktopInfo.categories') },
    { key: 'Keywords', label: t('desktopInfo.keywords') },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
        <Monitor className="w-5 h-5 text-green-400" />
        {t('desktopInfo.title')}
      </h3>
      <div className="space-y-3">
        {fields.map(field => {
          const value = desktopInfo[field.key as keyof DesktopInfo];
          if (!value) return null;
          return (
            <div key={field.key} className="flex items-start gap-3">
              <span className="text-gray-600 text-sm min-w-[80px] dark:text-slate-400">{field.label}:</span>
              <span className="text-sm font-mono text-gray-900 dark:text-white">{value}</span>
            </div>
          );
        })}
      </div>
      {desktopInfo.NoDisplay === 'true' && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 text-sm text-yellow-300">
          {t('desktopInfo.noDisplay')}
        </div>
      )}
      {desktopInfo.Hidden === 'true' && (
        <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-3 text-sm text-orange-300">
          {t('desktopInfo.hidden')}
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="bg-gray-100 rounded-lg p-3 dark:bg-slate-700/50">
      <span className="text-gray-500 text-xs block mb-1 dark:text-slate-400">{label}</span>
      <span className="font-mono text-sm text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

function OverviewTab({ result }: { result: ParseResult }) {
  const { locale } = useLocale();
  const { t } = useI18n(locale);
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
            <Package className="w-5 h-5 text-blue-400" />
            {t('overview.basicInfo')}
          </h3>
          <InfoRow label={t('overview.package')} value={result.metadata.Package} />
          <InfoRow label={t('overview.version')} value={result.metadata.Version} />
          <InfoRow label={t('overview.architecture')} value={result.metadata.Architecture} />
          <InfoRow label={t('overview.maintainer')} value={result.metadata.Maintainer} />
          <InfoRow label={t('overview.priority')} value={result.metadata.Priority} />
          <InfoRow label={t('overview.section')} value={result.metadata.Section} />
          {result.metadata.Homepage && <InfoRow label={t('overview.homepage')} value={result.metadata.Homepage} />}
          {result.metadata.Description && (
            <div>
              <span className="text-gray-500 text-sm dark:text-slate-400">{t('overview.description')}:</span>
              <p className="mt-1 text-sm whitespace-pre-wrap text-gray-700 dark:text-slate-200">{result.metadata.Description}</p>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
            <File className="w-5 h-5 text-green-400" />
            {t('overview.stats')}
          </h3>
          <StatCard label={t('overview.originalSize')} value={result.stats.originalSize} format="size" />
          <StatCard label={t('overview.extractedSize')} value={result.stats.extractedSize} format="size" />
          <StatCard label={t('overview.fileCount')} value={result.stats.fileCount} format="number" />
          {result.stats.elfCount > 0 && (
            <StatCard label={t('overview.elfFiles')} value={result.stats.elfCount} format="number" />
          )}
          {result.stats.desktopCount > 0 && (
            <StatCard label={t('overview.desktopFiles')} value={result.stats.desktopCount} format="number" />
          )}
        </div>
      </div>
      {(result.metadata.Depends || result.metadata.Recommends || result.metadata.Suggests) && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
            <FileText className="w-5 h-5 text-purple-400" />
            {t('overview.dependencies')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.metadata.Depends && <DependencyList label={t('overview.depends')} deps={result.metadata.Depends} />}
            {result.metadata.Recommends && <DependencyList label={t('overview.recommends')} deps={result.metadata.Recommends} />}
            {result.metadata.Suggests && <DependencyList label={t('overview.suggests')} deps={result.metadata.Suggests} />}
            {result.metadata.Conflicts && <DependencyList label={t('overview.conflicts')} deps={result.metadata.Conflicts} />}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-200 dark:border-slate-700/50">
      <span className="text-gray-500 text-sm dark:text-slate-400">{label}</span>
      <span className="text-right text-sm font-medium max-w-[60%] text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

function StatCard({ label, value, format }: { label: string; value: number; format: 'size' | 'number' }) {
  const displayValue = format === 'size'
    ? (value === 0 ? '0 B' : value < 1024 ? `${value} B` : value < 1024 * 1024 ? `${(value / 1024).toFixed(2)} KB` : `${(value / 1024 / 1024).toFixed(2)} MB`)
    : value.toLocaleString();

  return (
    <div className="bg-gray-100 rounded-lg p-4 dark:bg-slate-700/50">
      <p className="text-gray-500 text-sm mb-1 dark:text-slate-400">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white">{displayValue}</p>
    </div>
  );
}

function DependencyList({ label, deps }: { label: string; deps: string }) {
  const dependencies = deps.split(',').map(d => d.trim());
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-500 mb-2 dark:text-slate-400">{label}</h4>
      <div className="flex flex-wrap gap-2">
        {dependencies.map((dep, i) => (
          <span key={i} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs font-mono">
            {dep}
          </span>
        ))}
      </div>
    </div>
  );
}

function FilesTab({
  files,
  fileFilter,
  setFileFilter,
  fileSearch,
  setFileSearch,
  handleFileClick,
  getFileIcon,
  formatFileSize,
  elfCount,
  desktopCount,
  toggleExpandAll,
  expandButtonLabel,
}: any) {
  const { locale } = useLocale();
  const { t } = useI18n(locale);
  return (
    <div>
      <div className="p-4 border-b border-gray-200 flex flex-wrap items-center gap-4 dark:border-slate-700">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('files.searchPlaceholder')}
            value={fileSearch}
            onChange={(e) => setFileSearch(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={fileFilter}
            onChange={(e) => setFileFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            <option value="all">{t('files.allFiles')}</option>
            <option value="elf">{t('files.elfFiles')} ({elfCount})</option>
            <option value="desktop">{t('files.desktopFiles')} ({desktopCount})</option>
            <option value="other">{t('files.otherFiles')}</option>
          </select>
          <button
            onClick={toggleExpandAll}
            className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white"
          >
            {expandButtonLabel}
          </button>
        </div>
      </div>
      <div className="max-h-[500px] overflow-y-auto">
        {files.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-slate-400">
            {t('files.noFiles')}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-slate-700/30">
            {files.map((file: any) => (
              <div
                key={file.path}
                onClick={() => handleFileClick(file)}
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors cursor-pointer dark:hover:bg-slate-700/50"
                style={{ paddingLeft: `${12 + file.depth * 16}px` }}
              >
                {getFileIcon(file, false)}
                <span className="flex-1 text-sm font-mono truncate text-gray-700 dark:text-slate-300">
                  {file.name}
                </span>
                {file.size > 0 && (
                  <span className="text-xs text-gray-500 w-20 text-right dark:text-slate-500">{formatFileSize(file.size)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ScriptsTab({ result }: { result: ParseResult }) {
  const { locale } = useLocale();
  const { t } = useI18n(locale);
  return (
    <div className="p-6">
      {result.scripts ? (
        <div className="space-y-6">
          {result.scripts.preinst && (
            <ScriptSection name="preinst" script={result.scripts.preinst} description={t('scripts.preinst')} />
          )}
          {result.scripts.postinst && (
            <ScriptSection name="postinst" script={result.scripts.postinst} description={t('scripts.postinst')} />
          )}
          {result.scripts.prerm && (
            <ScriptSection name="prerm" script={result.scripts.prerm} description={t('scripts.prerm')} />
          )}
          {result.scripts.postrm && (
            <ScriptSection name="postrm" script={result.scripts.postrm} description={t('scripts.postrm')} />
          )}
          {result.scripts.config && (
            <ScriptSection name="config" script={result.scripts.config} description={t('scripts.config')} />
          )}
          {result.scripts.templates && (
            <ScriptSection name="templates" script={result.scripts.templates} description={t('scripts.templates')} />
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8 dark:text-slate-400">{t('scripts.noScripts')}</p>
      )}
    </div>
  );
}

function ScriptSection({ script, description }: { script: string; description: string; name?: string }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{description}</h3>
      <pre className="bg-slate-900 rounded-lg p-4 overflow-x-auto text-sm font-mono text-slate-300 max-h-96 overflow-y-auto">
        {script}
      </pre>
    </div>
  );
}

function ControlTab({ result }: { result: ParseResult }) {
  const { locale } = useLocale();
  const { t } = useI18n(locale);
  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('control.controlFile')}</h3>
          <pre className="bg-slate-900 rounded-lg p-4 overflow-x-auto text-sm font-mono text-slate-300 max-h-96 overflow-y-auto">
            {result.controlFiles.control}
          </pre>
        </div>
        {result.controlFiles.md5sums && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('control.md5sums')}</h3>
            <pre className="bg-slate-900 rounded-lg p-4 overflow-x-auto text-sm font-mono text-slate-300 max-h-96 overflow-y-auto">
              {result.controlFiles.md5sums}
            </pre>
          </div>
        )}
        {result.controlFiles.conffiles && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('control.conffiles')}</h3>
            <pre className="bg-slate-900 rounded-lg p-4 overflow-x-auto text-sm font-mono text-slate-300 max-h-96 overflow-y-auto">
              {result.controlFiles.conffiles}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
