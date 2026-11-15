import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getToken } from '../lib/authApi';

// Shows its children only when the user is logged in (has a token);
// otherwise sends them to /login. This is for user experience only:
// the backend must still check the JWT on every protected request.
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
