'use client';
import React from 'react';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import AffiliateDashboard from '@/components/dashboard/afiliador/AffiliateDashboard/AffiliateDashboard';

export default function Page() {
  const { allowed, loading } = useRoleGuard('afiliador');

  if (loading || !allowed) return null;

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Panel de Afiliación</h2>
      <AffiliateDashboard />
    </div>
  );
}
