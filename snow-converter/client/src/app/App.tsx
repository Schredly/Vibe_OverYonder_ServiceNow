import { useState, useEffect, useRef } from 'react';
import { Github } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { AnalysisCard } from './components/AnalysisCard';
import { AnalysisPage } from './components/AnalysisPage';
import { RecommendationsPage } from './components/RecommendationsPage';
import { ExportPage } from './components/ExportPage';
import { SettingsPage } from './components/SettingsPage';
import { useAnalysisStore } from '../stores/analysisStore';
import { useAnalysisPolling } from '../hooks/useAnalysisPolling';

type Page = 'dashboard' | 'analysis' | 'recommendations' | 'export' | 'settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [repoUrl, setRepoUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const analyses = useAnalysisStore((s) => s.analyses);
  const currentAnalysisId = useAnalysisStore((s) => s.currentAnalysisId);
  const startAnalysis = useAnalysisStore((s) => s.startAnalysis);
  const fetchAnalyses = useAnalysisStore((s) => s.fetchAnalyses);
  const fetchAnalysis = useAnalysisStore((s) => s.fetchAnalysis);
  const isLoading = useAnalysisStore((s) => s.isLoading);
  const resetSteps = useAnalysisStore((s) => s.resetSteps);

  // Poll SSE for current analysis
  useAnalysisPolling(currentAnalysisId);

  // Load recent analyses on mount
  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) return;
    resetSteps();
    try {
      const id = await startAnalysis(repoUrl.trim());
      setCurrentPage('analysis');
    } catch {
      // error is set in store
    }
  };

  const handleCardClick = async (analysis: (typeof analyses)[0]) => {
    await fetchAnalysis(analysis.id);
    if (analysis.status === 'complete') {
      setCurrentPage('recommendations');
    } else {
      setCurrentPage('analysis');
    }
  };

  const formatStatus = (status: string): 'Complete' | 'In Progress' | 'Failed' => {
    if (status === 'complete') return 'Complete';
    if (status === 'failed') return 'Failed';
    return 'In Progress';
  };

  const formatDate = (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatSummary = (a: (typeof analyses)[0]): string => {
    if (a.status === 'failed') return a.error || 'Analysis failed';
    if (a.status !== 'complete') return 'Processing codebase structure...';
    const s = a.stats;
    return `${s.tables} tables, ${s.apiEndpoints} APIs, ${s.businessLogicFiles} rules, ${s.uiComponents} UI`;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activePage={currentPage} onNavigate={setCurrentPage} />

      <main className="flex-1 overflow-auto">
        {currentPage === 'dashboard' ? (
          <div className="max-w-6xl mx-auto py-8 px-10">
            <div className="mb-8">
              <h1 className="text-4xl font-semibold text-gray-900 mb-2">
                Analyze & Convert GitHub Repos to ServiceNow
              </h1>
              <p className="text-lg text-gray-500">
                Paste a GitHub repository URL to get started.
              </p>
            </div>

            <div className="mb-10">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-2 flex items-center gap-3">
                <div className="pl-4">
                  <Github className="w-6 h-6 text-gray-400" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  placeholder="https://github.com/org/repo"
                  className="flex-1 px-4 py-4 text-lg outline-none text-gray-900"
                />
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-8 py-4 rounded-lg font-medium transition-colors"
                >
                  {isLoading ? 'Starting...' : 'Analyze'}
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Recent Analyses
              </h2>
              <div className="space-y-4">
                {analyses.length === 0 ? (
                  <p className="text-gray-500">No analyses yet. Enter a GitHub URL above to get started.</p>
                ) : (
                  analyses.map((analysis) => (
                    <div key={analysis.id} onClick={() => handleCardClick(analysis)} className="cursor-pointer">
                      <AnalysisCard
                        repoName={analysis.repoName}
                        status={formatStatus(analysis.status)}
                        date={`Analyzed on ${formatDate(analysis.createdAt)}`}
                        summary={formatSummary(analysis)}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : currentPage === 'analysis' ? (
          <AnalysisPage onNavigate={setCurrentPage} />
        ) : currentPage === 'recommendations' ? (
          <RecommendationsPage onNavigate={setCurrentPage} />
        ) : currentPage === 'export' ? (
          <ExportPage />
        ) : (
          <SettingsPage />
        )}
      </main>
    </div>
  );
}
