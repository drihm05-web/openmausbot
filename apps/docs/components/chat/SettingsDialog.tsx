'use client';

import { useEffect } from 'react';
import { useAppTheme, type AppThemeMode } from '@/lib/use-app-theme';
import { Download, RotateCcw, X } from 'lucide-react';
import type { WorkspaceSettings } from '@/lib/bots';

interface SettingsDialogProps {
  open: boolean;
  settings: WorkspaceSettings;
  onClose: () => void;
  onUpdateSettings: (patch: Partial<WorkspaceSettings>) => void;
  onExportWorkspace: () => void;
  onResetWorkspace: () => void;
}

export function SettingsDialog({
  open,
  settings,
  onClose,
  onUpdateSettings,
  onExportWorkspace,
  onResetWorkspace,
}: SettingsDialogProps) {
  const { theme, setTheme } = useAppTheme();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-(--omb-hairline) bg-(--omb-panel) p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-4">
          <h2 id="settings-dialog-title" className="text-[17px] font-semibold text-(--omb-ink)">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="inline-flex size-7 items-center justify-center rounded-full text-(--omb-ink-secondary) hover:bg-(--omb-ink)/[0.06] hover:text-(--omb-ink)"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="user-name-input" className="block text-[12px] font-medium text-(--omb-ink-secondary)">
              Your name
            </label>
            <input
              id="user-name-input"
              type="text"
              dir="auto"
              maxLength={40}
              value={settings.userName}
              onChange={(e) => onUpdateSettings({ userName: e.target.value })}
              placeholder="How bots address you"
              className="h-9 w-full rounded-lg border border-(--omb-hairline) bg-(--omb-inset) px-3 text-[13px] text-(--omb-ink) outline-none focus:border-(--omb-accent)"
            />
          </div>

          <div className="space-y-1.5">
            <span className="block text-[12px] font-medium text-(--omb-ink-secondary)">Theme</span>
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-(--omb-hairline) bg-(--omb-inset) p-1">
              {[
                { id: 'dark' as AppThemeMode, label: 'Midnight' },
                { id: 'light' as AppThemeMode, label: 'Daylight' },
                { id: 'system' as AppThemeMode, label: 'System' },
              ].map((opt) => {
                const active = (theme ?? 'dark') === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setTheme(opt.id)}
                    className={`h-7 rounded-md text-[12.5px] font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-(--omb-card) text-(--omb-ink)'
                        : 'text-(--omb-ink-secondary) hover:text-(--omb-ink)'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="block text-[12px] font-medium text-(--omb-ink-secondary)">
              Interface mode
            </span>
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-(--omb-hairline) bg-(--omb-inset) p-1">
              {[
                { id: 'simple' as const, label: 'Simple' },
                { id: 'advanced' as const, label: 'Advanced' },
              ].map((opt) => {
                const active = settings.interfaceMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onUpdateSettings({ interfaceMode: opt.id })}
                    className={`h-7 rounded-md text-[12.5px] font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-(--omb-card) text-(--omb-ink)'
                        : 'text-(--omb-ink-secondary) hover:text-(--omb-ink)'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 border-t border-(--omb-hairline) pt-4">
            <button
              type="button"
              onClick={onExportWorkspace}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-(--omb-hairline) text-[13px] font-medium text-(--omb-ink) transition-colors hover:bg-(--omb-ink)/[0.05]"
            >
              <Download className="size-3.5" aria-hidden="true" />
              <span>Export conversations</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onResetWorkspace();
                onClose();
              }}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-lg text-[13px] font-medium text-(--omb-danger) transition-colors hover:bg-(--omb-danger)/10"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              <span>Reset workspace to defaults</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
