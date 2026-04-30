import { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Eye,
  EyeOff,
  ShieldAlert,
  Star,
  Plug,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import {
  addAliasAsync,
  detectBackend,
  isBackendMode,
  loadAliasesAsync,
  normalizeInstanceUrl,
  removeAliasAsync,
  setDefaultAliasAsync,
  testAliasConnection,
  updateAliasAsync,
  validateAlias,
  type AliasFormInput,
  type TestResult,
} from '../lib/authAliases';
import {
  PROVIDERS,
  LLM_KEY_ON_FILE_SENTINEL,
  clearLlmConfigAsync,
  loadLlmConfigAsync,
  providerInfo,
  saveLlmConfigAsync,
  testLlmConfigAsync,
  type LlmConfig,
  type LlmProvider,
  type LlmTestResult,
} from '../lib/llmConfig';
import type { AuthAlias, ConsultantMode } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultantMode: ConsultantMode;
  onChangeMode: (mode: ConsultantMode) => void;
}

type FormState = AliasFormInput;

const emptyForm: FormState = {
  name: '',
  instanceUrl: '',
  username: '',
  password: '',
  savePassword: false,
  isDefault: false,
};

function defaultLlmConfig(): LlmConfig {
  const info = PROVIDERS[0];
  return {
    provider: info.id,
    model: info.models[0] ?? '',
    apiKey: '',
    baseUrl: info.defaultBaseUrl,
    saveKey: false,
    updatedAt: new Date().toISOString(),
  };
}

