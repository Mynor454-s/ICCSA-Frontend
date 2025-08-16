import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import type { ReactElement } from "react";

export default function PrivateRoute({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
