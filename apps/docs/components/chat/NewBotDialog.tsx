'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import {
  BOT_COLORS,
  MODEL_OPTIONS,
  type BotColor,
  type BotModel,
} from '@/lib/bots';
import { BotMark } from './BotMark';

interface NewBotDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (input: {
    name: string;
    role: string;
    color: BotColor;
    model: BotModel;
    systemInstruction: string;
  }) => void;
}

const colorKeys = Object.keys(BOT_COLORS) as BotColor[];

export function NewBotDialog({ open, onClose, onCreate }: NewBotDialogProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [color, setColor] = useState<BotColor>('teal');
  const [model, setModel] = useState<BotModel>('gemini-3.1-flash-lite');
  const [instruction, setInstruction] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onCreate({
      name: trimmedName,
      role: role.trim() || 'Custom teammate',
      color,
      model,
      systemInstruction:
        instruction.trim() ||
        `You are ${trimmedName}, a helpful, calm, and practical AI teammate.`,
    });
    setName('');
    setRole('');
    setInstruction('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-bot-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-(--omb-hairline) bg-(--omb-panel) p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2.5">
            <BotMark color={color} size={24} />
            <h2 id="new-bot-title" className="text-[17px] font-semibold text-(--omb-ink)">
              New bot
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex size-7 items-center justify-center rounded-full text-(--omb-ink-secondary) hover:bg-(--omb-ink)/[0.06] hover:text-(--omb-ink)"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="new-bot-name" className="block text-[12px] font-medium text-(--omb-ink-secondary)">
              Name
            </label>
            <input
              id="new-bot-name"
              type="text"
              autoFocus
              required
              dir="auto"
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Scout, Ledger, Editor"
              className="h-9 w-full rounded-lg border border-(--omb-hairline) bg-(--omb-inset) px-3 text-[13px] text-(--omb-ink) placeholder:text-(--omb-ink-tertiary) outline-none focus:border-(--omb-accent)"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="new-bot-role" className="block text-[12px] font-medium text-(--omb-ink-secondary)">
              Role
            </label>
            <input
              id="new-bot-role"
              type="text"
              dir="auto"
              maxLength={64}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="What this bot helps with"
              className="h-9 w-full rounded-lg border border-(--omb-hairline) bg-(--omb-inset) px-3 text-[13px] text-(--omb-ink) placeholder:text-(--omb-ink-tertiary) outline-none focus:border-(--omb-accent)"
            />
          </div>

          <div className="space-y-1.5">
            <span className="block text-[12px] font-medium text-(--omb-ink-secondary)">Color</span>
            <div className="flex items-center gap-2.5">
              {colorKeys.map((key) => {
                const selected = color === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setColor(key)}
                    aria-label={BOT_COLORS[key].label}
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

          <div className="space-y-1.5">
            <span className="block text-[12px] font-medium text-(--omb-ink-secondary)">AI</span>
            <div className="grid grid-cols-2 gap-2">
              {MODEL_OPTIONS.map((opt) => {
                const selected = model === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setModel(opt.id)}
                    className={`rounded-lg border px-3 py-2 text-start transition-colors ${
                      selected
                        ? 'border-(--omb-accent) bg-(--omb-raised)'
                        : 'border-(--omb-hairline) hover:bg-(--omb-ink)/[0.04]'
                    }`}
                  >
                    <span className="block text-[12.5px] font-medium text-(--omb-ink)">
                      {opt.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="new-bot-instructions"
              className="block text-[12px] font-medium text-(--omb-ink-secondary)"
            >
              Instructions
            </label>
            <textarea
              id="new-bot-instructions"
              rows={3}
              dir="auto"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Optional guidance for tone, format, or focus."
              className="w-full resize-y rounded-lg border border-(--omb-hairline) bg-(--omb-inset) px-3 py-2 text-[13px] text-(--omb-ink) placeholder:text-(--omb-ink-tertiary) outline-none focus:border-(--omb-accent)"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-full px-4 text-[13px] font-medium text-(--omb-ink-secondary) transition-colors hover:bg-(--omb-ink)/[0.06] hover:text-(--omb-ink) whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="h-9 rounded-full bg-(--omb-ink) px-4 text-[13px] font-medium text-(--omb-app) transition-opacity hover:opacity-90 disabled:opacity-40 whitespace-nowrap"
            >
              Create bot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
