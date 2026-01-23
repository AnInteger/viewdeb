'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, FileText, X, AlertCircle, Loader2 } from 'lucide-react';
import type { ParseResult } from '@/types';

interface FileUploadProps {
  onComplete: (result: ParseResult) => void;
  onError: (error: string) => void;
  isLoading: boolean;
  onLoadingChange: (loading: boolean) => void;
}

export default function FileUpload({ onComplete, onError, isLoading, onLoadingChange }: FileUploadProps) {
  const t = useTranslations();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSelectFile(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSelectFile(files[0]);
    }
  }, []);

  const validateAndSelectFile = (file: File) => {
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (extension !== '.deb' && extension !== '.udeb') {
      onError(t('errors.invalidType'));
      return;
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      onError(t('errors.fileTooLarge'));
      return;
    }

    setSelectedFile(file);
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    onLoadingChange(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/parse', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('解析错误:', errorData);
        console.error('完整错误响应:', JSON.stringify(errorData, null, 2));
        throw new Error(errorData.error || t('errors.parseFailed'));
      }

      const result: ParseResult = await response.json();
      onComplete(result);
    } catch (error: any) {
      console.error('上传/解析失败:', error);
      onError(error.message || t('errors.uploadFailed'));
    } finally {
      onLoadingChange(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
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
      {!selectedFile ? (
        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${
            dragActive
              ? 'border-blue-500 bg-blue-500/10 scale-105'
              : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:border-slate-500 dark:hover:bg-slate-800/70'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center dark:bg-slate-700">
              <Upload className="w-10 h-10 text-gray-400 dark:text-slate-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{t('upload.title')}</h3>
              <p className="text-gray-500 mb-4 dark:text-slate-400">{t('upload.subtitle')}</p>
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".deb,.udeb"
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                <FileText className="w-5 h-5" />
                {t('upload.selectFile')}
              </span>
            </label>
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedFile.name}</h3>
                <p className="text-gray-500 dark:text-slate-400">{formatFileSize(selectedFile.size)}</p>
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
                Large packages may take more time, please wait...
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
