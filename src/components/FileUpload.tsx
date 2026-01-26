import { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, X, AlertCircle, Loader2 } from 'lucide-react';
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

  // Check if dialog plugin is available
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
    <div className="w-full max-w-3xl mx-auto">
      {!selectedFilePath ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center transition-all duration-200 hover:border-gray-400 dark:border-slate-600 dark:hover:border-slate-500"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center dark:bg-slate-700">
              <Upload className="w-10 h-10 text-gray-400 dark:text-slate-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{t('upload.title')}</h3>
              <p className="text-gray-500 mb-4 dark:text-slate-400">{t('upload.subtitle')}</p>
            </div>
            <button
              onClick={handleFileSelect}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <FileText className="w-5 h-5" />
              {t('upload.selectFile')}
            </button>
            <p className="text-gray-400 text-sm mt-4 dark:text-slate-500">
              {t('upload.maxSize')}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm dark:bg-slate-800/70 dark:border-slate-700">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center dark:bg-slate-700">
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedFileName}</h3>
                {selectedFileSize > 0 && (
                  <p className="text-gray-500 dark:text-slate-400">{formatFileSize(selectedFileSize)}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleClearFile}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-slate-700"
            >
              <X className="w-5 h-5 text-gray-400 dark:text-slate-400" />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-blue-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-gray-700 dark:text-white">{t('upload.parsing')}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden dark:bg-slate-700">
                <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: '45%' }} />
              </div>
              <p className="text-gray-400 text-sm text-center dark:text-slate-500">
                {t('upload.largePackageWarning') || '大型包可能需要更长时间，请耐心等待...'}
              </p>
            </div>
          ) : (
            <button
              onClick={handleUpload}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              {t('upload.startParsing')}
            </button>
          )}
        </div>
      )}

      {/* Info boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-start gap-3 shadow-sm dark:bg-slate-800/30 dark:border-slate-700">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium mb-1 text-gray-900 dark:text-white">{t('fileInfo.privacyTitle')}</h4>
            <p className="text-gray-500 text-sm dark:text-slate-400">
              {t('fileInfo.privacyDesc')}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-start gap-3 shadow-sm dark:bg-slate-800/30 dark:border-slate-700">
          <AlertCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium mb-1 text-gray-900 dark:text-white">{t('fileInfo.securityTitle')}</h4>
            <p className="text-gray-500 text-sm dark:text-slate-400">
              {t('fileInfo.securityDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
