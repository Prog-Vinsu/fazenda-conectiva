import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'owner' | 'manager' | 'consultant' | 'producer' | 'operator';
}

const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-earth flex items-center justify-center p-4">
    <Card className="w-full max-w-md p-8 shadow-elevated">
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-10 w-full" />
      </div>
    </Card>
  </div>
);

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user || !profile) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check role permissions
  if (requiredRole) {
    const roleHierarchy = {
      'admin': 6,
      'owner': 5,
      'manager': 4,
      'consultant': 3,
      'producer': 2,
      'operator': 1,
    };

    const userRoleLevel = roleHierarchy[profile.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="min-h-screen bg-gradient-earth flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 text-center shadow-elevated">
            <h1 className="text-2xl font-bold text-destructive mb-4">Acesso Negado</h1>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
          </Card>
        </div>
      );
    }
  }

  return <>{children}</>;
};