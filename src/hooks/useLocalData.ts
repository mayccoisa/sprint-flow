import { useFirestoreData } from './useFirestoreData';

// Re-export useLocalData as a wrapper around useFirestoreData
// This allows seamless migration without changing every component immediately
export const useLocalData = () => {
  return useFirestoreData();
};

