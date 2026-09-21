const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/+$/, "");

export const TOKEN_KEY = "gokaido_admin_token";
export const REFRESH_KEY = "gokaido_admin_refresh_token";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, (data as { error?: string }).error ?? "Something went wrong");
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export async function uploadImage(
  file: File,
  purpose: string
): Promise<{ publicUrl: string; key: string }> {
  const { uploadUrl, publicUrl, key } = await request<{
    uploadUrl: string;
    publicUrl: string;
    key: string;
  }>("/api/uploads/presign", {
    method: "POST",
    body: JSON.stringify({ purpose, fileName: file.name, contentType: file.type }),
  });

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!putRes.ok) {
    throw new ApiError(putRes.status, "Failed to upload image");
  }

  return { publicUrl, key };
}

function authHeaders(): Headers {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

export async function uploadProductsBulk<T>(file: File): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/products/bulk`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, (data as { error?: string }).error ?? "Bulk upload failed");
  }
  return data as T;
}

export async function downloadBulkTemplate(): Promise<Blob> {
  const res = await fetch(`${API_URL}/api/products/bulk-template`, { headers: authHeaders() });
  if (!res.ok) {
    throw new ApiError(res.status, "Failed to download template");
  }
  return res.blob();
}
