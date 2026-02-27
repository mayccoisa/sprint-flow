import { useFirestoreData } from './useFirestoreData';

// Re-export useLocalData as a wrapper around useFirestoreData
// This allows seamless migration without changing every component immediately
export const useLocalData = () => {
  // We simply proxy everything through to the firestore hook.
  // In a real local-first app, we might switch between local storage and firestore here.
  const firestoreData = useFirestoreData();
  return firestoreData;
};
