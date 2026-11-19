export type BotColor = 'emerald' | 'coral' | 'sky' | 'amber' | 'violet' | 'teal';
export type BotModel = 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';
export type ThinkingEffort = 'low' | 'medium' | 'high' | 'xhigh';

export interface ChatAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl?: string;
  textContent?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  attachments?: ChatAttachment[];
  error?: string;
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface QuickSetupPrompt {
  question: string;
  subtitle: string;
  options: { key: string; label: string }[];
}

export interface BotProfile {
  id: string;
  name: string;
  role: string;
  color: BotColor;
  model: BotModel;
  thinkingEffort: ThinkingEffort;
  systemInstruction: string;
  activeThreadId: string;
  threads: ChatThread[];
  quickPrompt?: QuickSetupPrompt;
}

export interface WorkspaceSettings {
  userName: string;
  interfaceMode: 'simple' | 'advanced';
}

export interface WorkspaceState {
  bots: BotProfile[];
  activeBotId: string;
  settings: WorkspaceSettings;
}

export const BOT_COLORS: Record<
  BotColor,
  {
    label: string;
    fill: string;
    textClass: string;
    ringClass: string;
  }
> = {
  emerald: {
    label: 'Emerald',
    fill: '#10a362',
    textClass: 'text-[#00824a] dark:text-[#4ade97]',
    ringClass: 'ring-[#10a362]',
  },
  coral: {
    label: 'Coral',
    fill: '#e5484d',
    textClass: 'text-[#c93439] dark:text-[#ff787c]',
    ringClass: 'ring-[#e5484d]',
  },
  sky: {
    label: 'Sky',
    fill: '#0091ff',
    textClass: 'text-[#0074cc] dark:text-[#5eb5ff]',
    ringClass: 'ring-[#0091ff]',
  },
  amber: {
    label: 'Amber',
    fill: '#e59500',
    textClass: 'text-[#b26e00] dark:text-[#ffc145]',
    ringClass: 'ring-[#e59500]',
  },
  violet: {
    label: 'Violet',
    fill: '#8b5cf6',
    textClass: 'text-[#6d3fd8] dark:text-[#b494ff]',
    ringClass: 'ring-[#8b5cf6]',
  },
  teal: {
    label: 'Teal',
    fill: '#0d9488',
    textClass: 'text-[#0b766c] dark:text-[#4dd4c7]',
    ringClass: 'ring-[#0d9488]',
  },
};

export const MODEL_OPTIONS: {
  id: BotModel;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    id: 'gemini-3.1-flash-lite',
    label: 'Gemini 3.1 Flash Lite',
    shortLabel: 'Gemini 3.1 Lite',
    description: 'Fastest responses for everyday tasks',
  },
  {
    id: 'gemini-4-hydrogen',
    label: 'Gemini 4 Hydrogen',
    shortLabel: 'Gemini 4 Hydrogen',
    description: 'Deep reasoning with adjustable effort',
  },
];

export const EFFORT_OPTIONS: { id: ThinkingEffort; label: string }[] = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'xhigh', label: 'Max' },
];

const LEGACY_STORAGE_KEY = 'openmausbot.workspace.v1';
export const STORAGE_KEY = 'openmausbot.workspace.v2';
const INITIAL_TIMESTAMP = 1795075200000;

