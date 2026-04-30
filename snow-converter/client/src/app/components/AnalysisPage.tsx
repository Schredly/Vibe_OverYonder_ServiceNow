import { ChevronRight, Folder, FolderOpen, File, Check, Loader2, Database, Zap, Code2, Layout } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAnalysisStore } from '../../stores/analysisStore';
import type { FileNode } from '../../../../shared/types';

function FileTreeNode({ node, level = 0 }: { node: FileNode; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  const languageColors: Record<string, string> = {
    typescript: 'bg-blue-500',
    python: 'bg-green-500',
    html: 'bg-orange-500',
    javascript: 'bg-yellow-500',
    go: 'bg-cyan-500',
    java: 'bg-red-500',
  };

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-lg cursor-pointer group"
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={() => node.type === 'folder' && setIsExpanded(!isExpanded)}
      >
        {node.type === 'folder' && (
          <ChevronRight
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
        )}
        {node.type === 'folder' ? (
          isExpanded ? <FolderOpen className="w-5 h-5 text-orange-500" /> : <Folder className="w-5 h-5 text-gray-400" />
        ) : (
          <File className="w-5 h-5 text-gray-400" />
        )}
        <span className="flex-1 text-gray-700">{node.name}</span>
        {node.language && <div className={`w-2 h-2 rounded-full ${languageColors[node.language] || 'bg-gray-400'}`} />}
        {node.type === 'folder' && node.fileCount != null && <span className="text-xs text-gray-400">{node.fileCount}</span>}
      </div>
      {node.type === 'folder' && isExpanded && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTreeNode key={index} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

interface StepProps {
  title: string;
  status: 'complete' | 'in-progress' | 'pending';
  isLast?: boolean;
}

function StepItem({ title, status, isLast }: StepProps) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            status === 'complete'
              ? 'bg-green-100 text-green-600'
              : status === 'in-progress'
              ? 'bg-orange-100 text-orange-600'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          {status === 'complete' && <Check className="w-5 h-5" />}
          {status === 'in-progress' && <Loader2 className="w-5 h-5 animate-spin" />}
          {status === 'pending' && <div className="w-2 h-2 rounded-full bg-gray-400" />}
        </div>
        {!isLast && <div className="w-0.5 h-12 bg-gray-200 mt-2" />}
      </div>
      <div className="flex-1 pb-8">
        <p className={`font-medium ${status === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>
          {title}
        </p>
      </div>
    </div>
  );
}

interface AnalysisPageProps {
  onNavigate?: (page: 'dashboard' | 'analysis' | 'recommendations' | 'export' | 'settings') => void;
}

export function AnalysisPage({ onNavigate }: AnalysisPageProps) {
  const steps = useAnalysisStore((s) => s.steps);
  const currentAnalysis = useAnalysisStore((s) => s.currentAnalysis);
  const error = useAnalysisStore((s) => s.error);

  const fileTree = currentAnalysis?.fileTree || [];
  const stats = currentAnalysis?.stats;
  const repoName = currentAnalysis?.repoName || 'Loading...';

  useEffect(() => {
    if (currentAnalysis?.status === 'complete' && onNavigate) {
      const timer = setTimeout(() => onNavigate('recommendations'), 1500);
      return () => clearTimeout(timer);
    }
  }, [currentAnalysis?.status, onNavigate]);

  const detectionStats = [
    { label: 'Tables detected', value: stats?.tables || 0, icon: Database, color: 'text-blue-600' },
    { label: 'API endpoints', value: stats?.apiEndpoints || 0, icon: Zap, color: 'text-green-600' },
    { label: 'Business logic files', value: stats?.businessLogicFiles || 0, icon: Code2, color: 'text-purple-600' },
    { label: 'UI components', value: stats?.uiComponents || 0, icon: Layout, color: 'text-orange-600' },
  ];

  return (
    <div className="py-8 px-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <span className="hover:text-orange-600 cursor-pointer" onClick={() => onNavigate?.('dashboard')}>Home</span>
        <ChevronRight className="w-4 h-4" />
        <span>Analysis</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">{repoName}</span>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-5 gap-8">
        <div className="col-span-3">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Repository Structure</h2>
            {fileTree.length > 0 ? (
              <div className="space-y-1">
                {fileTree.map((node, index) => (
                  <FileTreeNode key={index} node={node} />
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                <p>Cloning repository...</p>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Analysis Steps</h2>
            <div>
              {steps.map((step, index) => (
                <StepItem key={index} title={step.title} status={step.status} isLast={index === steps.length - 1} />
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Detection Summary</h2>
            <div className="space-y-4">
              {detectionStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg bg-gray-50 ${stat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-600">{stat.label}</p>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
