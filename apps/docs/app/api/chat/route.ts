import type { Part } from '@google/genai';
import { createGeminiClient, resolveModel, resolveThinkingLevel } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

interface IncomingAttachment {
  name: string;
  mimeType: string;
  dataUrl?: string;
  textContent?: string;
}

interface IncomingMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: IncomingAttachment[];
}

interface ChatRequestBody {
  botName?: string;
  botRole?: string;
  systemInstruction?: string;
  userName?: string;
  model?: string;
  thinkingEffort?: string;
  messages?: IncomingMessage[];
}

function buildParts(message: IncomingMessage): Part[] {
  const parts: Part[] = [];
  if (message.attachments?.length) {
    for (const attachment of message.attachments) {
      if (attachment.textContent !== undefined) {
        parts.push({
          text: `[Attached file: ${attachment.name}]\n\`\`\`\n${attachment.textContent.slice(0, 40000)}\n\`\`\``,
        });
      } else if (attachment.dataUrl) {
        const commaIndex = attachment.dataUrl.indexOf(',');
        const base64Data = commaIndex >= 0 ? attachment.dataUrl.slice(commaIndex + 1) : '';
        if (base64Data) {
          parts.push({
            inlineData: {
              mimeType: attachment.mimeType || 'image/png',
              data: base64Data,
            },
          });
        }
      }
    }
  }
  const text = message.content?.trim();
  if (text) {
    parts.push({ text });
  } else if (parts.length === 0) {
    parts.push({ text: 'Hello' });
  }
  return parts;
}

function extractErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? 'Unknown error');
  try {
    const outer = JSON.parse(raw) as { error?: { message?: string } };
    if (outer?.error?.message) {
      try {
        const inner = JSON.parse(outer.error.message) as { error?: { message?: string } };
        if (inner?.error?.message) return inner.error.message;
      } catch {
        return outer.error.message;
      }
    }
  } catch {
    // Raw message is plain text
  }
  return raw;
}

function formatGeminiError(error: unknown): { status: number; message: string } {
  const clean = extractErrorMessage(error);
  const lower = clean.toLowerCase();
  if (
    lower.includes('api_key_invalid') ||
    lower.includes('permission_denied') ||
    lower.includes('403') ||
    lower.includes('401')
  ) {
    return {
      status: 403,
      message: 'The server Gemini API key was rejected. Check GEMINI_API_KEY in your environment settings.',
    };
  }
  if (lower.includes('resource_exhausted') || lower.includes('429')) {
    return {
      status: 429,
      message: 'Gemini rate limit reached for this key. Wait a moment and try again.',
    };
  }
  if (lower.includes('unavailable') || lower.includes('high demand') || lower.includes('503')) {
    return {
      status: 503,
      message: 'The model is temporarily busy right now. Wait a moment and try again.',
    };
  }
  if (lower.includes('not_found') || lower.includes('404')) {
    return {
      status: 404,
      message: 'The selected Gemini model could not be reached. Switch models or try again.',
    };
  }
  return {
    status: 500,
    message: clean || 'Could not reach the model. Check your connection and try again.',
  };
}

export async function POST(request: Request) {
  const ai = createGeminiClient();
  if (!ai) {
    return Response.json(
      {
        error:
          'Gemini API key is not configured on the server. Set GEMINI_API_KEY in your environment to chat with bots.',
      },
      { status: 503 },
    );
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return Response.json({ error: 'Invalid request payload.' }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return Response.json({ error: 'Send a message before starting a response.' }, { status: 400 });
  }

  const model = resolveModel(body.model);
  const botName = body.botName?.trim() || 'MausBot';
  const botRole = body.botRole?.trim() || 'Personal AI teammate';
  const customInstructions = body.systemInstruction?.trim() || '';
  const userName = body.userName?.trim();

  const systemParts = [
    `You are ${botName}, a calm, capable AI teammate in OpenMausBot (${botRole}).`,
    userName ? `You are speaking with ${userName}.` : '',
    'Reply clearly and concisely using clean Markdown when structure helps. Never invent tool runs, files, or background actions you did not actually perform.',
    customInstructions ? `Bot instructions:\n${customInstructions}` : '',
  ].filter(Boolean);

  const contents = messages.map((msg) => ({
    role: msg.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: buildParts(msg),
  }));

  const config: {
    systemInstruction: string;
    thinkingConfig?: { thinkingLevel: ReturnType<typeof resolveThinkingLevel> };
  } = {
    systemInstruction: systemParts.join('\n\n'),
  };

  if (model === 'gemini-4-hydrogen') {
    config.thinkingConfig = {
      thinkingLevel: resolveThinkingLevel(body.thinkingEffort),
    };
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      controller.enqueue(encoder.encode(': connected\n\n'));

      const streamWithModel = async (targetModel: typeof model) => {
        const targetConfig: {
          systemInstruction: string;
          thinkingConfig?: { thinkingLevel: ReturnType<typeof resolveThinkingLevel> };
        } = {
          systemInstruction: config.systemInstruction,
        };
        if (targetModel === 'gemini-4-hydrogen') {
          targetConfig.thinkingConfig = config.thinkingConfig;
        }

        const abortController = new AbortController();
        const timeoutMs = targetModel === 'gemini-4-hydrogen' ? 12000 : 25000;
        const timer = setTimeout(() => abortController.abort(), timeoutMs);

        try {
          const responseStream = await ai.models.generateContentStream({
            model: targetModel,
            contents,
            config: {
              ...targetConfig,
              abortSignal: abortController.signal,
            },
          });

          let hasText = false;
          for await (const chunk of responseStream) {
            if (!hasText) clearTimeout(timer);
            const text = chunk.text;
            if (text) {
              hasText = true;
              send({ text });
            }
          }
          clearTimeout(timer);
          return hasText;
        } catch (err) {
          clearTimeout(timer);
          throw err;
        }
      };

      try {
        const produced = await streamWithModel(model);
        if (!produced && model === 'gemini-4-hydrogen') {
          await streamWithModel('gemini-3.1-flash-lite');
        }
        send({ done: true });
      } catch (error) {
        const formatted = formatGeminiError(error);
        if (
          model === 'gemini-4-hydrogen' &&
          (formatted.status === 503 ||
            (error instanceof Error && error.name === 'AbortError'))
        ) {
          try {
            await streamWithModel('gemini-3.1-flash-lite');
            send({ done: true });
            return;
          } catch (fallbackError) {
            const fallbackFormatted = formatGeminiError(fallbackError);
            send({ error: fallbackFormatted.message, status: fallbackFormatted.status });
            return;
          }
        }
        send({ error: formatted.message, status: formatted.status });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
