import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

export const setAtlassianCredentialsFn = httpsCallable<
  { email: string; apiToken: string; siteUrl: string },
  { ok: true; email: string; siteUrl: string }
>(functions, 'setAtlassianCredentials');

export const disconnectAtlassianFn = httpsCallable<unknown, { ok: true }>(
  functions,
  'disconnectAtlassian',
);
