import { useState } from 'react';
import { useLocale, useI18n } from './lib/i18n';
import { LanguageSelector } from './components/LanguageSelector';
import { ThemeToggle } from './components/ThemeToggle';
import FileUpload from './components/FileUpload';
import PackageView from './components/PackageView';
import { Shield as ShieldIcon, Lock, Zap, FileText, Code, Cpu, HardDrive } from 'lucide-react';
import type { ParseResult } from './types';

function App() {
  const { locale } = useLocale();
  const { t } = useI18n(locale);

  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  const handleUploadNew = () => {
    setParseResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ViewDeb</h1>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!parseResult ? (
          <div className="space-y-4">
            {/* Hero Section */}
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('upload.title')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {t('upload.subtitle')}
              </p>
            </div>

            {/* Upload Component */}
            <FileUpload
              onComplete={setParseResult}
              onError={setError}
              isLoading={isLoading}
              onLoadingChange={setIsLoading}
            />

            {/* Features Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
              {/* Features Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-700 px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t('features.title')}
                </h3>
                <p className="text-xs text-gray-600 dark:text-slate-300 mt-0.5">
                  {t('features.subtitle')}
                </p>
              </div>

              {/* Features Grid */}
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Privacy Protection */}
                  <div className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ShieldIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-900 dark:text-white">
                        {t('features.privacy')}
                      </h4>
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-tight">
                        {t('features.privacyDesc')}
                      </p>
                    </div>
                  </div>

                  {/* Secure Parsing */}
                  <div className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-900 dark:text-white">
                        {t('features.security')}
                      </h4>
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-tight">
                        {t('features.securityDesc')}
                      </p>
                    </div>
                  </div>

                  {/* Fast Parsing */}
                  <div className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-900 dark:text-white">
                        {t('features.fastParsing')}
                      </h4>
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-tight">
                        {t('features.fastParsingDesc')}
                      </p>
                    </div>
                  </div>

                  {/* File List */}
                  <div className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-900 dark:text-white">
                        {t('features.fileList')}
                      </h4>
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-tight">
                        {t('features.fileListDesc')}
                      </p>
                    </div>
                  </div>

                  {/* Script View */}
                  <div className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Code className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-900 dark:text-white">
                        {t('features.scriptView')}
                      </h4>
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-tight">
                        {t('features.scriptViewDesc')}
                      </p>
                    </div>
                  </div>

                  {/* Binary Analysis */}
                  <div className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Cpu className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-900 dark:text-white">
                        {t('features.binaryAnalysis')}
                      </h4>
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-tight">
                        {t('features.binaryAnalysisDesc')}
                      </p>
                    </div>
                  </div>

                  {/* Format Support */}
                  <div className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <HardDrive className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-900 dark:text-white">
                        {t('features.formatSupport')}
                      </h4>
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-tight">
                        {t('features.formatSupportDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tech Stack Footer */}
                <div className="mt-3 pt-2.5 border-t border-gray-200 dark:border-slate-700">
                  <p className="text-[10px] text-center text-gray-500 dark:text-slate-400">
                    {t('features.techStack')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <PackageView
            result={parseResult}
            onNewUpload={handleUploadNew}
          />
        )}
      </main>
    </div>
  );
}

export default App;
