// Minimal OpenAI client for semantic search — plain fetch, no SDK, since we
// only need two endpoints. Models are picked for cost (see .env):
//   - embeddings: text-embedding-3-small, truncated to 512 dims (Matryoshka
//     truncation is supported by the API; ~3x less storage/compute than the
//     default 1536 for a negligible recall loss on a small catalogue)
//   - query parsing: gpt-4.1-nano — cheapest non-reasoning chat model; the
//     gpt-5 nanos bill hidden reasoning tokens on top, which costs more here
// Every function returns null when OPENAI_API_KEY isn't set so search degrades
// to keyword-only instead of erroring (same dev-fallback idea as services/sms.ts).

const BASE_URL = "https://api.openai.com/v1";
const REQUEST_TIMEOUT_MS = 8000;

export const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 512;
const QUERY_MODEL = process.env.OPENAI_QUERY_MODEL || "gpt-4.1-nano";

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI ${path} failed: ${res.status} ${detail.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

/** Embeds up to 2048 inputs in one request; result order matches input order. */
export async function createEmbeddings(inputs: string[]): Promise<number[][] | null> {
  if (!isOpenAIConfigured() || inputs.length === 0) return null;
  const data = await post<{ data: Array<{ index: number; embedding: number[] }> }>("/embeddings", {
    model: EMBEDDING_MODEL,
    input: inputs,
    dimensions: EMBEDDING_DIMENSIONS,
  });
  return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

/** Chat completion constrained to a JSON schema (OpenAI structured outputs). */
export async function chatJson<T>(
  system: string,
  user: string,
  schemaName: string,
  schema: Record<string, unknown>
): Promise<T | null> {
  if (!isOpenAIConfigured()) return null;
  const data = await post<{ choices: Array<{ message: { content: string | null } }> }>(
    "/chat/completions",
    {
      model: QUERY_MODEL,
      temperature: 0,
      max_tokens: 300,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: schemaName, strict: true, schema },
      },
    }
  );
  const content = data.choices[0]?.message.content;
  return content ? (JSON.parse(content) as T) : null;
}
