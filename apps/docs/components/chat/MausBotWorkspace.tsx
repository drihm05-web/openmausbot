'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import Link from 'next/link';
import { useAppTheme } from '@/lib/use-app-theme';
import {
  ArrowUp,
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  FileText,
  Loader2,
  Menu,
  Moon,
  PanelRight,
  Paperclip,
  Plus,
  RotateCw,
  Search,
  Settings,
  Square,
  Sun,
  X,
} from 'lucide-react';
import {
  BOT_COLORS,
  MODEL_OPTIONS,
  createDefaultWorkspace,
  createId,
  formatShortTime,
  loadWorkspaceState,
  saveWorkspaceState,
  type BotColor,
  type BotModel,
  type BotProfile,
  type ChatAttachment,
  type ChatMessage,
  type WorkspaceSettings,
  type WorkspaceState,
} from '@/lib/bots';
import { BotMark } from './BotMark';
import { BotPanel } from './BotPanel';
import { MarkdownMessage } from './MarkdownMessage';
import { NewBotDialog } from './NewBotDialog';
import { SettingsDialog } from './SettingsDialog';

const TEXT_FILE_EXTENSIONS = new Set([
  'txt',
  'md',
  'mdx',
  'json',
  'ts',
  'tsx',
  'js',
  'jsx',
  'mjs',
  'cjs',
  'py',
  'css',
  'html',
  'csv',
  'sql',
  'yaml',
  'yml',
  'toml',
  'xml',
  'sh',
  'env',
  'log',
]);

function readFileAsAttachment(file: File): Promise<ChatAttachment | null> {
  return new Promise((resolve) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const isImage = file.type.startsWith('image/');
    const isText =
      file.type.startsWith('text/') ||
      file.type === 'application/json' ||
      TEXT_FILE_EXTENSIONS.has(ext);

    if (!isImage && !isText) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => resolve(null);
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        resolve(null);
        return;
      }
      if (isImage) {
        resolve({
          id: createId('att'),
          name: file.name,
          mimeType: file.type || 'image/png',
          size: file.size,
          dataUrl: result,
        });
      } else {
        resolve({
          id: createId('att'),
          name: file.name,
          mimeType: file.type || 'text/plain',
          size: file.size,
          textContent: result,
        });
      }
    };

    if (isImage) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  });
}

