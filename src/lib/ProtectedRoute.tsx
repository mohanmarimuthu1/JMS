import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function ProtectedRoute() {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted">Loading…</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}
