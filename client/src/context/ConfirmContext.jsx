import { createContext, useCallback, useContext, useState } from 'react';

const ConfirmContext = createContext(null);

/**
 * Promise-based confirmation dialog, used throughout the DAM UI for
 * destructive actions (delete, permanent delete, bulk delete, folder
 * deletion with contents, "asset in use" overrides).
 *
 * Usage: const confirm = useConfirm(); const ok = await confirm({ title, message, danger: true });
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setState({ ...options, resolve });
    });
  }, []);

  const handle = (result) => {
    state?.resolve(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <>
          <div className="dam-backdrop" onClick={() => handle(false)} />
          <div className="position-fixed top-50 start-50 translate-middle dam-surface p-4 shadow" style={{ zIndex: 1060, width: 420 }}>
            <h5 className="mb-2">{state.title || 'Are you sure?'}</h5>
            <p className="text-dam-secondary mb-4">{state.message}</p>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary" onClick={() => handle(false)}>
                {state.cancelLabel || 'Cancel'}
              </button>
              <button className={`btn ${state.danger ? 'btn-danger' : 'btn-dam-primary'}`} onClick={() => handle(true)}>
                {state.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
}
