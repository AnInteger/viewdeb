import { useState } from 'react';
import { useLocale, useI18n } from './lib/i18n';
import { LanguageSelector } from './components/LanguageSelector';
import { ThemeToggle } from './components/ThemeToggle';
import FileUpload from './components/FileUpload';
import PackageView from './components/PackageView';
import { Shield, Lock, Zap, FileText, Code, Cpu, HardDrive } from 'lucide-react';
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

  const features = [
    { icon: Shield, title: t('features.privacy'), desc: t('features.privacyDesc') },
    { icon: Lock, title: t('features.security'), desc: t('features.securityDesc') },
    { icon: Zap, title: t('features.fastParsing'), desc: t('features.fastParsingDesc') },
    { icon: FileText, title: t('features.fileList'), desc: t('features.fileListDesc') },
    { icon: Code, title: t('features.scriptView'), desc: t('features.scriptViewDesc') },
    { icon: Cpu, title: t('features.binaryAnalysis'), desc: t('features.binaryAnalysisDesc') },
    { icon: HardDrive, title: t('features.formatSupport'), desc: t('features.formatSupportDesc') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/90 dark:bg-slate-900/95 border-b border-gray-200/50 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">ViewDeb</h1>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {!parseResult ? (
          <div className="space-y-16">
            {/* Hero Section */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full text-sm text-blue-600 dark:text-blue-400 font-medium">
                <Zap className="w-4 h-4" />
                本地解析，安全快速
              </div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                {t('upload.title')}
              </h2>
              <p className="text-lg text-gray-600 dark:text-slate-400">
                {t('upload.subtitle')}
              </p>
            </div>

            {/* Upload Component */}
            <div className="flex justify-center">
              <FileUpload
                onComplete={setParseResult}
                onError={setError}
                isLoading={isLoading}
                onLoadingChange={setIsLoading}
              />
            </div>

            {/* Features Section */}
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('features.title')}
                </h3>
                <p className="text-gray-600 dark:text-slate-400">
                  {t('features.subtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="group relative p-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {feature.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tech Stack Footer */}
              <div className="pt-8 border-t border-gray-200 dark:border-slate-700">
                <p className="text-center text-sm text-gray-500 dark:text-slate-400">
                  {t('features.techStack')}
                </p>
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
