const STORAGE_KEY = 'sprintflow_public_calendars';

interface ShareEntry {
  workspaceId: string;
  token: string;
  isPublic: boolean;
}

type Store = Record<string, ShareEntry>; // keyed by workspaceId

function readStore(): Store {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Store;
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function generateToken(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function getShareInfo(workspaceId: string): ShareEntry | null {
  return readStore()[workspaceId] || null;
}

export function enablePublicCalendar(workspaceId: string): ShareEntry {
  const store = readStore();
  const existing = store[workspaceId];
  const entry: ShareEntry = {
    workspaceId,
    token: existing?.token || generateToken(),
    isPublic: true,
  };
  store[workspaceId] = entry;
  writeStore(store);
  return entry;
}

export function disablePublicCalendar(workspaceId: string): void {
  const store = readStore();
  if (store[workspaceId]) {
    store[workspaceId] = { ...store[workspaceId], isPublic: false };
    writeStore(store);
  }
}

export function resolveShareToken(token: string): ShareEntry | null {
  const store = readStore();
  for (const key in store) {
    if (store[key].token === token) return store[key];
  }
  return null;
}

export function buildShareUrl(token: string): string {
  return `${window.location.origin}/public/calendar/${token}`;
}
