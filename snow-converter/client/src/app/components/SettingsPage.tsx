import { ChevronDown, Eye, EyeOff, Zap, Clock, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('llm');
  const [showApiKey, setShowApiKey] = useState(false);

  const settings = useSettingsStore((s) => s.settings);
  const stats = useSettingsStore((s) => s.stats);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const saveSettings = useSettingsStore((s) => s.saveSettings);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const fetchStats = useSettingsStore((s) => s.fetchStats);
  const isSaving = useSettingsStore((s) => s.isSaving);

  useEffect(() => {
    fetchSettings();
    fetchStats();
  }, [fetchSettings, fetchStats]);

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'llm', label: 'LLM Configuration' },
    { id: 'servicenow', label: 'ServiceNow Instance' },
  ];

  const modelOptions: Record<string, string[]> = {
    OpenAI: ['GPT-5', 'GPT-4 Turbo', 'GPT-4o', 'GPT-3.5 Turbo'],
    Anthropic: ['Claude Opus', 'Claude Sonnet', 'Claude Haiku'],
    Local: ['Llama 3', 'Mistral', 'CodeLlama'],
  };

  return (
    <div className="py-8 px-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your application preferences and configuration</p>
        </div>

        <div className="mb-6">
          <div className="border-b border-gray-200">
            <div className="flex gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 px-1 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-600 text-orange-600 font-medium'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeTab === 'llm' && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Model Configuration</h2>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">API Provider</label>
                    <div className="relative">
                      <select
                        value={settings.provider}
                        onChange={(e) => {
                          const provider = e.target.value as any;
                          updateSettings({ provider, model: modelOptions[provider][0] });
                        }}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white pr-10"
                      >
                        <option>OpenAI</option>
                        <option>Anthropic</option>
                        <option>Local</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                    <div className="relative">
                      <select
                        value={settings.model}
                        onChange={(e) => updateSettings({ model: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white pr-10"
                      >
                        {(modelOptions[settings.provider] || []).map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.apiKey}
                      onChange={(e) => updateSettings({ apiKey: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12"
                      placeholder="Enter your API key"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Enable Hydration Cache</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Optimizes repeated LLM calls by caching intermediate results
                      </p>
                    </div>
                    <button
                      onClick={() => updateSettings({ enableCache: !settings.enableCache })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.enableCache ? 'bg-orange-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.enableCache ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">Max Tokens per Request</label>
                    <span className="text-sm font-semibold text-gray-900">{settings.maxTokens}</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="8000"
                    step="100"
                    value={settings.maxTokens}
                    onChange={(e) => updateSettings({ maxTokens: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-orange"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1,000</span>
                    <span>8,000</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">Temperature</label>
                    <span className="text-sm font-semibold text-gray-900">{settings.temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.temperature}
                    onChange={(e) => updateSettings({ temperature: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-orange"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span>1</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Hydration Stats</h2>
              <div className="grid grid-cols-3 gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Cache hit rate</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {Math.round(stats.cacheHitRate * 100)}%
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Tokens saved</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.tokensSaved >= 1000 ? `${Math.round(stats.tokensSaved / 1000)}K` : stats.tokensSaved}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Avg response time</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {(stats.avgResponseTime / 1000).toFixed(1)}s
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveSettings}
                disabled={isSaving}
                className="px-8 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg transition-colors font-medium"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'general' && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <p className="text-gray-500">General settings coming soon...</p>
          </div>
        )}

        {activeTab === 'servicenow' && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <p className="text-gray-500">ServiceNow instance configuration coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
