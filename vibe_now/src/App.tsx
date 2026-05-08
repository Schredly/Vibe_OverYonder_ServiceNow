import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { RightPanel } from './components/RightPanel';
import { Modal } from './components/Modal';
import { Input, TextArea } from './components/Input';
import { Button } from './components/Button';
import { DeployProgress, type DeployStep } from './components/DeployProgress';
import { mockProjects, mockMessages } from './data/mockData';
import { PrototypeViewer } from './components/PrototypeViewer';
import { SettingsModal } from './components/SettingsModal';
import { CostAnalyticsModal } from './components/CostAnalyticsModal';
import { OpenPackageModal, type OpenPackagePayload } from './components/OpenPackageModal';
import { PushToGitHubModal } from './components/PushToGitHubModal';
import type { GitHubPushResult } from './lib/apiClient';
import {
  renderTurn,
  generateEchoReply as behaviorEchoReply,
  parseTableDefs,
} from './lib/assistantBehavior';
import { extractZipAssets, isZipFile, type ExtractionSummary } from './lib/figmaZip';
import {
  api,
  checkBackend,
  streamChatTurn,
  extractSpecFromDoc,
  streamRun,
  uploadFigmaZips,
  type ChatTurnReply,
  type ExtractedSpecPayload,
} from './lib/apiClient';
import { hasLlmKeyOnFile } from './lib/llmConfig';
import { deriveScopeSuffix } from './lib/scope';
import type {
  Project,
  Message,
  Spec,
  ProposalState,
  ProjectAsset,
  AssetKind,
  BuildStatus,
  DeployStatus,
  DeployLinks,
  ConsultantMode,
  UiTrack,
  InputTier,
  ExpectedFidelity,
  FigmaMakeBundle,
} from './types';

const nowTime = () =>
  new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const APPROVAL_KEYWORDS = [
  'looks good',
  'ship it',
  'ship',
  'deploy',
  'build it',
  'ready to build',
  'ready',
  'approve',
  'go ahead',
  'lgtm',
];

const containsApprovalKeyword = (text: string) =>
  APPROVAL_KEYWORDS.some((k) => text.toLowerCase().includes(k));

const classifyAsset = (file: File): { kind: AssetKind; role: ProjectAsset['role'] } => {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.fig') || file.type === 'application/figma') {
    return { kind: 'figma', role: 'mockup' };
  }
  if (file.type.startsWith('image/')) {
    if (lower.includes('logo')) return { kind: 'logo', role: 'logo' };
    if (lower.includes('icon') || lower.includes('favicon')) return { kind: 'image', role: 'icon' };
    return { kind: 'image', role: 'other' };
  }
  return { kind: 'other', role: 'other' };
};

// Derive an InputTier from the assets the user has uploaded.
// - any .zip / .fig figma file → full-figma
// - any image file (screenshot, photo) → sketch
// - mix of figma + images → partial-figma
// - no assets → null (tier still unknown)
const deriveInputTier = (assets: ProjectAsset[] | undefined): InputTier | null => {
  if (!assets || assets.length === 0) return null;
  const hasFigma = assets.some((a) => a.kind === 'figma');
  const hasImage = assets.some((a) => a.kind === 'image' || a.kind === 'logo');
  if (hasFigma && hasImage) return 'partial-figma';
  if (hasFigma) return 'full-figma';
  return 'sketch';
};

const tierToFidelity = (tier: InputTier | null): ExpectedFidelity | null => {
  if (tier === 'full-figma') return 'high';
  if (tier === 'partial-figma') return 'medium';
  if (tier === 'sketch') return 'approximate';
  return null;
};

const buildSpecFromProject = (project: Project): Spec => {
  // Single source of truth — see src/lib/scope.ts. Honors the user's URL
  // suffix as the scope name, validates against the PDI 18-char limit.
  const scope = deriveScopeSuffix(project);
  const slug = scope.suffix;
  const portalEnabled = project.portal?.enabled ?? false;
  const uiComponents = ['Workspace Page', 'List View'];
  if (portalEnabled) uiComponents.splice(1, 0, 'Service Portal', 'Portal Widgets');
  const features = [
    'Scoped app with a core record table',
    'Workspace page for internal users',
    ...(portalEnabled ? ['Service Portal for external users (branded + widgets)'] : []),
    'Flow Designer automation with notification subflow',
    'Role-based permissions (requester + approver)',
    'Activity history and audit trail',
  ];
  // User-explicit overrides win over auto-derivation. The override fields are
  // set when the conversational parser detects "yes/no" (gate) or
  // "sketch / partial figma / full figma" (tier) in a reply.
  const overrides = project.uiTrackOverrides;
  const customUiNeededDerived = project.portal ? portalEnabled : null;
  const customUiNeeded =
    overrides && Object.prototype.hasOwnProperty.call(overrides, 'customUiNeeded')
      ? (overrides.customUiNeeded ?? null)
      : customUiNeededDerived;
  const inputTierDerived = deriveInputTier(project.assets);
  const inputTier =
    overrides && Object.prototype.hasOwnProperty.call(overrides, 'inputTier')
      ? (overrides.inputTier ?? null)
      : customUiNeeded
        ? inputTierDerived
        : null;
  const uiTrack: UiTrack = {
    customUiNeeded,
    audienceTier: overrides?.audienceTier ?? 'audience-a',
    inputTier: customUiNeeded === true ? inputTier : null,
    expectedFidelity: customUiNeeded === true ? tierToFidelity(inputTier) : null,
  };
  // When the user has elicited a real data model via the data-model turn,
  // honor it. Otherwise keep the legacy two-table placeholder summary so the
  // existing UI doesn't render an empty "Tables" section before any spec
  // work has happened.
  const tables = project.tables ?? [];
  const tableNamesForSummary = tables.length
    ? tables.map((t) => `x_${slug}_${t.name}`)
    : [`x_${slug}_record`, `x_${slug}_activity`];
  return {
    title: project.name,
    description:
      project.description?.trim() ||
      `A ServiceNow scoped application that delivers ${project.name.toLowerCase()} capabilities, built on the Now SDK with automated workflows and role-based access.`,
    features,
    tables,
    technicalDetails: {
      tables: tableNamesForSummary,
      workflows: ['Record Created → Notify', 'Approval Request', 'Status Change → Notify'],
      ui_components: uiComponents,
    },
    portal: project.portal,
    assets: project.assets,
    figmaMake: project.figmaMake,
    uiTrack,
  };
};

