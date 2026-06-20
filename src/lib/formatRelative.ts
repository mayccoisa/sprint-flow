import type { Timestamp } from 'firebase/firestore';

export function formatRelative(ts: Timestamp | Date | null | undefined): string {
  if (!ts) return '';
  const date = ts instanceof Date ? ts : ts.toDate();
  const diffMs = Date.now() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'agora há pouco';
  const min = Math.floor(sec / 60);
  if (min < 60) return `há ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `há ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `há ${day} d`;
  return date.toLocaleDateString('pt-BR');
}
