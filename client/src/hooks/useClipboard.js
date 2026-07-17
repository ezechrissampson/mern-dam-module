import { useCallback } from 'react';
import { useToast } from '../context/ToastContext.jsx';

export function useClipboard() {
  const toast = useToast();
  return useCallback(
    async (text, successMessage = 'Copied to clipboard.') => {
      try {
        await navigator.clipboard.writeText(text);
        toast.success(successMessage);
      } catch {
        toast.error('Could not copy to clipboard.');
      }
    },
    [toast]
  );
}

export default useClipboard;
