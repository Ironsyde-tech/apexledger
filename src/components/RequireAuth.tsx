import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const RequireAuth = ({
  children,
  requireAdmin = false,
}: {
  children: JSX.Element;
  requireAdmin?: boolean;
}) => {
  const { user, loading, roleLoading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading || (requireAdmin && roleLoading)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};
