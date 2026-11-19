'use client';

import { useState, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { Check, Copy } from 'lucide-react';

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-(--omb-hairline) bg-(--omb-inset)">
      <div className="flex items-center justify-between border-b border-(--omb-hairline) px-3 py-1.5 text-[11px] text-(--omb-ink-tertiary)">
        <span className="font-mono">{language || 'text'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-(--omb-ink-secondary) transition-colors hover:bg-(--omb-ink)/[0.06] hover:text-(--omb-ink)"
          aria-label="Copy code"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[12.5px] leading-relaxed text-(--omb-ink)">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const markdownComponents: Components = {
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-3 last:mb-0 leading-[1.6]">{children}</p>
  ),
  h1: ({ children }: { children?: ReactNode }) => (
    <h3 className="mt-4 mb-2 text-[15px] font-semibold tracking-tight text-(--omb-ink) first:mt-0">
      {children}
    </h3>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h3 className="mt-4 mb-2 text-[15px] font-semibold tracking-tight text-(--omb-ink) first:mt-0">
      {children}
    </h3>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h4 className="mt-3 mb-1.5 text-[14px] font-semibold text-(--omb-ink) first:mt-0">
      {children}
    </h4>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="mb-3 list-disc space-y-1.5 ps-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="mb-3 list-decimal space-y-1.5 ps-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li className="leading-[1.55]">{children}</li>
  ),
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="my-3 rounded-lg border border-(--omb-hairline) bg-(--omb-inset)/70 px-3.5 py-2.5 text-(--omb-ink-secondary)">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-(--omb-accent) underline decoration-(--omb-accent)/40 underline-offset-2 hover:decoration-(--omb-accent)"
    >
      {children}
    </a>
  ),
  code: ({
    className,
    children,
  }: {
    className?: string;
    children?: ReactNode;
  }) => {
    const raw = String(children ?? '').replace(/\n$/, '');
    const match = /language-([^\s]+)/.exec(className ?? '');
    const isBlock = Boolean(match) || raw.includes('\n');
    if (isBlock) {
      return <CodeBlock language={match?.[1] ?? ''} code={raw} />;
    }
    return (
      <code className="rounded-md border border-(--omb-hairline) bg-(--omb-inset) px-1.5 py-0.5 font-mono text-[12.5px] text-(--omb-ink)">
        {children}
      </code>
    );
  },
  pre: ({ children }: { children?: ReactNode }) => <>{children}</>,
  hr: () => <hr className="my-4 border-(--omb-hairline)" />,
};

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div dir="auto" className="text-[14.5px] text-(--omb-ink) break-words">
      <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  );
}
