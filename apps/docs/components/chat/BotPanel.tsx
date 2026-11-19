'use client';

import { Plus, Trash2, X } from 'lucide-react';
import {
  BOT_COLORS,
  EFFORT_OPTIONS,
  MODEL_OPTIONS,
  formatShortTime,
  type BotColor,
  type BotModel,
  type BotProfile,
  type ThinkingEffort,
} from '@/lib/bots';
import { BotMark } from './BotMark';

interface BotPanelProps {
  bot: BotProfile;
  canDeleteBot: boolean;
  isAdvanced: boolean;
  onClose: () => void;
  onUpdateBot: (patch: Partial<BotProfile>) => void;
  onSelectThread: (threadId: string) => void;
  onCreateThread: () => void;
  onDeleteThread: (threadId: string) => void;
  onClearActiveThread: () => void;
  onDeleteBot: () => void;
}

const colorKeys = Object.keys(BOT_COLORS) as BotColor[];

export function BotPanel({
  bot,
  canDeleteBot,
  isAdvanced,
  onClose,
  onUpdateBot,
  onSelectThread,
  onCreateThread,
  onDeleteThread,
  onClearActiveThread,
  onDeleteBot,
}: BotPanelProps) {
  return (
    <aside
      aria-label={`${bot.name} settings`}
      className="flex h-full w-full flex-col border-s border-(--omb-edge) bg-(--omb-panel) md:w-80 shrink-0"
    >
      <div className="flex h-13 shrink-0 items-center justify-between border-b border-(--omb-edge) px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <BotMark color={bot.color} size={22} />
          <h2 className="truncate text-[14px] font-semibold text-(--omb-ink)">{bot.name}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close bot panel"
          className="inline-flex size-7 items-center justify-center rounded-full text-(--omb-ink-secondary) transition-colors hover:bg-(--omb-ink)/[0.06] hover:text-(--omb-ink)"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        <section className="space-y-3">
          <h3 className="text-[12px] font-medium text-(--omb-ink-tertiary)">Identity</h3>

          <div className="space-y-1.5">
            <label htmlFor="bot-name-input" className="block text-[12px] font-medium text-(--omb-ink-secondary)">
              Name
            </label>
            <input
              id="bot-name-input"
              type="text"
              dir="auto"
              value={bot.name}
              maxLength={40}
              onChange={(e) => onUpdateBot({ name: e.target.value })}
              className="h-9 w-full rounded-lg border border-(--omb-hairline) bg-(--omb-inset) px-3 text-[13px] text-(--omb-ink) outline-none transition-colors focus:border-(--omb-accent)"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bot-role-input" className="block text-[12px] font-medium text-(--omb-ink-secondary)">
              Role
            </label>
            <input
              id="bot-role-input"
              type="text"
              dir="auto"
              value={bot.role}
              maxLength={64}
              onChange={(e) => onUpdateBot({ role: e.target.value })}
              className="h-9 w-full rounded-lg border border-(--omb-hairline) bg-(--omb-inset) px-3 text-[13px] text-(--omb-ink) outline-none transition-colors focus:border-(--omb-accent)"
            />
          </div>

          <div className="space-y-1.5">
            <span className="block text-[12px] font-medium text-(--omb-ink-secondary)">Color</span>
            <div className="flex items-center gap-2">
              {colorKeys.map((key) => {
                const selected = bot.color === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onUpdateBot({ color: key })}
                    aria-label={`Set color to ${BOT_COLORS[key].label}`}
                    aria-pressed={selected}
                    className={`size-6 rounded-full transition-transform ${
                      selected
                        ? 'scale-110 ring-2 ring-(--omb-ink) ring-offset-2 ring-offset-(--omb-panel)'
                        : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: BOT_COLORS[key].fill }}
                  />
                );
              })}
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <label
            htmlFor="bot-instructions-input"
            className="block text-[12px] font-medium text-(--omb-ink-tertiary)"
          >
            Instructions
          </label>
          <textarea
            id="bot-instructions-input"
            dir="auto"
            rows={5}
            value={bot.systemInstruction}
            onChange={(e) => onUpdateBot({ systemInstruction: e.target.value })}
            placeholder="Describe how this bot thinks, writes, and helps you."
            className="w-full resize-y rounded-lg border border-(--omb-hairline) bg-(--omb-inset) px-3 py-2 text-[13px] leading-[1.45] text-(--omb-ink) placeholder:text-(--omb-ink-tertiary) outline-none transition-colors focus:border-(--omb-accent)"
          />
        </section>

        <section className="space-y-3">
          <h3 className="text-[12px] font-medium text-(--omb-ink-tertiary)">AI</h3>
          <div className="space-y-1.5">
            {MODEL_OPTIONS.map((opt) => {
              const active = bot.model === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onUpdateBot({ model: opt.id as BotModel })}
                  className={`flex w-full flex-col rounded-lg border px-3 py-2 text-start transition-colors ${
                    active
                      ? 'border-(--omb-accent) bg-(--omb-raised)'
                      : 'border-(--omb-hairline) bg-transparent hover:bg-(--omb-ink)/[0.04]'
                  }`}
                >
                  <span className="text-[13px] font-medium text-(--omb-ink)">{opt.label}</span>
                  <span className="text-[11.5px] text-(--omb-ink-tertiary)">{opt.description}</span>
                </button>
              );
            })}
          </div>

          {(isAdvanced || bot.model === 'gemini-4-hydrogen') && bot.model === 'gemini-4-hydrogen' && (
            <div className="space-y-1.5 pt-1">
              <span className="block text-[12px] font-medium text-(--omb-ink-secondary)">
                Reasoning depth
              </span>
              <div className="grid grid-cols-4 gap-1 rounded-lg border border-(--omb-hairline) bg-(--omb-inset) p-1">
                {EFFORT_OPTIONS.map((item) => {
                  const selected = bot.thinkingEffort === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onUpdateBot({ thinkingEffort: item.id as ThinkingEffort })}
                      className={`h-7 rounded-md text-[12px] font-medium transition-colors whitespace-nowrap ${
                        selected
                          ? 'bg-(--omb-card) text-(--omb-ink)'
                          : 'text-(--omb-ink-secondary) hover:text-(--omb-ink)'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[12px] font-medium text-(--omb-ink-tertiary)">Tasks</h3>
            <button
              type="button"
              onClick={onCreateThread}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-(--omb-ink-secondary) transition-colors hover:bg-(--omb-ink)/[0.06] hover:text-(--omb-ink) whitespace-nowrap shrink-0"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              <span>New task</span>
            </button>
          </div>

          <div className="space-y-1">
            {bot.threads.map((thread) => {
              const active = thread.id === bot.activeThreadId;
              return (
                <div
                  key={thread.id}
                  className={`group flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 transition-colors ${
                    active ? 'bg-(--omb-raised)' : 'hover:bg-(--omb-ink)/[0.05]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectThread(thread.id)}
                    className="min-w-0 flex-1 text-start"
                  >
                    <p className="truncate text-[13px] font-medium text-(--omb-ink)">
                      {thread.title}
                    </p>
                    <p className="text-[11.5px] text-(--omb-ink-tertiary) tabular-nums">
                      {thread.messages.length} {thread.messages.length === 1 ? 'message' : 'messages'} · {formatShortTime(thread.updatedAt)}
                    </p>
                  </button>
                  {bot.threads.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteThread(thread.id)}
                      aria-label={`Delete task ${thread.title}`}
                      className="inline-flex size-7 items-center justify-center rounded-md text-(--omb-ink-tertiary) opacity-0 transition-opacity hover:bg-(--omb-ink)/[0.06] hover:text-(--omb-danger) group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-2 border-t border-(--omb-hairline) pt-4">
          <button
            type="button"
            onClick={onClearActiveThread}
            className="flex h-8 w-full items-center justify-center rounded-lg border border-(--omb-hairline) text-[13px] font-medium text-(--omb-ink-secondary) transition-colors hover:bg-(--omb-ink)/[0.05] hover:text-(--omb-ink)"
          >
            Clear current task
          </button>
          {canDeleteBot && (
            <button
              type="button"
              onClick={onDeleteBot}
              className="flex h-8 w-full items-center justify-center rounded-lg text-[13px] font-medium text-(--omb-danger) transition-colors hover:bg-(--omb-danger)/10"
            >
              Delete bot
            </button>
          )}
        </section>
      </div>
    </aside>
  );
}
