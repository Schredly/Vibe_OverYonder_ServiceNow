import { ChevronDown, ChevronRight, ArrowRight, Check, Edit3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAnalysisStore } from '../../stores/analysisStore';
import { useRecommendationsStore } from '../../stores/recommendationsStore';
import type { Recommendation, ArtifactCategory } from '../../../../shared/types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAccept: () => void;
  onSkip: () => void;
}

function RecommendationCard({ recommendation, onAccept, onSkip }: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div
        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          )}
          <div className="flex-1 flex items-center gap-4">
            <span className="text-gray-700 font-mono text-sm">{recommendation.sourcePath}</span>
            <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <span className="text-gray-900 font-medium">{recommendation.targetName}</span>
          </div>
          {recommendation.status === 'accepted' && (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">Accepted</span>
          )}
          {recommendation.status === 'edited' && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">Edited</span>
          )}
          {recommendation.status === 'skipped' && (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">Skipped</span>
          )}
          {recommendation.confidence != null && (
            <span className="text-xs text-gray-400">{Math.round(recommendation.confidence * 100)}%</span>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200">
          <div className="grid grid-cols-2 gap-0">
            <div className="bg-gray-900 p-6">
              <h4 className="text-gray-400 text-sm font-medium mb-3">Original Source</h4>
              <pre className="text-gray-300 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                <code>{recommendation.sourceCode}</code>
              </pre>
            </div>
            <div className="bg-gray-900 p-6 border-l border-gray-700">
              <h4 className="text-gray-400 text-sm font-medium mb-3">ServiceNow Fluent API</h4>
              <pre className="text-gray-300 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                <code>{recommendation.editedCode || recommendation.targetCode}</code>
              </pre>
            </div>
          </div>
          <div className="p-6 bg-gray-50 flex justify-end gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); onSkip(); }}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium"
            >
              Skip
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onAccept(); }}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Accept
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface RecommendationsPageProps {
  onNavigate?: (page: 'dashboard' | 'analysis' | 'recommendations' | 'export' | 'settings') => void;
}

export function RecommendationsPage({ onNavigate }: RecommendationsPageProps) {
  const currentAnalysis = useAnalysisStore((s) => s.currentAnalysis);
  const currentAnalysisId = useAnalysisStore((s) => s.currentAnalysisId);

  const recommendations = useRecommendationsStore((s) => s.recommendations);
  const activeTab = useRecommendationsStore((s) => s.activeTab);
  const setActiveTab = useRecommendationsStore((s) => s.setActiveTab);
  const updateStatus = useRecommendationsStore((s) => s.updateStatus);
  const fetchRecommendations = useRecommendationsStore((s) => s.fetchRecommendations);
  const getAcceptedCount = useRecommendationsStore((s) => s.getAcceptedCount);
  const getConfidence = useRecommendationsStore((s) => s.getConfidence);

  useEffect(() => {
    if (currentAnalysisId) {
      fetchRecommendations(currentAnalysisId);
    }
  }, [currentAnalysisId, fetchRecommendations]);

  const tabs: ArtifactCategory[] = ['Tables', 'Business Rules', 'UI Pages', 'REST APIs', 'Script Includes', 'Service Catalog'];
  const acceptedCount = getAcceptedCount();
  const confidence = getConfidence();
  const repoName = currentAnalysis?.repoName || 'Repository';

  return (
    <div className="py-8 px-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">{repoName}</h1>
          <div className="flex items-center gap-3">
            {confidence > 0 && (
              <span className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full font-medium">
                {confidence}% convertible
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onNavigate?.('export')}
          className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          Export All Accepted
          {acceptedCount > 0 && (
            <span className="px-2 py-0.5 bg-orange-800 rounded-full text-sm">{acceptedCount}</span>
          )}
        </button>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-1 border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-orange-600 text-orange-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
                {recommendations[tab].length > 0 && (
                  <span className="ml-2 text-sm text-gray-400">({recommendations[tab].length})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {recommendations[activeTab].length > 0 ? (
          recommendations[activeTab].map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              onAccept={() => currentAnalysisId && updateStatus(currentAnalysisId, rec.id, 'accepted')}
              onSkip={() => currentAnalysisId && updateStatus(currentAnalysisId, rec.id, 'skipped')}
            />
          ))
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-500">No recommendations available for this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