export function SettingsModal({
  isOpen,
  onClose,
  consultantMode,
  onChangeMode,
}: SettingsModalProps) {
  const on = consultantMode === 'on';

  const [aliases, setAliases] = useState<AuthAlias[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const [llm, setLlm] = useState<LlmConfig>(defaultLlmConfig());
  const [showLlmKey, setShowLlmKey] = useState(false);
  const [llmTesting, setLlmTesting] = useState(false);
  const [llmTestResult, setLlmTestResult] = useState<LlmTestResult | null>(null);
  const [llmSaved, setLlmSaved] = useState(false);

  const [backendReady, setBackendReady] = useState(false);

  useEffect(() => {
    if (isOpen) {
      void (async () => {
        await detectBackend();
        setBackendReady(isBackendMode());
        setAliases(await loadAliasesAsync());
        const stored = await loadLlmConfigAsync();
        if (stored) {
          setLlm(stored);
          setLlmSaved(true);
        } else {
          setLlm(defaultLlmConfig());
          setLlmSaved(false);
        }
        setLlmTestResult(null);
      })();
    }
  }, [isOpen]);

  const llmProvider = useMemo(() => providerInfo(llm.provider), [llm.provider]);

  const updateLlm = (patch: Partial<LlmConfig>) => {
    setLlm((prev) => ({ ...prev, ...patch, updatedAt: new Date().toISOString() }));
    setLlmTestResult(null);
    setLlmSaved(false);
  };

  const handleLlmProviderChange = (next: LlmProvider) => {
    const info = providerInfo(next);
    const firstModel = info.models[0] ?? '';
    updateLlm({
      provider: next,
      model: firstModel,
      baseUrl: info.defaultBaseUrl || llm.baseUrl || '',
    });
  };

  const [llmError, setLlmError] = useState<string | null>(null);

  const handleLlmSave = async () => {
    setLlmError(null);
    try {
      const saved = await saveLlmConfigAsync(llm);
      // After a successful save the key is on file server-side; replace the
      // textarea contents with the sentinel so the user sees "Key on file"
      // without us holding plaintext in component state.
      setLlm({ ...saved, apiKey: LLM_KEY_ON_FILE_SENTINEL });
      setLlmSaved(true);
    } catch (err) {
      setLlmError((err as Error).message);
    }
  };

  const handleLlmClear = async () => {
    setLlmError(null);
    try {
      await clearLlmConfigAsync(llm.provider);
      setLlm(defaultLlmConfig());
      setLlmSaved(false);
      setLlmTestResult(null);
    } catch (err) {
      setLlmError((err as Error).message);
    }
  };

  const handleLlmTest = async () => {
    setLlmTesting(true);
    setLlmTestResult(null);
    const result = await testLlmConfigAsync(llm);
    setLlmTestResult(result);
    setLlmTesting(false);
  };

  const validation = useMemo(
    () => validateAlias(form, aliases, editingId ?? undefined),
    [form, aliases, editingId],
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(false);
    setShowPassword(false);
    setSubmitAttempted(false);
    setTestResult(null);
    setTesting(false);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testAliasConnection(form.instanceUrl);
    setTestResult(result);
    setTesting(false);
  };

  const openAddForm = () => {
    setForm({ ...emptyForm, isDefault: aliases.length === 0 });
    setEditingId(null);
    setFormOpen(true);
    setShowPassword(false);
    setSubmitAttempted(false);
  };

  const openEditForm = (alias: AuthAlias) => {
    setForm({
      name: alias.name,
      instanceUrl: alias.instanceUrl,
      username: alias.username,
      password: alias.password ?? '',
      savePassword: alias.savePassword,
      isDefault: alias.isDefault,
    });
    setEditingId(alias.id);
    setFormOpen(true);
    setShowPassword(false);
    setSubmitAttempted(false);
  };

  const [aliasError, setAliasError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    setAliasError(null);
    if (!validation.ok) return;
    try {
      if (editingId) {
        await updateAliasAsync(editingId, form);
      } else {
        await addAliasAsync(form);
      }
      setAliases(await loadAliasesAsync());
      resetForm();
    } catch (err) {
      setAliasError((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    setAliasError(null);
    try {
      await removeAliasAsync(id);
      setAliases(await loadAliasesAsync());
      if (editingId === id) resetForm();
    } catch (err) {
      setAliasError((err as Error).message);
    }
  };

  const handleSetDefault = async (id: string) => {
    setAliasError(null);
    try {
      await setDefaultAliasAsync(id);
      setAliases(await loadAliasesAsync());
    } catch (err) {
      setAliasError((err as Error).message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      size="lg"
      footer={
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-6">
        <section>
          <h3 className="text-[var(--text-xs)] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
            AI Behavior
          </h3>

          <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                  <label
                    htmlFor="consultant-mode-toggle"
                    className="text-[var(--text-base)] font-semibold text-[var(--text-primary)]"
                  >
                    Consultant Mode
                  </label>
                </div>
                <p className="text-[var(--text-sm)] text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                  {on
                    ? 'Consultant Mode — a senior ServiceNow solution architect voice. Reflects the request, weighs tradeoffs, and recommends the next move as you shape the app.'
                    : 'Direct Build Mode — a concise builder copilot. Proposes sensible defaults and keeps the conversation focused on what ships.'}
                </p>
              </div>
              <Toggle
                id="consultant-mode-toggle"
                checked={on}
                onChange={(next) => onChangeMode(next ? 'on' : 'off')}
                label="Consultant Mode"
              />
            </div>
          </div>

          <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] mt-2 leading-relaxed">
            Mode affects tone and guidance only. Living Spec, ServiceNow guardrails, and the build
            flow are identical in both modes.
          </p>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[var(--text-xs)] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              ServiceNow Instances
            </h3>
            {!formOpen && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={openAddForm}
              >
                Add Instance
              </Button>
            )}
          </div>

          {backendReady ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--success)]/30 bg-[var(--success-bg)] px-3 py-2 flex items-start gap-2 mb-3">
              <Check className="w-4 h-4 text-[var(--success)] mt-0.5 shrink-0" />
              <p className="text-[var(--text-xs)] text-[var(--text-secondary)] leading-relaxed">
                Backend connected. Credentials are stored encrypted server-side and handed directly
                to <code className="font-mono">now-sdk auth --add</code> at deploy time.
              </p>
            </div>
          ) : (
            <div className="rounded-[var(--radius-md)] border border-[var(--warning)]/30 bg-[var(--warning)]/5 px-3 py-2 flex items-start gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-[var(--warning)] mt-0.5 shrink-0" />
              <p className="text-[var(--text-xs)] text-[var(--text-secondary)] leading-relaxed">
                Backend not detected — using local fallback. Start the API with{' '}
                <code className="font-mono">npm run dev</code> in{' '}
                <code className="font-mono">vibe_now_api/</code> to enable real deploys. Until then
                this form writes to localStorage and deploys stay simulated.
              </p>
            </div>
          )}

          {aliasError && (
            <div className="rounded-[var(--radius-md)] border border-[var(--danger)]/40 bg-[var(--danger-bg)] px-3 py-2 mb-3 text-[var(--text-xs)] text-[var(--danger-text)]">
              {aliasError}
            </div>
          )}

          {aliases.length === 0 && !formOpen && (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-subtle)] px-4 py-6 text-center">
              <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
                No instances saved yet. Add your PDI or sub-prod instance to enable one-click
                Deploy.
              </p>
            </div>
          )}

          {aliases.length > 0 && (
            <ul className="space-y-2 mb-3">
              {aliases.map((alias) => (
                <li
                  key={alias.id}
                  className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 flex items-start gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[var(--text-sm)] font-semibold text-[var(--text-primary)]">
                        {alias.name}
                      </span>
                      {alias.isDefault && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[var(--text-xs)] font-semibold">
                          <Star className="w-3 h-3" />
                          Default
                        </span>
                      )}
                      {alias.savePassword ? (
                        <span className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                          password saved locally
                        </span>
                      ) : (
                        <span className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                          password not saved
                        </span>
                      )}
                    </div>
                    <div className="text-[var(--text-xs)] text-[var(--text-secondary)] font-mono mt-1 truncate">
                      {alias.instanceUrl}
                    </div>
                    <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] mt-0.5">
                      user: {alias.username}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!alias.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(alias.id)}
                        title="Set as default"
                        className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--primary)] transition-colors"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditForm(alias)}
                      title="Edit"
                      className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--accent-cyan)] transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(alias.id)}
                      title="Delete"
                      className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--danger)] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {formOpen && (
            <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[var(--text-sm)] font-semibold text-[var(--text-primary)]">
                  {editingId ? 'Edit Instance' : 'Add Instance'}
                </h4>
                <button
                  type="button"
                  onClick={resetForm}
                  aria-label="Cancel"
                  className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Alias"
                  placeholder="dev378814"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  error={submitAttempted ? validation.errors.name : undefined}
                />
                <Input
                  label="Instance URL"
                  placeholder="https://dev378814.service-now.com"
                  value={form.instanceUrl}
                  onChange={(e) => {
                    setForm({ ...form, instanceUrl: e.target.value });
                    if (testResult) setTestResult(null);
                  }}
                  onBlur={(e) =>
                    setForm({ ...form, instanceUrl: normalizeInstanceUrl(e.target.value) })
                  }
                  error={submitAttempted ? validation.errors.instanceUrl : undefined}
                />
              </div>

              <Input
                label="Username"
                placeholder="admin"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                error={submitAttempted ? validation.errors.username : undefined}
              />

              <div>
                <label className="block text-[var(--text-primary)] text-[var(--text-sm)] font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className={`w-full px-3 py-2 pr-10 bg-[var(--bg-card)] border rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all ${
                      submitAttempted && validation.errors.password
                        ? 'border-[var(--danger)]'
                        : 'border-[var(--border-subtle)]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {submitAttempted && validation.errors.password && (
                  <p className="text-[var(--danger)] text-[var(--text-sm)] mt-1">
                    {validation.errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2 pt-1">
                <Checkbox
                  id="save-password"
                  checked={form.savePassword}
                  onChange={(v) => setForm({ ...form, savePassword: v })}
                  label="Save password to this browser"
                  hint="Stored in plaintext localStorage. Clear when done on shared machines."
                />
                <Checkbox
                  id="set-default"
                  checked={form.isDefault}
                  onChange={(v) => setForm({ ...form, isDefault: v })}
                  label="Set as default deploy target"
                />
              </div>

              {testResult && <TestResultBanner result={testResult} />}

              <div className="flex items-center justify-between gap-2 pt-2 flex-wrap">
                <Button
                  variant="secondary"
                  icon={
                    testing ? (
                      <Loader2 className="w-4 h-4 animate-[spin_1s_linear_infinite]" />
                    ) : (
                      <Plug className="w-4 h-4" />
                    )
                  }
                  onClick={handleTest}
                  disabled={testing || !form.instanceUrl.trim()}
                >
                  {testing ? 'Testing…' : 'Test Connection'}
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    icon={<Check className="w-4 h-4" />}
                    onClick={handleSubmit}
                  >
                    {editingId ? 'Save Changes' : 'Add Instance'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[var(--text-xs)] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              LLM Provider
            </h3>
            {llmSaved && (
              <span className="text-[var(--text-xs)] text-[var(--success-text)]">
                {backendReady ? 'Saved on server' : 'Saved locally'}
              </span>
            )}
          </div>

          {backendReady ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--success)]/30 bg-[var(--success-bg)] px-3 py-2 flex items-start gap-2 mb-3">
              <Check className="w-4 h-4 text-[var(--success)] mt-0.5 shrink-0" />
              <p className="text-[var(--text-xs)] text-[var(--text-secondary)] leading-relaxed">
                Backend connected. API keys are AES-256-GCM encrypted server-side under{' '}
                <code className="font-mono">VIBE_MASTER_KEY</code> and never leave the server. The
                spec extractor and future build/turn endpoints read them via the resolver ladder
                (stored credential → env var → 503).
              </p>
            </div>
          ) : (
            <div className="rounded-[var(--radius-md)] border border-[var(--warning)]/30 bg-[var(--warning)]/5 px-3 py-2 flex items-start gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-[var(--warning)] mt-0.5 shrink-0" />
              <p className="text-[var(--text-xs)] text-[var(--text-secondary)] leading-relaxed">
                Backend not detected — using local fallback. Start the API with{' '}
                <code className="font-mono">npm run dev</code> in{' '}
                <code className="font-mono">vibe_now_api/</code> to enable encrypted server-side
                key storage. Until then keys are written to plaintext localStorage and CORS blocks
                most provider auth checks.
              </p>
            </div>
          )}

          {llmError && (
            <div className="rounded-[var(--radius-md)] border border-[var(--danger)]/40 bg-[var(--danger-bg)] px-3 py-2 mb-3 text-[var(--text-xs)] text-[var(--danger-text)]">
              {llmError}
            </div>
          )}

          <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="llm-provider"
                  className="block text-[var(--text-primary)] text-[var(--text-sm)] font-medium mb-2"
                >
                  Provider
                </label>
                <select
                  id="llm-provider"
                  value={llm.provider}
                  onChange={(e) => handleLlmProviderChange(e.target.value as LlmProvider)}
                  className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="llm-model"
                  className="block text-[var(--text-primary)] text-[var(--text-sm)] font-medium mb-2"
                >
                  Model
                </label>
                {llm.provider === 'custom' || llmProvider.models.length === 0 ? (
                  <Input
                    id="llm-model"
                    placeholder="e.g. gpt-4o or your deployed name"
                    value={llm.model}
                    onChange={(e) => updateLlm({ model: e.target.value })}
                  />
                ) : (
                  <select
                    id="llm-model"
                    value={llm.model}
                    onChange={(e) => updateLlm({ model: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 font-mono text-[var(--text-sm)]"
                  >
                    {llmProvider.models.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[var(--text-primary)] text-[var(--text-sm)] font-medium mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showLlmKey ? 'text' : 'password'}
                  autoComplete="off"
                  value={
                    llm.apiKey === LLM_KEY_ON_FILE_SENTINEL ? '' : (llm.apiKey ?? '')
                  }
                  onChange={(e) => updateLlm({ apiKey: e.target.value })}
                  placeholder={
                    llm.apiKey === LLM_KEY_ON_FILE_SENTINEL
                      ? 'Key on file — type to replace'
                      : llmProvider.keyPrefix
                        ? `${llmProvider.keyPrefix}…`
                        : '••••••••'
                  }
                  className="w-full px-3 py-2 pr-10 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 font-mono text-[var(--text-sm)]"
                />
                <button
                  type="button"
                  onClick={() => setShowLlmKey((v) => !v)}
                  aria-label={showLlmKey ? 'Hide key' : 'Show key'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                  {showLlmKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {llmProvider.keyHint && (
                <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] mt-1">
                  {llmProvider.keyHint}
                </p>
              )}
            </div>

            <Input
              label="Base URL (optional)"
              placeholder={llmProvider.defaultBaseUrl || 'https://your-endpoint/v1'}
              value={llm.baseUrl ?? ''}
              onChange={(e) => updateLlm({ baseUrl: e.target.value })}
            />

            {!backendReady && (
              <Checkbox
                id="llm-save-key"
                checked={llm.saveKey}
                onChange={(v) => updateLlm({ saveKey: v })}
                label="Save API key to this browser"
                hint="Stored in plaintext localStorage. Leave off on shared machines — you'll re-enter the key each session."
              />
            )}

            {llmTestResult && <TestResultBanner result={llmTestResult} />}

            <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  icon={
                    llmTesting ? (
                      <Loader2 className="w-4 h-4 animate-[spin_1s_linear_infinite]" />
                    ) : (
                      <Plug className="w-4 h-4" />
                    )
                  }
                  onClick={handleLlmTest}
                  disabled={llmTesting}
                >
                  {llmTesting ? 'Testing…' : 'Test Provider'}
                </Button>
                {llmSaved && (
                  <Button variant="ghost" onClick={handleLlmClear}>
                    Clear
                  </Button>
                )}
              </div>
              <Button
                variant="primary"
                icon={<Check className="w-4 h-4" />}
                onClick={handleLlmSave}
                disabled={!llm.model?.trim()}
              >
                {llmSaved ? 'Update' : 'Save Configuration'}
              </Button>
            </div>
          </div>

          <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] mt-2 leading-relaxed">
            {backendReady
              ? 'Spec extraction (doc upload) reads from this configuration today. Conversational turns and Fluent codegen will follow once the provider abstraction lands in phase 2.'
              : 'The assistant currently runs on deterministic scripts. Bring the backend online to enable real LLM calls — keys move to encrypted server-side storage automatically.'}
          </p>
        </section>
      </div>
    </Modal>
  );
}

interface ToggleProps {
  id?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}

function Toggle({ id, checked, onChange, label }: ToggleProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 ${
        checked ? 'bg-[var(--primary)]' : 'bg-[var(--border-subtle)]'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

interface BannerResult {
  level: 'success' | 'warning' | 'error';
  title: string;
  detail: string;
}

function TestResultBanner({ result }: { result: BannerResult }) {
  const palette =
    result.level === 'success'
      ? {
          border: 'border-[var(--success)]/40',
          bg: 'bg-[var(--success-bg)]',
          iconColor: 'text-[var(--success)]',
          title: 'text-[var(--success-text)]',
          Icon: CheckCircle2,
        }
      : result.level === 'warning'
        ? {
            border: 'border-[var(--warning)]/40',
            bg: 'bg-[var(--warning)]/10',
            iconColor: 'text-[var(--warning)]',
            title: 'text-[var(--text-primary)]',
            Icon: AlertTriangle,
          }
        : {
            border: 'border-[var(--danger)]/40',
            bg: 'bg-[var(--danger-bg)]',
            iconColor: 'text-[var(--danger)]',
            title: 'text-[var(--danger-text)]',
            Icon: XCircle,
          };
  const { Icon } = palette;
  return (
    <div
      className={`rounded-[var(--radius-md)] border ${palette.border} ${palette.bg} px-3 py-2 flex items-start gap-2`}
      role="status"
    >
      <Icon className={`w-4 h-4 ${palette.iconColor} mt-0.5 shrink-0`} />
      <div className="min-w-0">
        <div className={`text-[var(--text-sm)] font-semibold ${palette.title}`}>
          {result.title}
        </div>
        <div className="text-[var(--text-xs)] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
          {result.detail}
        </div>
      </div>
    </div>
  );
}

interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
}

function Checkbox({ id, checked, onChange, label, hint }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-2 cursor-pointer select-none"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-[var(--border-subtle)] text-[var(--primary)] focus:ring-[var(--primary)]/30 accent-[var(--primary)]"
      />
      <div className="min-w-0">
        <div className="text-[var(--text-sm)] text-[var(--text-primary)]">{label}</div>
        {hint && (
          <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] mt-0.5 leading-relaxed">
            {hint}
          </div>
        )}
      </div>
    </label>
  );
}
