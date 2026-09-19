// Server-side fetch helper for the storefront's own API. Uses Next's fetch cache
// (ISR-style): responses are reused for `revalidate` seconds and can be purged early by tag.

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    path: string,
  ) {
    super(`API ${status} for ${path}`);
  }
}

export async function apiGet<T>(path: string, opts: { revalidate: number; tags?: string[] }): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, { next: { revalidate: opts.revalidate, tags: opts.tags } });
  if (!res.ok) throw new ApiError(res.status, path);
  return (await res.json()) as T;
}
