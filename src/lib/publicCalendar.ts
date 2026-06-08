import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COLLECTION = 'public_calendars';
const LEGACY_STORAGE_KEY = 'sprintflow_public_calendars';

export interface ShareEntry {
  workspaceId: string;
  token: string;
  isPublic: boolean;
}

/**
 * Share entries live in Firestore at `public_calendars/{token}` so the link
 * is resolvable from any device (not just the browser that generated it).
 * A small per-workspace pointer in localStorage tracks the current token so
 * we don't generate a new one on every "enable" click — but it's a cache,
 * not the source of truth.
 */

function readLegacyStore(): Record<string, ShareEntry> {
  try {
    return JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeLegacyStore(store: Record<string, ShareEntry>) {
  localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(store));
}

function generateToken(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Owner-only: returns the cached pointer to this workspace's share token, if any. */
export function getShareInfo(workspaceId: string): ShareEntry | null {
  return readLegacyStore()[workspaceId] || null;
}

export async function enablePublicCalendar(workspaceId: string): Promise<ShareEntry> {
  const cached = readLegacyStore()[workspaceId];
  const token = cached?.token || generateToken();
  const entry: ShareEntry = { workspaceId, token, isPublic: true };

  await setDoc(doc(db, COLLECTION, token), entry);
  // Flag on the workspace doc lets Firestore rules gate anonymous reads of
  // sprints/tasks/releases/etc. without doing a per-doc lookup against
  // public_calendars (which rules cannot query).
  await updateDoc(doc(db, 'workspaces', workspaceId), { public_calendar_active: true });

  const store = readLegacyStore();
  store[workspaceId] = entry;
  writeLegacyStore(store);
  return entry;
}

export async function disablePublicCalendar(workspaceId: string): Promise<void> {
  const cached = readLegacyStore()[workspaceId];

  if (cached) {
    try {
      await updateDoc(doc(db, COLLECTION, cached.token), { isPublic: false });
    } catch {
      // Doc may not exist yet (link was never persisted to Firestore). Fall through.
    }
  }

  try {
    await updateDoc(doc(db, 'workspaces', workspaceId), { public_calendar_active: false });
  } catch {
    // Workspace may be missing or already flipped.
  }

  if (cached) {
    const store = readLegacyStore();
    store[workspaceId] = { ...cached, isPublic: false };
    writeLegacyStore(store);
  }
}

export async function resolveShareToken(token: string): Promise<ShareEntry | null> {
  const snap = await getDoc(doc(db, COLLECTION, token));
  if (!snap.exists()) return null;
  return snap.data() as ShareEntry;
}

export function buildShareUrl(token: string): string {
  return `${window.location.origin}/public/calendar/${token}`;
}
