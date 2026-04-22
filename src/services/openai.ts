export const DEFAULT_OPENAI_MODEL = 'gpt-5-mini';
const OPENAI_TIMEOUT_MS = 30000;

interface CallOpenAIOptions {
  apiKey: string;
  prompt: string;
  systemMessage?: string;
  model?: string;
}

function extractResponseText(data: any): string {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  if (Array.isArray(data?.output)) {
    const text = data.output
      .flatMap((item: any) => (Array.isArray(item?.content) ? item.content : []))
      .map((content: any) => {
        if (typeof content?.text === 'string') {
          return content.text;
        }

        return '';
      })
      .filter(Boolean)
      .join('\n\n')
      .trim();

    if (text) {
      return text;
    }
  }

  const legacyContent = data?.choices?.[0]?.message?.content;
  if (typeof legacyContent === 'string') {
    return legacyContent.trim();
  }

  if (Array.isArray(legacyContent)) {
    return legacyContent
      .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
      .filter(Boolean)
      .join('\n\n')
      .trim();
  }

  return '';
}

function safeParseJson(rawBody: string): any {
  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return { rawBody };
  }
}

export async function callOpenAI({
  apiKey,
  prompt,
  systemMessage = 'You turn source material into clean RemNote-ready markdown. Return markdown only with no preamble.',
  model = DEFAULT_OPENAI_MODEL,
}: CallOpenAIOptions): Promise<string> {
  if (!apiKey) {
    throw new Error('OpenAI API key is missing. Please set it in the plugin settings.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        instructions: systemMessage,
        input: prompt,
      }),
      signal: controller.signal,
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error(`OpenAI request timed out after ${OPENAI_TIMEOUT_MS / 1000} seconds.`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const rawBody = await response.text();
  const data = safeParseJson(rawBody);

  if (!response.ok) {
    throw new Error(data?.error?.message || `OpenAI request failed with status ${response.status}.`);
  }

  const outputText = extractResponseText(data);
  if (!outputText) {
    throw new Error('OpenAI returned an empty response.');
  }

  return outputText;
}

export const AI_ACTIONS = {
  summarize: (content: string) =>
    `Summarize these RemNote notes into concise markdown bullets. Keep only the key ideas, definitions, and examples. Do not add commentary.\n\n${content}`,
  rewrite: (content: string) =>
    `Rewrite these RemNote notes for clarity and flow. Preserve meaning, improve wording, and return clean markdown only.\n\n${content}`,
  expand: (content: string) =>
    `Expand these RemNote notes with missing detail, context, and examples. Return structured markdown with bullets and sub-bullets only.\n\n${content}`,
  clean: (content: string) =>
    `Clean and reorganize these RemNote notes. Fix grammar, remove clutter, and return tidy markdown suitable for direct import into notes.\n\n${content}`,
  generate: (topic: string) =>
    `Generate study notes about "${topic}" as RemNote-friendly markdown. Use a short title, bullets, and sub-bullets only. No preamble.\n\nTopic: ${topic}`,
};
