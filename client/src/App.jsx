import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext.jsx';
import { ConfirmProvider } from './context/ConfirmContext.jsx';
import DamRoutes from './routes/DamRoutes.jsx';

/**
 * Standalone entry component for local development / demoing this module.
 * When integrating into a host application, you typically won't render
 * <App /> at all — instead import <DamRoutes /> (or individual pages/
 * components) directly into your existing app tree. See README.
 */
export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
          <DamRoutes />
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
