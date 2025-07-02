import { Navigate } from 'react-router-dom';
import { ReactElement } from 'react';
import { useAuthStore } from './authStore';

interface Props {
  children: ReactElement;
}

/**
 * Thin wrapper around a Route element that redirects unauthenticated users
 * to /login while preserving the intended destination.
 */
export function ProtectedRoute({ children }: Props) {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
