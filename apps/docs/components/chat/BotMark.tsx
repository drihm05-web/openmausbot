'use client';

import { BOT_COLORS, type BotColor } from '@/lib/bots';

export function BotMark({
  color,
  size = 32,
  className = '',
}: {
  color: BotColor;
  size?: number;
  className?: string;
}) {
  const palette = BOT_COLORS[color] ?? BOT_COLORS.emerald;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 select-none ${className}`}
    >
      <path
        d="M8.5 7.2C8.5 4.95 10.95 3.55 12.9 4.7L33.4 16.85C35.35 18 35.35 20.8 33.4 21.95L12.9 34.1C10.95 35.25 8.5 33.85 8.5 31.6V7.2Z"
        fill={palette.fill}
      />
      <ellipse cx="17.5" cy="17.5" rx="1.6" ry="2.2" fill="#ffffff" fillOpacity="0.92" />
      <ellipse cx="22.8" cy="19.6" rx="1.45" ry="2" fill="#ffffff" fillOpacity="0.92" />
    </svg>
  );
}
