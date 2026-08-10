'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Redirige a la raíz ("/") si el usuario autenticado no tiene el rol
// requerido para ver la página actual. La raíz se encarga de reenviarlo
// a SU dashboard correcto (ver src/app/page.js).
export function useRoleGuard(requiredRole) {
  const { userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && userRole && userRole !== requiredRole) {
      router.replace('/');
    }
  }, [userRole, loading, requiredRole, router]);

  return { userRole, loading, allowed: !loading && userRole === requiredRole };
}
