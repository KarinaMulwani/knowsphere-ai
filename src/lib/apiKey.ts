'use client';

const STORAGE_KEY = 'knowsphere_nvidia_api_key';

let cachedServerKey = '';

export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local && local.trim()) return local.trim();
  } catch {}
  return cachedServerKey;
}

export function setStoredApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
      cachedServerKey = trimmed;
    } else {
      localStorage.removeItem(STORAGE_KEY);
      cachedServerKey = '';
    }
    window.dispatchEvent(new Event('knowsphere_key_updated'));
  } catch {
    // ignore
  }
}

export function clearStoredApiKey(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    cachedServerKey = '';
    window.dispatchEvent(new Event('knowsphere_key_updated'));
  } catch {
    // ignore
  }
}

export function hasStoredApiKey(): boolean {
  return !!getStoredApiKey();
}

/**
 * Initializes and ensures the default NVIDIA API Key is stored and active
 */
export async function initDefaultApiKey(): Promise<string> {
  if (typeof window === 'undefined') return '';

  const existing = getStoredApiKey();
  if (existing) return existing;

  try {
    const res = await fetch('/api/settings/save-key');
    if (res.ok) {
      const data = await res.json();
      if (data.apiKey && typeof data.apiKey === 'string') {
        const key = data.apiKey.trim();
        if (key) {
          cachedServerKey = key;
          localStorage.setItem(STORAGE_KEY, key);
          window.dispatchEvent(new Event('knowsphere_key_updated'));
          return key;
        }
      }
    }
  } catch {}

  return '';
}

// Auto-run on client mount
if (typeof window !== 'undefined') {
  initDefaultApiKey().catch(() => {});
}
