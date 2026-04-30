import { ChevronDown, ChevronRight, FileText, Folder, FolderOpen, Github, Download, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useAnalysisStore } from '../../stores/analysisStore';
import { useExportStore } from '../../stores/exportStore';
import type { FileNode } from '../../../../shared/types';

function FileTreeItem({ node, level = 0 }: { node: FileNode; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-lg cursor-pointer"
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={() => node.type === 'folder' && setIsExpanded(!isExpanded)}
      >
        {node.type === 'folder' && (
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        )}
        {node.type === 'folder' ? (
          isExpanded ? <FolderOpen className="w-5 h-5 text-orange-500" /> : <Folder className="w-5 h-5 text-gray-400" />
        ) : (
          <FileText className="w-5 h-5 text-gray-400" />
        )}
        <span className="flex-1 text-gray-700 font-mono text-sm">{node.name}</span>
        {node.fileCount != null && (
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">{node.fileCount}</span>
        )}
      </div>
      {node.type === 'folder' && isExpanded && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTreeItem key={index} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ExportPage() {
  const currentAnalysisId = useAnalysisStore((s) => s.currentAnalysisId);
  const config = useExportStore((s) => s.config);
  const setConfig = useExportStore((s) => s.setConfig);
  const generatedTree = useExportStore((s) => s.generatedTree);
  const isGenerating = useExportStore((s) => s.isGenerating);
  const generateProject = useExportStore((s) => s.generateProject);
  const downloadZip = useExportStore((s) => s.downloadZip);
  const exportId = useExportStore((s) => s.exportId);

  const [showToast, setShowToast] = useState(true);

  const handleGenerate = async () => {
    if (currentAnalysisId) {
      await generateProject(currentAnalysisId);
    }
  };

  return (
    <div className="py-8 px-10">
      {showToast && (
        <div className="fixed top-6 right-6 bg-white border border-gray-200 rounded-xl shadow-lg p-4 flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-gray-900 font-medium">Ready to export</p>
            <p className="text-sm text-gray-600">Configure and generate your ServiceNow SDK project</p>
          </div>
          <button onClick={() => setShowToast(false)} className="text-gray-400 hover:text-gray-600">x</button>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Generate ServiceNow SDK Project</h1>
          <p className="text-gray-600">Configure your project settings and export your ServiceNow application</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Project Configuration</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Application Scope</label>
                <input
                  type="text"
                  value={config.scope}
                  onChange={(e) => setConfig({ scope: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="x_appname"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Application Name</label>
                <input
                  type="text"
                  value={config.appName}
                  onChange={(e) => setConfig({ appName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="My ServiceNow App"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">UI Framework</label>
              <div className="relative">
                <select
                  value={config.framework}
                  onChange={(e) => setConfig({ framework: e.target.value as any })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white pr-10"
                >
                  <option>React</option>
                  <option>Vue</option>
                  <option>Svelte</option>
                  <option>SolidJS</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={config.description}
                onChange={(e) => setConfig({ description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                placeholder="Describe your ServiceNow application..."
              />
            </div>
          </div>
        </div>

        {!generatedTree && (
          <div className="mb-6 flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !config.appName}
              className="px-8 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg transition-colors font-medium"
            >
              {isGenerating ? 'Generating...' : 'Generate Project'}
            </button>
          </div>
        )}

        {generatedTree && (
          <>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Project Preview</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                {generatedTree.map((node, index) => (
                  <FileTreeItem key={index} node={node} />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-2">
                <Copy className="w-4 h-4" />
                Copy CLI commands
              </button>
              <div className="flex gap-3">
                <button
                  onClick={downloadZip}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download as ZIP
                </button>
                <button className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2">
                  <Github className="w-5 h-5" />
                  Push to GitHub
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
