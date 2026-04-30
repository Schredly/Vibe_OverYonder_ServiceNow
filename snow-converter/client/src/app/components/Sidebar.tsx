import { Home, Clock, Settings, Key, CreditCard, HelpCircle, LogOut, LayoutGrid, FileSearch, FileCheck, Package } from 'lucide-react';

interface SidebarProps {
  activePage?: 'dashboard' | 'analysis' | 'recommendations' | 'export' | 'history' | 'settings';
  onNavigate?: (page: 'dashboard' | 'analysis' | 'recommendations' | 'export' | 'history' | 'settings') => void;
}

export function Sidebar({ activePage = 'dashboard', onNavigate }: SidebarProps) {
  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-orange-600">SNow Converter</h1>
        <p className="text-sm text-gray-500 mt-1">SERVICENOW ENGINE</p>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-1">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onNavigate?.('dashboard'); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
              activePage === 'dashboard'
                ? 'text-orange-600 bg-orange-50 border-l-4 border-orange-600 font-medium -ml-1'
                : 'text-gray-600 hover:bg-gray-50 transition-colors'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            Dashboard
          </a>

          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onNavigate?.('analysis'); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
              activePage === 'analysis'
                ? 'text-orange-600 bg-orange-50 border-l-4 border-orange-600 font-medium -ml-1'
                : 'text-gray-600 hover:bg-gray-50 transition-colors'
            }`}
          >
            <FileSearch className="w-5 h-5" />
            Analysis
          </a>

          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onNavigate?.('recommendations'); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
              activePage === 'recommendations'
                ? 'text-orange-600 bg-orange-50 border-l-4 border-orange-600 font-medium -ml-1'
                : 'text-gray-600 hover:bg-gray-50 transition-colors'
            }`}
          >
            <FileCheck className="w-5 h-5" />
            Recommendations
          </a>

          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onNavigate?.('export'); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
              activePage === 'export'
                ? 'text-orange-600 bg-orange-50 border-l-4 border-orange-600 font-medium -ml-1'
                : 'text-gray-600 hover:bg-gray-50 transition-colors'
            }`}
          >
            <Package className="w-5 h-5" />
            Export
          </a>

          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onNavigate?.('history'); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
              activePage === 'history'
                ? 'text-orange-600 bg-orange-50 border-l-4 border-orange-600 font-medium -ml-1'
                : 'text-gray-600 hover:bg-gray-50 transition-colors'
            }`}
          >
            <Clock className="w-5 h-5" />
            History
          </a>

          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onNavigate?.('settings'); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
              activePage === 'settings'
                ? 'text-orange-600 bg-orange-50 border-l-4 border-orange-600 font-medium -ml-1'
                : 'text-gray-600 hover:bg-gray-50 transition-colors'
            }`}
          >
            <Settings className="w-5 h-5" />
            Settings
          </a>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="space-y-1">
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Key className="w-5 h-5" />
              API Keys
            </a>

            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              Plan & Billing
            </a>

            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              Help
            </a>
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="px-4 py-2">
          <p className="font-medium text-gray-900">Eric Schmidt</p>
          <p className="text-sm text-gray-500">eric@example.com</p>
        </div>
        <a
          href="#"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors mt-2"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </a>
      </div>
    </aside>
  );
}