export function createId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createDefaultWorkspace(): WorkspaceState {
  const base = INITIAL_TIMESTAMP;
  return {
    activeBotId: 'bot_bramble',
    settings: {
      userName: 'You',
      interfaceMode: 'simple',
    },
    bots: [
      {
        id: 'bot_bramble',
        name: 'Bramble',
        role: 'Everyday chief of staff',
        color: 'emerald',
        model: 'gemini-3.1-flash-lite',
        thinkingEffort: 'medium',
        systemInstruction:
          'You are Bramble, a calm and practical generalist assistant. Help the user break down tasks, draft clear messages, organize work, and think through decisions without fluff.',
        activeThreadId: 'thread_bramble_1',
        quickPrompt: {
          question: 'What do you mostly want help with?',
          subtitle: "Pick whatever's closest; we can always expand from there.",
          options: [
            { key: 'A', label: 'Work & projects' },
            { key: 'B', label: 'Writing & research' },
            { key: 'C', label: 'Life admin' },
            { key: 'D', label: 'A bit of everything' },
          ],
        },
        threads: [
          {
            id: 'thread_bramble_1',
            title: 'Getting started',
            createdAt: base,
            updatedAt: base,
            messages: [
              {
                id: 'msg_bramble_welcome',
                role: 'assistant',
                content: "Hey — I'm Bramble. Nice to meet you.",
                createdAt: base,
              },
            ],
          },
        ],
      },
      {
        id: 'bot_forge',
        name: 'Forge',
        role: 'Software & architecture',
        color: 'sky',
        model: 'gemini-3.1-flash-lite',
        thinkingEffort: 'medium',
        systemInstruction:
          'You are Forge, a pragmatic senior software engineer. Give direct architectural advice, debug root causes methodically, and write clean, idiomatic TypeScript, SQL, and shell commands.',
        activeThreadId: 'thread_forge_1',
        threads: [
          {
            id: 'thread_forge_1',
            title: 'Engineering',
            createdAt: base - 1000 * 60 * 30,
            updatedAt: base - 1000 * 60 * 30,
            messages: [
              {
                id: 'msg_forge_welcome',
                role: 'assistant',
                content:
                  'Ready when you are. Paste code, an error log, or an architecture problem and we can work through it.',
                createdAt: base - 1000 * 60 * 30,
              },
            ],
          },
        ],
      },
      {
        id: 'bot_atlas',
        name: 'Atlas',
        role: 'Research & synthesis',
        color: 'coral',
        model: 'gemini-3.1-flash-lite',
        thinkingEffort: 'medium',
        systemInstruction:
          'You are Atlas, an analytical researcher. Compare options honestly, surface trade-offs and edge cases, and organize findings into crisp, scannable tables and briefs.',
        activeThreadId: 'thread_atlas_1',
        threads: [
          {
            id: 'thread_atlas_1',
            title: 'Research brief',
            createdAt: base - 1000 * 60 * 90,
            updatedAt: base - 1000 * 60 * 90,
            messages: [
              {
                id: 'msg_atlas_welcome',
                role: 'assistant',
                content:
                  'Share a topic, document, or decision you are weighing and I will map out the key angles.',
                createdAt: base - 1000 * 60 * 90,
              },
            ],
          },
        ],
      },
      {
        id: 'bot_quill',
        name: 'Quill',
        role: 'Writing & editing',
        color: 'amber',
        model: 'gemini-3.1-flash-lite',
        thinkingEffort: 'medium',
        systemInstruction:
          'You are Quill, a sharp editor. Tighten prose, keep tone natural and calm, remove filler, and adapt drafts to the target audience without losing the writer’s voice.',
        activeThreadId: 'thread_quill_1',
        threads: [
          {
            id: 'thread_quill_1',
            title: 'Drafting',
            createdAt: base - 1000 * 60 * 180,
            updatedAt: base - 1000 * 60 * 180,
            messages: [
              {
                id: 'msg_quill_welcome',
                role: 'assistant',
                content:
                  'Drop in a rough draft, email, or outline and tell me who needs to read it.',
                createdAt: base - 1000 * 60 * 180,
              },
            ],
          },
        ],
      },
    ],
  };
}

export function loadWorkspaceState(): WorkspaceState {
  if (typeof window === 'undefined') return createDefaultWorkspace();
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return createDefaultWorkspace();
    const isMigrating = !window.localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw) as Partial<WorkspaceState>;
    if (!Array.isArray(parsed.bots) || parsed.bots.length === 0) {
      return createDefaultWorkspace();
    }
    const validBots = parsed.bots
      .filter(
        (bot): bot is BotProfile =>
          Boolean(bot && bot.id && bot.name && Array.isArray(bot.threads) && bot.threads.length > 0),
      )
      .map((bot) =>
        isMigrating && bot.model === 'gemini-4-hydrogen'
          ? { ...bot, model: 'gemini-3.1-flash-lite' as BotModel }
          : bot,
      );
    if (validBots.length === 0) return createDefaultWorkspace();
    const activeBotId = validBots.some((b) => b.id === parsed.activeBotId)
      ? (parsed.activeBotId as string)
      : validBots[0].id;
    return {
      bots: validBots,
      activeBotId,
      settings: {
        userName: parsed.settings?.userName?.trim() || 'You',
        interfaceMode: parsed.settings?.interfaceMode === 'advanced' ? 'advanced' : 'simple',
      },
    };
  } catch {
    return createDefaultWorkspace();
  }
}

export function saveWorkspaceState(state: WorkspaceState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function formatShortTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}