export default function App() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(mockMessages);

  const [showNewIdeaModal, setShowNewIdeaModal] = useState(false);
  const [newIdeaName, setNewIdeaName] = useState('');
  const [newIdeaDescription, setNewIdeaDescription] = useState('');
  // Path A vs B selector inside the new-idea modal. 'conversation' = original
  // consultative flow; 'document' = upload a doc and let the LLM extract a
  // spec (Path A — see vibe_overyonder.md§ entry-paths).
  const [newIdeaMode, setNewIdeaMode] = useState<'conversation' | 'document'>(
    'conversation',
  );
  const [docUploading, setDocUploading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [replyTurn, setReplyTurn] = useState(0);
  const [proposalState, setProposalState] = useState<ProposalState>('none');
  const [buildStatus, setBuildStatus] = useState<BuildStatus>('idle');
  const [deployStatus, setDeployStatus] = useState<DeployStatus>('idle');
  const [buildModalOpen, setBuildModalOpen] = useState(false);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [buildSteps, setBuildSteps] = useState<DeployStep[]>([]);
  const [deploySteps, setDeploySteps] = useState<DeployStep[]>([]);
  const [deployLinks, setDeployLinks] = useState<DeployLinks | null>(null);
  const [showPrototype, setShowPrototype] = useState(false);

  // Open the Figma preview in a new browser tab. Keeps vibe_now's primary
  // tab with the right-panel Deploy button intact — user reviews the preview
  // in the new tab, switches back, hits Deploy. Replaces the inline-modal
  // flow that left users stuck when something went wrong inside the modal.
  const openPrototypeInNewTab = (): void => {
    if (!activeProjectId) return;
    const base = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') ?? 'http://localhost:5275';
    const url = `${base}/api/figma/preview-bundle/${encodeURIComponent(activeProjectId)}?t=${Date.now()}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  const [consultantMode, setConsultantMode] = useState<ConsultantMode>('on');
  const [showSettings, setShowSettings] = useState(false);
  const [showCostAnalytics, setShowCostAnalytics] = useState(false);
  const [showOpenPackage, setShowOpenPackage] = useState(false);
  // Push-to-GitHub modal state. Triggered by the project-row kebab menu.
  // `pushTargetProjectId` opens the modal for that specific project; null
  // closes it.
  const [pushTargetProjectId, setPushTargetProjectId] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    void (async () => setBackendOnline(await checkBackend()))();
  }, []);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;
  const spec: Spec | null = activeProject ? buildSpecFromProject(activeProject) : null;

  // LLM readiness — true when both the backend is reachable AND a credential
  // is on file. Probed once per session; the chat path uses it to decide
  // between calling the conversational endpoint and falling back to the
  // scripted turn machinery (see vibe_overyonder.md §14.1, decision C).
  const [llmReady, setLlmReady] = useState(false);
  useEffect(() => {
    void (async () => {
      try {
        setLlmReady(await hasLlmKeyOnFile());
      } catch {
        setLlmReady(false);
      }
    })();
  }, []);

  const deletingProject = projects.find((p) => p.id === deletingProjectId) ?? null;
  const editingProject = projects.find((p) => p.id === editingProjectId) ?? null;

  const handleOpenEdit = (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    setEditingProjectId(id);
    setEditName(project.name);
    setEditDescription(project.description ?? '');
  };

  const handleCloseEdit = () => {
    setEditingProjectId(null);
    setEditName('');
    setEditDescription('');
  };

  const handleSaveEdit = () => {
    if (!editingProjectId || !editName.trim()) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === editingProjectId
          ? {
              ...p,
              name: editName.trim(),
              description: editDescription.trim() || undefined,
              lastModified: 'Just now',
            }
          : p,
      ),
    );
    handleCloseEdit();
  };

  const handleConfirmDelete = () => {
    if (!deletingProjectId) return;
    setProjects((prev) => prev.filter((p) => p.id !== deletingProjectId));
    if (activeProjectId === deletingProjectId) {
      setActiveProjectId(null);
      setMessages([]);
      setReplyTurn(0);
      setProposalState('none');
    }
    setDeletingProjectId(null);
  };

  // Both modes cover the same canonical turn set before free-form Q&A.
  // See src/lib/assistantBehavior.ts for the per-turn blueprints.

  const emitProposal = () => {
    if (!spec) return;
    const proposalMsg: Message = {
      id: (Date.now() + 2).toString(),
      role: 'assistant',
      message: '',
      timestamp: nowTime(),
      kind: 'proposal',
      proposalSpec: spec,
    };
    const intro: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      message:
        "Here's a recap of what I'm proposing to build. Review the spec below and approve to unlock deploy, or decline to keep refining.",
      timestamp: nowTime(),
    };
    setMessages((prev) => [...prev, intro, proposalMsg]);
    setProposalState('pending');
  };

  const detectPortalFromReply = (text: string): { enabled: boolean; suffix?: string } | null => {
    const lc = text.toLowerCase();
    const no = /\b(no|nope|skip|internal only|don'?t need|not needed)\b/.test(lc);
    const yes = /\b(yes|yep|yeah|sure|please|need|want|portal|public|customer|external|end[- ]?user)\b/.test(lc);
    if (!yes && !no) return null;
    if (no && !yes) return { enabled: false };
    const suffixMatch = text.match(/\/?sp\/([a-z0-9_-]+)/i) || text.match(/suffix[:\s]+([a-z0-9_-]+)/i);
    const wordMatch = text.match(/\b([a-z][a-z0-9_-]{2,20})\b.*(portal|suffix|url)/i);
    const suffix = suffixMatch?.[1] || wordMatch?.[1];
    return { enabled: true, suffix: suffix?.toLowerCase() };
  };

  // Parse the user's reply for explicit input-fidelity tier signals. Returns
  // null when no clear keyword is present — the auto-derivation from attached
  // assets remains in effect in that case.
  const detectTierFromReply = (text: string): InputTier | null => {
    const lc = text.toLowerCase();
    if (/\btier\s*3\b|\bfull\s*figma\b|\bdesign\s*system\b|\b(design\s*)?tokens?\b/.test(lc))
      return 'full-figma';
    if (/\btier\s*2\b|\bpartial\s*figma\b|\bsome\s*frames?\b|\ba\s*few\s*frames?\b/.test(lc))
      return 'partial-figma';
    if (/\btier\s*1\b|\bsketch\b|\bscreenshot\b|\bphoto\b|\brough\s*mock(up)?\b/.test(lc))
      return 'sketch';
    return null;
  };

  const handleSendMessage = (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      message,
      timestamp: nowTime(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsThinking(true);

    if (activeProjectId) {
      // Run portal detection on any reply from turn 5 onward — the consultant
      // asks the Track-B gate at turn 5 but users often answer later or revisit.
      const portalIntent = replyTurn >= 5 ? detectPortalFromReply(message) : null;
      // Run tier detection on any reply from turn 6 onward — the consultant
      // asks the input-fidelity tier question at turn 6.
      const tierIntent = replyTurn >= 6 ? detectTierFromReply(message) : null;
      // Run table-def parsing on any reply from turn 2 onward — the data-model
      // turn is at index 2, but users frequently iterate the schema across
      // many subsequent replies. Parser returns null when no recognizable
      // table line is present, which leaves existing project.tables intact.
      const parsedTables = replyTurn >= 2 ? parseTableDefs(message) : null;

      if (portalIntent || tierIntent || parsedTables) {
        setProjects((prev) =>
          prev.map((p) => {
            if (p.id !== activeProjectId) return p;
            const next: Project = { ...p };
            if (portalIntent) {
              next.portal = {
                enabled: portalIntent.enabled,
                urlSuffix: portalIntent.suffix ?? p.portal?.urlSuffix,
                hasAssets: p.portal?.hasAssets,
              };
              // The user has explicitly answered the gate — record it as an
              // override so it survives subsequent re-derivation.
              next.uiTrackOverrides = {
                ...p.uiTrackOverrides,
                customUiNeeded: portalIntent.enabled,
              };
            }
            if (tierIntent) {
              next.uiTrackOverrides = {
                ...next.uiTrackOverrides,
                inputTier: tierIntent,
              };
            }
            if (parsedTables) {
              // Replace, not merge — the user is treating the latest reply as
              // the authoritative schema. Iteration = re-send the full list
              // with the change. Merging would silently keep stale tables the
              // user thought they removed.
              next.tables = parsedTables;
            }
            return next;
          }),
        );
      }
    }

    const turn = replyTurn;
    const isRebuildRequest =
      proposalState === 'approved' &&
      (buildStatus === 'success' || buildStatus === 'failed') &&
      containsApprovalKeyword(message);
    const userAsksToShip =
      (proposalState === 'declined' || proposalState === 'none' || isRebuildRequest) &&
      containsApprovalKeyword(message);
    // When a proposal is already on screen and the user types an approval
    // keyword ("ready to build", "ship it", "let's go"), treat it as a
    // verbal approval — without this we get a feedback loop where the user
    // keeps re-saying it and the assistant keeps echoing back instead of
    // unlocking Build. The proposal card's Approve button still works too.
    const userVerballyApproves =
      proposalState === 'pending' && containsApprovalKeyword(message);

    // Verbal approval keyword while a proposal is on screen — same as
    // clicking Approve, regardless of LLM/scripted path. Handled inline so
    // the LLM doesn't have to litigate it.
    if (userVerballyApproves) {
      handleApproveProposal();
      setIsThinking(false);
      setReplyTurn(turn + 1);
      return;
    }

    // Scripted fallback (offline / no-key). Hoisted above the LLM-path so
    // the async branch can call it on failure without a TDZ violation.
    const fallbackScriptedReply = () => {
      const scriptedReply = renderTurn(turn, { mode: consultantMode, spec });
      if (scriptedReply && !userAsksToShip) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          message: scriptedReply,
          timestamp: nowTime(),
        };
        setMessages((prev) => [...prev, aiResponse]);
      } else if (userAsksToShip) {
        if (isRebuildRequest) {
          setProposalState('none');
          setBuildStatus('idle');
          setDeployStatus('idle');
          setDeployLinks(null);
        }
        const intro: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          message: isRebuildRequest
            ? "Re-summarizing with your updates. Review and approve to re-enable Build — Deploy will re-lock until the new build succeeds."
            : "Here's what I'm proposing to build. Review and approve to unlock the Build button.",
          timestamp: nowTime(),
        };
        setMessages((prev) => [...prev, intro]);
        setTimeout(() => emitProposal(), 200);
      } else {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          message: behaviorEchoReply({
            message,
            mode: consultantMode,
            proposalState,
            buildStatus,
          }),
          timestamp: nowTime(),
        };
        setMessages((prev) => [...prev, aiResponse]);
      }
    };

    // LLM-driven path. The conversational endpoint reads the full spec
    // (including openQuestions, architectureDecisions, uiTrack) and returns
    // a structured patch the frontend applies. Falls through to the scripted
    // path on any failure so the demo flow survives a backend hiccup.
    if (llmReady && activeProject && spec) {
      void (async () => {
        try {
          const reply = await runLlmTurn(message, activeProject, spec);
          applyChatTurnReply(reply, activeProject.id);
          if (reply.readyToBuild) {
            const intro: Message = {
              id: (Date.now() + 2).toString(),
              role: 'assistant',
              message:
                "Here's what I'm proposing to build. Review and approve to unlock the Build button.",
              timestamp: nowTime(),
            };
            setMessages((prev) => [...prev, intro]);
            setTimeout(() => emitProposal(), 200);
          }
        } catch (err) {
          console.warn('chat turn failed, falling back to scripted reply', err);
          fallbackScriptedReply();
        } finally {
          setReplyTurn(turn + 1);
          setIsThinking(false);
        }
      })();
      return;
    }

    const thinkDelay = 1000 + Math.random() * 1000;
    setTimeout(() => {
      fallbackScriptedReply();
      setReplyTurn(turn + 1);
      setIsThinking(false);
    }, thinkDelay);
  };

  // ---------------------------------------------------------------------------
  // LLM-driven turn helpers. Kept inside the component so they can read the
  // current messages array + setProjects without prop-drilling.
  // ---------------------------------------------------------------------------

  const runLlmTurn = async (
    userMessage: string,
    project: Project,
    activeSpec: Spec,
  ): Promise<ChatTurnReply> => {
    // Build the conversation history from `messages` plus the user message
    // we just appended — convert UI shape to wire shape (role + content).
    const history = [...messages, { role: 'user' as const, message: userMessage }].map(
      (m) => ({
        role: m.role === 'system' ? ('system' as const) : (m.role as 'user' | 'assistant'),
        content: m.message,
      }),
    );
    // Streaming path — push a placeholder assistant message immediately
    // so the UI shows the bubble + cursor as soon as the network call is
    // in flight. Each `message-delta` from the backend appends to the
    // placeholder's content; the final `done` event carries the full
    // structured payload (specPatch, readyToBuild, usage).
    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        message: '',
        timestamp: nowTime(),
      },
    ]);

    let accumulated = '';
    try {
      const reply = await streamChatTurn(
        {
          messages: history,
          consultantMode,
          // Forward the project id so the backend can FK the usage row and the
          // cost UIs roll up by project. Backend upserts the projects row on
          // first call; idempotent on id.
          projectId: project.id,
          spec: {
            title: activeSpec.title,
            description: activeSpec.description,
            tables: activeSpec.tables,
            portal: activeSpec.portal
              ? {
                  enabled: activeSpec.portal.enabled,
                  urlSuffix: activeSpec.portal.urlSuffix,
                }
              : undefined,
            uiTrack: activeSpec.uiTrack
              ? {
                  customUiNeeded: activeSpec.uiTrack.customUiNeeded,
                  audienceTier: activeSpec.uiTrack.audienceTier,
                  inputTier: activeSpec.uiTrack.inputTier,
                }
              : undefined,
            architectureDecisions: project.architectureDecisions,
            openQuestions: project.openQuestions,
          },
        },
        {
          onMessageDelta: (text) => {
            accumulated += text;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, message: accumulated } : m,
              ),
            );
          },
        },
      );
      // Reconcile the final message text against the streamed accumulator
      // — escaping nuances in the partial-JSON decoder are unlikely to
      // matter, but the parsed `reply.message` is authoritative.
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, message: reply.message } : m,
        ),
      );
      return reply;
    } catch (err) {
      // Drop the placeholder so the caller's error path can fall back to
      // the scripted reply without leaving an empty bubble behind.
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      throw err;
    }
  };

  const applyChatTurnReply = (reply: ChatTurnReply, projectId: string) => {
    const patch = reply.specPatch;
    if (!patch) return;
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const next: Project = { ...p };
        if (patch.portal) {
          next.portal = {
            enabled: patch.portal.enabled,
            urlSuffix: patch.portal.urlSuffix ?? next.portal?.urlSuffix,
            hasAssets: next.portal?.hasAssets,
          };
          next.uiTrackOverrides = {
            ...next.uiTrackOverrides,
            customUiNeeded: patch.portal.enabled,
          };
        }
        if (patch.tables) {
          // Replace, not merge — same convention the scripted-path table
          // parser uses. Iteration = full list.
          next.tables = patch.tables;
        }
        if (patch.uiTrack) {
          next.uiTrackOverrides = {
            ...next.uiTrackOverrides,
            ...(patch.uiTrack.customUiNeeded !== undefined
              ? { customUiNeeded: patch.uiTrack.customUiNeeded }
              : {}),
            ...(patch.uiTrack.audienceTier
              ? { audienceTier: patch.uiTrack.audienceTier }
              : {}),
            ...(patch.uiTrack.inputTier !== undefined
              ? { inputTier: patch.uiTrack.inputTier }
              : {}),
          };
        }
        // Open-question pruning + extension. We dedupe so the LLM can't
        // accidentally surface the same question twice across turns.
        const open = new Set(next.openQuestions ?? []);
        for (const answered of patch.answeredQuestions ?? []) open.delete(answered);
        for (const added of patch.addedQuestions ?? []) open.add(added);
        next.openQuestions = open.size > 0 ? Array.from(open) : undefined;
        next.lastModified = 'Just now';
        return next;
      }),
    );
  };

  const handleAttachAssets = async (files: File[]) => {
    if (!activeProjectId || files.length === 0) return;

    const collected: ProjectAsset[] = [];
    const zipSummaries: ExtractionSummary[] = [];
    let collectedFigmaMake: FigmaMakeBundle | undefined;
    const zipFiles: File[] = [];

    for (const file of files) {
      if (isZipFile(file)) {
        // Unpack client-side for the Reference design tab. Also remember the
        // raw File so we can POST it to the backend below for the Figma →
        // widget transpile pipeline (Milestone 1).
        zipFiles.push(file);
        const { assets, summary, figmaMake } = await extractZipAssets(file);
        collected.push(...assets);
        zipSummaries.push(summary);
        if (figmaMake) collectedFigmaMake = figmaMake;
      } else {
        const { kind, role } = classifyAsset(file);
        const isImage = file.type.startsWith('image/');
        collected.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: file.size,
          mime: file.type || 'application/octet-stream',
          kind,
          role,
          previewUrl: isImage ? URL.createObjectURL(file) : undefined,
        });
      }
    }

    if (collected.length === 0 && zipSummaries.every((s) => s.errors.length > 0)) {
      const errLines = zipSummaries
        .flatMap((s) => s.errors.map((e) => `• ${s.archiveName}: ${e}`))
        .join('\n');
      const errMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        message: `Couldn't unpack the archive(s):\n${errLines}`,
        timestamp: nowTime(),
      };
      setMessages((prev) => [...prev, errMsg]);
      return;
    }

    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? {
              ...p,
              assets: [...(p.assets ?? []), ...collected],
              figmaMake: collectedFigmaMake ?? p.figmaMake,
              portal: p.portal ? { ...p.portal, hasAssets: true } : p.portal,
              lastModified: 'Just now',
            }
          : p,
      ),
    );

    // Milestone 1 of the Figma → widget transpile pipeline: POST the raw zip
    // to the backend so it has a copy to transpile during the next build. Runs
    // best-effort — if the backend is offline the local Reference tab still
    // shows the parsed contents.
    if (zipFiles.length > 0 && backendOnline) {
      try {
        const result = await uploadFigmaZips(activeProjectId, zipFiles);
        if (result && result.errors.length > 0) {
          console.warn('figma upload partial errors', result.errors);
        }
      } catch (err) {
        console.warn('figma upload failed', err);
      }
    }

    const receiptLabel =
      zipSummaries.length > 0
        ? `Attached ${collected.length} ${collected.length === 1 ? 'asset' : 'assets'} (from ${zipSummaries.map((s) => s.archiveName).join(', ')})`
        : `Attached ${collected.length} ${collected.length === 1 ? 'asset' : 'assets'}`;

    const receiptMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      message: receiptLabel,
      timestamp: nowTime(),
      kind: 'assets-received',
      assets: collected,
    };
    setMessages((prev) => [...prev, receiptMsg]);

    const hasFigma = collected.some((a) => a.kind === 'figma') || zipSummaries.length > 0;
    const hasLogo = collected.some((a) => a.role === 'logo');
    const lines: string[] = [];

    if (zipSummaries.length > 0) {
      zipSummaries.forEach((s) => {
        lines.push(
          `Unpacked **${s.archiveName}** — ${s.imageCount} image${s.imageCount === 1 ? '' : 's'}, ${s.jsonCount} JSON, ${s.figCount} .fig${s.skippedCount > 0 ? `, ${s.skippedCount} skipped` : ''}.`,
        );
        if (s.errors.length > 0) {
          lines.push(`  Errors: ${s.errors.join('; ')}`);
        }
      });
      lines.push('');
    }

    lines.push(`Logged ${collected.length} asset${collected.length === 1 ? '' : 's'}:`);
    collected.slice(0, 10).forEach((a) => {
      const kb = (a.size / 1024).toFixed(a.size > 1024 * 100 ? 0 : 1);
      lines.push(
        `• ${a.name} — ${a.kind}${a.role && a.role !== 'other' ? ` (${a.role})` : ''}, ${kb} KB`,
      );
    });
    if (collected.length > 10) lines.push(`…and ${collected.length - 10} more.`);

    if (hasLogo) lines.push('\nLogo will land on `sp_portal.logo` via `Now.attach(...)`.');
    if (hasFigma) {
      lines.push(
        '\nFigma assets noted. Client-side I\'ve extracted the images so they show in the prototype; the actual Figma → Service Portal widget transpile (frames → AngularJS template + SCSS) runs server-side at build time in Phase 2. Interactive widgets take Figma for styling only — behavior still comes from the spec.',
      );
    }
    const aiAck: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      message: lines.join('\n'),
      timestamp: nowTime(),
    };
    setTimeout(() => setMessages((prev) => [...prev, aiAck]), 300);
  };

  const handleApproveProposal = () => {
    setProposalState('approved');
    setBuildStatus('idle');
    setDeployStatus('idle');
    setDeployLinks(null);
    const confirm: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      message:
        'Spec approved. **Build** is unlocked on the right — click it to generate the Now SDK scaffold. **Deploy** stays locked until the build succeeds.',
      timestamp: nowTime(),
    };
    setMessages((prev) => [...prev, confirm]);
  };

  const handleDeclineProposal = () => {
    setProposalState('declined');
    const keepGoing: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      message:
        "No problem — tell me what to change and I'll revise the spec. When you're ready, just say \"looks good\" or \"ship it\" and I'll re-send the proposal for approval.",
      timestamp: nowTime(),
    };
    setMessages((prev) => [...prev, keepGoing]);
  };

  const handleExport = () => {
    if (!spec || !activeProject) return;
    const payload = {
      project: { id: activeProject.id, name: activeProject.name },
      spec,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject.name.replace(/\s+/g, '_').toLowerCase()}_spec.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // versionId is an optional argument forwarded straight through to the
  // build POST. Was previously stashed in React state, but state isn't
  // committed by the time `runBuildReal` reads its closure — that bug
  // shipped the wrong (or stale) versionId on Save & Build. Argument-
  // passing makes the value flow obvious and stale-proof.
  const runBuild = async (versionId?: string) => {
    // Save & Build skips the proposal-approval gate — the user explicitly
    // asked to build a snapshotted version. The legacy greenfield path
    // still requires `proposalState === 'approved'`.
    if (!spec || !activeProject) return;
    if (!versionId && proposalState !== 'approved') return;
    setBuildModalOpen(true);
    setBuildStatus('building');
    setDeployStatus('idle');
    setDeployLinks(null);

    if (backendOnline) {
      await runBuildReal(versionId);
    } else {
      runBuildMock();
    }
  };

  const runBuildReal = async (versionId?: string) => {
    if (!spec || !activeProject) return;
    const phases: Record<string, string> = {
      generate: 'Generating Now SDK Fluent scaffold',
      'install-deps': 'Installing @servicenow/sdk',
      build: 'Running now-sdk build',
    };
    const order = ['generate', 'install-deps', 'build'];
    const initialSteps: DeployStep[] = order.map((k) => ({
      label: phases[k],
      status: 'pending',
    }));
    setBuildSteps(initialSteps);

    const advanceTo = (phase: string) => {
      const idx = order.indexOf(phase);
      setBuildSteps((prev) =>
        prev.map((s, i) => {
          if (idx < 0) return s;
          if (i < idx) return { ...s, status: 'done' };
          if (i === idx) return { ...s, status: 'active' };
          return s;
        }),
      );
    };

    try {
      const { runId } = await api.post<{ runId: string }>('/api/build', {
        projectId: activeProject.id,
        spec: specToWire(spec),
        // Versioned-build path: when set, the backend builds the frozen
        // snapshot at this version verbatim and flips the version row's
        // status to success/failed when it lands. Defensive: only forward
        // a real non-empty string — anything else gets dropped at the
        // wire boundary so the route's type guard never sees a bad value.
        ...(typeof versionId === 'string' && versionId.length > 0
          ? { versionId }
          : {}),
      });
      await new Promise<void>((resolvePromise) => {
        streamRun(runId, {
          onStatus: (s) => advanceTo(s.phase),
          onResult: (r) => {
            const res = r as { status: 'success' | 'failed'; error?: string };
            if (res.status === 'success') {
              setBuildSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })));
              setBuildStatus('success');
              setProjects((prev) =>
                prev.map((p) =>
                  p.id === activeProjectId
                    ? { ...p, status: 'active', lastModified: 'Just now' }
                    : p,
                ),
              );
              const msg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                message:
                  'Build complete on the backend. Click **View Prototype** to walk the app locally, then Deploy to ship it.',
                timestamp: nowTime(),
                kind: 'build-success',
              };
              setMessages((prev) => [...prev, msg]);
            } else {
              setBuildStatus('failed');
              const msg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                message: `Build failed: ${res.error ?? 'unknown error'}.`,
                timestamp: nowTime(),
                kind: 'build-failed',
              };
              setMessages((prev) => [...prev, msg]);
            }
            resolvePromise();
          },
          onError: () => {
            // EventSource triggers onerror on normal close; we rely on onResult.
          },
        });
      });
    } catch (err) {
      setBuildStatus('failed');
      const msg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        message: `Build request failed: ${(err as Error).message}`,
        timestamp: nowTime(),
        kind: 'build-failed',
      };
      setMessages((prev) => [...prev, msg]);
    }
  };

  const runBuildMock = () => {
    if (!spec || !activeProject) return;
    const portalEnabled = spec.portal?.enabled ?? false;
    const steps: DeployStep[] = [
      { label: 'Generating Now SDK Fluent scaffold (simulated)', status: 'pending' },
      { label: 'Compiling tables, roles, and ACLs (simulated)', status: 'pending' },
      { label: 'Wiring Flow Designer automations (simulated)', status: 'pending' },
      ...(portalEnabled
        ? ([
            { label: 'Transpiling portal assets → widget HTML/SCSS (simulated)', status: 'pending' },
          ] as DeployStep[])
        : []),
      { label: 'Packaging app into local preview (simulated)', status: 'pending' },
    ];
    setBuildSteps(steps);

    const advance = (i: number) => {
      setBuildSteps((prev) =>
        prev.map((s, idx) =>
          idx < i ? { ...s, status: 'done' } : idx === i ? { ...s, status: 'active' } : s,
        ),
      );
    };

    advance(0);
    const timings = steps.map(() => 700 + Math.floor(Math.random() * 500));
    let cursor = 0;
    const tick = () => {
      cursor += 1;
      if (cursor < steps.length) {
        advance(cursor);
        setTimeout(tick, timings[cursor]);
      } else {
        setBuildSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })));
        setBuildStatus('success');
        setProjects((prev) =>
          prev.map((p) =>
            p.id === activeProjectId ? { ...p, status: 'active', lastModified: 'Just now' } : p,
          ),
        );
        const msg: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          message:
            'Build complete (simulated — backend not running). Click **View Prototype** to walk through it locally.',
          timestamp: nowTime(),
          kind: 'build-success',
        };
        setMessages((prev) => [...prev, msg]);
      }
    };
    setTimeout(tick, timings[0]);
  };

  const specToWire = (s: Spec) => ({
    title: s.title,
    description: s.description,
    features: s.features,
    tables: s.tables,
    technicalDetails: s.technicalDetails,
    portal: s.portal ? { enabled: s.portal.enabled, urlSuffix: s.portal.urlSuffix } : undefined,
  });

  // Per-version deploy — the right-panel history strip's Deploy buttons
  // pass the version id through here so the backend deploys that frozen
  // snapshot directly. Without a versionId, the legacy "deploy current
  // greenfield workspace" path runs. Argument-passing avoids the same
  // stale-closure bug Save & Build hit (see runBuild above).
  const runDeploy = async (versionId?: string) => {
    if (!spec || !activeProject) return;
    // Per-version deploys skip the build-status gate — the version is
    // already a built snapshot. Greenfield deploys still require a
    // successful build first.
    if (!versionId && buildStatus !== 'success') return;
    setDeployModalOpen(true);
    setDeployStatus('deploying');

    if (backendOnline) {
      await runDeployReal(versionId);
    } else {
      runDeployMock();
    }
  };

  const runDeployReal = async (versionId?: string) => {
    if (!spec || !activeProject) return;
    const order = ['generate', 'install-deps', 'build', 'install'];
    const labels: Record<string, string> = {
      generate: 'Generating Fluent scaffold',
      'install-deps': 'Installing @servicenow/sdk',
      build: 'Running now-sdk build',
      install: 'Running now-sdk install against instance',
    };
    setDeploySteps(order.map((k) => ({ label: labels[k], status: 'pending' })));

    const advanceTo = (phase: string) => {
      const idx = order.indexOf(phase);
      setDeploySteps((prev) =>
        prev.map((s, i) => {
          if (idx < 0) return s;
          if (i < idx) return { ...s, status: 'done' };
          if (i === idx) return { ...s, status: 'active' };
          return s;
        }),
      );
    };

    try {
      const { runId } = await api.post<{ runId: string }>('/api/deploy', {
        projectId: activeProject.id,
        spec: specToWire(spec),
        // Versioned-deploy path: when set, the backend deploys the frozen
        // snapshot at this version verbatim and FKs the deploy_run_id
        // onto the version row so the history strip shows "Deployed".
        ...(typeof versionId === 'string' && versionId.length > 0
          ? { versionId }
          : {}),
      });
      await new Promise<void>((resolvePromise) => {
        streamRun(runId, {
          onStatus: (s) => advanceTo(s.phase),
          onResult: (r) => {
            const res = r as {
              status: 'success' | 'failed';
              scope?: string;
              sysAppId?: string;
              instanceUrl?: string;
              portalUrl?: string;
              rollbackUrl?: string;
              error?: string;
            };
            if (res.status === 'success') {
              setDeploySteps((prev) => prev.map((s) => ({ ...s, status: 'done' })));
              setDeployStatus('deployed');
              const links: DeployLinks = {
                scope: res.scope ?? '',
                sysAppId: res.sysAppId ?? '',
                app: res.instanceUrl ?? '',
                portal: res.portalUrl,
                rollbackUrl: res.rollbackUrl,
              };
              setDeployLinks(links);
              setProjects((prev) =>
                prev.map((p) =>
                  p.id === activeProjectId
                    ? { ...p, status: 'deployed', lastModified: 'Just now' }
                    : p,
                ),
              );
              const msg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                message: `${activeProject.name} is live. Scope ${links.scope}.`,
                timestamp: nowTime(),
                kind: 'deploy-success',
                deployLinks: links,
              };
              setMessages((prev) => [...prev, msg]);
            } else {
              setDeployStatus('failed');
              const msg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                message: `Deploy failed: ${res.error ?? 'unknown error'}.`,
                timestamp: nowTime(),
                kind: 'deploy-failed',
              };
              setMessages((prev) => [...prev, msg]);
            }
            resolvePromise();
          },
          onError: () => {
            // trust onResult for the final state; EventSource also fires onerror on close.
          },
        });
      });
    } catch (err) {
      setDeployStatus('failed');
      const msg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        message: `Deploy request failed: ${(err as Error).message}`,
        timestamp: nowTime(),
        kind: 'deploy-failed',
      };
      setMessages((prev) => [...prev, msg]);
    }
  };

  const runDeployMock = () => {
    if (!spec || !activeProject) return;
    const steps: DeployStep[] = [
      { label: 'Authenticating with instance (simulated)', status: 'pending' },
      { label: 'Installing scoped app via now-sdk (simulated)', status: 'pending' },
      { label: 'Publishing Service Portal + widgets (simulated)', status: 'pending' },
      { label: 'Verifying records (simulated)', status: 'pending' },
    ];
    setDeploySteps(steps);

    const advance = (i: number) => {
      setDeploySteps((prev) =>
        prev.map((s, idx) =>
          idx < i ? { ...s, status: 'done' } : idx === i ? { ...s, status: 'active' } : s,
        ),
      );
    };
    advance(0);
    const timings = steps.map(() => 900 + Math.floor(Math.random() * 400));
    let cursor = 0;
    const tick = () => {
      cursor += 1;
      if (cursor < steps.length) {
        advance(cursor);
        setTimeout(tick, timings[cursor]);
      } else {
        setDeploySteps((prev) => prev.map((s) => ({ ...s, status: 'done' })));
        setDeployStatus('deployed');
        const scopeSlug =
          activeProject.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .slice(0, 18) || 'app';
        const scope = `x_1939459_${scopeSlug}`;
        const links: DeployLinks = {
          scope,
          sysAppId: 'SIMULATED',
          app: `https://dev378814.service-now.com/nav_to.do?uri=sys_app_list.do`,
          portal: spec.portal?.enabled
            ? `https://dev378814.service-now.com/${spec.portal.urlSuffix ?? scopeSlug}`
            : undefined,
        };
        setDeployLinks(links);
        setProjects((prev) =>
          prev.map((p) =>
            p.id === activeProjectId
              ? { ...p, status: 'deployed', lastModified: 'Just now' }
              : p,
          ),
        );
        const msg: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          message: `Simulated deploy complete — backend is not running, nothing actually shipped to ServiceNow. Start vibe_now_api and try again for a real deploy.`,
          timestamp: nowTime(),
          kind: 'deploy-success',
          deployLinks: links,
        };
        setMessages((prev) => [...prev, msg]);
      }
    };
    setTimeout(tick, timings[0]);
  };

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    setProposalState('none');
    setReplyTurn(0);
    const projectName = projects.find((p) => p.id === id)?.name ?? 'your project';
    const welcome =
      consultantMode === 'on'
        ? `Welcome back to "${projectName}". Where do you want to take this next — tighten scope, rethink roles, add to the portal, or push toward build?`
        : `Back on "${projectName}". What are we changing?`;
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        message: welcome,
        timestamp: nowTime(),
      },
    ]);
  };

  const handleCreateNewIdea = () => {
    if (!newIdeaName.trim()) return;

    const newProject: Project = {
      id: Date.now().toString(),
      name: newIdeaName,
      description: newIdeaDescription.trim() || undefined,
      status: 'draft',
      lastModified: 'Just now',
    };

    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    setReplyTurn(0);
    setProposalState('none');
    const intro =
      consultantMode === 'on'
        ? `Good — "${newIdeaName}" is on the table.${
            newIdeaDescription ? ` You've said you want to ${newIdeaDescription}.` : ''
          } Before we start scaffolding, tell me about the *business problem* this solves: who's frustrated today, what are they doing instead, and what does "working well" look like six months from now? The sharper that answer, the cleaner the app.`
        : `Starting "${newIdeaName}".${
            newIdeaDescription ? ` Noted: ${newIdeaDescription}.` : ''
          } What should this app do and who uses it?`;
    setMessages([
      {
        id: '1',
        role: 'assistant',
        message: intro,
        timestamp: nowTime(),
      },
    ]);

    setNewIdeaName('');
    setNewIdeaDescription('');
    setShowNewIdeaModal(false);
  };

  // Save & Build pill landed a snapshot. Confirm it in chat and kick the
  // build pipeline so the new version gets compiled. The pill itself only
  // snapshots — building is the parent's responsibility because the build
  // route depends on project-level state (spec, scope, alias) the pill
  // doesn't have.
  const handleSnapshotCreated = (versionId: string, versionNumber: number) => {
    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 5).toString(),
        role: 'assistant',
        message: `Snapshotted **v${versionNumber}** (\`${versionId.slice(0, 8)}…\`). Running the build now — version status will flip to **Built** when it lands, or **Build failed** with the error.`,
        timestamp: nowTime(),
      },
    ]);
    // Fire the build pipeline against the new frozen snapshot. The
    // backend reads version.workspace_path, builds it verbatim, and flips
    // the version row's status (success / failed) on completion. The
    // history strip will reflect the new state on its next 5s poll.
    void runBuild(versionId);
  };

  // Open Existing Package — backend already (1) imported the package
  // (project row + original/working/v1 directories), (2) ran the LLM
  // ingest pass to read every Fluent file, and optionally (3) branched
  // to a new version. We map the full payload onto a frontend Project so
  // the spec, architectural decisions, open questions, and per-section
  // summaries are all populated for the first chat turn.
  const handlePackageImported = (payload: OpenPackagePayload) => {
    const { imported, ingest, branched, branchedToVersion } = payload;
    const id = imported.project.id;
    const existing = projects.find((p) => p.id === id);

    // When ingest succeeded, the LLM-derived spec wins over the import's
    // bare metadata. When ingest failed we still open the project — the
    // user can re-trigger ingest later from the right panel.
    const tablesFromIngest = ingest?.spec.tables ?? [];
    const portalFromIngest = ingest?.spec.portal ?? undefined;

    const projectShape: Project = existing
      ? {
          ...existing,
          lastModified: 'Just now',
          // Re-import refreshes architectural context — keep prior local
          // edits but trust the ingest where it overlaps.
          ...(ingest
            ? {
                description: ingest.spec.description,
                tables: tablesFromIngest,
                portal: portalFromIngest
                  ? {
                      enabled: portalFromIngest.enabled,
                      urlSuffix: portalFromIngest.urlSuffix,
                    }
                  : existing.portal,
                architectureDecisions: ingest.architectureDecisions,
                openQuestions: ingest.openQuestions,
              }
            : {}),
        }
      : {
          id,
          name: imported.project.name,
          description: ingest?.spec.description ?? imported.project.description ?? undefined,
          status: 'deployed',
          lastModified: 'Just now',
          tables: tablesFromIngest,
          portal: portalFromIngest
            ? { enabled: portalFromIngest.enabled, urlSuffix: portalFromIngest.urlSuffix }
            : undefined,
          architectureDecisions: ingest
            ? ingest.architectureDecisions
            : [
                `Imported from ${imported.metadata.path}`,
                `Scope: ${imported.metadata.scope ?? 'unknown'} · ${imported.metadata.fluentFileCount} Fluent files`,
              ],
          openQuestions: ingest
            ? ingest.openQuestions
            : ['Run the package ingest from Settings to give the agent full context.'],
        };

    setProjects((prev) => {
      if (existing) return prev.map((p) => (p.id === id ? projectShape : p));
      return [projectShape, ...prev];
    });
    setActiveProjectId(id);
    // Skip the canonical-scripted turns — opened packages are already
    // mature; the user is here to refine, not design from scratch.
    setReplyTurn(99);
    setProposalState('none');

    // Compose the first chat message. When ingest succeeded, lead with
    // the LLM's review (it already follows the consultant tone). When it
    // failed, fall back to a metadata-only summary so the user can still
    // start chatting.
    const opening = imported.reused
      ? `Resumed **${imported.project.name}** from your prior session.`
      : branched
        ? `Opened **${imported.project.name}** and saved a fresh starting point at **v${branchedToVersion}**.`
        : `Opened **${imported.project.name}** — v${imported.initialVersion.version_number} snapshot just landed.`;

    const message = ingest
      ? `${opening}\n\n${ingest.introMessage}`
      : [
          opening,
          '',
          `Source: \`${imported.metadata.path}\``,
          imported.metadata.scope ? `Scope: \`${imported.metadata.scope}\`` : null,
          `${imported.metadata.fluentFileCount} Fluent file${imported.metadata.fluentFileCount === 1 ? '' : 's'} under \`src/\`. ${
            imported.metadata.hasFigmaSource ? 'Figma source is on disk too.' : ''
          }`,
          '',
          'The deeper package review (LLM ingest) didn\'t complete — the agent only sees metadata for now. What do you want to refine? I can re-run the ingest if you want me to read every file first.',
        ]
          .filter((l): l is string => l !== null)
          .join('\n');

    setMessages([
      {
        id: '1',
        role: 'assistant',
        message,
        timestamp: nowTime(),
      },
    ]);
  };

  // Path A — user uploads a doc; backend LLM extracts a spec; we seed a
  // project with the extracted tables/portal/decisions and surface the
  // architecture decisions + open questions as the consultant's first turn.
  const handleCreateFromDoc = async (file: File) => {
    setDocError(null);
    setDocUploading(true);
    try {
      const extracted: ExtractedSpecPayload = await extractSpecFromDoc(file);

      const newProject: Project = {
        id: Date.now().toString(),
        name: extracted.title,
        description: extracted.description,
        status: 'draft',
        lastModified: 'Just now',
        portal: extracted.portal
          ? {
              enabled: extracted.portal.enabled,
              urlSuffix: extracted.portal.urlSuffix,
            }
          : undefined,
        // Reuse the same TableDef shape — the wire payload matches.
        tables: extracted.tables,
        // Persist the architecture decisions and open questions the
        // extractor surfaced. The conversational endpoint reads both on
        // every turn so unanswered items don't get silently dropped when
        // the script-fallback path advances replyTurn.
        architectureDecisions: extracted.architectureDecisions,
        openQuestions: extracted.openQuestions,
        // Lock in the gate decision the LLM made so the UI track derivation
        // doesn't ask again. Audience tier defaults to a; user can override.
        uiTrackOverrides: extracted.portal
          ? { customUiNeeded: extracted.portal.enabled }
          : undefined,
      };

      setProjects((prev) => [newProject, ...prev]);
      setActiveProjectId(newProject.id);
      // Skip past the data-model + portal turns since the doc supplied both.
      // Land on `automation` (turn index 3) so the consultant continues from
      // where the user actually needs input.
      setReplyTurn(3);
      setProposalState('none');

      const decisionLines = extracted.architectureDecisions
        .map((d) => `• ${d}`)
        .join('\n');
      const questionLines = extracted.openQuestions.length
        ? '\n\nOpen questions I want your call on:\n' +
          extracted.openQuestions.map((q) => `• ${q}`).join('\n')
        : '';
      const tableLine = extracted.tables.length
        ? `${extracted.tables.length} table${extracted.tables.length === 1 ? '' : 's'} (${extracted.tables.map((t) => t.name).join(', ')})`
        : 'no tables yet';
      const portalLine = extracted.portal?.enabled
        ? `Service Portal at /${extracted.portal.urlSuffix ?? 'suffix'}`
        : 'workspace-only (no Service Portal)';
      const intro = [
        `Read your doc and pulled a spec for "${extracted.title}".`,
        '',
        `Architecture I committed to:`,
        decisionLines,
        '',
        `Backend: ${tableLine}. UI: ${portalLine}.`,
        questionLines,
        '',
        'Review the right panel — say "ready to build" to lock it in, or push back on anything you want changed.',
      ]
        .filter((s) => s !== null)
        .join('\n');

      setMessages([
        {
          id: '1',
          role: 'assistant',
          message: intro,
          timestamp: nowTime(),
        },
      ]);

      setNewIdeaName('');
      setNewIdeaDescription('');
      setNewIdeaMode('conversation');
      setShowNewIdeaModal(false);
    } catch (err) {
      setDocError((err as Error).message ?? 'Spec extraction failed.');
    } finally {
      setDocUploading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      {!isChatExpanded && (
        <Sidebar
          projects={projects}
          activeProjectId={activeProjectId}
          onProjectSelect={handleSelectProject}
          onNewIdea={() => setShowNewIdeaModal(true)}
          onProjectDelete={setDeletingProjectId}
          onProjectEdit={handleOpenEdit}
          consultantMode={consultantMode}
          onOpenSettings={() => setShowSettings(true)}
          onOpenCostAnalytics={() => setShowCostAnalytics(true)}
          onOpenPackage={() => setShowOpenPackage(true)}
          onProjectPushToGithub={(id) => setPushTargetProjectId(id)}
          onProjectUnlinkGithub={(id) => {
            // Local-only: drop the storage record so the chip flips back
            // to "Local" + the kebab shows the push option again. The
            // remote repo on GitHub is untouched.
            setProjects((prev) =>
              prev.map((p) => (p.id === id ? { ...p, storage: { type: 'local' } } : p)),
            );
          }}
          onProjectSwitchToLocal={(id) => {
            setProjects((prev) =>
              prev.map((p) => (p.id === id ? { ...p, storage: { type: 'local' } } : p)),
            );
          }}
        />
      )}
      <Workspace
        messages={messages}
        onSendMessage={handleSendMessage}
        onAttachAssets={handleAttachAssets}
        canAttach={activeProjectId !== null}
        isThinking={isThinking}
        isExpanded={isChatExpanded}
        onToggleExpand={() => setIsChatExpanded((v) => !v)}
        proposalState={proposalState}
        onApproveProposal={handleApproveProposal}
        onDeclineProposal={handleDeclineProposal}
        onViewPrototype={buildStatus === 'success' ? openPrototypeInNewTab : undefined}
        consultantMode={consultantMode}
        onOpenSettings={() => setShowSettings(true)}
        projectId={activeProjectId}
        onSnapshotCreated={handleSnapshotCreated}
      />
      {!isChatExpanded && (
        <RightPanel
          spec={spec}
          projectId={activeProjectId}
          proposalState={proposalState}
          buildStatus={buildStatus}
          deployStatus={deployStatus}
          deployLinks={deployLinks}
          onBuild={runBuild}
          onDeploy={runDeploy}
          onViewPrototype={openPrototypeInNewTab}
          onExport={handleExport}
          onPortalChange={(portal) => {
            if (!activeProjectId) return;
            setProjects((prev) =>
              prev.map((p) =>
                p.id === activeProjectId
                  ? {
                      ...p,
                      portal: {
                        enabled: portal.enabled,
                        urlSuffix: portal.urlSuffix || undefined,
                        hasAssets: p.portal?.hasAssets,
                      },
                      lastModified: 'Just now',
                    }
                  : p,
              ),
            );
          }}
          consultantMode={consultantMode}
          onOpenSettings={() => setShowSettings(true)}
          onOpenCostAnalytics={() => setShowCostAnalytics(true)}
        />
      )}

      {showPrototype && spec && activeProject && (
        <PrototypeViewer
          project={activeProject}
          spec={spec}
          buildStatus={buildStatus}
          deployStatus={deployStatus}
          deployLinks={deployLinks}
          onClose={() => setShowPrototype(false)}
          onDeploy={() => {
            setShowPrototype(false);
            runDeploy();
          }}
        />
      )}

      <Modal
        isOpen={showNewIdeaModal}
        onClose={() => {
          setShowNewIdeaModal(false);
          setNewIdeaMode('conversation');
          setDocError(null);
        }}
        title="Start a New Idea"
        footer={
          newIdeaMode === 'conversation' ? (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowNewIdeaModal(false);
                  setNewIdeaMode('conversation');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateNewIdea}
                disabled={!newIdeaName.trim()}
              >
                Create Project
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              onClick={() => {
                setShowNewIdeaModal(false);
                setNewIdeaMode('conversation');
                setDocError(null);
              }}
              disabled={docUploading}
            >
              {docUploading ? 'Extracting…' : 'Cancel'}
            </Button>
          )
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setNewIdeaMode('conversation')}
              className={`text-left p-4 rounded-[var(--radius-md)] border transition-colors ${
                newIdeaMode === 'conversation'
                  ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                  : 'border-[var(--border-subtle)] hover:border-[var(--primary)]/40'
              }`}
            >
              <div className="text-[var(--text-base)] font-semibold text-[var(--text-primary)] mb-1">
                Conversation
              </div>
              <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] leading-relaxed">
                Design through chat. The consultant asks about tables, roles, portal, and automation.
              </div>
            </button>
            <button
              type="button"
              onClick={() => setNewIdeaMode('document')}
              className={`text-left p-4 rounded-[var(--radius-md)] border transition-colors ${
                newIdeaMode === 'document'
                  ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                  : 'border-[var(--border-subtle)] hover:border-[var(--primary)]/40'
              }`}
            >
              <div className="text-[var(--text-base)] font-semibold text-[var(--text-primary)] mb-1">
                Document
              </div>
              <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] leading-relaxed">
                Upload a PRD or spec (.md, .txt, .pdf, .docx). I extract the architecture and skip ahead.
              </div>
            </button>
          </div>

          {newIdeaMode === 'conversation' ? (
            <div className="space-y-4">
              <Input
                label="Project Name"
                placeholder="e.g., IT Asset Management"
                value={newIdeaName}
                onChange={(e) => setNewIdeaName(e.target.value)}
              />
              <TextArea
                label="Initial Description (Optional)"
                placeholder="Briefly describe what you want to build..."
                value={newIdeaDescription}
                onChange={(e) => setNewIdeaDescription(e.target.value)}
                rows={4}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <label
                className={`block rounded-[var(--radius-md)] border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                  docUploading
                    ? 'border-[var(--border-subtle)] opacity-60 cursor-wait'
                    : 'border-[var(--border-subtle)] hover:border-[var(--primary)]/60'
                }`}
              >
                <input
                  type="file"
                  accept=".md,.txt,.pdf,.docx"
                  className="hidden"
                  disabled={docUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleCreateFromDoc(file);
                  }}
                />
                <div className="text-[var(--text-base)] font-semibold text-[var(--text-primary)] mb-1">
                  {docUploading ? 'Reading your doc…' : 'Drop a file or click to upload'}
                </div>
                <div className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                  {docUploading
                    ? 'Extracting tables, portal, and architecture decisions.'
                    : '.md · .txt · .pdf · .docx (max 25 MB)'}
                </div>
              </label>
              {docError && (
                <div className="rounded-[var(--radius-md)] border border-[var(--danger)]/40 bg-[var(--danger)]/5 p-3 text-[var(--text-xs)] text-[var(--danger)]">
                  {docError}
                </div>
              )}
              <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] leading-relaxed">
                Backed by GPT-5. Set <code className="font-mono">OPENAI_API_KEY</code> in
                <code className="font-mono"> vibe_now_api/.env</code> if you haven't yet.
              </p>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={editingProject !== null}
        onClose={handleCloseEdit}
        title="Edit Project"
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseEdit}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEdit} disabled={!editName.trim()}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Project Name"
            placeholder="e.g., IT Asset Management"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <TextArea
            label="Description"
            placeholder="Briefly describe what this app does..."
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={4}
          />
        </div>
      </Modal>

      <Modal
        isOpen={deletingProject !== null}
        onClose={() => setDeletingProjectId(null)}
        title="Delete Project"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingProjectId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-[var(--text-base)] text-[var(--text-secondary)]">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-[var(--text-primary)]">
            {deletingProject?.name}
          </span>
          ? This can't be undone.
        </p>
      </Modal>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        consultantMode={consultantMode}
        onChangeMode={setConsultantMode}
      />

      <CostAnalyticsModal
        isOpen={showCostAnalytics}
        onClose={() => setShowCostAnalytics(false)}
        activeProjectId={activeProjectId}
      />

      <OpenPackageModal
        isOpen={showOpenPackage}
        onClose={() => setShowOpenPackage(false)}
        onImported={handlePackageImported}
        onOpenSettings={() => setShowSettings(true)}
      />

      <PushToGitHubModal
        isOpen={pushTargetProjectId !== null}
        onClose={() => setPushTargetProjectId(null)}
        projectId={pushTargetProjectId}
        projectName={
          projects.find((p) => p.id === pushTargetProjectId)?.name ?? null
        }
        initialRepoUrl={
          projects.find((p) => p.id === pushTargetProjectId)?.storage?.repoPath
            ? `https://github.com/${projects.find((p) => p.id === pushTargetProjectId)?.storage?.repoPath}`
            : undefined
        }
        onOpenSettings={() => setShowSettings(true)}
        onPushed={(result: GitHubPushResult) => {
          // Promote the project's storage chip from Local → linked GitHub.
          // Persisted only in browser state for now — the backend records
          // the push in the build/version log; a follow-up adds a
          // `github_repo_url` column on `projects` so reloads remember.
          setProjects((prev) =>
            prev.map((p) =>
              p.id === pushTargetProjectId
                ? {
                    ...p,
                    storage: {
                      type: 'github',
                      repoPath: result.ownerRepo,
                    },
                    lastModified: 'Just now',
                  }
                : p,
            ),
          );
        }}
      />

      <Modal
        isOpen={buildModalOpen}
        onClose={() => buildStatus !== 'building' && setBuildModalOpen(false)}
        title={
          buildStatus === 'success'
            ? 'Build Complete'
            : buildStatus === 'failed'
              ? 'Build Failed'
              : 'Building…'
        }
        size="md"
        footer={
          buildStatus !== 'building' ? (
            <>
              <Button variant="ghost" onClick={() => setBuildModalOpen(false)}>
                Close
              </Button>
              {buildStatus === 'success' && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setBuildModalOpen(false);
                    openPrototypeInNewTab();
                  }}
                >
                  View Prototype
                </Button>
              )}
            </>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <p className="text-[var(--text-base)] text-[var(--text-secondary)]">
            {buildStatus === 'success'
              ? `Scaffold generated for ${activeProject?.name ?? 'your app'}. You can walk through the prototype locally before deploying.`
              : buildStatus === 'failed'
                ? 'The build failed. Head back to the conversation to address what broke, then say "ready to build" when you want to try again.'
                : `Running the Now SDK build pipeline for ${activeProject?.name ?? 'your app'}…`}
          </p>
          <DeployProgress steps={buildSteps} />
        </div>
      </Modal>

      <Modal
        isOpen={deployModalOpen}
        onClose={() => deployStatus !== 'deploying' && setDeployModalOpen(false)}
        title={
          deployStatus === 'deployed'
            ? 'Deployment Complete'
            : deployStatus === 'failed'
              ? 'Deployment Failed'
              : 'Deploying to ServiceNow…'
        }
        size="md"
        footer={
          deployStatus !== 'deploying' ? (
            <Button variant="primary" onClick={() => setDeployModalOpen(false)}>
              Done
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <p className="text-[var(--text-base)] text-[var(--text-secondary)]">
            {deployStatus === 'deployed'
              ? `${activeProject?.name ?? 'Your app'} is live on dev378814. Links are in the chat.`
              : `Installing the scoped app on https://dev378814.service-now.com…`}
          </p>
          <DeployProgress steps={deploySteps} />
        </div>
      </Modal>
    </div>
  );
}
