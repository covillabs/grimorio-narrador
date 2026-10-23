import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  allowedRoles?: Array<"narrator" | "player">;
  children?: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, profile, isNarrator, isPlayer, loading } = useAuth();
  const location = useLocation();

  // 1. Tela de Carregamento Graciosa
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-3">
        <div className="animate-pulse drop-shadow-[0_0_25px_rgba(220,20,60,0.8)]">
          <img src="/image/icon_2.png" alt="Carregando..." className="w-16 h-16 opacity-90" />
        </div>
        <span className="font-serif text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
          Consultando o Livro de Nod...
        </span>
      </div>
    );
  }

  // 2. Não autenticado -> Redireciona para login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Validação de Papel (Role)
  if (allowedRoles && allowedRoles.length > 0) {
    const currentRole = profile?.role || (isNarrator ? "narrator" : "player");
    const hasRole = allowedRoles.includes(currentRole as "narrator" | "player");

    if (!hasRole) {
      // Redireciona para o ecossistema correto do papel do usuário
      if (isNarrator) {
        return <Navigate to="/" replace />;
      }
      return <Navigate to="/player" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
}