export function MausBotWorkspace() {
  const { resolvedTheme, setTheme } = useAppTheme();
  const [mounted, setMounted] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceState>(() => createDefaultWorkspace());
  const [searchQuery, setSearchQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [quickCustomInput, setQuickCustomInput] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [streamingBotId, setStreamingBotId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [newBotOpen, setNewBotOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [attachmentNote, setAttachmentNote] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const modelMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    setWorkspace(loadWorkspaceState());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    saveWorkspaceState(workspace);
  }, [workspace, mounted]);

  useEffect(() => {
    if (!modelMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setModelMenuOpen(false);
      }
    };
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setModelMenuOpen(false);
    };
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [modelMenuOpen]);

  const activeBot = useMemo(() => {
    return workspace.bots.find((b) => b.id === workspace.activeBotId) ?? workspace.bots[0];
  }, [workspace.bots, workspace.activeBotId]);

  const activeThread = useMemo(() => {
    return (
      activeBot.threads.find((t) => t.id === activeBot.activeThreadId) ?? activeBot.threads[0]
    );
  }, [activeBot]);

  const filteredBots = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return workspace.bots;
    return workspace.bots.filter(
      (bot) =>
        bot.name.toLowerCase().includes(q) ||
        bot.role.toLowerCase().includes(q) ||
        bot.threads.some((t) =>
          t.messages.some((m) => m.content.toLowerCase().includes(q)),
        ),
    );
  }, [workspace.bots, searchQuery]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    window.requestAnimationFrame(() => {
      transcriptEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    });
  }, []);

  useEffect(() => {
    scrollToBottom('auto');
  }, [activeBot.id, activeThread.id, scrollToBottom]);

  useEffect(() => {
    if (!composerRef.current) return;
    composerRef.current.style.height = 'auto';
    const nextHeight = Math.min(composerRef.current.scrollHeight, 168);
    composerRef.current.style.height = `${Math.max(nextHeight, 24)}px`;
  }, [draft]);

  const updateBot = useCallback((botId: string, patch: Partial<BotProfile>) => {
    setWorkspace((prev) => ({
      ...prev,
      bots: prev.bots.map((b) => (b.id === botId ? { ...b, ...patch } : b)),
    }));
  }, []);

  const streamReply = useCallback(
    async (
      targetBot: BotProfile,
      targetThreadId: string,
      historyForApi: ChatMessage[],
      assistantMessageId: string,
    ) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStreamingBotId(targetBot.id);

      const updateAssistantMessage = (updater: (msg: ChatMessage) => ChatMessage) => {
        setWorkspace((prev) => ({
          ...prev,
          bots: prev.bots.map((bot) => {
            if (bot.id !== targetBot.id) return bot;
            return {
              ...bot,
              threads: bot.threads.map((thread) => {
                if (thread.id !== targetThreadId) return thread;
                return {
                  ...thread,
                  updatedAt: Date.now(),
                  messages: thread.messages.map((m) =>
                    m.id === assistantMessageId ? updater(m) : m,
                  ),
                };
              }),
            };
          }),
        }));
      };

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            botName: targetBot.name,
            botRole: targetBot.role,
            systemInstruction: targetBot.systemInstruction,
            userName: workspace.settings.userName,
            model: targetBot.model,
            thinkingEffort: targetBot.thinkingEffort,
            messages: historyForApi.map((m) => ({
              role: m.role,
              content: m.content,
              attachments: m.attachments?.map((a) => ({
                name: a.name,
                mimeType: a.mimeType,
                dataUrl: a.dataUrl,
                textContent: a.textContent,
              })),
            })),
          }),
        });

        if (!res.ok) {
          let errorText = 'Could not reach the model. Check your connection and try again.';
          try {
            const data = (await res.json()) as { error?: string };
            if (data.error) errorText = data.error;
          } catch {
            // Keep fallback error text
          }
          updateAssistantMessage((msg) => ({ ...msg, error: errorText }));
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          updateAssistantMessage((msg) => ({
            ...msg,
            error: 'No response stream was returned by the server.',
          }));
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let receivedText = false;
        let receivedError = false;

        const processEvents = (chunkText: string) => {
          for (const line of chunkText.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const payloadStr = line.slice(6).trim();
            if (!payloadStr) continue;
            try {
              const payload = JSON.parse(payloadStr) as {
                text?: string;
                error?: string;
                done?: boolean;
              };
              if (payload.error) {
                receivedError = true;
                updateAssistantMessage((msg) => ({ ...msg, error: payload.error }));
              } else if (payload.text) {
                receivedText = true;
                updateAssistantMessage((msg) => ({
                  ...msg,
                  content: msg.content + payload.text,
                }));
                scrollToBottom('auto');
              }
            } catch {
              // Ignore malformed SSE chunk
            }
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split('\n\n');
          buffer = events.pop() ?? '';

          for (const event of events) {
            processEvents(event);
          }
        }

        if (buffer.trim()) {
          processEvents(buffer);
        }

        if (!receivedText && !receivedError) {
          updateAssistantMessage((msg) => ({
            ...msg,
            error: 'No reply was returned by the model. Try again.',
          }));
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          return;
        }
        updateAssistantMessage((msg) => ({
          ...msg,
          error: 'Connection interrupted before the reply finished. Try again.',
        }));
      } finally {
        setStreamingBotId((current) => (current === targetBot.id ? null : current));
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    },
    [scrollToBottom, workspace.settings.userName],
  );

  const sendMessage = useCallback(
    async (textToSend: string, filesToSend: ChatAttachment[] = []) => {
      const trimmed = textToSend.trim();
      if (!trimmed && filesToSend.length === 0) return;
      if (streamingBotId === activeBot.id) return;

      const userMsg: ChatMessage = {
        id: createId('msg'),
        role: 'user',
        content: trimmed,
        createdAt: Date.now(),
        attachments: filesToSend.length > 0 ? filesToSend : undefined,
      };
      const assistantMsg: ChatMessage = {
        id: createId('msg'),
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
      };

      const updatedHistory = [...activeThread.messages, userMsg];
      const nextTitle =
        activeThread.messages.every((m) => m.role === 'assistant') && trimmed
          ? trimmed.slice(0, 42)
          : activeThread.title;

      setWorkspace((prev) => ({
        ...prev,
        bots: prev.bots.map((bot) => {
          if (bot.id !== activeBot.id) return bot;
          return {
            ...bot,
            quickPrompt: undefined,
            threads: bot.threads.map((thread) => {
              if (thread.id !== activeThread.id) return thread;
              return {
                ...thread,
                title: nextTitle,
                updatedAt: Date.now(),
                messages: [...thread.messages, userMsg, assistantMsg],
              };
            }),
          };
        }),
      }));

      setDraft('');
      setQuickCustomInput('');
      setAttachments([]);
      setAttachmentNote(null);
      scrollToBottom('smooth');

      await streamReply(activeBot, activeThread.id, updatedHistory, assistantMsg.id);
    },
    [activeBot, activeThread, scrollToBottom, streamReply, streamingBotId],
  );

  const handleRetryMessage = useCallback(
    async (messageId: string) => {
      if (streamingBotId === activeBot.id) return;
      const idx = activeThread.messages.findIndex((m) => m.id === messageId);
      if (idx < 0) return;

      const historyBefore = activeThread.messages.slice(0, idx);
      if (historyBefore.length === 0) return;

      setWorkspace((prev) => ({
        ...prev,
        bots: prev.bots.map((bot) => {
          if (bot.id !== activeBot.id) return bot;
          return {
            ...bot,
            threads: bot.threads.map((thread) => {
              if (thread.id !== activeThread.id) return thread;
              return {
                ...thread,
                messages: thread.messages.map((m) =>
                  m.id === messageId ? { ...m, content: '', error: undefined } : m,
                ),
              };
            }),
          };
        }),
      }));

      await streamReply(activeBot, activeThread.id, historyBefore, messageId);
    },
    [activeBot, activeThread, streamReply, streamingBotId],
  );

  const handleStopStreaming = () => {
    abortRef.current?.abort();
    setStreamingBotId(null);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const loaded: ChatAttachment[] = [];
    let skipped = 0;

    for (const file of Array.from(fileList).slice(0, 4)) {
      if (file.size > 4 * 1024 * 1024) {
        skipped += 1;
        continue;
      }
      const parsed = await readFileAsAttachment(file);
      if (parsed) {
        loaded.push(parsed);
      } else {
        skipped += 1;
      }
    }

    if (loaded.length > 0) {
      setAttachments((prev) => [...prev, ...loaded].slice(0, 4));
    }
    if (skipped > 0) {
      setAttachmentNote('Only images and text/code files under 4 MB can be attached.');
    } else {
      setAttachmentNote(null);
    }
    e.target.value = '';
  };

  const handleCreateTaskThread = useCallback(() => {
    const newThreadId = createId('thread');
    const now = Date.now();
    setWorkspace((prev) => ({
      ...prev,
      bots: prev.bots.map((bot) => {
        if (bot.id !== activeBot.id) return bot;
        return {
          ...bot,
          activeThreadId: newThreadId,
          threads: [
            {
              id: newThreadId,
              title: 'New task',
              createdAt: now,
              updatedAt: now,
              messages: [],
            },
            ...bot.threads,
          ],
        };
      }),
    }));
    composerRef.current?.focus();
  }, [activeBot.id]);

  const handleDeleteThread = (threadId: string) => {
    setWorkspace((prev) => ({
      ...prev,
      bots: prev.bots.map((bot) => {
        if (bot.id !== activeBot.id || bot.threads.length <= 1) return bot;
        const remaining = bot.threads.filter((t) => t.id !== threadId);
        return {
          ...bot,
          activeThreadId:
            bot.activeThreadId === threadId ? remaining[0].id : bot.activeThreadId,
          threads: remaining,
        };
      }),
    }));
  };

  const handleClearActiveThread = () => {
    setWorkspace((prev) => ({
      ...prev,
      bots: prev.bots.map((bot) => {
        if (bot.id !== activeBot.id) return bot;
        return {
          ...bot,
          threads: bot.threads.map((t) =>
            t.id === activeThread.id ? { ...t, messages: [], updatedAt: Date.now() } : t,
          ),
        };
      }),
    }));
  };

  const handleCreateBot = (input: {
    name: string;
    role: string;
    color: BotColor;
    model: BotModel;
    systemInstruction: string;
  }) => {
    const now = Date.now();
    const threadId = createId('thread');
    const botId = createId('bot');
    const newBot: BotProfile = {
      id: botId,
      name: input.name,
      role: input.role,
      color: input.color,
      model: input.model,
      thinkingEffort: 'high',
      systemInstruction: input.systemInstruction,
      activeThreadId: threadId,
      threads: [
        {
          id: threadId,
          title: 'New task',
          createdAt: now,
          updatedAt: now,
          messages: [
            {
              id: createId('msg'),
              role: 'assistant',
              content: `Hey — I'm ${input.name}. What are we working on?`,
              createdAt: now,
            },
          ],
        },
      ],
    };

    setWorkspace((prev) => ({
      ...prev,
      activeBotId: botId,
      bots: [newBot, ...prev.bots],
    }));
    setMobileSidebarOpen(false);
    composerRef.current?.focus();
  };

  const handleDeleteBot = () => {
    if (workspace.bots.length <= 1) return;
    setWorkspace((prev) => {
      const remaining = prev.bots.filter((b) => b.id !== activeBot.id);
      return {
        ...prev,
        activeBotId: remaining[0].id,
        bots: remaining,
      };
    });
    setPanelOpen(false);
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      window.setTimeout(() => {
        setCopiedMessageId((cur) => (cur === id ? null : cur));
      }, 1500);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleExportWorkspace = () => {
    const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mausbot-chats-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleResetWorkspace = () => {
    const fresh = createDefaultWorkspace();
    setWorkspace(fresh);
    saveWorkspaceState(fresh);
  };

  const handleComposerKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(draft, attachments);
    }
  };

  const isStreaming = streamingBotId === activeBot.id;
  const activeModelMeta =
    MODEL_OPTIONS.find((m) => m.id === activeBot.model) ?? MODEL_OPTIONS[0];
  const isAdvanced = workspace.settings.interfaceMode === 'advanced';
  const showQuickPrompt =
    Boolean(activeBot.quickPrompt) &&
    activeThread.messages.every((m) => m.role === 'assistant');

  const sidebarContent = (
    <div className="flex h-full flex-col bg-(--omb-panel)">
      <div className="flex h-13 shrink-0 items-center justify-between px-3.5">
        <div className="flex items-center gap-2 min-w-0">
          <img src="/app-icon.svg" alt="" className="size-6 rounded-md shrink-0" />
          <span className="text-[14px] font-semibold tracking-tight text-(--omb-ink) whitespace-nowrap">
            MausBot
          </span>
        </div>
        <button
          type="button"
          onClick={() => setNewBotOpen(true)}
          aria-label="New bot"
          title="New bot"
          className="inline-flex size-8 items-center justify-center rounded-full text-(--omb-ink-secondary) transition-colors hover:bg-(--omb-ink)/[0.06] hover:text-(--omb-ink)"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div className="px-3 pb-2.5">
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-(--omb-ink-tertiary)"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search bots and chats"
            className="h-8 w-full rounded-lg border border-(--omb-hairline) bg-(--omb-inset) ps-8 pe-3 text-[13px] text-(--omb-ink) placeholder:text-(--omb-ink-tertiary) outline-none transition-colors focus:border-(--omb-accent)"
          />
        </div>
      </div>

      <nav aria-label="Bots" className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {filteredBots.length === 0 ? (
          <p className="px-2.5 py-6 text-center text-[12.5px] text-(--omb-ink-tertiary)">
            No bots match your search.
          </p>
        ) : (
          filteredBots.map((bot) => {
            const isSelected = bot.id === activeBot.id;
            const botThread =
              bot.threads.find((t) => t.id === bot.activeThreadId) ?? bot.threads[0];
            const lastMsg = botThread?.messages[botThread.messages.length - 1];
            const preview =
              lastMsg?.content?.trim() ||
              bot.quickPrompt?.question ||
              bot.role ||
              'Ready to chat';

            return (
              <div key={bot.id} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setWorkspace((prev) => ({ ...prev, activeBotId: bot.id }));
                    setMobileSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start transition-colors ${
                    isSelected
                      ? 'bg-(--omb-raised)'
                      : 'hover:bg-(--omb-ink)/[0.05]'
                  }`}
                >
                  <BotMark color={bot.color} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px] font-medium text-(--omb-ink)">
                        {bot.name}
                      </span>
                      {botThread && (
                        <span className="shrink-0 text-[11px] text-(--omb-ink-tertiary) tabular-nums">
                          {formatShortTime(botThread.updatedAt)}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[12px] text-(--omb-ink-secondary)">{preview}</p>
                  </div>
                </button>

                {isAdvanced && isSelected && bot.threads.length > 1 && (
                  <div className="ms-9 space-y-0.5 border-s border-(--omb-hairline) ps-2.5 py-0.5">
                    {bot.threads.map((t) => {
                      const activeT = t.id === bot.activeThreadId;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => updateBot(bot.id, { activeThreadId: t.id })}
                          className={`block w-full truncate rounded-md px-2 py-1 text-start text-[12px] transition-colors ${
                            activeT
                              ? 'bg-(--omb-raised) font-medium text-(--omb-ink)'
                              : 'text-(--omb-ink-secondary) hover:bg-(--omb-ink)/[0.05] hover:text-(--omb-ink)'
                          }`}
                        >
                          {t.title}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>

      <div className="shrink-0 border-t border-(--omb-edge) px-2 py-2 space-y-0.5">
        <Link
          href="/docs"
          className="flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] text-(--omb-ink-secondary) transition-colors hover:bg-(--omb-ink)/[0.05] hover:text-(--omb-ink)"
        >
          <BookOpen className="size-4 shrink-0" aria-hidden="true" />
          <span>Docs</span>
        </Link>

        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-start text-[13px] text-(--omb-ink-secondary) transition-colors hover:bg-(--omb-ink)/[0.05] hover:text-(--omb-ink)"
        >
          {mounted && resolvedTheme === 'dark' ? (
            <Sun className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <Moon className="size-4 shrink-0" aria-hidden="true" />
          )}
          <span>{mounted && resolvedTheme === 'dark' ? 'Daylight theme' : 'Midnight theme'}</span>
        </button>

        <div className="flex items-center justify-between gap-2 rounded-lg px-2.5 h-9">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex min-w-0 flex-1 items-center gap-2 text-start text-[13px] font-medium text-(--omb-ink) hover:opacity-80"
          >
            <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-(--omb-hairline) bg-(--omb-inset) text-[11px] font-semibold text-(--omb-ink-secondary)">
              {(workspace.settings.userName.trim()[0] || 'Y').toUpperCase()}
            </span>
            <span className="truncate">{workspace.settings.userName}</span>
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
            title="Settings"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-(--omb-ink-secondary) transition-colors hover:bg-(--omb-ink)/[0.06] hover:text-(--omb-ink)"
          >
            <Settings className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-(--omb-app) text-(--omb-ink)">
      <aside className="hidden w-70 shrink-0 border-e border-(--omb-edge) md:block">
        {sidebarContent}
      </aside>

      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 flex bg-black/50 md:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileSidebarOpen(false);
          }}
        >
          <aside className="h-full w-72 border-e border-(--omb-edge) bg-(--omb-panel)">
            {sidebarContent}
          </aside>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col bg-(--omb-app)">
        <header className="flex h-13 shrink-0 items-center justify-between gap-3 border-b border-(--omb-edge) px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open bot list"
              className="inline-flex size-8 items-center justify-center rounded-full text-(--omb-ink-secondary) hover:bg-(--omb-ink)/[0.06] hover:text-(--omb-ink) md:hidden"
            >
              <Menu className="size-4" />
            </button>

            <button
              type="button"
              onClick={() => setPanelOpen((v) => !v)}
              className="flex min-w-0 items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-(--omb-ink)/[0.05]"
              title="Toggle bot settings"
            >
              <BotMark color={activeBot.color} size={24} />
              <span className="truncate text-[14px] font-semibold text-(--omb-ink)">
                {activeBot.name}
              </span>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleCreateTaskThread}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-(--omb-hairline) bg-(--omb-raised) px-2.5 text-[12px] font-medium text-(--omb-ink) transition-colors hover:bg-(--omb-raised-hover) whitespace-nowrap shrink-0"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              <span>Task</span>
            </button>

            <div className="relative" ref={modelMenuRef}>
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={modelMenuOpen}
                onClick={() => setModelMenuOpen((v) => !v)}
                className="inline-flex h-7 items-center gap-1.5 rounded-full border border-(--omb-hairline) bg-(--omb-raised) px-2.5 text-[12px] font-medium text-(--omb-ink) transition-colors hover:bg-(--omb-raised-hover) whitespace-nowrap shrink-0"
              >
                <span>{activeModelMeta.shortLabel}</span>
                <ChevronDown className="size-3.5 text-(--omb-ink-tertiary)" aria-hidden="true" />
              </button>

              {modelMenuOpen && (
                <div
                  role="listbox"
                  aria-label="Select AI model"
                  className="absolute end-0 top-9 z-30 w-60 rounded-xl border border-(--omb-hairline) bg-(--omb-panel) p-1.5 shadow-xl"
                >
                  {MODEL_OPTIONS.map((opt) => {
                    const selected = activeBot.model === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          updateBot(activeBot.id, { model: opt.id });
                          setModelMenuOpen(false);
                        }}
                        className={`flex w-full items-start justify-between gap-2 rounded-md px-2.5 py-2 text-start transition-colors ${
                          selected
                            ? 'bg-(--omb-raised)'
                            : 'hover:bg-(--omb-ink)/[0.05]'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-(--omb-ink)">{opt.label}</p>
                          <p className="text-[11.5px] text-(--omb-ink-tertiary)">
                            {opt.description}
                          </p>
                        </div>
                        {selected && (
                          <Check className="mt-0.5 size-3.5 shrink-0 text-(--omb-accent)" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setPanelOpen((v) => !v)}
              aria-label="Toggle bot panel"
              aria-pressed={panelOpen}
              title="Bot settings"
              className={`inline-flex size-8 items-center justify-center rounded-full transition-colors ${
                panelOpen
                  ? 'bg-(--omb-raised) text-(--omb-ink)'
                  : 'text-(--omb-ink-secondary) hover:bg-(--omb-ink)/[0.06] hover:text-(--omb-ink)'
              }`}
            >
              <PanelRight className="size-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <div className="mx-auto flex w-full max-w-3xl flex-col space-y-4">
            <div className="text-center text-[12px] text-(--omb-ink-tertiary) tabular-nums">
              {activeThread.title} · {formatShortTime(activeThread.createdAt)}
            </div>

            {activeThread.messages.length === 0 && !showQuickPrompt && (
              <div className="rounded-2xl border border-(--omb-hairline) bg-(--omb-card) px-5 py-4 text-[13.5px] text-(--omb-ink-secondary)">
                Start a conversation with <span className="font-medium text-(--omb-ink)">{activeBot.name}</span>.
              </div>
            )}

            {activeThread.messages.map((message) => {
              const isUser = message.role === 'user';
              const isThisStreaming =
                isStreaming &&
                !isUser &&
                message.id === activeThread.messages[activeThread.messages.length - 1]?.id;

              if (isUser) {
                return (
                  <div key={message.id} className="flex flex-col items-end gap-1.5">
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="flex flex-wrap justify-end gap-2 max-w-[82%]">
                        {message.attachments.map((att) =>
                          att.dataUrl ? (
                            <img
                              key={att.id}
                              src={att.dataUrl}
                              alt={att.name}
                              className="max-h-44 rounded-xl border border-(--omb-hairline) object-cover"
                            />
                          ) : (
                            <span
                              key={att.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-(--omb-hairline) bg-(--omb-card) px-2.5 py-1 text-[12px] text-(--omb-ink-secondary)"
                            >
                              <FileText className="size-3.5" aria-hidden="true" />
                              <span className="max-w-44 truncate">{att.name}</span>
                            </span>
                          ),
                        )}
                      </div>
                    )}
                    {message.content && (
                      <div
                        dir="auto"
                        className="max-w-[82%] rounded-[18px] bg-(--omb-raised) px-4 py-2.5 text-[14.5px] leading-[1.55] text-(--omb-ink) whitespace-pre-wrap break-words"
                      >
                        {message.content}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={message.id} className="group flex flex-col items-start gap-1">
                  <div className="w-full max-w-[92%] rounded-[18px] border border-(--omb-hairline) bg-(--omb-card) px-4.5 py-3.5">
                    {isAdvanced && (
                      <div
                        className={`mb-1.5 text-[12.5px] font-semibold ${BOT_COLORS[activeBot.color].textClass}`}
                      >
                        {activeBot.name}
                      </div>
                    )}

                    {message.error ? (
                      <div className="space-y-2.5 text-[13.5px]">
                        <p className="text-(--omb-danger)">{message.error}</p>
                        <button
                          type="button"
                          onClick={() => void handleRetryMessage(message.id)}
                          className="inline-flex h-7 items-center gap-1.5 rounded-full border border-(--omb-hairline) bg-(--omb-raised) px-3 text-[12px] font-medium text-(--omb-ink) hover:bg-(--omb-raised-hover)"
                        >
                          <RotateCw className="size-3" aria-hidden="true" />
                          <span>Retry</span>
                        </button>
                      </div>
                    ) : message.content ? (
                      <MarkdownMessage content={message.content} />
                    ) : isThisStreaming ? (
                      <div className="flex items-center gap-2 text-[13px] text-(--omb-ink-tertiary)">
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                        <span>Thinking…</span>
                      </div>
                    ) : null}
                  </div>

                  {message.content && !isThisStreaming && (
                    <div className="flex items-center gap-1 ps-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => void handleCopy(message.id, message.content)}
                        className="inline-flex h-6 items-center gap-1 rounded-md px-2 text-[11.5px] text-(--omb-ink-tertiary) transition-colors hover:bg-(--omb-ink)/[0.06] hover:text-(--omb-ink)"
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="size-3" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                        <span>{copiedMessageId === message.id ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRetryMessage(message.id)}
                        className="inline-flex h-6 items-center gap-1 rounded-md px-2 text-[11.5px] text-(--omb-ink-tertiary) transition-colors hover:bg-(--omb-ink)/[0.06] hover:text-(--omb-ink)"
                      >
                        <RotateCw className="size-3" />
                        <span>Retry</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {showQuickPrompt && activeBot.quickPrompt && (
              <div className="rounded-[18px] border border-(--omb-hairline) bg-(--omb-card) p-5">
                <div className="flex items-start justify-between gap-4 pb-3.5">
                  <div>
                    <h2 className="text-[15px] font-semibold text-(--omb-ink)">
                      {activeBot.quickPrompt.question}
                    </h2>
                    <p className="mt-0.5 text-[13px] text-(--omb-ink-secondary)">
                      {activeBot.quickPrompt.subtitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Dismiss starter options"
                    onClick={() => updateBot(activeBot.id, { quickPrompt: undefined })}
                    className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-(--omb-ink-tertiary) hover:bg-(--omb-ink)/[0.06] hover:text-(--omb-ink)"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="overflow-hidden rounded-xl border border-(--omb-hairline) divide-y divide-(--omb-hairline)">
                  {activeBot.quickPrompt.options.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => void sendMessage(opt.label)}
                      className="flex w-full items-center gap-3 bg-(--omb-app)/40 px-3.5 py-2.5 text-start text-[13.5px] text-(--omb-ink) transition-colors hover:bg-(--omb-raised)"
                    >
                      <span className="inline-flex size-5 shrink-0 items-center justify-center rounded border border-(--omb-hairline) bg-(--omb-inset) font-mono text-[11px] text-(--omb-ink-secondary)">
                        {opt.key}
                      </span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>

                <form
                  className="mt-3 flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void sendMessage(quickCustomInput);
                  }}
                >
                  <input
                    type="text"
                    dir="auto"
                    value={quickCustomInput}
                    onChange={(e) => setQuickCustomInput(e.target.value)}
                    placeholder="Type your own answer"
                    aria-label="Type your own answer"
                    className="h-9 flex-1 rounded-lg border border-(--omb-hairline) bg-(--omb-inset) px-3 text-[13px] text-(--omb-ink) placeholder:text-(--omb-ink-tertiary) outline-none focus:border-(--omb-accent)"
                  />
                  {quickCustomInput.trim() && (
                    <button
                      type="submit"
                      className="h-9 rounded-lg bg-(--omb-ink) px-3.5 text-[13px] font-medium text-(--omb-app) whitespace-nowrap"
                    >
                      Send
                    </button>
                  )}
                </form>
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>
        </div>

        <div className="shrink-0 px-4 pb-4 pt-2 sm:px-8">
          <div className="mx-auto w-full max-w-3xl">
            {attachmentNote && (
              <p className="mb-2 px-2 text-[12px] text-(--omb-danger)">{attachmentNote}</p>
            )}

            {attachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2 px-1">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-(--omb-hairline) bg-(--omb-card) px-2.5 py-1 text-[12px] text-(--omb-ink)"
                  >
                    {att.dataUrl ? (
                      <img src={att.dataUrl} alt={att.name} className="size-5 rounded object-cover" />
                    ) : (
                      <FileText className="size-3.5 text-(--omb-ink-secondary)" aria-hidden="true" />
                    )}
                    <span className="max-w-40 truncate">{att.name}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${att.name}`}
                      onClick={() =>
                        setAttachments((prev) => prev.filter((item) => item.id !== att.id))
                      }
                      className="text-(--omb-ink-tertiary) hover:text-(--omb-ink)"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 rounded-[22px] border border-(--omb-hairline) bg-(--omb-composer) px-3 py-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.txt,.md,.mdx,.json,.ts,.tsx,.js,.jsx,.py,.css,.html,.csv,.sql,.yaml,.yml"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach file or image"
                title="Attach file or image"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-(--omb-ink-secondary) transition-colors hover:bg-(--omb-ink)/[0.06] hover:text-(--omb-ink)"
              >
                <Paperclip className="size-4" />
              </button>

              <textarea
                ref={composerRef}
                rows={1}
                dir="auto"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder={`Message ${activeBot.name}`}
                aria-label={`Message ${activeBot.name}`}
                className="max-h-42 min-h-6 flex-1 resize-none bg-transparent py-1 text-[14.5px] leading-6 text-(--omb-ink) placeholder:text-(--omb-ink-tertiary) outline-none"
              />

              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleStopStreaming}
                  aria-label="Stop response"
                  title="Stop response"
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-(--omb-ink) text-(--omb-app) transition-opacity hover:opacity-90"
                >
                  <Square className="size-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!draft.trim() && attachments.length === 0}
                  onClick={() => void sendMessage(draft, attachments)}
                  aria-label="Send message"
                  title="Send message"
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-(--omb-ink) text-(--omb-app) transition-opacity hover:opacity-90 disabled:opacity-25"
                >
                  <ArrowUp className="size-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {panelOpen && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/45 md:static md:inset-auto md:bg-transparent">
          <BotPanel
            bot={activeBot}
            canDeleteBot={workspace.bots.length > 1}
            isAdvanced={isAdvanced}
            onClose={() => setPanelOpen(false)}
            onUpdateBot={(patch) => updateBot(activeBot.id, patch)}
            onSelectThread={(threadId) => updateBot(activeBot.id, { activeThreadId: threadId })}
            onCreateThread={handleCreateTaskThread}
            onDeleteThread={handleDeleteThread}
            onClearActiveThread={handleClearActiveThread}
            onDeleteBot={handleDeleteBot}
          />
        </div>
      )}

      <NewBotDialog
        open={newBotOpen}
        onClose={() => setNewBotOpen(false)}
        onCreate={handleCreateBot}
      />

      <SettingsDialog
        open={settingsOpen}
        settings={workspace.settings}
        onClose={() => setSettingsOpen(false)}
        onUpdateSettings={(patch: Partial<WorkspaceSettings>) =>
          setWorkspace((prev) => ({
            ...prev,
            settings: { ...prev.settings, ...patch },
          }))
        }
        onExportWorkspace={handleExportWorkspace}
        onResetWorkspace={handleResetWorkspace}
      />
    </div>
  );
}
