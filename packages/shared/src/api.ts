// Thin fetch wrapper – used by web app
import type { SiteCred, ListRes, ContentRes, SaveReq, RefactorReq, RefactorRes } from './schemas';

const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const api = {
  connect:   (body: SiteCred)            => req('/connect',  'POST', body),
  list:      (root = '/')                => req<ListRes>(`/files?root=${encodeURIComponent(root)}`),
  get:       (path: string)              => req<ContentRes>(`/content?path=${encodeURIComponent(path)}`),
  save:      (body: SaveReq)             => req('/content',  'PUT',  body),
  refactor:  (body: RefactorReq)         => req<RefactorRes>('/ai/refactor', 'POST', body),
};

async function req<T = unknown>(url: string, method: string = 'GET', body?: any): Promise<T> {
  const res = await fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
} 