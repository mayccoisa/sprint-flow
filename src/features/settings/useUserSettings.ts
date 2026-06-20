import { useEffect, useState } from 'react';
import { doc, onSnapshot, type Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export interface AtlassianSettings {
  connected: boolean;
  email?: string;
  siteUrl?: string;
  updatedAt?: Timestamp | null;
}

export function useUserSettings() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [atlassian, setAtlassian] = useState<AtlassianSettings>({ connected: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setAtlassian({ connected: false });
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      doc(db, `users/${uid}/settings/atlassian`),
      (snap) => {
        if (!snap.exists()) {
          setAtlassian({ connected: false });
        } else {
          const data = snap.data();
          setAtlassian({
            connected: Boolean(data.connected),
            email: data.email as string | undefined,
            siteUrl: data.siteUrl as string | undefined,
            updatedAt: (data.updatedAt as Timestamp | null) ?? null,
          });
        }
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, [uid]);

  return { atlassian, loading };
}
