import { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { useLocale, useI18n } from '@/lib/i18n';
import { native } from '@/lib/platform';
import type { ParseResult } from '@/types';

interface FileUploadProps {
  onComplete: (result: ParseResult) => void;
  onError: (error: string) => void;
  isLoading: boolean;
  onLoadingChange: (loading: boolean) => void;
}

export default function FileUpload({ onComplete, onError, isLoading, onLoadingChange }: FileUploadProps) {
  const { locale } = useLocale();
  const { t } = useI18n(locale);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedFileSize, setSelectedFileSize] = useState<number>(0);
  const [dialogOpen, setDialogOpen] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    import('@tauri-apps/plugin-dialog').then(module => {
      setDialogOpen(() => module.open);
    }).catch(err => {
      console.error('Failed to load @tauri-apps/plugin-dialog:', err);
    });
  }, []);

  const handleFileSelect = useCallback(async () => {
    if (!dialogOpen) {
      onError('Dialog plugin not available');
      return;
    }
    try {
      const selected = await dialogOpen({
        multiple: false,
        filters: [{
          name: 'Debian Packages',
          extensions: ['deb', 'udeb']
        }]
      });

      if (selected && typeof selected === 'string') {
        setSelectedFilePath(selected);
        const fileName = selected.split('/').pop() || selected;
        setSelectedFileName(fileName);
        setSelectedFileSize(0);
      }
    } catch (err) {
      console.error('File selection error:', err);
      onError(t('errors.uploadFailed'));
    }
  }, [dialogOpen, onError, t]);

  const handleUpload = async () => {
    if (!selectedFilePath) return;
    onLoadingChange(true);

    try {
      const result = await native.parseDebPackage(selectedFilePath);
      onComplete(result);
    } catch (error: any) {
      console.error('解析失败:', error);
      onError(error || t('errors.uploadFailed'));
    } finally {
      onLoadingChange(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFilePath(null);
    setSelectedFileName('');
    setSelectedFileSize(0);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-xl">
      {!selectedFilePath ? (
        <button
          onClick={handleFileSelect}
          onMouseEnter={() => setIsDragging(true)}
          onMouseLeave={() => setIsDragging(false)}
          className="group relative w-full overflow-hidden rounded-3xl bg-white dark:bg-slate-800 border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300"
        >
          <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-400/5 dark:to-purple-400/5 transition-opacity duration-300 ${isDragging ? 'opacity-100' : 'opacity-0'}`} />

          <div className="relative p-12">
            <div className="flex flex-col items-center gap-6">
              {/* Upload Icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-400/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500" />
                <div className="relative w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              {/* Text */}
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  选择文件
                </h3>
                <p className="text-gray-600 dark:text-slate-400">
                  支持 .deb 和 .udeb 格式，最大 500MB
                </p>
              </div>

              {/* Button */}
              <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 dark:from-blue-500 dark:to-blue-400 dark:hover:from-blue-600 dark:hover:to-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-500/30 group-hover:-translate-y-0.5">
                <FileText className="w-5 h-5" />
                <span>{t('upload.selectFile')}</span>
              </div>
            </div>
          </div>
        </button>
      ) : (
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl">
          {/* Gradient Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-purple-500" />

          <div className="p-8">
            {/* File Info */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedFileName}
                  </h3>
                  {selectedFileSize > 0 && (
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {formatFileSize(selectedFileSize)}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleClearFile}
                disabled={isLoading}
                className="flex-shrink-0 p-2.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5 text-gray-400 dark:text-slate-400" />
              </button>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-base font-medium">{t('upload.parsing')}</span>
                </div>
                <div className="space-y-3">
                  <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-400 animate-pulse rounded-full" style={{ width: '45%' }} />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 text-center">
                    {t('upload.largePackageWarning') || '大型包可能需要更长时间，请耐心等待...'}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleUpload}
                className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 dark:from-blue-500 dark:to-blue-400 dark:hover:from-blue-600 dark:hover:to-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
              >
                <Upload className="w-5 h-5" />
                <span>{t('upload.startParsing')}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
