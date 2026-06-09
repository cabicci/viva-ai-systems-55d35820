import { z } from "zod";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICallOptions {
  model: string;
  messages: AIMessage[];
  responseFormat?: { type: "json_object" };
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface AICallResult {
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
  };
}

const OPENAI_MODELS = new Set([
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4",
  "gpt-4-turbo",
  "gpt-3.5-turbo",
  "o1",
  "o1-mini",
  "o3",
  "o3-mini",
]);

function isOpenAIModel(model: string): boolean {
  const base = model.replace(/^openai\//, "");
  return model.startsWith("openai/") || OPENAI_MODELS.has(base);
}

export async function callAI(options: AICallOptions): Promise<AICallResult> {
  const {
    model,
    messages,
    responseFormat,
    temperature,
    maxTokens,
    timeoutMs = 30_000,
  } = options;

  if (isOpenAIModel(model)) {
    return callOpenAI({
      model: model.replace(/^openai\//, ""),
      messages,
      responseFormat,
      temperature,
      maxTokens,
      timeoutMs,
    });
  }

  return callLovableGateway({
    model,
    messages,
    responseFormat,
    temperature,
    maxTokens,
    timeoutMs,
  });
}

async function callOpenAI(options: AICallOptions): Promise<AICallResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const body: Record<string, unknown> = {
    model: options.model,
    messages: options.messages,
  };
  if (options.responseFormat) {
    body.response_format = options.responseFormat;
  }
  if (options.temperature !== undefined) {
    body.temperature = options.temperature;
  }
  if (options.maxTokens !== undefined) {
    body.max_tokens = options.maxTokens;
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(options.timeoutMs ?? 30_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[callOpenAI] error ${res.status}:`, text);
    throw new Error(`OpenAI error (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenAI returned empty content");
  }

  return {
    content,
    usage: {
      promptTokens: json?.usage?.prompt_tokens,
      completionTokens: json?.usage?.completion_tokens,
    },
  };
}

async function callLovableGateway(
  options: AICallOptions,
): Promise<AICallResult> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  const body: Record<string, unknown> = {
    model: options.model,
    messages: options.messages,
  };
  if (options.responseFormat) {
    body.response_format = options.responseFormat;
  }
  if (options.temperature !== undefined) {
    body.temperature = options.temperature;
  }
  if (options.maxTokens !== undefined) {
    body.max_tokens = options.maxTokens;
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(options.timeoutMs ?? 30_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[callLovableGateway] error ${res.status}:`, text);
    throw new Error(`AI Gateway error (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("AI Gateway returned empty content");
  }

  return {
    content,
    usage: {
      promptTokens: json?.usage?.prompt_tokens,
      completionTokens: json?.usage?.completion_tokens,
    },
  };
}
