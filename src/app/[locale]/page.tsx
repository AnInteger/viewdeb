'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Upload, Package, FileText, Settings, Zap, FolderTree } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import PackageView from '@/components/PackageView';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import type { ParseResult } from '@/types';

export default function Home() {
  const t = useTranslations();
  const [result, setResult] = useState<ParseResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParseComplete = (data: ParseResult) => {
    setResult(data);
    setIsLoading(false);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false);
  };

  const handleNewUpload = () => {
    setResult(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white text-gray-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Package className="w-10 h-10 text-blue-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              ViewDeb
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </header>

        <div className="text-center mb-12">
          <p className="text-gray-600 text-lg dark:text-slate-400">
            {t('upload.title')}
          </p>
        </div>

        {!result && !isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            <FeatureCard 
              icon={<Zap className="w-6 h-6" />} 
              title={t('overview.stats')} 
              description={t('features.fastParsing')} 
            />
            <FeatureCard 
              icon={<FolderTree className="w-6 h-6" />} 
              title={t('files.allFiles')} 
              description={t('features.fileList')} 
            />
            <FeatureCard 
              icon={<Settings className="w-6 h-6" />} 
              title={t('tabs.scripts')} 
              description={t('features.scriptView')} 
            />
            <FeatureCard 
              icon={<FileText className="w-6 h-6" />} 
              title={t('overview.elfFiles')} 
              description={t('features.binaryAnalysis')} 
            />
          </div>
        )}

        <div className="relative">
          {result ? (
            <PackageView result={result} onNewUpload={handleNewUpload} />
          ) : (
            <FileUpload 
              onComplete={handleParseComplete}
              onError={handleError}
              isLoading={isLoading}
              onLoadingChange={setIsLoading}
            />
          )}
        </div>

        {error && (
          <div className="fixed bottom-4 right-4 max-w-md bg-red-900/90 border border-red-500 rounded-lg p-4 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}
      </div>

      <footer className="text-center py-6 text-slate-500 text-sm mt-12">
        <p>{t('common.footer')}</p>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-500/50 transition-colors shadow-sm dark:bg-slate-800/50 dark:border-slate-700 dark:hover:border-blue-500/50">
      <div className="text-blue-400 mb-3">{icon}</div>
      <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 text-sm dark:text-slate-400">{description}</p>
    </div>
  );
}
