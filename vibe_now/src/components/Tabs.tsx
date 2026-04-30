import { useState, type ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
}

export function Tabs({ tabs, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id);

  return (
    <div className="w-full">
      <div className="flex gap-1 border-b border-[var(--border-subtle)] mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5
              text-[var(--text-base)] font-medium
              border-b-2 transition-all duration-200
              ${
                activeTab === tab.id
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }
            `}
          >
            {tab.icon && <span className="text-sm">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="animate-[fadeIn_0.2s_ease-in]">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}
