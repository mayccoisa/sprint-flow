import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../admin';
import { decrypt, encrypt } from './crypto';

export interface AtlassianConnection {
  email: string;
  apiToken: string;
  siteUrl: string;
}

const connRef = (uid: string) => db.doc(`users/${uid}/integrations/atlassian`);

function normalizeSiteUrl(raw: string): string {
  let s = raw.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//.test(s)) s = `https://${s}`;
  return s;
}

export async function readConnection(uid: string): Promise<AtlassianConnection | null> {
  const snap = await connRef(uid).get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  if (!data.apiTokenEnc || !data.email || !data.siteUrl) return null;
  return {
    email: data.email as string,
    apiToken: decrypt(data.apiTokenEnc as string),
    siteUrl: data.siteUrl as string,
  };
}

export async function writeConnection(uid: string, c: AtlassianConnection): Promise<void> {
  const siteUrl = normalizeSiteUrl(c.siteUrl);
  await connRef(uid).set(
    {
      email: c.email,
      apiTokenEnc: encrypt(c.apiToken),
      siteUrl,
      connectedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  await db.doc(`users/${uid}/settings/atlassian`).set(
    {
      connected: true,
      email: c.email,
      siteUrl,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export async function deleteConnection(uid: string): Promise<void> {
  const batch = db.batch();
  batch.delete(connRef(uid));
  batch.set(
    db.doc(`users/${uid}/settings/atlassian`),
    { connected: false, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  await batch.commit();
}
