import { ArrowRight } from 'lucide-react';

interface AnalysisCardProps {
  repoName: string;
  status: 'Complete' | 'In Progress' | 'Failed';
  date: string;
  summary: string;
}

export function AnalysisCard({ repoName, status, date, summary }: AnalysisCardProps) {
  const statusColors = {
    'Complete': 'bg-green-100 text-green-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    'Failed': 'bg-red-100 text-red-700'
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{repoName}</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status]}`}>
              {status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-2">{date}</p>
          <p className="text-gray-700">{summary}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 ml-4" />
      </div>
    </div>
  );
}
